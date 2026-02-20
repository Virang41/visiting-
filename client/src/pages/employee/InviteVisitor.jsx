import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MdPersonAdd, MdSearch } from 'react-icons/md';

export default function InviteVisitor() {
    const [step, setStep] = useState(1); // 1=visitor, 2=appointment
    const [visitors, setVisitors] = useState([]);
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [visitorForm, setVisitorForm] = useState({ name: '', email: '', phone: '', company: '', idType: 'aadhar', idNumber: '' });
    const [apptForm, setApptForm] = useState({ purpose: '', scheduledDate: '', scheduledTime: '', duration: 60, location: 'Conference Room A', notes: '' });
    const [showNewVisitor, setShowNewVisitor] = useState(false);

    useEffect(() => {
        if (search.length > 1) {
            api.get('/visitors', { params: { search } }).then(r => setVisitors(r.data.visitors)).catch(() => { });
        } else setVisitors([]);
    }, [search]);

    const createVisitor = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const fd = new FormData();
            Object.entries(visitorForm).forEach(([k, v]) => fd.append(k, v));
            const res = await api.post('/visitors', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setSelectedVisitor(res.data.visitor);
            toast.success('Visitor registered!');
            setShowNewVisitor(false);
            setStep(2);
        } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
        finally { setLoading(false); }
    };

    const submitAppointment = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/appointments', { visitorId: selectedVisitor._id, ...apptForm });
            toast.success('🎉 Appointment created! Visitor will be notified.');
            setStep(1); setSelectedVisitor(null); setSearch('');
            setApptForm({ purpose: '', scheduledDate: '', scheduledTime: '', duration: 60, location: 'Conference Room A', notes: '' });
        } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
        finally { setLoading(false); }
    };

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 50 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>✉️ Invite <span style={{ color: 'var(--accent-primary)' }}>Visitor</span></h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Create appointment and invite a visitor to your office</p>
                </div>

                <div style={{ padding: '32px', maxWidth: 700 }}>
                    {/* Step indicator */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
                        {['Select Visitor', 'Appointment Details'].map((label, i) => (
                            <div key={i} style={{
                                flex: 1, padding: '10px 16px', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: 600,
                                background: step === i + 1 ? 'var(--accent-primary)' : step > i + 1 ? 'rgba(16,212,142,0.15)' : 'var(--bg-card)',
                                color: step === i + 1 ? 'white' : step > i + 1 ? 'var(--accent-green)' : 'var(--text-muted)',
                                border: `1px solid ${step === i + 1 ? 'var(--accent-primary)' : step > i + 1 ? 'rgba(16,212,142,0.3)' : 'var(--border)'}`
                            }}>
                                {step > i + 1 ? '✓ ' : `${i + 1}. `}{label}
                            </div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="card">
                            <div className="card-title">Step 1: Select or Register Visitor</div>

                            {!showNewVisitor ? (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Search Existing Visitor</label>
                                        <div className="search-input-wrap">
                                            <MdSearch className="search-icon" />
                                            <input className="form-input search-input" placeholder="Search by name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)} />
                                        </div>
                                    </div>
                                    {visitors.map(v => (
                                        <div key={v._id} onClick={() => { setSelectedVisitor(v); setStep(2); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 12, padding: 12, cursor: 'pointer', borderRadius: 8,
                                                background: selectedVisitor?._id === v._id ? 'rgba(108,99,255,0.1)' : 'var(--bg-secondary)',
                                                border: `1px solid ${selectedVisitor?._id === v._id ? 'var(--accent-primary)' : 'var(--border)'}`, marginBottom: 8
                                            }}>
                                            <div className="visitor-avatar-sm">{v.name[0]}</div>
                                            <div><div style={{ fontWeight: 500 }}>{v.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{v.email} • {v.company}</div></div>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: 16, textAlign: 'center' }}>
                                        <button className="btn btn-outline" onClick={() => setShowNewVisitor(true)}><MdPersonAdd /> Register New Visitor</button>
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={createVisitor}>
                                    <div className="form-row">
                                        <div className="form-group"><label className="form-label">Full Name *</label><input required className="form-input" value={visitorForm.name} onChange={e => setVisitorForm(p => ({ ...p, name: e.target.value }))} /></div>
                                        <div className="form-group"><label className="form-label">Email *</label><input required type="email" className="form-input" value={visitorForm.email} onChange={e => setVisitorForm(p => ({ ...p, email: e.target.value }))} /></div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group"><label className="form-label">Phone *</label><input required className="form-input" value={visitorForm.phone} onChange={e => setVisitorForm(p => ({ ...p, phone: e.target.value }))} /></div>
                                        <div className="form-group"><label className="form-label">Company</label><input className="form-input" value={visitorForm.company} onChange={e => setVisitorForm(p => ({ ...p, company: e.target.value }))} /></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                                        <button type="button" className="btn btn-outline" onClick={() => setShowNewVisitor(false)}>Back</button>
                                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Register & Continue →'}</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    {step === 2 && selectedVisitor && (
                        <div className="card">
                            <div className="card-title">Step 2: Appointment Details</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 20, border: '1px solid var(--border)' }}>
                                <div className="visitor-avatar-sm">{selectedVisitor.name[0]}</div>
                                <div><div style={{ fontWeight: 600 }}>{selectedVisitor.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedVisitor.email} • {selectedVisitor.company}</div></div>
                                <button className="btn btn-outline btn-sm" onClick={() => { setStep(1); setSelectedVisitor(null); }}>Change</button>
                            </div>

                            <form onSubmit={submitAppointment}>
                                <div className="form-group"><label className="form-label">Purpose of Visit *</label><input required className="form-input" placeholder="e.g. Project Discussion, Interview..." value={apptForm.purpose} onChange={e => setApptForm(p => ({ ...p, purpose: e.target.value }))} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Date *</label><input required type="date" className="form-input" value={apptForm.scheduledDate} min={new Date().toISOString().split('T')[0]} onChange={e => setApptForm(p => ({ ...p, scheduledDate: e.target.value }))} /></div>
                                    <div className="form-group"><label className="form-label">Time *</label><input required type="time" className="form-input" value={apptForm.scheduledTime} onChange={e => setApptForm(p => ({ ...p, scheduledTime: e.target.value }))} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Duration (minutes)</label><input type="number" className="form-input" value={apptForm.duration} onChange={e => setApptForm(p => ({ ...p, duration: e.target.value }))} /></div>
                                    <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={apptForm.location} onChange={e => setApptForm(p => ({ ...p, location: e.target.value }))} /></div>
                                </div>
                                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" placeholder="Additional notes..." value={apptForm.notes} onChange={e => setApptForm(p => ({ ...p, notes: e.target.value }))} /></div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : '📅 Create Appointment'}</button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
