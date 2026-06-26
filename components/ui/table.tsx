import styles from "./table.module.css";
import { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";

export function Table({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  const cls = [styles.wrapper, className].filter(Boolean).join(" ");
  return (
    <div className={cls}>
      <table className={styles.table} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  const cls = [styles.thead, className].filter(Boolean).join(" ");
  return (
    <thead className={cls} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  const cls = [styles.tbody, className].filter(Boolean).join(" ");
  return (
    <tbody className={cls} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  const cls = [styles.tr, className].filter(Boolean).join(" ");
  return (
    <tr className={cls} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({
  className,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  const cls = [styles.th, className].filter(Boolean).join(" ");
  return (
    <th className={cls} {...props}>
      {children}
    </th>
  );
}

export function TableCell({
  className,
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  const cls = [styles.td, className].filter(Boolean).join(" ");
  return (
    <td className={cls} {...props}>
      {children}
    </td>
  );
}

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Head = TableHead;
Table.Cell = TableCell;
