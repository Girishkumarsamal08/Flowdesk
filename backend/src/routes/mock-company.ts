import express from 'express';

const router = express.Router();

// Mock database in memory for local demo/testing
const mockCustomers: Record<string, any> = {
  'customer@gmail.com': {
    id: 'cust_01',
    email: 'customer@gmail.com',
    name: 'John Doe',
    tier: 'free',
    status: 'active',
    bandwidthUsed: '100%',
    limitReached: true,
    invoiceStatus: 'unpaid',
    lastOrder: {
      id: 'ord_123',
      status: 'Shipped',
      carrier: 'FedEx',
      trackingNumber: 'FX-987654321',
      expectedDelivery: 'Tomorrow'
    }
  },
  'premium_user@influcraft.com': {
    id: 'cust_02',
    email: 'premium_user@influcraft.com',
    name: 'Jane Smith',
    tier: 'premium',
    status: 'active',
    bandwidthUsed: '32%',
    limitReached: false,
    invoiceStatus: 'paid',
    lastOrder: {
      id: 'ord_555',
      status: 'Processing',
      carrier: 'UPS',
      trackingNumber: 'Pending',
      expectedDelivery: 'In 3 days'
    }
  }
};

// @route   GET /api/mock-company/customer
router.get('/customer', (req, res) => {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'Missing email parameter' });

  const customer = mockCustomers[email.toLowerCase()];
  if (customer) {
    res.json(customer);
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

// @route   GET /api/mock-company/user/usage
router.get('/user/usage', (req, res) => {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'Missing email parameter' });

  const customer = mockCustomers[email.toLowerCase()];
  if (customer) {
    res.json({
      userId: customer.id,
      email: customer.email,
      bandwidthUsed: customer.bandwidthUsed,
      limitReached: customer.limitReached,
      status: customer.status
    });
  } else {
    res.status(404).json({ error: 'User usage records not found' });
  }
});

// @route   GET /api/mock-company/membership/status
router.get('/membership/status', (req, res) => {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'Missing email parameter' });

  const customer = mockCustomers[email.toLowerCase()];
  if (customer) {
    res.json({
      email: customer.email,
      tier: customer.tier,
      status: customer.status
    });
  } else {
    res.status(404).json({ error: 'Membership not found' });
  }
});

// @route   GET /api/mock-company/billing/invoices
router.get('/billing/invoices', (req, res) => {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const customer = mockCustomers[email.toLowerCase()];
  if (customer) {
    res.json({
      email: customer.email,
      status: customer.invoiceStatus,
      invoices: [
        { id: 'inv_101', amount: '$49.00', date: '2026-05-01', paid: customer.invoiceStatus === 'paid' }
      ]
    });
  } else {
    res.status(404).json({ error: 'No billing records found' });
  }
});

// @route   GET /api/mock-company/orders
router.get('/orders', (req, res) => {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const customer = mockCustomers[email.toLowerCase()];
  if (customer && customer.lastOrder) {
    res.json([customer.lastOrder]);
  } else {
    res.status(404).json({ error: 'No orders found' });
  }
});

// @route   GET /api/mock-company/orders/tracking
router.get('/orders/tracking', (req, res) => {
  const orderId = req.query.orderId as string;
  if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

  const foundOrder = Object.values(mockCustomers)
    .map(c => c.lastOrder)
    .find(o => o && o.id === orderId);

  if (foundOrder) {
    res.json(foundOrder);
  } else {
    res.status(404).json({ error: 'Order tracking info not found' });
  }
});

// @route   GET /api/mock-company/status
router.get('/status', (req, res) => {
  res.json({ systemStatus: 'All operations functional', latency: '42ms', services: { db: 'online', api: 'online' } });
});

// @route   POST /api/mock-company/auth/reset
router.post('/auth/reset', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  res.json({ message: `Password reset email successfully sent to ${email}`, status: 'sent' });
});

// @route   POST /api/mock-company/billing/retry
router.post('/billing/retry', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  
  if (mockCustomers[email.toLowerCase()]) {
    mockCustomers[email.toLowerCase()].invoiceStatus = 'paid';
  }
  
  res.json({ message: 'Payment successfully processed!', status: 'success' });
});

// @route   POST /api/mock-company/refunds
router.post('/refunds', (req, res) => {
  const { email, orderId } = req.body;
  if (!email || !orderId) return res.status(400).json({ error: 'Missing email or orderId' });
  res.json({ message: `Refund request registered for Order ${orderId}. Refund will resolve in 3-5 days.`, status: 'processed' });
});

// @route   POST /api/mock-company/service/restart
router.post('/service/restart', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  res.json({ message: `System instances for customer ${email} successfully restarted.`, status: 'active' });
});

export default router;
