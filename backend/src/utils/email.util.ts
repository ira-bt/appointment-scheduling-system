import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    });
  }

  /**
   * Send a generic email
   */
  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${process.env.SENDER_NAME || 'Appointment System'}" <${process.env.SENDER_EMAIL || 'noreply@appointmentsystem.com'}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  /**
   * Send welcome email to a newly registered user
   */
  public async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; line-height: 1.6; color: #374151; }
          .footer { text-align: center; font-size: 0.875rem; color: #6b7280; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to MediScheduler</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>Thank you for joining <strong>MediScheduler</strong>. We're thrilled to help you manage your healthcare appointments more efficiently.</p>
            <p>With your account, you can now:</p>
            <ul>
              <li>Discover top doctors in your area</li>
              <li>Book appointments with ease</li>
              <li>Manage your medical records securely</li>
            </ul>
            <p>If you have any questions, simply reply to this email or visit our help center.</p>
            <p>Best regards,<br />The MediScheduler Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 MediScheduler. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to MediScheduler!',
      html,
      text: `Welcome to MediScheduler, ${firstName}! Thank you for joining us.`,
    });
  }

  public async sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; line-height: 1.6; color: #374151; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; font-size: 0.875rem; color: #6b7280; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>
            <p>You recently requested to reset your password for your MediScheduler account. Click the button below to reset it. This link is valid for 1 hour.</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p>Best regards,<br />The MediScheduler Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 MediScheduler. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Reset Your MediScheduler Password',
      html,
      text: `Hi ${firstName}, reset your password by clicking here: ${resetUrl}`,
    });
  }

  /**
   * Send booking confirmation email to doctor
   */
  public async sendBookingConfirmation(
    doctorEmail: string,
    doctorName: string,
    patientName: string,
    date: string,
    time: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; line-height: 1.6; color: #374151; }
          .details { background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; font-size: 0.875rem; color: #6b7280; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Appointment Request</h1>
          </div>
          <div class="content">
            <p>Hi <strong>Dr. ${doctorName}</strong>,</p>
            <p>You have a new appointment request on MediScheduler.</p>
            <div class="details">
              <p><strong>Patient:</strong> ${patientName}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${time}</p>
            </div>
            <p>Please log in to your dashboard to approve or reject this request.</p>
            <p>Best regards,<br />The MediScheduler Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 MediScheduler. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: doctorEmail,
      subject: 'New Appointment Request - MediScheduler',
      html,
      text: `Hello Dr. ${doctorName}, you have a new appointment request from ${patientName} for ${date} at ${time}.`,
    });
  }
}

export default new EmailService();