import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Shield, Clock, Star, CheckCircle2, TrendingUp, Hash, Boxes, Info, ListTree } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Tooltip,
  Legend 
} from 'recharts';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { fetchSupplierDetail as fetchSupplierDeepDetail } from '@/components/supplier-risk/api';
import type { SupplierDetailData, SupplierRiskRow } from '@/components/supplier-risk/types';
import { getSupplierRankings } from '@/lib/api';

interface SupplierData {
  supplier_name: string;
  predicted_risk: string;
  risk_score: number;
  risk_score_ui: number;
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
  total_suppliers?: number;
}

export default function SupplierDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<SupplierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<SupplierDetailData | null>(null);

  useEffect(() => {
    const loadSupplierDetail = async () => {
      if (!name) {
        setError('Missing supplier name in URL');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        let data: { rankings?: SupplierData[] } = { rankings: [] };
        try {
          data = await getSupplierRankings();
        } catch {
          const response = await fetch('http://localhost:8000/api/supplier-risk/rankings');
          if (!response.ok) {
            throw new Error(`Failed to fetch supplier data: ${response.statusText}`);
          }
          data = await response.json();
        }

        const decodedName = decodeURIComponent(name);
        const normalizedName = decodedName.trim().toLowerCase();
        
        // Find the supplier by name in the rankings
        const foundSupplier = data.rankings?.find((s: SupplierData) => 
          s.supplier_name === decodedName || s.supplier_name?.trim().toLowerCase() === normalizedName
        );
        
        if (foundSupplier) {
          setSupplier(foundSupplier);

          const mappedSupplier: SupplierRiskRow = {
            supplierId: foundSupplier.supplier_name,
            supplierName: foundSupplier.supplier_name,
            country: 'Global',
            industry: 'Materials',
            connectedMaterials: foundSupplier.plastic_types || [],
            financialRiskScore: Math.round(foundSupplier.risk_score_ui ?? foundSupplier.risk_score ?? 0),
            financialRiskLevel: foundSupplier.predicted_risk,
            inherentRiskScore: Math.round((foundSupplier.trust_score ?? 50) * 0.7),
            inherentRiskLevel: foundSupplier.predicted_risk,
            integratedRiskScore: Math.round(foundSupplier.risk_score_ui ?? foundSupplier.risk_score ?? 0),
            integratedRiskLevel: foundSupplier.predicted_risk,
            recentIncident: foundSupplier.risk_summary,
            lastUpdated: new Date().toISOString(),
          };

          const extra = await fetchSupplierDeepDetail(mappedSupplier);
          setDetailData(extra);
        } else {
          setError(`Supplier '${decodedName}' not found`);
        }
      } catch (err: any) {
        console.error('Error fetching supplier:', err);
        setError(err.message || 'Failed to fetch supplier data');
      } finally {
        setLoading(false);
      }
    };

    loadSupplierDetail();
  }, [name]);

  const handleBack = () => {
    navigate('/supplier-risk');
  };

  // Custom tooltip components
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-blue-600">
            <span className="font-medium">Probability: </span>
            {`${payload[0].value.toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-blue-600">
            <span className="font-medium">Value: </span>
            {`${payload[0].value.toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const CircularProgress = ({ value, riskLevel, size = 120 }: { value: number; riskLevel: string; size?: number }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    // Determine color based on risk level
    const getProgressColor = (risk: string) => {
      switch (risk.toLowerCase()) {
        case 'low':
          return '#22c55e'; // Green
        case 'medium':
          return '#f59e0b'; // Yellow/Orange
        case 'high':
          return '#ef4444'; // Red
        default:
          return '#6b7280'; // Gray
      }
    };

    const progressColor = getProgressColor(riskLevel);

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={progressColor}
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-in-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-3xl font-bold text-gray-900">{Math.round(value)}</span>
          <span className="text-sm text-gray-500">Risk Score</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading supplier details...</p>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error || 'Supplier not found'}</p>
            <Button onClick={handleBack}>
              Back to Supplier Risk
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare data for charts
  const riskData = [
    {
      name: 'Low',
      value: (supplier.probabilities?.Low || 0) * 100,
      fill: '#22c55e' // Green for Low risk
    },
    {
      name: 'Medium', 
      value: (supplier.probabilities?.Medium || 0) * 100,
      fill: '#f59e0b' // Yellow/Orange for Medium risk
    },
    {
      name: 'High',
      value: (supplier.probabilities?.High || 0) * 100,
      fill: '#ef4444' // Red for High risk
    }
  ];

  const performanceData = [
    { 
      name: 'Quality', 
      value: Math.max(0, 100 - supplier.avg_defect_rate_percent),
      target: 95 
    },
    { 
      name: 'Price Stability', 
      value: Math.max(0, 100 - Math.abs(supplier.avg_price_variance_percent)),
      target: 98 
    },
    { 
      name: 'Delivery', 
      value: Math.max(0, 100 - (supplier.avg_delivery_delay_days * 5)),
      target: 90 
    },
    { 
      name: 'Compliance', 
      value: supplier.compliance_rate,
      target: 100 
    }
  ];

  return (
    <AuthenticatedShell>
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <Button
                onClick={handleBack}
                variant="ghost"
                className="mb-6 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Supplier Risk
              </Button>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{supplier.supplier_name}</h1>
                  <p className="text-blue-100 text-lg">
                    {supplier.risk_summary}
                  </p>
                  
                  <div className="mt-4 flex items-center gap-4">
                    <Badge className={`px-3 py-1.5 text-sm ${getRiskColor(supplier.predicted_risk)}`}>
                      {supplier.predicted_risk} Risk
                    </Badge>
                    {supplier.risk_rank && (
                      <span className="text-blue-100">
                        Rank #{supplier.risk_rank} of {supplier.total_suppliers}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  <CircularProgress value={supplier.risk_score} riskLevel={supplier.predicted_risk} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Level</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(supplier.predicted_risk)} mt-1`}>
                    {supplier.predicted_risk} Risk
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Delivery Delay</p>
                  <p className="text-2xl font-bold text-foreground">{supplier.avg_delivery_delay_days.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trust Score</p>
                  <p className="text-2xl font-bold text-foreground">{supplier.trust_score.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">out of 100</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Compliance Rate</p>
                  <p className="text-2xl font-bold text-foreground">{supplier.compliance_rate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">regulatory compliance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Hash className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Rank</p>
                  <p className="text-2xl font-bold text-foreground">{supplier.risk_rank ? `#${supplier.risk_rank}` : 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">across monitored suppliers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Boxes className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Materials Tracked</p>
                  <p className="text-2xl font-bold text-foreground">{supplier.plastic_types?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">connected material categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Risk Assessment Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Risk Probability Distribution
              </CardTitle>
              <CardDescription>
                Probability of different risk levels for this supplier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Key performance indicators compared to targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<CustomLineTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }} 
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    />
                    <Legend />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Supplier Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Supplier Details
              </CardTitle>
              <CardDescription>
                Detailed information about this supplier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Plastic Types</h4>
                <div className="flex flex-wrap gap-2">
                  {supplier.plastic_types && supplier.plastic_types.length > 0 ? (
                    supplier.plastic_types.map((type) => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className="px-3 py-1"
                      >
                        {type}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No plastic types specified</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Defect Rate</h4>
                  <p className="text-2xl font-bold text-foreground">{supplier.avg_defect_rate_percent.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">Lower is better</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Price Variance</h4>
                  <p className="text-2xl font-bold text-foreground">{supplier.avg_price_variance_percent.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">Lower is better</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Risk Analysis
              </CardTitle>
              <CardDescription>
                Comprehensive risk assessment breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                {supplier.risk_summary}
              </p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-foreground">Overall Risk Score</span>
                    <span className="text-foreground">{Math.round(supplier.risk_score)}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        supplier.predicted_risk === 'Low' ? 'bg-green-500' :
                        supplier.predicted_risk === 'Medium' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${supplier.risk_score}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">UI Risk Score</h4>
                    <p className="text-lg font-bold text-foreground">{supplier.risk_score_ui.toFixed(1)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Risk Level</h4>
                    <Badge className={getRiskColor(supplier.predicted_risk)}>
                      {supplier.predicted_risk}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

        {/* Additional Supplier Deep-Dive (from previous right panel) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info className="w-5 h-5" />Risk Explanation</CardTitle>
              <CardDescription>Integrated financial + inherent risk narrative</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{detailData?.riskExplanation || supplier.risk_summary}</p>
              <div className="space-y-2 text-sm">
                <p><strong>Material-level exposure:</strong> {detailData?.inherentRiskFactors.materialExposure || 'N/A'}</p>
                <p><strong>Recyclability:</strong> {detailData?.inherentRiskFactors.recyclabilityRisk || 'N/A'}</p>
                <p><strong>Hazardous composition:</strong> {detailData?.inherentRiskFactors.hazardousComposition || 'N/A'}</p>
                <p><strong>Regulatory sensitivity:</strong> {detailData?.inherentRiskFactors.regulatorySensitivity || 'N/A'}</p>
                <p><strong>Raw-material dependency:</strong> {detailData?.inherentRiskFactors.rawMaterialDependency || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ListTree className="w-5 h-5" />Incident Timeline</CardTitle>
              <CardDescription>Recent supplier-related incidents from risk feed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-72 overflow-auto">
              {detailData?.incidentTimeline?.length ? detailData.incidentTimeline.map((event, idx) => (
                <div key={`${event.supplier_id}-${idx}`} className="border rounded-md p-2 text-sm">
                  <p>{event.event_text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(event.created_at).toLocaleString()} • {event.category}</p>
                </div>
              )) : <p className="text-sm text-muted-foreground">No incidents found for this supplier.</p>}
            </CardContent>
          </Card>
        </div>
    </div>
    </AuthenticatedShell>
  );
}
