"use client";

import styles from "./input.module.css";
import { InputHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Visual variant of the input */
  variant?: "default" | "ghost";
  /** Size preset */
  size?: "sm" | "md" | "lg";
  /** Error message to display */
  error?: string;
  /** Optional leading icon */
  icon?: React.ReactNode;
  /** Optional label */
  label?: string;
}

const variantMap: Record<string, string> = {
  default: styles.variantDefault,
  ghost: styles.variantGhost,
};

const sizeMap: Record<string, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      error,
      icon,
      label,
      type,
      id,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const inputCls = [
      styles.base,
      variantMap[variant],
      sizeMap[size],
      icon && styles.pl9,
      isPassword && styles.pr9,
      error && styles.error,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {icon && <div className={styles.iconWrapper}>{icon}</div>}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={inputCls}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              className={styles.toggleBtn}
            >
              {showPassword ? (
                <EyeOff className={styles.toggleIcon} />
              ) : (
                <Eye className={styles.toggleIcon} />
              )}
            </button>
          )}
        </div>
        {error && <p className={styles.errorText}>{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
