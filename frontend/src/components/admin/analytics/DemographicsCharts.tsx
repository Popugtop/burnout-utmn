import { DemographicsData } from '../../../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Props { data: DemographicsData; }

const COLORS = ['#D55B34', '#2A5A6A', '#C47A30', '#34D5A0', '#E84430', '#6B7FA0', '#8B5CF6'];

function SimplePie({ title, data }: { title: string; data: Array<{ label: string|number; count: number }> }) {
  const pieData = data.map(d => ({ name: String(d.label), value: d.count }));
  return (
    <div className="card p-5">
      <h4 className="font-display text-base font-semibold mb-3">{title}</h4>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" outerRadius={65} dataKey="value"
            label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent*100).toFixed(0)}%` : ''} labelLine={false}>
            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: '#131827', border: '1px solid #222940', borderRadius: 8, color: '#E8ECF4' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DemographicsCharts({ data }: Props) {
  const courseData = data.by_course.map(d => ({ name: `Year ${d.label}`, value: d.count }));
  const deptData = data.by_department.slice(0, 8).map(d => ({
    name: String(d.label).split(' ').slice(-1)[0],
    count: d.count,
  }));

  return (
    <div className="mb-6">
      <h3 className="font-display text-lg font-semibold mb-4">Demographics</h3>
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <SimplePie title="By Course Year" data={courseData.map(d => ({label: d.name, count: d.value}))} />
        <div className="card p-5">
          <h4 className="font-display text-base font-semibold mb-3">By Department (top 8)</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222940" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#8892A8', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#8892A8', fontSize: 10 }} width={60} />
              <Tooltip contentStyle={{ background: '#131827', border: '1px solid #222940', borderRadius: 8, color: '#E8ECF4' }} />
              <Bar dataKey="count" fill="#D55B34" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
