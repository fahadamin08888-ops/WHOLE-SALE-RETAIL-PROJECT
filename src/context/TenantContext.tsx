import React, { createContext, useContext, useState, useEffect } from 'react';
import { Business, UserRole, CashRegisterSession } from '../types/erp.ts';

interface TenantContextType {
  activeBusiness: Business | null;
  businesses: Business[];
  currentRole: UserRole;
  currentUserId: string;
  currentUserName: string;
  activeRegisterSession: CashRegisterSession | null;
  isLoading: boolean;
  switchBusiness: (businessId: string) => Promise<void>;
  switchRole: (role: UserRole) => void;
  reloadBusiness: () => Promise<void>;
  reloadRegisterSession: () => Promise<void>;
  createBusiness: (data: any) => Promise<Business>;
  updateSettings: (settings: Partial<Business['settings']>) => Promise<void>;
  formatMoney: (amount: number) => string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('owner');
  const [currentUserId] = useState<string>('usr_1');
  const [currentUserName] = useState<string>('Fahad Amin');
  const [activeRegisterSession, setActiveRegisterSession] = useState<CashRegisterSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch businesses on mount
  const fetchBusinesses = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/businesses');
      if (res.ok) {
        const data: Business[] = await res.json();
        setBusinesses(data);
          let storedId = localStorage.getItem('nexus_active_business_id');
          if (storedId === 'biz_apex_pk') {
            localStorage.removeItem('nexus_active_business_id');
            storedId = null;
          }
          const found = (storedId ? data.find(b => b.id === storedId) : null) || data[0];
          setActiveBusiness(found);
          await fetchRegisterSession(found.id);
      }
    } catch (err) {
      console.error('Failed to fetch businesses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRegisterSession = async (bizId: string) => {
    try {
      const res = await fetch(`/api/register/current?businessId=${bizId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveRegisterSession(data.session);
      }
    } catch (err) {
      console.error('Failed to fetch register session:', err);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const switchBusiness = async (businessId: string) => {
    const biz = businesses.find(b => b.id === businessId);
    if (biz) {
      setActiveBusiness(biz);
      localStorage.setItem('nexus_active_business_id', businessId);
      await fetchRegisterSession(businessId);
    }
  };

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
  };

  const reloadBusiness = async () => {
    if (!activeBusiness) return;
    try {
      const res = await fetch(`/api/businesses/${activeBusiness.id}`);
      if (res.ok) {
        const updated: Business = await res.json();
        setActiveBusiness(updated);
        setBusinesses(prev => prev.map(b => b.id === updated.id ? updated : b));
      }
    } catch (err) {
      console.error('Failed to reload business:', err);
    }
  };

  const reloadRegisterSession = async () => {
    if (activeBusiness) {
      await fetchRegisterSession(activeBusiness.id);
    }
  };

  const createBusiness = async (formData: any): Promise<Business> => {
    const res = await fetch('/api/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create business');
    }
    const data = await res.json();
    const newBiz = data.business;
    setBusinesses(prev => [...prev, newBiz]);
    setActiveBusiness(newBiz);
    localStorage.setItem('nexus_active_business_id', newBiz.id);
    await fetchRegisterSession(newBiz.id);
    return newBiz;
  };

  const updateSettings = async (settings: Partial<Business['settings']>) => {
    if (!activeBusiness) return;
    const res = await fetch(`/api/businesses/${activeBusiness.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
    if (res.ok) {
      const data = await res.json();
      setActiveBusiness(data.business);
      setBusinesses(prev => prev.map(b => b.id === data.business.id ? data.business : b));
    }
  };

  const formatMoney = (amount: number): string => {
    const sym = activeBusiness?.currencySymbol || '₨';
    return `${sym} ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  return (
    <TenantContext.Provider
      value={{
        activeBusiness,
        businesses,
        currentRole,
        currentUserId,
        currentUserName,
        activeRegisterSession,
        isLoading,
        switchBusiness,
        switchRole,
        reloadBusiness,
        reloadRegisterSession,
        createBusiness,
        updateSettings,
        formatMoney,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
