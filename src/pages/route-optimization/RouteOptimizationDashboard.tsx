import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { getRouteDashboardSummary, getRouteHistory } from '@/lib/api';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MapPin,
  Navigation,
  Truck,
  Package,
  TrendingUp,
  Route,
  ExternalLink,
  GitBranch,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { MiniScenarioSimulator, SimResult } from '@/components/scenario/MiniScenarioSimulator';
import { SimulationImpactCard } from '@/components/scenario/SimulationImpactCard';

// Manufacturing Units
const UNITS = {
  mumbai: {
    id: 'mumbai',
    name: 'Mumbai Main Manufacturing Unit',
    city: 'Mumbai',
    lat: 19.0760,
    lng: 72.8777,
    capacity: '15,000 units',
    type: 'Main Unit',
    color: '#6366f1',
  },
  bhopal: {
    id: 'bhopal',
    name: 'Bhopal Secondary Manufacturing Unit',
    city: 'Bhopal',
    lat: 23.2599,
    lng: 77.4126,
    capacity: '6,000 units',
    type: 'Secondary Unit',
    color: '#22c55e',
  },
};

// Common Indian cities for quick selection
const PRESET_DESTINATIONS = [
  { label: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567 },
  { label: 'Nagpur, Maharashtra', lat: 21.1458, lng: 79.0882 },
  { label: 'Indore, MP', lat: 22.7196, lng: 75.8577 },
  { label: 'Ahmedabad, Gujarat', lat: 23.0225, lng: 72.5714 },
  { label: 'Delhi, NCR', lat: 28.6139, lng: 77.2090 },
  { label: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867 },
  { label: 'Bangalore, Karnataka', lat: 12.9716, lng: 77.5946 },
  { label: 'Surat, Gujarat', lat: 21.1702, lng: 72.8311 },
  { label: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { label: 'Kolkata, WB', lat: 22.5726, lng: 88.3639 },
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function RouteOptimizationDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<'mumbai' | 'bhopal'>('mumbai');
  const [destLabel, setDestLabel] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [destination, setDestination] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [integratedSimResult, setIntegratedSimResult] = useState<SimResult | null>(null);

  useEffect(() => {
    getRouteDashboardSummary().then(setSummary).catch(() => setSummary(null));
    getRouteHistory().then((d) => setHistory(d.orders ?? [])).catch(() => setHistory([]));
  }, []);

  const unit = UNITS[selectedUnit];

  const geocodeCity = async () => {
    if (!destQuery.trim()) return;
    setGeocoding(true);
    setGeoError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destQuery)}&countrycodes=in&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data.length === 0) {
        setGeoError('City not found. Try a different name.');
        return;
      }
      const loc = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name.split(',').slice(0, 2).join(', ') };
      setDestination(loc);
      setDestLabel(loc.label);
    } catch (e) {
      setGeoError('Failed to geocode. Check your internet connection.');
    } finally {
      setGeocoding(false);
    }
  };

  const selectPreset = (p: typeof PRESET_DESTINATIONS[0]) => {
    setDestination({ lat: p.lat, lng: p.lng, label: p.label });
    setDestLabel(p.label);
    setDestQuery(p.label);
  };

  const distance = destination ? Math.round(haversineDistance(unit.lat, unit.lng, destination.lat, destination.lng)) : null;
  const estTime = distance ? `${Math.floor(distance / 65)} hrs ${Math.round(((distance / 65) % 1) * 60)} min` : null;
  const estCost = distance ? `₹${(distance * 42).toLocaleString()}` : null;

  return (
    <AuthenticatedShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Route className="w-6 h-6 text-primary" /> Route Optimization
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select your manufacturing unit, input a destination and get instant route intelligence
            </p>
          </div>
          <Link to="/route-optimization/run">
            <Button className="gap-2">
              <Package className="w-4 h-4" /> Generate Fulfillment Plan
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ['Total Orders', summary?.total_orders ?? 0],
            ['Fully Fulfilled', summary?.fully_fulfilled ?? 0],
            ['Partially Fulfilled', summary?.partially_fulfilled ?? 0],
            ['Infeasible', summary?.infeasible_orders ?? 0],
            ['Avg Fulfillment', `${summary?.average_fulfillment_rate ?? 0}%`],
          ].map(([k, v]) => (
            <Card key={String(k)}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="text-2xl font-bold text-primary">{v}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Route Planning Section */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Controls */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" /> Plan a Route
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Unit selector */}
              <div className="space-y-1.5">
                <Label className="text-xs">Starting Manufacturing Unit</Label>
                <Select value={selectedUnit} onValueChange={(v) => setSelectedUnit(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mumbai">🏭 Mumbai Main Unit (15,000 units)</SelectItem>
                    <SelectItem value="bhopal">🏭 Bhopal Secondary Unit (6,000 units)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded space-y-1">
                  <div>📍 {unit.city} • Capacity: {unit.capacity}</div>
                  <div>📊 Demand Share: {selectedUnit === 'mumbai' ? '60%' : '40%'}</div>
                </div>
              </div>

              {/* Destination input */}
              <div className="space-y-1.5">
                <Label className="text-xs">Destination City</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Pune, Delhi..."
                    value={destQuery}
                    onChange={(e) => setDestQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && geocodeCity()}
                    className="flex-1"
                  />
                  <Button onClick={geocodeCity} disabled={geocoding} size="sm">
                    {geocoding ? '...' : 'Go'}
                  </Button>
                </div>
                {geoError && <p className="text-xs text-destructive">{geoError}</p>}
              </div>

              {/* Quick presets */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Quick Select</Label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_DESTINATIONS.slice(0, 6).map((p) => (
                    <button
                      key={p.label}
                      onClick={() => selectPreset(p)}
                      className="text-xs px-2 py-1 rounded-full border hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {p.label.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Route stats */}
              {destination && (
                <div className="p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 space-y-2">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1">
                    <Truck className="w-3 h-3" /> Route Summary
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-sm font-bold">{distance}</p>
                      <p className="text-xs text-muted-foreground">km</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{estTime}</p>
                      <p className="text-xs text-muted-foreground">est. time</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{estCost}</p>
                      <p className="text-xs text-muted-foreground">est. cost</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">{unit.city}</span> → <span className="font-medium">{destination.label}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {distance && distance > 1000 ? '🚢 Multi-modal recommended' : '🚛 Road transport optimal'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="md:col-span-2 overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Route Visualization & Map</CardTitle>
              {destination && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${unit.lat},${unit.lng}&destination=${destination.lat},${destination.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open Full Map
                </a>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {destination ? (
                <div className="space-y-4">
                  {/* Map Visualization */}
                  <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-4">
                    {/* SVG route map */}
                    <svg width="100%" height="300" className="border-2 border-slate-200 rounded-lg bg-white" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                      {/* Grid */}
                      <defs>
                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100" height="100" fill="url(#grid)" />
                      
                      {(() => {
                        const latRange = [12, 29];
                        const lngRange = [68, 97];
                        
                        const mapX = (lng: number) => ((lng - lngRange[0]) / (lngRange[1] - lngRange[0])) * 100;
                        const mapY = (lat: number) => 100 - ((lat - latRange[0]) / (latRange[1] - latRange[0])) * 100;
                        
                        const sourceX = mapX(unit.lng);
                        const sourceY = mapY(unit.lat);
                        const destX = mapX(destination.lng);
                        const destY = mapY(destination.lat);
                        
                        return (
                          <>
                            {/* Route line with arrow */}
                            <line x1={sourceX} y1={sourceY} x2={destX} y2={destY} stroke="#6366f1" strokeWidth="2.5" strokeDasharray="4,4" opacity="0.8" />
                            
                            {/* Arrow */}
                            {(() => {
                              const dx = destX - sourceX;
                              const dy = destY - sourceY;
                              const angle = Math.atan2(dy, dx);
                              const midX = (sourceX + destX) / 2;
                              const midY = (sourceY + destY) / 2;
                              return (
                                <polygon
                                  points={`${midX},${midY} ${midX - 3*Math.cos(angle - 0.4)},${midY - 3*Math.sin(angle - 0.4)} ${midX - 3*Math.cos(angle + 0.4)},${midY - 3*Math.sin(angle + 0.4)}`}
                                  fill="#6366f1"
                                />
                              );
                            })()}
                            
                            {/* Source circle */}
                            <circle cx={sourceX} cy={sourceY} r="4" fill={unit.color} stroke="white" strokeWidth="2" />
                            <text x={sourceX} y={sourceY - 8} fontSize="10" fontWeight="bold" textAnchor="middle" fill="#1f2937">{unit.city.substring(0, 3).toUpperCase()}</text>
                            
                            {/* Destination circle */}
                            <circle cx={destX} cy={destY} r="4" fill="#ef4444" stroke="white" strokeWidth="2" />
                            <text x={destX} y={destY - 8} fontSize="10" fontWeight="bold" textAnchor="middle" fill="#1f2937">{destination.label.split(',')[0].substring(0, 3).toUpperCase()}</text>
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Route Details */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-slate-50">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{distance}</p>
                      <p className="text-xs text-muted-foreground">km</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{estTime}</p>
                      <p className="text-xs text-muted-foreground">Est. Time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{estCost}</p>
                      <p className="text-xs text-muted-foreground">Est. Cost</p>
                    </div>
                  </div>

                  {/* Route Info */}
                  <div className="px-4 pb-4 space-y-2 text-sm border-t">
                    <div className="pt-3 flex justify-between">
                      <span className="text-muted-foreground">📍 From:</span>
                      <span className="font-medium">{unit.city} - {unit.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">📍 To:</span>
                      <span className="font-medium">{destination.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">🚚 Mode:</span>
                      <span className="font-medium">{distance && distance > 1000 ? '🚢 Multi-modal (Rail+Truck)' : '🚛 Direct Road Transport'}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                      <span>GPS Coordinates:</span>
                      <span>{unit.lat.toFixed(2)}°N, {unit.lng.toFixed(2)}°E → {destination.lat.toFixed(2)}°N, {destination.lng.toFixed(2)}°E</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center bg-slate-50 p-12" style={{ minHeight: '440px' }}>
                  <div className="text-center text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">Select a Destination</p>
                    <p className="text-xs mt-2">Choose from quick select buttons or search for a city to visualize the route</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Integrated Route Disruption Simulator */}
        <Card className="border-primary/10 shadow-lg bg-slate-50/30">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-primary">
              <GitBranch className="w-5 h-5" />
              Route Disruption Simulator
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Simulate logistical shocks like road closures, fuel spikes, or port delays to see impact on your routes.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <MiniScenarioSimulator 
                  feature="route" 
                  onResult={(res) => setIntegratedSimResult(res)} 
                />
              </div>

              <div className="space-y-6">
                {integratedSimResult ? (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-4">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <p className="text-xs font-bold text-primary uppercase mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Logistics Impact Analysis
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {integratedSimResult.summary}
                      </p>
                    </div>

                    <SimulationImpactCard 
                      stage="distribution" 
                      data={integratedSimResult.stages.distribution} 
                      severity={integratedSimResult.severity_score}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border bg-white shadow-sm">
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Delayed Routes</p>
                        <p className="text-2xl font-black text-red-600">{integratedSimResult.stages.distribution.unserviceable_routes}</p>
                      </div>
                      <div className="p-4 rounded-xl border bg-white shadow-sm">
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Cost Impact</p>
                        <p className="text-2xl font-black text-orange-600">+{integratedSimResult.stages.distribution.cost_increase_pct}%</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-2xl border-muted opacity-50 bg-white">
                    <Truck className="w-12 h-12 mb-4 text-muted-foreground" />
                    <p className="font-semibold text-muted-foreground">Select a scenario to begin logistics simulation</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      Understand how global disruptions ripple through your last-mile delivery and primary distribution.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Recent Fulfillment History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {history.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No fulfillment orders yet. Generate your first plan above.</p>
            )}
            {history.slice(0, 8).map((h, index) => (
              <div key={`${h.order_id}-${index}`} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 gap-3">
                <span className="font-medium font-mono">{h.order_id}</span>
                <Badge
                  className={h.fulfillment_status === 'FULLY_FULFILLED'
                    ? 'bg-green-100 text-green-800'
                    : h.fulfillment_status === 'PARTIALLY_FULFILLED'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'}
                >
                  {h.fulfillment_status}
                </Badge>
                <span className="text-muted-foreground">₹{Number(h.total_cost || 0).toFixed(0)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedShell>
  );
}
