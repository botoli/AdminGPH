"use client";

import styles from "./dialog.module.css";
import { X } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type MouseEvent,
} from "react";

// ── Context ──────────────────────────────────────────────────────────────────

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("Dialog compound components must be rendered inside <Dialog>");
  return ctx;
}

function cls(...args: (string | undefined)[]) {
  return args.filter(Boolean).join(" ");
}

// ── Root ─────────────────────────────────────────────────────────────────────

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open: controlledOpen, onOpenChange, children }: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalOpen(value);
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange],
  );

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

// ── Overlay ──────────────────────────────────────────────────────────────────

export function DialogOverlay({ className }: { className?: string }) {
  const { setOpen } = useDialog();
  return (
    <div
      className={cls(styles.overlay, className)}
      onClick={() => setOpen(false)}
    />
  );
}

// ── Content ──────────────────────────────────────────────────────────────────

interface DialogContentProps {
  className?: string;
  children: ReactNode;
}

export function DialogContent({ className, children }: DialogContentProps) {
  const { setOpen } = useDialog();
  const contentRef = useRef<HTMLDivElement>(null);

  function handleClick(e: MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div className={styles.contentOuter} onClick={() => setOpen(false)}>
      <div
        ref={contentRef}
        onClick={handleClick}
        className={cls(styles.contentInner, className)}
      >
        {children}
      </div>
    </div>
  );
}

// ── Header ───────────────────────────────────────────────────────────────────

interface DialogHeaderProps {
  className?: string;
  children: ReactNode;
  showClose?: boolean;
}

export function DialogHeader({
  className,
  children,
  showClose = true,
}: DialogHeaderProps) {
  const { setOpen } = useDialog();
  return (
    <div className={cls(styles.header, className)}>
      <div className={styles.headerBody}>{children}</div>
      {showClose && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={styles.closeBtn}
        >
          <X className={styles.closeIcon} />
          <span className={styles.srOnly}>Close</span>
        </button>
      )}
    </div>
  );
}

export function DialogTitle({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <h2 className={cls(styles.title, className)}>{children}</h2>;
}

export function DialogDescription({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <p className={cls(styles.description, className)}>{children}</p>;
}

export function DialogBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cls(styles.body, className)}>{children}</div>;
}

export function DialogFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cls(styles.footer, className)}>{children}</div>;
}

// ── Compound convenience ─────────────────────────────────────────────────────

Dialog.Overlay = DialogOverlay;
Dialog.Content = DialogContent;
Dialog.Header = DialogHeader;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Body = DialogBody;
Dialog.Footer = DialogFooter;