"use client";

import styles from "./switch.module.css";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  label?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, className, label, ...props }, ref) => {
    const cls = [styles.switch, checked && styles.checked, className]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        {...props}
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={cls}
      >
        <span className={styles.thumb} />
      </button>
    );
  },
);

Switch.displayName = "Switch";
