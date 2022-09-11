#!/bin/bash
set -e
shopt -s extglob

rm -rf dist && mkdir dist
webpack
cp -r src/!(scripts) dist