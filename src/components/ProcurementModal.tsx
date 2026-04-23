import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, Package, Calendar, DollarSign, 
  AlertCircle, Send, CheckCircle2, TrendingUp
} from 'lucide-react';
import { createRFQ } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ProcurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: number;
  supplierName: string;
}

const ProcurementModal: React.FC<ProcurementModalProps> = ({ 
  isOpen, onClose, supplierId, supplierName 
}) => {
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [budget, setBudget] = useState('');
  const [specs, setSpecs] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !quantity) return;

    setLoading(true);
    try {
      await createRFQ({
        supplier_id: supplierId,
        product_name: productName,
        quantity: Number(quantity),
        budget_unit_price: budget ? Number(budget) : undefined,
        target_delivery_date: targetDate,
        specifications: specs
      });
      setSuccess(true);
      toast({ title: 'RFQ Sent Successfully', description: `Your request has been sent to ${supplierName}.` });
      setTimeout(() => {
        onClose();
        setSuccess(false);
        resetForm();
      }, 2000);
    } catch (error) {
      toast({ title: 'Upload Failed', description: 'Could not send RFQ. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProductName('');
    setQuantity('');
    setTargetDate('');
    setBudget('');
    setSpecs('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden border-none p-0 bg-card">
        <div className="h-2 bg-gradient-to-r from-primary via-indigo-600 to-purple-600" />
        
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6"
            >
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold">Request a Quote</DialogTitle>
                    <DialogDescription className="text-xs">
                      Send a structured procurement request to <span className="font-semibold text-primary">{supplierName}</span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="product" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Package className="w-3 h-3" /> Product Name *
                    </Label>
                    <Input 
                      id="product" 
                      placeholder="e.g. Recycled ABS G7" 
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> Quantity *
                    </Label>
                    <Input 
                      id="quantity" 
                      type="number" 
                      placeholder="e.g. 5000" 
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> Target Delivery
                    </Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <DollarSign className="w-3 h-3" /> Budget per Unit ($)
                    </Label>
                    <Input 
                      id="budget" 
                      type="number" 
                      placeholder="e.g. 2.45" 
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specs" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" /> Requirements & Specs
                  </Label>
                  <Textarea 
                    id="specs" 
                    placeholder="Describe material grade, certifications required, or special handling..." 
                    className="h-24 resize-none"
                    value={specs}
                    onChange={(e) => setSpecs(e.target.value)}
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
                  <Button type="submit" disabled={loading} className="px-8 bg-primary hover:bg-primary/90 transition-all font-bold">
                    {loading ? 'Sending...' : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> Send Request
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-12 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Request Transmitted</h2>
              <p className="text-muted-foreground">
                Supplier <b>{supplierName}</b> has been notified. Check the Communication Hub for status updates.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ProcurementModal;
