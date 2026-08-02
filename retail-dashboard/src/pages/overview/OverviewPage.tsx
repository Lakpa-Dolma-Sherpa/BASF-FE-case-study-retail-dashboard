import { useEffect } from 'react';
import { Card, Col, Row, Select, DatePicker, Input, Spin } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import dayjs, { Dayjs } from 'dayjs';
import type { AppDispatch, RootState } from '@/store';
import { storeSelected, dateRangeChanged, searchChanged } from '@/store/slices/filtersSlice';
import { loadTransactions, filteredUpdated } from '@/store/slices/transactionsSlice';
import { fetchStores } from '@/api/endpoints';
import { groupByDayAndMethod, computeSummary } from '@/utils/revenue';
import RevenueChart from './RevenueChart';
import TransactionsGrid from './TransactionsGrid';
import LatestTransactions from './LatestTransactions';
import type { Store } from '@/types/domain';
import { useState } from 'react';
import '@/styles/overview.scss';

const { RangePicker } = DatePicker;

const PRESETS: Array<{ label: string; value: [Dayjs, Dayjs] }> = [
  { label: 'Last 7 days', value: [dayjs().subtract(6, 'day'), dayjs()] },
  { label: 'Last 14 days', value: [dayjs().subtract(13, 'day'), dayjs()] },
  { label: 'Last 90 days', value: [dayjs().subtract(89, 'day'), dayjs()] },
];

export default function OverviewPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [stores, setStores] = useState<Store[]>([]);

  const { selectedStoreId, dateRange, search } = useSelector((s: RootState) => s.filters);
  const items = useSelector((s: RootState) => s.transactions.items);
  const filtered = useSelector((s: RootState) => s.transactions.filtered);
  const loading = useSelector((s: RootState) => s.transactions.loading);
  const cardTransactions = useSelector((s: RootState) =>
    s.transactions.items.filter((t) => t.paymentMethod === 'card')
  );

  const from = dateRange[0].format('YYYY-MM-DD');
  const to = dateRange[1].format('YYYY-MM-DD');

  useEffect(() => {
    fetchStores().then((stores) => setStores(stores as Store[]));
  }, []);

  useEffect(() => {
    dispatch(loadTransactions({ storeId: selectedStoreId, from, to }));
  }, [dispatch, selectedStoreId, from, to]);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    dispatch(
      filteredUpdated(
        q ? items.filter((t) => t.id.toLowerCase().includes(q) || t.paymentMethod.includes(q)) : items
      )
    );
  }, [dispatch, search]);

  const summary = computeSummary(filtered);
  const chartData = groupByDayAndMethod(filtered);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="overview">
      <div className="page-title">Store Overview</div>

      <div className="filters-row">
        <Select
          value={selectedStoreId}
          onChange={(v) => dispatch(storeSelected(v))}
          style={{ width: 220 }}
          options={stores.map((s) => ({ value: s.id, label: `${s.name} (${s.city})` }))}
        />
        <RangePicker
          value={dateRange}
          allowClear={false}
          presets={PRESETS}
          onChange={(range) => {
            if (range && range[0] && range[1]) dispatch(dateRangeChanged([range[0], range[1]]));
          }}
        />
        <Input
          className="search-box"
          placeholder="Search transactions…"
          value={search}
          onChange={(e) => dispatch(searchChanged(e.target.value))}
          allowClear
        />
      </div>

      <Row gutter={12} className="cards card-spacer">
        <Col span={6}>
          <Card title="Total revenue">
            <div className="stat-value">{summary.totalRevenue} €</div>
            <div className="stat-label">selected period</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Transactions">
            <div className="stat-value">{summary.totalTransactions}</div>
            <div className="stat-label">selected period</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Avg basket">
            <div className="stat-value">{summary.avgBasket} €</div>
            <div className="stat-label">per transaction</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Card payments">
            <div className="stat-value">{cardTransactions.length}</div>
            <div className="stat-label">count, selected period</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={12} className="card-spacer-lg">
        <Col span={16}>
          <Card title="Daily revenue by payment method" className="chart-card">
            <RevenueChart data={chartData} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Latest transactions">
            <LatestTransactions rows={filtered} />
          </Card>
        </Col>
      </Row>

      <Card title="Transactions">
        <TransactionsGrid rows={filtered} />
      </Card>
    </div>
  );
}