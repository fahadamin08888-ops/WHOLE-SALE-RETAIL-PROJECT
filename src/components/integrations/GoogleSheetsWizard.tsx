import React, { useState, useEffect } from 'react';
import { useTenant } from '../../context/TenantContext.tsx';
import { REQUIRED_WORKSHEETS } from '../../server/google-sheets.ts';
import { 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Key, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Trash2, 
  HelpCircle,
  Check,
  FileSpreadsheet,
  Layers,
  Lock
} from 'lucide-react';

export const GoogleSheetsWizard: React.FC = () => {
  const { activeBusiness, reloadBusiness } = useTenant();

  // Form states
  const [projectId, setProjectId] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [oauthClientId, setOauthClientId] = useState('');
  const [oauthClientSecret, setOauthClientSecret] = useState('');
  const [oauthRedirectUri, setOauthRedirectUri] = useState('');

  // Password visibility
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showOauthSecret, setShowOauthSecret] = useState(false);

  // Status & testing feedback
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
    errorCode?: string;
  } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Load existing configuration from active business
  useEffect(() => {
    if (activeBusiness?.googleSheetsConfig) {
      const cfg = activeBusiness.googleSheetsConfig;
      setProjectId(cfg.projectId || '');
      setClientEmail(cfg.clientEmail || '');
      setSpreadsheetId(cfg.spreadsheetId || '');
      setOauthClientId(cfg.oauthClientId || '');
      setOauthRedirectUri(cfg.oauthRedirectUri || `${window.location.origin}/auth/google/callback`);
      // Do not populate privateKey with masked string, leave empty unless user wants to replace
      setPrivateKey('');
      setOauthClientSecret('');
    }
  }, [activeBusiness]);

  const config = activeBusiness?.googleSheetsConfig;
  const connectionStatus = config?.connectionStatus || 'Not Connected';


  // Test Connection
  const handleTestConnection = async () => {
    if (!projectId.trim()) {
      setTestResult({ success: false, message: 'Please enter a Google Cloud Project ID.' });
      return;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      setTestResult({ success: false, message: 'Please enter a valid Service Account Client Email.' });
      return;
    }
    if (!config?.hasPrivateKey && !privateKey.trim()) {
      setTestResult({ success: false, message: 'Please enter the Service Account Private Key.' });
      return;
    }
    if (!spreadsheetId.trim()) {
      setTestResult({ success: false, message: 'Please enter a Google Sheets Spreadsheet ID.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setSaveMessage(null);

    try {
      const res = await fetch('/api/integrations/google-sheets/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness?.id || '',
        },
        body: JSON.stringify({
          projectId,
          clientEmail,
          privateKey: privateKey.trim() || undefined,
          spreadsheetId,
          businessId: activeBusiness?.id,
        }),
      });

      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        await reloadBusiness();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to communicate with test server.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Save Configuration
  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId || !clientEmail || !spreadsheetId) {
      setSaveMessage({ type: 'error', text: 'Project ID, Service Account Email, and Spreadsheet ID are required.' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch('/api/integrations/google-sheets/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness?.id || '',
        },
        body: JSON.stringify({
          projectId,
          clientEmail,
          privateKey: privateKey.trim() || undefined,
          spreadsheetId,
          oauthClientId,
          oauthClientSecret: oauthClientSecret.trim() || undefined,
          oauthRedirectUri,
          isSimulatedDemo: projectId.includes('apex-cloud') || privateKey.includes('DEMO'),
          businessId: activeBusiness?.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveMessage({ type: 'success', text: data.message || 'Configuration saved successfully.' });
        setPrivateKey('');
        setOauthClientSecret('');
        await reloadBusiness();
      } else {
        setSaveMessage({ type: 'error', text: data.message || 'Could not save configuration.' });
      }
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Save failed.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Disconnect Google Sheets
  const handleDisconnect = async () => {
    try {
      const res = await fetch('/api/integrations/google-sheets/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness?.id || '',
        },
        body: JSON.stringify({ businessId: activeBusiness?.id }),
      });
      if (res.ok) {
        setShowDisconnectModal(false);
        setTestResult(null);
        setProjectId('');
        setClientEmail('');
        setPrivateKey('');
        setSpreadsheetId('');
        setOauthClientId('');
        setOauthClientSecret('');
        await reloadBusiness();
      }
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  // Initialize Worksheets manually
  const handleInitializeSheets = async () => {
    setIsInitializing(true);
    try {
      const res = await fetch('/api/integrations/google-sheets/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness?.id || '',
        },
        body: JSON.stringify({ businessId: activeBusiness?.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage({ type: 'success', text: data.message });
        await reloadBusiness();
      } else {
        setSaveMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message });
    } finally {
      setIsInitializing(false);
    }
  };

  // Trigger Sync
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/integrations/google-sheets/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': activeBusiness?.id || '',
        },
        body: JSON.stringify({ businessId: activeBusiness?.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage({ type: 'success', text: data.message });
        await reloadBusiness();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>Settings</span>
            <span>/</span>
            <span>Integrations</span>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Google Sheets Configuration</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Google Sheets & Cloud Database Integration
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Connect your business's dedicated Google Cloud project and Google Sheets database for real-time synchronization.
          </p>
        </div>

        {/* Status indicator & Direct Sheets Sync */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={isSyncing || connectionStatus !== 'Connected'}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 border border-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-sm disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync All Tables to Sheets'}</span>
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium bg-white">
            <span className="text-slate-500">Status:</span>
            {connectionStatus === 'Connected' && (
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Connected
              </span>
            )}
            {connectionStatus === 'Not Connected' && (
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Not Connected
              </span>
            )}
            {connectionStatus === 'Error' && (
              <span className="flex items-center gap-1.5 text-rose-700 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Error
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Form on Left (60%), Setup Guide on Right (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveConfiguration} className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
            
            {/* Section A: Google Service Account (Backend Data Storage) */}
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" />
                    <h2 className="text-sm font-semibold text-slate-900">
                      1. Service Account Credentials (Database Read/Write)
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Backend Server Access</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Used by the backend to securely query, insert, and update all 20 worksheets in your Google Sheet.
                </p>
              </div>

              {/* 1. Project ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  1. Google Cloud Project ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="e.g. apex-cloud-erp-2026"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 placeholder:text-slate-400"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Identifies the GCP project. This is not a secret.
                </span>
              </div>

              {/* 2. Service Account Client Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  2. Google Service Account Client Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="e.g. sheets-sync-sa@your-project.iam.gserviceaccount.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 placeholder:text-slate-400"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  The service account email you shared with your Google Spreadsheet as Editor.
                </span>
              </div>

              {/* 3. Service Account Private Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    3. Google Service Account Private Key <span className="text-rose-500">*</span>
                  </label>
                  {config?.hasPrivateKey && (
                    <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Encrypted Key Stored on Server
                    </span>
                  )}
                </div>
                <div className="relative">
                  <textarea
                    rows={showPrivateKey ? 5 : 2}
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder={
                      config?.hasPrivateKey
                        ? '•••••••••••••••••••••••••••••••••••••••••••• (Leave blank to keep current encrypted key)'
                        : 'Paste RSA Private Key (-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----)'
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 placeholder:text-slate-400 resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 p-1 rounded"
                    title={showPrivateKey ? 'Mask private key' : 'Show private key'}
                  >
                    {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Encrypted server-side via AES-256-GCM. Never returned to browser or stored in Google Sheets.
                </span>
              </div>

              {/* 4. Google Sheets Spreadsheet ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  4. Google Sheets Spreadsheet ID <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 placeholder:text-slate-400"
                    required
                  />
                  {spreadsheetId && (
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1 shrink-0"
                      title="Open in Google Sheets"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </a>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Extracted from URL: https://docs.google.com/spreadsheets/d/<b>[SPREADSHEET_ID]</b>/edit
                </span>
              </div>
            </div>

            {/* Section B: Google OAuth 2.0 (User Sign-In Credentials) */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-600" />
                    <h2 className="text-sm font-semibold text-slate-900">
                      2. Google OAuth 2.0 Credentials (User Sign-In)
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Identity Authentication</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Distinct from Service Account. Configures Google Single Sign-On (SSO) for authorized staff.
                </p>
              </div>

              {/* 5. OAuth Client ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  5. Google OAuth Client ID
                </label>
                <input
                  type="text"
                  value={oauthClientId}
                  onChange={(e) => setOauthClientId(e.target.value)}
                  placeholder="e.g. 918237465012-abc123xyz.apps.googleusercontent.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* 6. OAuth Client Secret */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    6. Google OAuth Client Secret
                  </label>
                  {config?.hasOauthSecret && (
                    <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Encrypted Secret Stored
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showOauthSecret ? 'text' : 'password'}
                    value={oauthClientSecret}
                    onChange={(e) => setOauthClientSecret(e.target.value)}
                    placeholder={config?.hasOauthSecret ? '••••••••••••••••••••••••••••••••' : 'e.g. GOCSPX-xxxxxxxxxxxxxxxx'}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 placeholder:text-slate-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOauthSecret(!showOauthSecret)}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 p-1 rounded"
                  >
                    {showOauthSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 7. OAuth Redirect URI */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  7. Google OAuth Authorized Redirect URI
                </label>
                <input
                  type="text"
                  value={oauthRedirectUri}
                  onChange={(e) => setOauthRedirectUri(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-700 font-mono"
                  readOnly
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Add this exact URL to Authorized Redirect URIs in your Google Cloud Console OAuth Client.
                </span>
              </div>
            </div>

            {/* Test Results Callout */}
            {testResult && (
              <div
                className={`p-4 rounded-lg border text-sm ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.details && (
                      <div className="text-xs text-slate-700 space-y-1 mt-2">
                        <p>Spreadsheet: <b>{testResult.details.spreadsheetTitle}</b></p>
                        <p>Discovered Worksheets: <b>{testResult.details.existingSheets?.length || 0} / 20</b></p>
                        <p>Permissions: Read <b>✓</b> · Write <b>✓</b></p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Save Message */}
            {saveMessage && (
              <div
                className={`p-3 rounded-lg border text-xs font-medium ${
                  saveMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {saveMessage.text}
              </div>
            )}

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Testing API...' : 'Test Connection'}
                </button>

                {connectionStatus === 'Connected' && (
                  <button
                    type="button"
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                    className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sync Now
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {connectionStatus === 'Connected' && (
                  <button
                    type="button"
                    onClick={() => setShowDisconnectModal(true)}
                    className="px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent rounded-md transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Disconnect
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isSaving ? 'Validating & Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </form>

          {/* Worksheets Status Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Required Worksheets Status ({config?.verifiedWorksheets?.length || 0} / 20 Initialized)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleInitializeSheets}
                disabled={isInitializing || connectionStatus !== 'Connected'}
                className="px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 rounded border border-indigo-200 disabled:opacity-40"
              >
                {isInitializing ? 'Initializing...' : 'Initialize Missing Sheets'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {REQUIRED_WORKSHEETS.map((sheet) => {
                const isVerified = (config?.verifiedWorksheets || []).includes(sheet);
                return (
                  <div
                    key={sheet}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded border text-xs ${
                      isVerified
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-amber-50/50 border-amber-200 text-amber-800'
                    }`}
                  >
                    <span className="font-mono truncate">{sheet}</span>
                    {isVerified ? (
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-amber-600 font-medium">Pending</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Instructions Column (40%) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900">Google Cloud Setup Instructions</h2>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="space-y-1">
                <span className="font-semibold text-slate-900 block">Step 1: Create a Google Cloud Project</span>
                <p>
                  Visit the{' '}
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 underline font-medium"
                  >
                    Google Cloud Console
                  </a>{' '}
                  and create a project (e.g., <code>apex-cloud-erp-2026</code>). Copy your Project ID into field 1.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-900 block">Step 2: Enable Google Sheets & Drive APIs</span>
                <p>
                  Navigate to <b>APIs & Services → Library</b>, search for <b>Google Sheets API</b> and click <b>Enable</b>. Also enable <b>Google Drive API</b>.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-900 block">Step 3: Create Service Account & JSON Key</span>
                <p>
                  Go to <b>IAM & Admin → Service Accounts</b> → Click <b>Create Service Account</b>. Once created, click the service account → <b>Keys tab → Add Key → Create New Key (JSON)</b>.
                </p>
                <p className="text-slate-500">
                  Open the downloaded JSON file. Copy <code>client_email</code> into field 2 and <code>private_key</code> into field 3.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-900 block">Step 4: Share Google Sheet with Service Account</span>
                <p className="bg-amber-50 p-2.5 rounded border border-amber-200 text-amber-900">
                  <b>Critical Requirement:</b> Open your target Google Sheet. Click the green <b>Share</b> button in the top right. Paste your Service Account email (from field 2) and grant <b>Editor</b> role.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-900 block">Step 5: Configure Google OAuth 2.0 (Optional)</span>
                <p>
                  Go to <b>APIs & Services → Credentials → Create Credentials → OAuth Client ID (Web Application)</b>. Add the redirect URI shown in field 7.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="bg-slate-50 p-3 rounded-md text-[11px] text-slate-600 space-y-1">
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Security & Isolation Guarantee
                  </span>
                  <p>
                    Each business tenant connects its own Google Cloud project. Credentials are encrypted on the server with AES-256-GCM. Private keys are never exposed in frontend code.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="bg-slate-900 text-slate-300 rounded-lg p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-white font-semibold">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Spreadsheet Schema Information</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              When connection succeeds, NexusERP automatically provisions and verifies the 20 ERP tables with standardized schema v1.0.0. Existing data is preserved without overwrite.
            </p>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
              <span>Schema Version: <b>v1.0.0</b></span>
              <span>Last Tested: <b>{config?.lastTestedAt ? new Date(config.lastTestedAt).toLocaleTimeString() : 'Never'}</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Disconnect Google Sheets?</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to disconnect Google Sheets for <b>{activeBusiness?.name}</b>?
              Stored credentials will be deleted from the encrypted server vault. Your Google Spreadsheet data will not be deleted.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors"
              >
                Yes, Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
