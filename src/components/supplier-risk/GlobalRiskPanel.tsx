import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { riskLevelStyles, GlobalRiskEvent } from "@/lib/supplier-risk-monitoring";
import { Globe } from "lucide-react";

interface Props {
  risks: GlobalRiskEvent[];
}

export function GlobalRiskPanel({ risks }: Props) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">Global Disruption Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {risks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active global disruptions.</p>
        ) : (
          risks.map((risk) => (
            <div key={risk.event_id} className="rounded-xl border p-3 bg-card/40">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{risk.event_type}</p>
                <Badge variant="outline" className={riskLevelStyles[risk.risk_level] ?? ""}>{risk.risk_level}</Badge>
              </div>
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                <p>Affected Region: {risk.affected_regions.join(", ") || "N/A"}</p>
                <p>Risk Score: {risk.risk_score.toFixed(1)}</p>
              </div>
              <div className="mt-3 rounded-lg bg-muted p-3 flex items-center gap-2 text-xs">
                <Globe className="h-4 w-4 text-primary" />
                <span>Regional marker: {risk.affected_regions[0] ?? "Global"}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
