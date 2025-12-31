// src/middleware/security-headers.ts 

import helmet from 'helmet';
import { Express } from 'express';

export const configureSecurityHeaders = (app: Express) => {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
          ],
          styleSrc: ["'self'", "'unsafe-inline'"], 
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
          frameSrc: ["'none'"], // Prevent embedding
          objectSrc: ["'none'"],
          upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
      },

     
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-origin' },

      dnsPrefetchControl: { allow: false },

      expectCt: {
        maxAge: 86400,
        enforce: true,
      },

      frameguard: { action: 'deny' },
      hidePoweredBy: true,

      hsts: {
        maxAge: 31536000, 
        includeSubDomains: true,
        preload: true,
      },

      ieNoOpen: true,

      noSniff: true,

      originAgentCluster: true,

      permittedCrossDomainPolicies: { permittedPolicies: 'none' },

      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

      xssFilter: true,
    })
  );

  app.use((req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
    );

    if (
      req.path.includes('/api/auth/') ||
      req.path.includes('/api/orders/') ||
      req.path.includes('/api/payment/')
    ) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    
    next();
  });
};