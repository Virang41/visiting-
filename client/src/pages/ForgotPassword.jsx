import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { sendOtpViaEmailJS } from '../api/emailjs';


const STEPS = { EMAIL: 1, OTP: 2, PASSWORD: 3, DONE: 4 };

export default function ForgotPassword() {
    const [step, setStep] = useState(STEPS.EMAIL);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();

    const startCountdown = () => {
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown(c => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
        }, 1000);
    };

    const sendOTP = async (e) => {
        e?.preventDefault();
        if (!email) return toast.error('Email daalo');
        setLoading(true);
        try {
            const res = await api.post('/auth/send-otp', { email, purpose: 'reset' });
            // Send email via EmailJS (browser)
            try {
                await sendOtpViaEmailJS(email, res.data.userName, res.data.otp, 'reset');
            } catch (ejErr) {
                console.warn('EmailJS failed:', ejErr);
            }
            toast.success('OTP bheja gaya! Email check karo.');
            setStep(STEPS.OTP);
            startCountdown();
        } catch (err) {
            toast.error(err.response?.data?.message || 'OTP bhejne mein error');
        } finally { setLoading(false); }
    };

    const verifyOTP = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) return toast.error('6-digit OTP daalo');
        setLoading(true);
        try {
            const res = await api.post('/auth/verify-otp-reset', { email, otp });
            setResetToken(res.data.resetToken);
            toast.success('OTP verify ho gaya!');
            setStep(STEPS.PASSWORD);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally { setLoading(false); }
    };

    const resetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) return toast.error('Password kam se kam 6 characters ka hona chahiye');
        if (newPassword !== confirmPassword) return toast.error('Passwords match nahi ho rahe');
        setLoading(true);
        try {
            await api.post('/auth/reset-password', { resetToken, newPassword });
            toast.success('Password reset ho gaya! Ab login karo.');
            setStep(STEPS.DONE);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Password reset error');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">🔒</div>
                    <div className="auth-logo-text">Forgot <span>Password</span></div>
                    <div className="auth-subtitle">VisitPass — Password Recovery</div>
                </div>

                {/* Step Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '16px 0 24px' }}>
                    {[
                        { n: 1, label: 'Email' },
                        { n: 2, label: 'OTP' },
                        { n: 3, label: 'Reset' },
                    ].map(({ n, label }, i) => (
                        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 700,
                                background: step >= n ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                color: step >= n ? 'white' : 'var(--text-muted)',
                                border: `2px solid ${step >= n ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                transition: 'all 0.3s'
                            }}>{step > n ? '✓' : n}</div>
                            <span style={{ fontSize: 11, color: step >= n ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                            {i < 2 && <div style={{ width: 24, height: 2, background: step > n ? 'var(--accent-primary)' : 'var(--border-color)', borderRadius: 2, transition: 'all 0.3s' }} />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Email */}
                {step === STEPS.EMAIL && (
                    <form onSubmit={sendOTP}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
                            Apna registered email daalo. Hum ek OTP bhejenge.
                        </p>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email" className="form-input"
                                placeholder="aapka@email.com"
                                value={email} onChange={e => setEmail(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                            {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Bhej raha hoon...</> : '📧 OTP Bhejo'}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP */}
                {step === STEPS.OTP && (
                    <form onSubmit={verifyOTP}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
                            6-digit OTP <strong style={{ color: 'var(--accent-primary)' }}>{email}</strong> par bheja gaya hai.
                        </p>
                        <div className="form-group">
                            <label className="form-label">OTP Code</label>
                            <input
                                type="text" className="form-input"
                                placeholder="_ _ _ _ _ _"
                                maxLength={6} value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                style={{ letterSpacing: 8, fontSize: 22, textAlign: 'center', fontWeight: 700 }}
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                            {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Verify ho raha hai...</> : '✅ OTP Verify Karo'}
                        </button>
                        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                            {countdown > 0
                                ? `OTP dobara bhejne ke liye ${countdown}s wait karo`
                                : <button type="button" onClick={sendOTP} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: 12 }}>OTP dobara bhejo</button>
                            }
                        </div>
                    </form>
                )}

                {/* Step 3: New Password */}
                {step === STEPS.PASSWORD && (
                    <form onSubmit={resetPassword}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
                            Ab apna naya password set karo.
                        </p>
                        <div className="form-group">
                            <label className="form-label">Naya Password</label>
                            <input
                                type="password" className="form-input"
                                placeholder="Kam se kam 6 characters"
                                value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password Confirm Karo</label>
                            <input
                                type="password" className="form-input"
                                placeholder="Wahi password dobara daalo"
                                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                            {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Reset ho raha hai...</> : '🔑 Password Reset Karo'}
                        </button>
                    </form>
                )}

                {/* Step 4: Done */}
                {step === STEPS.DONE && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
                        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px' }}>Password Reset Ho Gaya!</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
                            Aap ab apne naye password se login kar sakte hain.
                        </p>
                        <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            🔐 Login Karo
                        </button>
                    </div>
                )}

                {step !== STEPS.DONE && (
                    <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
                        Password yaad aa gaya?{' '}
                        <Link to="/login" style={{ color: 'var(--accent-primary)' }}>Login karo</Link>
                    </p>
                )}
            </div>
        </div>
    );
}
