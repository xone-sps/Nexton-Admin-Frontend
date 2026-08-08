"use client";

import { useEffect, useState } from "react";
import { Form } from "antd";
import type { FormInstance } from "antd";

/**
 * Returns true when the form passes silent validation against its current values.
 * Wraps the antd v5 documented pattern of `Form.useWatch` + `validateFields({validateOnly:true})`.
 *
 * Pass `initiallyEnabled: true` for Edit modals that open pre-filled with valid data,
 * so the submit button does not flash disabled before the first `useWatch` tick.
 */
export function useFormSubmittable<T extends object = Record<string, unknown>>(
  form: FormInstance<T>,
  options?: { initiallyEnabled?: boolean }
): boolean {
  const values = Form.useWatch([], form);
  const [ok, setOk] = useState(!!options?.initiallyEnabled);

  useEffect(() => {
    form
      .validateFields({ validateOnly: true })
      .then(() => setOk(true))
      .catch(() => setOk(false));
  }, [form, values]);

  return ok;
}
