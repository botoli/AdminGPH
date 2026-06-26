"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createWishlistItem, deleteWishlistItem, updateWishlistItem } from "@/actions/wishlist-actions";
import { formatCurrency } from "@/lib/utils";
import styles from "./wishlist-planner.module.css";
import { PiggyBank, Sparkles, Trash2 } from "lucide-react";

export interface WishlistViewItem {
  id: string;
  title: string;
  amount: number;
  additionalIncomeNeeded: number;
  monthsToReach: number | null;
}

interface WishlistPlannerProps {
  freeCash: number;
  items: WishlistViewItem[];
}

export function WishlistPlanner({ freeCash, items }: WishlistPlannerProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className={styles.layout}>
      <Card className={styles.heroCard}>
        <Card.Content className={styles.heroContent}>
          <div>
            <p className={styles.eyebrow}>Хотелки</p>
            <h1 className={styles.title}>Список желаний с реальной аналитикой</h1>
            <p className={styles.subtitle}>Аналитика строится от свободного остатка после обязательных расходов и копилок.</p>
          </div>
          <div className={styles.heroMetric}>
            <PiggyBank className={styles.heroIcon} />
            <p className={styles.heroLabel}>Свободно в месяц</p>
            <p className={styles.heroValue}>{formatCurrency(freeCash)}</p>
            <p className={styles.heroHint}>Доход - расходы - копилки</p>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <h2 className={styles.sectionTitle}>Добавить хотелку</h2>
        </Card.Header>
        <Card.Content>
          <form
            className={styles.createForm}
            action={(formData) =>
              startTransition(async () => {
                await createWishlistItem(formData);
                setNewTitle("");
                setNewAmount("");
              })
            }
          >
            <Input
              label="Название"
              name="title"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
            />
            <Input
              label="Сумма"
              name="amount"
              type="number"
              min="1"
              step="1"
              value={newAmount}
              onChange={(event) => setNewAmount(event.target.value)}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? "Добавляю..." : "Добавить"}
            </Button>
          </form>
        </Card.Content>
      </Card>

      <div className={styles.list}>
        {items.length === 0 ? (
          <Card>
            <Card.Content className={styles.emptyState}>
              <Sparkles className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>Пока нет хотелок</p>
              <p className={styles.emptyText}>Добавь первую покупку, и я сразу посчитаю срок закрытия.</p>
            </Card.Content>
          </Card>
        ) : (
          items.map((item) => (
            <WishlistItemCard key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  );
}

function WishlistItemCard({ item }: { item: WishlistViewItem }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card className={styles.itemCard}>
      <Card.Content className={styles.itemContent}>
        <form
          className={styles.editForm}
          action={(formData) =>
            startTransition(async () => {
              await updateWishlistItem(formData);
            })
          }
        >
          <input type="hidden" name="id" value={item.id} />
          <div className={styles.editFields}>
            <Input label="Название" name="title" defaultValue={item.title} />
            <Input label="Сумма" name="amount" type="number" min="1" step="1" defaultValue={item.amount} />
          </div>
          <div className={styles.analytics}>
            <div className={styles.analyticsBlock}>
              <p className={styles.analyticsLabel}>Нужно добрать в месяц</p>
              <p className={styles.analyticsValue}>{formatCurrency(item.additionalIncomeNeeded)}</p>
            </div>
            <div className={styles.analyticsBlock}>
              <p className={styles.analyticsLabel}>Срок закрытия</p>
              <p className={styles.analyticsValue}>
                {item.monthsToReach === null ? "Пока не хватает свободного остатка" : `${item.monthsToReach} мес.`}
              </p>
            </div>
          </div>
          <div className={styles.rowActions}>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Сохраняю..." : "Сохранить"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await deleteWishlistItem(item.id);
                })
              }
            >
              <Trash2 className={styles.deleteIcon} />
              Удалить
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
}
