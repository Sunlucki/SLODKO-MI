#!/usr/bin/env bash
# Rebuilds the self-hosted font files in src/assets/fonts from @fontsource (needs Python fonttools + brotli:
# pip install fonttools brotli). The latin-ext files are cut down to the Polish letters only — the site
# is Polish, so the other ~300 extended-latin glyphs would just be extra bytes before the first paint.
# The cyrillic files keep only the Russian + Ukrainian letters and "№" (quotes and dashes come from the
# latin files). Anton has no Cyrillic: its stand-in is Sofia Sans Extra Condensed ExtraBold under the same family name (globals.css).
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=src/assets/fonts
PL='U+0104-0107,U+0118-0119,U+0141-0144,U+015A-015B,U+0179-017C'
CYR='U+0401,U+0404,U+0406-0407,U+0410-044F,U+0451,U+0454,U+0456-0457,U+0490-0491,U+2116'
mkdir -p "$OUT"
cp node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2 "$OUT/anton-latin.woff2"
cp node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2 "$OUT/manrope-latin.woff2"
pyftsubset node_modules/@fontsource/anton/files/anton-latin-ext-400-normal.woff2 --unicodes="$PL" \
  --layout-features='*' --flavor=woff2 --output-file="$OUT/anton-pl.woff2"
pyftsubset node_modules/@fontsource-variable/manrope/files/manrope-latin-ext-wght-normal.woff2 --unicodes="$PL" \
  --layout-features='*' --flavor=woff2 --output-file="$OUT/manrope-pl.woff2"
pyftsubset node_modules/@fontsource/sofia-sans-extra-condensed/files/sofia-sans-extra-condensed-cyrillic-800-normal.woff2 --unicodes="$CYR" \
  --layout-features='*' --flavor=woff2 --output-file="$OUT/display-cyrillic.woff2"
pyftsubset node_modules/@fontsource-variable/manrope/files/manrope-cyrillic-wght-normal.woff2 --unicodes="$CYR" \
  --layout-features='*' --flavor=woff2 --output-file="$OUT/manrope-cyrillic.woff2"
ls -l "$OUT"
