#!/bin/bash

installedNodeVersion=$(node -v)
installedNpmVersion=$(npm -v)
desiredNodeVersion="v14.10.0"
desiredNpmVersion="6.14.8"

# While we're transitioning from Ubuntu 16.04 to 20.04, we need to conditionally override this variable
# depending on which Ubuntu release we're running this script on.
if [[ "$(uname)" == "Linux" ]] ; then
    if [[ "$(lsb_release -rs)" == "20.04" ]] ; then
       desiredNodeVersion="v14.15.0"
    fi
fi

if [ "$installedNodeVersion" != "$desiredNodeVersion" ]
then
  echo "⚠️  [ERROR] Wrong version of node installed! You are currently running $installedNodeVersion. Please install node $desiredNodeVersion from https://nodejs.org/en/download/releases/"
  exit 1
fi

if [ "$installedNpmVersion" != "$desiredNpmVersion" ]
then
  echo "⚠️  [ERROR] Wrong version of npm installed! You are currently running $installedNpmVersion. Please install npm $desiredNpmVersion using \"npm install -g npm@$desiredNpmVersion\"."
  exit 1
fi
