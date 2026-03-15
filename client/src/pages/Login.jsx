import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { sendOtpViaEmailJS } from '../api/emailjs';

export default function Login() {
    const [tab, setTab] = useState('password'); // 'password' ya 'otp'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    // demo accounts - easy login ke liye
    const demoAccounts = [
        { role: 'Admin',    email: 'admin@visitpass.com',      password: 'Admin@123',    color: '#e94560' },
        { role: 'Security', email: 'security@visitpass.com',   password: 'Security@123', color: '#f5a623' },
        { role: 'Employee', email: 'rajesh@visitpass.com',      password: 'Employee@123', color: '#4facfe' },
        { role: 'Visitor',  email: 'amit.visitor@gmail.com',   password: 'Visitor@123',  color: '#10d48e' },
    ];

    // role ke hisab se redirect
    const roleToPath = {
        admin: '/admin/dashboard',
        security: '/security/checkin',
        employee: '/employee/appointments',
        visitor: '/visitor/pass',
    };

    // 60 sec countdown for OTP resend
    const startCountdown = () => {
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Email aur password dono chahiye');
            return;
        }
        setLoading(true);
        try {
            const user = await login(email, password);
            toast.success(`Welcome, ${user.name}!`);
            navigate(roleToPath[user.role] || '/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login nahi hua, check karo');
        }
        setLoading(false);
    };

    const handleSendOTP = async (e) => {
        e?.preventDefault();
        if (!email) {
            toast.error('Email daalo pehle');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/auth/send-otp', { email, purpose: 'login' });
            console.log('OTP response:', res.data); // debug - remove later

            // email bhejna browser se EmailJS ke through
            try {
                await sendOtpViaEmailJS(email, res.data.userName, res.data.otp, 'login');
            } catch (ejErr) {
                console.warn('EmailJS se mail nahi gaya:', ejErr);
            }

            toast.success('OTP bheja! Email check karo.');
            setOtpSent(true);
            startCountdown();
        } catch (err) {
            toast.error(err.response?.data?.message || 'OTP bhejne mein dikkat aayi');
        }
        setLoading(false);
    };

    const handleOTPLogin = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            toast.error('6 digit ka OTP chahiye');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/auth/verify-otp-login', { email, otp });
            localStorage.setItem('vp_token', res.data.token);
            localStorage.setItem('vp_user', JSON.stringify(res.data.user));
            window.location.href = roleToPath[res.data.user.role] || '/';
        } catch (err) {
            toast.error(err.response?.data?.message || 'OTP galat hai');
        }
        setLoading(false);
    };

    // demo account click se form fill ho jaata hai
    const fillDemo = (acc) => {
        setEmail(acc.email);
        setPassword(acc.password);
    };

    const switchTab = (t) => {
        setTab(t);
        setOtpSent(false);
        setOtp('');
        setCountdown(0);
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-icon">🏢</div>
                    <div className="auth-logo-text">Visit<span>Pass</span></div>
                    <div className="auth-subtitle">Visitor Management System</div>
                </div>

                {/* tab switcher - password ya otp */}
                <div style={{ display: 'flex', background: '#0d0d1a', borderRadius: 10, padding: 4, marginBottom: 24, gap: 4 }}>
                    <button
                        onClick={() => switchTab('password')}
                        style={{
                            flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
                            cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            background: tab === 'password' ? 'var(--purple)' : 'transparent',
                            color: tab === 'password' ? 'white' : 'var(--txt-faint)',
                            transition: 'all 0.2s',
                        }}
                    >
                        🔐 Password Login
                    </button>
                    <button
                        onClick={() => switchTab('otp')}
                        style={{
                            flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
                            cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            background: tab === 'otp' ? 'var(--purple)' : 'transparent',
                            color: tab === 'otp' ? 'white' : 'var(--txt-faint)',
                            transition: 'all 0.2s',
                        }}
                    >
                        📱 OTP Login
                    </button>
                </div>

                {/* Normal password login form */}
                {tab === 'password' && (
                    <form onSubmit={handlePasswordLogin}>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="apna email daalo"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <label className="form-label" style={{ margin: 0 }}>Password</label>
                                <Link to="/forgot-password" style={{ fontSize: 11, color: 'var(--purple)', textDecoration: 'none' }}>
                                    Password bhool gaye?
                                </Link>
                            </div>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="password daalo"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                            {loading ? (
                                <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Loading...</>
                            ) : '🔐 Login Karo'}
                        </button>
                    </form>
                )}

                {/* OTP login form */}
                {tab === 'otp' && (
                    <form onSubmit={otpSent ? handleOTPLogin : handleSendOTP}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="registered email daalo"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={otpSent}
                            />
                        </div>

                        {otpSent && (
                            <div className="form-group">
                                <label className="form-label">OTP Code</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="6 digit OTP"
                                    maxLength={6}
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    style={{ letterSpacing: 8, fontSize: 22, textAlign: 'center', fontWeight: 700 }}
                                    autoFocus
                                />
                                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--txt-faint)' }}>
                                    {countdown > 0
                                        ? `Resend ke liye ${countdown}s rukko`
                                        : <button type="button" onClick={handleSendOTP} style={{ background: 'none', border: 'none', color: 'var(--purple)', cursor: 'pointer', fontSize: 11 }}>
                                            OTP dobara bhejo
                                          </button>
                                    }
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                            {loading
                                ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Wait...</>
                                : otpSent ? '✅ Verify Karo' : '📧 OTP Bhejo'
                            }
                        </button>

                        {otpSent && (
                            <button
                                type="button"
                                onClick={() => { setOtpSent(false); setOtp(''); }}
                                style={{ width: '100%', marginTop: 8, background: 'none', border: '1px solid var(--border-col)', borderRadius: 8, padding: '8px 0', color: 'var(--txt-faint)', cursor: 'pointer', fontSize: 12 }}
                            >
                                ← Email change karo
                            </button>
                        )}
                    </form>
                )}

                <div className="auth-divider">DEMO ACCOUNTS</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {demoAccounts.map(acc => (
                        <button
                            key={acc.role}
                            onClick={() => fillDemo(acc)}
                            style={{
                                padding: '10px 12px',
                                borderRadius: 8,
                                background: `${acc.color}1a`,
                                border: `1px solid ${acc.color}44`,
                                color: acc.color,
                                cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif',
                                fontSize: 13,
                                fontWeight: 600,
                                textAlign: 'left',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            <div>{acc.role}</div>
                            <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 400, marginTop: 2 }}>
                                {acc.email}
                            </div>
                        </button>
                    ))}
                </div>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--txt-faint)' }}>
                    Naya account?{' '}
                    <Link to="/register" style={{ color: 'var(--purple)', fontWeight: 600 }}>Register karo</Link>
                </p>
                <p style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: 'var(--txt-faint)' }}>
                    Pehli baar visitor ho?{' '}
                    <a href="/pre-register" style={{ color: 'var(--purple)' }}>Pre-register karo</a>
                </p>
            </div>
        </div>
    );
}
