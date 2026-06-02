import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ChatProvider } from './context/ChatContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import UserList from './pages/UserList';
import UserRegistration from './pages/UserRegistration';
import CandidateList from './pages/CandidateList';
import CandidateForm from './pages/CandidateForm';
import InterviewCalendar from './pages/InterviewCalendar';
import OfferForm from './pages/OfferForm';
import AttendanceList from './pages/AttendanceList';
import LeaveList from './pages/LeaveList';
import PayrollList from './pages/PayrollList';
import JobList from './pages/JobList';
import JobForm from './pages/JobForm';
import OfferList from './pages/OfferList';
import ImportExport from './pages/ImportExport';
import Settings from './pages/Settings';
import OperationDesk from './pages/OperationDesk';
import TaskList from './pages/TaskList';
import CallHistory from './pages/CallHistory';
import FileManager from './pages/FileManager';
import NotificationList from './pages/NotificationList';
import BirthdayModule from './pages/BirthdayModule';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layout/MainLayout';
import ChatWidget from './components/Chat/ChatWidget';
import RolePermissions from './pages/RolePermissions';
import CompanyDetail from './pages/CompanyDetail';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ChatProvider>
          <Router>
            <ChatWidget />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route element={<MainLayout />}>
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/birthdays"
                  element={
                    <ProtectedRoute>
                      <BirthdayModule />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute requiredModule="users">
                      <UserList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users/register"
                  element={
                    <ProtectedRoute requiredModule="users">
                      <UserRegistration />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users/edit/:id"
                  element={
                    <ProtectedRoute requiredModule="users">
                      <UserRegistration />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/candidates"
                  element={
                    <ProtectedRoute requiredModule="candidates">
                      <CandidateList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/interviews/calendar"
                  element={
                    <ProtectedRoute requiredModule="candidates">
                      <InterviewCalendar />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/candidates/new"
                  element={
                    <ProtectedRoute requiredModule="candidates">
                      <CandidateForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/candidates/edit/:id"
                  element={
                    <ProtectedRoute requiredModule="candidates">
                      <CandidateForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/jobs"
                  element={
                    <ProtectedRoute requiredModule="jobs">
                      <JobList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/jobs/new"
                  element={
                    <ProtectedRoute requiredModule="jobs">
                      <JobForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/jobs/edit/:id"
                  element={
                    <ProtectedRoute requiredModule="jobs">
                      <JobForm />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/offers"
                  element={
                    <ProtectedRoute requiredModule="offers">
                      <OfferList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/operations"
                  element={
                    <ProtectedRoute requiredModule="operations">
                      <OperationDesk />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <ProtectedRoute requiredModule="tasks">
                      <TaskList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/call-history"
                  element={
                    <ProtectedRoute requiredModule="callHistory">
                      <CallHistory />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/offers/new"
                  element={
                    <ProtectedRoute requiredModule="offers">
                      <OfferForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/offers/edit/:id"
                  element={
                    <ProtectedRoute requiredModule="offers">
                      <OfferForm />
                    </ProtectedRoute>
                  }
                />

                {/* HRMS User Management Sub-routes */}
                <Route
                  path="/attendance"
                  element={
                    <ProtectedRoute requiredModule="attendance">
                      <AttendanceList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/leaves"
                  element={
                    <ProtectedRoute requiredModule="leaves">
                      <LeaveList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payroll"
                  element={
                    <ProtectedRoute requiredModule="payroll">
                      <PayrollList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/import-export"
                  element={
                    <ProtectedRoute requiredModule="importExport">
                      <ImportExport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute requiredModule="settings">
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/roles"
                  element={
                    <ProtectedRoute requiredModule="roles">
                      <RolePermissions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/file-manager"
                  element={
                    <ProtectedRoute>
                      <FileManager />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/:companyName"
                  element={
                    <ProtectedRoute>
                      <CompanyDetail />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </ChatProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
