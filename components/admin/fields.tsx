"use client";

import { ReactNode } from "react";

export function FieldWrap({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block mb-5">
      <span className="block text-sm font-medium text-neutral-300 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-neutral-500 mt-1">{hint}</span>}
    </label>
  );
}

export function TextField({
  label, value, onChange, placeholder, hint,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  return (
    <FieldWrap label={label} hint={hint}>
      <input
        type="text"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500"
      />
    </FieldWrap>
  );
}

export function TextAreaField({
  label, value, onChange, rows = 4, placeholder, hint,
}: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; hint?: string }) {
  return (
    <FieldWrap label={label} hint={hint}>
      <textarea
        value={value ?? ""}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500 resize-y"
      />
    </FieldWrap>
  );
}

export function ToggleField({
  label, value, onChange, hint,
}: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-center justify-between border border-neutral-800 rounded-md px-4 py-3 mb-5">
      <div>
        <p className="text-sm font-medium text-neutral-300">{label}</p>
        {hint && <p className="text-xs text-neutral-500 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-orange-500" : "bg-neutral-700"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function SelectField({
  label, value, onChange, options, hint,
}: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; hint?: string }) {
  return (
    <FieldWrap label={label} hint={hint}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </FieldWrap>
  );
}
