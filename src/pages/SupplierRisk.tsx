import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Package,
  Users,
  ChevronRight
} from 'lucide-react';
import {
  predictSupplierRisk,
  getSupplierRankings,
  getRiskDistribution,
  checkSupplierRiskHealth,
  SupplierRiskData,
  SupplierRanking
} from '@/lib/api';

const SupplierRisk: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analyze');
  const [formData, setFormData] = useState<SupplierRiskData>({
    supplier_name: '',
    delivery_delay_days: 0,
    defect_rate_pct: 0,
    price_variance_pct: 0,
    compliance_flag: 0,
    trust_score: 50,
    Plastic_Type: 'PET',
    defective_units: 0,
    quantity: 100,
    unit_price: 100,
    negotiated_price: 95,
    compliance: 'No'
  });

  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rankings, setRankings] = useState<SupplierRanking[]>([]);
  const [distribution, setDistribution] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    loadHealthCheck();
    if (activeTab === 'rankings') {
      loadRankings();
    } else if (activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [activeTab]);

  const loadHealthCheck = async () => {
    try {
      const healthData = await checkSupplierRiskHealth();
      setHealth(healthData);
    } catch (err) {
      console.error('Health check failed:', err);
    }
  };

  const loadRankings = async () => {
    try {
      const result = await getSupplierRankings();
      setRankings(result.rankings || []);
    } catch (err) {
      console.error('Failed to load rankings:', err);
    }
  };

  const loadDashboardData = async () => {
    try {
      const distResult = await getRiskDistribution();
      setDistribution(distResult.distribution);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  const handleSliderChange = (field: keyof SupplierRiskData, value: number[]) => {
    setFormData(prev => ({ ...prev, [field]: value[0] }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'supplier_name' || name === 'Plastic_Type' || name === 'compliance' 
        ? value 
        : parseFloat(value) || 0 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await predictSupplierRisk(formData);
      setPrediction(result);
      setActiveTab('results');
    } catch (err: any) {
      setError(err.message || 'Failed to predict supplier risk');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRiskBadge = (category: string) => {
    const color = getRiskColor(category);
    return (
      <Badge 
        className="px-3 py-1 text-sm font-semibold"
        style={{ backgroundColor: color, color: 'white' }}
      >
        {category.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            Supplier Risk Assessment
          </h1>
          <p className="text-muted-foreground mt-2">
            Analyze supplier risk based on performance metrics, compliance, and historical data
          </p>
          
          {health && (
            <Alert className={`mt-4 ${health.predictor_available ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <AlertDescription className="flex items-center gap-2">
                {health.predictor_available ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
                {health.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analyze Supplier
            </TabsTrigger>
            <TabsTrigger value="rankings" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Rankings
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2" disabled={!prediction}>
              <Package className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {distribution && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Risk Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(distribution.risk_distribution_percent).map(([level, percent]) => (
                          <div key={level} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: getRiskColor(level) }}
                              />
                              <span className="font-medium capitalize">{level}</span>
                            </div>
                            <span className="text-2xl font-bold">{percent}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Risk Score Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Average</span>
                          <span className="text-2xl font-bold">{distribution.average_risk_score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Median</span>
                          <span className="text-2xl font-bold">{distribution.median_risk_score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Range</span>
                          <span>{distribution.risk_score_range.min} - {distribution.risk_score_range.max}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Button className="w-full justify-start" onClick={() => setActiveTab('analyze')}>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Analyze New Supplier
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('rankings')}>
                          <Users className="mr-2 h-4 w-4" />
                          View All Rankings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Supplier Risk Overview</CardTitle>
                    <CardDescription>
                      Total Suppliers: {distribution.total_suppliers}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 flex rounded-full overflow-hidden border">
                      {Object.entries(distribution.risk_distribution).map(([level, count]) => {
                        const percent = (count / distribution.total_suppliers) * 100;
                        return (
                          <div 
                            key={level}
                            className="h-full transition-all duration-500"
                            style={{ 
                              width: `${percent}%`,
                              backgroundColor: getRiskColor(level)
                            }}
                            title={`${level}: ${count} suppliers (${percent.toFixed(1)}%)`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      {Object.entries(distribution.risk_distribution).map(([level, count]) => (
                        <span key={level} className="capitalize">
                          {level}: {count}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Analyze Tab */}
          <TabsContent value="analyze">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Supplier Information</CardTitle>
                    <CardDescription>
                      Enter supplier details to assess risk level
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="supplier_name">Supplier Name</Label>
                          <Input
                            id="supplier_name"
                            name="supplier_name"
                            value={formData.supplier_name}
                            onChange={handleInputChange}
                            placeholder="e.g., ABC Plastics Inc."
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="Plastic_Type">Plastic Type</Label>
                          <Input
                            id="Plastic_Type"
                            name="Plastic_Type"
                            value={formData.Plastic_Type}
                            onChange={handleInputChange}
                            placeholder="e.g., PET, HDPE, PVC"
                          />
                        </div>
                      </div>

                      {[
                        { field: 'delivery_delay_days', label: 'Delivery Delay (days)', min: 0, max: 30, step: 1 },
                        { field: 'defect_rate_pct', label: 'Defect Rate (%)', min: 0, max: 100, step: 0.1 },
                        { field: 'price_variance_pct', label: 'Price Variance (%)', min: -50, max: 50, step: 0.1 },
                        { field: 'trust_score', label: 'Trust Score', min: 0, max: 100, step: 1 },
                      ].map(({ field, label, min, max, step }) => (
                        <div key={field} className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor={field}>{label}</Label>
                            <span className="text-sm text-primary font-medium">
                              {formData[field as keyof SupplierRiskData]}
                            </span>
                          </div>
                          <Slider
                            id={field}
                            min={min}
                            max={max}
                            step={step}
                            value={[formData[field as keyof SupplierRiskData] as number]}
                            onValueChange={(value) => handleSliderChange(field as keyof SupplierRiskData, value)}
                          />
                        </div>
                      ))}

                      <div className="space-y-2">
                        <Label htmlFor="compliance">Compliance</Label>
                        <select
                          id="compliance"
                          name="compliance"
                          value={formData.compliance}
                          onChange={(e) => setFormData(prev => ({ ...prev, compliance: e.target.value }))}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>

                      <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? 'Analyzing...' : 'Assess Supplier Risk'}
                      </Button>

                      {error && (
                        <Alert variant="destructive">
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="font-medium">Low Risk</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Score: 0-33</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span className="font-medium">Medium Risk</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Score: 34-66</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="font-medium">High Risk</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Score: 67-100</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Metrics Considered</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• Delivery Performance</li>
                        <li>• Quality Defect Rates</li>
                        <li>• Price Consistency</li>
                        <li>• Compliance History</li>
                        <li>• Trust Score</li>
                        <li>• Material Type</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Rankings Tab */}
          <TabsContent value="rankings">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Risk Rankings</CardTitle>
                <CardDescription>
                  All suppliers ranked by risk score (highest risk first)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rankings.map((supplier) => (
                    <Card key={supplier.supplier_name} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xl font-bold text-primary">
                                  #{supplier.risk_rank}
                                </span>
                              </div>
                            </div>
                            <div>
                              <Link to={`/supplier/${encodeURIComponent(supplier.supplier_name)}`}>
                                <h4 className="font-semibold text-lg hover:text-primary transition-colors">
                                  {supplier.supplier_name}
                                </h4>
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                {getRiskBadge(supplier.predicted_risk)}
                                <span className="text-sm text-muted-foreground">
                                  Score: {supplier.risk_score.toFixed(1)}/100
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-4">
                              <div className="text-sm text-muted-foreground">
                                <div>Delay: {supplier.avg_delivery_delay_days}d</div>
                                <div>Defect: {supplier.avg_defect_rate_percent}%</div>
                              </div>
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/supplier/${encodeURIComponent(supplier.supplier_name)}`}>
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {supplier.plastic_types && supplier.plastic_types.length > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Materials: {supplier.plastic_types.join(', ')}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            {prediction && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Analysis Results</span>
                        {getRiskBadge(prediction.predicted_risk)}
                      </CardTitle>
                      <CardDescription>
                        Supplier: {prediction.supplier_name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-3xl font-bold text-primary">
                                {prediction.risk_score.toFixed(1)}
                              </div>
                              <div className="text-sm text-muted-foreground">Risk Score</div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-3xl font-bold" style={{ color: getRiskColor(prediction.predicted_risk) }}>
                                {prediction.predicted_risk}
                              </div>
                              <div className="text-sm text-muted-foreground">Risk Level</div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="p-4 text-center">
                              <div className="text-3xl font-bold text-green-600">
                                {Math.max(...Object.values(prediction.probabilities)).toFixed(1)}%
                              </div>
                              <div className="text-sm text-muted-foreground">Confidence</div>
                            </CardContent>
                          </Card>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-3">Probability Breakdown</h4>
                          <div className="space-y-2">
                            {Object.entries(prediction.probabilities).map(([level, prob]) => (
                              <div key={level} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: getRiskColor(level) }}
                                  />
                                  <span className="capitalize">{level}</span>
                                </div>
                                <div className="w-48">
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full transition-all duration-500"
                                      style={{ 
                                        width: `${(prob as number) * 100}%`,
                                        backgroundColor: getRiskColor(level)
                                      }}
                                    />
                                  </div>
                                </div>
                                <span className="text-sm font-medium">{(prob as number * 100).toFixed(1)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Recommendations</h4>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-blue-800">
                              {prediction.predicted_risk === 'Low' 
                                ? 'This supplier shows excellent performance metrics. Consider increasing order volume and establishing long-term partnership.'
                                : prediction.predicted_risk === 'Medium'
                                ? 'This supplier requires monitoring. Consider additional quality checks and regular performance reviews.'
                                : 'High risk supplier detected. Review alternative suppliers and implement strict quality controls if continuing partnership.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Next Steps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button className="w-full justify-start" onClick={() => setActiveTab('dashboard')}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        View Dashboard
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('rankings')}>
                        <Users className="mr-2 h-4 w-4" />
                        Compare Rankings
                      </Button>
                      <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('analyze')}>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Analyze Another
                      </Button>
                      
                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-2">Analysis Details</h4>
                        <div className="text-sm space-y-1 text-muted-foreground">
                          <div>Date: {new Date(prediction.analysis_date).toLocaleDateString()}</div>
                          <div>UI Score: {prediction.risk_score_ui}</div>
                          <div>Model: Supplier Risk Predictor v1.0</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SupplierRisk;