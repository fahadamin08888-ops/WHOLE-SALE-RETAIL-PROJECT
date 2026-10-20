import React, { useState } from 'react';
import { TenantProvider, useTenant } from './context/TenantContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { PosTerminal } from './components/pos/PosTerminal.tsx';
import { ProductManagement } from './components/inventory/ProductManagement.tsx';
import { CustomerManagement } from './components/crm/CustomerManagement.tsx';
import { SupplierManagement } from './components/crm/SupplierManagement.tsx';
import { PurchaseOrders } from './components/purchasing/PurchaseOrders.tsx';
import { ExpenseTracker } from './components/expenses/ExpenseTracker.tsx';
import { BusinessAnalytics } from './components/reports/BusinessAnalytics.tsx';
import { PlatformAdmin } from './components/admin/PlatformAdmin.tsx';
import { SettingsPage } from './components/settings/SettingsPage.tsx';
import { BusinessOnboardingModal } from './components/onboarding/BusinessOnboardingModal.tsx';

function MainAppContent() {
  const { activeBusiness, isLoading } = useTenant();
  const [activeNav, setActiveNav] = useState<string>('pos');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-xs font-mono">
        Loading NexusERP Cloud Platform...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Bar Header */}
      <Header
        activeNav={activeNav}
        onNavigate={setActiveNav}
        onOpenOnboarding={() => setShowOnboarding(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Workspace Sidebar */}
        <Sidebar activeNav={activeNav} onNavigate={setActiveNav} />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
          {activeNav === 'pos' && <PosTerminal />}
          {activeNav === 'inventory' && <ProductManagement />}
          {activeNav === 'customers' && <CustomerManagement />}
          {activeNav === 'suppliers' && <SupplierManagement />}
          {activeNav === 'purchases' && <PurchaseOrders />}
          {activeNav === 'expenses' && <ExpenseTracker />}
          {activeNav === 'analytics' && <BusinessAnalytics />}
          {activeNav === 'admin' && <PlatformAdmin />}
          {activeNav === 'settings-sheets' && <SettingsPage initialTab="integrations" />}
          {activeNav === 'settings' && <SettingsPage initialTab="receipt" />}
        </main>
      </div>

      {/* Hidden container dedicated to thermal printing */}
      <div id="thermal-print-area" aria-hidden="true"></div>

      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <BusinessOnboardingModal onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <TenantProvider>
      <MainAppContent />
    </TenantProvider>
  );
}
