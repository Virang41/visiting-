import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import InviteVisitor from './pages/employee/InviteVisitor';
import MyAppointments from './pages/employee/MyAppointments';
import CheckIn from './pages/security/CheckIn';
import CheckLog from './pages/security/CheckLog';
import PreRegister from './pages/visitor/PreRegister';
import MyPass from './pages/visitor/MyPass';
import VisitorList from './pages/shared/VisitorList';
import AppointmentList from './pages/shared/AppointmentList';
import PassList from './pages/shared/PassList';

// agar user logged in nahi hai toh login pe bhejo
// agar role match nahi karta toh uski default page pe bhejo
function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-center" style={{ minHeight: '100vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // check karo ki user ka role allowed hai ya nahi
    if (roles && !roles.includes(user.role)) {
        // redirect to their proper page
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (user.role === 'security') return <Navigate to="/security/checkin" replace />;
        if (user.role === 'employee') return <Navigate to="/employee/appointments" replace />;
        if (user.role === 'visitor') return <Navigate to="/visitor/pass" replace />;
        return <Navigate to="/login" replace />;
    }

    return children;
}

// root path pe aaye toh role ke hisab se redirect karo
function HomeRedirect() {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'security') return <Navigate to="/security/checkin" replace />;
    if (user.role === 'employee') return <Navigate to="/employee/appointments" replace />;
    if (user.role === 'visitor') return <Navigate to="/visitor/pass" replace />;
    return <Navigate to="/login" replace />;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomeRedirect />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/pre-register" element={<PreRegister />} />

                {/* Admin pages */}
                <Route path="/admin/dashboard" element={
                    <ProtectedRoute roles={['admin']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                    <ProtectedRoute roles={['admin']}>
                        <AdminUsers />
                    </ProtectedRoute>
                } />
                <Route path="/admin/reports" element={
                    <ProtectedRoute roles={['admin']}>
                        <AdminReports />
                    </ProtectedRoute>
                } />
                <Route path="/admin/visitors" element={
                    <ProtectedRoute roles={['admin']}>
                        <VisitorList />
                    </ProtectedRoute>
                } />
                <Route path="/admin/appointments" element={
                    <ProtectedRoute roles={['admin']}>
                        <AppointmentList />
                    </ProtectedRoute>
                } />
                <Route path="/admin/passes" element={
                    <ProtectedRoute roles={['admin']}>
                        <PassList />
                    </ProtectedRoute>
                } />

                {/* Security pages */}
                <Route path="/security/checkin" element={
                    <ProtectedRoute roles={['security', 'admin']}>
                        <CheckIn />
                    </ProtectedRoute>
                } />
                <Route path="/security/logs" element={
                    <ProtectedRoute roles={['security', 'admin']}>
                        <CheckLog />
                    </ProtectedRoute>
                } />

                {/* Employee pages */}
                <Route path="/employee/invite" element={
                    <ProtectedRoute roles={['employee', 'admin']}>
                        <InviteVisitor />
                    </ProtectedRoute>
                } />
                <Route path="/employee/appointments" element={
                    <ProtectedRoute roles={['employee', 'admin']}>
                        <MyAppointments />
                    </ProtectedRoute>
                } />

                {/* Visitor pages */}
                <Route path="/visitor/pass" element={
                    <ProtectedRoute roles={['visitor']}>
                        <MyPass />
                    </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
