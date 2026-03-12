import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { riskLevelStyles, RecentRiskEvent, SupplierConfig } from "@/lib/supplier-risk-monitoring";
import { formatDistanceToNow } from "date-fns";

interface Props {
  events: RecentRiskEvent[];
  supplierLookup: Record<string, SupplierConfig>;
}

export function IncidentFeed({ events, supplierLookup }: Props) {
  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader>
        <CardTitle className="text-lg">Recent Incident Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80 pr-4">
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent incidents reported.</p>
            ) : (
              events.map((event) => {
                const supplier = supplierLookup[event.supplier_id];
                return (
                  <div key={`${event.supplier_id}-${event.created_at}`} className="rounded-xl border p-3 space-y-2 bg-card/40">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-sm">{event.event_text}</p>
                      <Badge variant="outline" className={riskLevelStyles[event.risk_level] ?? ""}>{event.risk_level}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                      <span>Supplier: {supplier?.supplierName ?? event.supplier_id}</span>
                      <span>Country: {supplier?.country ?? "Unknown"}</span>
                      <span>Incident Type: {event.category}</span>
                      <span>{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
