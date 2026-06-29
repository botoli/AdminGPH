"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, PiggyBank, ShoppingBag } from "lucide-react";
import { setWishlistAllocation } from "@/actions/wishlist-actions";
import { formatCurrency } from "@/lib/utils";
import styles from "./dashboard-wishlist-plan.module.css";

export interface DashboardWishlistItem {
  id: string;
  title: string;
  amount: number;
  kind: string;
  savedAmount: number;
  allocationAmount: number;
  remainingAmount: number;
  completed: boolean;
}

interface DashboardWishlistPlanProps {
  freeCash: number;
  items: DashboardWishlistItem[];
  monthName: string;
  editable: boolean;
}

export function DashboardWishlistPlan({ freeCash, items, monthName, editable }: DashboardWishlistPlanProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [allocations, setAllocations] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.allocationAmount])),
  );
  const active = items.filter((item) => !item.completed);
  const purchases = active.filter((item) => item.kind !== "SAVINGS");
  const savings = active.filter((item) => item.kind === "SAVINGS");
  const selectedTotal = useMemo(
    () => Object.values(allocations).reduce((sum, amount) => sum + amount, 0),
    [allocations],
  );
  const afterWishlist = freeCash - selectedTotal;

  const allocate = (item: DashboardWishlistItem, amount: number) => {
    if (!editable || pending) return;
    const previous = allocations[item.id] ?? 0;
    const safeAmount = Math.max(0, amount);
    setError("");
    setAllocations((current) => ({ ...current, [item.id]: safeAmount }));

    const data = new FormData();
    data.set("id", item.id);
    data.set("amount", String(safeAmount));
    startTransition(async () => {
      try {
        await setWishlistAllocation(data);
        router.refresh();
      } catch (reason) {
        setAllocations((current) => ({ ...current, [item.id]: previous }));
        setError(reason instanceof Error ? reason.message : "Не удалось изменить план хотелок");
      }
    });
  };

  return (
    <section className={styles.card} aria-labelledby="dashboard-wishlist-title">
      <div className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.headingIcon}><ShoppingBag aria-hidden="true" /></span>
          <div>
            <h2 id="dashboard-wishlist-title">План хотелок на {monthName}</h2>
            <p>Распределите свободные деньги, не покидая главную.</p>
          </div>
        </div>
        <Link href="/wishlist" prefetch={false} className={styles.openLink}>
          Управление хотелками <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <div className={styles.summary} aria-label="Баланс хотелок">
        <div><span>Свободно</span><strong>{formatCurrency(freeCash)}</strong></div>
        <div><span>Выбрано</span><strong>{formatCurrency(selectedTotal)}</strong></div>
        <div className={afterWishlist < 0 ? styles.summaryDanger : styles.summaryPositive}>
          <span>Останется</span><strong>{formatCurrency(afterWishlist)}</strong>
        </div>
      </div>
      <div className={styles.track} aria-hidden="true">
        <div style={{ width: `${Math.min(100, Math.max(0, (selectedTotal / Math.max(freeCash, 1)) * 100))}%` }} />
      </div>

      {!editable ? <p className={styles.readOnly}>Изменения доступны только в текущем месяце.</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      {active.length === 0 ? (
        <div className={styles.empty}>Активных хотелок пока нет. Добавьте покупку или накопительную цель в разделе «Хотелки».</div>
      ) : (
        <div className={styles.columns}>
          <div className={styles.group}>
            <div className={styles.groupTitle}>
              <ShoppingBag aria-hidden="true" />
              <div><h3>Покупки</h3><p>Выберите то, что хотите зарезервировать на месяц.</p></div>
            </div>
            <div className={styles.list}>
              {purchases.length === 0 ? <p className={styles.groupEmpty}>Обычных покупок пока нет.</p> : purchases.map((item) => {
                const allocation = allocations[item.id] ?? 0;
                const selected = allocation > 0;
                const availableForItem = Math.max(0, afterWishlist + allocation);
                const shortage = Math.max(0, item.amount - availableForItem);
                const disabled = !editable || pending || (!selected && shortage > 0);
                return (
                  <article className={`${styles.purchase} ${selected ? styles.selected : ""}`} key={item.id}>
                    <button
                      type="button"
                      className={styles.check}
                      aria-label={selected ? `Убрать ${item.title} из плана` : `Выбрать ${item.title} на месяц`}
                      aria-pressed={selected}
                      disabled={disabled}
                      onClick={() => allocate(item, selected ? 0 : item.amount)}
                    >
                      {selected ? <Check aria-hidden="true" /> : null}
                    </button>
                    <div className={styles.itemCopy}>
                      <strong>{item.title}</strong>
                      <span>{selected ? `Выбрано на ${monthName}` : shortage > 0 ? `Не хватает ${formatCurrency(shortage)}` : "Можно выбрать"}</span>
                    </div>
                    <b>{formatCurrency(item.amount)}</b>
                    {editable ? (
                      <button
                        type="button"
                        className={styles.textButton}
                        disabled={pending || (!selected && shortage > 0)}
                        onClick={() => allocate(item, selected ? 0 : item.amount)}
                      >
                        {selected ? "Убрать" : "Выбрать"}
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>

          <div className={styles.group}>
            <div className={styles.groupTitle}>
              <PiggyBank aria-hidden="true" />
              <div><h3>Копилки хотелок</h3><p>Откладывайте частями на крупные цели.</p></div>
            </div>
            <div className={styles.list}>
              {savings.length === 0 ? <p className={styles.groupEmpty}>Накопительных целей пока нет.</p> : savings.map((item) => (
                <SavingsGoal
                  key={item.id}
                  item={item}
                  allocation={allocations[item.id] ?? 0}
                  available={Math.max(0, afterWishlist + (allocations[item.id] ?? 0))}
                  editable={editable}
                  pending={pending}
                  onAllocate={(amount) => allocate(item, amount)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SavingsGoal({ item, allocation, available, editable, pending, onAllocate }: {
  item: DashboardWishlistItem;
  allocation: number;
  available: number;
  editable: boolean;
  pending: boolean;
  onAllocate: (amount: number) => void;
}) {
  const baseSaved = Math.max(0, item.savedAmount - item.allocationAmount);
  const saved = Math.min(item.amount, baseSaved + allocation);
  const remaining = Math.max(0, item.amount - saved);
  const [value, setValue] = useState("");
  const numericValue = Number(value);
  const addable = Math.min(Math.max(0, available - allocation), remaining);
  const invalid = !Number.isFinite(numericValue) || numericValue <= 0 || numericValue > addable;

  return (
    <article className={styles.goal}>
      <div className={styles.goalTop}>
        <div><strong>{item.title}</strong><span>Цель {formatCurrency(item.amount)}</span></div>
        <b>{formatCurrency(saved)}</b>
      </div>
      <div className={styles.goalTrack} aria-hidden="true"><div style={{ width: `${Math.min(100, (saved / Math.max(item.amount, 1)) * 100)}%` }} /></div>
      <div className={styles.goalMeta}><span>Накоплено {formatCurrency(saved)}</span><span>Осталось {formatCurrency(remaining)}</span></div>
      {editable && remaining > 0 ? (
        <>
          <div className={styles.goalControls}>
            <label>
              <span>Внести дополнительно</span>
              <div>
                <input
                  type="number"
                  min="1"
                  max={addable}
                  step="1"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder="0"
                />
                <em>₽</em>
              </div>
            </label>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={pending || invalid}
              onClick={() => { onAllocate(allocation + numericValue); setValue(""); }}
            >
              Отложить
            </button>
          </div>
          <div className={styles.goalActions}>
            <button type="button" disabled={pending || addable <= 0} onClick={() => { setValue(""); onAllocate(allocation + addable); }}>
              Отложить весь остаток · {formatCurrency(addable)}
            </button>
            {allocation > 0 ? (
              <button type="button" className={styles.removeButton} disabled={pending} onClick={() => { setValue(""); onAllocate(0); }}>
                Снять резерв
              </button>
            ) : null}
          </div>
          {value && numericValue > addable ? <p className={styles.inlineError}>Не хватает {formatCurrency(numericValue - addable)}</p> : null}
        </>
      ) : null}
    </article>
  );
}
