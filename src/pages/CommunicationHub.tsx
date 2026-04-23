import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MessageSquare, FileText, CheckCircle, Clock, 
  Send, MoreVertical, Filter, ChevronRight, Info,
  DollarSign, Package, Calendar, AlertCircle, Quote,
  History, ShieldCheck, BarChart3, ArrowRight,
  TrendingUp, Star, MapPin, ExternalLink, RefreshCw
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  getRFQs, 
  getRFQDetails, 
  sendRFQMessage, 
  respondToRFQ,
  submitRFQQuote,
  getAuthSession 
} from '@/lib/api';
import { format } from 'date-fns';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';

// --- Sub-components ---

const StatusStepper = ({ currentStatus }: { currentStatus: string }) => {
  const steps = ['sent', 'viewed', 'quoted', 'negotiating', 'accepted'];
  const statusLower = (currentStatus || '').toLowerCase();
  const currentIndex = steps.indexOf(statusLower);
  const activeIndex = currentIndex === -1 && statusLower === 'rejected' ? 4 : currentIndex;
  
  return (
    <div className="flex items-center justify-between w-full mb-8 px-2">
      {steps.map((step, i) => {
        const isActive = i <= activeIndex;
        const isCurrent = i === activeIndex;
        const isRejected = currentStatus === 'rejected' && i === 4;
        
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center relative group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                isRejected && i === 4 
                  ? 'bg-rose-500 border-rose-500 text-white' 
                  : (isActive 
                      ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20' 
                      : 'bg-background border-muted text-muted-foreground')
              }`}>
                {isActive ? (isRejected && i === 4 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />) : <span className="text-xs">{i + 1}</span>}
              </div>
              <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                isCurrent ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {isRejected && i === 4 ? 'Rejected' : step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-all duration-500 ${
                i < activeIndex ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const TrustBreakdown = ({ breakdown, score }: { breakdown: any, score: number }) => {
  if (!breakdown) return null;
  
  const metrics = [
    { label: 'Reliability', value: breakdown.reliability, color: 'bg-blue-500' },
    { label: 'Quality', value: breakdown.quality, color: 'bg-emerald-500' },
    { label: 'Response', value: breakdown.response_time, color: 'bg-amber-500' },
    { label: 'Verified', value: breakdown.verification, color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-4 p-4 rounded-xl border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Trust Breakdown
        </h4>
        <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary">
          {score}/100
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-muted-foreground">{m.label}</span>
              <span>{m.value}%</span>
            </div>
            <Progress value={m.value} className={`h-1.5 ${m.color.replace('bg-', 'bg-opacity-20 ')}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

const CommunicationHub = () => {
  const [searchParams] = useSearchParams();
  const initialRfqId = searchParams.get('rfq');
  
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [selectedRfqId, setSelectedRfqId] = useState<number | null>(initialRfqId ? parseInt(initialRfqId) : null);
  const [rfqDetail, setRfqDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [quotePayload, setQuotePayload] = useState({ unit_price: 0, lead_time_days: 7, terms: '' });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const session = getAuthSession();
  const isSupplier = session?.role === 'supplier';

  useEffect(() => {
    loadRFQs();
  }, []);

  useEffect(() => {
    if (selectedRfqId) {
      loadRFQDetails(selectedRfqId);
    }
  }, [selectedRfqId]);

  useEffect(() => {
    const rfqId = searchParams.get('rfq');
    if (rfqId) {
      const parsed = parseInt(rfqId);
      if (!isNaN(parsed) && parsed !== selectedRfqId) {
        setSelectedRfqId(parsed);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [rfqDetail?.messages]);

  const loadRFQs = async () => {
    try {
      const data = await getRFQs();
      setRfqs(data);
      if (data.length > 0 && !selectedRfqId) {
        setSelectedRfqId(data[0].id);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load conversations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadRFQDetails = async (id: number) => {
    setDetailLoading(true);
    try {
      const data = await getRFQDetails(id);
      setRfqDetail(data);
      if (data.quotes?.[0]) {
        setQuotePayload({
          unit_price: data.quotes[0].unit_price,
          lead_time_days: data.quotes[0].lead_time_days,
          terms: data.quotes[0].terms_conditions || ''
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load details', variant: 'destructive' });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRfqId) return;

    try {
      await sendRFQMessage(selectedRfqId, newMessage);
      setNewMessage('');
      loadRFQDetails(selectedRfqId);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    }
  };

  const handleDecision = async (action: 'accepted' | 'rejected') => {
    if (!selectedRfqId) return;
    try {
      await respondToRFQ(selectedRfqId, action);
      toast({ title: 'Success', description: `RFQ ${action} successfully` });
      loadRFQDetails(selectedRfqId);
      loadRFQs();
    } catch (error) {
      toast({ title: 'Error', description: 'Action failed', variant: 'destructive' });
    }
  };

  const handleSubmitQuote = async () => {
    if (!selectedRfqId) return;
    try {
      await submitRFQQuote(selectedRfqId, quotePayload);
      toast({ title: 'Quote Submitted', description: 'The manufacturer has been notified of your revision.' });
      setIsQuoteDialogOpen(false);
      loadRFQDetails(selectedRfqId);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit quote', variant: 'destructive' });
    }
  };

  const filteredRfqs = rfqs.filter(r => 
    r.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (isSupplier ? r.manufacturer_name : r.supplier_name)?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      sent: 'bg-blue-500',
      viewed: 'bg-purple-500',
      quoted: 'bg-amber-500',
      negotiating: 'bg-indigo-500',
      accepted: 'bg-emerald-500',
      rejected: 'bg-rose-500',
      closed: 'bg-slate-500',
    };
    return colors[status] || 'bg-slate-500';
  };

  return (
    <AuthenticatedShell>
      <div className="flex flex-col h-full bg-[#F8FAFC] rounded-2xl border overflow-hidden shadow-sm">
      <div className="flex flex-1 overflow-hidden">
        {/* Pane 1: Conversations List */}
        <div className="w-96 border-r bg-white flex flex-col shadow-[1px_0_0_rgba(0,0,0,0.05)]">
          <div className="p-6 border-b">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search negiotiations..." 
                className="pl-11 h-12 bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-2xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {filteredRfqs.map((rfq) => (
                <button
                  key={rfq.id}
                  onClick={() => setSelectedRfqId(rfq.id)}
                  className={`w-full text-left p-4 rounded-2xl transition-all relative overflow-hidden group ${
                    selectedRfqId === rfq.id 
                    ? 'bg-primary text-white shadow-xl shadow-primary/20 translate-x-1' 
                    : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <p className={`font-bold text-sm ${selectedRfqId === rfq.id ? 'text-white' : 'text-slate-800'}`}>
                      {rfq.product_name}
                    </p>
                    <span className={`text-[10px] font-medium ${selectedRfqId === rfq.id ? 'text-white/70' : 'text-slate-400'}`}>
                      {format(new Date(rfq.updated_at), 'MMM d')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3 relative z-10">
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(rfq.status)} ${selectedRfqId === rfq.id ? 'ring-4 ring-white/20' : ''}`} />
                    <p className={`text-xs capitalize font-semibold ${selectedRfqId === rfq.id ? 'text-white/80' : 'text-slate-500'}`}>
                      {rfq.status}
                    </p>
                  </div>
                  <div className="flex items-center justify-between relative z-10">
                    <p className={`text-xs truncate max-w-[150px] font-medium ${selectedRfqId === rfq.id ? 'text-white/90' : 'text-slate-600'}`}>
                      {isSupplier ? rfq.manufacturer_name : rfq.supplier_name}
                    </p>
                    <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${selectedRfqId === rfq.id ? 'text-white' : 'text-slate-300'}`} />
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Pane 2: Chat area */}
        <div className="flex-1 flex flex-col bg-slate-50/50">
          {rfqDetail ? (
            <>
              <div className="px-8 py-4 border-b bg-white flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm">
                    {(isSupplier ? rfqDetail.manufacturer_name : rfqDetail.supplier_name)?.[0] || 'S'}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 leading-tight">
                      {isSupplier ? rfqDetail.manufacturer_name : rfqDetail.supplier_name}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <span>RFQ #{rfqDetail.id}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>{rfqDetail.product_name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary transition-colors"><MessageSquare className="w-5 h-5" /></Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-5 h-5" /></Button>
                </div>
              </div>

              <ScrollArea className="flex-1 px-8 py-6">
                <div ref={scrollRef} className="space-y-6 max-w-4xl mx-auto">
                  {/* System Greeting / Context Change */}
                  <div className="flex justify-center mb-8">
                     <div className="bg-white px-5 py-2 rounded-2xl text-[11px] font-bold text-slate-400 flex items-center gap-2 border border-slate-100 shadow-sm uppercase tracking-widest">
                       <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure Negotiation Channel
                     </div>
                  </div>

                  {rfqDetail.messages.map((msg: any) => (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.is_system_generated ? 'justify-center' : (msg.sender_id === session?.userId ? 'justify-end' : 'justify-start')}`}
                    >
                      {msg.is_system_generated ? (
                        <div className="bg-indigo-50/50 backdrop-blur-sm px-5 py-2 rounded-2xl text-[10px] font-extrabold text-indigo-600 flex items-center gap-2 border border-indigo-100/50 uppercase tracking-widest">
                          <RefreshCw className="w-3 h-3 animate-spin-slow" /> {msg.message}
                        </div>
                      ) : (
                        <div className={`max-w-[75%] space-y-1`}>
                           <div className={`p-4 rounded-[2rem] shadow-sm relative ${
                             msg.sender_id === session?.userId 
                             ? 'bg-slate-900 text-white rounded-tr-none' 
                             : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                           }`}>
                             <p className="text-[13px] leading-relaxed font-medium">{msg.message}</p>
                           </div>
                           <p className={`text-[9px] font-black uppercase text-slate-400 tracking-tighter ${msg.sender_id === session?.userId ? 'text-right' : 'text-left'}`}>
                             {format(new Date(msg.created_at), 'h:mm a')}
                           </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-6 bg-white border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
                  <div className="flex gap-3 bg-slate-50 p-1.5 rounded-[2rem] border border-slate-100 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                    <Input 
                      placeholder="Discuss terms or request a price drop..." 
                      className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm h-11"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <Button type="submit" size="icon" className="rounded-full w-11 h-11 shadow-lg shadow-primary/20" disabled={!newMessage.trim()}>
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-300">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-white rounded-[3rem] shadow-xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Select a Negotiation</h3>
                <p className="max-w-[200px] text-sm text-slate-400 font-medium leading-relaxed">Choose a request from the sidebar to view full history and manage quotes.</p>
              </div>
            </div>
          )}
        </div>

        {/* Pane 3: RFQ Summary & Actions */}
        {rfqDetail && (
          <div className="w-[380px] border-l bg-white p-8 overflow-y-auto shadow-[-1px_0_0_rgba(0,0,0,0.05)] scrollbar-hide">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Active Quote 
              </div>
              <Badge variant="outline" className="rounded-full text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary">
                v{rfqDetail.quotes.length}
              </Badge>
            </h3>

            <div className="mb-10">
              <StatusStepper currentStatus={rfqDetail.status} />
            </div>
            
            <div className="space-y-8">
              {/* Quote Highlight */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-indigo-600 rounded-3xl opacity-[0.03]" />
                <div className="p-6 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-all relative z-10 overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
                  
                  {rfqDetail.quotes.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Proposed Unit Price</p>
                          <div className="text-4xl font-black text-slate-900 flex items-start">
                            <span className="text-2xl mt-1 mr-0.5">$</span>
                            {rfqDetail.quotes[0].unit_price}
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
                           <p className="text-xl font-bold text-slate-900">
                             ${(rfqDetail.quotes[0].unit_price * rfqDetail.quantity).toLocaleString()}
                           </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lead Time</p>
                          <p className="text-sm font-bold text-slate-700">{rfqDetail.quotes[0].lead_time_days} Days</p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valid Until</p>
                          <p className="text-sm font-bold text-slate-700">
                            {rfqDetail.quotes[0].valid_until ? format(new Date(rfqDetail.quotes[0].valid_until), 'MMM d') : 'Flexible'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 space-y-3">
                      <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
                        <Quote className="w-6 h-6 text-amber-500" />
                      </div>
                      <p className="text-sm text-slate-500 font-bold">Waiting for Quote Submission</p>
                      <p className="text-[10px] text-slate-400 font-medium px-4">Negotiate via chat or nudge the supplier for terms.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Request Context */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Request Specs</h4>
                <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                      <p className="text-[9px] font-bold text-indigo-400 uppercase">Quantity</p>
                      <p className="text-sm font-black text-indigo-900">{rfqDetail.quantity.toLocaleString()}</p>
                   </div>
                   <div className="p-3 bg-purple-50/30 rounded-2xl border border-purple-100/50">
                      <p className="text-[9px] font-bold text-purple-400 uppercase">Target Price</p>
                      <p className="text-sm font-black text-purple-900">${rfqDetail.budget_unit_price || '--'}</p>
                   </div>
                </div>
              </div>

              <TrustBreakdown breakdown={rfqDetail.supplier_trust_breakdown} score={rfqDetail.trust_score || 85} />

              <div className="pt-4 space-y-4">
                <div className="flex gap-3">
                   {isSupplier ? (
                     <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
                        <DialogTrigger asChild>
                           <Button className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-2xl h-14 font-bold shadow-lg shadow-primary/20 gap-2">
                             <TrendingUp className="w-5 h-5" /> Submit Quote
                           </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-8 border-none shadow-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                              <Star className="w-6 h-6 text-amber-500" /> Professional Quote
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium mt-2">
                              Submission for {rfqDetail.product_name}. Manufacturers value competitive pricing and reliability.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-6 py-8">
                            <div className="space-y-2">
                              <p className="text-xs font-black uppercase text-slate-400 ml-1">Unit Price ($)</p>
                              <Input 
                                type="number" 
                                value={quotePayload.unit_price} 
                                onChange={(e) => setQuotePayload(p => ({...p, unit_price: parseFloat(e.target.value)}))}
                                className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg" 
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-black uppercase text-slate-400 ml-1">Est. Lead Time (Days)</p>
                              <Input 
                                type="number" 
                                value={quotePayload.lead_time_days} 
                                onChange={(e) => setQuotePayload(p => ({...p, lead_time_days: parseInt(e.target.value)}))}
                                className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg" 
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-black uppercase text-slate-400 ml-1">Terms (Optional)</p>
                              <Input 
                                value={quotePayload.terms} 
                                onChange={(e) => setQuotePayload(p => ({...p, terms: e.target.value}))}
                                className="h-14 rounded-2xl bg-slate-50 border-none font-medium" 
                                placeholder="FOB, Payment terms, etc."
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleSubmitQuote} className="w-full h-14 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20">
                              Send Formal Quote Update
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                     </Dialog>
                   ) : (
                     rfqDetail.status === 'quoted' || rfqDetail.status === 'negotiating' ? (
                        <>
                          <Button 
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-14 font-bold shadow-lg shadow-emerald-500/20 gap-2"
                            onClick={() => handleDecision('accepted')}
                          >
                            <CheckCircle className="w-5 h-5" /> Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 border-rose-100 text-rose-500 hover:bg-rose-50 rounded-2xl h-14 font-bold gap-2"
                            onClick={() => handleDecision('rejected')}
                          >
                            <AlertCircle className="w-5 h-5" /> Reject
                          </Button>
                        </>
                     ) : null
                   )}
                </div>

                {!isSupplier && (
                  <Link to={`/suppliers/comparison?product=${encodeURIComponent(rfqDetail.product_name)}`} className="block">
                     <Button variant="ghost" className="w-full h-12 rounded-2xl text-xs font-bold text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-2">
                       <BarChart3 className="w-4 h-4" /> Compare Other Quotes
                     </Button>
                  </Link>
                )}
                
                <Dialog>
                   <DialogTrigger asChild>
                     <Button variant="ghost" className="w-full h-12 rounded-2xl text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-2">
                       <History className="w-4 h-4" /> View Revision History
                     </Button>
                   </DialogTrigger>
                   <DialogContent className="max-w-2xl rounded-[2rem] p-8 border-none shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900">Quote History</DialogTitle>
                        <DialogDescription className="font-medium text-slate-500">Track all price changes and lead time adjustments.</DialogDescription>
                      </DialogHeader>
                      <div className="py-6 space-y-4">
                        {rfqDetail.quotes.map((q: any) => (
                          <div key={q.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                             <div>
                                <p className="font-black text-sm text-slate-800">Version {q.version}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(q.created_at), 'PPP')}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-lg font-black text-primary">${q.unit_price}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{q.lead_time_days} Days Lead</p>
                             </div>
                          </div>
                        ))}
                      </div>
                   </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </AuthenticatedShell>
  );
};

export default CommunicationHub;
