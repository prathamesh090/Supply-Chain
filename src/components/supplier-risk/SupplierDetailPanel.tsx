import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { riskLevelStyles, SupplierConfig } from "@/lib/supplier-risk-monitoring";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: SupplierConfig;
  scores?: {
    financial: number;
    inherent: number;
    integrated: number;
    financialLevel: string;
    inherentLevel: string;
    integratedLevel: string;
    explanation: string[];
    timeline: string[];
  };
}

export function SupplierDetailPanel({ open, onOpenChange, supplier, scores }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="p-6 pb-3">
          <SheetTitle>{supplier?.supplierName ?? "Supplier details"}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-70px)] px-6 pb-6">
          {!supplier || !scores ? (
            <p className="text-sm text-muted-foreground">No supplier selected.</p>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-4 space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Country:</span> {supplier.country}</p>
                  <p><span className="text-muted-foreground">Industry:</span> {supplier.industry}</p>
                  <p><span className="text-muted-foreground">Connected Materials:</span> {supplier.connectedMaterials.join(", ")}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Risk Scores</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[{label:"Financial",value:scores.financial,level:scores.financialLevel},{label:"Inherent",value:scores.inherent,level:scores.inherentLevel},{label:"Integrated",value:scores.integrated,level:scores.integratedLevel}].map((item)=> (
                    <div key={item.label} className="space-y-2">
                      <div className="flex justify-between text-sm items-center">
                        <span>{item.label} Risk Score</span>
                        <Badge variant="outline" className={riskLevelStyles[item.level] ?? ""}>{item.level}</Badge>
                      </div>
                      <Progress value={Math.min(100, item.value)} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Risk Explanation</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {scores.explanation.map((line) => <p key={line}>{line}</p>)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Incident Timeline</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {scores.timeline.map((event, idx) => (
                    <div key={event} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1" />
                        {idx !== scores.timeline.length - 1 && <Separator orientation="vertical" className="h-8" />}
                      </div>
                      <p className="text-sm">{event}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
