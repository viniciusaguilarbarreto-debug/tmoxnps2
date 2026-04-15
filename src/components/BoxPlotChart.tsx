import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { DashboardData } from '../types';

interface BoxPlotChartProps {
  data: DashboardData[];
  metric: 'TMO_SEC' | 'NPS_REP' | 'SILENCE_DURATION_HH';
  title: string;
}

interface BoxPlotStats {
  key: string;
  q1: number;
  median: number;
  q3: number;
  min: number;
  max: number;
  mean: number;
  outliers: DashboardData[];
  allValues: DashboardData[];
  normalValues: DashboardData[];
}

export function BoxPlotChart({ data, metric, title }: BoxPlotChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const groups = d3.group(data, d => d.COLA);
    const result: BoxPlotStats[] = [];

    groups.forEach((values, key) => {
      const sortedValues = [...values].sort((a, b) => d3.ascending(a[metric], b[metric]));
      const metricValues = sortedValues.map(v => v[metric] as number).filter(v => v !== null && v !== undefined);
      
      if (metricValues.length === 0) return;

      const q1 = d3.quantile(metricValues, 0.25) || 0;
      const median = d3.quantile(metricValues, 0.5) || 0;
      const q3 = d3.quantile(metricValues, 0.75) || 0;
      const mean = d3.mean(metricValues) || 0;
      const interQuantileRange = q3 - q1;
      const min = Math.max(d3.min(metricValues) || 0, q1 - 1.5 * interQuantileRange);
      const max = Math.min(d3.max(metricValues) || 0, q3 + 1.5 * interQuantileRange);
      
      const outliers = sortedValues.filter(v => (v[metric] as number) < min || (v[metric] as number) > max);
      const normalValues = sortedValues.filter(v => (v[metric] as number) >= min && (v[metric] as number) <= max);

      result.push({
        key,
        q1,
        median,
        q3,
        mean,
        min,
        max,
        outliers,
        allValues: sortedValues,
        normalValues
      });
    });

    return result;
  }, [data, metric]);

  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current || stats.length === 0) return;

    const margin = { top: 20, right: 30, bottom: 60, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const tooltip = d3.select(tooltipRef.current);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // X scale
    const x = d3.scaleBand<string>()
      .range([0, width])
      .domain(stats.map(d => d.key))
      .paddingInner(0.4)
      .paddingOuter(0.3);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "10px")
      .style("fill", "#64748b");

    // Y scale
    const allMetricVals = stats.flatMap(d => d.allValues.map(v => v[metric] as number));
    const [minVal, maxVal] = d3.extent(allMetricVals);
    
    // Tighten the Y axis to the data range
    const y = d3.scaleLinear()
      .domain([(minVal as any as number) * 0.95, (maxVal as any as number) * 1.05])
      .range([height, 0]);

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "#64748b");

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const formatVal = (v: number) => {
      if (metric === 'TMO_SEC') return `${v.toFixed(0)}s`;
      if (metric === 'NPS_REP') return `${(v * 100).toFixed(1)}%`;
      if (metric === 'SILENCE_DURATION_HH') {
        const h = Math.floor(v / 3600);
        const m = Math.floor((v % 3600) / 60);
        const s = Math.floor(v % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
      return v.toFixed(2);
    };

    // Violin Plot implementation
    // KDE functions
    function kernelDensityEstimator(kernel: (v: number) => number, X: number[]) {
      return function(V: number[]) {
        return X.map(x => [x, d3.mean(V, v => kernel(x - v)) || 0]);
      };
    }
    function kernelEpanechnikov(k: number) {
      return function(v: number) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
      };
    }

    const violinWidth = x.bandwidth() * 0.8;
    const resolution = 40; // number of points for the violin shape
    const yDomain = y.domain();
    const yStep = (yDomain[1] - yDomain[0]) / resolution;
    const xPoints = d3.range(yDomain[0], yDomain[1] + yStep, yStep);

    stats.forEach(group => {
      const values = group.allValues.map(d => d[metric] as number);
      const kde = kernelDensityEstimator(kernelEpanechnikov(yStep * 4), xPoints);
      const density = kde(values) as [number, number][];

      // Find the maximum density to scale the violin width
      const maxNum = d3.max(density, d => d[1]) || 1;

      const xNum = d3.scaleLinear()
        .range([0, violinWidth / 2])
        .domain([0, maxNum]);

      g.append("path")
        .datum(density)
        .attr("class", "violin")
        .style("stroke", color(group.key))
        .style("stroke-width", 1)
        .style("fill", color(group.key))
        .style("opacity", 0.3)
        .attr("d", d3.area()
          .x0(d => (x(group.key) || 0) + x.bandwidth()/2 - xNum(d[1]))
          .x1(d => (x(group.key) || 0) + x.bandwidth()/2 + xNum(d[1]))
          .y(d => y(d[0]))
          .curve(d3.curveCatmullRom)
        );
    });

    // Show the main vertical line
    g.selectAll(".vertLines")
      .data(stats)
      .enter()
      .append("line")
        .attr("class", "vertLines")
        .attr("x1", (d: BoxPlotStats) => (x(d.key) || 0) + x.bandwidth()/2)
        .attr("x2", (d: BoxPlotStats) => (x(d.key) || 0) + x.bandwidth()/2)
        .attr("y1", (d: BoxPlotStats) => y(d.min))
        .attr("y2", (d: BoxPlotStats) => y(d.max))
        .attr("stroke", "#94a3b8")
        .style("width", 40);

    // rectangle for the main box
    const boxWidth = Math.min(30, x.bandwidth() * 0.5);
    g.selectAll(".boxes")
      .data(stats)
      .enter()
      .append("rect")
        .attr("class", "boxes")
        .attr("x", (d: BoxPlotStats) => (x(d.key) || 0) + x.bandwidth()/2 - boxWidth/2)
        .attr("y", (d: BoxPlotStats) => y(d.q3))
        .attr("height", (d: BoxPlotStats) => y(d.q1) - y(d.q3))
        .attr("width", boxWidth)
        .attr("stroke", (d: BoxPlotStats) => color(d.key))
        .style("fill", (d: BoxPlotStats) => color(d.key))
        .style("opacity", 0.5)
        .on("mouseover", (event: MouseEvent, d: BoxPlotStats) => {
          const [mx, my] = d3.pointer(event, svgRef.current?.parentElement);
          tooltip.transition().duration(200).style("opacity", .9);
          tooltip.html(`
            <div class="font-bold text-slate-900 mb-1 border-b pb-1">${d.key}</div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
              <span class="text-slate-500">Max (Upper):</span> <span class="font-mono">${formatVal(d.max)}</span>
              <span class="text-slate-500">Q3 (75%):</span> <span class="font-mono">${formatVal(d.q3)}</span>
              <span class="text-slate-500 font-bold">Median:</span> <span class="font-mono font-bold">${formatVal(d.median)}</span>
              <span class="text-rose-500 font-bold">Mean:</span> <span class="font-mono font-bold text-rose-600">${formatVal(d.mean)}</span>
              <span class="text-slate-500">Q1 (25%):</span> <span class="font-mono">${formatVal(d.q1)}</span>
              <span class="text-slate-500">Min (Lower):</span> <span class="font-mono">${formatVal(d.min)}</span>
            </div>
          `)
          .style("left", (mx + 15) + "px")
          .style("top", (my - 15) + "px");
        })
        .on("mousemove", (event: MouseEvent) => {
          const [mx, my] = d3.pointer(event, svgRef.current?.parentElement);
          tooltip.style("left", (mx + 15) + "px")
                 .style("top", (my - 15) + "px");
        })
        .on("mouseleave", () => {
          tooltip.transition().duration(500).style("opacity", 0);
        });

    // Show the median
    g.selectAll(".medianLines")
      .data(stats)
      .enter()
      .append("line")
        .attr("class", "medianLines")
        .attr("x1", (d: BoxPlotStats) => (x(d.key) || 0) + x.bandwidth()/2 - boxWidth/2)
        .attr("x2", (d: BoxPlotStats) => (x(d.key) || 0) + x.bandwidth()/2 + boxWidth/2)
        .attr("y1", (d: BoxPlotStats) => y(d.median))
        .attr("y2", (d: BoxPlotStats) => y(d.median))
        .attr("stroke", "#1e293b")
        .style("width", 80);

    // Show the mean as a red dashed line
    g.selectAll(".meanLines")
      .data(stats)
      .enter()
      .append("line")
        .attr("class", "meanLines")
        .attr("x1", (d: BoxPlotStats) => (x(d.key) || 0) + x.bandwidth()/2 - boxWidth/2)
        .attr("x2", (d: BoxPlotStats) => (x(d.key) || 0) + x.bandwidth()/2 + boxWidth/2)
        .attr("y1", (d: BoxPlotStats) => y(d.mean))
        .attr("y2", (d: BoxPlotStats) => y(d.mean))
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4 2");

  }, [stats, metric]);

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <div className="text-[10px] text-slate-400 font-mono uppercase">Interactive Box Plot</div>
      </div>
      <svg 
        ref={svgRef} 
        className="w-full h-[400px]"
      />
      <div 
        ref={tooltipRef}
        className="absolute pointer-events-none bg-white border border-slate-200 rounded-lg shadow-xl p-3 opacity-0 z-50 min-w-[150px]"
        style={{ transition: 'opacity 0.2s ease' }}
      />
    </div>
  );
}
