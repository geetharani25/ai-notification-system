import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AppShell from './components/layout/AppShell.jsx';
import ChatArea from './components/chat/ChatArea.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function ChannelRoute() {
  const { channels, users, markReadByContext } = useOutletContext();
  return <ChatArea channels={channels} users={users} markReadByContext={markReadByContext} />;
}

function DmRoute() {
  const { channels, users, markReadByContext } = useOutletContext();
  return <ChatArea channels={channels} users={users} markReadByContext={markReadByContext} />;
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center h-full text-gray-500">
      <div className="text-center">
        <p className="text-4xl mb-3">👋</p>
        <p className="text-lg font-medium text-gray-400">Welcome to NotifyAI</p>
        <p className="text-sm mt-1">Select a channel or DM to get started</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }>
              <Route index element={<EmptyState />} />
              <Route path="channel/:channelId" element={<ChannelRoute />} />
              <Route path="dm/:userId" element={<DmRoute />} />
            </Route>
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
