import { Sidebar } from "@/components/layout/sidebar";
import styles from "./app-shell.module.css";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.inner}>
          {children}
        </div>
      </main>
    </div>
  );
}
