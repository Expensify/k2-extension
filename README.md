KS Browser Extension
=============

GitHub UI integration for KS - Kernel Scheduling Method

# Installing the Chrome Extension
## Easy (auto-updating), only for internal employees
1. Download the extension from [here](https://chrome.google.com/webstore/detail/k2-for-github/hmhoemhekchomabhoccbidjnoenbphno?hl=en-US)
1. Click on 'Add to Chrome'

## From the Source Code (for development or for external contributors)
1. Go to `chrome://extensions`
1. Make sure you have _Developer Mode_ enabled at the top
1. Click _Load Unpacked Extension_
1. Navigate to the `dist` folder and select it
    - Note: Do this after running `npm i` then `npm run web` or `npm run build`

# Installing on Firefox
## The "published" version
1. https://stackoverflow.com/c/expensify/questions/7053/7054#7054

## From the Source Code (for development or for external contributors)
1. Open up this page in firefox: `about:debugging#/runtime/this-firefox`
1. Click **Load temporary add-on**
1. Select the `dist/manifest.json` file in this repo (really any file within the dist should work) [more info](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#Trying_it_out)
1. go to https://github.com/Expensify/App#k2
    Note: If this doesn't load you may need to run `npm run build` within the root of the repo to ensure all files have been generated properly (we don't save all of the dist directory to the repo).

## NOTE: It Requires a Personal Access token
Your personal access token is stored locally and securely. It is used to make basic auth calls to the GitHub API. This is so that we don't have to implement OAuth or a separate API and we can get around a lot of the rate limiting issues.

1. Go to https://github.com/settings/tokens
1. Generate a new token
1. Give it full permission to notifications, repo and user
1. Use that token when signing in to the KSv2 dashboard

# Installing this repo
```
git clone git@github.com:Expensify/k2-extension.git
cd k2-extension
npm i
npm run web
```

# Developing
There are three NPM tasks to use with this project. All files are output to the `dist` folder.

1. `npm run web` - Run this when doing development. It will watch files and run all code standardizing tasks whenever the files are saved. It will build all the JS code together in an unminified version for easier debugging.
1. `npm run build` - This will also build all the JS code together but it won't watch files, it will minify the output, and will exit when finished.
1. `npm run package` - This will bundle up the files in the `/dist` directory into a file `dist.zip` which can be used to submit to the Chrome Store.

In order to test your changes, you need to have the extension loaded into Chrome from your local folder.

1. In Chrome, go to chrome://extensions
1. Make sure you have Developer Mode selected at the top
1. Click on **Load Unpacked Extension**
1. Select the `dist` folder in this repo
1. Now the extension should be installed and enabled
1. Go to https://github.com/Expensify/App#k2 and you should see the extension working

### Caution When Using the Publicly Installed Extension
Sometimes it is necessary to install and enable the public version of the extension. You want to take care not to have both the public extension and the local extension enabled at the same time. It will make everything run twice and you'll get a lot of DOM conflicts, plus API calls will run twice so you'll hit rate limits faster.

# Creating your PR
Be sure to do the following before pushing up your branch:
1. Bump the version number in `assets/manifest.json` (use major.minor.patch version scheme)
1. Bump the version number in `package.json` and `package-lock.json` to match
1. Add a new change log entry in `CHANGELOG.md`

# Publishing
**Note:** Publishing KSv2 requires ring3 access. If you are not in ring 3 or below, tag your issue with the `ring3` label to assign a deployer.

To publish a new version of this extension, you should follow these steps:

1. Make sure the version number was bumped in `assets/manifest.json` (use major.minor.patch version scheme)
1. Make sure the version number in `package.json` matches
1. Make sure a new change log entry was added in `CHANGELOG.md`
1. Run `npm run build` to output the minified code in the `/dist` directory
1. Run `npm run package` which will generate a `dist.zip` file

## Chrome
1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
1. Sign in with the account `apps@expensify.com`. The password/2FA is in the [ring3 vault in Password1](https://expensify.1password.com/vaults/all/allitems/qgxjpcxrhffbpazolqqoxrhxqm).
1. Click on the **K2 for Github** app.
1. Click on the **Package** tab.
1. Click on **Upload New Package**, then choose the `dist.zip` file that was created earlier.
1. Click on **Upload**
1. On the **Store Listing** page, copy the new version notes from CHANGELOG.md into the description field and click **Save Draft**
1. Back on the **Package** tab, verify that the new version number is shown for the _Draft Package_.
1. Back in **Store Listing** page, click **Submit for review**.
1. Make sure `Publish "K2 for GitHub" automatically after it has passed review` is checked, then hit **Submit for review**.
1. Done!

## Firefox
https://stackoverflow.com/c/expensify/questions/7043/7044#7044

# Code Standards
This repo uses several tools to keep the code standardized.

### [JS Format](https://github.com/jdc0589/JsFormat) - Sublime plugin, use this config for your personal package settings:
```
{
    // jsformat options
    "format_on_save": true,
    "jsbeautifyrc_files": true
}
```

### [Editorconfig](http://editorconfig.org/) - Use a plugin for your editor of choice
There is no configuration required as it should read the `.editorconfig` file in the root of the repo

### [JSCS](https://github.com/jscs-dev/node-jscs)
This is run via a gulp task and no confuragion required. It will use the [AirBnB style guide](https://github.com/airbnb/javascript) by default.

### [JSHint](http://jshint.com/)
This is run via a gulp task

### [CSSLint](https://github.com/CSSLint/csslint)
This is run via a gulp task
