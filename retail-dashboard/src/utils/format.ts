import dayjs from 'dayjs';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

export function formatDate(iso: string): string {
  return dayjs(iso).format('DD.MM.YYYY HH:mm');
}

export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}