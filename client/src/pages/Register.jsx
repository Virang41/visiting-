import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function Register() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'visitor',
        department: ''
    });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const roles = [
        { value: 'visitor', label: '🔵 Visitor', desc: 'Visit appointments book karo' },
        { value: 'employee', label: '🟢 Employee', desc: 'Visitors ko invite karo' },
        { value: 'security', label: '🟡 Security', desc: 'QR scan aur check-in' }
    ];

    const rolePaths = {
        admin: '/admin/dashboard',
        security: '/security/checkin',
        employee: '/employee/appointments',
        visitor: '/visitor/pass'
    };

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, email, phone, password, confirmPassword, role, department } = form;
        if (!name || !email || !phone || !password) return toast.error('Sab fields bharo');
        if (password.length < 6) return toast.error('Password kam se kam 6 characters ka hona chahiye');
        if (password !== confirmPassword) return toast.error('Passwords match nahi ho rahe');
        if ((role === 'employee' || role === 'security') && !department)
            return toast.error('Department daalo');

        setLoading(true);
        try {
            await api.post('/auth/register', { name, email, phone, password, role, department });
            toast.success('Account ban gaya! Login ho raha hai...');
            // Auto login after registration
            const user = await login(email, password);
            navigate(rolePaths[user.role] || '/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: 460 }}>
                <div className="auth-logo">
                    <div className="auth-logo-icon">✨</div>
                    <div className="auth-logo-text">Account <span>Banao</span></div>
                    <div className="auth-subtitle">VisitPass — Naya Account</div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Role Selector */}
                    <div className="form-group">
                        <label className="form-label">Account Type</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            {roles.map(r => (
                                <button
                                    type="button"
                                    key={r.value}
                                    onClick={() => setForm(f => ({ ...f, role: r.value }))}
                                    style={{
                                        padding: '10px 6px',
                                        borderRadius: 10,
                                        border: `2px solid ${form.role === r.value ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                        background: form.role === r.value ? 'rgba(233,69,96,0.1)' : 'var(--bg-tertiary)',
                                        color: form.role === r.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        fontSize: 11,
                                        fontWeight: 600,
                                        textAlign: 'center',
                                        transition: 'all 0.2s',
                                        lineHeight: 1.4
                                    }}
                                >
                                    <div style={{ fontSize: 18, marginBottom: 4 }}>{r.label.split(' ')[0]}</div>
                                    <div>{r.label.split(' ')[1]}</div>
                                    <div style={{ fontSize: 9, opacity: 0.7, marginTop: 3, fontWeight: 400 }}>{r.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name */}
                    <div className="form-group">
                        <label className="form-label">Pura Naam</label>
                        <input
                            type="text" className="form-input"
                            placeholder="Aapka naam"
                            value={form.name} onChange={set('name')} autoFocus
                        />
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email" className="form-input"
                            placeholder="aapka@email.com"
                            value={form.email} onChange={set('email')}
                        />
                    </div>

                    {/* Phone */}
                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                            type="tel" className="form-input"
                            placeholder="10-digit mobile number"
                            maxLength={10}
                            value={form.phone} onChange={set('phone')}
                        />
                    </div>

                    {/* Department — only for employee/security */}
                    {(form.role === 'employee' || form.role === 'security') && (
                        <div className="form-group">
                            <label className="form-label">Department</label>
                            <input
                                type="text" className="form-input"
                                placeholder="Jaise: Engineering, HR, Security"
                                value={form.department} onChange={set('department')}
                            />
                        </div>
                    )}

                    {/* Password */}
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password" className="form-input"
                            placeholder="Kam se kam 6 characters"
                            value={form.password} onChange={set('password')}
                        />
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group">
                        <label className="form-label">Password Confirm Karo</label>
                        <input
                            type="password" className="form-input"
                            placeholder="Wahi password dobara daalo"
                            value={form.confirmPassword} onChange={set('confirmPassword')}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                        disabled={loading}
                    >
                        {loading
                            ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Account ban raha hai...</>
                            : '🚀 Account Banao'
                        }
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                    Pehle se account hai?{' '}
                    <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                        Login karo
                    </Link>
                </p>
            </div>
        </div>
    );
}
