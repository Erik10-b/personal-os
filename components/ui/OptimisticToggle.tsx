"use client";

import { useActionState, useId, useOptimistic } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";

export function OptimisticToggle({ action, values, checked, field = "done", label, className = "checkbox", checkedClass = "checked", style, title }: {
  action: (data: FormData) => Promise<void>;
  values: Record<string, string>;
  checked: boolean;
  field?: "done" | "checked";
  label: string;
  className?: string;
  checkedClass?: string;
  style?: CSSProperties;
  title?: string;
}) {
  const [optimisticChecked, setOptimisticChecked] = useOptimistic(checked);
  const errorId = useId();
  const [error, formAction, pending] = useActionState<string | null, FormData>(async (_previous, data) => {
    setOptimisticChecked(!checked);
    try {
      await action(data);
      return null;
    } catch {
      return "Nicht gespeichert. Die Änderung wurde zurückgenommen. Bitte erneut versuchen.";
    }
  }, null);

  return <>
    <form action={formAction} className="instant-toggle" style={style} aria-busy={pending}>
      {Object.entries(values).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>)}
      <input type="hidden" name={field} value={String(checked)}/>
      <button type="submit" className={`${className}${optimisticChecked ? ` ${checkedClass}` : ""}${error && !pending ? " save-failed" : ""}`} aria-label={`${label} ${optimisticChecked ? "zurücksetzen" : "erledigen"}`} aria-pressed={optimisticChecked} aria-describedby={error && !pending ? errorId : undefined} disabled={pending} title={title}>
        {pending && <span className="toggle-saving" aria-hidden="true"/>}
      </button>
    </form>
    {error && !pending && createPortal(<div id={errorId} className="mutation-error" role="alert"><strong>{label}</strong><span>{error}</span></div>, document.body)}
  </>;
}