#!/bin/bash

set -eu

TOP="$(realpath "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)/..")"
readonly TOP

readonly PACKAGE_JSON="$TOP/package.json"

# Save the current package.json version to a variable
CURRENT_VERSION="$(jq -r '.version' < "$PACKAGE_JSON")"
readonly CURRENT_VERSION

# Bump the version in package.json and package-lock.json
npm --no-git-tag-version version patch

# Save the new package.json version to a variable
NEW_VERSION="$(jq -r '.version' < "$PACKAGE_JSON")"
readonly NEW_VERSION

# Bump the version in all the other manifest files
for FILE in "$TOP/assets/manifest.json" "$TOP/assets/manifest-firefox.json" ; do
    # Replace only the first instance of $CURRENT_VERSION in case another package has the same version number
    sed -i -E '0,/"'"$CURRENT_VERSION"'"/s//"'"$NEW_VERSION"'"/' "$FILE"
done

# Print the new version if running interactively, or else print the variable for the GH action
if [[ -n "${CI:-""}" ]] ; then
    echo "new-version=$NEW_VERSION"
else
    echo "Bumped version to $NEW_VERSION"
fi
