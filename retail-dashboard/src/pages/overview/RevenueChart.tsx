import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { DayMethodPoint } from '@/utils/revenue';

const WIDTH = 640;
const HEIGHT = 320;
const MARGIN = { top: 16, right: 16, bottom: 40, left: 48 };

const SERIES: Array<DayMethodPoint['method']> = ['card', 'mobile', 'cash'];
const COLORS = ['#2171b5', '#4292c6', '#6baed6'];
// NOTE: keep in sync with SERIES so legend colors match the lines
const LEGEND: Array<DayMethodPoint['method']> = ['cash', 'card', 'mobile'];

interface Props {
  data: DayMethodPoint[];
}

export default function RevenueChart({ data }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const dates = [...new Set(data.map((d) => d.date))].sort();
    const x = d3
      .scalePoint<string>()
      .domain(dates)
      .range([MARGIN.left, WIDTH - MARGIN.right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.revenue) ?? 0])
      .nice()
      .range([HEIGHT - MARGIN.bottom, MARGIN.top]);

    svg
      .append('g')
      .attr('transform', `translate(0,${HEIGHT - MARGIN.bottom})`)
      .call(d3.axisBottom(x));

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
  });

  return <svg ref={ref} width={WIDTH} height={HEIGHT} />;
}