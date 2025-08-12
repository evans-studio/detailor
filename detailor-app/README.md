# Detailor - Multi-Tenant Booking Platform

A production-ready SaaS platform for service-based businesses like auto detailing, cleaning services, and more.

## 🚀 Production Launch Ready

✅ **Core Features Complete**
- Multi-tenant booking system with RLS
- Stripe payment processing + refunds
- Real-time notifications and updates  
- Guest and authenticated booking flows
- Admin dashboard with drag-and-drop calendar
- Staff mobile operations
- Tier-based feature limits (Starter/Pro)

✅ **Production Infrastructure**
- Email notifications (Resend integration)
- Error monitoring (Sentry)
- Health checks and monitoring
- Security headers and input sanitization
- Demo tenant for sales/testing

## 🔧 Quick Start

### For Customers (Booking a Service)
1. Visit your service provider's booking link
2. Select your desired service
3. Choose date/time from available slots
4. Enter vehicle and contact details
5. Complete payment via Stripe
6. Receive confirmation email with booking details

### For Business Owners (Admin Dashboard)
1. Access admin dashboard at `/admin`
2. **Services**: Configure your service offerings and pricing
3. **Calendar**: View and manage bookings with drag-and-drop
4. **Staff**: Invite team members and manage permissions
5. **Settings**: Configure business details and branding

### For Staff (Mobile Operations)
1. Access staff dashboard at `/app/staff`
2. View today's assigned jobs
3. Start jobs, upload evidence photos
4. Complete jobs and update status
5. Contact customers directly from the app

## 🏥 Health Check & Monitoring

- **Health Endpoint**: `/api/health` - System status
- **Error Monitoring**: Sentry integration for production issues
- **Email Testing**: `/api/dev/test-email` - Test email delivery
- **Demo Data**: `/api/demo/seed` - Create sample tenant

## 📧 Email Notifications

Automated emails sent via Resend:
- ✅ Booking confirmations to customers
- ✅ Admin notifications for new bookings  
- ✅ Welcome emails for new tenants
- ✅ Password reset functionality

## 🔒 Security Features

- Content Security Policy headers
- Input sanitization on all endpoints
- Rate limiting for sensitive operations
- Supabase RLS for data isolation
- HTTPS enforcement in production

## 🎯 Key Endpoints

- `/api/health` - System health status
- `/api/guest/bookings` - Guest booking creation
- `/api/payments/checkout-booking` - Stripe checkout
- `/book/new` - Public booking page
- `/admin` - Business owner dashboard

## 💾 Environment Variables Required

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Payments  
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email
RESEND_API_KEY=re_...

# Monitoring (Production)
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project
SENTRY_AUTH_TOKEN=your_token
```

## 🏢 Demo Tenant

Test the platform with pre-populated demo data:
- **Company**: Detailor Demo  
- **Admin**: demo_admin@tenant.com / DemoPass123!
- **Customer**: demo_customer@tenant.com / DemoPass123!
- **Features**: 3 services, sample customers, 4+ bookings

## 📱 Browser Support

Optimized for:
- Chrome 90+
- Safari 14+  
- Firefox 88+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🚀 Deployment

The application is production-ready and can be deployed to:
- Vercel (recommended)
- Railway  
- Render
- Any Node.js hosting platform

---

**Built with Next.js 15, TypeScript, Supabase, and Stripe** • Ready for production use today.