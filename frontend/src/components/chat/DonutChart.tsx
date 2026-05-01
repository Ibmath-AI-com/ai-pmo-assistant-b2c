import { PieChart, Pie, Cell } from 'recharts'

interface Props {
  percentage: number
}

export function DonutChart({ percentage }: Props) {
  const clamped = Math.min(100, Math.max(0, Math.round(percentage)))
  const data = [{ value: clamped }, { value: 100 - clamped }]

  return (
    <div style={{ position: 'relative', width: 110, height: 110, margin: '0 auto' }}>
      <PieChart width={110} height={110}>
        <Pie
          data={data}
          cx={51}
          cy={51}
          innerRadius={32}
          outerRadius={50}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          strokeWidth={0}
        >
          <Cell fill="#1F2937" />
          <Cell fill="#E5E7EB" />
        </Pie>
      </PieChart>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color: '#1F2937',
        pointerEvents: 'none',
      }}>
        {clamped}%
      </div>
    </div>
  )
}
