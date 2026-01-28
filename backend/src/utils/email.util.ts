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
}

export default new EmailService();