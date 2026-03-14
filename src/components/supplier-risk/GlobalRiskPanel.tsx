import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GlobalRiskEventItem } from './types';

const levelClass = (level: string) => level.toLowerCase() === 'high'
  ? 'bg-red-100 text-red-800 border-red-200'
  : level.toLowerCase() === 'medium'
    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
    : 'bg-green-100 text-green-800 border-green-200';

export function GlobalRiskPanel({ events }: { events: GlobalRiskEventItem[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Global Disruption Panel</CardTitle></CardHeader>
      <CardContent className="space-y-3 max-h-72 overflow-auto">
        {events.length === 0 && <p className="text-muted-foreground">No global disruptions found.</p>}
        {events.map((event) => (
          <div key={event.event_id} className="rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">{event.event_type}</p>
              <Badge className={levelClass(event.risk_level)}>{event.risk_level}</Badge>
            </div>
            <p className="text-xs mt-1">Regions: {event.affected_regions.join(', ') || 'N/A'}</p>
            <p className="text-xs text-muted-foreground">Affects: {event.affects.join(', ') || 'N/A'}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
