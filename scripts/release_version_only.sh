#!/usr/bin/env bash
echo "Release new version"

level=$1

if [[ $level != "minor" ]] && [[ $level != "major" ]] && [[ $level != "patch" ]]; then
  echo "error: level must be minor, major or patch"
  exit 1
fi

git fetch
yarn lint
yarn version $level
git add package.json
new_version=v$(node -p "require('./package.json').version")
git commit -m $new_version
git tag $new_version

echo "Released ${new_version}"
echo "To confirm, push the new tag and the release commit"
echo "git push --tags"
echo "git push"

exit 0