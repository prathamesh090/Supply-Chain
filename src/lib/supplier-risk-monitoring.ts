import { getToken } from "@/lib/api";

const API_BASE_URL = "http://localhost:8000";

export type RiskLevel = "Low" | "Medium" | "High" | string;

export interface SupplierConfig {
  supplierId: string;
  supplierName: string;
  country: string;
  industry: string;
  connectedMaterials: string[];
}

export interface SupplierRiskFeed {
  supplier_id: string;
  supplier_name: string;
  supplier_risk_score: number;
  supplier_risk_level: RiskLevel;
  global_risk_score: number;
  global_event_count: number;
  final_risk_score: number;
  final_risk_level: RiskLevel;
  risk_scope: string[];
  valid_from: string;
  valid_to: string;
}

export interface IntegratedRiskResponse {
  status: string;
  supplier_id: string;
  supplier_name: string;
  financial_risk?: {
    risk_score: number;
    risk_level: RiskLevel;
    explanation?: string;
  };
  inherent_risk?: {
    rolling_risk_score: number;
    risk_level: RiskLevel;
    event_count: number;
  };
  integrated_risk_score: number;
  integrated_risk_level: RiskLevel;
}

export interface RecentRiskEvent {
  supplier_id: string;
  event_text: string;
  category: string;
  risk_level: RiskLevel;
  source: string;
  created_at: string;
}

export interface GlobalRiskEvent {
  event_id: string;
  event_type: string;
  risk_score: number;
  risk_level: RiskLevel;
  affected_regions: string[];
  affects: string[];
  valid_from: string;
  valid_to: string;
}

const monitoredSuppliers: SupplierConfig[] = [
  { supplierId: "PLASTIC-19749e1e", supplierName: "BASF", country: "Germany", industry: "Chemicals", connectedMaterials: ["PET", "HDPE", "Resin"] },
  { supplierId: "PLASTIC-bdb084f4", supplierName: "Dow", country: "USA", industry: "Petrochemicals", connectedMaterials: ["Polypropylene", "PVC"] },
  { supplierId: "PLASTIC-11ae6ca9", supplierName: "Mitsubishi", country: "Japan", industry: "Advanced Materials", connectedMaterials: ["Engineering Plastics", "Composites"] },
  { supplierId: "PLASTIC-26ef7f4a", supplierName: "LyondellBasell", country: "Netherlands", industry: "Polymer Manufacturing", connectedMaterials: ["PP", "PO"] },
];

const safeFetch = async <T>(path: string): Promise<T> => {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}: ${response.status}`);
  }

  return response.json();
};

export const supplierRiskMonitoringApi = {
  suppliers: monitoredSuppliers,
  async getRiskFeed(supplierId: string): Promise<SupplierRiskFeed> {
    return safeFetch<SupplierRiskFeed>(`/api/risk-feed/${supplierId}`);
  },
  async getIntegratedRisk(supplierId: string): Promise<IntegratedRiskResponse> {
    return safeFetch<IntegratedRiskResponse>(`/api/integrated-risk/${supplierId}`);
  },
  async getRecentEvents(): Promise<RecentRiskEvent[]> {
    const data = await safeFetch<{ events: RecentRiskEvent[] }>(`/api/risk-events/recent`);
    return data.events;
  },
  async getGlobalRisk(): Promise<GlobalRiskEvent[]> {
    const data = await safeFetch<{ events: GlobalRiskEvent[] }>(`/api/global-risk/`);
    return data.events;
  },
};

export const riskLevelStyles: Record<string, string> = {
  Low: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  High: "bg-red-500/15 text-red-600 border-red-500/30",
};
