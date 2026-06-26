"use client";

import styles from "./select.module.css";
import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Error message */
  error?: string;
  /** Label text */
  label?: string;
  /** Options */
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  /** Placeholder option */
  placeholder?: string;
}

const sizeMap: Record<string, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

const chevronMap: Record<string, string> = {
  sm: styles.chevronSm,
  md: styles.chevronMd,
  lg: styles.chevronLg,
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, size = "md", error, label, options, placeholder, id, ...props },
    ref,
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const selectCls = [styles.base, sizeMap[size], error && styles.error, className]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.selectWrapper}>
          <select ref={ref} id={selectId} className={selectCls} {...props}>
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className={`${styles.chevron} ${chevronMap[size]}`} />
        </div>
        {error && <p className={styles.errorText}>{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
