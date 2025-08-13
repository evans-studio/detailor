"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { twMerge } from 'tailwind-merge';

// Simple chart components without external dependencies
// In production, you'd use a library like Recharts, Chart.js, or D3

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  date?: string;
}

export interface ChartProps {
  data: ChartDataPoint[];
  title?: string;
  description?: string;
  height?: number;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
}

// Premium Bar Chart Component with Animations
export function BarChart({ 
  data, 
  title, 
  description, 
  height = 300, 
  className,
  showLegend = true,
  showGrid = true 
}: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <Card className={twMerge('border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white animate-fade-scale hover-lift', className)}>
      {(title || description) && (
        <CardHeader className="border-b border-gray-100 bg-gray-50">
          {title && <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            {title}
          </CardTitle>}
          {description && <CardDescription className="text-gray-600 mt-1">{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-6">
        <div className="relative" style={{ height }}>
          {/* Chart Area */}
          <div className="flex items-end justify-between h-full gap-2 pb-8 pr-4">
            {data.map((item, index) => {
              const barHeight = (item.value / maxValue) * (height - 60);
              const isHovered = hoveredIndex === index;
              
              return (
                <div
                  key={item.label}
                  className="flex-1 flex flex-col items-center group relative"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-[var(--color-slate-900)] text-white px-3 py-2 rounded-[var(--radius-md)] text-[var(--font-size-sm)] font-medium shadow-[var(--shadow-lg)]">
                        <div>{item.label}</div>
                        <div className="text-[var(--color-slate-300)]">{item.value.toLocaleString()}</div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--color-slate-900)]" />
                      </div>
                    </div>
                  )}
                  
                  {/* Bar */}
                  <div
                    className={`
                      w-full rounded-t-[var(--radius-sm)] transition-all duration-[var(--duration-normal)]
                      ${item.color || 'bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-primary-300)]'}
                      ${isHovered ? 'opacity-100 scale-105' : 'opacity-80'}
                      hover:opacity-100 cursor-pointer
                    `}
                    style={{ height: barHeight }}
                  />
                  
                  {/* Label */}
                  <div className="mt-2 text-xs text-gray-500 text-center font-medium min-h-[2rem] flex items-center">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid Lines */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-full border-t border-[var(--color-border)] opacity-30"
                  style={{ bottom: `${20 + (i * ((height - 60) / 4))}px` }}
                />
              ))}
            </div>
          )}

          {/* Y-Axis Labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-4 pr-2">
            {[...Array(5)].map((_, i) => {
              const value = Math.round((maxValue * (4 - i)) / 4);
              return (
                <div
                  key={i}
                  className="text-xs text-gray-500 font-medium"
                >
                  {value.toLocaleString()}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        {showLegend && data.some(d => d.color) && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm shadow-sm"
                  style={{ backgroundColor: item.color || '#3B82F6' }}
                />
                <span className="text-sm text-gray-600 font-medium">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Premium Line Chart Component with Animations
export function LineChart({ 
  data, 
  title, 
  description, 
  height = 300, 
  className,
  showGrid = true 
}: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  // Generate SVG path for line
  const generatePath = () => {
    if (data.length < 2) return '';
    
    const width = 100; // Percentage width
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = 100 - ((item.value - minValue) / range) * 100;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  return (
    <Card className={twMerge('border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white animate-fade-scale hover-lift', className)}>
      {(title || description) && (
        <CardHeader className="border-b border-gray-100 bg-gray-50">
          {title && <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            {title}
          </CardTitle>}
          {description && <CardDescription className="text-gray-600 mt-1">{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-6">
        <div className="relative" style={{ height }}>
          {/* SVG Chart */}
          <div className="relative h-full pb-8 pr-4">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Grid Lines */}
              {showGrid && (
                <g className="opacity-20">
                  {[...Array(5)].map((_, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 25}
                      x2="100"
                      y2={i * 25}
                      stroke="var(--color-border)"
                      strokeWidth="0.5"
                    />
                  ))}
                </g>
              )}
              
              {/* Area under curve */}
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              
              <path
                d={`${generatePath()} L 100,100 L 0,100 Z`}
                fill="url(#chartGradient)"
              />
              
              {/* Line */}
              <path
                d={generatePath()}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="filter drop-shadow-sm"
              />
              
              {/* Data Points */}
              {data.map((item, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = 100 - ((item.value - minValue) / range) * 100;
                const isHovered = hoveredIndex === index;
                
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r={isHovered ? "2" : "1.5"}
                    fill="var(--color-primary)"
                    stroke="var(--color-surface)"
                    strokeWidth="2"
                    className="transition-all cursor-pointer hover:r-2"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Tooltips */}
            {hoveredIndex !== null && (
              <div className="absolute pointer-events-none z-10">
                <div 
                  className="absolute transform -translate-x-1/2 -translate-y-full mb-2"
                  style={{
                    left: `${(hoveredIndex / (data.length - 1)) * 100}%`,
                    bottom: `${((data[hoveredIndex].value - minValue) / range) * 100}%`
                  }}
                >
                  <div className="bg-[var(--color-slate-900)] text-white px-3 py-2 rounded-[var(--radius-md)] text-[var(--font-size-sm)] font-medium shadow-[var(--shadow-lg)]">
                    <div>{data[hoveredIndex].label}</div>
                    <div className="text-[var(--color-slate-300)]">{data[hoveredIndex].value.toLocaleString()}</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--color-slate-900)]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* X-Axis Labels */}
          <div className="absolute bottom-0 left-0 right-4 flex justify-between">
            {data.map((item, index) => (
              <div
                key={index}
                className="text-xs text-gray-500 font-medium"
              >
                {item.label}
              </div>
            ))}
          </div>

          {/* Y-Axis Labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-4 pr-2">
            {[...Array(5)].map((_, i) => {
              const value = Math.round(maxValue - (i * range / 4));
              return (
                <div
                  key={i}
                  className="text-xs text-gray-500 font-medium"
                >
                  {value.toLocaleString()}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Premium Donut Chart Component with Animations
export function DonutChart({ 
  data, 
  title, 
  description, 
  className,
  showLegend = true,
  centerContent,
}: ChartProps & { centerContent?: React.ReactNode }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  
  // Calculate angles for each segment
  const segments = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = data.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0);
    
    return {
      ...item,
      percentage,
      angle,
      startAngle,
      endAngle: startAngle + angle,
    };
  });

  const radius = 85;
  const innerRadius = 55;
  const centerX = 100;
  const centerY = 100;

  const createArc = (startAngle: number, endAngle: number, outerRadius: number, innerRadius: number) => {
    const start = polarToCartesian(centerX, centerY, outerRadius, endAngle);
    const end = polarToCartesian(centerX, centerY, outerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    const outerArc = [
      "M", start.x, start.y, 
      "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");

    const innerStart = polarToCartesian(centerX, centerY, innerRadius, endAngle);
    const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle);
    
    const innerArc = [
      "L", innerEnd.x, innerEnd.y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 0, innerStart.x, innerStart.y
    ].join(" ");

    return `${outerArc} ${innerArc} Z`;
  };

  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  return (
    <Card className={twMerge('border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white', className)}>
      {(title || description) && (
        <CardHeader className="border-b border-gray-100 bg-gray-50">
          {title && <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            {title}
          </CardTitle>}
          {description && <CardDescription className="text-gray-600 mt-1">{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Chart */}
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {segments.map((segment, index) => {
                const isHovered = hoveredIndex === index;
                const adjustedRadius = isHovered ? radius + 5 : radius;
                
                return (
                  <path
                    key={index}
                    d={createArc(segment.startAngle, segment.endAngle, adjustedRadius, innerRadius)}
                    fill={segment.color || `hsl(${index * 137.5 % 360}, 70%, 60%)`}
                    stroke="var(--color-surface)"
                    strokeWidth="2"
                    className="transition-all cursor-pointer hover:opacity-90"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {centerContent || (
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {total.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Total
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          {showLegend && (
            <div className="flex-1 space-y-3">
              {segments.map((segment, index) => (
                <div
                  key={index}
                  className={`
                    flex items-center justify-between p-3 rounded-lg transition-all duration-200 cursor-pointer
                    ${hoveredIndex === index ? 'bg-gray-50 shadow-sm' : 'hover:bg-gray-50'}
                  `}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: segment.color || `hsl(${index * 137.5 % 360}, 70%, 60%)` }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {segment.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {segment.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      {(segment.percentage * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Modern Chart Loading Skeleton
export function ChartSkeleton({ height = 300, className }: { height?: number; className?: string }) {
  return (
    <Card className={twMerge('border-gray-200 bg-white', className)}>
      <CardHeader className="border-b border-gray-100 bg-gray-50">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full" />
            <div className="h-5 bg-gray-300 rounded w-32" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-48" />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="animate-pulse" style={{ height }}>
          <div className="h-full bg-gray-200 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}