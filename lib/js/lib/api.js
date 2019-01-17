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
  return $('.user-nav .avatar').attr('alt').replace('@', '');
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
 * @param {Function} cb
 */
function getMilestones(cb) {
  let query = '?per_page=300&q=';
  let url;
  let result = [];

  function handleData(data, status, xhr) {
    result = result.concat(data);

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
    // Get the PRs assigned to me
    query += '+state:open';

    url = baseUrl + '/repos/expensify/expensify/milestones' + query;
    prefs.get('ghPassword', function(ghPassword) {
      $.ajax({
        url: overwriteUrl || url,
        headers: {
          Authorization: 'Basic ' + btoa(`${getCurrentUser()}:${ghPassword}`)
        }
      })
        .done(handleData)
        .fail(cb);
    });
  }

  makeRequest();
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

  prefs.get('ghPassword', function(ghPassword) {
    $.ajax({
      url: url,
      headers: {
        Authorization: 'Basic ' + btoa(`${getCurrentUser()}:${ghPassword}`)
      }
    })
      .done(function(data) {
        var done;
        if (!data.items || !data.items.length) {
          return cb(null, []);
        }


        done = _.after(data.items.length, function() {
          cb(null, data.items);
        });

        // Get the detailed PR info for each PR
        _.each(data.items, function(item) {
          var repoArray = item.repository_url.split('/');
          var repo = repoArray[repoArray.length - 2];
          var owner = repoArray[repoArray.length - 1];
          var url2 = baseUrl + '/repos/' + repo + '/' + owner + '/pulls/' + item.number;

          item.prType = type;

          $.ajax({
            url: url2,
            headers: {
              Authorization: 'Basic ' + btoa(`${getCurrentUser()}:${ghPassword}`)
            }
          }).done(function(data2) {
            item.pr = data2;

            // Now get the PR status
            $.ajax({
              url: data2._links.statuses.href,
              headers: {
                Authorization: 'Basic ' + btoa(`${getCurrentUser()}:${ghPassword}`)
              }
            }).done(function(data3) {
              item.pr.status = data3;

              // Stop here if we aren't getting reviewers
              if (!getReviews) {
                return done();
              }

              // Now get the PR reviewers
              $.ajax({
                url: baseUrl + '/repos/' + repo + '/' + owner + '/pulls/' + item.number + '/requested_reviewers',
                headers: {
                  Authorization: 'Basic ' + btoa(`${getCurrentUser()}:${ghPassword}`),
                  Accept: 'application/vnd.github.black-cat-preview+json'
                }
              }).done(function(data4) {
                item.reviewers = data4;

                // Now get the PR reviews
                $.ajax({
                  url: baseUrl + '/repos/' + repo + '/' + owner + '/pulls/' + item.number + '/reviews',
                  headers: {
                    Authorization: 'Basic ' + btoa(`${getCurrentUser()}:${ghPassword}`),
                    Accept: 'application/vnd.github.black-cat-preview+json'
                  }
                }).done(function(data5) {
                  item.reviews = data5;
                  const reviewsByUser = _(data5).filter(r => r.user.login === getCurrentUser());
                  const approved = _(reviewsByUser).findWhere({state: 'APPROVED'});
                  const commented = _(reviewsByUser).findWhere({state: 'COMMENTED'});
                  const changesRequested = _(reviewsByUser).findWhere({state: 'CHANGES_REQUESTED'});
                  item.userIsFinishedReviewing = (commented && !changesRequested) || approved;
                  done();
                });
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
 * @param {Function} cb [description]
 */
function getIssuesByLabel(label, cb) {
  let filterLabels = ['hourly', 'daily', 'weekly', 'monthly'];
  let query = '?per_page=300&q=';
  let result = [];
  let url;

  // Get the PRs assigned to me
  query += '+state:open';
  query += '+is:issue';
  // query += '+user:expensify';
  query += '+repo:expensify/expensify';
  query += '+assignee:' + getCurrentUser();

  // We need to exclude our other filter labels if we are searching
  // for no priority
  if (label === 'none') {
    for (let i = filterLabels.length - 1; i >= 0; i--) {
      query += '+-label:' + filterLabels[i];
    }
  } else {
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
    prefs.get('ghPassword', function(ghPassword) {
      $.ajax({
        url: overwriteUrl || url,
        headers: {
          Authorization: 'Basic ' + btoa(`${getCurrentUser()}:${ghPassword}`)
        }
      })
        .done(handleData)
        .fail(cb);
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
  let query = '?per_page=300&q=';
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
        let score = 0;

        // Sort by K2
        score += isHourly ? 10000000 : 0;
        score += isDaily ? 1000000 : 0;
        score += isWeekly ? 100000 : 0;
        score += isMonthly ? 10000 : 0;

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
    prefs.get('ghPassword', function(ghPassword) {
      $.ajax({
        url: overwriteUrl || url,
        headers: {
          Authorization: 'Basic ' + btoa(`${getCurrentUser()}:${ghPassword}`)
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
  prefs.get('ghPassword', function(ghPassword) {
    $.ajax({
      url: url,
      method: 'post',
      data: JSON.stringify(labels),
      headers: {
        Authorization: 'Basic ' + btoa(`${getCurrentUser()}:${ghPassword}`)
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
 */
function removeLabel(label, cb) {
  let repo = $('.pagehead h1 strong a').text();
  let owner = $('.pagehead h1 .author a').text();
  let issueNum = $('.gh-header-number').first().text().replace('#', '');
  let url = `${baseUrl}/repos/${repo}/${owner}/issues/${issueNum}/labels/${label}`;
  prefs.get('ghPassword', function(ghPassword) {
    $.ajax({
      url: url,
      method: 'delete',
      headers: {
        Authorization: 'Basic ' + btoa(`${getCurrentUser()}:${ghPassword}`)
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
 * Gets the issues that are labeled with hourly
 *
 * @param {Function} cb
 */
function getHourlyIssues(cb) {
  getIssuesByLabel('hourly', cb);
}

/**
 * Gets the issues that are labeled with daily
 *
 * @author Tim Golen <tim@golen.net>
 *
 * @date 2015-06-05
 *
 * @param {Function} cb
 */
function getDailyIssues(cb) {
  getIssuesByLabel('daily', cb);
}

/**
 * Gets the issues that are labeled with daily
 *
 * @author Tim Golen <tim@golen.net>
 *
 * @date 2015-06-05
 *
 * @param {Function} cb
 */
function getWeeklyIssues(cb) {
  getIssuesByLabel('weekly', cb);
}

/**
 * Gets the issues that are labeled with daily
 *
 * @author Tim Golen <tim@golen.net>
 *
 * @date 2015-06-05
 *
 * @param {Function} cb
 */
function getMonthlyIssues(cb) {
  getIssuesByLabel('monthly', cb);
}

/**
 * Gets the issues that are labeled with daily
 *
 * @author Tim Golen <tim@golen.net>
 *
 * @date 2015-06-05
 *
 * @param {Function} cb
 */
function getNoneIssues(cb) {
  getIssuesByLabel('none', cb);
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
 * Gets the issues for scrapers that are open and should be worked on
 *
 * @param {Function} cb
 * @param {Function} retryCb called each time we attempting to retry the API call
 */
function getScrapersIssues(cb, retryCb) {
  getIssuesByArea('scraper', cb, retryCb);
}

/**
 * Gets the issues for area51 that are open and should be worked on
 *
 * @param {Function} cb
 * @param {Function} retryCb called each time we attempting to retry the API call
 */
function getArea51Issues(cb, retryCb) {
  getIssuesByArea('area-51', cb, retryCb);
}

/**
 * Gets the issues for mobile that are open and should be worked on
 *
 * @param {Function} cb
 * @param {Function} retryCb called each time we attempting to retry the API call
 */
function getMobileIssues(cb, retryCb) {
  getIssuesByArea('mobile', cb, retryCb);
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
  getPullsByType('assignee', cb);
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
  prefs.get('ghPassword', function(ghPassword) {
    $.ajax({
      url: url,
      headers: {
        Authorization: 'Basic ' + btoa(`${getCurrentUser()}:${ghPassword}`)
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
 * @param {Boolean} getOnlyMine
 * @param {String} milestone
 * @param {Function} cb
 */
function getIssuesForMilestone(getOnlyMine, milestone, cb) {
  let query = '?q=';
  let url;

  // Get the PRs assigned to me
  query += '+state:open';
  query += '+is:issue';
  query += '+repo:expensify/expensify';
  query += `+milestone:"${milestone}"`;

  if (getOnlyMine) {
    query += `+assignee:${getCurrentUser()}`;
  }

  url = baseUrl + '/search/issues' + query;
  prefs.get('ghPassword', function(ghPassword) {
    $.ajax({
      url: url,
      headers: {
        Authorization: 'Basic ' + btoa(`${getCurrentUser()}:${ghPassword}`)
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
 * Get all the comments for an issue
 *
 * @param {String} issue
 * @param {Function} cb
 */
function getCommentsForIssue(issue, cb) {
  const url = `${baseUrl}/repos/expensify/expensify/issues/${issue}/comments?per_page=300`;
  prefs.get('ghPassword', function(ghPassword) {
    $.ajax({
      url: url,
      headers: {
        Authorization: 'Basic ' + btoa(`${getCurrentUser()}:${ghPassword}`)
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
  prefs.get('ghPassword', function(ghPassword) {
    $.ajax({
      url: url,
      type: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${getCurrentUser()}:${ghPassword}`)
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

exports.getEngineeringIssues = getEngineeringIssues;
exports.getIntegrationsIssues = getIntegrationsIssues;
exports.getScrapersIssues = getScrapersIssues;
exports.getArea51Issues = getArea51Issues;
exports.getMobileIssues = getMobileIssues;
exports.getHourlyIssues = getHourlyIssues;
exports.getDailyIssues = getDailyIssues;
exports.getWeeklyIssues = getWeeklyIssues;
exports.getMonthlyIssues = getMonthlyIssues;
exports.getNoneIssues = getNoneIssues;
exports.getPullsAssigned = getPullsAssigned;
exports.getPullsReviewing = getPullsReviewing;
exports.getPullsAuthored = getPullsAuthored;
exports.getDailyImprovements = getDailyImprovements;
exports.addLabels = addLabels;
exports.removeLabel = removeLabel;
exports.getMilestones = getMilestones;
exports.getIssuesForMilestone = getIssuesForMilestone;
exports.getCommentsForIssue = getCommentsForIssue;
exports.postIusseComment = postIssueComment;
exports.getCurrentUser = getCurrentUser;
