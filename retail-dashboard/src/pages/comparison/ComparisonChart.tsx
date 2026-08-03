import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { DailyRevenuePoint, Store } from '@/types/domain';
import { formatCurrency } from '@/utils/format';
import { useSeriesColors } from './seriesColors';

const HEIGHT = 340;
// Bottom margin reserves the x-axis band inside the SVG, so tick labels can
// never be clipped into a nested scrollbar.
// left fits de-DE compact currency ticks ("18 Tsd. €"), which are wider than
// the en-US equivalent.
const MARGIN = { top: 12, right: 20, bottom: 34, left: 78 };
const MIN_WIDTH = 320;

// Recessive chrome: one step off the white surface, solid hairlines.
const GRID = '#ebebe8';
const AXIS_TEXT = '#6b6b66';

const parseDate = d3.utcParse('%Y-%m-%d');
const formatAxisDate = d3.utcFormat('%d %b');
const formatFullDate = d3.utcFormat('%a %d %b %Y');

const axisCurrency = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 1,
});

interface Props {
  data: DailyRevenuePoint[];
  stores: Store[];
  storeIds: string[];
}

interface SeriesPoint {
  date: Date;
  revenue: number | null;
}

interface Series {
  storeId: string;
  name: string;
  color: string;
  points: SeriesPoint[];
}

interface HoverState {
  x: number;
  flip: boolean;
  date: Date;
  entries: Array<{ storeId: string; name: string; color: string; revenue: number | null }>;
}

export default function ComparisonChart({ data, stores, storeIds }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(MIN_WIDTH);
  const [hover, setHover] = useState<HoverState | null>(null);

  const colors = useSeriesColors(storeIds);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(MIN_WIDTH, entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { series, dates } = useMemo(() => {
    // Index once instead of scanning the array per store per day.
    const byStore = d3.group(data, (d) => d.storeId);
    const dateStrings = [...new Set(data.map((d) => d.date))].sort();
    const parsed = dateStrings.map((s) => parseDate(s)!);
    const storeNames = new Map(stores.map((s) => [s.id, s.name]));

    const built: Series[] = storeIds.map((id) => {
      const revenueByDate = new Map((byStore.get(id) ?? []).map((d) => [d.date, d.revenue]));
      return {
        storeId: id,
        name: storeNames.get(id) ?? id,
        color: colors.get(id) ?? '#2a78d6',
        points: dateStrings.map((s, i) => ({
          date: parsed[i],
          revenue: revenueByDate.get(s) ?? null,
        })),
      };
    });

    return { series: built, dates: parsed };
  }, [data, stores, storeIds, colors]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    if (!dates.length || !series.length) return;

    const innerRight = width - MARGIN.right;
    const innerBottom = HEIGHT - MARGIN.bottom;

    const x = d3.scaleUtc().domain(d3.extent(dates) as [Date, Date]).range([MARGIN.left, innerRight]);
    const maxRevenue = d3.max(series, (s) => d3.max(s.points, (p) => p.revenue ?? 0)) ?? 0;
    const y = d3.scaleLinear().domain([0, maxRevenue]).nice().range([innerBottom, MARGIN.top]);

    // Horizontal gridlines only — vertical ones would compete with the crosshair.
    svg
      .append('g')
      .selectAll('line')
      .data(y.ticks(5))
      .join('line')
      .attr('x1', MARGIN.left)
      .attr('x2', innerRight)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', GRID)
      .attr('stroke-width', 1);

    const yAxis = svg
      .append('g')
      .attr('transform', `translate(${MARGIN.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat((v) => axisCurrency.format(v as number)).tickSize(0));
    yAxis.select('.domain').remove();
    yAxis.selectAll('text').attr('fill', AXIS_TEXT).attr('font-size', 11);

    const xAxis = svg
      .append('g')
      .attr('transform', `translate(0,${innerBottom})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(Math.max(2, Math.floor((innerRight - MARGIN.left) / 110)))
          .tickFormat((v) => formatAxisDate(v as Date))
          .tickSize(0)
          .tickPadding(10)
      );
    xAxis.select('.domain').attr('stroke', GRID);
    xAxis.selectAll('text').attr('fill', AXIS_TEXT).attr('font-size', 11);

    const line = d3
      .line<SeriesPoint>()
      // Breaks the line across missing days instead of inventing a straight
      // segment through them.
      .defined((p) => p.revenue != null)
      .x((p) => x(p.date))
      .y((p) => y(p.revenue ?? 0));

    const plot = svg.append('g');
    for (const s of series) {
      plot
        .append('path')
        .datum(s.points)
        .attr('fill', 'none')
        .attr('stroke', s.color)
        .attr('stroke-width', 2)
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('d', line);
    }

    const crosshair = svg
      .append('line')
      .attr('stroke', '#b8b8b3')
      .attr('stroke-width', 1)
      .attr('y1', MARGIN.top)
      .attr('y2', innerBottom)
      .style('display', 'none');

    const focus = svg.append('g').style('display', 'none');
    const focusDots = focus
      .selectAll('circle')
      .data(series)
      .join('circle')
      .attr('r', 4)
      .attr('fill', (s) => s.color)
      // 2px surface ring keeps overlapping dots readable.
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    const hide = () => {
      crosshair.style('display', 'none');
      focus.style('display', 'none');
      setHover(null);
    };

    const move = (event: PointerEvent | FocusEvent) => {
      const [px] = d3.pointer(event, svg.node());
      const target = x.invert(Math.max(MARGIN.left, Math.min(innerRight, px)));
      // Snap to the nearest day so the reader aims at a date, not at a 2px line.
      const i = d3.leastIndex(dates, (a, b) =>
        Math.abs(+a - +target) - Math.abs(+b - +target)
      );
      if (i == null) return;

      const date = dates[i];
      const cx = x(date);

      crosshair.attr('x1', cx).attr('x2', cx).style('display', null);
      focus.style('display', null);
      focusDots
        .attr('cx', cx)
        .attr('cy', (s) => y(s.points[i].revenue ?? 0))
        .style('display', (s) => (s.points[i].revenue == null ? 'none' : null));

      setHover({
        x: cx,
        flip: cx > width * 0.6,
        date,
        entries: series.map((s) => ({
          storeId: s.storeId,
          name: s.name,
          color: s.color,
          revenue: s.points[i].revenue,
        })),
      });
    };

    svg
      .append('rect')
      .attr('x', MARGIN.left)
      .attr('y', MARGIN.top)
      .attr('width', Math.max(0, innerRight - MARGIN.left))
      .attr('height', Math.max(0, innerBottom - MARGIN.top))
      .attr('fill', 'transparent')
      .attr('tabindex', 0)
      .attr('role', 'application')
      .attr('aria-label', 'Daily revenue chart. Hover or focus to read values.')
      .on('pointermove', move)
      .on('pointerleave', hide)
      .on('focus', move)
      .on('blur', hide);

    return hide;
  }, [series, dates, width]);

  const legend = useMemo(
    () => series.map((s) => ({ storeId: s.storeId, name: s.name, color: s.color })),
    [series]
  );

  if (!storeIds.length) return null;

  return (
    <div className="chart" ref={containerRef}>
      <div className="chart__plot">
        <svg ref={svgRef} width={width} height={HEIGHT} role="img" />

        {hover && (
          <div
            className={`chart__tooltip ${hover.flip ? 'chart__tooltip--flip' : ''}`}
            style={{ left: hover.x }}
          >
            <div className="chart__tooltip-date">{formatFullDate(hover.date)}</div>
            {hover.entries.map((e) => (
              <div key={e.storeId} className="chart__tooltip-row">
                <span className="chart__key" style={{ background: e.color }} />
                {/* Value leads, name follows — the reader already knows the series. */}
                <span className="chart__tooltip-value">
                  {e.revenue == null ? 'No data' : formatCurrency(e.revenue)}
                </span>
                <span className="chart__tooltip-name">{e.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ul className="chart__legend">
        {legend.map((s) => (
          <li key={s.storeId} className="chart__legend-item">
            <span className="chart__key" style={{ background: s.color }} />
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
