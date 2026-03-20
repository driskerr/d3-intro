import { useState, useEffect } from "react";
import * as d3 from "d3";
import { flagEmoji, countryRegion } from "./data/students";

const regions = [...new Set(Object.values(countryRegion))];

const palette = {
  Americas:      "#c49a3c",
  Europe:        "#5b8db8",
  Asia:          "#4a9e7a",
  "Middle East": "#a8688a",
  Oceania:       "#a8688a",
};

const colorScale = d3.scaleOrdinal()
  .domain(regions)
  .range(regions.map((r) => palette[r] ?? "#999"));

const width = 500;
const height = 400;
const margin = { top: 55, right: 30, bottom: 55, left: 110 };
const boundsWidth = width - margin.left - margin.right;
const boundsHeight = height - margin.top - margin.bottom;

const legendBoxWidth = 100;
const legendPad = 5;
const legendItemHeight = 15;

export function Barplot({ data, title, subtitle, source }) {
  const [tooltip, setTooltip] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedBar, setSelectedBar] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  const sortedRegions = [...regions].sort((a, b) => {
    const avg = (r) => d3.mean(data.filter((d) => countryRegion[d.country] === r), (d) => d.students);
    return avg(b) - avg(a);
  });

  const yScale = d3.scaleBand()
    .domain(data.map((d) => d.country))
    .range([0, boundsHeight])
    .padding(0.2);

  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, (d) => d.students)])
    .range([0, boundsWidth]);

  const isActive = (country) =>
    (!selectedBar || selectedBar === country) &&
    (!selectedRegion || countryRegion[country] === selectedRegion);

  const bars = data.map((d, i) => (
    <g key={d.country}>
      <rect
        x={0}
        y={yScale(d.country)}
        width={xScale(d.students)}
        height={yScale.bandwidth()}
        rx={3}
        fill={colorScale(countryRegion[d.country])}
        opacity={isActive(d.country) ? 1 : 0.2}
        stroke={tooltip?.country === d.country ? "black" : "none"}
        strokeWidth={2}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedBar(selectedBar === d.country ? null : d.country);
          setSelectedRegion(null);
        }}
        style={{
          cursor: "pointer",
          transformBox: "fill-box",
          transformOrigin: "left",
          transform: ready ? "scaleX(1)" : "scaleX(0)",
          transition: `transform 0.6s cubic-bezier(0.4,0,0.2,1) ${i * 0.03}s`,
        }}
        onMouseEnter={(e) => {
          const rect = e.target.getBoundingClientRect();
          setTooltip({ country: d.country, students: d.students, x: rect.right, y: rect.top + rect.height / 2 });
        }}
        onMouseLeave={() => setTooltip(null)}
      />
      <text
        x={xScale(d.students) + 4}
        y={yScale(d.country) + yScale.bandwidth() / 2}
        dy="0.35em"
        fontSize={10}
        fill="#333"
        opacity={isActive(d.country) ? 1 : 0}
      >
        {d.students}
      </text>
    </g>
  ));

  const yLabels = yScale.domain().map((country) => (
    <text
      key={country}
      x={-9}
      y={yScale(country) + yScale.bandwidth() / 2}
      dy="0.35em"
      textAnchor="end"
      fontSize={11}
    >
      {country}
    </text>
  ));

  const xTicks = xScale.ticks(5).map((tick) => (
    <g key={tick} transform={`translate(${xScale(tick)}, 0)`}>
      <line y1={0} y2={boundsHeight} stroke="#f0f0f0" />
      <text y={boundsHeight + 15} dy="0.72em" textAnchor="middle" fontSize={11} fill="#888">
        {tick}
      </text>
    </g>
  ));

  const legendBoxHeight = sortedRegions.length * legendItemHeight + legendPad * 2;
  const legendX = margin.left + boundsWidth * 0.7;
  const legendY = margin.top + boundsHeight * 0.88 - legendBoxHeight;

  const legend = (
    <g>
      <text
        x={legendX + legendBoxWidth / 2}
        y={legendY - 5}
        fontSize={11}
        fontWeight={700}
        fill="#333"
        textAnchor="middle"
      >
        Region
      </text>
      <rect
        x={legendX}
        y={legendY}
        width={legendBoxWidth}
        height={legendBoxHeight}
        fill="#fafaf8"
        stroke="#ccc"
        strokeWidth={1}
        rx={4}
      />
      {sortedRegions.map((region, i) => (
        <g
          key={region}
          transform={`translate(${legendX + legendPad}, ${legendY + legendPad + i * legendItemHeight})`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRegion(selectedRegion === region ? null : region);
            setSelectedBar(null);
          }}
          style={{ cursor: "pointer" }}
        >
          <rect
            y={1}
            width={10}
            height={10}
            rx={2}
            fill={colorScale(region)}
            opacity={selectedRegion && selectedRegion !== region ? 0.4 : 1}
          />
          <text
            x={16}
            y={10}
            fontSize={11}
            fill="#333"
            fontWeight={selectedRegion === region ? "bold" : "normal"}
            opacity={selectedRegion && selectedRegion !== region ? 0.4 : 1}
          >
            {region}
          </text>
        </g>
      ))}
      <text
        x={legendX + legendBoxWidth / 2}
        y={legendY + legendBoxHeight + 12}
        fontSize={10}
        fill="#999"
        fontStyle="italic"
        textAnchor="middle"
      >
        Total: {d3.sum(data, (d) => d.students)} students
      </text>
    </g>
  );

  return (
    <div className="barplot-container" onClick={() => { setSelectedBar(null); setSelectedRegion(null); }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        className="barplot-svg"
      >
        {title && (
          <text
            x={10} y={20} fontSize={20} fontWeight={700} fill="#111"
            style={{ opacity: ready ? 1 : 0, transition: "opacity 0.6s ease" }}
          >
            {title}
          </text>
        )}
        {subtitle && (
          <text
            x={10} y={36} fontSize={12} fill="#666" fontStyle="italic"
            style={{ opacity: ready ? 1 : 0, transition: "opacity 0.8s ease 0.2s" }}
          >
            {subtitle}
          </text>
        )}
        <g transform={`translate(${margin.left},${margin.top})`}>
          {xTicks}
          <line x1={0} x2={0} y1={0} y2={boundsHeight} stroke="#ccc" />
          <line x1={0} x2={boundsWidth} y1={boundsHeight} y2={boundsHeight} stroke="#ccc" />
          <text
            x={boundsWidth / 2}
            y={boundsHeight + 46}
            textAnchor="middle"
            fontSize={12}
            fontStyle="italic"
          >
            # of Students
          </text>
          {bars}
          {yLabels}
        </g>
        {legend}
        {source && (
          <text x={10} y={height - 4} fontSize={10} fill="#999" fontStyle="italic">
            {source}
          </text>
        )}
      </svg>
      {tooltip && (
        <div
          className="barplot-tooltip"
          style={{ top: tooltip.y, left: tooltip.x + 8, transform: "translateY(-50%)" }}
        >
          <strong>{flagEmoji[tooltip.country]} {tooltip.country}</strong>
          <br />
          <strong>{tooltip.students}</strong> students
        </div>
      )}
    </div>
  );
}
