import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { sendOtpViaEmailJS } from '../api/emailjs';

export default function Login() {
    const [tab, setTab] = useState('password'); // 'password' | 'otp'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const demoAccounts = [
        { role: 'Admin', email: 'admin@visitpass.com', password: 'Admin@123', color: '#e94560' },
        { role: 'Security', email: 'security@visitpass.com', password: 'Security@123', color: '#f5a623' },
        { role: 'Employee', email: 'rajesh@visitpass.com', password: 'Employee@123', color: '#4facfe' },
        { role: 'Visitor', email: 'amit.visitor@gmail.com', password: 'Visitor@123', color: '#10d48e' }
    ];

    const paths = { admin: '/admin/dashboard', security: '/security/checkin', employee: '/employee/appointments', visitor: '/visitor/pass' };

    const startCountdown = () => {
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown(c => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
        }, 1000);
    };

    // Normal password login
    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) return toast.error('Please fill in all fields');
        setLoading(true);
        try {
            const user = await login(email, password);
            toast.success(`Welcome back, ${user.name}!`);
            navigate(paths[user.role] || '/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally { setLoading(false); }
    };

    // Send OTP for login
    const handleSendOTP = async (e) => {
        e?.preventDefault();
        if (!email) return toast.error('Email daalo pehle');
        setLoading(true);
        try {
            const res = await api.post('/auth/send-otp', { email, purpose: 'login' });
            // Send email via EmailJS (browser)
            try {
                await sendOtpViaEmailJS(email, res.data.userName, res.data.otp, 'login');
            } catch (ejErr) {
                console.warn('EmailJS failed:', ejErr);
            }
            toast.success('OTP bheja gaya! Email check karo.');
            setOtpSent(true);
            startCountdown();
        } catch (err) {
            toast.error(err.response?.data?.message || 'OTP bhejne mein error');
        } finally { setLoading(false); }
    };

    // Verify OTP and login
    const handleOTPLogin = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) return toast.error('6-digit OTP daalo');
        setLoading(true);
        try {
            const res = await api.post('/auth/verify-otp-login', { email, otp });
            localStorage.setItem('vp_token', res.data.token);
            localStorage.setItem('vp_user', JSON.stringify(res.data.user));
            window.location.href = paths[res.data.user.role] || '/';
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid OTP');
        } finally { setLoading(false); }
    };

    const fillDemo = (acc) => { setEmail(acc.email); setPassword(acc.password); };

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

                {/* Tab switcher */}
                <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 10, padding: 4, marginBottom: 24, gap: 4 }}>
                    {[{ key: 'password', label: '🔐 Password Login' }, { key: 'otp', label: '📱 OTP Login' }].map(t => (
                        <button key={t.key} onClick={() => switchTab(t.key)} style={{
                            flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
                            fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                            background: tab === t.key ? 'var(--accent-primary)' : 'transparent',
                            color: tab === t.key ? 'white' : 'var(--text-muted)'
                        }}>{t.label}</button>
                    ))}
                </div>

                {/* Password Login */}
                {tab === 'password' && (
                    <form onSubmit={handlePasswordLogin}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input type="email" className="form-input" placeholder="Enter your email"
                                value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                        </div>
                        <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <label className="form-label" style={{ margin: 0 }}>Password</label>
                                <Link to="/forgot-password" style={{ fontSize: 11, color: 'var(--accent-primary)', textDecoration: 'none' }}>
                                    Password bhool gaye?
                                </Link>
                            </div>
                            <input type="password" className="form-input" placeholder="Enter your password"
                                value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                            {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in...</> : '🔐 Sign In'}
                        </button>
                    </form>
                )}

                {/* OTP Login */}
                {tab === 'otp' && (
                    <form onSubmit={otpSent ? handleOTPLogin : handleSendOTP}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input type="email" className="form-input" placeholder="Apna registered email daalo"
                                value={email} onChange={e => setEmail(e.target.value)}
                                disabled={otpSent} />
                        </div>

                        {otpSent && (
                            <div className="form-group">
                                <label className="form-label">OTP Code</label>
                                <input type="text" className="form-input"
                                    placeholder="_ _ _ _ _ _" maxLength={6}
                                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    style={{ letterSpacing: 8, fontSize: 22, textAlign: 'center', fontWeight: 700 }}
                                    autoFocus />
                                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                                    {countdown > 0
                                        ? `Dobara bhejne ke liye ${countdown}s wait karo`
                                        : <button type="button" onClick={handleSendOTP} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: 11 }}>OTP dobara bhejo</button>
                                    }
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                            {loading
                                ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> {otpSent ? 'Verify ho raha hai...' : 'Bhej raha hoon...'}</>
                                : otpSent ? '✅ OTP se Login Karo' : '📧 OTP Bhejo'
                            }
                        </button>

                        {otpSent && (
                            <button type="button" onClick={() => { setOtpSent(false); setOtp(''); }}
                                style={{ width: '100%', marginTop: 8, background: 'none', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 0', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>
                                ← Email change karo
                            </button>
                        )}
                    </form>
                )}

                <div className="auth-divider">DEMO ACCOUNTS</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {demoAccounts.map(acc => (
                        <button key={acc.role} onClick={() => fillDemo(acc)} style={{
                            padding: '10px 12px', borderRadius: 8,
                            background: `rgba(${acc.color === '#e94560' ? '233,69,96' : acc.color === '#f5a623' ? '245,166,35' : acc.color === '#4facfe' ? '79,172,254' : '16,212,142'}, 0.1)`,
                            border: `1px solid ${acc.color}33`, color: acc.color,
                            cursor: 'pointer', font: '13px/1 Inter, sans-serif', fontWeight: 600,
                            transition: 'all 0.2s', textAlign: 'left'
                        }}>
                            <div>{acc.role}</div>
                            <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 400, marginTop: 2 }}>{acc.email}</div>
                        </button>
                    ))}
                </div>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                    Naya account banana hai?{' '}
                    <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Register karo</Link>
                </p>
                <p style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    Pehli baar visitor?{' '}
                    <a href="/pre-register" style={{ color: 'var(--accent-primary)' }}>Pre-register karo</a>
                </p>
            </div>
        </div>
    );
}
