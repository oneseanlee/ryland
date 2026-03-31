import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useCartSync } from "@/hooks/useCartSync";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";

// Lazy-loaded routes
const Partners = lazy(() => import("./pages/Partners"));
const Store = lazy(() => import("./pages/Store"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CCPA = lazy(() => import("./pages/CCPA"));
const TSRCompliance = lazy(() => import("./pages/TSRCompliance"));
const Disclaimers = lazy(() => import("./pages/Disclaimers"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FunnelLeadMagnet = lazy(() => import("./pages/funnel/FunnelLeadMagnet"));
const FunnelCoreOffer = lazy(() => import("./pages/funnel/FunnelCoreOffer"));
const FunnelDownsell = lazy(() => import("./pages/funnel/FunnelDownsell"));
const FunnelConsultation = lazy(() => import("./pages/funnel/FunnelConsultation"));
const Assessment = lazy(() => import("./pages/Assessment"));
const Funding = lazy(() => import("./pages/Funding"));
const CreditRepair = lazy(() => import("./pages/CreditRepair"));
const Community = lazy(() => import("./pages/Community"));
const Consultation = lazy(() => import("./pages/Consultation"));
const BookingConfirmation = lazy(() => import("./pages/BookingConfirmation"));
const PartnerOnboarding = lazy(() => import("./pages/PartnerOnboarding"));
const OptIn = lazy(() => import("./pages/OptIn"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const DownloadRedirect = lazy(() => import("./pages/DownloadRedirect"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CreditIntake = lazy(() => import("./pages/CreditIntake"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const PortalLogin = lazy(() => import("./pages/portal/PortalLogin"));
// PortalLayout is NOT lazy-loaded to keep sidebar persistent
import PortalLayout from "./components/portal/PortalLayout";
const PortalDashboard = lazy(() => import("./pages/portal/PortalDashboard"));
const PortalLeads = lazy(() => import("./pages/portal/PortalLeads"));
const PortalCommissions = lazy(() => import("./pages/portal/PortalCommissions"));
const PortalResources = lazy(() => import("./pages/portal/PortalResources"));
const ReferralRedirect = lazy(() => import("./pages/ReferralRedirect"));
const PortalEvents = lazy(() => import("./pages/portal/PortalEvents"));
const PortalSpeaking = lazy(() => import("./pages/portal/PortalSpeaking"));
const PortalSettings = lazy(() => import("./pages/portal/PortalSettings"));

// Admin routes
import AdminLayout from "./components/admin/AdminLayout";
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminAffiliates = lazy(() => import("./pages/admin/AdminAffiliates"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminCommissions = lazy(() => import("./pages/admin/AdminCommissions"));
const AdminPayouts = lazy(() => import("./pages/admin/AdminPayouts"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminAffiliateDetail = lazy(() => import("./pages/admin/AdminAffiliateDetail"));

import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  useCartSync();
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<div className="min-h-screen" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/store" element={<Store />} />
            <Route path="/product/:handle" element={<ProductDetail />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/ccpa" element={<CCPA />} />
            <Route path="/tsr-compliance" element={<TSRCompliance />} />
            <Route path="/disclaimers" element={<Disclaimers />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/funnel" element={<FunnelLeadMagnet />} />
            <Route path="/funnel/offer" element={<FunnelCoreOffer />} />
            <Route path="/funnel/founders" element={<FunnelDownsell />} />
            <Route path="/funnel/consultation" element={<FunnelConsultation />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/funding" element={<Funding />} />
            <Route path="/credit-repair" element={<CreditRepair />} />
            <Route path="/community" element={<Community />} />
            <Route path="/booking-confirmed" element={<BookingConfirmation />} />
            <Route path="/consultation" element={<Consultation />} />
            <Route path="/partner-onboarding" element={<PartnerOnboarding />} />
            <Route path="/opt-in" element={<OptIn />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/download/:token" element={<DownloadRedirect />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/credit-intake" element={<CreditIntake />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/r/:ref" element={<ReferralRedirect />} />
            <Route path="/portal/login" element={<PortalLogin />} />
            <Route path="/portal" element={<PortalLayout />}>
              <Route index element={<PortalDashboard />} />
              <Route path="leads" element={<PortalLeads />} />
              <Route path="commissions" element={<PortalCommissions />} />
              <Route path="resources" element={<PortalResources />} />
              <Route path="events" element={<PortalEvents />} />
              <Route path="speaking" element={<PortalSpeaking />} />
              <Route path="settings" element={<PortalSettings />} />
            </Route>
            {/* Admin routes */}
            <Route path="/portal/admin/login" element={<AdminLogin />} />
            <Route path="/portal/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="affiliates" element={<AdminAffiliates />} />
              <Route path="affiliates/:id" element={<AdminAffiliateDetail />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="commissions" element={<AdminCommissions />} />
              <Route path="payouts" element={<AdminPayouts />} />
              <Route path="reports" element={<AdminReports />} />
            </Route>
            {/* Command Center moved to standalone project: github.com/oneseanlee/Command-Center */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
