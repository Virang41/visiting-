import { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MdQrCodeScanner, MdCheckCircle, MdCancel, MdSearch } from 'react-icons/md';

export default function CheckIn() {
    const [passId, setPassId] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const inputRef = useRef();

    useEffect(() => { inputRef.current?.focus(); }, []);

    const handleScan = async (e) => {
        e.preventDefault();
        if (!passId.trim()) return toast.error('Enter a Pass ID or scan QR');
        setLoading(true);
        try {
            const parsed = tryParseQR(passId.trim());
            const res = await api.post('/checkins/scan', { passId: parsed, location: 'Main Entrance', method: 'manual' });
            setResult({ ...res.data, success: true });
            toast.success(`${res.data.type === 'check-in' ? '✅ Checked In' : '🚪 Checked Out'}: ${res.data.visitor?.name}`);
            setPassId('');
        } catch (err) {
            const msg = err.response?.data?.message || 'Scan failed';
            setResult({ success: false, message: msg });
            toast.error(msg);
        } finally { setLoading(false); }
    };

    const tryParseQR = (raw) => {
        try { const obj = JSON.parse(raw); return obj.passId || raw; }
        catch { return raw; }
    };

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 50 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 700 }}>🔍 QR Check-In / <span style={{ color: 'var(--accent-primary)' }}>Check-Out</span></h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Scan visitor QR pass or enter Pass ID manually</p>
                </div>

                <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>
                    {/* Scan Area */}
                    <div>
                        <div className="card">
                            <div className="card-title"><MdQrCodeScanner style={{ marginRight: 8, fontSize: 20 }} />Scan or Enter Pass ID</div>
                            <form onSubmit={handleScan}>
                                <div className="form-group">
                                    <label className="form-label">Pass ID / QR Code Data</label>
                                    <input
                                        ref={inputRef}
                                        className="form-input"
                                        placeholder="Scan QR or type Pass ID here..."
                                        value={passId}
                                        onChange={e => setPassId(e.target.value)}
                                        style={{ fontSize: 16, padding: '14px', fontFamily: 'JetBrains Mono, monospace' }}
                                    />
                                    <div className="form-hint">Point USB QR scanner at this field or type manually</div>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                                    {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Processing...</> : <><MdSearch /> Process Visitor</>}
                                </button>
                            </form>
                        </div>

                        <div className="card" style={{ marginTop: 16, background: 'rgba(108,99,255,0.05)', borderColor: 'rgba(108,99,255,0.2)' }}>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                <p style={{ fontWeight: 600, marginBottom: 8, color: 'var(--accent-primary)' }}>ℹ️ How it works</p>
                                <ul style={{ paddingLeft: 16, lineHeight: 1.8 }}>
                                    <li>Connect a USB QR scanner to the computer</li>
                                    <li>Visitor shows their pass QR code</li>
                                    <li>System auto-detects check-in or check-out</li>
                                    <li>First scan = check-in, second scan = check-out</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Result Panel */}
                    <div>
                        {result ? (
                            <div className="card" style={{ borderColor: result.success ? 'var(--accent-green)' : 'var(--accent-secondary)', background: result.success ? 'rgba(16,212,142,0.05)' : 'rgba(233,69,96,0.05)' }}>
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    {result.success
                                        ? <MdCheckCircle style={{ fontSize: 56, color: 'var(--accent-green)' }} />
                                        : <MdCancel style={{ fontSize: 56, color: 'var(--accent-secondary)' }} />
                                    }
                                    <h2 style={{ marginTop: 12, fontSize: 20, fontWeight: 700, color: result.success ? 'var(--accent-green)' : 'var(--accent-secondary)' }}>
                                        {result.success ? (result.type === 'check-in' ? '✅ Checked In!' : '🚪 Checked Out!') : 'Access Denied'}
                                    </h2>
                                    {result.success && result.visitor && (
                                        <div style={{ marginTop: 16 }}>
                                            <div className="visitor-avatar-sm" style={{ width: 56, height: 56, fontSize: 22, fontWeight: 700, margin: '0 auto 12px' }}>
                                                {result.visitor?.photo
                                                    ? <img src={`http://localhost:5000${result.visitor.photo}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                    : result.visitor?.name?.[0]
                                                }
                                            </div>
                                            <p style={{ fontWeight: 600, fontSize: 18 }}>{result.visitor.name}</p>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{result.visitor.email}</p>
                                            <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 13 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Time: </span>{new Date().toLocaleTimeString('en-IN')}
                                            </div>
                                        </div>
                                    )}
                                    {!result.success && <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>{result.message}</p>}
                                </div>
                                <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={() => setResult(null)}>
                                    Scan Next Visitor
                                </button>
                            </div>
                        ) : (
                            <div className="card" style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: 0.5 }}>
                                <MdQrCodeScanner style={{ fontSize: 64 }} />
                                <p style={{ fontSize: 15 }}>Waiting for scan...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
