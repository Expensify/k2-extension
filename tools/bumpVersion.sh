#!/bin/bash

set -eu

TOP="$(realpath "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)/..")"
readonly TOP

readonly PACKAGE_JSON="$TOP/package.json"

# Read the version from package.json as the "current version"
CURRENT_VERSION="$(grep -E '"version": "([0-9\.]+)"' "$PACKAGE_JSON" | awk -F\" '{print $4}')"
readonly CURRENT_VERSION

# Parse the version into major/minor/patch
readonly MAJOR="${CURRENT_VERSION%%.*}"
readonly REMAINING="${CURRENT_VERSION#*.}"
readonly MINOR="${REMAINING%%.*}"
readonly PATCH="${CURRENT_VERSION##*.}"

# Increment the patch version
NEW_MAJOR="$MAJOR"
NEW_MINOR="$MINOR"
NEW_PATCH="$((PATCH + 1))"

# If patch is > 99, bump minor and reset patch to 0
if [[ "$NEW_PATCH" -gt 99 ]] ; then
    NEW_PATCH=0
    NEW_MINOR="$((NEW_MINOR + 1))"
fi

# If minor is > 99, bump major and reset minor to 0
if [[ "$NEW_MINOR" -gt 99 ]] ; then
    NEW_MINOR=0
    NEW_MAJOR="$((NEW_MAJOR + 1))"
fi

# Save the new version to a variable
readonly NEW_VERSION="$NEW_MAJOR.$NEW_MINOR.$NEW_PATCH"

# Bump the version in all the files
for FILE in "$PACKAGE_JSON" "$TOP/package-lock.json" "$TOP/assets/manifest.json" "$TOP/assets/manifest-firefox.json" ; do
    # Replace only the first instance of $CURRENT_VERSION in case another package has the same version number
    sed -i -E '0,/"'"$CURRENT_VERSION"'"/s//"'"$NEW_VERSION"'"/' "$FILE"
done

# Print the new version if running interactively, or else print the variable for the GH action
if [[ -n "${CI:-""}" ]] ; then
    echo "new-version=$NEW_VERSION"
else
    echo "Bumped version to $NEW_VERSION"
fi
