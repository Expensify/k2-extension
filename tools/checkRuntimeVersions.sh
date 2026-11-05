#!/bin/bash

# Any Node.js release on the same major line as the minimum passes, so patch releases roll out without code changes.
# Raise minimumNodeVersion to require a security fix. npm 11.10.0 is the first release that supports min-release-age in .npmrc.
minimumNodeVersion="26.12.1"
minimumNpmVersion="11.10.0"

# Succeeds when version $1 is at least version $2
function isAtLeast() {
    local -a actual minimum
    IFS=. read -r -a actual <<< "$1"
    IFS=. read -r -a minimum <<< "$2"
    for i in 0 1 2; do
        if (( ${actual[i]:-0} != ${minimum[i]:-0} )); then
            (( ${actual[i]:-0} > ${minimum[i]:-0} ))
            return
        fi
    done
    return 0
}

installedNodeVersion="$(node -v)"
installedNodeVersion="${installedNodeVersion#v}"
installedNpmVersion="$(npm -v)"

if [[ "${installedNodeVersion%%.*}" != "${minimumNodeVersion%%.*}" ]] || ! isAtLeast "$installedNodeVersion" "$minimumNodeVersion"; then
    echo "⚠️  [ERROR] Wrong version of node installed! You are currently running v$installedNodeVersion. Please install node ${minimumNodeVersion%%.*}.x, v$minimumNodeVersion or newer, by running \"nvm install\"."
    exit 1
fi

if ! isAtLeast "$installedNpmVersion" "$minimumNpmVersion"; then
    echo "⚠️  [ERROR] Wrong version of npm installed! You are currently running $installedNpmVersion. Please install npm $minimumNpmVersion or newer using \"npm install -g npm@11\"."
    exit 1
fi
