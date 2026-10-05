import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';

export default function PriceChart({ data, optimalPrice }) {
  const formatCompactCurrency = (value) => `$${Math.round(value).toLocaleString()}`;

  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart
        data={data}
        margin={{ top: 25, right: 90, left: 15, bottom: 25 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />

        {/* X-Axis */}
        <XAxis
          dataKey="price"
          tickFormatter={(val) => `$${Math.round(val)}`}
          stroke="#94A3B8"
          dy={10}
        />

        {/* Left Y-Axis: Demand (Units) */}
        <YAxis
          yAxisId="left"
          orientation="left"
          stroke="#3B82F6"
          domain={[0, 'dataMax + 50']}
          tickLine={false}
          label={{
            value: 'Demand (Units)',
            angle: -90,
            position: 'insideLeft',
            fill: '#60A5FA',
            dx: -10,
          }}
        />

        {/* Right Y-Axis: Revenue & Profit ($) */}
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#10B981"
          domain={['auto', 'auto']}
          tickFormatter={formatCompactCurrency}
          tickLine={false}
          dx={10}
          label={{
            value: 'Financials ($)',
            angle: 90,
            position: 'insideRight',
            fill: '#34D399',
            dx: 65,
          }}
        />

        {/* Tooltip */}
        <Tooltip
          contentStyle={{
            backgroundColor: '#1E293B',
            borderColor: '#475569',
            borderRadius: '8px',
          }}
          formatter={(value, name) => [
            name === 'Demand' ? `${value} units` : `$${Number(value).toLocaleString()}`,
            name,
          ]}
          labelFormatter={(label) => `Price: $${Number(label).toFixed(2)}`}
        />

        <Legend verticalAlign="top" height={40} />

        {/* Optimal Price Vertical Line */}
        {optimalPrice > 0 && (
          <ReferenceLine
            x={optimalPrice}
            yAxisId="left"
            stroke="#10B981"
            strokeDasharray="4 4"
            strokeWidth={2}
            label={{
              value: `Optimal: $${optimalPrice}`,
              position: 'top',
              fill: '#34D399',
              fontSize: 12,
              fontWeight: 'bold',
              dy: -10,
            }}
          />
        )}

        {/* Demand Line */}
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="demand"
          name="Demand"
          stroke="#3B82F6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5 }}
        />

        {/* Revenue Line */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="revenue"
          name="Revenue ($)"
          stroke="#10B981"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6 }}
        />

        {/* Profit Line */}
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="profit"
          name="Profit ($)"
          stroke="#F59E0B"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}