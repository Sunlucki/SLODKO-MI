#!/usr/bin/env bash
# Rebuilds the self-hosted font files in src/assets/fonts from @fontsource (needs Python fonttools + brotli:
# pip install fonttools brotli). The latin-ext files are cut down to the Polish letters only — the site
# is Polish, so the other ~300 extended-latin glyphs would just be extra bytes before the first paint.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=src/assets/fonts
PL='U+0104-0107,U+0118-0119,U+0141-0144,U+015A-015B,U+0179-017C'
mkdir -p "$OUT"
cp node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2 "$OUT/anton-latin.woff2"
cp node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2 "$OUT/manrope-latin.woff2"
pyftsubset node_modules/@fontsource/anton/files/anton-latin-ext-400-normal.woff2 --unicodes="$PL" \
  --layout-features='*' --flavor=woff2 --output-file="$OUT/anton-pl.woff2"
pyftsubset node_modules/@fontsource-variable/manrope/files/manrope-latin-ext-wght-normal.woff2 --unicodes="$PL" \
  --layout-features='*' --flavor=woff2 --output-file="$OUT/manrope-pl.woff2"
ls -l "$OUT"
