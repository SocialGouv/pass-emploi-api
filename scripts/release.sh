#!/usr/bin/env bash

upgrade_version_and_tag() {
  git fetch
  yarn lint
  yarn version $level
  git add package.json
  new_version=v$(node -p "require('./package.json').version")
  git commit -m $new_version
  git tag $new_version
  git push --tags
}

level=$1

echo "Release version"

current_branch=$(git rev-parse --abbrev-ref HEAD)

if [[ $level != "minor" ]] && [[ $level != "major" ]] && [[ $level != "patch" ]]; then
  echo "error: level must be minor, major or patch"
  exit 1
fi

if [[ $current_branch == "master" ]] && [[ $level != "patch" ]]; then
  echo "error: only patches are allowed on master"
  exit 1
fi

if [[ $current_branch != "master" ]] && [[ $current_branch != "develop" ]]; then
  echo "error: release are allowed only on master or develop"
  exit 1
fi

if [[ $current_branch == "develop" ]]; then
  upgrade_version_and_tag

  git push origin develop
  git checkout master
  git pull --rebase
  git merge develop
  git push origin master
  git checkout develop

  exit 0
fi

if [[ $current_branch == "master" ]] && [[ $level == "patch" ]]; then
  upgrade_version_and_tag

  git push origin master
  version_commit_sha=$(git rev-parse HEAD~1)
  fix_commit_sha=$(git rev-parse HEAD~2)
  git checkout develop
  git cherry-pick $fix_commit_sha
  git cherry-pick $version_commit_sha
  git push origin develop

  exit 0
fi
