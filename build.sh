#!/bin/sh
set -ex

rm -rf dist && mkdir dist
webpack

if [ "$NODE_ENV" = "production" ]; then
	cleancss -o dist/index.css --source-map src/styles/index.css
	html-minifier-terser --conservative-collapse --collapse-whitespace src/index.html -o dist/index.html
	rsync -av --ignore-existing --exclude scripts --exclude styles --exclude index.html src/ dist/
else 
	# note: you need to apply https://github.com/clean-css/clean-css-cli/pull/81 manually to node_modules/clean-css-cli
	# because the maintainer isn't responding
	cleancss -O0 -o dist/index.css src/styles/index.css
	rsync -av  --ignore-existing --exclude scripts --exclude styles src/ dist/
fi