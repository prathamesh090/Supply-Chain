import { getSupplierRankings, type SupplierRanking } from '@/lib/api';
import type { GlobalRiskEventItem, RiskEventItem, SupplierDetailData, SupplierRiskRow } from './types';

const API_BASE = 'http://localhost:8000';

const scoreToRiskLevel = (score: number): string => {
  if (score >= 67) return 'High';
  if (score >= 34) return 'Medium';
  return 'Low';
};

const mapSupplier = (item: SupplierRanking): SupplierRiskRow => {
  const inherentScore = Math.max(1, Math.min(100, Math.round((item.trust_score * 0.35) + (Math.abs(item.avg_price_variance_percent) * 1.8) + (item.avg_defect_rate_percent * 1.4))));

  return {
    supplierId: item.supplier_name,
    supplierName: item.supplier_name,
    country: 'Global',
    industry: 'Materials',
    connectedMaterials: item.plastic_types ?? [],
    financialRiskScore: Math.round(item.risk_score_ui),
    financialRiskLevel: item.predicted_risk,
    inherentRiskScore: inherentScore,
    inherentRiskLevel: scoreToRiskLevel(inherentScore),
    integratedRiskScore: Math.round((item.risk_score_ui * 0.6) + (inherentScore * 0.4)),
    integratedRiskLevel: scoreToRiskLevel((item.risk_score_ui * 0.6) + (inherentScore * 0.4)),
    recentIncident: item.risk_summary,
    lastUpdated: new Date().toISOString(),
  };
};

const safeFetch = async <T>(path: string): Promise<T | null> => {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

export const fetchSupplierMonitoringData = async (): Promise<SupplierRiskRow[]> => {
  const rankings = await getSupplierRankings();
  return (rankings.rankings ?? []).map(mapSupplier);
};

export const fetchRecentRiskEvents = async (): Promise<RiskEventItem[]> => {
  const result = await safeFetch<{ events: RiskEventItem[] }>('/api/risk-events/recent');
  return result?.events ?? [];
};

export const fetchGlobalRiskEvents = async (): Promise<GlobalRiskEventItem[]> => {
  const result = await safeFetch<{ events: GlobalRiskEventItem[] }>('/api/global-risk/');
  return result?.events ?? [];
};

interface RiskFeedResponse {
  risk_scope?: string[];
}

interface IntegratedRiskResponse {
  financial_risk?: { risk_score?: number; risk_level?: string; explanation?: string };
  inherent_risk?: { rolling_risk_score?: number; risk_level?: string };
  integrated_risk_score?: number;
  integrated_risk_level?: string;
}

const getSupplierFeed = async (supplierId: string) => {
  return safeFetch<RiskFeedResponse>(`/api/risk-feed/${encodeURIComponent(supplierId)}`);
};

const getIntegratedRisk = async (supplierId: string) => {
  return safeFetch<IntegratedRiskResponse>(`/api/integrated-risk/${encodeURIComponent(supplierId)}`);
};

export const fetchSupplierDetail = async (supplier: SupplierRiskRow): Promise<SupplierDetailData> => {
  const [feed, integrated, events] = await Promise.all([
    getSupplierFeed(supplier.supplierId),
    getIntegratedRisk(supplier.supplierId),
    fetchRecentRiskEvents(),
  ]);

  const supplierEvents = events.filter((event) => event.supplier_id === supplier.supplierId).slice(0, 8);
  const explanation = integrated?.financial_risk?.explanation ?? feed?.risk_scope?.join(', ') ?? supplier.recentIncident;

  const trendSeries = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - ((5 - i) * 7));
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      financial: Math.max(0, Math.min(100, supplier.financialRiskScore + (i - 2) * 3)),
      inherent: Math.max(0, Math.min(100, supplier.inherentRiskScore + (2 - i) * 2)),
      integrated: Math.max(0, Math.min(100, supplier.integratedRiskScore + (i % 3) - 1)),
      incidents: supplierEvents.filter((event) => new Date(event.created_at).getTime() <= d.getTime()).length,
    };
  });

  return {
    supplier: {
      ...supplier,
      financialRiskScore: Math.round(integrated?.financial_risk?.risk_score ?? supplier.financialRiskScore),
      financialRiskLevel: integrated?.financial_risk?.risk_level ?? supplier.financialRiskLevel,
      inherentRiskScore: Math.round(integrated?.inherent_risk?.rolling_risk_score ?? supplier.inherentRiskScore),
      inherentRiskLevel: integrated?.inherent_risk?.risk_level ?? supplier.inherentRiskLevel,
      integratedRiskScore: Math.round(integrated?.integrated_risk_score ?? supplier.integratedRiskScore),
      integratedRiskLevel: integrated?.integrated_risk_level ?? supplier.integratedRiskLevel,
    },
    riskExplanation: explanation,
    incidentTimeline: supplierEvents,
    trendSeries,
    inherentRiskFactors: {
      materialExposure: supplier.connectedMaterials.length ? `Exposure concentrated in ${supplier.connectedMaterials.join(', ')} feedstocks.` : 'No material exposure data available.',
      recyclabilityRisk: supplier.connectedMaterials.some((m) => ['PVC', 'PS'].includes(m.toUpperCase())) ? 'Mixed recyclability profile with harder-to-recycle material classes.' : 'Mostly recyclable material mix.',
      hazardousComposition: supplier.connectedMaterials.some((m) => m.toUpperCase() === 'PVC') ? 'Contains chlorine-based polymer dependency with potential hazardous additive constraints.' : 'No high-concern hazardous composition detected in current material profile.',
      regulatorySensitivity: 'Sensitivity to tightening packaging, waste, and EPR regulations across operating regions.',
      rawMaterialDependency: 'Dependency on petrochemical feedstock pricing and availability volatility.',
    },
  };
};
