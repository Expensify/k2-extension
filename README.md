K2 Chrome Extension
=============

GitHub UI integration for K2 - Kernel Scheduling Method

# Installing the Chrome Extension
## Easy (auto-updating)
1. Download the extension from [here](https://chrome.google.com/webstore/detail/k2-for-github/hmhoemhekchomabhoccbidjnoenbphno?hl=en-US)
2. Click on 'Add to Chrome'

## From the Source Code (for development)
1. Go to `chrome://extensions`
2. Make sure you have _Developer Mode_ enabled at the top
3. Click _Load Unpacked Extension_
4. Navigate to the `dist` folder and select it

## NOTE: It Requires a Personal Access token
Your personal access token is stored locally and securely. It is used to make basic auth calls to the GitHub API. This is so that we don't have to implement OAuth or a separate API and we can get around a lot of the rate limiting issues.

1. Go to https://github.com/settings/tokens
2. Generate a new token
3. Give it full permission to notifications, repo and user
4. Use that token when signing in to the KSv2 dashboard

# Installing this repo

First, update NPM to the version specified in the topic of the
`#engineering-chat` channel on Slack.

```bash
npm install -g npm@<version>
```

Then clone and install node modules

```
git clone git@github.com:Expensify/k2-chrome-extension.git
cd k2-chrome-extension
npm i
```

If you are running the agreed-upon version of npm, there should not be
any changes to `package-lock.json`

# Developing
There are three NPM tasks to use with this project. All files are output to the `dist` folder.

1. `npm run watch` - Run this when doing development. It will watch files and run all code standardizing tasks whenever the files are saved. It will build all the JS code together in an unminified version for easier debugging.
1. `npm run build` - This will doing the same thing as the normal gulp task except it won't watch files and will exit when finished.
1. `npm run package` - This will output a minified version of the code which can be used to submit to the Chrome Store.

**NOTE:** If you get the following error message when trying to run
these commands...

```
Error: Node Sass does not yet support your current environment: Linux 64-bit with Unsupported runtime (59)
```

...you can fix this by rebuild node-sass.

On macOS:

```bash
npm rebuild node-sass
```

Or, in Expensidev:

```bash
sudo npm rebuild node-sass
```

**NOTE:** This command exits with an error in Expensidev, but appears to
still fix the error with `npm run build`. If you have a better solution,
please update this README.

In order to test your changes, you need to have the extension loaded into Chrome from your local folder.

1. In Chrome, go to chrome://extensions
1. Make sure you have Developer Mode selected at the top
1. Click on **Load Unpacked Extension**
1. Select the `dist` folder in this repo
1. Now the extension should be installed and enabled
1. Go to https://github.com/Expensify/Expensify#k2 and you should see the extension working

### Caution When Using the Publicly Installed Extension
Sometimes it is necessary to install and enable the public version of the extension. You want to take care not to have both the public extension and the local extension enabled at the same time. It will make everything run twice and you'll get a lot of DOM conflicts, plus API calls will run twice so you'll hit rate limits faster.

# Creating your PR
Be sure to do the following before pushing up your branch:
1. Bump the version number in `dist/manifest.json` (use major.minor.patch version scheme)
1. Bump the version number in `package.json` and `package-lock.json` to match
1. Add a new change log entry in `CHANGELOG.md`

# Publishing
To publish a new version of this extension, you should follow these steps:

1. Bump the version number in `dist/manifest.json` (use major.minor.patch version scheme)
1. Bump the version number in `package.json` to match
1. Add a new change log entry in `CHANGELOG.md`
1. Run `gulp package` which will generate a `dist.zip` file
1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
1. Sign in with the account `apps@expensify.com`. The password is in Password1. If you need access to it, reach out to the #infra team.
1. Click the **Edit** button for the **K2 for GitHub (BETA)** app
1. Click the **Upload Updated Package** button
1. Click on **Upload File** and choose the `dist.zip` file that was created earlier
1. Click on **Upload**
1. Verify that the version shown next to the **Upload Updated Package** button shows the new version number
1. Scroll down and click on **Publish changes**
1. Click on **OK** in the confirmation window
1. Done!

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
