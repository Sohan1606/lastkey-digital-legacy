# Security Policy

## Threat Model

### Assets to Protect

1. **User Credentials & Vault Data** - Client-side encrypted, zero-knowledge
2. **Beneficiary Information** - Personal data, access levels, unlock secrets
3. **Legal Documents** - Property deeds, wills, titles with recording metadata
4. **Time Capsules** - Future messages with scheduled delivery
5. **Emergency Access Grants** - Scoped permissions for triggered access

### Threat Actors

| Actor | Capability | Concern Level |
|-------|-----------|---------------|
| External Attacker | Network access, credential stuffing | High |
| Insider (Employee) | Database access | Medium (mitigated by encryption) |
| Beneficiary (Pre-trigger) | Valid account, no access rights | Medium |
| Non-beneficiary | No legitimate access | Low (properly blocked) |

### Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                        UNTRUSTED                             │
│  Internet → CDN → Load Balancer → WAF                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SEMI-TRUSTED                             │
│  Application Server (Node.js)                                │
│  - Validates JWT tokens                                       │
│  - Enforces RBAC                                             │
│  - Logs audit events                                         │
│  - NEVER sees plaintext vault data                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       TRUSTED                                │
│  Client Browser                                              │
│  - WebCrypto API for encryption/decryption                   │
│  - In-memory CryptoKey storage (useRef)                      │
│  - User's vault password NEVER leaves browser                │
└─────────────────────────────────────────────────────────────┘
```

## What We Do

### ✅ Client-Side Encryption (Zero-Knowledge)

- All vault assets encrypted with AES-GCM in the browser
- Encryption keys derived from user's vault password via PBKDF2
- Server only stores ciphertext - cannot decrypt even if compelled

### ✅ Scoped Access Control (RBAC)

```javascript
// Emergency access grants have explicit scopes
scopes: {
  viewAssets: boolean,
  viewDocuments: boolean,
  viewCapsules: boolean,
  downloadFiles: boolean
}
```

### ✅ Trigger-Based Gating

- Beneficiaries CANNOT access anything before owner is "triggered"
- Trigger status verified on every beneficiary request
- Separate authentication flows for owners vs beneficiaries

### ✅ Secure Session Management

- Emergency sessions: 30-minute expiry, token hashed in DB
- JWT tokens: Short expiry, secure httpOnly not applicable (SPA)
- Socket.IO: JWT authentication, room isolation per user

### ✅ Input Validation

- All inputs validated with Zod schemas
- Rate limiting on sensitive endpoints
- SQL injection protection via Mongoose

### ✅ Audit Logging

- All access events logged with IP, user agent, timestamp
- Failed authentication attempts tracked
- Beneficiary access fully audited

## What We Don't Do

### ❌ Server-Side Vault Decryption

We NEVER decrypt vault assets on the server. If you forget your vault password, we cannot recover your data.

### ❌ Email Emergency Codes

We do NOT send emergency access codes via email. The old emergency code system has been completely removed. Access requires:
1. Owner trigger status = "triggered"
2. Valid beneficiary enrollment
3. Correct unlock secret
4. Valid emergency session

### ❌ Public File Access

Uploaded files are NOT served statically. All file access requires:
- Valid authentication
- Proper authorization (owner or granted beneficiary)
- Audit logging

### ❌ Auto-Release Without Safeguards

Owner cannot enable auto-release until at least one beneficiary is enrolled (sudden death mitigation).

## Security Checklist

### For Developers

- [ ] Never log sensitive data (passwords, tokens, encrypted content)
- [ ] Always use `select: false` for sensitive fields
- [ ] Validate all inputs with Zod schemas
- [ ] Use parameterized queries (Mongoose)
- [ ] Implement proper error handling (don't leak stack traces)
- [ ] Add rate limiting to new endpoints
- [ ] Write tests for access control logic

### For Operators

- [ ] Use strong JWT_SECRET (min 32 chars, random)
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Set up MongoDB authentication
- [ ] Enable audit logging
- [ ] Monitor failed authentication attempts
- [ ] Regular security updates

## Incident Response

### Suspected Data Breach

1. **Immediate**: Rotate JWT_SECRET (forces re-authentication)
2. **Assessment**: Review audit logs for unauthorized access
3. **Notification**: Inform affected users per GDPR/CCPA requirements
4. **Remediation**: Patch vulnerability, rotate credentials

### Lost Vault Password

**We cannot help.** The encryption is client-side with keys derived from the user's password. This is by design - we have zero knowledge of vault contents.

**Mitigation**: Users should set a recovery passphrase for beneficiary access.

## Vulnerability Disclosure

If you discover a security vulnerability, please email security@lastkey.io with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you to coordinate disclosure.

## Security Headers

The application uses Helmet.js with the following headers:

```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

## Compliance Notes

- **GDPR**: User data can be exported/deleted on request
- **CCPA**: California residents can request data deletion
- **SOC 2**: Audit logs maintained for compliance
- **Encryption**: AES-256-GCM for data at rest (client-side)
