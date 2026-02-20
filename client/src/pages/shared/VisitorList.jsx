import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MdSearch } from 'react-icons/md';

export default function VisitorList() {
    const [visitors, setVisitors] = useState([]);
    const [search, setSearch] = useState('');
    const [total, setTotal] = useState(0);

    useEffect(() => {
        api.get('/visitors', { params: { search } }).then(r => { setVisitors(r.data.visitors); setTotal(r.data.total); }).catch(() => { });
    }, [search]);

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 50 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>👥 All <span style={{ color: 'var(--accent-primary)' }}>Visitors</span></h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{total} registered visitors</p>
                </div>
                <div style={{ padding: '24px 32px' }}>
                    <div className="filter-bar">
                        <div className="search-input-wrap"><MdSearch className="search-icon" /><input className="form-input search-input" placeholder="Search visitors..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    </div>
                    <div className="card" style={{ padding: 0 }}>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead><tr><th>Visitor</th><th>Phone</th><th>Company</th><th>ID Type</th><th>Visits</th><th>Registered</th></tr></thead>
                                <tbody>
                                    {visitors.length === 0
                                        ? <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">👥</div><p>No visitors found</p></div></td></tr>
                                        : visitors.map(v => (
                                            <tr key={v._id}>
                                                <td><div className="visitor-cell"><div className="visitor-avatar-sm">{v.photo ? <img src={`http://localhost:5000${v.photo}`} alt="" /> : v.name[0]}</div><div><div className="visitor-name">{v.name}</div><div className="visitor-email">{v.email}</div></div></div></td>
                                                <td style={{ color: 'var(--text-secondary)' }}>{v.phone}</td>
                                                <td style={{ color: 'var(--text-secondary)' }}>{v.company || '—'}</td>
                                                <td><span className="badge badge-purple">{v.idType}</span></td>
                                                <td><span className="badge badge-blue">{v.visitCount}</span></td>
                                                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(v.createdAt).toLocaleDateString('en-IN')}</td>
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
