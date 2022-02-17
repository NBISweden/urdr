#!/bin/sh
rm -rf dist
esbuild                                          \
    --bundle src/index.tsx                        \
    --outdir=dist                                \
    --loader:.png=file                           \
    --loader:.jpg=file                           \
    --external:/images/*                         \
    --target=es6                                 \
    --minify                                     \
    "--define:process.env.NODE_ENV='production'" \
    --pure:console.log
cd dist || exit 1
js_hash="index.$(md5sum index.js | head -c 10).js"
mv index.js "$js_hash"
css_hash="index.$(md5sum index.css | head -c 10).css"
mv index.css "$css_hash"

sed -e 's,.*index.js.*,<script src="'"/$js_hash"'"></script>,' \
    -e 's,<head>,&<link href="'"/$css_hash"'" rel="stylesheet">,' \
    ../public/index.html > index.html

