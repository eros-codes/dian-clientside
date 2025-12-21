/*
 Codemod: migrate inline color literals and gradients to client-colors.ts
 - Dry-run by default: prints proposed edits
 - Use --apply to write changes

 Strategy (conservative):
 1. Parse client-colors.ts to extract a mapping of hex/gradient -> symbol name.
 2. Walk .tsx/.ts/.css/.module.css files under client-side (excluding node_modules, .next).
 3. For each file, find hex literals (#rrggbb or #rgb) and linear-gradient('...') string literals.
 4. If an exact value exists in the client-colors map, propose replacement to `colors.<key>` or `colors.gradients.<key>`.
 5. If not found, record the value in a report (do NOT auto-add to client-colors in dry-run).
 6. Output a patch-like summary. With --apply the script will:
    - Add necessary import lines for `colors` (and `hexToRgba` when converting rgba usages)
    - Replace literals with references.

 NOTE: This codemod is conservative. It won't try to refactor complex CSS-in-JS expressions or minified JS in .next.
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COLORS_FILE = path.join(ROOT, 'client-colors.ts');

function readClientColors() {
  const src = fs.readFileSync(COLORS_FILE, 'utf8');
  const mapping = { hex: {}, gradient: {} };
  // crude regex to capture keys like `primary: '#2563EB',` and gradients like `purple: 'linear-gradient(...)',`
  const hexRegex = /([a-zA-Z0-9_]+)\s*:\s*['"](#(?:[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}))['"]/g;
  let m;
  while ((m = hexRegex.exec(src))) {
    mapping.hex[m[2].toLowerCase()] = m[1];
  }
  const gradRegex = /([a-zA-Z0-9_]+)\s*:\s*['"](linear-gradient\([^'"]+\))['"]/g;
  while ((m = gradRegex.exec(src))) {
    mapping.gradient[m[2]] = m[1];
  }
  return mapping;
}

function findFiles(dir, exts = ['.tsx', '.ts', '.css', '.module.css']) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.next' || e.name === 'dist') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...findFiles(full, exts));
    else {
      if (exts.includes(path.extname(e.name))) out.push(full);
    }
  }
  return out;
}

function rel(from, to) {
  let r = path.relative(path.dirname(from), to).replace(/\\/g, '/');
  if (!r.startsWith('.')) r = './' + r;
  return r;
}

function computeImportPath(filePath) {
  // client-colors.ts is at ROOT/client-colors.ts
  const importPath = rel(filePath, COLORS_FILE).replace(/\.ts$/, '');
  return importPath;
}

function run(dryRun = true) {
  const mapping = readClientColors();
  const files = findFiles(ROOT);
  const hexPattern = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g;
  const gradientPattern = /linear-gradient\([^\)]+\)/g;
  const rgbaPattern = /rgba\((\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[0-9.]+\s*)\)/g;

  const proposals = [];
  const unknownColors = new Set();

  for (const f of files) {
    let text = fs.readFileSync(f, 'utf8');
    let orig = text;
    let changed = false;

    // replace gradients (string literal occurrences)
    const grads = text.match(gradientPattern) || [];
    for (const g of grads) {
      const key = mapping.gradient[g];
      if (key) {
        // replace occurrences inside quotes
        const newExpr = `colors.gradients.${key}`;
        // only replace string literals: 'linear-gradient(...)' or "..."
        const quoted = [`'${g}'`, `"${g}"`];
        for (const q of quoted) {
          if (text.includes(q)) {
            text = text.split(q).join(newExpr);
            changed = true;
          }
        }
      } else {
        unknownColors.add(g);
      }
    }

    // replace hex literals
    let match;
    while ((match = hexPattern.exec(text))) {
      const raw = match[0];
      const hex = raw.toLowerCase();
      const key = mapping.hex[hex];
      if (key) {
        // replace only string-literal hex or css-like (#fff) inside quotes or inside style objects
        // We'll replace occurrences of '"#rrggbb"' or '#rrggbb' inside object values.
        // Conservative: replace all raw occurrences that are not in import paths.
        // Build replacement token
        const newExpr = `colors.${key}`;
        text = text.split(raw).join(newExpr);
        changed = true;
      } else {
        unknownColors.add(hex);
      }
    }

    // rgba handling: naive attempt - if we see rgba that matches a colors hex via rough compare, skip for now
    const rgs = Array.from(text.matchAll(rgbaPattern));
    for (const rg of rgs) {
      // keep as-is for dry-run and flag as unknown for manual review
      unknownColors.add(rg[0]);
    }

    if (changed) {
      // ensure import exists
      const importPath = computeImportPath(f);
      const importLineDefault = `import colors from '${importPath}';`;
      if (!text.includes("client-colors") && !text.includes(importLineDefault)) {
        // Insert after the first import block or at top
        const firstImportMatch = text.match(/(^|\n)(import .* from .*$)/m);
        if (firstImportMatch) {
          const idx = text.indexOf(firstImportMatch[2]);
          const insertAt = text.indexOf('\n', idx) + 1;
          text = text.slice(0, insertAt) + importLineDefault + '\n' + text.slice(insertAt);
        } else {
          text = importLineDefault + '\n' + text;
        }
      }

      proposals.push({ file: f, before: orig, after: text });
    }
  }

  // output summary
  // logging removed
  for (const p of proposals) {
  // logging removed for proposals
    // show a small diff-ish preview: lines with replacements
    const beforeLines = p.before.split(/\r?\n/);
    const afterLines = p.after.split(/\r?\n/);
    for (let i = 0; i < Math.min(beforeLines.length, afterLines.length); i++) {
      if (beforeLines[i] !== afterLines[i]) {
        // console output intentionally removed
      }
    }
  }

    if (unknownColors.size > 0) {
    // logging removed for unknown colors
  }

  if (!dryRun && proposals.length > 0) {
    for (const p of proposals) {
      fs.writeFileSync(p.file, p.after, 'utf8');
    }
  }

  return { proposals, unknown: Array.from(unknownColors) };
}

  if (require.main === module) {
  const argv = process.argv.slice(2);
  const apply = argv.includes('--apply');
  // logging removed
  const res = run(!apply);
}
