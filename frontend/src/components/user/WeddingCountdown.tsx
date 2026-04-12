'use client';

import React, { useEffect, useMemo, useState } from 'react';

type CountdownState =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'countdown'; totalMs: number; targetLabel: string }
  | { kind: 'today' }
  | { kind: 'past' };

function parseWeddingParts(iso: string): { y: number; m: number; d: number } | null {
  const trimmed = iso.trim();
  if (!trimmed) return null;
  const datePart = trimmed.slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (m) {
    return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return {
    y: parsed.getFullYear(),
    m: parsed.getMonth() + 1,
    d: parsed.getDate(),
  };
}

/** Parse optional `HH:mm` / `H:mm`; invalid or empty → 4:00 PM (16:00) */
function ceremonyHourMinute(ceremonyTime?: string | null): { h: number; min: number } {
  const raw = (ceremonyTime ?? '').trim();
  if (!raw) return { h: 16, min: 0 };
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (!m) return { h: 16, min: 0 };
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) {
    return { h: 16, min: 0 };
  }
  return { h, min };
}

function weddingTargetTime(parts: { y: number; m: number; d: number }, ceremonyTime?: string): Date {
  const { h, min } = ceremonyHourMinute(ceremonyTime);
  return new Date(parts.y, parts.m - 1, parts.d, h, min, 0, 0);
}

function endOfWeddingDay(parts: { y: number; m: number; d: number }): Date {
  return new Date(parts.y, parts.m - 1, parts.d, 23, 59, 59, 999);
}

function sameLocalCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function useNowInterval(active: boolean, ms: number): number {
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [active, ms]);
  return tick;
}

function splitMs(totalMs: number) {
  const sec = Math.floor(totalMs / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  return { days, hours, minutes, seconds };
}

export interface WeddingCountdownProps {
  weddingDate?: string;
  ceremonyTime?: string;
  theme?: string;
  onSetDate?: () => void;
}

export function WeddingCountdown({ weddingDate, ceremonyTime, theme, onSetDate }: WeddingCountdownProps) {
  const parts = useMemo(() => (weddingDate ? parseWeddingParts(weddingDate) : null), [weddingDate]);
  const state: CountdownState = useMemo(() => {
    if (!weddingDate?.trim()) return { kind: 'empty' };
    if (!parts) return { kind: 'invalid' };
    const target = weddingTargetTime(parts, ceremonyTime);
    const endDay = endOfWeddingDay(parts);
    if (Number.isNaN(target.getTime())) return { kind: 'invalid' };

    const now = new Date();
    if (now > endDay) return { kind: 'past' };
    if (sameLocalCalendarDay(now, target) && now.getTime() >= target.getTime()) {
      return { kind: 'today' };
    }
    const totalMs = Math.max(0, target.getTime() - now.getTime());
    return {
      kind: 'countdown',
      totalMs,
      targetLabel: target.toLocaleString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
  }, [weddingDate, parts, ceremonyTime]);

  const ticking = state.kind === 'countdown';
  const nowTick = useNowInterval(ticking, 1000);

  const live = useMemo(() => {
    if (state.kind !== 'countdown' || !parts) return state;
    const target = weddingTargetTime(parts, ceremonyTime);
    const endDay = endOfWeddingDay(parts);
    const now = new Date(nowTick);
    if (now > endDay) return { kind: 'past' };
    if (sameLocalCalendarDay(now, target) && now.getTime() >= target.getTime()) {
      return { kind: 'today' };
    }
    return {
      kind: 'countdown',
      totalMs: Math.max(0, target.getTime() - now.getTime()),
      targetLabel: target.toLocaleString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
  }, [state, parts, nowTick, ceremonyTime]);

  if (live.kind === 'empty') {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-6 shadow-lg md:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-secondary-200/40 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-primary-200/50 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-700">The big day</p>
            <h2 className="font-serif text-2xl font-bold text-gray-900 md:text-3xl">Start your countdown</h2>
            <p className="mt-2 max-w-xl text-gray-600">
              Add your wedding date (and optional ceremony time) in Wedding Overview and we will show a live countdown here—down to the second.
            </p>
          </div>
          {onSetDate && (
            <button type="button" onClick={onSetDate} className="btn-primary btn-md shrink-0 self-start md:self-center">
              Set wedding date
            </button>
          )}
        </div>
      </div>
    );
  }

  if (live.kind === 'invalid') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-md">
        <p className="font-semibold">We could not read your wedding date.</p>
        <p className="mt-1 text-sm opacity-90">Open Edit details and pick a valid date.</p>
        {onSetDate && (
          <button type="button" onClick={onSetDate} className="btn-primary btn-sm mt-4">
            Fix date
          </button>
        )}
      </div>
    );
  }

  if (live.kind === 'past') {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-primary-200/50 bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white shadow-xl md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-60" />
        <div className="relative text-center">
          <p className="text-4xl md:text-5xl">💍</p>
          <h2 className="mt-3 font-serif text-2xl font-bold md:text-3xl">Congratulations!</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/90 md:text-base">
            We hope your wedding day was everything you dreamed of—and more.
          </p>
        </div>
      </div>
    );
  }

  if (live.kind === 'today') {
    return (
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary-400/60 bg-gradient-to-br from-white via-primary-50 to-secondary-50 p-6 shadow-xl md:p-10">
        <div className="pointer-events-none absolute right-6 top-6 text-6xl opacity-20 md:text-8xl">✨</div>
        <div className="relative text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">Today</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-gray-900 md:text-4xl">This is your day</h2>
          {theme?.trim() && (
            <p className="mt-3 inline-flex rounded-full bg-white/80 px-4 py-1.5 text-sm font-medium text-primary-800 shadow-sm ring-1 ring-primary-100">
              {theme}
            </p>
          )}
          <p className="mx-auto mt-4 max-w-lg text-gray-600">
            Soak in every moment—you have earned this celebration.
          </p>
        </div>
      </div>
    );
  }

  if (live.kind !== 'countdown') {
    return null;
  }

  const { days, hours, minutes, seconds } = splitMs(live.totalMs);

  const cells = [
    { label: 'Days', value: days, display: days > 99 ? String(days) : String(days).padStart(2, '0') },
    { label: 'Hours', value: hours, display: String(hours).padStart(2, '0') },
    { label: 'Minutes', value: minutes, display: String(minutes).padStart(2, '0') },
    { label: 'Seconds', value: seconds, display: String(seconds).padStart(2, '0'), pulse: true },
  ] as const;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-primary-200/70 bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-5 shadow-lg md:p-8"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="pointer-events-none absolute -right-6 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-gradient-to-br from-secondary-300/50 to-primary-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-primary-300/35 blur-2xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-md">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-600/10 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-800">
              Countdown
            </span>
            {theme?.trim() ? (
              <span className="rounded-full bg-secondary-100 px-3 py-0.5 text-xs font-medium text-secondary-900 ring-1 ring-secondary-200/80">
                {theme}
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 font-serif text-2xl font-bold text-gray-900 md:text-3xl">
            Until you say <span className="text-primary-600">“I do”</span>
          </h2>
          <p className="mt-2 text-sm text-gray-600 md:text-base">
            Counting to <span className="font-medium text-gray-800">{live.targetLabel}</span> (your local time).
          </p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-2xl lg:gap-4">
          {cells.map((cell) => (
            <div
              key={cell.label}
              className="relative rounded-2xl border border-white/80 bg-white/90 p-3 text-center shadow-md shadow-primary-900/5 backdrop-blur-sm ring-1 ring-primary-100/80 md:p-4"
            >
              <div
                className={`font-serif text-3xl font-bold tabular-nums tracking-tight text-gray-900 md:text-4xl ${
                  'pulse' in cell && cell.pulse ? 'motion-safe:animate-pulse' : ''
                }`}
              >
                {cell.display}
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-primary-700/80 md:text-xs">
                {cell.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="relative mt-4 text-center text-xs text-gray-500 md:text-left">
        Tip: update your date anytime from <span className="font-medium text-gray-700">Wedding Overview → Edit details</span>.
      </p>
    </div>
  );
}
