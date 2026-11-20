Inter (https://github.com/rsms/inter), SIL Open Font License 1.1 (see LICENSE-Inter-OFL.txt).

inter-latin-400-800.woff2 is Inter's variable font reduced for this site: the weight axis limited to 400 to 800 (the
weights the CSS uses) and the characters limited to Basic Latin, Latin-1, general punctuation, the euro sign, the
trade mark sign and a few arrows and signs (about 210 characters). 48 KB became 27 KB. The licence allows this.

To make it again, from the "latin" variable file of @fontsource-variable/inter (npm), with fontTools and brotli:

  python -m fontTools.varLib.instancer inter-latin-wght-normal.woff2 wght=400:800 -o inter-400-800.woff2
  pyftsubset inter-400-800.woff2 --unicodes=U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+2010-2015,U+2018-201F,U+2022,U+2026,U+2030,U+2039-203A,U+20AC,U+2122,U+2190-2193,U+2212 --layout-features=kern,calt,ccmp,locl,mark,mkmk,liga,tnum,case --flavor=woff2 --output-file=inter-latin-400-800.woff2

If the site ever needs another character (another language, a new symbol), add its code point to --unicodes and run this again.
