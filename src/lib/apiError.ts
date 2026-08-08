import axios from "axios";
import type { FormInstance } from "antd";

type BackendError = {
  code?: string;
  message?: string;
  details?: Record<string, string | string[]>;
};

type BackendEnvelope = {
  error?: BackendError;
};

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as BackendEnvelope | undefined;
    if (data?.error?.message) return data.error.message;
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

// Maps a backend VALIDATION_ERROR response onto antd Form fields.
// Returns true if validation field errors were applied, false otherwise
// (caller should then show a toast/alert with getApiErrorMessage).
export function applyApiErrorToForm(err: unknown, form: FormInstance): boolean {
  if (!axios.isAxiosError(err)) return false;
  const data = err.response?.data as BackendEnvelope | undefined;
  const backendError = data?.error;
  if (!backendError || backendError.code !== "VALIDATION_ERROR") return false;
  const details = backendError.details;
  if (!details || typeof details !== "object") return false;

  const fields = Object.entries(details).map(([name, errors]) => ({
    name,
    errors: Array.isArray(errors) ? errors : [String(errors)],
  }));
  if (fields.length === 0) return false;

  form.setFields(fields);
  return true;
}
