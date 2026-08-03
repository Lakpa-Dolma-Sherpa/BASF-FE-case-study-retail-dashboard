import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Skeleton, Typography } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import type { AppDispatch, RootState } from '@/store';
import { cleared, loadComparison } from '@/store/slices/comparisonSlice';
import { fetchStores } from '@/api/endpoints';
import { buildComparisonRows, previousPeriod } from '@/utils/comparison';
import type { Store } from '@/types/domain';
import ComparisonFilters from './ComparisonFilters';
import ComparisonGrid from './ComparisonGrid';
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

  const renderSummary = () => {
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
    if (loading) return <Skeleton active paragraph={{ rows: 4 }} />;
    return <ComparisonGrid rows={rows} />;
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

      <Card
        title="Summary"
        extra={
          <Text type="secondary" className="comparison__baseline">
            {prettyDate(from)} – {prettyDate(to)} vs {prettyDate(baseline.from)} –{' '}
            {prettyDate(baseline.to)}
          </Text>
        }
      >
        {renderSummary()}
      </Card>
    </div>
  );
}
