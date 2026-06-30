"use client";

import styles from "./sidebar.module.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  BarChart3,
  WalletCards,
  FileUpIcon,
  Heart,
  Settings2,
  BriefcaseBusiness,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const navGroups: { label?: string; items: NavItem[] }[] = [
  { items: [{ label: "Панель месяца", href: "/", icon: LayoutDashboard }] },
  {
    label: "Работа",
    items: [
      { label: "Задачи", href: "/tasks", icon: ListTodo },
      { label: "Календарь", href: "/calendar", icon: Calendar },
      { label: "Отчёты", href: "/reports", icon: FileUpIcon },
    ],
  },
  {
    label: "Финансы",
    items: [
      { label: "Расходы", href: "/expenses", icon: WalletCards },
      { label: "Хотелки", href: "/wishlist", icon: Heart },
    ],
  },
  {
    label: "Система",
    items: [{ label: "Настройки", href: "/finance", icon: Settings2 }],
  },
];

interface SidebarProps {
  variant?: "default" | "dashboard";
}

export function Sidebar({ variant = "default" }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const isDashboard = variant === "dashboard";

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className={`${styles.mobileHeader} ${isDashboard ? styles.dashboardMobileHeader : ""}`}
      >
        <div className={styles.mobileBrand}>
          <div className={styles.logo}>
            <BriefcaseBusiness className={styles.logoIcon} />
          </div>
          <div className={styles.brandCopy}>
            <span className={styles.brandText}>Подрядчик</span>
            <span className={styles.brandMeta}>Личный пульт</span>
          </div>
        </div>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="Открыть меню"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <Menu className={styles.menuIcon} />
        </button>
      </header>

      {isOpen ? (
        <button
          type="button"
          className={styles.mobileOverlay}
          aria-label="Закрыть меню"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <aside
        className={`${styles.sidebar} ${isDashboard ? styles.dashboardSidebar : ""} ${isOpen ? styles.sidebarOpen : ""}`}
        aria-label="Основная навигация"
      >
        <div className={styles.brand}>
          <div className={styles.logo}>
            <BriefcaseBusiness className={styles.logoIcon} />
          </div>
          <div className={styles.brandCopy}>
            <span className={styles.brandText}>Подрядчик</span>
            <span className={styles.brandMeta}>Личный пульт управления</span>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Закрыть меню"
            onClick={() => setIsOpen(false)}
          >
            <X className={styles.menuIcon} />
          </button>
        </div>

        <nav className={styles.nav}>
          {navGroups.map((group) => (
            <div className={styles.navGroup} key={group.label ?? "home"}>
              {group.label ? (
                <p className={styles.navLabel}>{group.label}</p>
              ) : null}
              <ul className={styles.navList}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        prefetch={false}
                        className={`${styles.link} ${active ? styles.linkActive : ""}`}
                        aria-label={item.label}
                        aria-current={active ? "page" : undefined}
                        title={isDashboard ? item.label : undefined}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon
                          className={`${styles.icon} ${active ? styles.iconActive : ""}`}
                        />
                        <span className={styles.linkLabel}>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Текущий месяц: заработано, распределено, осталось.
          </p>
        </div>
      </aside>
    </>
  );
}
