#1.3.2
- Updated the octokit client to fix throttling

#1.3.1
- Made new filter work in dark mode

#1.3.0
- Add filters for held and under review issues in the assigned issues sections

#1.2.15
- Added issue owner functionality

#1.2.14
- Bumped package versions to fix security vulnerabilities.

#1.2.13
- Improve the regex that fetches the repository name, owner and issue number from the current URL work for pull requests as well

#1.2.12
- Fetch repository name, owner and issue number from URL instead of relying on the DOM

#1.2.11
- Updated getCurrentUser() to retrieve the user's Github username from the meta tag instead of the header avatar

#1.2.10
- Added button to the issue sidebar for adding the product manager application review comment
- Added a confirmation button for sending participation comments
- Updated UI to hide / show participation comments

#1.2.9
- Updated logic for WAQ groupings

#1.2.8
- Fixed duplicate item count in WAQ section.
- Bumped package versions to fix security vulnerabilities.

#1.2.7
- Added a count of items for each header.

#1.2.6
- Adding repo name prefix to PRs.

#1.2.5
- Fixing error when trying to update Labels. GitHub now uses spaces on the components we used to get the repository name

#1.2.4
- Updated the instructions to open the K2 dashboard in the App repo
- Added link to the PAT instructions in the FormPassword form

#1.2.3
- Removed demolition shortcut

#1.2.2
- Updated to show WAQ issues assigned to the current user by default
- Added a checkbox in the WAQ panel to toggle between displaying all WAQ issues and those assigned to the current user

#1.2.1
- Fixed unique key prop warning in ListItemIssue component
- Removed unused token and file to make k2 public

#1.2.0
- Reworked the dashboard to list WAQ issues

#1.1.14
- Added react-native-onyx repo to issues query

#1.1.13
* Change title of no priority panel from "None" to "No Priority"
* Hide "No Priority" panel if empty
* Move "Your Pull Requests" section above "Daily Improvements"
* Hide "Your Pull Requests" section if empty

#1.1.12
- Move the list of assigned reviews to the top of the dashboard
- Fix bugs with PR mergeability and test status so the correct value is displayed in the expected color

#1.1.11
- Added a method for quickly copy/pasting the reviewer checklist into an Expensify/App PR comment

#1.1.10
- Added button to the issue sidebar for adding the project manager application review comment

#1.1.9
- Added button to the issue sidebar for adding the interview attended comment

#1.1.8
- ContributorPlus are now assigned via `External` label, not `Exported`
- Add `.nvmrc` to specify which Node version is needed to install packages in this repo

#1.1.7
- Display created PRs with no assignees in 'Your Pull Requests'

#1.1.6
- Grey out issues with 'Help wanted' label

#1.1.5
- Added emojis to Add Reviewed Doc Comment Button

#1.1.4
- Same as 1.1.3 but need a new version to upload to mozilla

#1.1.3
- Fix bug that caused blank screen

#1.1.2
- Added a button to the issue sidebar for adding the reviewed design doc comment

#1.1.1
- Fixed a null reference error when no preferences exist
- Fix the assigned issue list to stop showing filtered issues

#1.1.0
- Removed Alt library
- Refactored the last things to use Onyx and Octokit
- Refactored and simplified several of the list and form components

#1.0.1
- Fix a bug with incorrect scope for fetching new data

#1.0.0
- Update to current version of React
- Update to use ES6 modules
- Introduce the first concept of using Onyx

#0.10.10
- Make the right sidebar on issues sticky

#0.10.9
- Add Expensify/Expensify Guides repo issues to dashboard

#0.10.8
- Show tasks from Expensify/Insiders repo

#0.10.7
- Fix sidebar buttons that broke after GitHub changed their markup

#0.10.6
- Fix margin and padding on the dashboard and access token form.

#0.10.5
- Remove the What's Next functionality

#0.10.4
- Fix "Submit" button type so personal access token form submits correctly.

#0.10.3
- Add little "E" next to issues with "External" label (and added to legend)
- Changed "Help Wanted" to "Contributor Assigned" in legend
- E/App issues will no longer show purple when they have the "Help Wanted" label, instead they will be purple when they have the "Exported" label and **DON'T have** the "Help Wanted" label.

#0.10.2
- Fixed retry so that list of PRs to review do not vanish after a lapse in internet connectivity.

#0.10.1
- Build system was updated with webpack and the old system of gulp was removed

#0.9.34
- Add support for `currentUser` URL parameter to view k2 as another user

#0.9.33
- Fix retry so that the list of issues isn't cleared every time we make a request, it is just updated when we get new results

#0.9.32
- Add "draft" label to such PRs in "Your Pull Requests"

#0.9.31
- Add "Help Wanted" to legend

#0.9.30
- Update botify's token for WN dashboard

#0.9.29
- Update to have planning issues show red when overdue

#0.9.28
- Update to filter out non-Expensify repos in "Your Pull Requests"

#0.9.27
- Update to show `VendorTasks` repo issues

#0.9.26
- Update `Expensify.cash` repo to `App` in api to display e.cash issues

#0.9.25
- Color issues with "Help Wanted" label purple, since we're waiting on action by a contributor to move forward

#0.9.24
- Fix backwards owner/repo so that labels work on e.cash issues

#0.9.23
- Fix a regex match so that the extension works on expensify.cash issues

#0.9.22
- Fix label buttons since GitHub changed their markup

#0.9.21
 - Grey issues with "Take Home Challenge Sent" label since there is nothing actionable by the engineer

#0.9.20
 - Surface `Expensify/Expensify.cash` issues in the dashboard

#0.9.19
 - Fix buttons that broke after GitHub changed their markup

#0.9.18
 - Remove the Scraper label

#0.9.17
 - Update the `New Issue` button to bring to the template selection window

#0.9.16
 - Update dashboard styling of issues with the label `Waiting for customer`

#0.9.15
- Fix K2/WN button links by hard-coding `/Expensify/Expensify` url instead of relying on GitHub markup
- Finish deprecating `ghPassword` variable after switching to token auth

#0.9.14
- Fix "Reviewing" button, which broke due to GitHub page layout changes
- Change text of "Reviewing" button to make it more clear

#0.9.13
- On the K2 tab, gray out issues when title starts with `[HOLD `
- Held issues still display as red if they are labeled "Overdue"

#0.9.12
- Restore missing tabs after GitHub UI update
- Restore label colors on K2 page after GitHub UI update

#0.9.11
- Fix bug displaying Travis status for builds that are not yet finished
- Better formatting for Travis status that contains underscores
- Make sure we don't display blank Travis status

#0.9.10
- Switch from basic auth to token auth (and ease in the change so folks don't have to re-auth)
- Restore functionality that displays Travis status next to pull requests

# 0.9.9
- GitHub search API sometimes returns closed PRs even with `state:open`, so filter those out
- Show mergeability status next to PRs
- Clicking on K2/WN tab should work from any other tab, not just repo home

#0.9.8
- Fixes Github API rate limiting issue by delaying the pollIntervals for each element in the DOM
- Removes unnecessary API call for getting reviewers
- Fixes tab navigation CSS issue caused by Github class changes
- Adds more detail to react-id keys for list elements

#0.9.7
- Fixes the buttons so they show up properly in the GH navbar

#0.9.6
- Add a label for WhatsNext and put them in the top of the KSV2 groups

#0.9.5
- Switch grid layout to use Bootstrap grid layout because GH changed some of their CSS

#0.9.4
- Removes the Mobile label
- Removes the Mobile tab

# 0.9.3
- Add more items to the legend
- Remove the area 51 tab
- Remove the scraper tab

# 0.9.2
- Combine some API requests into a single request

# 0.9.0
- Re-introduced the What's Next view

# 0.8.7
- Add text labels back to the area buttons (next to the new emojis)
- Shuffle around area / priority / issue type button groups

# 0.8.6
- Adds Infra label selector
- Removes Area 51 label selector
- Changes all Area buttons to emojis

# 0.8.5
- Fixed a bug with getting the GH username.

# 0.8.4
- Updating Pull Requests to Review Requests and ensuring that an unassigned PR will still show up so it doesn't get lost

# 0.8.3
- Updating planning label color to dark yellow

# 0.8.2
- List all pages of issues instead of just the first 30 results

# 0.8.1
- Fixed broken Type Picker for the NewFeature label
- Updated Improvement label color to reflect the new one used in GH

# 0.8.0
- Replaced the Bug label with the Improvement label
- Renamed Feature label to NewFeature label

# 0.7.10
- Fixing QA guidelines prep/appending multiple times

# 0.7.9
- Only enforcing no self-merges on `master` branches.
- Allowing self-merges in some specific infra repos.

# 0.7.8
- Adding QA guidelines to PR creation and editing.
- preventing a user from merging their own PR.

# 0.7.7
- Re-release to fix a faulty extension zip we uploaded with 0.7.6

# 0.7.6
- Removed all functionality of the What's Next tab
- Adjusted the colors for the Daily and Monthly labels, as they changed on GitHub
- Removed some `.octicon` elements as they're not supported by GitHub anymore :(

# 0.7.5
- Fixed a bug where the pickers weren't initializing selection properly

# 0.7.4
- Fixed a bug with the reviewing button not labeling issues properly

# 0.7.3
- Refactor the priority picker to be just like the type picker

# 0.7.2
- Change labels to be upper cased

# 0.7.1
- Add a "New Issue" button

# 0.7.0
- Add the ability to filter data
- Remove the What's Next functionality

# 0.6.2
- Quick pickers will be redrawn when they are removed on the issue page now

# 0.6.1
- Quick pickers will no longer get shown on the new issue page

# 0.6.0
- Added a new What's Next tab in GitHub. This will show milestones, and allow you to track comments on issues.
- Fixed a class name change for ".counter" to ".Counter"

# 0.5.5
- Implemented the new "overdue" label to indicate when an issue is overdue
- Fixed a bug where when the list of issues refreshes, it wasn't picking up any changes to labels that might have happened

# 0.5.4
- Put first pick issues at the top of the list

# 0.5.3
- Fix broken selector AGAIN

# 0.5.2
- Change the color of the engineering label

# 0.5.1
- Fix broken selector

# 0.5.0
- Combine web and core areas into engineering

# 0.4.13
- Overdue items will always show red, even if they are in review or planning

# 0.4.12
- Updating icon and removing beta from the name

# 0.4.11
- Just bumping the version to try publishing it again. Looks like there was a problem with the last package.

# 0.4.10
- Fixed a broken selector after GitHub changed a class name
- Updated the password form so that it properly asks for a personal access token

# 0.4.9
- Added a section to show daily bugs in all areas

# 0.4.8
- Fixed a bug where the counters on tab names weren't styled properly
- Added an ops tab to show ops issues

# 0.4.7
- Fixed a bug where hourly issues were being shown in the "none" column too
- Fixed a bug where the overdue status of an issue wasn't calculated properly

# 0.4.6
- Updated the view for PR waiting for to to not show PRs that are assigned to you

# 0.4.5
- Changed the view for PRs waiting on you to show PRs that you have finished reviewing, but haven't merged yet

# 0.4.4
- Fixed a bug where an API failure would cause a weirdly formatted issue list

# 0.4.3
- Fixed a bug where FirstPick issues wheren't being labeled properly

# 0.4.2
- Fixed a bug with the API that would create an infinite loop with retrying the API

# 0.4.1
- Refactored the tabs so that they load appropriately now

# 0.4.0
- Added a quick label button for the mobile area
- Added a tab for viewing mobile issues to work on
- Tried once again (and pretty much failed) to fix tab switching
- Added automatic API retrying according to GitHubs rate limiting headers

# 0.3.6
- Swapped the NewHire label for the FirstPick label

# 0.3.5
- Corrected the logic for the PR lists so that they show the proper PRs now

# 0.3.4
- Fixed a bug when sorting issues when there were more than 100

# 0.3.3
- Improved text for your own pull requests

# 0.3.2
- Improved text for your own pull requests

# 0.3.1
- Added pagination to the API calls
- Tried to fix tab switching without much luck

# 0.3.0
- Added full support for GitHub reviewers. This assumes that a PR assignee is the one responsible for merging it. Reviewers, their only job is to review code.

# 0.2.1
- Added a waiting label for issues that are waiting for customers

# 0.2.0
- Added a picker for areas and a some color for the other pickers

# 0.1.11
- Fixing a bug where the PR query shouldn't be just querying the expensify/expensify repo

# 0.1.10
- Switching issue searches to the expensify/expensify repo

# 0.1.9
- Bumping version because previous package was corrupt (no js/content.js)

# 0.1.8
- Added Area 51 to the list of issues

# 0.1.7
- Fixed a bug where Merge button wasn't disabled for PRs on HOLD when there's a trailing slash in the PRs URL
- Removed crx gulp task
- Added zip gulp task

# 0.1.6
- Fixed a bug where the label quick selectors didn't work anymore

# 0.1.5
- Fixed a bug where clicking on the K2 tab didn't work anymore

# 0.1.4
- Added a label to the list of issues for newhire tickets
- Added styles so that "Planning" and "Waiting for customer" issues are greyed out
- Made it so that when the lists refresh, there is no loading view and the data stays there

# 0.1.3
- Added a reviewing label switching button
- Add a bug/task/feature label switching button
- Fixed some errors for grabbing the repo name

# 0.1.2
- Replaced all icons with superscripts because GitHub is dumb and won't let octicons or font-awesome be used
- Added Travis CI status to all PRs

# 0.1.1
- Fixed a bug that wouldn't allow you to log in

# 0.1.0
- Fixed a bug causing the re-syncing of data to break the page
- Added an 'hourly' column of things assigned to you
- Added a table of 'issues to work on' for the different areas

# 0.0.10
- Updated the extension to work with the new GH repo layout

# 0.0.9
- Made some of the page components redraw on an interval

# 0.0.8
- Added the ability to quick select KSv2 labels
- Updated all libraries and build tools
- Added a sign out button
- Changed password field to be a password field

# 0.0.7
- Fixed the merge button that was no longer being disabled
- Fixed the password form

# 0.0.6
- Updated the styles for aa PR on hold to match the new GitHub changes
- Refined the detection of a held PR to one that contains "[HOLD" or "[WIP" in the title

# 0.0.5
- Added a dark theme for GitHub but disabled it for now
- Fixed a bug where authored pull requests weren't showing
- Moved the Kernel Scheduling navigation item to the bottom of the github menu (so it don't move things that you are used to having in the same spot)

# 0.0.4
- Refactored the React components to use Alt-Flux
- Added loading and blank states to the lists

# 0.0.3
- Changes the page title to K2 when on the K2 dashboard

# 0.0.2
- Restrict issue and pull request queries to the Expensify organization
