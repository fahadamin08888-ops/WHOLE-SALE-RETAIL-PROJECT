import React, { useState } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { BusinessType } from '../../types/erp.ts';
import { 
  Building2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Key, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';

interface BusinessOnboardingModalProps {
  onClose: () => void;
}

export const BusinessOnboardingModal: React.FC<BusinessOnboardingModalProps> = ({ onClose }) => {
  const { createBusiness } = useTenant();

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+92 300 ');
  const [address, setAddress] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('Wholesale');
  const [currency, setCurrency] = useState('PKR');
  const [timezone, setTimezone] = useState('Asia/Karachi');

  // Integration Fields
  const [projectId, setProjectId] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [isSimulatedDemo, setIsSimulatedDemo] = useState(true);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ownerName.trim() || !email.trim()) {
      setErrorMessage('Please fill in business name, owner name, and email.');
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };


  const handleFinishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createBusiness({
        name,
        ownerName,
        email,
        phone,
        address,
        businessType,
        currency,
        timezone,
        projectId,
        clientEmail,
        privateKey,
        spreadsheetId,
        isSimulatedDemo,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Onboarding failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Onboard New Business Account (SaaS Tenant)
            </h2>
            <p className="text-xs text-slate-500">
              Step {step} of 2: {step === 1 ? 'Business Identity & Regional Settings' : 'Google Cloud & Sheets Setup'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Business Profile */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Business / Trading Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Metro Wholesale Corporation"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Owner Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Business Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@metrowholesale.pk"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Physical Business Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop 14, Main Market, Karachi"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Type</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-medium"
                >
                  <option value="Wholesale">Wholesale (B2B)</option>
                  <option value="Retail">Retail Store</option>
                  <option value="Supermarket">Supermarket</option>
                  <option value="Pharmacy">Pharmacy & Healthcare</option>
                  <option value="Hardware & Building">Hardware & Building</option>
                  <option value="Electronics">Electronics</option>
                  <option value="General Trading">General Trading</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-medium"
                >
                  <option value="PKR">PKR (₨ - Pakistani Rupee)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="AED">AED (AED - UAE Dirham)</option>
                  <option value="SAR">SAR (SAR - Saudi Riyal)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
                >
                  <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Riyadh">Asia/Riyadh (AST)</option>
                  <option value="UTC">UTC (Universal)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-white bg-slate-900 hover:bg-slate-800 rounded-md font-semibold flex items-center gap-1.5"
              >
                Continue to Google Cloud Setup
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Google Cloud & Sheets Setup */}
        {step === 2 && (
          <form onSubmit={handleFinishOnboarding} className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="font-semibold text-slate-900">Google Cloud Credentials</p>
              <p className="text-[11px] text-slate-500">Connect the business's dedicated Google Cloud Service Account and Google Sheet.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Google Cloud Project ID
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e.g. metro-cloud-erp-2026"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Service Account Client Email
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="e.g. sheets-sa@metro-cloud.iam.gserviceaccount.com"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Google Sheets Spreadsheet ID
              </label>
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Service Account Private Key (Optional at onboarding, can be configured later)
              </label>
              <textarea
                rows={2}
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Paste RSA Private Key (-----BEGIN PRIVATE KEY----- ...)"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-[11px] resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-white bg-slate-900 hover:bg-slate-800 rounded-md font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {isSubmitting ? 'Creating Business...' : 'Complete Onboarding & Launch'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
