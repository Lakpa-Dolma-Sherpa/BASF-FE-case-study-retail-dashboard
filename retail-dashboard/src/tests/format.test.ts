import { describe, expect, it, vi } from 'vitest';
import { clamp, debounce, formatCurrency, formatDate, formatNumber } from '@/utils/format';

// Intl output varies subtly between ICU versions (which space character sits
// before the symbol, mainly), so assert on the parts we actually care about
// rather than on an exact string.
describe('formatCurrency', () => {
  it('formats with de-DE separators and a euro symbol', () => {
    const out = formatCurrency(1234.5);
    expect(out).toContain('1.234,50');
    expect(out).toContain('€');
  });

  it('keeps two decimals for whole amounts', () => {
    expect(formatCurrency(10)).toContain('10,00');
  });

  it('formats negative amounts', () => {
    expect(formatCurrency(-42.75)).toContain('42,75');
    expect(formatCurrency(-42.75)).toContain('-');
  });
});

describe('formatNumber', () => {
  it('groups thousands the German way', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
  });

  it('leaves small numbers untouched', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('formatDate', () => {
  it('renders day-first with a 24h clock', () => {
    // No offset in the input, so dayjs reads it as wall-clock time and the
    // result is stable regardless of the machine's timezone.
    expect(formatDate('2026-06-12T14:05:00')).toBe('12.06.2026 14:05');
  });
});

describe('clamp', () => {
  it('passes through values inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to the bounds', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe('debounce', () => {
  it('only runs once for a burst of calls, with the latest arguments', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = debounce(spy, 200);

    debounced('a');
    debounced('b');
    debounced('c');
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('c');

    vi.useRealTimers();
  });
});
