#!/bin/bash

set -eu

TOP="$(realpath "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)/..")"
readonly TOP

readonly PACKAGE_JSON="$TOP/package.json"

# Save the current package.json version to a variable
ORIGINAL_VERSION="$(jq -r '.version' < "$PACKAGE_JSON")"
readonly ORIGINAL_VERSION

# Bump the version in package.json and package-lock.json
npm --no-git-tag-version version patch
CURRENT_VERSION="$(jq -r '.version' < "$PACKAGE_JSON")"

# Auto-bump to next semver level if we reached 100
# Extract version parts
IFS='.' read -r _ MINOR PATCH <<< "$CURRENT_VERSION"

# Check if patch is 100, if so bump minor
if [[ "$PATCH" == "100" ]]; then
    npm --no-git-tag-version version minor
    CURRENT_VERSION="$(jq -r '.version' < "$PACKAGE_JSON")"
    IFS='.' read -r _ MINOR PATCH <<< "$CURRENT_VERSION"
fi

# Check if minor is 100, if so bump major
if [[ "$MINOR" == "100" ]]; then
    npm --no-git-tag-version version major
    CURRENT_VERSION="$(jq -r '.version' < "$PACKAGE_JSON")"
fi


# Save the new package.json version to a variable
NEW_VERSION="$(jq -r '.version' < "$PACKAGE_JSON")"
readonly NEW_VERSION

# Bump the version in all the other manifest files
for FILE in "$TOP/assets/manifest.json" "$TOP/assets/manifest-firefox.json" ; do
    # Replace only the first instance of $CURRENT_VERSION in case another package has the same version number
    sed -i -E '0,/"'"$ORIGINAL_VERSION"'"/s//"'"$NEW_VERSION"'"/' "$FILE"
done

# Print the new version if running interactively, or else print the variable for the GH action
if [[ -n "${CI:-""}" ]] ; then
    echo "new-version=$NEW_VERSION"
else
    echo "Bumped version to $NEW_VERSION"
fi
