import styles from "./badge.module.css";
import { HTMLAttributes } from "react";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "new"
  | "planned"
  | "in_progress"
  | "completed"
  | "paid"
  | "destructive";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

const variantMap: Record<BadgeVariant, string> = {
  default: styles.default,
  secondary: styles.secondary,
  outline: styles.outline,
  new: styles.new,
  planned: styles.planned,
  in_progress: styles.in_progress,
  completed: styles.completed,
  paid: styles.paid,
  destructive: styles.destructive,
};

const sizeMap: Record<string, string> = {
  sm: styles.sm,
  md: styles.md,
};

const labelMap: Record<BadgeVariant, string> = {
  default: "",
  secondary: "",
  outline: "",
  new: "NEW",
  planned: "PLANNED",
  in_progress: "IN PROGRESS",
  completed: "COMPLETED",
  paid: "PAID",
  destructive: "",
};

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const label = children ?? labelMap[variant] ?? null;

  const cls = [styles.badge, variantMap[variant], sizeMap[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cls} {...props}>
      {label}
    </span>
  );
}

export { type BadgeVariant };
