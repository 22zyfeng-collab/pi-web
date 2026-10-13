/** Client/server helpers for the model directory's context-window overrides. */
export interface ModelContextConfig {
  providers?: Record<string, { modelOverrides?: Record<string, unknown> }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function withContextWindowOverride<T extends ModelContextConfig>(
  config: T,
  providerId: string,
  modelId: string,
  value: string | number | undefined,
): T {
  const providers = { ...config.providers };
  const provider = { ...(Object.hasOwn(providers, providerId) ? providers[providerId] : {}) };
  const modelOverrides = { ...provider.modelOverrides };
  const previous = Object.hasOwn(modelOverrides, modelId) ? modelOverrides[modelId] : undefined;
  if (previous !== undefined && !isRecord(previous)) throw new Error("Model override must be an object");
  const override: Record<string, unknown> = { ...previous as Record<string, unknown> | undefined };
  if (value === undefined) delete override.contextWindow;
  else override.contextWindow = value;
  if (Object.keys(override).length) Object.defineProperty(modelOverrides, modelId, { value: override, enumerable: true, configurable: true });
  else delete modelOverrides[modelId];
  if (Object.keys(modelOverrides).length) provider.modelOverrides = modelOverrides;
  else delete provider.modelOverrides;
  if (Object.keys(provider).length) Object.defineProperty(providers, providerId, { value: provider, enumerable: true, configurable: true });
  else delete providers[providerId];
  return { ...config, providers };
}

export class ContextWindowError extends Error {
  constructor() {
    super("Context window must be a positive safe integer (tokens)");
    this.name = "ContextWindowError";
  }
}

export function parseContextWindow(value: unknown): number {
  const parsed = typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value.trim()) : value;
  if (typeof parsed !== "number" || !Number.isSafeInteger(parsed) || parsed <= 0) throw new ContextWindowError();
  return parsed;
}

export function normalizeContextWindowOverrides<T extends ModelContextConfig>(config: T): T {
  const result = structuredClone(config);
  if (!isRecord(result.providers)) return result;
  for (const provider of Object.values(result.providers)) {
    if (!isRecord(provider) || !isRecord(provider.modelOverrides)) continue;
    for (const override of Object.values(provider.modelOverrides)) {
      if (isRecord(override) && Object.hasOwn(override, "contextWindow")) {
        override.contextWindow = parseContextWindow(override.contextWindow);
      }
    }
  }
  return result;
}
