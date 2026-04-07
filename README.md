# LastKey Digital Legacy 

> **Your love, outliving you.** A comprehensive digital legacy platform that preserves your voice, wisdom, and memories for generations to come.

## **Features**

### **Core Security**
- **Guardian Protocol** - Advanced inactivity monitoring with multi-channel alerts
- **Zero-Knowledge Encryption** - Client-side AES-256 encryption for maximum privacy
- **Emergency Access Portal** - Secure beneficiary access with time-limited codes
- **Real-time Monitoring** - Live status updates via Socket.IO

### **AI-Powered Features**
- **AI Voice Messages** - Transform text to realistic voice with OpenAI TTS
- **Memoir AI** - Guided autobiography generation with life-stage prompts
- **Smart Suggestions** - AI-powered recommendations for legacy optimization
- **Legacy Health Score** - Intelligent scoring system with actionable insights

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

### **Monetization**
- **Subscription Tiers** - Free, Guardian ($4.99), Legacy Pro ($9.99)
- **Stripe Integration** - Complete billing with webhooks
- **Trial Periods** - 7-day free trial for premium features
- **Usage Analytics** - PostHog integration for growth tracking

## **Quick Start**

### **Prerequisites**
- Node.js 18+
- MongoDB 6.0+
- OpenAI API Key (for AI features)
- Stripe Account (for payments)

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

## **Environment Variables**

### **Server (.env)**
```env
# Database
MONGO_URI=mongodb://localhost:27017/lastkey
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# OpenAI (required for AI features)
OPENAI_API_KEY=sk-your-openai-key

# Stripe (required for payments)
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

### **Technology Stack**
- **Frontend**: React 19, Vite, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express, MongoDB, Socket.IO
- **Authentication**: JWT with bcryptjs
- **Payments**: Stripe with webhooks
- **AI**: OpenAI GPT-4 & TTS
- **Analytics**: PostHog
- **Email**: Nodemailer with SMTP

### **Database Models**
- **User** - Authentication, preferences, Guardian Protocol settings
- **Asset** - Encrypted vault items with zero-knowledge encryption
- **Beneficiary** - Loved ones with contact information
- **Capsule** - Time-locked messages and content
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
/api/emergency     - Beneficiary access portal
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

- **Zero-Knowledge Encryption**: Client-side AES-256 encryption for vault data
- **Secure Authentication**: JWT tokens with bcryptjs password hashing
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

## **Support**

- **Email**: support@lastkey.com
- **Documentation**: [docs.lastkey.com](https://docs.lastkey.com)
- **Community**: [discord.gg/lastkey](https://discord.gg/lastkey)

---

**Made with ** for preserving love across generations**
