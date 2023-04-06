#!/bin/sh
set -ex

rm -rf dist && mkdir dist
webpack

if [ "$NODE_ENV" = "production" ]; then
	cleancss -O2 -o dist/index.css --source-map src/styles/index.css
	html-minifier-terser --conservative-collapse --collapse-whitespace src/index.html -o dist/index.html
	rsync -av --ignore-existing --exclude scripts --exclude styles --exclude index.html src/ dist/
else 
	cleancss -O0 -o dist/index.css src/styles/index.css
	rsync -av  --ignore-existing --exclude scripts --exclude styles src/ dist/
fi
