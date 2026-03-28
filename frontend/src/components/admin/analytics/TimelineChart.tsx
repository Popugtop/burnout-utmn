import { TimelinePoint } from '../../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';

interface Props { data: TimelinePoint[]; }

export default function TimelineChart({ data }: Props) {
  return (
    <div className="grid lg:grid-cols-2 gap-6 mb-6">
      <div className="card p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Responses Over Time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 0, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222940" />
            <XAxis dataKey="date" tick={{ fill: '#8892A8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#8892A8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#131827', border: '1px solid #222940', borderRadius: 8, color: '#E8ECF4' }} />
            <Bar dataKey="count" fill="#2A5A6A" radius={[3,3,0,0]} name="Responses" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Score Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 0, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222940" />
            <XAxis dataKey="date" tick={{ fill: '#8892A8', fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#8892A8', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#131827', border: '1px solid #222940', borderRadius: 8, color: '#E8ECF4' }} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#8892A8' }} />
            <Line type="monotone" dataKey="mean_total" stroke="#D55B34" strokeWidth={2} dot={false} name="Total" />
            <Line type="monotone" dataKey="mean_academic" stroke="#C47A30" strokeWidth={1.5} dot={false} name="Academic" />
            <Line type="monotone" dataKey="mean_sleep" stroke="#2A5A6A" strokeWidth={1.5} dot={false} name="Sleep" />
            <Line type="monotone" dataKey="mean_emotional" stroke="#8B5CF6" strokeWidth={1.5} dot={false} name="Emotional" />
            <Line type="monotone" dataKey="mean_social" stroke="#34D5A0" strokeWidth={1.5} dot={false} name="Social" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
