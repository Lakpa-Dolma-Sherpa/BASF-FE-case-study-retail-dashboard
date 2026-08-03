import { useMemo, useRef } from 'react';
import { MAX_STORES } from './useComparisonFilters';

/**
 * Categorical palette, validated for colour-vision deficiency at this length:
 * worst adjacent CVD ΔE 9.1, worst normal-vision ΔE 19.6 on a white surface.
 *
 * Slots are fixed and never generated or cycled — the order itself is the
 * CVD-safety mechanism, so adding a hue by hand would invalidate it.
 */
export const SERIES_COLORS = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
] as const;

/**
 * Maps each selected store to a colour that follows the *store*, not its
 * position in the list.
 *
 * Assigning by array index would repaint every surviving series whenever one
 * is deselected — the line a reader was tracking silently changes colour. Here
 * a store keeps its slot for as long as it stays selected, and a freed slot is
 * only reused by a newly added store.
 */
export function useSeriesColors(storeIds: string[]): Map<string, string> {
  const assignedRef = useRef<Map<string, number>>(new Map());

  return useMemo(() => {
    const assigned = assignedRef.current;
    const selected = new Set(storeIds);

    for (const id of [...assigned.keys()]) {
      if (!selected.has(id)) assigned.delete(id);
    }

    const taken = new Set(assigned.values());
    for (const id of storeIds) {
      if (assigned.has(id)) continue;
      let slot = 0;
      while (taken.has(slot) && slot < MAX_STORES) slot += 1;
      assigned.set(id, slot);
      taken.add(slot);
    }

    return new Map(storeIds.map((id) => [id, SERIES_COLORS[assigned.get(id) ?? 0]]));
  }, [storeIds]);
}
