import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Props {
  labels: string[];
  allocated_quantities: number[];
  transport_costs: number[];
  distances_km: number[];
}

export function RouteOptimizationCharts({ labels, allocated_quantities, transport_costs, distances_km }: Props) {
  const data = labels.map((label, idx) => ({
    label,
    allocated: allocated_quantities[idx] ?? 0,
    cost: transport_costs[idx] ?? 0,
    distance: distances_km[idx] ?? 0,
  }));

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="allocated" fill="#2563eb" name="Allocated Qty" />
          <Bar dataKey="cost" fill="#7c3aed" name="Transport Cost" />
          <Bar dataKey="distance" fill="#14b8a6" name="Distance (km)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
