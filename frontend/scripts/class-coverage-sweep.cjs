/**
 * Class-coverage sweep: extracts utility-like class tokens from src/ and
 * verifies each appears in the compiled Tailwind CSS. Catches classes that
 * silently fail to generate (bad opacity values, missing scale entries, etc).
 * Usage: node scripts/class-coverage-sweep.cjs
 */
const fs = require("fs");
const path = require("path");

const tokens = new Set();
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(e.name)) {
      const src = fs.readFileSync(p, "utf8");
      const strs = src.match(/["'`][^"'`\n]+["'`]/g) || [];
      for (const s of strs) {
        const inner = s.slice(1, -1);
        if (inner.includes("${")) continue; // dynamically composed
        for (const tok of inner.split(/\s+/)) {
          if (tok.length < 3) continue;
          if (/^[a-z][a-z0-9./:\[\]\-%]*$/.test(tok) && (tok.includes("-") || tok.includes("/") || tok.includes(":"))) {
            tokens.add(tok);
          }
        }
      }
    }
  }
};
walk(path.join(process.cwd(), "src"));

let css = "";
const cssDir = path.join(process.cwd(), ".next/static/css");
for (const f of fs.readdirSync(cssDir)) {
  css += fs.readFileSync(path.join(cssDir, f), "utf8");
}

const variants = ["hover:", "group-hover:", "dark:", "sm:", "md:", "lg:", "focus-visible:", "sm:hover:"];
const misses = [];
for (const t of tokens) {
  let base = t;
  for (const v of variants) if (base.startsWith(v)) base = base.slice(v.length);
  const baseNoSlash = base.includes("/") ? base.split("/").slice(0, -1).join("/") : base;
  let found = false;
  for (const c of [...new Set([base, baseNoSlash])]) {
    const esc = c.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
    if (new RegExp('[.\\s"]' + esc + "([\\\\/:\\[\\]\\s]|$)").test(css)) {
      found = true;
      break;
    }
  }
  if (!found) misses.push(t);
}

console.log("total tokens:", tokens.size);
console.log("missing from compiled CSS:", misses.length);
for (const m of misses) console.log("  -", m);
