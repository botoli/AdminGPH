"use client";

import styles from "./sidebar.module.css";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  LayoutDashboard,
  ListTodo,
  Calendar,
  WalletCards,
  FileUpIcon,
  Heart,
  Settings2,
  BriefcaseBusiness,
  Menu,
  X,
  SquareArrowRightIcon,
  SquareArrowLeftIcon,
} from "lucide-react";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { getMonthValue, resolveSelectedMonthDate } from "@/lib/selected-month";

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

const SIDEBAR_COLLAPSED_KEY = "admingph.sidebar.collapsed";
const SIDEBAR_COLLAPSED_EVENT = "admingph:sidebar-collapsed";

function subscribeToCollapsedState(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SIDEBAR_COLLAPSED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SIDEBAR_COLLAPSED_EVENT, onStoreChange);
  };
}

function getCollapsedSnapshot() {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
}

function getServerCollapsedSnapshot() {
  return false;
}

export function Sidebar({ variant = "default" }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const isDashboard = variant === "dashboard";
  const storedCollapsedState = useSyncExternalStore(
    subscribeToCollapsedState,
    getCollapsedSnapshot,
    getServerCollapsedSnapshot,
  );
  const isCollapsed = isDashboard && storedCollapsedState;
  const selectedMonth = searchParams.get("month");
  const monthDate = resolveSelectedMonthDate(selectedMonth);
  const monthValue = getMonthValue(monthDate);
  const monthLabel = new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(monthDate);
  const monthTitle = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

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

  const getNavHref = (href: string) => {
    return `${href}?month=${monthValue}`;
  };

  const toggleCollapsed = () => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isCollapsed ? "0" : "1");
    window.dispatchEvent(new Event(SIDEBAR_COLLAPSED_EVENT));
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
        className={`${styles.sidebar} ${isDashboard ? styles.dashboardSidebar : ""} ${isDashboard && isCollapsed ? styles.dashboardSidebarCollapsed : ""} ${isOpen ? styles.sidebarOpen : ""}`}
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
          {isDashboard ? (
            <button
              type="button"
              className={styles.collapseButton}
              aria-label={
                isCollapsed ? "Развернуть сайдбар" : "Свернуть сайдбар"
              }
              aria-pressed={isCollapsed}
              onClick={toggleCollapsed}
            >
              {isCollapsed ? (
                <SquareArrowRightIcon className={styles.menuIcon} />
              ) : (
                <SquareArrowLeftIcon className={styles.menuIcon} />
              )}
            </button>
          ) : null}
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Закрыть меню"
            onClick={() => setIsOpen(false)}
          >
            <X className={styles.menuIcon} />
          </button>
        </div>

        <div className={styles.monthSelector}>
          <MonthSelector
            value={monthValue}
            label={monthTitle}
            storageKey="admingph.selected-month"
            compact={isDashboard && isCollapsed}
          />
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
                        href={getNavHref(item.href)}
                        prefetch={false}
                        className={`${styles.link} ${active ? styles.linkActive : ""}`}
                        aria-label={item.label}
                        aria-current={active ? "page" : undefined}
                        title={
                          isDashboard && isCollapsed ? item.label : undefined
                        }
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
            Выбранный месяц применяется на всех страницах.
          </p>
        </div>
      </aside>
    </>
  );
}
