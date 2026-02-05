import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

class StripeService {
    /**
     * Create a Checkout Session for an appointment
     */
    async createCheckoutSession(params: {
        appointmentId: string;
        patientEmail: string;
        doctorName: string;
        amount: number; // In Rupees (multiplied by 100 for cents/paise)
        successUrl: string;
        cancelUrl: string;
        expiresAt?: Date;
    }) {
        if (!process.env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is missing in backend .env file');
        }

        try {
            if (!params.amount || params.amount <= 0) {
                throw new Error(`Invalid consultation fee: ${params.amount}. It must be greater than 0.`);
            }

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'inr',
                            product_data: {
                                name: `Consultation with Dr. ${params.doctorName}`,
                                description: `Appointment ID: ${params.appointmentId}`,
                            },
                            unit_amount: Math.round(params.amount * 100),
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                customer_email: params.patientEmail,
                client_reference_id: params.appointmentId,
                success_url: params.successUrl,
                cancel_url: params.cancelUrl,
                expires_at: params.expiresAt ? Math.floor(params.expiresAt.getTime() / 1000) : undefined,
                metadata: {
                    appointmentId: params.appointmentId,
                },
            });

            return session;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown Stripe error';
            console.error('Stripe Session Creation Error:', errorMessage);
            throw error;
        }
    }

    /**
     * Verify Stripe Webhook Signature
     */
    verifyWebhook(payload: string | Buffer, signature: string, secret: string) {
        try {
            return stripe.webhooks.constructEvent(payload, signature, secret);
        } catch (error) {
            console.error('Stripe Webhook Verification Error:', error);
            throw new Error('Invalid webhook signature');
        }
    }
}

export default new StripeService();
