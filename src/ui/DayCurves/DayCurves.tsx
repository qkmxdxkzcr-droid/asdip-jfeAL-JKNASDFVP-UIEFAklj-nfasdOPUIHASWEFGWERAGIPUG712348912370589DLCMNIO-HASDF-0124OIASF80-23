import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import { buildCurves } from '../../core/curves'

export function DayCurves() {
  const data = buildCurves()

  return (
    <div className="bg-panel rounded-xl border border-border p-s4">
      <h3 className="text-[14px] font-semibold text-text mb-4">Кривые дня</h3>
      
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="var(--border)" 
              opacity={0.3}
            />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={{ stroke: 'var(--border)' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
              axisLine={{ stroke: 'var(--border)' }}
              tickLine={{ stroke: 'var(--border)' }}
              domain={[0, 100]}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', color: 'var(--text-weak)' }}
            />
            <Line 
              type="monotone" 
              dataKey="cort" 
              stroke="#EF4444" 
              strokeWidth={1.5}
              name="Кортизол"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="dopa" 
              stroke="#7C4DFF" 
              strokeWidth={1.5}
              name="Дофамин"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="sero" 
              stroke="#22C55E" 
              strokeWidth={1.5}
              name="Серотонин"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="sleep" 
              stroke="#0EA5E9" 
              strokeWidth={1.5}
              name="Сонливость"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
