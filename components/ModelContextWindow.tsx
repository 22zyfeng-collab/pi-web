"use client";

import { useId } from "react";
import { useI18n } from "@/hooks/useI18n";
import { parseContextWindow } from "@/lib/model-context";
import { ConfigButton } from "./SettingsUi";

export interface ModelContextSettings {
  overrides?: Record<string, unknown>;
  disabled: boolean;
  onChange: (modelId: string, value: string | undefined) => void;
}

/** Like custom-model fields, this edits the Models panel's draft, not the file. */
export function ModelContextWindow({ modelName, effective, value, onChange, disabled = false }: {
  modelName: string;
  effective?: number;
  value: unknown;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}) {
  const { t, locale } = useI18n();
  const id = useId();
  const invalid = value !== undefined && parseContextWindow(value) === undefined;
  return (
    <div className="model-context-field">
      <label htmlFor={id}>{t("models.contextWindow")}</label>
      <div className="model-context-controls">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value === undefined ? "" : String(value)}
          placeholder={t("models.contextDefault")}
          aria-label={t("models.contextForModel", { model: modelName })}
          aria-invalid={invalid || undefined}
          aria-describedby={`${id}-note`}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value === "" ? undefined : event.target.value)}
        />
        <ConfigButton size="small" disabled={disabled || value === undefined} onClick={() => onChange(undefined)}>
          {t("models.contextDefault")}
        </ConfigButton>
      </div>
      <span id={`${id}-note`} role={invalid ? "alert" : undefined} className={invalid ? "enabled-models-error" : "model-context-effective"}>
        {invalid ? t("models.contextInvalid", { model: modelName }) : effective === undefined ? "" : t("models.contextEffective", { tokens: effective.toLocaleString(locale) })}
      </span>
    </div>
  );
}
