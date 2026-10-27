'use client';

import { Bar, CartesianGrid, Cell, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartPoint } from '../../lib/stats';

export function IntakeChart({ data }: { data: ChartPoint[] }) {
  const dense = data.length > 14;
  return (
    <div className="h-64 w-full" role="img" aria-label={`Bar chart of daily water intake over the last ${data.length} days`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} interval={dense ? Math.ceil(data.length / 8) - 1 : 0} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} />
          <Tooltip
            cursor={{ fill: 'rgba(37,198,227,.12)' }}
            contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}
            formatter={(v, name) => [`${Number(v).toLocaleString('en-US')} mL`, name === 'ml' ? 'Intake' : 'Target']}
          />
          <Bar dataKey="ml" radius={[8, 8, 0, 0]} maxBarSize={36}>
            {data.map((d) => (
              <Cell key={d.key} fill={d.met ? '#0aa9c9' : '#8be8f8'} />
            ))}
          </Bar>
          <Line dataKey="goal" type="stepAfter" stroke="#ff8fab" strokeWidth={2} strokeDasharray="5 4" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

