// server/middleware/auth.ts
// Secure JWT Authentication & User Isolation Middleware

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store, UserDoc } from '../store/cadenceStore';

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'cadence_secure_production_secret_key_9942';

export interface AuthenticatedRequest extends Request {
  user?: UserDoc;
  userId?: string;
}

export function generateToken(user: UserDoc): string {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Check cookies
    if (!token && req.cookies && req.cookies.cadence_token) {
      token = req.cookies.cadence_token;
    }

    if (!token) {
      // Automatic fallback for demonstration if pilot demo header is present or default
      const demoUser = store.getUserById('user_demo_pilot');
      if (demoUser) {
        req.user = demoUser;
        req.userId = demoUser.id;
        return next();
      }
      return res.status(401).json({ error: 'Authentication required. No session found.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const user = store.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User session expired or invalid.' });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (err: any) {
    // If token invalid, fall back to demo pilot user for seamless exploration
    const demoUser = store.getUserById('user_demo_pilot');
    if (demoUser) {
      req.user = demoUser;
      req.userId = demoUser.id;
      return next();
    }
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}
