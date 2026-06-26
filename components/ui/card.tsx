import styles from "./card.module.css";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Subtle hover effect on the card */
  hover?: boolean;
}

function cls(...args: (string | undefined | false)[]) {
  return args.filter(Boolean).join(" ");
}

export function Card({ className, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cls(styles.card, hover && styles.hover, className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** When set, renders a bottom border separator */
  bordered?: boolean;
}

export function CardHeader({
  className,
  bordered = true,
  children,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cls(styles.header, bordered && styles.headerBordered, className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cls(styles.content, className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** When set, renders a top border separator */
  bordered?: boolean;
}

export function CardFooter({
  className,
  bordered = true,
  children,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={cls(styles.footer, bordered && styles.footerBordered, className)}
      {...props}
    >
      {children}
    </div>
  );
}

/* Convenience compound re-exports */
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;
