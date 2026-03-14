import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RiskEventItem } from './types';

const levelClass = (level: string) => level.toLowerCase() === 'high'
  ? 'bg-red-100 text-red-800 border-red-200'
  : level.toLowerCase() === 'medium'
    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
    : 'bg-green-100 text-green-800 border-green-200';

export function IncidentFeed({ events }: { events: RiskEventItem[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Recent Incident Feed</CardTitle></CardHeader>
      <CardContent className="space-y-3 max-h-72 overflow-auto">
        {events.length === 0 && <p className="text-muted-foreground">No recent incidents available.</p>}
        {events.map((event, idx) => (
          <div key={`${event.supplier_id}-${idx}`} className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">{event.supplier_id}</p>
              <Badge className={levelClass(event.risk_level)}>{event.risk_level}</Badge>
            </div>
            <p className="text-sm mt-1">{event.event_text}</p>
            <p className="text-xs text-muted-foreground mt-1">{new Date(event.created_at).toLocaleString()} • {event.source}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
