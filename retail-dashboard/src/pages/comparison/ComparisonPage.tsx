import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Button, Card, Empty, Skeleton, Space, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import type { AppDispatch, RootState } from '@/store';
import { cleared, loadComparison } from '@/store/slices/comparisonSlice';
import { fetchStores } from '@/api/endpoints';
import { buildComparisonRows, previousPeriod } from '@/utils/comparison';
import type { Store } from '@/types/domain';
import ComparisonChart from './ComparisonChart';
import ComparisonFilters from './ComparisonFilters';
import ComparisonGrid, { type ComparisonGridHandle } from './ComparisonGrid';
import { MIN_STORES, useComparisonFilters } from './useComparisonFilters';
import '@/styles/comparison.scss';

const { Text } = Typography;

const prettyDate = (iso: string) => dayjs(iso).format('DD MMM YYYY');

export default function ComparisonPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { storeIds, from, to, setFilters } = useComparisonFilters();

  const [stores, setStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storesError, setStoresError] = useState(false);
  const [storesAttempt, setStoresAttempt] = useState(0);

  const { current, previous, loading, error } = useSelector((s: RootState) => s.comparison);

  useEffect(() => {
    const controller = new AbortController();
    setStoresLoading(true);
    setStoresError(false);

    fetchStores({ signal: controller.signal })
      .then(setStores)
      .catch(() => {
        if (!controller.signal.aborted) setStoresError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setStoresLoading(false);
      });

    return () => controller.abort();
  }, [storesAttempt]);

  const enoughStores = storeIds.length >= MIN_STORES;
  const storeKey = storeIds.join(',');

  useEffect(() => {
    if (!enoughStores) {
      dispatch(cleared());
      return;
    }
    const request = dispatch(loadComparison({ storeIds: storeKey.split(','), from, to }));
    return () => request.abort();
  }, [dispatch, enoughStores, storeKey, from, to]);

  const retry = useCallback(() => {
    dispatch(loadComparison({ storeIds: storeKey.split(','), from, to }));
  }, [dispatch, storeKey, from, to]);

  const rows = useMemo(
    () => buildComparisonRows(current, previous, stores, storeIds),
    [current, previous, stores, storeIds]
  );

  const baseline = useMemo(() => previousPeriod(from, to), [from, to]);

  const gridRef = useRef<ComparisonGridHandle>(null);
  const csvFileName = `store-comparison_${from}_to_${to}.csv`;
  // The grid is only mounted — and therefore only exportable — when it is
  // actually rendering rows.
  const canExport = enoughStores && !error && !loading && rows.length > 0;

  const hasData = current.length > 0;

  /**
   * Empty and error outrank everything and look the same in both cards, so
   * they are resolved once. `null` means "there is something to render".
   */
  const blocker = () => {
    if (!enoughStores) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={`Select at least ${MIN_STORES} stores to compare`}
        />
      );
    }
    if (error) {
      return (
        <Alert
          type="error"
          showIcon
          title="Could not load comparison data"
          description={error}
          action={
            <Button size="small" onClick={retry}>
              Try again
            </Button>
          }
        />
      );
    }
    return null;
  };

  // Skeleton only on the first load. Once there is something on screen, a
  // refetch dims it in place rather than collapsing the layout.
  const renderContent = (node: ReactNode, skeletonRows: number) => {
    const blocked = blocker();
    if (blocked) return blocked;
    if (loading && !hasData) return <Skeleton active paragraph={{ rows: skeletonRows }} />;
    return <div className={loading ? 'comparison__stale' : undefined}>{node}</div>;
  };

  return (
    <div className="comparison">
      <div className="page-title">Store Comparison</div>

      {storesError && (
        <Alert
          type="error"
          showIcon
          className="comparison__alert"
          title="Could not load the store list"
          action={
            <Button size="small" onClick={() => setStoresAttempt((n) => n + 1)}>
              Try again
            </Button>
          }
        />
      )}

      <ComparisonFilters
        stores={stores}
        storesLoading={storesLoading}
        storeIds={storeIds}
        from={from}
        to={to}
        onChange={setFilters}
      />

      <Card title="Daily revenue" className="comparison__card">
        {renderContent(
          <ComparisonChart data={current} stores={stores} storeIds={storeIds} />,
          6
        )}
      </Card>

      <Card
        title="Summary"
        extra={
          <Space size={12} wrap>
            <Text type="secondary" className="comparison__baseline">
              {prettyDate(from)} – {prettyDate(to)} vs {prettyDate(baseline.from)} –{' '}
              {prettyDate(baseline.to)}
            </Text>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              disabled={!canExport}
              onClick={() => gridRef.current?.exportCsv()}
            >
              Download CSV
            </Button>
          </Space>
        }
      >
        {renderContent(<ComparisonGrid ref={gridRef} rows={rows} fileName={csvFileName} />, 4)}
      </Card>
    </div>
  );
}
