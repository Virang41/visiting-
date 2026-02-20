import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { MdDownload, MdRefresh } from 'react-icons/md';

const PassCard = ({ pass }) => {
    const now = new Date();
    const isExpired = now > new Date(pass.validTo);
    const isNotYetValid = now < new Date(pass.validFrom);
    const isActive = !isExpired && !isNotYetValid && pass.status !== 'revoked';

    const downloadPDF = async () => {
        try {
            const res = await api.get(`/passes/${pass._id}/pdf`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a'); a.href = url; a.download = `visitor-pass-${pass.passId?.slice(0, 8)}.pdf`; a.click();
            URL.revokeObjectURL(url);
        } catch (err) { toast.error('Download failed'); }
    };

    return (
        <div className="pass-card">
            <div className="pass-header">
                <div className="pass-org">VISITPASS MANAGEMENT SYSTEM</div>
                <div className="pass-title">VISITOR PASS</div>
                <div style={{ marginTop: 16 }}>
                    <div className="pass-avatar">{pass.visitor?.photo ? <img src={`http://localhost:5000${pass.visitor.photo}`} alt="" /> : pass.visitor?.name?.[0]}</div>
                    <div className="pass-visitor-name">{pass.visitor?.name}</div>
                    <div className="pass-visitor-sub">{pass.visitor?.company || pass.visitor?.email}</div>
                </div>
            </div>

            <div className="pass-details">
                <div className="pass-detail-item"><div className="detail-label">Host</div><div className="detail-value">{pass.host?.name}</div></div>
                <div className="pass-detail-item"><div className="detail-label">Department</div><div className="detail-value">{pass.host?.department || 'N/A'}</div></div>
                <div className="pass-detail-item"><div className="detail-label">Location</div><div className="detail-value">{pass.location}</div></div>
                <div className="pass-detail-item"><div className="detail-label">Pass ID</div><div className="detail-value" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{pass.passId?.slice(0, 16)?.toUpperCase()}</div></div>
            </div>

            <div className="pass-validity">
                🕐 Valid: {new Date(pass.validFrom).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} — {new Date(pass.validTo).toLocaleString('en-IN', { timeStyle: 'short' })}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, justifyContent: 'center' }}>
                <span className={`badge badge-${isActive ? 'green' : isExpired ? 'red' : isNotYetValid ? 'yellow' : 'gray'}`}>
                    {isActive ? '✅ Active' : isExpired ? '❌ Expired' : isNotYetValid ? '⏳ Not Yet Valid' : pass.status}
                </span>
            </div>

            {pass.qrCode && (
                <div className="pass-qr">
                    <img src={pass.qrCode} alt="QR Code" />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Scan at security desk</div>
                </div>
            )}

            <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} onClick={downloadPDF}>
                <MdDownload /> Download PDF Pass
            </button>
        </div>
    );
};

export default function MyPass() {
    const { user } = useAuth();
    const [passes, setPasses] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPasses = async () => {
        setLoading(true);
        try {
            const res = await api.get('/passes/my');
            setPasses(res.data.passes);
        } catch (err) { toast.error('Failed to load passes'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPasses(); }, []);

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700 }}>🎫 My <span style={{ color: 'var(--accent-primary)' }}>Visitor Pass</span></h1>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Show this pass at the security desk</p>
                    </div>
                    <button className="btn btn-outline" onClick={fetchPasses}><MdRefresh /></button>
                </div>

                <div style={{ padding: '32px' }}>
                    {loading ? (
                        <div className="loading-center"><div className="spinner" /></div>
                    ) : passes.length === 0 ? (
                        <div className="empty-state card" style={{ maxWidth: 500, margin: '0 auto' }}>
                            <div className="empty-icon">🎫</div>
                            <p style={{ fontSize: 16, marginBottom: 8 }}>No passes yet</p>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Your visitor pass will appear here once your appointment is approved and a pass is issued</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
                            {passes.map(pass => <PassCard key={pass._id} pass={pass} />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
