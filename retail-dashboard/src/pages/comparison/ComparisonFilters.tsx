import { useMemo } from 'react';
import { DatePicker, Select, Typography } from 'antd';
import dayjs from 'dayjs';
import type { Store } from '@/types/domain';
import { DATE_FORMAT } from '@/utils/comparison';
import { MAX_STORES, type ComparisonFilters as Filters } from './useComparisonFilters';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface Props {
  stores: Store[];
  storesLoading: boolean;
  storeIds: string[];
  from: string;
  to: string;
  onChange: (patch: Partial<Filters>) => void;
}

export default function ComparisonFilters({
  stores,
  storesLoading,
  storeIds,
  from,
  to,
  onChange,
}: Props) {
  // Built inside the component so "Last 7 days" is relative to the current
  // render, not to whenever the module happened to be evaluated.
  const presets = useMemo(
    () => [
      { label: 'Last 7 days', value: [dayjs().subtract(6, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
      { label: 'Last 14 days', value: [dayjs().subtract(13, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
      { label: 'Last 30 days', value: [dayjs().subtract(29, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
      { label: 'Last 90 days', value: [dayjs().subtract(89, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] },
    ],
    []
  );

  const options = useMemo(
    () => stores.map((s) => ({ value: s.id, label: `${s.name} (${s.city})` })),
    [stores]
  );

  return (
    <div className="comparison-filters">
      <div className="comparison-filters__field">
        <Text type="secondary" className="comparison-filters__label">
          Stores
        </Text>
        <Select
          mode="multiple"
          allowClear
          maxCount={MAX_STORES}
          value={storeIds}
          loading={storesLoading}
          disabled={storesLoading}
          onChange={(ids: string[]) => onChange({ storeIds: ids })}
          options={options}
          placeholder={`Select 2 to ${MAX_STORES} stores`}
          className="comparison-filters__stores"
        />
      </div>

      <div className="comparison-filters__field">
        <Text type="secondary" className="comparison-filters__label">
          Date range
        </Text>
        <RangePicker
          value={[dayjs(from), dayjs(to)]}
          allowClear={false}
          presets={presets}
          maxDate={dayjs()}
          onChange={(range) => {
            if (range?.[0] && range[1]) {
              onChange({ from: range[0].format(DATE_FORMAT), to: range[1].format(DATE_FORMAT) });
            }
          }}
        />
      </div>
    </div>
  );
}
