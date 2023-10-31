#!/bin/bash

installedNodeVersion="$(node -v)"
installedNpmVersion="$(npm -v)"
desiredNodeVersion="v20.9.0"
desiredNpmVersion="10.1.0"

if [[ "$installedNodeVersion" != "$desiredNodeVersion" ]]; then
  echo "⚠️  [ERROR] Wrong version of node installed! You are currently running $installedNodeVersion. Please install node $desiredNodeVersion from https://nodejs.org/en/download/releases/"
  exit 1
fi

if [[ "$installedNpmVersion" != "$desiredNpmVersion" ]]; then
  echo "⚠️  [ERROR] Wrong version of npm installed! You are currently running $installedNpmVersion. Please install npm $desiredNpmVersion using \"npm install -g npm@$desiredNpmVersion\"."
  exit 1
fi
