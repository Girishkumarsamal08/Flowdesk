import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants.js';

export const authenticate = (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.companyId = decoded.id;
    next();
  } catch (err: any) {
    console.error('JWT Authentication Failure:', err.message);
    return res.status(401).json({ message: 'Invalid or expired authentication token' });
  }
};

export const optionalAuth = (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      req.companyId = decoded.id;
    }
  } catch (err: any) {
    console.error('Optional Auth Error:', err.message);
  }
  next();
};
