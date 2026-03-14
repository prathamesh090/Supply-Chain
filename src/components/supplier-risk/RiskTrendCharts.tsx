import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import type { SupplierRiskRow } from './types';

interface Props {
  trendSeries: Array<{ date: string; financial: number; inherent: number; integrated: number; incidents: number }>;
  suppliers: SupplierRiskRow[];
}

export function RiskTrendCharts({ trendSeries, suppliers }: Props) {
  const distribution = [
    { name: 'Low', value: suppliers.filter((s) => s.integratedRiskLevel.toLowerCase() === 'low').length, color: '#22c55e' },
    { name: 'Medium', value: suppliers.filter((s) => s.integratedRiskLevel.toLowerCase() === 'medium').length, color: '#f59e0b' },
    { name: 'High', value: suppliers.filter((s) => s.integratedRiskLevel.toLowerCase() === 'high').length, color: '#ef4444' },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Card className="xl:col-span-2">
        <CardHeader><CardTitle>Risk Trend Over Time</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="financial" stroke="#3b82f6" name="Financial" />
              <Line type="monotone" dataKey="inherent" stroke="#8b5cf6" name="Inherent" />
              <Line type="monotone" dataKey="integrated" stroke="#ef4444" name="Integrated" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Supplier Risk Distribution</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={distribution} dataKey="value" nameKey="name" outerRadius={90} label>
                {distribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader><CardTitle>Incident Frequency Timeline</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="incidents" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
