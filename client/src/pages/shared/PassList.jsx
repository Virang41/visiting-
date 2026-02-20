import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MdDownload, MdBlockFlipped, MdSearch } from 'react-icons/md';

const statusBadge = (s) => {
    const map = { active: 'green', used: 'yellow', expired: 'red', revoked: 'gray' };
    return <span className={`badge badge-${map[s] || 'gray'}`}>{s}</span>;
};

export default function PassList() {
    const [passes, setPasses] = useState([]);
    const [total, setTotal] = useState(0);
    const [status, setStatus] = useState('');

    useEffect(() => {
        api.get('/passes', { params: { status } }).then(r => { setPasses(r.data.passes); setTotal(r.data.total); }).catch(() => { });
    }, [status]);

    const revoke = async (id) => {
        if (!confirm('Revoke this pass?')) return;
        try { await api.put(`/passes/${id}/revoke`); toast.success('Pass revoked'); setPasses(p => p.map(pass => pass._id === id ? { ...pass, status: 'revoked' } : pass)); }
        catch (err) { toast.error('Error'); }
    };

    const downloadPDF = async (pass) => {
        try {
            const res = await api.get(`/passes/${pass._id}/pdf`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const a = document.createElement('a'); a.href = url; a.download = `pass-${pass.passId?.slice(0, 8)}.pdf`; a.click();
        } catch (err) { toast.error('Download failed'); }
    };

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 50 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>🎫 All <span style={{ color: 'var(--accent-primary)' }}>Passes</span></h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{total} passes issued</p>
                </div>
                <div style={{ padding: '24px 32px' }}>
                    <div className="filter-bar">
                        <select className="form-select" style={{ width: 180 }} value={status} onChange={e => setStatus(e.target.value)}>
                            <option value="">All Status</option>
                            {['active', 'used', 'expired', 'revoked'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                    </div>
                    <div className="card" style={{ padding: 0 }}>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead><tr><th>Visitor</th><th>Host</th><th>Valid From</th><th>Valid To</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {passes.length === 0
                                        ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">🎫</div><p>No passes found</p></div></td></tr>
                                        : passes.map(p => (
                                            <tr key={p._id}>
                                                <td><div className="visitor-cell"><div className="visitor-avatar-sm">{p.visitor?.photo ? <img src={`http://localhost:5000${p.visitor.photo}`} alt="" /> : p.visitor?.name?.[0]}</div><div><div className="visitor-name">{p.visitor?.name}</div><div className="visitor-email">{p.visitor?.email}</div></div></div></td>
                                                <td><div style={{ fontWeight: 500 }}>{p.host?.name}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.host?.department}</div></td>
                                                <td style={{ fontSize: 13 }}>{new Date(p.validFrom).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                                <td style={{ fontSize: 13 }}>{new Date(p.validTo).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                                <td>{statusBadge(p.status)}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button className="btn btn-outline btn-sm" onClick={() => downloadPDF(p)} title="Download PDF"><MdDownload /></button>
                                                        {p.status === 'active' && <button className="btn btn-danger btn-sm" onClick={() => revoke(p._id)} title="Revoke Pass"><MdBlockFlipped /></button>}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
