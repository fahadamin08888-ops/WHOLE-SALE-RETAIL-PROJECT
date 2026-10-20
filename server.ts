/**
 * NexusERP Full-Stack Express Server
 * Implements Multi-Tenant ERP API, Google Sheets Service Account verification,
 * encrypted credential vault, and serves Vite frontend middleware.
 */
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { repository } from './src/server/repository.ts';
import { testGoogleSheetsConnection, initializeWorksheets } from './src/server/google-sheets.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Tenant isolation middleware: resolves businessId safely
function resolveTenant(req: Request, res: Response, next: NextFunction) {
  const businessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string) || 'biz_primary';
  (req as any).businessId = businessId;
  next();
}

app.use('/api', resolveTenant);

// --- Google Cloud & Sheets Integration Routes ---

// 1. Test Connection
app.post('/api/integrations/google-sheets/test', async (req: Request, res: Response) => {
  try {
    const { projectId, clientEmail, spreadsheetId, businessId } = req.body;
    let { privateKey } = req.body;

    const targetBizId = businessId || (req as any).businessId;

    // If privateKey was not sent (e.g. testing existing saved connection), fetch from secure server store
    if (!privateKey && targetBizId) {
      privateKey = repository.getDecryptedPrivateKey(targetBizId);
    }

    if (!privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Service Account Private Key is required to test the connection.',
        errorCode: 'MISSING_PRIVATE_KEY',
      });
    }

    const result = await testGoogleSheetsConnection({
      projectId,
      clientEmail,
      privateKey,
      spreadsheetId,
    });

    if (result.success && targetBizId) {
      // Update business integration status
      repository.updateBusiness(targetBizId, {
        googleSheetsConfig: {
          ...repository.getBusinessById(targetBizId)?.googleSheetsConfig!,
          connectionStatus: 'Connected',
          lastTestedAt: new Date().toISOString(),
          errorMessage: undefined,
          verifiedWorksheets: result.details?.existingSheets || [],
        },
      });
    } else if (!result.success && targetBizId) {
      repository.updateBusiness(targetBizId, {
        googleSheetsConfig: {
          ...repository.getBusinessById(targetBizId)?.googleSheetsConfig!,
          connectionStatus: 'Error',
          lastTestedAt: new Date().toISOString(),
          errorMessage: result.message,
        },
      });
    }

    return res.json(result);
  } catch (err: any) {
    console.error('Google Sheets Test Connection Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal connection test failure.',
      errorCode: 'INTERNAL_ERROR',
    });
  }
});

// 2. Save Configuration & Initialize Worksheets
app.post('/api/integrations/google-sheets/save', async (req: Request, res: Response) => {
  try {
    const { 
      projectId, 
      clientEmail, 
      privateKey, 
      spreadsheetId, 
      oauthClientId, 
      oauthClientSecret, 
      oauthRedirectUri, 
      isSimulatedDemo,
      businessId 
    } = req.body;

    const targetBizId = businessId || (req as any).businessId;

    if (!projectId || !clientEmail || !spreadsheetId) {
      return res.status(400).json({
        success: false,
        message: 'Google Cloud Project ID, Service Account Client Email, and Spreadsheet ID are required.',
      });
    }

    // Determine actual private key to verify
    let effectivePrivateKey = privateKey;
    if (!effectivePrivateKey && targetBizId) {
      effectivePrivateKey = repository.getDecryptedPrivateKey(targetBizId);
    }

    let connectionStatus: 'Connected' | 'Not Connected' | 'Error' = 'Connected';
    let errorMessage: string | undefined = undefined;
    let verifiedWorksheets: string[] = [];

    // Verify first before finalizing save
    if (effectivePrivateKey) {
      const testRes = await testGoogleSheetsConnection({
        projectId,
        clientEmail,
        privateKey: effectivePrivateKey,
        spreadsheetId,
      });

      if (!testRes.success) {
        connectionStatus = 'Error';
        errorMessage = testRes.message;
      } else {
        connectionStatus = 'Connected';
        verifiedWorksheets = testRes.details?.existingSheets || [];

        // Attempt initialization of any missing worksheets
        try {
          await initializeWorksheets({
            projectId,
            clientEmail,
            privateKey: effectivePrivateKey,
            spreadsheetId,
          });
        } catch (initErr: any) {
          console.warn('Worksheet init warning:', initErr.message);
        }
      }
    } else {
      connectionStatus = 'Not Connected';
    }

    const updatedBiz = repository.saveGoogleSheetsConfig(targetBizId, {
      projectId,
      clientEmail,
      privateKey,
      spreadsheetId,
      oauthClientId,
      oauthClientSecret,
      oauthRedirectUri,
      connectionStatus,
      lastTestedAt: new Date().toISOString(),
      verifiedWorksheets,
      isSimulatedDemo,
      errorMessage,
    });

    if (!updatedBiz) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    return res.json({
      success: connectionStatus !== 'Error',
      message: connectionStatus === 'Connected' 
        ? 'Google Sheets configuration saved and verified successfully.' 
        : `Configuration saved with connection warning: ${errorMessage}`,
      business: updatedBiz,
    });
  } catch (err: any) {
    console.error('Save Google Sheets Config Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to save Google Sheets configuration.',
    });
  }
});

// 3. Disconnect Google Sheets
app.post('/api/integrations/google-sheets/disconnect', (req: Request, res: Response) => {
  const targetBizId = req.body.businessId || (req as any).businessId;
  const updatedBiz = repository.disconnectGoogleSheets(targetBizId);
  if (!updatedBiz) {
    return res.status(404).json({ success: false, message: 'Business not found.' });
  }
  return res.json({
    success: true,
    message: 'Google Sheets integration disconnected safely. Stored credentials removed.',
    business: updatedBiz,
  });
});

// 4. Initialize worksheets manually
app.post('/api/integrations/google-sheets/initialize', async (req: Request, res: Response) => {
  try {
    const targetBizId = req.body.businessId || (req as any).businessId;
    const biz = repository.getBusinessById(targetBizId);
    if (!biz) return res.status(404).json({ success: false, message: 'Business not found.' });

    const privateKey = repository.getDecryptedPrivateKey(targetBizId);
    if (!privateKey && !biz.googleSheetsConfig.isSimulatedDemo) {
      return res.status(400).json({ success: false, message: 'Private key not available.' });
    }

    const initResult = await initializeWorksheets({
      projectId: biz.googleSheetsConfig.projectId,
      clientEmail: biz.googleSheetsConfig.clientEmail,
      privateKey: privateKey || 'DEMO_PRIVATE_KEY',
      spreadsheetId: biz.googleSheetsConfig.spreadsheetId,
    });

    repository.logAudit(targetBizId, 'admin', biz.ownerName, 'WORKSHEETS_INITIALIZED', 'INTEGRATION', initResult.message);

    return res.json(initResult);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Trigger sync
app.post('/api/integrations/google-sheets/sync', async (req: Request, res: Response) => {
  const targetBizId = req.body.businessId || (req as any).businessId;
  const biz = repository.getBusinessById(targetBizId);
  if (!biz) return res.status(404).json({ success: false, message: 'Business not found.' });

  const syncSuccess = await repository.syncAllDataToGoogleSheets(targetBizId);

  repository.updateBusiness(targetBizId, {
    googleSheetsConfig: {
      ...biz.googleSheetsConfig,
      lastSyncAt: new Date().toISOString(),
      connectionStatus: syncSuccess ? 'Connected' : biz.googleSheetsConfig.connectionStatus,
    },
  });

  repository.logAudit(targetBizId, 'admin', biz.ownerName, 'GOOGLE_SHEETS_SYNC', 'INTEGRATION', 'Synchronized inventory, categories, customers, and ledger data to Google Sheets.');

  return res.json({
    success: syncSuccess,
    message: syncSuccess ? 'Successfully synchronized all data rows to Google Sheets.' : 'Synced with partial warnings.',
    syncedAt: new Date().toISOString(),
  });
});

// --- Multi-Business SaaS Routes ---

// List all businesses
app.get('/api/businesses', (req: Request, res: Response) => {
  res.json(repository.getBusinesses());
});

// Onboard a new business
app.post('/api/businesses', async (req: Request, res: Response) => {
  try {
    const {
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
      oauthClientId,
      oauthClientSecret,
      oauthRedirectUri,
      isSimulatedDemo,
    } = req.body;

    if (!name || !ownerName || !email) {
      return res.status(400).json({ success: false, message: 'Business name, owner name, and email are required.' });
    }

    // Currency symbol
    const currencySymbols: Record<string, string> = {
      PKR: '₨',
      USD: '$',
      EUR: '€',
      AED: 'AED',
      SAR: 'SAR',
      GBP: '£',
    };

    let connectionStatus: 'Connected' | 'Not Connected' | 'Error' = 'Not Connected';
    if (projectId && clientEmail && spreadsheetId) {
      // Validate credentials if provided
      if (privateKey) {
        const testRes = await testGoogleSheetsConnection({
          projectId,
          clientEmail,
          privateKey,
          spreadsheetId,
        });
        connectionStatus = testRes.success ? 'Connected' : 'Error';
      }
    }

    const newBiz = repository.createBusiness({
      name,
      ownerName,
      email,
      phone: phone || '',
      address: address || '',
      businessType: businessType || 'Retail',
      currency: currency || 'PKR',
      currencySymbol: currencySymbols[currency] || '₨',
      timezone: timezone || 'Asia/Karachi',
      googleSheetsConfig: {
        projectId: projectId || '',
        clientEmail: clientEmail || '',
        privateKey: '',
        spreadsheetId: spreadsheetId || '',
        oauthClientId: oauthClientId || '',
        oauthClientSecret: '',
        oauthRedirectUri: oauthRedirectUri || '',
        connectionStatus,
        lastTestedAt: connectionStatus === 'Connected' ? new Date().toISOString() : undefined,
        isSimulatedDemo: Boolean(isSimulatedDemo),
      },
      settings: {
        receiptHeaderNote: `${name}\nTel: ${phone || ''}`,
        receiptFooterNote: 'Thank you for your business!\nPowered by NexusERP Cloud',
        taxRate: 0,
        enableTax: false,
        thermalPrinterWidth: '80mm',
        allowNegativeStock: false,
        defaultSaleType: businessType === 'Wholesale' ? 'wholesale' : 'retail',
      },
      privateKeyPlain: privateKey,
      oauthSecretPlain: oauthClientSecret,
    });

    return res.status(201).json({
      success: true,
      message: `Business "${newBiz.name}" onboarded successfully.`,
      business: newBiz,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Get business details
app.get('/api/businesses/:id', (req: Request, res: Response) => {
  const biz = repository.getBusinessById(req.params.id);
  if (!biz) return res.status(404).json({ success: false, message: 'Business not found.' });
  res.json(biz);
});

// Update business profile or settings
app.put('/api/businesses/:id', (req: Request, res: Response) => {
  const updated = repository.updateBusiness(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Business not found.' });
  res.json({ success: true, business: updated });
});

// Toggle active/suspended status
app.post('/api/businesses/:id/toggle-status', (req: Request, res: Response) => {
  const result = repository.toggleBusinessStatus(req.params.id);
  res.json(result);
});

// --- ERP Core Routes ---

// Products & Inventory
app.get('/api/products', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  res.json(repository.getProducts(bizId));
});

app.post('/api/products', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  const prod = repository.addProduct(bizId, req.body);
  res.status(201).json(prod);
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  const prod = repository.updateProduct(bizId, req.params.id, req.body);
  if (!prod) return res.status(404).json({ message: 'Product not found' });
  res.json(prod);
});

app.post('/api/products/stock-adjust', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  const { productId, delta, reason } = req.body;
  if (!productId || typeof delta !== 'number' || !reason) {
    return res.status(400).json({ message: 'productId, delta, and reason are required.' });
  }
  const prod = repository.adjustStock(bizId, productId, delta, reason);
  if (!prod) return res.status(404).json({ message: 'Product not found' });
  res.json(prod);
});

// Categories
app.get('/api/categories', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  res.json(repository.getCategories(bizId));
});

app.post('/api/categories', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  const cat = repository.addCategory(bizId, req.body.name, req.body.code);
  res.status(201).json(cat);
});

// Customers
app.get('/api/customers', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  res.json(repository.getCustomers(bizId));
});

app.post('/api/customers', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  const cust = repository.addCustomer(bizId, req.body);
  res.status(201).json(cust);
});

app.get('/api/customers/:id/ledger', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  res.json(repository.getCustomerLedger(bizId, req.params.id));
});

app.post('/api/customers/:id/payment', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  const { amount, method, notes } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid payment amount.' });
  const entry = repository.recordCustomerPayment(bizId, req.params.id, amount, method, notes);
  if (!entry) return res.status(404).json({ message: 'Customer not found.' });
  res.json(entry);
});

// Suppliers
app.get('/api/suppliers', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  res.json(repository.getSuppliers(bizId));
});

app.post('/api/suppliers', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  const sup = repository.addSupplier(bizId, req.body);
  res.status(201).json(sup);
});

app.get('/api/suppliers/:id/ledger', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  res.json(repository.getSupplierLedger(bizId, req.params.id));
});

app.post('/api/suppliers/:id/payment', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  const { amount, method, notes } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid payment amount.' });
  const entry = repository.recordSupplierPayment(bizId, req.params.id, amount, method, notes);
  if (!entry) return res.status(404).json({ message: 'Supplier not found.' });
  res.json(entry);
});

// Sales & POS
app.get('/api/sales', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  res.json(repository.getSales(bizId));
});

app.post('/api/sales', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  try {
    const sale = repository.createSale(bizId, req.body);
    res.status(201).json(sale);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Purchases
app.get('/api/purchases', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  res.json(repository.getPurchases(bizId));
});

app.post('/api/purchases', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  const po = repository.createPurchase(bizId, req.body);
  res.status(201).json(po);
});

// Cash Register Sessions
app.get('/api/register/current', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  res.json({ session: repository.getActiveRegisterSession(bizId) });
});

app.post('/api/register/open', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  const { userId, userName, openingFloat, notes } = req.body;
  const session = repository.openRegisterSession(bizId, userId || 'usr_cashier', userName || 'Cashier', openingFloat || 0, notes);
  res.json(session);
});

app.post('/api/register/close', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  const { sessionId, actualCash, notes } = req.body;
  const session = repository.closeRegisterSession(bizId, sessionId, actualCash || 0, notes);
  if (!session) return res.status(404).json({ message: 'Active session not found' });
  res.json(session);
});

// Expenses
app.get('/api/expenses', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  res.json(repository.getExpenses(bizId));
});

app.post('/api/expenses', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  const exp = repository.recordExpense(bizId, req.body);
  res.status(201).json(exp);
});

// Stock Movements
app.get('/api/stock-movements', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  res.json(repository.getStockMovements(bizId));
});

// Reports Dashboard
app.get('/api/reports/summary', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  res.json(repository.getDashboardSummary(bizId));
});

// Audit Logs
app.get('/api/audit-logs', (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  const isSuperAdmin = req.query.all === 'true';
  res.json(repository.getAuditLogs(isSuperAdmin ? undefined : bizId));
});

// Platform SaaS Admin Metrics
app.get('/api/admin/metrics', (req: Request, res: Response) => {
  const businesses = repository.getBusinesses();
  const total = businesses.length;
  const active = businesses.filter(b => b.status === 'active').length;
  const suspended = businesses.filter(b => b.status === 'suspended').length;
  const connectedSheets = businesses.filter(b => b.googleSheetsConfig.connectionStatus === 'Connected').length;
  const failedSheets = businesses.filter(b => b.googleSheetsConfig.connectionStatus === 'Error').length;

  res.json({
    totalBusinesses: total,
    activeBusinesses: active,
    suspendedBusinesses: suspended,
    connectedSheets,
    failedSheets,
    recentErrors: businesses
      .filter(b => b.googleSheetsConfig.errorMessage)
      .map(b => ({
        businessId: b.id,
        businessName: b.name,
        errorMessage: b.googleSheetsConfig.errorMessage,
        lastTestedAt: b.googleSheetsConfig.lastTestedAt,
      })),
  });
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NexusERP server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
