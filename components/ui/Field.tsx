import { ReactNode } from "react";

export function FormRow({
  label,
  required = false,
  help,
  children,
}: {
  label: string;
  required?: boolean;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className="form-row">
      <label>
        {label} {required && <span className="req">*</span>}
      </label>
      {children}
      {help && <div className="help">{help}</div>}
    </div>
  );
}
