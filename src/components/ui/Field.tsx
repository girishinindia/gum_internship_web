import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

function Label({ label, hint, required }: { label: string; hint?: string; required?: boolean }): JSX.Element {
  return (
    <span className="mb-1.5 flex items-center justify-between">
      <span className="text-body-sm font-medium text-neutral-700">{label}{required && <span className="text-danger-600"> *</span>}</span>
      {hint && <span className="text-caption text-neutral-400">{hint}</span>}
    </span>
  );
}

function Error({ error }: { error?: string }): JSX.Element | null {
  return error ? <span className="mt-1 block text-caption text-danger-700">{error}</span> : null;
}

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  label: string;
  hint?: string;
  error?: string;
  /** content shown left of the input, e.g. "/u/" */
  prefixLabel?: ReactNode;
}

export function Field({ label, hint, error, prefixLabel, className = '', required, ...rest }: FieldProps): JSX.Element {
  return (
    <label className="block">
      <Label label={label} hint={hint} required={required} />
      {prefixLabel ? (
        <span className={`flex items-center gap-1 rounded-xl border bg-white px-3 ${error ? 'border-danger-300' : 'border-neutral-200 focus-within:border-primary-400'}`}>
          <span className="text-body-sm text-neutral-400">{prefixLabel}</span>
          <input className="h-11 flex-1 bg-transparent outline-none" {...rest} />
        </span>
      ) : (
        <input className={`input ${error ? '!border-danger-300' : ''} ${className}`} {...rest} />
      )}
      <Error error={error} />
    </label>
  );
}

export function Textarea({ label, hint, error, className = '', required, ...rest }:
  { label: string; hint?: string; error?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>): JSX.Element {
  return (
    <label className="block">
      <Label label={label} hint={hint} required={required} />
      <textarea className={`input min-h-[96px] py-2.5 ${error ? '!border-danger-300' : ''} ${className}`} {...rest} />
      <Error error={error} />
    </label>
  );
}

export function Select({ label, hint, error, children, className = '', required, ...rest }:
  { label: string; hint?: string; error?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>): JSX.Element {
  return (
    <label className="block">
      <Label label={label} hint={hint} required={required} />
      <select className={`input appearance-none bg-white ${error ? '!border-danger-300' : ''} ${className}`} {...rest}>
        {children}
      </select>
      <Error error={error} />
    </label>
  );
}
