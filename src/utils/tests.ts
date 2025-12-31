// =====================================
// USAGE EXAMPLES
// =====================================

/*
// In app.ts - Apply to critical endpoints:

import { validateRequestSignature } from './middleware/request-signing';

// Refund endpoint (critical operation)
app.post(
  '/api/v1/orders/:id/refund',
  authenticate,
  validateRequestSignature({ maxAge: 2 * 60 * 1000 }), // 2 minute window
  csrfProtection,
  orderController.refund
);

// Payment confirmation (critical operation)
app.post(
  '/api/v1/orders/:id/confirm-payment',
  authenticate,
  validateRequestSignature({ 
    maxAge: 2 * 60 * 1000,
    includeQuery: true,
    requiredHeaders: ['content-type', 'user-agent']
  }),
  csrfProtection,
  orderController.confirmPayment
);

// =====================================
// CLIENT-SIDE USAGE (React/JavaScript)
// =====================================

async function makeSignedRequest(endpoint, method, body) {
  const SECRET = process.env.REACT_APP_SIGNING_SECRET;
  
  const url = new URL(endpoint, window.location.origin);
  const path = url.pathname;
  const query = Object.fromEntries(url.searchParams);
  
  const { signature, timestamp, nonce } = generateRequestSignature(
    method,
    path,
    query,
    body,
    SECRET
  );
  
  const response = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-Signature': signature,
      'X-Request-Timestamp': timestamp,
      'X-Request-Nonce': nonce,
      'X-Signature-Algorithm': 'hmac-sha256',
    },
    body: JSON.stringify(body)
  });
  
  return response.json();
}

// Example usage:
await makeSignedRequest('/api/v1/orders/123/refund', 'POST', {
  amount: 100.00,
  reason: 'CUSTOMER_REQUEST'
});
*/