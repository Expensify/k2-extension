#!/bin/bash

set -eu

TOP="$(realpath "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)/..")"
readonly TOP

readonly PACKAGE_JSON="$TOP/package.json"

# Save the current package.json version to a variable
CURRENT_VERSION="$(jq -r '.version' < "$PACKAGE_JSON")"
readonly CURRENT_VERSION

# Parse the version into major/minor/patch
readonly _MAJOR="${CURRENT_VERSION%%.*}"
readonly REMAINING="${CURRENT_VERSION#*.}"
readonly MINOR="${REMAINING%%.*}"
readonly PATCH="${CURRENT_VERSION##*.}"

if [[ "$PATCH" != "99" ]]; then
    npm --no-git-tag-version version patch
elif [[ "$MINOR" != "99" ]]; then
    npm --no-git-tag-version version minor
else
    npm --no-git-tag-version version major
fi

# Save the new package.json version to a variable
NEW_VERSION="$(jq -r '.version' < "$PACKAGE_JSON")"
readonly NEW_VERSION

# Bump the version in all the other manifest files
for FILE in "$TOP/assets/manifest.json" "$TOP/assets/manifest-firefox.json" ; do
    # Replace only the first instance of $CURRENT_VERSION in case another package has the same version number
    sed -i -E '0,/"'"$CURRENT_VERSION"'"/s//"'"$NEW_VERSION"'"/' "$FILE"
done

# Output the new version to the GITHUB_OUTPUT file if it exists and is writable
if [[ -w "$GITHUB_OUTPUT" ]]; then
    echo "new-version=$NEW_VERSION" >> "$GITHUB_OUTPUT"
fi

echo "Bumped version to $NEW_VERSION"
