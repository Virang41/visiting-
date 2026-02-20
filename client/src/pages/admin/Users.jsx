import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MdAdd, MdEdit, MdPersonOff, MdSearch } from 'react-icons/md';

const roles = ['admin', 'security', 'employee', 'visitor'];
const roleColors = { admin: 'badge-red', security: 'badge-yellow', employee: 'badge-blue', visitor: 'badge-green' };

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee', phone: '', department: '' });
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users', { params: { search, role: roleFilter } });
            setUsers(res.data.users); setTotal(res.data.total);
        } catch (err) { toast.error('Failed to load users'); }
    };

    useEffect(() => { fetchUsers(); }, [search, roleFilter]);

    const openCreate = () => { setEditUser(null); setForm({ name: '', email: '', password: '', role: 'employee', phone: '', department: '' }); setShowModal(true); };
    const openEdit = (u) => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '', department: u.department || '' }); setShowModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editUser) {
                const payload = { ...form }; if (!payload.password) delete payload.password;
                await api.put(`/users/${editUser._id}`, payload);
                toast.success('User updated');
            } else {
                await api.post('/users', form);
                toast.success('User created');
            }
            setShowModal(false); fetchUsers();
        } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
        finally { setLoading(false); }
    };

    const deactivate = async (id) => {
        if (!confirm('Deactivate this user?')) return;
        try { await api.delete(`/users/${id}`); toast.success('User deactivated'); fetchUsers(); }
        catch (err) { toast.error('Error'); }
    };

    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700 }}>👥 User <span style={{ color: 'var(--accent-primary)' }}>Management</span></h1>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{total} users total</p>
                    </div>
                    <button className="btn btn-primary" onClick={openCreate}><MdAdd /> Add User</button>
                </div>

                <div style={{ padding: '24px 32px' }}>
                    <div className="filter-bar">
                        <div className="search-input-wrap">
                            <MdSearch className="search-icon" />
                            <input className="form-input search-input" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <select className="form-select" style={{ width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                            <option value="">All Roles</option>
                            {roles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                        </select>
                    </div>

                    <div className="card" style={{ padding: 0 }}>
                        <div className="table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>User</th><th>Role</th><th>Department</th><th>Phone</th><th>Last Login</th><th>Status</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0
                                        ? <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon">👥</div><p>No users found</p></div></td></tr>
                                        : users.map(u => (
                                            <tr key={u._id}>
                                                <td>
                                                    <div className="visitor-cell">
                                                        <div className="visitor-avatar-sm">{u.name[0]}</div>
                                                        <div><div className="visitor-name">{u.name}</div><div className="visitor-email">{u.email}</div></div>
                                                    </div>
                                                </td>
                                                <td><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                                                <td style={{ color: 'var(--text-secondary)' }}>{u.department || '—'}</td>
                                                <td style={{ color: 'var(--text-secondary)' }}>{u.phone || '—'}</td>
                                                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}</td>
                                                <td><span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)} title="Edit"><MdEdit /></button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => deactivate(u._id)} title="Deactivate"><MdPersonOff /></button>
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

                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <h2 className="modal-title">{editUser ? '✏️ Edit User' : '➕ Create User'}</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Full Name *</label><input required className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                                    <div className="form-group"><label className="form-label">Email *</label><input required type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Password {editUser ? '(leave blank to keep)' : '*'}</label><input type="password" className="form-input" required={!editUser} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
                                    <div className="form-group"><label className="form-label">Role *</label>
                                        <select required className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                                            {roles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
                                    <div className="form-group"><label className="form-label">Department</label><input className="form-input" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} /></div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : editUser ? 'Update User' : 'Create User'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
