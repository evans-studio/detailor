import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'onboarding@resend.dev';
const REPLY_TO_EMAIL = 'support@detailor.co.uk';

interface BookingData {
  id: string;
  reference: string;
  service_name: string;
  customer_name: string;
  customer_email: string;
  start_at: string;
  end_at: string;
  address: string;
  vehicle_name: string;
  price_breakdown?: { total: number };
  tenant_name?: string;
}

interface AdminNotification {
  booking_id: string;
  reference: string;
  service_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  start_at: string;
  address: string;
  vehicle_name: string;
  price_breakdown?: { total: number };
  admin_email: string;
  tenant_name: string;
}

interface WelcomeData {
  tenant_name: string;
  admin_email: string;
  admin_name: string;
}

interface PasswordResetData {
  email: string;
  reset_link: string;
  name?: string;
}

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmation(booking: BookingData): Promise<boolean> {
  try {
    const startDate = new Date(booking.start_at).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const startTime = new Date(booking.start_at).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [booking.customer_email],
      replyTo: REPLY_TO_EMAIL,
      subject: `Booking Confirmed - ${booking.reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Booking Confirmed!</h1>
          
          <p>Hello ${booking.customer_name},</p>
          
          <p>Your booking has been confirmed and payment processed successfully. Here are the details:</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #1e293b;">Booking Details</h2>
            <p><strong>Reference:</strong> ${booking.reference}</p>
            <p><strong>Service:</strong> ${booking.service_name}</p>
            <p><strong>Date:</strong> ${startDate}</p>
            <p><strong>Time:</strong> ${startTime}</p>
            <p><strong>Vehicle:</strong> ${booking.vehicle_name}</p>
            <p><strong>Location:</strong> ${booking.address}</p>
            <p><strong>Total Paid:</strong> £${booking.price_breakdown?.total || 0}</p>
          </div>
          
          <h3>What's Next?</h3>
          <ul>
            <li>Our team will contact you 24 hours before your appointment</li>
            <li>Please ensure your vehicle is accessible at the scheduled time</li>
            <li>Have your booking reference ready: <strong>${booking.reference}</strong></li>
          </ul>
          
          <p>If you need to make any changes or have questions, please reply to this email or contact us.</p>
          
          <p>Thank you for choosing ${booking.tenant_name || 'Detailor'}!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #64748b;">
            This is an automated confirmation email. Please save this for your records.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send booking confirmation email:', error);
      return false;
    }

    console.log('Booking confirmation email sent successfully:', booking.reference);
    return true;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return false;
  }
}

/**
 * Send booking notification to admin
 */
export async function sendBookingNotificationToAdmin(data: AdminNotification): Promise<boolean> {
  try {
    const startDate = new Date(data.start_at).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const startTime = new Date(data.start_at).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.admin_email],
      replyTo: REPLY_TO_EMAIL,
      subject: `🆕 New Booking Received - ${data.reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #059669; margin-bottom: 20px;">New Booking Received!</h1>
          
          <p>A new booking has been confirmed and paid for ${data.tenant_name}.</p>
          
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h2 style="margin-top: 0; color: #065f46;">Booking Details</h2>
            <p><strong>Reference:</strong> ${data.reference}</p>
            <p><strong>Service:</strong> ${data.service_name}</p>
            <p><strong>Date:</strong> ${startDate}</p>
            <p><strong>Time:</strong> ${startTime}</p>
            <p><strong>Vehicle:</strong> ${data.vehicle_name}</p>
            <p><strong>Location:</strong> ${data.address}</p>
            <p><strong>Total:</strong> £${data.price_breakdown?.total || 0}</p>
          </div>
          
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e293b;">Customer Information</h3>
            <p><strong>Name:</strong> ${data.customer_name}</p>
            <p><strong>Email:</strong> ${data.customer_email}</p>
            ${data.customer_phone ? `<p><strong>Phone:</strong> ${data.customer_phone}</p>` : ''}
          </div>
          
          <h3>Next Steps:</h3>
          <ul>
            <li>Review the booking in your admin dashboard</li>
            <li>Contact customer 24h before appointment if needed</li>
            <li>Ensure staff are scheduled for this time slot</li>
          </ul>
          
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/bookings" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View in Dashboard
            </a>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send admin notification email:', error);
      return false;
    }

    console.log('Admin notification email sent successfully:', data.reference);
    return true;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    return false;
  }
}

/**
 * Send welcome email to new tenant admin
 */
export async function sendWelcomeEmail(data: WelcomeData): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.admin_email],
      replyTo: REPLY_TO_EMAIL,
      subject: `Welcome to Detailor - ${data.tenant_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Welcome to Detailor!</h1>
          
          <p>Hello ${data.admin_name},</p>
          
          <p>Congratulations! Your Detailor account for <strong>${data.tenant_name}</strong> has been created successfully.</p>
          
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #1d4ed8;">Getting Started</h2>
            <ol>
              <li><strong>Complete your setup:</strong> Add your services, pricing, and business details</li>
              <li><strong>Configure payments:</strong> Connect your Stripe account for live payments</li>
              <li><strong>Invite your team:</strong> Add staff members to help manage bookings</li>
              <li><strong>Start taking bookings:</strong> Share your booking link with customers</li>
            </ol>
          </div>
          
          <h3>Quick Links:</h3>
          <ul>
            <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin">Admin Dashboard</a></li>
            <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/services">Manage Services</a></li>
            <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/settings">Business Settings</a></li>
          </ul>
          
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Your Dashboard
            </a>
          </p>
          
          <p>If you have any questions or need assistance, don't hesitate to reach out. We're here to help you succeed!</p>
          
          <p>Best regards,<br>The Detailor Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #64748b;">
            Need help? Reply to this email or visit our support center.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }

    console.log('Welcome email sent successfully:', data.tenant_name);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(data: PasswordResetData): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.email],
      replyTo: REPLY_TO_EMAIL,
      subject: 'Reset Your Detailor Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626; margin-bottom: 20px;">Reset Your Password</h1>
          
          <p>Hello${data.name ? ` ${data.name}` : ''},</p>
          
          <p>We received a request to reset your Detailor password. Click the button below to create a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.reset_link}" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="background: #f8fafc; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace;">
            ${data.reset_link}
          </p>
          
          <p><strong>This link will expire in 1 hour</strong> for security reasons.</p>
          
          <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #64748b;">
            For security reasons, this link can only be used once and will expire soon.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }

    console.log('Password reset email sent successfully:', data.email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}

/**
 * Test email configuration by sending a test email
 */
export async function sendTestEmail(to: string): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: REPLY_TO_EMAIL,
      subject: 'Detailor Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #059669;">Email Configuration Test</h1>
          <p>This is a test email to verify that Detailor email integration is working correctly.</p>
          <p>If you received this email, the configuration is successful!</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send test email:', error);
      return false;
    }

    console.log('Test email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('Error sending test email:', error);
    return false;
  }
}