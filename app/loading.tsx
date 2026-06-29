"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./loading.module.css";

/** Подсказки, которые циклически сменяются — отсылки к модулям приложения */
const HINTS = [
  "Загружаем задачи",
  "Синхронизируем календарь",
  "Подгружаем отчёты",
  "Готовим финансы",
  "Расставляем приоритеты",
  "Проверяем доступы",
  "Почти готово",
];

export default function Loading() {
  const [hintIndex, setHintIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Плавное появление при монтировании
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Имитация прогресса (быстрый старт, замедление к концу)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        // Нелинейный рост: чем ближе к 100, тем медленнее
        const remaining = 100 - prev;
        const increment = Math.max(0.3, remaining * 0.08);
        return Math.min(95, prev + increment);
      });
    }, 180);

    return () => clearInterval(interval);
  }, []);

  // Смена подсказок
  const advanceHint = useCallback(() => {
    setHintIndex((prev) => (prev + 1) % HINTS.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(advanceHint, 2200);
    return () => clearInterval(interval);
  }, [advanceHint]);

  return (
    <div
      className={`${styles.container} ${visible ? styles.visible : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Загрузка приложения"
    >
      {/* Геометрическая композиция */}
      <div className={styles.geometry} aria-hidden="true">
        <div className={`${styles.shape} ${styles.circle}`} />
        <div className={`${styles.shape} ${styles.diamond}`} />
        <div className={`${styles.shape} ${styles.rect}`} />
      </div>

      {/* Заголовок */}
      <p className={styles.title}>Подрядчик</p>

      {/* Прогресс-бар */}
      <div className={styles.progress_track} aria-hidden="true">
        <div
          className={styles.progress_fill}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Текущая подсказка */}
      <p className={styles.hint} key={hintIndex}>
        {HINTS[hintIndex]}
      </p>
    </div>
  );
}