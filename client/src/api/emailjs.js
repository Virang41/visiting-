import emailjs from '@emailjs/browser';

// EmailJS keys from .env — injected via Vite (VITE_ prefix required)
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Send OTP email to user via EmailJS.
 *
 * Your EmailJS template should use these variables:
 *   {{to_email}} — recipient email
 *   {{to_name}}  — recipient name
 *   {{otp}}      — 6-digit OTP
 *   {{purpose}}  — "Login" or "Password Reset"
 */
export const sendOtpViaEmailJS = async (toEmail, toName, otp, purpose) => {
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
        console.warn('⚠️ EmailJS keys not configured in .env');
        return;
    }

    const purposeLabel = purpose === 'login' ? 'Login' : 'Password Reset';

    await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
            to_email: toEmail,
            to_name: toName,
            otp: otp,
            purpose: purposeLabel,
        },
        PUBLIC_KEY
    );
};
