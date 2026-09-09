import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { Root, Rule } from "postcss";

// Use the CSS parser shipped with Vite; no separate browser or dependency is needed.
const require = createRequire(import.meta.url);
const { parse } = createRequire(require.resolve("vite/package.json"))("postcss") as { parse: (css: string) => Root };
const css = (name: string) => parse(readFileSync(new URL(`../apps/web/src/${name}`, import.meta.url), "utf8"));
const themes = css("themes.css");

function palette(theme: "light" | "dark") {
  const tokens = new Map<string, string>();
  themes.walkRules(rule => {
    if (rule.parent?.type !== "root") return;
    if (rule.selector !== ":root" && !(theme === "dark" && rule.selector === ':root[data-theme="dark"]')) return;
    rule.walkDecls(decl => { if (decl.prop.startsWith("--")) tokens.set(decl.prop, decl.value); });
  });
  return (name: string) => {
    const value = tokens.get(name);
    assert.match(value ?? "", /^#[a-f\d]{6}$/i, `Missing color token: ${name}`);
    return value!;
  };
}

function luminance(hex: string) {
  return [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}

for (const theme of ["light", "dark"] as const) {
  test(`${theme} theme keeps body, action and selected-payment text at 4.5:1 contrast`, () => {
    const color = palette(theme);
    const pairs = [
      ["--text-primary", "--background"], ["--text-primary", "--surface"],
      ["--text-secondary", "--surface-secondary"], ["--on-primary", "--primary"],
      ["--on-primary", "--primary-hover"], ["--primary-hover", "--primary-soft"],
      ["--success", "--success-soft"], ["--red", "--red-soft"], ["--amber", "--amber-soft"]
    ];
    for (const [foreground, background] of pairs) {
      const values = [luminance(color(foreground)), luminance(color(background))];
      const ratio = (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
      assert.ok(ratio >= 4.5, `${theme} ${foreground}/${background}: ${ratio.toFixed(2)}`);
    }
    assert.notEqual(color("--background"), color("--surface"));
    assert.notEqual(color("--surface"), color("--surface-secondary"));
  });
}

test("selected payment uses the tested foreground and a visible check", () => {
  const sheet = css("checkout.css");
  const rules: Rule[] = [];
  sheet.walkRules(rule => { rules.push(rule); });
  const selected = rules.find(rule => rule.selector === '.checkout-method-picker .checkout-method[aria-pressed="true"]');
  assert.ok(selected?.nodes.some(node => node.type === "decl" && node.prop === "color" && node.value === "var(--primary-hover)"));
  assert.ok(rules.some(rule => rule.selector === '.checkout-method[aria-pressed="true"] .checkout-selection' && rule.nodes.some(node => node.type === "decl" && node.prop === "visibility" && node.value === "visible")));
});

test("shared typography has no viewport font scaling or heavy display weights", () => {
  for (const name of ["styles.css", "inventory3.css", "ui.css", "checkout.css", "management.css"]) {
    css(name).walkDecls(decl => {
      if (decl.prop === "font-size") assert.doesNotMatch(decl.value, /\b[\d.]+(?:vw|vi|vmin|vmax)\b/, name);
      if (decl.prop === "letter-spacing") assert.equal(decl.value, "0", name);
      if (decl.prop === "font-weight" && /^\d+$/.test(decl.value)) assert.ok(Number(decl.value) <= 700, name);
    });
  }
});

test("cash tabs keep a single four-column row and inactive panels stay hidden", () => {
  const sheet = css("management.css");
  const rules: Rule[] = [];
  sheet.walkRules(rule => { rules.push(rule); });
  const hidden = rules.find(rule => rule.selector === ".operations-pane[hidden]");
  assert.ok(hidden?.nodes.some(node => node.type === "decl" && node.prop === "display" && node.value === "none" && node.important));
  assert.ok(rules.some(rule => rule.selector === ".operations-tabs:has(> :nth-child(2):last-child)"));
  assert.ok(!rules.some(rule => rule.selector === ".operations-tabs:has(:nth-child(2):last-child)"));
});
