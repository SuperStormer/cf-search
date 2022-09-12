#!/bin/sh
set -ex

rm -rf dist && mkdir dist
webpack

cleancss -o dist/index.css --source-map src/index.css
html-minifier-terser --conservative-collapse --collapse-whitespace src/index.html -o dist/index.html
rsync -av --ignore-existing --exclude scripts --exclude index.css --exclude index.html src/ dist/