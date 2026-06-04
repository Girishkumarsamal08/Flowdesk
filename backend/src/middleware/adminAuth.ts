import { ADMIN_SECRET } from '../config/constants.js';

/**
 * Admin authentication middleware.
 * Clients must send:  Authorization: Admin <ADMIN_SECRET>
 * Set ADMIN_SECRET in your .env before deploying.
 */
export const adminAuth = (req: any, res: any, next: any) => {
  try {
    // Read at request-time to handle ESM hoisting (process.env is always current)
    const secret = ADMIN_SECRET || process.env.ADMIN_SECRET || '';

    const authHeader = req.headers.authorization || '';
    const parts = authHeader.split(' ');

    if (parts[0] !== 'Admin' || !parts[1]) {
      return res.status(401).json({
        message: 'Admin authorization required. Send: Authorization: Admin <ADMIN_SECRET>',
      });
    }

    if (!secret || parts[1] !== secret) {
      return res.status(403).json({ message: 'Invalid admin secret' });
    }

    next();
  } catch (err: any) {
    console.error('Admin auth error:', err.message);
    return res.status(500).json({ message: 'Admin authentication error' });
  }
};
