import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Layout } from "./components/Layout";
import Home from "./pages/Home";
import Features from "./pages/Features";
import Industries from "./pages/Industries";
import Directory from "./pages/Directory";
import Contact from "./pages/Contact";
import SignIn from "./pages/SignIn";
import CompanyVerification from "./pages/CompanyVerification";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import DemandForecast from "./pages/DemandForcast";
import NotFound from "./pages/NotFound";
import SupplierRisk from "./pages/SupplierRisk";
import SupplierDetail from "./pages/SupplierDetail";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/features" element={<Features />} />
              <Route path="/industries" element={<Industries />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/verify-company" element={<CompanyVerification />} />
              <Route path="/sign-up" element={<SignUp />} />
              
              {/* Dashboard route (no nested routes for now) */}
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Demand Forecasting as separate route */}
              <Route path="/demand-forecast" element={<DemandForecast />} />
              <Route path="/supplier-risk" element={<SupplierRisk />} />
              <Route path="/supplier/:name" element={<SupplierDetail />} />


              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;