import { motion } from "framer-motion";
import { AlertTriangle, Globe2, ShieldAlert, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  totalSuppliers: number;
  activeAlerts: number;
  highRiskSuppliers: number;
  globalDisruptions: number;
}

const cards = [
  { title: "Total Suppliers Monitored", key: "totalSuppliers", icon: Users },
  { title: "Active Risk Alerts", key: "activeAlerts", icon: AlertTriangle },
  { title: "High Risk Suppliers", key: "highRiskSuppliers", icon: ShieldAlert },
  { title: "Global Disruptions", key: "globalDisruptions", icon: Globe2 },
] as const;

export function RiskSummaryCards(props: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const value = props[card.key];
        const Icon = card.icon;

        return (
          <motion.div key={card.title} whileHover={{ y: -4, scale: 1.01 }} transition={{ duration: 0.2 }}>
            <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="mt-2 text-3xl font-bold">{value}</p>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-gradient-primary text-white flex items-center justify-center shadow-primary/20 shadow-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-hero" style={{ width: `${Math.min(100, 30 + index * 18)}%` }} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
