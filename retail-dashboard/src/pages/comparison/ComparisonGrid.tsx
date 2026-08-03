import { useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  themeAlpine,
  type ColDef,
  type ICellRendererParams,
  type ProcessCellForExportParams,
} from 'ag-grid-community';
import type { ComparisonRow } from '@/utils/comparison';
import { formatCurrency, formatNumber } from '@/utils/format';

export interface ComparisonGridHandle {
  exportCsv: () => void;
}

interface Props {
  rows: ComparisonRow[];
  fileName: string;
  ref?: Ref<ComparisonGridHandle>;
}

/** Signed, coloured percentage with a direction arrow. */
function TrendCell({ value }: ICellRendererParams<ComparisonRow, number | null>) {
  if (value == null) {
    return (
      <span className="trend trend--none" title="No revenue in the previous period">
        —
      </span>
    );
  }
  const up = value >= 0;
  return (
    <span className={`trend ${up ? 'trend--up' : 'trend--down'}`}>
      <span aria-hidden="true">{up ? '▲' : '▼'}</span>
      {` ${up ? '+' : '−'}${Math.abs(value).toFixed(1)}%`}
    </span>
  );
}

/** Sorts missing values to the bottom instead of treating them as zero. */
function pctComparator(a: number | null, b: number | null): number {
  const rank = (v: number | null) => (v == null ? Number.NEGATIVE_INFINITY : v);
  return rank(a) - rank(b);
}

/**
 * CSV carries analysis-ready values, not display strings: `18357.04` rather
 * than `"18.357,04 €"`, which Excel would treat as text. Percentages are
 * rounded to match what the grid shows; a missing baseline stays blank.
 */
function processCell(params: ProcessCellForExportParams): string {
  const { value, column } = params;
  if (value == null) return '';
  if (column.getColId() === 'pctChange') return (value as number).toFixed(1);
  return String(value);
}

export default function ComparisonGrid({ rows, fileName, ref }: Props) {
  const gridRef = useRef<AgGridReact<ComparisonRow>>(null);

  useImperativeHandle(
    ref,
    () => ({
      exportCsv: () => {
        // Native AG Grid export: writes exactly what the grid is showing —
        // the current sort order and only the visible columns.
        gridRef.current?.api.exportDataAsCsv({ fileName, processCellCallback: processCell });
      },
    }),
    [fileName]
  );

  // Memoised so AG Grid receives a stable reference and does not tear down
  // and rebuild its columns on every parent render.
  const columnDefs = useMemo<ColDef<ComparisonRow>[]>(
    () => [
      // minWidth is the tablet/mobile floor; flex distributes the surplus on
      // desktop. Their sum stays under a ~760px card body so the grid only
      // scrolls on genuinely small screens.
      { field: 'storeName', headerName: 'Store', flex: 2, minWidth: 150 },
      { field: 'city', headerName: 'City', flex: 1, minWidth: 100 },
      {
        field: 'totalRevenue',
        headerName: 'Total revenue',
        type: 'numericColumn',
        flex: 1.4,
        minWidth: 130,
        // valueFormatter, not cellRenderer: the underlying value stays a
        // number, so sorting stays numeric and CSV export gets clean data.
        valueFormatter: (p) => (p.value == null ? '' : formatCurrency(p.value)),
      },
      {
        field: 'totalTransactions',
        headerName: 'Transactions',
        type: 'numericColumn',
        flex: 1.2,
        minWidth: 120,
        valueFormatter: (p) => (p.value == null ? '' : formatNumber(p.value)),
      },
      {
        field: 'avgBasket',
        headerName: 'Avg basket',
        type: 'numericColumn',
        flex: 1.2,
        minWidth: 120,
        valueFormatter: (p) => (p.value == null ? '' : formatCurrency(p.value)),
      },
      {
        field: 'pctChange',
        headerName: '% change',
        type: 'numericColumn',
        flex: 1.2,
        minWidth: 130,
        headerTooltip: 'Revenue change versus the equally long preceding period',
        cellRenderer: TrendCell,
        comparator: pctComparator,
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<ComparisonRow>>(
    () => ({
      sortable: true,
      resizable: true,
      suppressMovable: true,
      // No per-column filters: the store picker and date range are the only
      // filters in this feature, and they already scope every row.
      filter: false,
    }),
    []
  );

  return (
    <div className="comparison-grid">
      <AgGridReact<ComparisonRow>
        ref={gridRef}
        theme={themeAlpine}
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={(p) => p.data.storeId}
        // 2–5 rows only, so let the grid size itself rather than reserving
        // a fixed height with empty space below.
        domLayout="autoHeight"
      />
    </div>
  );
}
