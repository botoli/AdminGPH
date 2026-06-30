"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, ImageOff, Plus, Trash2 } from "lucide-react";
import { createWishlistItem, deleteWishlistItem, completeWishlistItem, setWishlistAllocation } from "@/actions/wishlist-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import styles from "./wishlist-planner-v2.module.css";

interface Item { id:string; title:string; amount:number; kind:string; savedAmount:number; allocationAmount:number; remainingAmount:number; completed:boolean; productUrl:string | null; productImageUrl:string | null; productSource:string | null; }
interface Props { freeCash:number; selectedTotal:number; afterWishlist:number; items:Item[]; month:number; }
const MONTHS = ["январь","февраль","март","апрель","май","июнь","июль","август","сентябрь","октябрь","ноябрь","декабрь"];
const SOURCE_LABELS: Record<string, string> = { wildberries: "WB", ozon: "OZON", avito: "Avito", other: "Ссылка" };

export function WishlistPlannerV2({ freeCash, selectedTotal, afterWishlist, items, month }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");
  const active = items.filter((item) => !item.completed);
  const run = (action: () => Promise<void>) => startTransition(async () => {
    setError("");
    try {
      await action();
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить изменения");
    }
  });

  return <div className={styles.page}>
    <header className={styles.header}><div><p className={styles.eyebrow}>План покупок</p><h1>Хотелки на {MONTHS[month - 1]}</h1><p>Выбирайте обычные покупки целиком или откладывайте часть суммы на крупные цели.</p></div><Button onClick={() => setShowCreate(!showCreate)}><Plus/>Добавить хотелку</Button></header>
    <section className={styles.balanceStrip} aria-label="Баланс хотелок">
      <div><span>Свободно</span><strong>{formatCurrency(freeCash)}</strong></div><div><span>Выбрано</span><strong>{formatCurrency(selectedTotal)}</strong></div><div className={styles.balanceFinal}><span>Останется</span><strong>{formatCurrency(afterWishlist)}</strong></div>
    </section>
    {error ? <p className={styles.errorBanner} role="alert">{error}</p> : null}
    {showCreate && <Card><Card.Content><form className={styles.createForm} action={(data) => run(async () => { await createWishlistItem(data); setShowCreate(false); })}><Input label="Название" name="title" required/><Input label="Стоимость" name="amount" type="number" min="1" required/><Input label="Ссылка на товар" name="productUrl" type="url" placeholder="https://www.ozon.ru/product/..."/><label className={styles.field}><span>Тип</span><select name="kind"><option value="PURCHASE">Купить в этом месяце</option><option value="SAVINGS">Накопительная цель</option></select></label><Button type="submit" disabled={pending}>Добавить</Button></form></Card.Content></Card>}
    <section className={styles.list}>
      {active.length === 0 ? <div className={styles.empty}>Список пуст. Добавьте первую покупку или накопительную цель.</div> : active.map((item) => {
        const availableForItem = Math.max(0, afterWishlist + item.allocationAmount);
        return <WishlistRow key={item.id} item={item} available={availableForItem} pending={pending} run={run}/>;
      })}
    </section>
  </div>;
}

function WishlistRow({ item, available, pending, run }: { item:Item; available:number; pending:boolean; run:(action:()=>Promise<void>)=>void }) {
  const [contribution, setContribution] = useState(String(item.allocationAmount || Math.min(item.remainingAmount, available)));
  const isSavings = item.kind === "SAVINGS";
  const shortage = Math.max(0, item.amount - available);
  const selected = item.allocationAmount > 0;
  const allocate = (amount:number) => { const data = new FormData(); data.set("id", item.id); data.set("amount", String(amount)); run(() => setWishlistAllocation(data)); };
  return <article className={`${styles.item} ${selected ? styles.itemSelected : ""}`}>
    <div className={styles.previewRow}>
      {item.productImageUrl ? (
        // Wishlist previews are third-party marketplace URLs, so plain img keeps config surface small.
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.previewImage} src={item.productImageUrl} alt={item.title} loading="lazy"/>
      ) : <div className={styles.previewFallback} aria-hidden="true"><ImageOff/></div>}
      <div className={styles.previewMeta}>
        {item.productSource ? <span className={styles.marketBadge}>{SOURCE_LABELS[item.productSource] ?? "Ссылка"}</span> : null}
        {item.productUrl ? <a href={item.productUrl} target="_blank" rel="noreferrer" className={styles.marketLink}>Открыть товар <ExternalLink/></a> : <span className={styles.marketHint}>Ссылка не указана</span>}
      </div>
    </div>
    <div className={styles.itemMain}>
      <div><span className={styles.type}>{isSavings ? "Накопительная цель" : "Покупка"}</span><h2>{item.title}</h2></div>
      <strong className={styles.price}>{formatCurrency(item.amount)}</strong>
    </div>
    {isSavings ? <>
      <div className={styles.savingMeta}><span>Накоплено <strong>{formatCurrency(item.savedAmount)}</strong></span><span>Осталось <strong>{formatCurrency(item.remainingAmount)}</strong></span></div>
      <div className={styles.goalTrack}><div style={{width:`${Math.min(100, item.amount > 0 ? item.savedAmount / item.amount * 100 : 0)}%`}}/></div>
      <div className={styles.contribution}><Input label="Отложить в этом месяце" type="number" min="0" max={Math.min(item.remainingAmount + item.allocationAmount, available)} value={contribution} onChange={(e)=>setContribution(e.target.value)}/><Button disabled={pending || Number(contribution) <= 0 || Number(contribution) > available} onClick={()=>allocate(Number(contribution))}>{selected ? "Изменить сумму" : "Отложить"}</Button></div>
      {Number(contribution) > available ? <p className={styles.budgetError}>Не хватает {formatCurrency(Number(contribution) - available)}</p> : null}
    </> : <div className={styles.purchaseAction}>{selected ? <Button variant="outline" disabled={pending} onClick={()=>allocate(0)}><Check/>Выбрано на месяц</Button> : <Button disabled={pending || shortage > 0} onClick={()=>allocate(item.amount)}>{shortage > 0 ? `Не хватает ${formatCurrency(shortage)}` : "Выбрать на месяц"}</Button>}</div>}
    <div className={styles.itemFooter}><button disabled={pending || (!selected && isSavings)} onClick={()=>run(()=>completeWishlistItem(item.id))}>Закрыть хотелку</button><button className={styles.delete} disabled={pending} onClick={()=>run(()=>deleteWishlistItem(item.id))}><Trash2/>Удалить</button></div>
  </article>;
}
