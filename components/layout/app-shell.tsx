import { Sidebar } from "@/components/layout/sidebar";
import styles from "./app-shell.module.css";

interface AppShellProps {
  children: React.ReactNode;
  variant?: "default" | "dashboard";
}

export function AppShell({ children, variant = "default" }: AppShellProps) {
  return (
    <div className={`${styles.shell} ${variant === "dashboard" ? styles.dashboard : ""}`}>
      <Sidebar variant={variant} />
      <main className={styles.main}>
        <div className={styles.inner}>
          {children}
        </div>
      </main>
    </div>
  );
}
