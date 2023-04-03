#!/bin/bash

# pip install update_changelog
update_changelog
VERSION=${1:-"v0.0.0"}
git tag "$VERSION"
npx clasp version "$VERSION"