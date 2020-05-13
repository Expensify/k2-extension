'use strict';

const $ = require('jquery');
const _ = require('underscore');
const moment = require('moment');
const prefs = require('./prefs');
const GistDB = require('./gistdb');
const baseUrl = 'https://api.github.com';

/**
 * Returns the current github user
 *
 * @returns {String}
 */
function getCurrentUser() {
  return $('.Header-link .avatar').attr('alt').replace('@', '');
}

function parse_link_header(header) {
  if (header.length === 0) {
    throw new Error('input must not be of zero length');
  }

  // Split parts by comma
  const parts = header.split(',');
  const links = {};
  // Parse each part into a named link
  for (let i = 0; i < parts.length; i++) {
    const section = parts[i].split(';');
    if (section.length !== 2) {
      throw new Error('section could not be split on \';\'');
    }
    const url = section[0].replace(/<(.*)>/, '$1').trim();
    const name = section[1].replace(/rel="(.*)"/, '$1').trim();
    links[name] = url;
  }
  return links;
}

/**
 * Return all of our milestone data
 *
 * @param {String}   view
 * @param {Function} cb
 */
function getMilestones(view, cb) {
  let query = '?per_page=300&q=';
  let url;
  let result = [];

  // Make sure we are checking the hidden settings of the proper view
  const currentView = view || 'all';
  // Mark our milestones if they are hidden or not
  GistDB.get(`${currentView}.milestones`, (err, gistDataMilestones) => {
    if (err) {
      return;
    }

    function handleData(data, status, xhr) {
      // Combine our data with some of our gist data
      const enhancedData = _(data).each(item => {
        const gistDataMilestone = _(gistDataMilestones).findWhere({id: item.id});
        item.hidden = gistDataMilestone && gistDataMilestone.hidden;
        item.percentComplete = item.open_issues || item.closed_issues ? Math.round((item.closed_issues / (item.open_issues + item.closed_issues)) * 100) : 0;
      });
      result = result.concat(enhancedData);

      // If we have a next link, then we do some recursive pagination
      const responseHeaderLink = xhr.getResponseHeader('Link');
      if (responseHeaderLink) {
        const links = parse_link_header(responseHeaderLink);
        if (links.next) {
          /* eslint-disable no-use-before-define */
          makeRequest(links.next);
          /* eslint-enable no-use-before-define */
          return;
        }
      }

      // Now put everything in the same order as our gist data
      const orderedResult = [];
      const newUnorderedMilestones = [];
      _(result).each(m => {
        const index = _(gistDataMilestones).findIndex({id: m.id});
        if (index < 0) {
          newUnorderedMilestones.push(m);
        } else {
          orderedResult[index] = m;
        }
      });

      result = newUnorderedMilestones.concat(orderedResult);

      cb(null, _(result).compact());
    }

    function makeRequest(overwriteUrl) {
      // Get the open milestones
      query += '+state:open';

      url = baseUrl + '/repos/expensify/expensify/milestones' + query;
      prefs.get('ghToken', function(ghToken) {
        $.ajax({
          url: overwriteUrl || url,
          headers: {
            Authorization: 'Bearer ' + ghToken
          }
        })
          .done(handleData)
          .fail(cb);
      });
    }

    makeRequest();
  });
}

/**
 * This is the beginning of a graphQL API to get all milestones, their issues, and comments
 * It currently only handles the first 100 open milestones and the first 100 open issues because I'm not sure
 * how to implement nested pagination
 *
 * Note: I stopped working on this because I also need to get the labels of the issues, and that is too many
 * nodes for the API to handle :( Which means this would need to be split into multiple requests, which is essentially
 * what I was already doing in the first place.
 *
 * @param {String} view
 * @param {Function} cb
 */
function getMilestonesGraphQL(view, cb) {
  let result = [];
  const url = 'https://api.github.com/graphql';

  function handleGraphQLData(data) {
    // Only get our open milestones
    result = result.concat(data.data.organization.repository.milestones.nodes);

    // Clean up the data and put it in a better format
    const finalResult = _(result).reduce((memo, milestone) => {
      const totalOpen = milestone.openIssues.totalCount;
      const totalClosed = milestone.closedIssues.totalCount;
      const percentComplete = (totalOpen + totalClosed) / totalOpen;

      const newMilestone = {
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        open_issues: totalOpen,
        closed_issues: totalClosed,
        issues: _(milestone.issues.nodes).reduce((memo2, issue) => {
          const newIssue = {
            id: issue.id,
            title: issue.title,
            updatedAt: issue.updatedAt

          };
          memo2.push(newIssue);
          return memo2;
        }, []),
        percentComplete
      };

      memo.push(newMilestone);
      return memo;
    }, []);

    cb(null, finalResult);
  }

  function recursiveMemberQuery() {
    prefs.get('ghToken', function(ghToken) {
      $.ajax({
        url: url,
        contentType: 'application/json',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + ghToken
        },
        data: JSON.stringify({
          query: `{
            organization(login: "expensify") {
              repository(name: "expensify") {
                milestones(states: OPEN, first: 100) {
                  nodes {
                    id
                    title
                    description
                    openIssues: issues(first: 0, states: OPEN) {
                      totalCount
                    }
                    closedIssues: issues(first: 0, states: CLOSED) {
                      totalCount
                    }
                    issues(first: 100, labels: ["WhatsNext"], states: OPEN) {
                      totalCount
                      nodes {
                        id
                        title
                        updatedAt
                        comments(last: 1) {
                          nodes {
                            author {
                              login
                            }
                            bodyText
                            createdAt
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }`
        })
      })
        .done(handleGraphQLData)
        .fail(function(err) {
          cb(err);
        });
    });
  }

  recursiveMemberQuery();
}

/**
 * Get all the pull requests where the current user is either assigned
 * or the author
 *
 * @author Tim Golen <tim@golen.net>
 *
 * @date 2015-06-07
 * @private
 *
 * @param {string} type 'assignee' or 'author'
 * @param {Function} cb [description]
 * @param {Boolean} getReviews wether or not to make extra API requests to get the review data
 */
function getPullsByType(type, cb, getReviews) {
  let query = '?q=';
  let url;

  // Get the PRs assigned to me
  query += '+state:open';
  query += '+type:pr';
  // query += '+user:expensify';
  // query += '+repo:expensify/expensify';
  query += '+' + type + ':' + getCurrentUser();

  query += '&sort=updated';

  url = baseUrl + '/search/issues' + query;

  prefs.get('ghToken', function(ghToken) {
    $.ajax({
      url: url,
      headers: {
        Authorization: 'Bearer ' + ghToken
      }
    })
      .done(function(data) {
        var done;
        if (!data.items || !data.items.length) {
          return cb(null, []);
        }

        // Filter out closed issues, as the search query does not do this correctly,
        // even though we are specifying `state:open`
        data.items = data.items.filter(item => item.state === 'open');

        done = _.after(data.items.length, function() {
          cb(null, data.items);
        });

        // Get the detailed PR info for each PR
        _.each(data.items, function(item) {
          var repoArray = item.repository_url.split('/');
          var owner = repoArray[repoArray.length - 2];
          var repo = repoArray[repoArray.length - 1];
          var url2 = baseUrl + '/repos/' + owner + '/' + repo + '/pulls/' + item.number;

          item.prType = type;

          $.ajax({
            url: url2,
            headers: {
              Authorization: 'Bearer ' + ghToken
            }
          }).done(function(data2) {
            item.pr = data2;

            // The provided statuses URL *should* be the one we use, but it is
            // broken for private repos. Worse, it is broken inconsistently - for
            // example, it works for Server-Expensify but not Web-Expensify or
            // Web-Secure. After back-and-forth with GitHub support, they provided a
            // developer preview "List check runs" endpoint, that seems to get the job
            // done. So use that for now until they fix the statuses endpoint.
            // -Rafe 2020-05-13
            const statusesUrl = baseUrl + '/repos/' + owner + '/' + repo + '/commits/' + data2.head.sha + '/check-runs';

            // Now get the PR status
            $.ajax({
              url: statusesUrl,
              headers: {
                Authorization: 'Bearer ' + ghToken,

                // FIXME: Remove this once we go back to the original statuses
                // URL or check-runs is out of preview
                Accept: 'application/vnd.github.antiope-preview+json'
              }
            }).done(function(data3) {
              // Check-runs endpoint uses .conclusion instead of .state - map it
              // back to .state in order not to change the view in hopes that we'll be
              // able to go back to the statuses endpoint once GitHub fixes it.
              item.pr.status = (data3.check_runs || []).map(status => Object.assign({state: status.conclusion}, status));

              // Stop here if we aren't getting reviewers
              if (!getReviews) {
                return done();
              }

              // Now get the PR reviews
              $.ajax({
                url: baseUrl + '/repos/' + owner + '/' + repo + '/pulls/' + item.number + '/reviews',
                headers: {
                  Authorization: 'Bearer ' + ghToken,
                  Accept: 'application/vnd.github.black-cat-preview+json'
                }
              }).done(function(data4) {
                item.reviews = data4;
                const reviewsByUser = _(data4).filter(r => r.user.login === getCurrentUser());
                const approved = _(reviewsByUser).findWhere({state: 'APPROVED'});
                const commented = _(reviewsByUser).findWhere({state: 'COMMENTED'});
                const reviewDismissed = _(reviewsByUser).findWhere({state: 'DISMISSED'});
                const changesRequested = _(reviewsByUser).findWhere({state: 'CHANGES_REQUESTED'});
                item.userIsFinishedReviewing = !reviewDismissed && ((commented && !changesRequested) || approved);
                done();
              });
            });
          });
        });
      })
      .fail(function(err) {
        cb(err);
      });
  });
}

/**
 * Get all issues with a certain label
 *
 * @author Tim Golen <tim@golen.net>
 *
 * @date 2015-06-07
 * @private
 *
 * @param {string} label
 * @param {string} assignee
 * @param {Function} cb
 * @param {Function} retryCb called each time we attempting to retry the API call
 */
function getIssuesByLabel(label, assignee, cb, retryCb) {
  let filterLabels = ['hourly', 'daily', 'weekly', 'monthly'];
  let query = '?per_page=300&q=';
  let result = [];
  let url;

  // Get the PRs assigned to me
  query += '+state:open';
  query += '+is:issue';
  query += '+repo:expensify/expensify';

  if (assignee === 'none') {
    query += '+no:assignee';
  } else if (assignee) {
    query += '+assignee:' + assignee;
  }

  // We need to exclude our other filter labels if we are searching
  // for no priority
  if (label === 'none') {
    for (let i = filterLabels.length - 1; i >= 0; i--) {
      query += '+-label:' + filterLabels[i];
    }
  } else if (label) {
    query += '+label:' + label;
  }

  url = baseUrl + '/search/issues' + query;

  function handleData(data, status, xhr) {
    // Set the type of the item to be the label we are looking for
    _(data.items).map(function(item) {
      item.type = label;
    });

    result = result.concat(data.items);

    // If we have a next link, then we do some recursive pagination
    const responseHeaderLink = xhr.getResponseHeader('Link');
    if (responseHeaderLink) {
      const links = parse_link_header(responseHeaderLink);
      if (links.next) {
        /* eslint-disable no-use-before-define */
        makeRequest(links.next);
        /* eslint-enable no-use-before-define */
        return;
      }
    }

    cb(null, result);
  }

  function makeRequest(overwriteUrl) {
    prefs.get('ghToken', function(ghToken) {
      $.ajax({
        url: overwriteUrl || url,
        headers: {
          Authorization: 'Bearer ' + ghToken
        }
      })
        .done(handleData)
        .fail(function (xhr, err, msg) {
          if (xhr.status === 403) {
            const resetTime = new Date(xhr.getResponseHeader('X-RateLimit-Reset') * 1000);
            const resetInterval = setInterval(() => {
              if (retryCb) {
                retryCb(resetTime - new Date());
              }
              if (new Date() > resetTime) {
                clearInterval(resetInterval);
                makeRequest(overwriteUrl);
              }
            }, 1000);
            return;
          }
          cb(xhr, err, msg);
        });
    });
  }

  makeRequest();
}

/**
 * Get all open issue for a particular area
 * @private
 *
 * @param {string} area
 * @param {Function} cb
 * @param {Function} retryCb called each time we attempting to retry the API call
 */
function getIssuesByArea(area, cb, retryCb) {
  let query = '?per_page=100&q=';
  let url;
  let result = [];

  function handleData(data, status, xhr) {
    // Set the type of the item to be the label we are looking for
    const sortedData = _.chain(data.items)
      .each(i => {
        i.type = area;

        const age = moment().diff(i.created_at, 'days');
        const isImprovement = _(i.labels).findWhere({name: 'Improvement'});
        const isTask = _(i.labels).findWhere({name: 'Task'});
        const isFeature = _(i.labels).findWhere({name: 'NewFeature'});
        const isHourly = _(i.labels).findWhere({name: 'Hourly'});
        const isDaily = _(i.labels).findWhere({name: 'Daily'});
        const isWeekly = _(i.labels).findWhere({name: 'Weekly'});
        const isMonthly = _(i.labels).findWhere({name: 'Monthly'});
        const isFirstPick = _(i.labels).findWhere({name: 'FirstPick'});
        const isWhatsNext = _(i.labels).findWhere({name: 'WhatsNext'});
        let score = 0;

        // Sort by K2
        score += isHourly ? 10000000 : 0;
        score += isDaily ? 1000000 : 0;
        score += isWeekly ? 100000 : 0;
        score += isMonthly ? 10000 : 0;

        // WhatsNext issues should be at the top of each KSV2 group
        score += isWhatsNext ? 9000 : 0;

        // First picks go above improvements
        score += isFirstPick ? 1050 : 0;

        // All improvements are at the top, followed by tasks, followed by features
        score += isImprovement ? 1000 : 0;
        score += isTask ? 500 : 0;
        score += isFeature ? 500 : 0;

        // Sort by age too
        score += age / 100;

        i.score = score;
        i.age = age;
      })
      .sortBy('score')
      .value();
    result = result.concat(sortedData);

    // If we have a next link, then we do some recursive pagination
    const responseHeaderLink = xhr.getResponseHeader('Link');
    if (responseHeaderLink) {
      const links = parse_link_header(responseHeaderLink);
      if (links.next) {
        /* eslint-disable no-use-before-define */
        makeRequest(links.next);
        /* eslint-enable no-use-before-define */
        return;
      }
    }

    cb(null, _(result).sortBy('score').reverse());
  }

  function makeRequest(overwriteUrl) {
    // Get the PRs assigned to me
    query += '+state:open';
    query += '+is:issue';
    // query += '+user:expensify';
    query += '+label:' + area;
    query += '+no:assignee';
    query += '+repo:expensify/expensify';
    query += '&page=1';

    url = baseUrl + '/search/issues' + query;
    prefs.get('ghToken', function(ghToken) {
      $.ajax({
        url: overwriteUrl || url,
        headers: {
          Authorization: 'Bearer ' + ghToken
        }
      })
        .done(handleData)
        .fail(function (xhr, err, msg) {
          if (xhr.status === 403) {
            const resetTime = new Date(xhr.getResponseHeader('X-RateLimit-Reset') * 1000);
            const resetInterval = setInterval(() => {
              retryCb(resetTime - new Date());
              if (new Date() > resetTime) {
                clearInterval(resetInterval);
                makeRequest(overwriteUrl);
              }
            }, 1000);
            return;
          }
          cb(xhr, err, msg);
        });
    });
  }

  makeRequest();
}

/**
 * Add labels to a github issue
 * @param {String[]} labels
 * @param {Function} cb
 */
function addLabels(labels, cb) {
  let repo = $('.pagehead h1 strong a').text();
  let owner = $('.pagehead h1 .author a').text();
  let issueNum = $('.gh-header-number').first().text().replace('#', '');
  let url = `${baseUrl}/repos/${repo}/${owner}/issues/${issueNum}/labels`;
  prefs.get('ghToken', function(ghToken) {
    $.ajax({
      url: url,
      method: 'post',
      data: JSON.stringify(labels),
      headers: {
        Authorization: 'Bearer ' + ghToken
      }
    })
      .done(function(data) {
        if (cb) {
          cb(null, data);
        }
      })
      .fail(function(err) {
        if (cb) {
          cb(err);
        }
      });
  });
}

/**
 * Remove a label from a github issue
 * @param {String[]} label
 * @param {Function} cb
 * @param {Number} [issueNumber] an issue number to use if we don't want to default to the currently open issue
 * @param {String} [repoName] a repository to use if we don't want to use the one on the current page
 */
function removeLabel(label, cb, issueNumber, repoName) {
  let repo = repoName || $('.pagehead h1 strong a').text();
  let owner = $('.pagehead h1 .author a').text();
  let issueNum = issueNumber || $('.gh-header-number').first().text().replace('#', '');
  let url = `${baseUrl}/repos/${repo}/${owner}/issues/${issueNum}/labels/${label}`;
  prefs.get('ghToken', function(ghToken) {
    $.ajax({
      url: url,
      method: 'delete',
      headers: {
        Authorization: 'Bearer ' + ghToken
      }
    })
      .done(function(data) {
        if (cb) {
          cb(null, data);
        }
      })
      .fail(function(err) {
        if (cb) {
          cb(err);
        }
      });
  });
}

/**
 * Gets all issues assigned to someone
 *
 * @param {Function} cb
 * @param {Function} retryCb
 */
function getAllAssigned(cb, retryCb) {
  getIssuesByLabel(null, getCurrentUser(), cb, retryCb);
}

/**
 * Gets all issues not assigned to anyone
 *
 * @param {Function} cb
 * @param {Function} retryCb
 */
function getAllUnassigned(cb, retryCb) {
  getIssuesByLabel(null, 'none', cb, retryCb);
}

/**
 * Gets the issues for web that are open and should be worked on
 *
 * @param {Function} cb
 * @param {Function} retryCb called each time we attempting to retry the API call
 */
function getEngineeringIssues(cb, retryCb) {
  getIssuesByArea('engineering', cb, retryCb);
}

/**
 * Gets the issues for integrations that are open and should be worked on
 *
 * @param {Function} cb
 * @param {Function} retryCb called each time we attempting to retry the API call
 */
function getIntegrationsIssues(cb, retryCb) {
  getIssuesByArea('"integration+server"', cb, retryCb);
}

/**
 * Get all the pull requests assigned to the current user
 *
 * @author Tim Golen <tim@golen.net>
 *
 * @date 2015-06-07
 *
 * @param {Function} cb [description]
 */
function getPullsAssigned(cb) {
  getPullsByType('assignee', cb, true);
}

/**
 * Get all the pull requests the user is currently reviewing
 *
 * @author Tim Golen <tim@golen.net>
 *
 * @date 2015-06-07
 *
 * @param {Function} cb [description]
 */
function getPullsReviewing(cb) {
  let result = [];
  const done = _.after(2, () => {
    cb(null, _(result).chain()
      .filter(pr => {
        // If there is no assignee, ensure reviewers still see the PR so it does not get lost
        if (!pr.assignee) {
          return true;
        }
        return pr.assignee.login !== getCurrentUser();
      })
      .sortBy('userIsFinishedReviewing')
      .value().reverse());
  });

  getPullsByType('review-requested', function (err, data) {
    if (err) {
      console.error(err);
      done();
      return;
    }
    result = result.concat(data);
    done();
  }, true);

  getPullsByType('reviewed-by', function (err, data) {
    if (err) {
      console.error(err);
      done();
      return;
    }
    result = result.concat(data);
    done();
  }, true);
}

/**
 * Get all the pull requests assigned to the current user
 *
 * @author Tim Golen <tim@golen.net>
 *
 * @date 2015-06-07
 *
 * @param {Function} cb
 */
function getPullsAuthored(cb) {
  getPullsByType('author', cb);
}

/**
 * Get all the improvements that are not assigned and are dailys
 *
 * @author Tim Golen <tim@golen.net>
 *
 * @date 2015-06-07
 *
 * @param {Function} cb
 */
function getDailyImprovements(cb) {
  let query = '?q=';
  let url;

  // Get the PRs assigned to me
  query += '+state:open';
  query += '+is:issue';
  query += '+repo:expensify/expensify';
  query += '+no:assignee';
  query += '+label:improvement';
  query += '+label:daily';

  url = baseUrl + '/search/issues' + query;
  prefs.get('ghToken', function(ghToken) {
    $.ajax({
      url: url,
      headers: {
        Authorization: 'Bearer ' + ghToken
      }
    })
      .done(function(data) {
        cb(null, data.items);
      })
      .fail(function(err) {
        console.error(err);
        cb(err);
      });
  });
}

/**
 * Get all the issues for a milestone
 *
 * @param {String} type
 * @param {Function} cb
 */
function getIssuesForMilestones(type, cb) {
  let query = '?per_page=300&q=';
  let result = [];
  let url;

  // Always start with all issues that have the whatsnext label
  query += '+label:whatsnext';
  query += '+is:issue';
  query += '+repo:expensify/expensify';

  switch (type) {
  case 'mine':
    // Get the PRs assigned to me
    query += `+assignee:${getCurrentUser()}`;
    break;

  case 'unassigned':
    // Get issues with no one assigned to them
    query += '+no:assignee';
    break;

  case 'all':
  case 'whatsnext':
  default:
    break;
  }

  url = baseUrl + '/search/issues' + query;

  function handleData(data, status, xhr) {
    result = result.concat(data.items);

    // If we have a next link, then we do some recursive pagination
    const responseHeaderLink = xhr.getResponseHeader('Link');
    if (responseHeaderLink) {
      const links = parse_link_header(responseHeaderLink);
      if (links.next) {
        /* eslint-disable no-use-before-define */
        makeRequest(links.next);
        /* eslint-enable no-use-before-define */
        return;
      }
    }

    cb(null, result);
  }

  function makeRequest(overwriteUrl) {
    prefs.get('ghToken', function(ghToken) {
      $.ajax({
        url: overwriteUrl || url,
        headers: {
          Authorization: 'Bearer ' + ghToken
        }
      })
        .done(handleData)
        .fail(cb);
    });
  }

  makeRequest();
}

/**
 * Get all the comments for an issue
 *
 * @param {String} issue
 * @param {Function} cb
 */
function getCommentsForIssue(issue, cb) {
  const url = `${baseUrl}/repos/expensify/expensify/issues/${issue}/comments?per_page=300`;
  prefs.get('ghToken', function(ghToken) {
    $.ajax({
      url: url,
      headers: {
        Authorization: 'Bearer ' + ghToken,
        Accept: 'application/vnd.github.VERSION.html+json'
      }
    })
      .done(function(data) {
        cb(null, data);
      })
      .fail(function(err) {
        console.error(err);
        cb(err);
      });
  });
}

/**
 * Post an issue on a comment
 *
 * @param {Number} issue
 * @param {String} comment
 * @param {Function} cb
 */
function postIssueComment(issue, comment, cb) {
  const url = `${baseUrl}/repos/expensify/expensify/issues/${issue}/comments`;
  prefs.get('ghToken', function(ghToken) {
    $.ajax({
      url: url,
      type: 'POST',
      headers: {
        Authorization: 'Bearer ' + ghToken
      },
      data: JSON.stringify({
        body: comment
      })
    })
      .done(function(data) {
        cb(null, data);
      })
      .fail(function(err) {
        console.error(err);
        cb(err);
      });
  });
}

/**
 * Gets all the names of our organization members
 * @param {Function} cb
 */
function getOrganizationMembers(cb) {
  let result = [];
  const url = 'https://api.github.com/graphql';

  function handleMemberGraphQLData(data) {
    // Only get our open milestones
    result = result.concat(data.data.organization.membersWithRole.nodes);

    // If we have a next page, then let's fetch it
    if (data.data.organization.membersWithRole.pageInfo.hasNextPage) {
      /* eslint-disable no-use-before-define */
      recursiveMemberQuery(data.data.organization.membersWithRole.pageInfo.endCursor);
      /* eslint-enable no-use-before-define */
      return;
    }

    cb(null, result);
  }

  function recursiveMemberQuery(cursor) {
    const after = cursor ? `after:"${cursor}"` : '';
    prefs.get('ghToken', function(ghToken) {
      $.ajax({
        url: url,
        contentType: 'application/json',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + ghToken
        },
        data: JSON.stringify({
          query: `{
            organization(login: "expensify") {
              membersWithRole(first:100 ${after}) {
                pageInfo {
                  endCursor
                  hasNextPage
                }
                nodes {
                  name
                  login
                }
              }
            }
          }`
        })
      })
        .done(handleMemberGraphQLData)
        .fail(function(err) {
          cb(err);
        });
    });
  }

  recursiveMemberQuery();
}

exports.getEngineeringIssues = getEngineeringIssues;
exports.getIntegrationsIssues = getIntegrationsIssues;
exports.getAllAssigned = getAllAssigned;
exports.getAllUnassigned = getAllUnassigned;
exports.getPullsAssigned = getPullsAssigned;
exports.getPullsReviewing = getPullsReviewing;
exports.getPullsAuthored = getPullsAuthored;
exports.getDailyImprovements = getDailyImprovements;
exports.addLabels = addLabels;
exports.removeLabel = removeLabel;
exports.getMilestones = getMilestones;
exports.getMilestonesGraphQL = getMilestonesGraphQL;
exports.getIssuesForMilestones = getIssuesForMilestones;
exports.getCommentsForIssue = getCommentsForIssue;
exports.postIusseComment = postIssueComment;
exports.getCurrentUser = getCurrentUser;
exports.getOrganizationMembers = getOrganizationMembers;
