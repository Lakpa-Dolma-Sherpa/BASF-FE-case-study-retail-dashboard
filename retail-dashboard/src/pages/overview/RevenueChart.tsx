import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { DayMethodPoint } from '@/utils/revenue';

const HEIGHT = 320;
const MARGIN = { top: 16, right: 24, bottom: 40, left: 56 };
const MIN_WIDTH = 240;

// Ticks are parsed as UTC to match the YYYY-MM-DD keys exactly; local-time
// parsing would shift labels by a day either side of midnight.
const parseDate = d3.utcParse('%Y-%m-%d');
const formatTick = d3.utcFormat('%d %b');

const SERIES: Array<DayMethodPoint['method']> = ['card', 'mobile', 'cash'];
const COLORS = ['#2171b5', '#4292c6', '#6baed6'];
// NOTE: keep in sync with SERIES so legend colors match the lines
const LEGEND: Array<DayMethodPoint['method']> = ['cash', 'card', 'mobile'];

interface Props {
  data: DayMethodPoint[];
}

export default function RevenueChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ref = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Measured synchronously first — a ResizeObserver only fires on *change*,
    // so a chart mounting into an already-laid-out card would never hear back.
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    if (width < MIN_WIDTH) return;

    const dates = [...new Set(data.map((d) => d.date))].sort();
    const x = d3
      .scalePoint<string>()
      .domain(dates)
      .range([MARGIN.left, width - MARGIN.right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.revenue) ?? 0])
      .nice()
      .range([HEIGHT - MARGIN.bottom, MARGIN.top]);

    // Show only as many date labels as actually fit, so they never overlap.
    const plotWidth = width - MARGIN.left - MARGIN.right;
    const step = Math.max(1, Math.ceil(dates.length / Math.max(1, Math.floor(plotWidth / 80))));

    svg
      .append('g')
      .attr('transform', `translate(0,${HEIGHT - MARGIN.bottom})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(dates.filter((_, i) => i % step === 0))
          .tickFormat((s) => {
            const parsed = parseDate(s);
            return parsed ? formatTick(parsed) : s;
          })
      );

    svg.append('g').attr('transform', `translate(${MARGIN.left},0)`).call(d3.axisLeft(y));

    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('position', 'absolute')
      .style('background', '#fff')
      .style('border', '1px solid #d9d9d9')
      .style('padding', '6px 10px')
      .style('font-size', '12px')
      .style('border-radius', '4px')
      .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)')
      .style('display', 'none');

    SERIES.forEach((method, i) => {
      const series = dates.map((date) => ({
        date,
        revenue: data.find((d) => d.date === date && d.method === method)?.revenue ?? 0,
      }));

      const line = d3
        .line<{ date: string; revenue: number }>()
        .x((d) => x(d.date) ?? 0)
        .y((d) => y(d.revenue));

      svg
        .append('path')
        .datum(series)
        .attr('fill', 'none')
        .attr('stroke', COLORS[i])
        .attr('stroke-width', 2)
        .attr('d', line);

      svg
        .selectAll(`.dot-${method}`)
        .data(series)
        .enter()
        .append('circle')
        .attr('cx', (d) => x(d.date) ?? 0)
        .attr('cy', (d) => y(d.revenue))
        .attr('r', 3)
        .attr('fill', COLORS[i])
        .on('mouseover', (event, d) => {
          tooltip
            .style('display', 'block')
            .style('left', `${event.pageX + 12}px`)
            .style('top', `${event.pageY - 10}px`)
            .html(`<b>${d.date}</b><br/>${method}: ${d.revenue}`);
        });
    });

    // legend
    const legend = svg.append('g').attr('transform', `translate(${MARGIN.left + 8},${MARGIN.top})`);
    LEGEND.forEach((method, i) => {
      const g = legend.append('g').attr('transform', `translate(${i * 90},0)`);
      g.append('rect').attr('width', 10).attr('height', 10).attr('fill', COLORS[i]);
      g.append('text').attr('x', 14).attr('y', 9).attr('font-size', 11).text(method);
    });

    return () => {
      tooltip.remove();
    };
    // Previously had no dependency array at all, so the whole SVG was torn
    // down and rebuilt on every render — and a tooltip div was leaked to
    // <body> each time.
  }, [data, width]);

  return (
    <div className="revenue-chart" ref={containerRef}>
      <svg ref={ref} width={width} height={HEIGHT} />
    </div>
  );
}