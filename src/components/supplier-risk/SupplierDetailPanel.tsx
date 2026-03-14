import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SupplierDetailData } from './types';

const levelClass = (level: string) => level.toLowerCase() === 'high'
  ? 'bg-red-100 text-red-800 border-red-200'
  : level.toLowerCase() === 'medium'
    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
    : 'bg-green-100 text-green-800 border-green-200';

export function SupplierDetailPanel({
  open,
  onOpenChange,
  detail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: SupplierDetailData | null;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        {!detail ? null : (
          <div className="space-y-5">
            <SheetHeader>
              <SheetTitle>{detail.supplier.supplierName}</SheetTitle>
              <SheetDescription>{detail.supplier.country} • {detail.supplier.industry}</SheetDescription>
            </SheetHeader>

            <Card>
              <CardHeader><CardTitle className="text-base">Supplier Profile</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><strong>Connected Materials:</strong> {detail.supplier.connectedMaterials.join(', ') || 'N/A'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Risk Score Sections</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between items-center"><span>Financial Risk Score</span><Badge className={levelClass(detail.supplier.financialRiskLevel)}>{detail.supplier.financialRiskLevel} ({detail.supplier.financialRiskScore})</Badge></div>
                <div className="flex justify-between items-center"><span>Inherent Risk Score</span><Badge className={levelClass(detail.supplier.inherentRiskLevel)}>{detail.supplier.inherentRiskLevel} ({detail.supplier.inherentRiskScore})</Badge></div>
                <div className="flex justify-between items-center"><span>Integrated Risk Score</span><Badge className={levelClass(detail.supplier.integratedRiskLevel)}>{detail.supplier.integratedRiskLevel} ({detail.supplier.integratedRiskScore})</Badge></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Material / Plastic Inherent Risk</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Material-level exposure:</strong> {detail.inherentRiskFactors.materialExposure}</p>
                <p><strong>Recyclability:</strong> {detail.inherentRiskFactors.recyclabilityRisk}</p>
                <p><strong>Hazardous composition:</strong> {detail.inherentRiskFactors.hazardousComposition}</p>
                <p><strong>Regulatory sensitivity:</strong> {detail.inherentRiskFactors.regulatorySensitivity}</p>
                <p><strong>Raw-material dependency:</strong> {detail.inherentRiskFactors.rawMaterialDependency}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Risk Explanation</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{detail.riskExplanation}</p></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Incident Timeline</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {detail.incidentTimeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No incidents found for this supplier.</p>
                ) : detail.incidentTimeline.map((event, idx) => (
                  <div key={`${event.supplier_id}-${idx}`} className="border rounded-md p-2 text-sm">
                    <p>{event.event_text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(event.created_at).toLocaleString()} • {event.category}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
