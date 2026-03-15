import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    MdDashboard, MdPeople, MdAssignment, MdQrCodeScanner,
    MdHistory, MdBarChart, MdPersonAdd, MdBadge,
    MdLogout, MdGroups, MdAdminPanelSettings
} from 'react-icons/md';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // user ke naam ka initials nikalo for avatar
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">🏢</div>
                <div>
                    <div className="logo-text">Visit<span>Pass</span></div>
                    <div style={{ fontSize: '10px', color: 'var(--txt-faint)', letterSpacing: '1px' }}>
                        MANAGEMENT SYSTEM
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {/* Admin nav links */}
                {user?.role === 'admin' && (
                    <>
                        <div className="nav-section-title">Overview</div>
                        <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon"><MdDashboard /></span>
                            Dashboard
                        </NavLink>
                        <NavLink to="/admin/reports" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon"><MdBarChart /></span>
                            Reports & Analytics
                        </NavLink>

                        <div className="nav-section-title">Management</div>
                        <NavLink to="/admin/users" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon"><MdAdminPanelSettings /></span>
                            User Management
                        </NavLink>
                        <NavLink to="/admin/visitors" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon"><MdGroups /></span>
                            Visitors
                        </NavLink>
                        <NavLink to="/admin/appointments" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon"><MdAssignment /></span>
                            Appointments
                        </NavLink>
                        <NavLink to="/admin/passes" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon"><MdBadge /></span>
                            Passes
                        </NavLink>

                        <div className="nav-section-title">Security</div>
                        <NavLink to="/security/checkin" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon"><MdQrCodeScanner /></span>
                            Check In/Out
                        </NavLink>
                        <NavLink to="/security/logs" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon"><MdHistory /></span>
                            Check Logs
                        </NavLink>
                    </>
                )}

                {/* Security nav */}
                {user?.role === 'security' && (
                    <>
                        <div className="nav-section-title">Security Desk</div>
                        <NavLink to="/security/checkin" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon"><MdQrCodeScanner /></span>
                            Scan & Check In
                        </NavLink>
                        <NavLink to="/security/logs" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon"><MdHistory /></span>
                            Activity Logs
                        </NavLink>
                    </>
                )}

                {/* Employee nav */}
                {user?.role === 'employee' && (
                    <>
                        <div className="nav-section-title">My Work</div>
                        <NavLink to="/employee/appointments" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon"><MdAssignment /></span>
                            My Appointments
                        </NavLink>
                        <NavLink to="/employee/invite" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon"><MdPersonAdd /></span>
                            Invite Visitor
                        </NavLink>
                    </>
                )}

                {/* Visitor nav */}
                {user?.role === 'visitor' && (
                    <>
                        <div className="nav-section-title">My Visit</div>
                        <NavLink to="/visitor/pass" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                            <span className="nav-icon"><MdBadge /></span>
                            My Pass
                        </NavLink>
                    </>
                )}
            </nav>

            {/* user info + logout button */}
            <div className="sidebar-footer">
                <div className="user-chip" onClick={handleLogout} title="Logout">
                    <div className="user-avatar">
                        {initials}
                    </div>
                    <div className="user-info">
                        <div className="user-name">{user?.name}</div>
                        <div className="user-role">{user?.role}</div>
                    </div>
                    <MdLogout style={{ color: 'var(--txt-faint)', fontSize: '18px', marginLeft: 'auto' }} />
                </div>
            </div>
        </aside>
    );
}
