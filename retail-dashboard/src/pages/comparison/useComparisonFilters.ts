import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { DATE_FORMAT } from '@/utils/comparison';

export const MIN_STORES = 2;
export const MAX_STORES = 5;

export interface ComparisonFilters {
  storeIds: string[];
  from: string;
  to: string;
}

function isValidDate(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && dayjs(value).isValid();
}

function defaultRange(): { from: string; to: string } {
  return {
    from: dayjs().subtract(6, 'day').format(DATE_FORMAT),
    to: dayjs().format(DATE_FORMAT),
  };
}

/**
 * Filter state lives in the URL rather than Redux or localStorage.
 *
 * One mechanism satisfies both requirements: the filters survive a reload
 * (they were never in memory) and the address bar is already the shareable
 * link — no extra "copy link" plumbing, no persistence layer to keep in sync.
 *
 * Values are stored as plain strings so they round-trip through a URL. This is
 * deliberately unlike filtersSlice, which holds Dayjs objects that cannot be
 * serialised.
 */
export function useComparisonFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<ComparisonFilters>(() => {
    const fallback = defaultRange();

    const storeIds = (searchParams.get('stores') ?? '')
      .split(',')
      .filter(Boolean)
      .slice(0, MAX_STORES);

    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Reject anything malformed or inverted — a hand-edited URL should not
    // put the page into an unrenderable state.
    const valid =
      isValidDate(fromParam) && isValidDate(toParam) && !dayjs(fromParam).isAfter(dayjs(toParam));

    return {
      storeIds,
      from: valid ? fromParam : fallback.from,
      to: valid ? toParam : fallback.to,
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<ComparisonFilters>) => {
      const next = { ...filters, ...patch };
      setSearchParams(
        { stores: next.storeIds.join(','), from: next.from, to: next.to },
        // replace: adjusting a filter is not a navigation step — otherwise the
        // back button would walk through every intermediate selection.
        { replace: true }
      );
    },
    [filters, setSearchParams]
  );

  return { ...filters, setFilters };
}
