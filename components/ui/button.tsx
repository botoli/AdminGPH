import styles from "./button.module.css";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

const variantClassMap = {
  default: styles.default,
  outline: styles.outline,
  ghost: styles.ghost,
  destructive: styles.destructive,
};

const sizeClassMap = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const cls = [styles.base, variantClassMap[variant], sizeClassMap[size], className]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={cls}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
