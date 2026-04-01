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
import { ProtectedRoute } from "./components/ProtectedRoute";
import SupplierSignIn from "./pages/SupplierSignIn";
import SupplierSignUp from "./pages/SupplierSignUp";
import SupplierDashboard from "./pages/SupplierDashboard";
import SupplierDiscovery from "./pages/SupplierDiscovery";
import SupplierNetwork from "./pages/SupplierNetwork";
import SupplierPortalDetail from "./pages/SupplierPortalDetail";
import AuthSelect from "./pages/AuthSelect";
import SupplierSettings from "./pages/SupplierSettings";
import SupplierProfileSetup from "./pages/SupplierProfileSetup";
import ManufacturerSettings from "./pages/ManufacturerSettings";
import InventoryManagement from "./pages/InventoryManagement";
import RouteOptimizationDashboard from "./pages/route-optimization/RouteOptimizationDashboard";
import RouteOptimizationRunPage from "./pages/route-optimization/RouteOptimizationRunPage";
import FulfillmentPlanDetail from "./pages/route-optimization/FulfillmentPlanDetail";
import RouteOptimizationHistory from "./pages/route-optimization/RouteOptimizationHistory";

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
              <Route path="/auth/select" element={<AuthSelect />} />
              <Route path="/sign-in" element={<AuthSelect />} />
              <Route path="/signin/manufacturer" element={<SignIn />} />
              <Route path="/signin/supplier" element={<SupplierSignIn />} />
              <Route path="/verify-company" element={<CompanyVerification />} />
              <Route path="/sign-up" element={<AuthSelect />} />
              <Route path="/signup/manufacturer" element={<SignUp />} />
              <Route path="/signup/supplier" element={<SupplierSignUp />} />
              <Route path="/supplier-signin" element={<SupplierSignIn />} />
              <Route path="/supplier-signup" element={<SupplierSignUp />} />
              <Route path="/supplier-dashboard" element={<ProtectedRoute roles={['supplier']}><SupplierDashboard /></ProtectedRoute>} />
              <Route path="/supplier/settings" element={<ProtectedRoute roles={['supplier']}><SupplierSettings /></ProtectedRoute>} />
              <Route path="/supplier/profile-setup" element={<ProtectedRoute roles={['supplier']}><SupplierProfileSetup /></ProtectedRoute>} />
              <Route path="/suppliers/discovery" element={<ProtectedRoute roles={['manufacturer','admin','user']}><SupplierDiscovery /></ProtectedRoute>} />
              <Route path="/suppliers/network" element={<ProtectedRoute roles={['manufacturer','admin','user']}><SupplierNetwork /></ProtectedRoute>} />
              <Route path="/suppliers/:supplierId" element={<ProtectedRoute roles={['manufacturer','admin','user']}><SupplierPortalDetail /></ProtectedRoute>} />
              <Route path="/manufacturer/settings" element={<ProtectedRoute roles={['manufacturer','admin','user']}><ManufacturerSettings /></ProtectedRoute>} />
              
              {/* Dashboard route (no nested routes for now) */}
              <Route path="/dashboard" element={<ProtectedRoute roles={['manufacturer','admin','user']}><Dashboard /></ProtectedRoute>} />
              
              {/* Demand Forecasting as separate route */}
              <Route path="/demand-forecast" element={<ProtectedRoute><DemandForecast /></ProtectedRoute>} />
              <Route path="/inventory-management" element={<ProtectedRoute><InventoryManagement /></ProtectedRoute>} />
              <Route path="/supplier-risk" element={<ProtectedRoute><SupplierRisk /></ProtectedRoute>} />
              <Route path="/supplier/:name" element={<ProtectedRoute><SupplierDetail /></ProtectedRoute>} />
              <Route path="/route-optimization" element={<ProtectedRoute><RouteOptimizationDashboard /></ProtectedRoute>} />
              <Route path="/route-optimization/run" element={<ProtectedRoute><RouteOptimizationRunPage /></ProtectedRoute>} />
              <Route path="/route-optimization/plan/:orderId" element={<ProtectedRoute><FulfillmentPlanDetail /></ProtectedRoute>} />
              <Route path="/route-optimization/history" element={<ProtectedRoute><RouteOptimizationHistory /></ProtectedRoute>} />


              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
