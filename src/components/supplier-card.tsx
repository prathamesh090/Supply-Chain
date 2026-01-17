import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Star, CheckCircle2, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SupplierCardProps {
  supplier: {
    supplier_name: string;
    predicted_risk: string;
    risk_score: number;
    risk_score_ui?: number;
    risk_level: string;
    probabilities: Record<string, number>;
    avg_delivery_delay_days: number;
    avg_defect_rate_percent: number;
    avg_price_variance_percent: number;
    compliance_rate: number;
    trust_score: number;
    plastic_types: string[];
    risk_summary: string;
    risk_rank?: number;
  };
}

export function SupplierCard({ supplier }: SupplierCardProps) {
  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
      <Link to={`/supplier/${encodeURIComponent(supplier.supplier_name)}`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg mb-1">{supplier.supplier_name}</CardTitle>
              <Badge className={`px-3 py-1 ${getRiskColor(supplier.predicted_risk)}`}>
                {supplier.predicted_risk} Risk
              </Badge>
            </div>
            {supplier.risk_rank && (
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">#{supplier.risk_rank}</span>
                <p className="text-xs text-muted-foreground">Rank</p>
              </div>
            )}
          </div>
          <CardDescription className="line-clamp-2">{supplier.risk_summary}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Risk Score</span>
              </div>
              <span className="text-lg font-bold">{supplier.risk_score.toFixed(1)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Avg Delay</span>
              </div>
              <span>{supplier.avg_delivery_delay_days.toFixed(1)} days</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Trust Score</span>
              </div>
              <span>{supplier.trust_score.toFixed(1)}</span>
            </div>
            
            {supplier.plastic_types && supplier.plastic_types.length > 0 && (
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {supplier.plastic_types.slice(0, 2).join(', ')}
                  {supplier.plastic_types.length > 2 && '...'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}