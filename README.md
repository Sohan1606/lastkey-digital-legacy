# LastKey Digital Legacy 

> **Your love, outliving you.** A comprehensive digital legacy platform that preserves your voice, wisdom, and memories for generations to come.

## **Features**

### **Core Security (Zero-Knowledge Architecture)**
- **DEK-Based Encryption** - Per-owner Data Encryption Key, wrapped with password-derived KEK
- **Client-Side Only** - All encryption/decryption happens in browser; server never sees plaintext
- **RSA Keypairs for Beneficiaries** - Secure DEK sharing via RSA-OAEP public key encryption
- **OTP Authentication** - 6-digit codes for beneficiary login (console output in FREE_MODE)
- **Guardian Protocol** - Advanced inactivity monitoring with multi-channel alerts
- **Scoped Access Control** - Granular permissions for beneficiary access (view, download, etc.)
- **Rate Limiting** - Strict limits on authentication endpoints to prevent brute force

### **AI-Powered Features (Gated by FEATURE_AI)**
- **AI Voice Messages** - Transform text to realistic voice with OpenAI TTS
- **Memoir AI** - Guided autobiography generation with life-stage prompts
- **Smart Suggestions** - AI-powered recommendations for legacy optimization
- **Legacy Health Score** - Intelligent scoring system with actionable insights
- *Note: AI features require `FEATURE_AI=true` and valid `OPENAI_API_KEY`*

### **Memory Preservation**
- **Life Timeline** - Interactive chronicle of life events and milestones
- **Time Capsules** - Scheduled messages for future delivery
- **Digital Vault** - Secure storage for accounts, passwords, and documents
- **Beneficiary Management** - Comprehensive loved ones coordination

### **Engagement & Growth**
- **Gamification System** - Streaks, badges, levels, and achievements
- **Onboarding Wizard** - 6-step guided setup for new users
- **Progress Tracking** - Detailed analytics and usage insights
- **Achievement Center** - Celebrate your legacy-building journey

### **Monetization (Gated by FEATURE_PAYMENTS)**
- **Subscription Tiers** - Free, Guardian ($4.99), Legacy Pro ($9.99)
- **Stripe Integration** - Complete billing with webhooks
- **Trial Periods** - 7-day free trial for premium features
- **Usage Analytics** - PostHog integration for growth tracking
- *Note: Payment features require `FEATURE_PAYMENTS=true` and valid Stripe keys*

## **Quick Start**

### **Prerequisites**
- Node.js 18+
- MongoDB 6.0+
- OpenAI API Key (optional, for AI features)
- Stripe Account (optional, for payments)
- Redis (optional, falls back to node-cron)
- **FREE_MODE** - Run without external services (emails logged to console)

### **System Requirements**
- **Memory**: Minimum 4GB RAM, 8GB recommended
- **Storage**: Minimum 10GB free space
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Network**: Stable internet connection for external services

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/Sohan1606/lastkey-digital-legacy.git
cd lastkey-digital-legacy
```

2. **Install dependencies**
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

3. **Environment Setup**
```bash
# Copy environment templates
cp server/.env.example server/.env
cp client/.env.example client/.env

# Configure your environment variables
# See Environment Variables section below
```

4. **Start MongoDB**
```bash
# Make sure MongoDB is running on localhost:27017
mongod
```

> **Note: TTL Index Conflicts**
> If you changed TTL indexes and MongoDB complains with "An equivalent index already exists", 
> drop the old index in MongoDB shell:
> ```javascript
> db.emergencysessions.dropIndex('expiresAt_1')
> ```
> Or drop the dev database entirely: `use lastkey; db.dropDatabase()`

5. **Start the application**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

---

## **FREE_MODE Quickstart (No External Services)**

Perfect for demos, college projects, or local development:

```bash
# server/.env
FREE_MODE=true
EMAIL_MODE=console
FEATURE_AI=false
FEATURE_PAYMENTS=false
```

**What happens:**
- ✅ Emails (OTP codes) print to terminal instead of sending
- ✅ No Stripe, OpenAI, or external services needed
- ✅ Redis optional (falls back to node-cron)
- ✅ All core features work: vault, beneficiaries, capsules, documents

**OTP codes appear like this:**
```
========================================================================
📧 EMAIL (CONSOLE MODE)
========================================================================
TO:      beneficiary@email.com
SUBJECT: Your LastKey Access Code
🔐 OTP CODE: 123456
========================================================================
```

**Developer Convenience: DEV_FAST_MODE**

If you want faster Guardian Protocol testing, set:
```bash
DEV_FAST_MODE=true
```

When enabled, inactivity durations are treated as **minutes** instead of days:
- `7 days` → `7 minutes`
- `30 days` → `30 minutes`

This lets you test the full Guardian flow (alerts → trigger → beneficiary access) in minutes instead of weeks.

---

## **Beneficiary Access Flow (Perfect Workflow)**

The beneficiary portal follows a secure, step-by-step flow:

```
1. Check Status
   └→ GET /api/beneficiary/auth/check-status?email=user@email.com
   └→ Shows if beneficiary is invited, enrolled, or has pending access

2. OTP Login
   └→ POST /api/beneficiary/auth/login/start (sends OTP)
   └→ POST /api/beneficiary/auth/login/verify (verifies OTP)
   └→ Returns JWT + enrollmentStatus + needsEnrollment flag

3. Enrollment (if needsEnrollment=true)
   └→ POST /api/beneficiary/auth/enroll (requires JWT)
   └→ Beneficiary sets unlock secret + uploads RSA public key
   └→ Status changes: invited → enrolled

4. Request Access (only if owner.triggerStatus === 'triggered')
   └→ POST /api/beneficiary/auth/request-access
   └→ Creates EmergencyAccessGrant with scoped permissions

5. Create Session
   └→ POST /api/beneficiary/auth/create-session
   └→ Verifies unlock secret against stored hash
   └→ Returns session token for portal access

6. View Vault + Documents
   └→ GET /api/beneficiary/portal/assets
   └→ GET /api/beneficiary/portal/capsules
   └→ GET /api/beneficiary/portal/legal-documents

7. Download & Decrypt Locally
   └→ GET /api/beneficiary/portal/legal-documents/:id/file (streams bytes)
   └→ Client decrypts using DEK + IV (AES-GCM)
   └→ Server NEVER sees plaintext secrets
```

**Security Highlights:**
- ✅ Zero-knowledge: server stores only ciphertext
- ✅ Scoped access: beneficiaries can only view/download what owner permits
- ✅ Audit logging: all access recorded with timestamps
- ✅ Session-based: temporary access with automatic expiration

## **Environment Variables**

### **Server (.env)**
```env
# Database
MONGO_URI=mongodb://localhost:27017/lastkey
PORT=5000
NODE_ENV=development

# Authentication (REQUIRED - no fallback, validated at boot)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# FREE_MODE - Run without external services (recommended for college projects)
# When FREE_MODE=true, emails are logged to console instead of sent
FREE_MODE=true

# Email Configuration (only needed if FREE_MODE=false)
EMAIL_MODE=console  # Options: console, ethereal, smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Feature Flags (gate external services)
FEATURE_AI=false        # Set to true to enable OpenAI features
FEATURE_PAYMENTS=false  # Set to true to enable Stripe billing

# OpenAI (only if FEATURE_AI=true)
OPENAI_API_KEY=sk-your-openai-key

# Stripe (only if FEATURE_PAYMENTS=true)
STRIPE_SECRET_KEY=sk_test_your-stripe-test-key
STRIPE_GUARDIAN_PRICE_ID=price_guardian_basic
STRIPE_LEGACY_PRO_PRICE_ID=price_legacy_pro

# WhatsApp/Telegram (optional)
WHATSAPP_API_KEY=your_whatsapp_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Estate Administrator
ESTATE_ADMIN_EMAIL=admin@lastkey.com
```

### **Client (.env)**
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Analytics (optional)
VITE_POSTHOG_API_KEY=your_posthog_api_key
VITE_POSTHOG_HOST=https://app.posthog.com

# Stripe (optional)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## **Architecture**

### **Dual-Portal Design**

LastKey uses a unique dual-portal architecture for maximum security:

```
┌─────────────────────┐     ┌─────────────────────┐
│   OWNER PORTAL      │     │ BENEFICIARY PORTAL  │
│   /dashboard        │     │ /beneficiary-portal │
├─────────────────────┤     ├─────────────────────┤
│ • Manage vault      │     │ • View legacy       │
│ • Add beneficiaries │     │ • Download files    │
│ • Set unlock secrets│     │ • Access time       │
│ • Configure trigger │     │   capsules          │
│ • Upload documents  │     │ • Read final msgs   │
└─────────────────────┘     └─────────────────────┘
         │                              │
         └──────────┬───────────────────┘
                    │
         ┌──────────▼──────────┐
         │   ACCESS CONTROL    │
         │ • Owner JWT auth    │
         │ • Beneficiary JWT   │
         │ • Trigger gating    │
         │ • Scoped grants     │
         └─────────────────────┘
```

**Why No Emergency Codes in Email?**

Traditional digital legacy services send emergency access codes via email. This is insecure because:
- Email can be intercepted or hacked
- Codes can be forwarded accidentally
- No verification that the recipient is the actual beneficiary

LastKey's approach:
1. Owner invites beneficiary with enrollment token
2. Beneficiary enrolls and sets their own unlock secret
3. Beneficiary must log in to the Beneficiary Portal
4. Access only granted after owner is "triggered"
5. Beneficiary must provide unlock secret to create session

### **Technology Stack**
- **Frontend**: React 19, Vite, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express, MongoDB, Socket.IO
- **Authentication**: JWT with bcryptjs
- **Encryption**: WebCrypto API (AES-GCM, PBKDF2, RSA-OAEP) - client-side only
- **Payments**: Stripe with webhooks (gated by FEATURE_PAYMENTS)
- **AI**: OpenAI GPT-4 & TTS (gated by FEATURE_AI)
- **Analytics**: PostHog
- **Email**: Nodemailer with SMTP, Ethereal, or Console (FREE_MODE)

### **Encryption Architecture (Zero-Knowledge)**

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE ENCRYPTION                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  OWNER FLOW:                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │   Password  │───▶│  PBKDF2     │───▶│      KEK        │  │
│  └─────────────┘    │  (100k it)  │    │ (Key Encryption)│  │
│                     └─────────────┘    └────────┬────────┘  │
│                                                  │           │
│  ┌─────────────┐    ┌─────────────┐             │           │
│  │ Random DEK  │───▶│ AES-GCM     │◀────────────┘           │
│  │ (256-bit)   │    │ Wrap DEK    │                         │
│  └──────┬──────┘    └──────┬──────┘                         │
│         │                   │                                │
│         │            ┌──────▼──────┐                         │
│         │            │ Wrapped DEK │───▶ Server Storage      │
│         │            │ (salt, iv,  │                         │
│         │            │ ciphertext) │                         │
│         │            └─────────────┘                         │
│         │                                                    │
│         └────────────────────────────────▶ Encrypt vault     │
│                                             assets & docs    │
│                                                              │
│  BENEFICIARY FLOW:                                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │   Unlock    │───▶│  PBKDF2     │───▶│  Decrypt RSA    │  │
│  │   Secret    │    │  (100k it)  │    │  Private Key    │  │
│  └─────────────┘    └─────────────┘    └────────┬────────┘  │
│                                                  │           │
│  ┌─────────────┐    ┌─────────────┐             │           │
│  │  Encrypted  │───▶│ RSA-OAEP    │◀────────────┘           │
│  │  DEK Share  │    │ Decrypt DEK │                         │
│  └──────┬──────┘    └──────┬──────┘                         │
│         │                   │                                │
│         └───────────────────┴────────────────▶ Decrypt vault │
│                                                 assets       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- **DEK (Data Encryption Key)**: Random 256-bit AES key generated per owner
- **KEK (Key Encryption Key)**: Derived from password using PBKDF2 (100k iterations)
- **Server never sees**: Plaintext DEK, passwords, or unencrypted content
- **Beneficiary DEK sharing**: Owner encrypts DEK with beneficiary's RSA public key
- **Beneficiary decryption**: Uses RSA private key (encrypted with their unlock secret)

### **Database Models**
- **User** - Authentication, preferences, Guardian Protocol settings
- **Asset** - Encrypted vault items with zero-knowledge encryption
- **Beneficiary** - Loved ones with enrollment, RSA keys, OTP auth, vault shares
- **Capsule** - Time-locked messages and content
- **LegalDocument** - Property/legal docs with encrypted attachments + recording metadata
- **Timeline** - Life events and milestones
- **VoiceMessage** - AI-generated voice recordings
- **Memoir** - AI-generated autobiography chapters

### **API Endpoints**
```
/api/auth          - Authentication (login, register, verify)
/api/user          - User management and Guardian Protocol
/api/assets        - Digital vault operations
/api/beneficiaries - Beneficiary management
/api/capsules      - Time capsule operations
/api/ai            - AI features (suggestions, voice, memoir)
/api/payment       - Stripe billing and webhooks
/api/beneficiary   - Beneficiary authentication and portal access
/api/timeline      - Life timeline operations
/api/voice-messages - Voice message management
/api/memoir         - Memoir chapter operations
```

## **Key Features Explained**

### **Guardian Protocol**
- Monitors user inactivity with configurable thresholds
- Sends alerts via email, WhatsApp, and Telegram
- Automatically triggers legacy delivery when activated
- Real-time status updates via Socket.IO

### **AI Voice Messages**
- Convert text to realistic voice using OpenAI TTS
- Multiple voice options (alloy, echo, fable, onyx, nova, shimmer)
- Emotional tones (warm, professional, playful, nostalgic, inspirational)
- Save, organize, and download voice recordings

### **Life Timeline**
- Interactive timeline of life events
- Categories: milestones, achievements, memories, travel, family
- Add photos, locations, and descriptions
- Chronological or category-based viewing

### **Memoir AI**
- Guided questions for different life stages
- AI-generated memoir chapters based on prompts
- Life stages: childhood, teenage, early adulthood, midlife, wisdom
- Download complete memoir as text file

### **Gamification**
- Daily login streaks and consistency rewards
- Achievement badges for completing actions
- Level progression with experience points
- Impact points and legacy score tracking

## **Security Features**

- **Zero-Knowledge Encryption**: Client-side AES-256-GCM encryption for vault data and legal documents
- **DEK-Based Encryption**: Per-owner Data Encryption Key; server only stores ciphertext
- **Beneficiary RSA Keypairs**: Secure DEK sharing via RSA-OAEP public key encryption
- **Secure Authentication**: JWT tokens with bcryptjs password hashing (no fallback secrets)
- **Scoped Beneficiary Access**: Granular permissions (viewAssets, viewCapsules, viewDocuments, downloadFiles)
- **Rate Limiting**: API protection against brute force attacks
- **HTTPS Enforcement**: Secure communication channels
- **Data Validation**: Comprehensive input sanitization
- **Privacy Compliance**: GDPR-ready with data deletion capabilities

## **Analytics & Monitoring**

- **PostHog Integration**: User behavior tracking and feature usage
- **Performance Monitoring**: API response times and error tracking
- **User Analytics**: Registration, engagement, and retention metrics
- **Feature Analytics**: Usage patterns for AI features and premium content

## **Deployment**

### **Development**
```bash
# Start development servers
npm run dev  # Backend (port 5000)
npm run dev  # Frontend (port 5173)
```

### **Production**
```bash
# Build frontend
cd client
npm run build

# Start production server
cd ../server
npm start
```

### **Docker (Coming Soon)**
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## **Acknowledgments**

- **OpenAI** - For powerful AI capabilities
- **Stripe** - For seamless payment processing
- **Framer Motion** - For beautiful animations
- **TailwindCSS** - For rapid UI development
- **MongoDB** - For flexible data storage

## **How to Test Locally**

### **Run the Tests**
```bash
cd server
npm test                          # Run all tests
npm test -- tests/perfect-workflow.test.js  # Run perfect workflow tests only
```

### **Test the Perfect Workflow**
1. **Start the server**:
   ```bash
   cd server
   # Ensure FREE_MODE=true in .env for console email output
   npm run dev
   ```

2. **Register an owner**:
   - Visit `http://localhost:5173/register`
   - Create an account
   - Go to Vault page and unlock with your password to generate a DEK

3. **Add a beneficiary**:
   - Go to `/beneficiaries`
   - Add a beneficiary email
   - The enrollment OTP will be logged to the server console (FREE_MODE)

4. **Upload a legal document**:
   - Go to `/legal-documents`
   - With vault unlocked, upload a PDF
   - File is encrypted client-side with DEK before upload
   - Server stores ciphertext with `encrypted=true`

5. **Trigger Guardian Protocol**:
   - Use the test trigger endpoint or wait for inactivity
   - Owner status changes to `triggered`

6. **Access as beneficiary**:
   - Visit `/beneficiary-portal`
   - Enter beneficiary email
   - Enter OTP from console
   - Enter unlock secret
   - View assets, capsules, and legal documents
   - Download legal doc ciphertext and decrypt locally

### **Verify Security**
- `/api/emergency/*` returns 404 (legacy routes removed)
- Tokens signed with wrong JWT secret are rejected (401)
- Legal documents query uses `ownerId` (not `userId`)
- `storagePath` is never exposed in API responses
- Attachments have `sha256Hash` for integrity verification

## **Performance Optimization**

### **Database Optimization**
- **Indexing**: All queries use optimized MongoDB indexes
- **TTL Indexes**: Automatic cleanup of expired sessions and tokens
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Lean queries with selective field projection

### **Frontend Optimization**
- **Code Splitting**: Lazy loading for non-critical components
- **Bundle Optimization**: Tree shaking and minification
- **Image Optimization**: WebP format with fallbacks
- **Caching Strategy**: Service worker for offline functionality

### **Security Performance**
- **Rate Limiting**: In-memory rate limiting with Redis fallback
- **Input Validation**: Comprehensive request sanitization
- **CORS Configuration**: Secure cross-origin requests
- **HTTPS Enforcement**: Secure communication channels

## **Troubleshooting**

### **Common Issues**

#### **Database Connection Issues**
```bash
# Check MongoDB status
mongod --version

# Start MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

#### **Port Conflicts**
```bash
# Check if ports are in use
netstat -an | grep :5000  # Backend
netstat -an | grep :5173  # Frontend

# Kill processes using ports
sudo kill -9 <PID>
```

#### **Environment Variable Issues**
```bash
# Verify environment variables
cat server/.env
cat client/.env

# Check required variables
echo $JWT_SECRET  # Should be 32+ characters
```

#### **Permission Issues**
```bash
# Fix file permissions
chmod +x server/scripts/*.sh
chmod -R 755 server/uploads/
```

### **Debug Mode**
Enable debug logging for troubleshooting:
```bash
# server/.env
DEBUG=lastkey:*
NODE_ENV=development
```

### **Health Checks**
```bash
# Backend health
curl http://localhost:5000/api/health

# Database connectivity
curl http://localhost:5000/api/health/db

# Service status
curl http://localhost:5000/api/health/services
```

## **Development Guide**

### **Code Structure**
```
lastkey-digital-legacy/
client/
  src/
    components/          # Reusable UI components
      ui/               # Base UI components (ConfirmModal, SkeletonCard)
    pages/              # Route components
    contexts/           # React contexts (Auth, Theme)
    utils/              # Helper functions
    hooks/              # Custom React hooks
server/
  controllers/         # Route handlers
  middleware/          # Custom middleware (auth, rate limiting)
  models/             # Database schemas
  routes/             # API route definitions
  utils/              # Server utilities
  jobs/               # Background jobs (cron tasks)
  config/             # Configuration files
```

### **API Development**
- **RESTful Design**: Standard HTTP methods and status codes
- **Error Handling**: Consistent error response format
- **Validation**: Input validation using express-validator
- **Documentation**: JSDoc comments for all endpoints

### **Frontend Development**
- **Component-First**: Modular, reusable components
- **State Management**: React Context + React Query
- **Styling**: Inline styles with premium dark theme
- **Animations**: Framer Motion for smooth transitions

### **Testing**
```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --grep "Authentication"
npm test -- --grep "Encryption"

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## **Deployment Guide**

### **Environment Setup**
```bash
# Production environment variables
NODE_ENV=production
MONGO_URI=mongodb://your-production-db
JWT_SECRET=your-super-secure-production-secret
REDIS_URL=redis://your-redis-instance
```

### **Docker Deployment**
```dockerfile
# Dockerfile (coming soon)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### **Cloud Deployment**
- **AWS**: EC2 + MongoDB Atlas + ElastiCache Redis
- **Google Cloud**: Compute Engine + Cloud MongoDB + Memorystore
- **Azure**: Virtual Machines + Cosmos DB + Redis Cache
- **Heroku**: Dyno + mLab + Redis Cloud

### **Monitoring**
- **Application Monitoring**: New Relic or DataDog
- **Error Tracking**: Sentry
- **Performance Monitoring**: Vercel Analytics
- **Database Monitoring**: MongoDB Atlas Monitoring

## **Security Best Practices**

### **Production Security**
- **Environment Variables**: Never commit secrets to version control
- **Database Security**: Use MongoDB Atlas with IP whitelisting
- **API Security**: Implement API key authentication for services
- **SSL/TLS**: Force HTTPS with valid certificates

### **Data Protection**
- **Encryption**: All sensitive data encrypted at rest and in transit
- **Backup Strategy**: Automated daily backups with point-in-time recovery
- **Access Control**: Principle of least privilege for all systems
- **Audit Logging**: Comprehensive audit trails for all actions

### **Compliance**
- **GDPR**: Right to deletion and data portability
- **CCPA**: California privacy compliance
- **SOC 2**: Security controls and documentation
- **HIPAA**: Healthcare data protection (if applicable)

## **Support**

- **Email**: support@lastkey.com
- **Documentation**: [docs.lastkey.com](https://docs.lastkey.com)
- **Community**: [discord.gg/lastkey](https://discord.gg/lastkey)
- **Bug Reports**: [github.com/Sohan1606/lastkey-digital-legacy/issues](https://github.com/Sohan1606/lastkey-digital-legacy/issues)
- **Feature Requests**: [github.com/Sohan1606/lastkey-digital-legacy/discussions](https://github.com/Sohan1606/lastkey-digital-legacy/discussions)

## **Roadmap**

### **Upcoming Features**
- [ ] **Mobile Apps** - iOS and Android native applications
- [ ] **Blockchain Integration** - Decentralized storage options
- [ ] **Video Messages** - AI-enhanced video legacy creation
- [ ] **Collaborative Vault** - Shared family legacy spaces
- [ ] **Advanced Analytics** - Legacy health insights and recommendations
- [ ] **Enterprise Features** - Business succession planning tools

### **Technical Improvements**
- [ ] **GraphQL API** - More efficient data fetching
- [ ] **Microservices Architecture** - Scalable service separation
- [ ] **Real-time Collaboration** - Live editing and sharing
- [ ] **Advanced Security** - Hardware security key support
- [ ] **Performance Enhancements** - Caching and optimization
- [ ] **Internationalization** - Multi-language support

---

**Made with ** for preserving love across generations**
