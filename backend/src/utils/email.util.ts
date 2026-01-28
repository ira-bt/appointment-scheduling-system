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
      host: process.env.EMAIL_HOST || '',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
      },
    });
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SENDER_EMAIL || 'noreply@appointmentsystem.com',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  public async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const html = `
      <div>
        <h2>Welcome to Appointment Scheduling System, ${firstName}!</h2>
        <p>Thank you for registering with us. We're excited to have you on board.</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <br />
        <p>Best regards,<br />The Appointment Scheduling Team</p>
      </div>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to Appointment Scheduling System',
      html,
    });
  }
}

export default new EmailService();