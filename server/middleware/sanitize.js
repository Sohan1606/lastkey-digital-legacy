/**
 * Strips basic XSS vectors from string fields in req.body
 */
const mongoSanitize = require('express-mongo-sanitize');

exports.sanitizeBody = (req, res, next) => {
  // Skip sanitization for multipart/form-data to avoid multer conflicts
  if (req.is('multipart/form-data')) {
    return next();
  }

  // Manually apply mongoSanitize only to req.body to avoid read-only req.query error
  // express-mongo-sanitize by default sanitizes both body and query, but query is read-only in newer Express
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          // Replace MongoDB operators with underscore
          obj[key] = obj[key].replace(/\$/g, '_');
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    }
  };

  if (req.body) {
    sanitizeObject(req.body);
  }

  // Continue with XSS sanitization
  if (req.body && typeof req.body === 'object') {
    const sanitizeValue = (val) => {
      if (typeof val !== 'string') return val;
      // Remove script tags and event handlers
      return val
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    };

    const sanitizeObj = (obj) => {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeValue(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObj(obj[key]);
        }
      });
    };

    sanitizeObj(req.body);
  }
  next();
};
