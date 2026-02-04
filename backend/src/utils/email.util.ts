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
   * Send appointment approval email to patient
   */
  public async sendAppointmentApproval(
    patientEmail: string,
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
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; line-height: 1.6; color: #374151; }
          .details { background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; font-size: 0.875rem; color: #6b7280; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Approved</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${patientName}</strong>,</p>
            <p>Your appointment request has been approved by the doctor.</p>
            <div class="details">
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${time}</p>
            </div>
            <p style="color: #059669; font-weight: bold;">Important: Please complete the payment within the next 20 minutes to confirm your session. If not paid within this window, the appointment will be automatically cancelled.</p>
            <p>Log in to your dashboard to "Pay Now" and secure your slot.</p>
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
      to: patientEmail,
      subject: 'Appointment Approved - MediScheduler',
      html,
      text: `Hello ${patientName}, your appointment request for ${date} at ${time} has been approved.`,
    });
  }

  /**
   * Send appointment rejection email to patient
   */
  public async sendAppointmentRejection(
    patientEmail: string,
    patientName: string,
    date: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; }
          .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; line-height: 1.6; color: #374151; }
          .footer { text-align: center; font-size: 0.875rem; color: #6b7280; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Not Approved</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${patientName}</strong>,</p>
            <p>We're sorry to inform you that your appointment request for <strong>${date}</strong> could not be accepted at this time.</p>
            <p>This may be due to an unexpected scheduling conflict. You can try booking another slot or choosing a different doctor.</p>
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
      to: patientEmail,
      subject: 'Update on Your Appointment Request - MediScheduler',
      html,
      text: `Hello ${patientName}, unfortunately your appointment request for ${date} could not be accepted.`,
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

  /**
   * Send payment confirmation email to patient
   */
  public async sendPaymentSuccessPatient(
    patientEmail: string,
    patientName: string,
    doctorName: string,
    amount: number,
    date: string,
    time: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; line-height: 1.6; color: #374151; }
          .details { background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; font-size: 0.875rem; color: #6b7280; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Successful</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${patientName}</strong>,</p>
            <p>Thank you! Your payment for the consultation has been processed successfully.</p>
            <div class="details">
              <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
              <p><strong>Amount Paid:</strong> ₹${amount}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${time}</p>
            </div>
            <p>Your appointment is now <strong>Confirmed</strong>. You can find more details in your dashboard.</p>
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
      to: patientEmail,
      subject: 'Payment Successful & Appointment Confirmed - MediScheduler',
      html,
      text: `Hi ${patientName}, your payment of ₹${amount} for your appointment with Dr. ${doctorName} on ${date} was successful. Your appointment is now confirmed.`,
    });
  }

  /**
   * Send payment notification and scheduling confirmation to doctor
   */
  public async sendPaymentSuccessDoctor(
    doctorEmail: string,
    doctorName: string,
    patientName: string,
    amount: number,
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
            <h1>Appointment Scheduled</h1>
          </div>
          <div class="content">
            <p>Hi <strong>Dr. ${doctorName}</strong>,</p>
            <p>A new appointment has been finalized in your schedule. The patient has successfully completed the payment.</p>
            <div class="details">
              <p><strong>Patient:</strong> ${patientName}</p>
              <p><strong>Fee Credited:</strong> ₹${amount}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${time}</p>
            </div>
            <p>This appointment is now marked as <strong>Confirmed</strong> in your dashboard.</p>
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
      subject: 'Appointment Scheduled: Payment Confirmed - MediScheduler',
      html,
      text: `Hi Dr. ${doctorName}, an appointment with ${patientName} on ${date} at ${time} has been scheduled and paid for (₹${amount}).`,
    });
  }

  /**
   * Send notification when the 20-minute payment initiation window expires
   */
  public async sendPaymentWindowExpired(
    patientEmail: string,
    patientName: string,
    doctorName: string,
    date: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; }
          .header { background-color: #6b7280; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; line-height: 1.6; color: #374151; }
          .footer { text-align: center; font-size: 0.875rem; color: #6b7280; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Window Expired</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${patientName}</strong>,</p>
            <p>Your appointment request with <strong>Dr. ${doctorName}</strong> for <strong>${date}</strong> has been cancelled.</p>
            <p>The 20-minute window to initiate payment has expired. If you still wish to see the doctor, please book a new slot from the dashboard.</p>
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
      to: patientEmail,
      subject: 'Appointment Cancelled: Payment Window Expired - MediScheduler',
      html,
      text: `Hi ${patientName}, your appointment with Dr. ${doctorName} on ${date} has been cancelled because the 20-minute payment window expired.`,
    });
  }
}

export default new EmailService();