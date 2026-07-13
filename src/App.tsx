import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Layouts & Guard
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Unauthorized } from './pages/Unauthorized';
import { NotFound } from './pages/NotFound';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { InventoryManagement } from './pages/admin/InventoryManagement';
import { ClientManagement } from './pages/admin/ClientManagement';
import { EmployeeManagement } from './pages/admin/EmployeeManagement';
import { RentalRequests } from './pages/admin/RentalRequests';
import { Payments } from './pages/admin/Payments';
import { Reports } from './pages/admin/Reports';
import { Settings } from './pages/admin/Settings';

// Employee Pages
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { AvailabilityTool } from './pages/employee/AvailabilityTool';
import { ReturnsCalendar } from './pages/employee/ReturnsCalendar';

// Client Pages
import { ClientDashboard } from './pages/client/ClientDashboard';
import { RentalCart } from './pages/client/RentalCart';

// Index Redirect Component
const IndexRedirect: React.FC = () => {
  const { isAuthenticated, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-brand-light-grey">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Navigate to={`/${role}/dashboard`} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Authenticated Dashboard Shell Layout */}
            <Route path="/" element={<DashboardLayout />}>
              {/* Index redirect handling routing on root */}
              <Route index element={<IndexRedirect />} />

              {/* Admin Portal Section */}
              <Route
                path="admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/inventory"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <InventoryManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/clients"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ClientManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/employees"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <EmployeeManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/rentals"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <RentalRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/payments"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Payments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/reports"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Employee Portal Section */}
              <Route
                path="employee/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employee/availability"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <AvailabilityTool />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employee/returns"
                element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <ReturnsCalendar />
                  </ProtectedRoute>
                }
              />

              {/* Client Portal Section */}
              <Route
                path="client/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="client/cart"
                element={
                  <ProtectedRoute allowedRoles={['client']}>
                    <RentalCart />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
