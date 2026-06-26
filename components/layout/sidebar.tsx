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

const navItems: NavItem[] = [
  { label: "Главная", href: "/", icon: LayoutDashboard },
  { label: "Задачи", href: "/tasks", icon: ListTodo },
  { label: "Календарь", href: "/calendar", icon: Calendar },
  { label: "Настройки", href: "/finance", icon: Settings2 },
  { label: "Расходы", href: "/expenses", icon: WalletCards },
  { label: "Хотелки", href: "/wishlist", icon: Heart },
  { label: "Отчёты", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className={styles.mobileHeader}>
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
          onClick={() => setIsOpen(true)}
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

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
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
          <p className={styles.navLabel}>Навигация</p>
          <ul className={styles.navList}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.link} ${active ? styles.linkActive : ""}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon
                      className={`${styles.icon} ${active ? styles.iconActive : ""}`}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.footer}>
          <p className={styles.footerText}>Без кабинета сотрудника. Только твои задачи, деньги и ритм работы.</p>
        </div>
      </aside>
    </>
  );
}
