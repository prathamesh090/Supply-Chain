export type RiskLevel = 'Low' | 'Medium' | 'High' | string;

export interface SupplierRiskRow {
  supplierId: string;
  supplierName: string;
  country: string;
  industry: string;
  connectedMaterials: string[];
  financialRiskScore: number;
  financialRiskLevel: RiskLevel;
  inherentRiskScore: number;
  inherentRiskLevel: RiskLevel;
  integratedRiskScore: number;
  integratedRiskLevel: RiskLevel;
  recentIncident: string;
  lastUpdated: string;
}

export interface RiskEventItem {
  supplier_id: string;
  event_text: string;
  category: string;
  risk_level: RiskLevel;
  source: string;
  created_at: string;
}

export interface GlobalRiskEventItem {
  event_id: string;
  event_type: string;
  risk_score: number;
  risk_level: RiskLevel;
  affected_regions: string[];
  affects: string[];
  valid_from: string;
  valid_to: string;
}

export interface SupplierDetailData {
  supplier: SupplierRiskRow;
  riskExplanation: string;
  incidentTimeline: RiskEventItem[];
  trendSeries: Array<{ date: string; financial: number; inherent: number; integrated: number; incidents: number }>;
  inherentRiskFactors: {
    materialExposure: string;
    recyclabilityRisk: string;
    hazardousComposition: string;
    regulatorySensitivity: string;
    rawMaterialDependency: string;
  };
}
