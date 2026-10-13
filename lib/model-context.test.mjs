import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const { withContextWindowOverride, normalizeContextWindowOverrides } = await jiti.import("./model-context.ts");

test("editing a login model's context preserves provider credentials, other overrides and custom models", () => {
  const original = {
    providers: {
      "openai-codex": {
        headers: { "x-example": "keep" },
        modelOverrides: { "gpt-6-astra": { maxTokens: 128000 }, other: { contextWindow: 200000 } },
      },
      custom: { apiKey: "$EXAMPLE_KEY", models: [{ id: "custom-model", contextWindow: 1000000 }] },
    },
  };
  const draft = withContextWindowOverride(original, "openai-codex", "gpt-6-astra", "500000");
  const saved = normalizeContextWindowOverrides(draft);
  assert.deepEqual(saved.providers["openai-codex"], {
    headers: { "x-example": "keep" },
    modelOverrides: { "gpt-6-astra": { maxTokens: 128000, contextWindow: 500000 }, other: { contextWindow: 200000 } },
  });
  assert.deepEqual(saved.providers.custom, original.providers.custom);
  assert.equal(original.providers["openai-codex"].modelOverrides["gpt-6-astra"].contextWindow, undefined);
});

test("reset removes only the context override and cleans up containers it leaves empty", () => {
  const config = { providers: { login: { modelOverrides: {
    a: { contextWindow: 500000, maxTokens: 128000 }, b: { contextWindow: 500000 },
  } } } };
  const reset = withContextWindowOverride(config, "login", "a", undefined);
  assert.deepEqual(reset.providers.login.modelOverrides.a, { maxTokens: 128000 });
  assert.deepEqual(withContextWindowOverride({ providers: { login: { modelOverrides: { b: { contextWindow: 500000 } } } } }, "login", "b", undefined), { providers: {} });
  assert.deepEqual(withContextWindowOverride({ providers: {} }, "login", "missing", undefined), { providers: {} });
});

test("invalid context budgets cannot be saved, including fractions, overflow and partial numeric strings", () => {
  for (const value of [0, -1, 1.5, null, true, "", "500k", "500000junk", "1e6", "0x100", "1.5", NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => normalizeContextWindowOverrides({ providers: { login: { modelOverrides: { model: { contextWindow: value } } } } }), /positive safe integer/);
  }
  const normalized = normalizeContextWindowOverrides({ providers: { login: { modelOverrides: { model: { contextWindow: " 1050000 " } } } } });
  assert.equal(normalized.providers.login.modelOverrides.model.contextWindow, 1050000);
});
