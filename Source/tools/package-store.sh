#!/bin/bash
# Builds Demo/, the source ZIP and the delivery folder + ZIP for TRIO Mobile.
# Run from anywhere: bash Source/tools/package-store.sh   (or double-click UPDATE-PACKAGE.command)
# Needs: Node.js 22 or newer (24 recommended; the checks use node:sqlite), `npm install` once in Source/, and the `zip` / `unzip` commands (built into macOS).
set -euo pipefail

TOOLS="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE="$(cd "$TOOLS/.." && pwd)"
ROOT="$(cd "$SOURCE/.." && pwd)"
NAME="Trio"
SLUG="trio"
DELIVERY_PARENT="$ROOT/$NAME-complete-with-demo"
DELIVERY="$DELIVERY_PARENT/$NAME"
WORK="$ROOT/.package-tmp"

inside() { case "$1" in "$ROOT"/*) return 0;; *) echo "Refusing path outside the project: $1" >&2; exit 1;; esac; }
for p in "$DELIVERY_PARENT" "$WORK" "$ROOT/Demo"; do inside "$p"; done
[ -f "$SOURCE/package.json" ] || { echo "Source/package.json not found" >&2; exit 1; }
command -v node >/dev/null || { echo "Node.js is not installed (https://nodejs.org)" >&2; exit 1; }
[ "$(node -p "process.versions.node.split('.')[0]")" -ge 22 ] || { echo "Node.js 22 or newer is needed (24 recommended): https://nodejs.org" >&2; exit 1; }
command -v zip >/dev/null || { echo "zip is not installed" >&2; exit 1; }
[ -d "$SOURCE/node_modules/esbuild" ] || (cd "$SOURCE" && npm ci --no-audit --no-fund)

echo "1/6 build checks"
(cd "$SOURCE" && node tools/build.mjs live >/dev/null && node tests/check.mjs >/dev/null) || { echo "Checks failed: run 'npm test' in Source" >&2; exit 1; }

echo "2/6 Demo/"
rm -rf "$ROOT/Demo"
(cd "$SOURCE" && node tools/build.mjs demo "$ROOT/Demo" >/dev/null)
cat > "$ROOT/Demo/Open-demo.html" <<'HTML'
<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=index.html#/"><title>TRIO Mobile — Demo</title></head>
<body><p><a href="index.html#/">افتح الموقع</a> · <a href="admin/index.html">لوحة التحكم</a></p></body></html>
HTML
cat > "$ROOT/Demo/START-DEMO.command" <<'SH'
#!/bin/bash
cd "$(dirname "$0")" && open "Open-demo.html"
SH
chmod +x "$ROOT/Demo/START-DEMO.command"
cat > "$ROOT/Demo/README-AR.md" <<'MD'
# النسخة التجريبية — TRIO Mobile

1. فك ضغط المجلد كامل (ما تفتحه من جوا الـ ZIP).
2. دبل كليك على `Open-demo.html` (أو `START-DEMO.command` على الماك). الأفضل Chrome أو Safari أو Edge.
3. زر «نسخة عرض · لوحة التحكم» تحت بفتح لوحة التحكم بدون كلمة سر.
4. الطلب من الموقع مسكّر بالبداية: من لوحة التحكم ← الإعدادات فعّل «استقبال الطلبات من الموقع» واضغط «انشر».

- الأسعار والأجهزة من منشورات تريو على إنستغرام.
- أي تعديل أو طلب تجريبي بضل على هالمتصفح بس. ما بنبعت إشي للمحل، وما في دفع.
- الموقع الحقيقي (الطلبات واللوحة لكل الأجهزة) بشتغل على Cloudflare: شوف `Cloudflare-guide.md`.
MD

echo "3/6 source ZIP"
rm -rf "$WORK"; mkdir -p "$WORK/stage/$NAME" "$DELIVERY_PARENT.tmp"
S="$WORK/stage/$NAME"
mkdir -p "$S/Source"
# explicit list of what the source ZIP carries
for item in package.json package-lock.json wrangler.jsonc README-AR.md site shared worker migrations tools tests; do
  [ -e "$SOURCE/$item" ] && cp -R "$SOURCE/$item" "$S/Source/"
done
for item in README-AR.md README.md Cloudflare-guide.md START-DEMO.command UPDATE-PACKAGE.command .gitignore .github; do
  [ -e "$ROOT/$item" ] && cp -R "$ROOT/$item" "$S/"
done
mkdir -p "$S/Documents"
for item in README-AR.md SOURCES.md IMAGE-ASSETS.md IMAGE-REPAIRS.json HOME-CATEGORY-ASSETS.json Media-originals; do
  [ -e "$ROOT/Documents/$item" ] && cp -R "$ROOT/Documents/$item" "$S/Documents/"
done
find "$S" \( -name '.DS_Store' -o -name 'node_modules' -o -name '.wrangler' -o -name 'dist' -o -name '.dev.vars' -o -name '*.log' \) -prune -exec rm -rf {} + 2>/dev/null || true
SRC_ZIP="$WORK/$NAME-website-source.zip"
(cd "$WORK/stage" && zip -qrX "$SRC_ZIP.tmp" "$NAME" && mv "$SRC_ZIP.tmp" "$SRC_ZIP")

echo "4/6 delivery folder"
rm -rf "$DELIVERY_PARENT.tmp"; mkdir -p "$DELIVERY_PARENT.tmp/$NAME"
D="$DELIVERY_PARENT.tmp/$NAME"
cp "$SRC_ZIP" "$D/"
cp -R "$ROOT/Demo" "$D/Demo"
mkdir -p "$D/Documents"
for item in README-AR.md SOURCES.md IMAGE-ASSETS.md IMAGE-REPAIRS.json HOME-CATEGORY-ASSETS.json Media-originals; do
  [ -e "$ROOT/Documents/$item" ] && cp -R "$ROOT/Documents/$item" "$D/Documents/"
done
cp "$SOURCE/tools/delivery-README-AR.md" "$D/README-AR.md"
cp "$ROOT/Cloudflare-guide.md" "$D/Cloudflare-guide.md"
find "$DELIVERY_PARENT.tmp" -name '.DS_Store' -delete 2>/dev/null || true
rm -rf "$DELIVERY_PARENT"; mv "$DELIVERY_PARENT.tmp" "$DELIVERY_PARENT"

echo "5/6 complete ZIP"
ALL_ZIP="$ROOT/$NAME-complete-with-demo.zip"
(cd "$ROOT" && rm -f "$ALL_ZIP.tmp" && zip -qrX "$ALL_ZIP.tmp" "$NAME-complete-with-demo" && mv "$ALL_ZIP.tmp" "$ALL_ZIP")

echo "6/6 verify"
bad='AGENTS\.md|CONTEXT\.md|Evidence/|Archives/|\.dev\.vars|\.env|node_modules|\.wrangler/|\.log$'
for z in "$SRC_ZIP" "$ALL_ZIP"; do
  if unzip -Z1 "$z" | grep -E "$bad" >/dev/null; then echo "Private or internal file inside $(basename "$z")" >&2; unzip -Z1 "$z" | grep -E "$bad" >&2; exit 1; fi
done
unzip -Z1 "$ALL_ZIP" | grep -q "$NAME-complete-with-demo/$NAME/$NAME-website-source.zip" || { echo "source ZIP missing from the delivery" >&2; exit 1; }
unzip -Z1 "$ALL_ZIP" | grep -q "$NAME-complete-with-demo/$NAME/Demo/index.html" || { echo "Demo missing from the delivery" >&2; exit 1; }
unzip -Z1 "$ALL_ZIP" | grep -q "$NAME-complete-with-demo/$NAME/Cloudflare-guide.md" || { echo "guide missing from the delivery" >&2; exit 1; }
if grep -rqE 'test-setup-code|SETUP_CODE=' "$DELIVERY_PARENT" 2>/dev/null; then echo "A private value is inside the delivery" >&2; exit 1; fi
rm -rf "$WORK"

# keep the folder view clean on a Mac: only the delivery folder and its ZIP stay visible
if command -v chflags >/dev/null; then
  for item in Source Demo Documents AGENTS.md TRIO-CONTEXT.md README-AR.md README.md Cloudflare-guide.md UPDATE-PACKAGE.command START-DEMO.command .gitignore website; do
    [ -e "$ROOT/$item" ] && chflags hidden "$ROOT/$item"
  done
fi

size() { wc -c < "$1" | tr -d ' '; }
count() { unzip -Z1 "$1" | wc -l | tr -d ' '; }
printf '{"sourceZip":{"files":%s,"bytes":%s},"completeZip":{"path":"%s","files":%s,"bytes":%s},"demoFiles":%s}\n' \
  "$(count "$DELIVERY/$NAME-website-source.zip")" "$(size "$DELIVERY/$NAME-website-source.zip")" "$NAME-complete-with-demo.zip" "$(count "$ALL_ZIP")" "$(size "$ALL_ZIP")" "$(find "$ROOT/Demo" -type f | wc -l | tr -d ' ')"
