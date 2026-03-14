import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Globe2, ShieldAlert, Users } from 'lucide-react';

interface Props {
  totalSuppliers: number;
  activeRiskAlerts: number;
  highRiskSuppliers: number;
  globalDisruptions: number;
}

export function RiskSummaryCards({ totalSuppliers, activeRiskAlerts, highRiskSuppliers, globalDisruptions }: Props) {
  const cards = [
    { title: 'Total Suppliers Monitored', value: totalSuppliers, icon: Users },
    { title: 'Active Risk Alerts', value: activeRiskAlerts, icon: AlertTriangle },
    { title: 'High Risk Suppliers', value: highRiskSuppliers, icon: ShieldAlert },
    { title: 'Global Disruptions', value: globalDisruptions, icon: Globe2 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium">{card.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-3xl font-bold">{card.value}</span>
            <card.icon className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
