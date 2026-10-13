import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { tsconfigPaths: true, jsx: { runtime: "automatic" } });
const { ModelContextWindow } = await jiti.import("./ModelContextWindow.tsx");
const { I18nProvider } = await jiti.import("@/hooks/useI18n");

function render(value) {
  return renderToStaticMarkup(createElement(I18nProvider, null,
    createElement(ModelContextWindow, { modelName: "GPT Example", effective: 272000, value, onChange() {} })));
}

test("a login model exposes a labeled context input and its currently effective value", () => {
  const html = render("500000");
  assert.match(html, /value="500000"/);
  assert.match(html, /inputmode="numeric"/i);
  assert.match(html, /GPT Example/);
  assert.match(html, /272,000/);
});

test("an invalid draft is visible without truncating it to a different context size", () => {
  const html = render("500k");
  assert.match(html, /value="500k"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /role="alert"/);
});
