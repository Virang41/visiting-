import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function PreRegister() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', address: '', idType: 'aadhar', idNumber: '' });
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handlePhoto = (e) => {
        const file = e.target.files[0];
        if (file) { setPhoto(file); setPreview(URL.createObjectURL(file)); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            if (photo) fd.append('photo', photo);
            await api.post('/visitors', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setDone(true);
            toast.success('🎉 Registered successfully!');
        } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
        finally { setLoading(false); }
    };

    if (done) return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ textAlign: 'center', maxWidth: 440 }}>
                <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>You're Registered!</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                    Your visitor profile has been created. Please visit the reception desk with your valid ID on your appointment day.
                </p>
                <button className="btn btn-primary" onClick={() => window.location.href = '/login'} style={{ justifyContent: 'center' }}>
                    View Your Pass
                </button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ width: '100%', maxWidth: 560 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>🏢</div>
                    <h1 style={{ fontSize: 26, fontWeight: 800 }}>Visitor <span style={{ color: 'var(--accent-primary)' }}>Pre-Registration</span></h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>Fill in your details to register as a visitor</p>
                </div>

                <div className="card" style={{ padding: 32 }}>
                    <form onSubmit={handleSubmit}>
                        {/* Photo upload */}
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <label style={{ cursor: 'pointer' }}>
                                <div style={{
                                    width: 88, height: 88, borderRadius: '50%', margin: '0 auto 8px',
                                    background: preview ? 'transparent' : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                                    border: '3px dashed var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden', fontSize: preview ? 0 : 32
                                }}>
                                    {preview ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📷'}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 600 }}>Upload Photo (Optional)</div>
                                <input type="file" accept="image/*" onChange={handlePhoto} hidden />
                            </label>
                        </div>

                        <div className="form-row">
                            <div className="form-group"><label className="form-label">Full Name *</label><input required className="form-input" placeholder="Rahul Sharma" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                            <div className="form-group"><label className="form-label">Email *</label><input required type="email" className="form-input" placeholder="rahul@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label className="form-label">Phone *</label><input required className="form-input" placeholder="9876543210" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                            <div className="form-group"><label className="form-label">Company / Organization</label><input className="form-input" placeholder="ABC Corp" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} /></div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">ID Type</label>
                                <select className="form-select" value={form.idType} onChange={e => setForm(p => ({ ...p, idType: e.target.value }))}>
                                    <option value="aadhar">Aadhar Card</option>
                                    <option value="pan">PAN Card</option>
                                    <option value="passport">Passport</option>
                                    <option value="driving_license">Driving License</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group"><label className="form-label">ID Number</label><input className="form-input" placeholder="XXXX-XXXX-1234" value={form.idNumber} onChange={e => setForm(p => ({ ...p, idNumber: e.target.value }))} /></div>
                        </div>
                        <div className="form-group"><label className="form-label">Address</label><textarea className="form-textarea" placeholder="Your full address..." value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} style={{ minHeight: 72 }} /></div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '14px' }} disabled={loading}>
                            {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Registering...</> : '✅ Complete Pre-Registration'}
                        </button>
                    </form>
                    <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-muted)' }}>
                        Already registered? <a href="/login" style={{ color: 'var(--accent-primary)' }}>Sign In</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
