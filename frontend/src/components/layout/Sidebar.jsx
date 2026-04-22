import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePresence } from '../../hooks/usePresence.js';
import Avatar from '../ui/Avatar.jsx';
import http from '../../api/http.js';

function SidebarLink({ to, children, className = '' }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-1.5 rounded text-sm cursor-pointer transition-colors ${
          isActive ? 'bg-[#4a9eff] text-white font-medium' : 'text-gray-400 hover:text-white hover:bg-white/5'
        } ${className}`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Sidebar({ channels, users, onChannelCreated, unreadByTarget }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const onlineUsers = usePresence();
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    setCreating(true);
    try {
      const res = await http.post('/channels', { name: newChannelName.trim(), description: newChannelDesc.trim() || undefined });
      onChannelCreated(res.data);
      setNewChannelName('');
      setNewChannelDesc('');
      setShowCreateChannel(false);
      navigate(`/channel/${res.data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create channel');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-60 flex-shrink-0 bg-[#19191d] flex flex-col h-full border-r border-gray-700/30">
      {/* Workspace header */}
      <div className="px-4 py-3 border-b border-gray-700/30">
        <h1 className="text-white font-bold text-lg tracking-tight">NotifyAI</h1>
        <p className="text-gray-500 text-xs mt-0.5">AI-powered workspace</p>
      </div>

      <div className="flex-1 overflow-y-auto py-3 space-y-4">
        {/* Channels */}
        <div>
          <div className="flex items-center justify-between px-3 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Channels</span>
            <button
              onClick={() => setShowCreateChannel(v => !v)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              title="New channel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {showCreateChannel && (
            <form onSubmit={handleCreateChannel} className="px-3 mb-2 space-y-2">
              <input
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                placeholder="channel-name"
                className="w-full bg-[#2a2d31] text-white text-sm rounded px-2 py-1.5 border border-gray-600 focus:outline-none focus:border-blue-500 placeholder-gray-600"
              />
              <input
                value={newChannelDesc}
                onChange={e => setNewChannelDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-[#2a2d31] text-white text-sm rounded px-2 py-1.5 border border-gray-600 focus:outline-none focus:border-blue-500 placeholder-gray-600"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={creating} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded py-1.5 disabled:opacity-50">
                  {creating ? 'Creating…' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowCreateChannel(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded py-1.5">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-0.5">
            {channels.map(ch => (
              <SidebarLink key={ch.id} to={`/channel/${ch.id}`}>
                <span className="text-gray-400">#</span>
                <span>{ch.name}</span>
                {unreadByTarget?.[`ch-${ch.id}`] > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {unreadByTarget[`ch-${ch.id}`]}
                  </span>
                )}
              </SidebarLink>
            ))}
          </div>
        </div>

        {/* Direct Messages */}
        <div>
          <div className="px-3 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Direct Messages</span>
          </div>
          <div className="space-y-0.5">
            {users.filter(u => u.id !== user?.id).map(u => (
              <SidebarLink key={u.id} to={`/dm/${u.id}`}>
                <div className="relative flex-shrink-0">
                  <Avatar username={u.username} size="sm" />
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#19191d] ${onlineUsers.has(u.id) ? 'bg-green-500' : 'bg-gray-600'}`} />
                </div>
                <span>{u.username}</span>
                {unreadByTarget?.[`dm-${u.id}`] > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {unreadByTarget[`dm-${u.id}`]}
                  </span>
                )}
              </SidebarLink>
            ))}
          </div>
        </div>
      </div>

      {/* User footer */}
      <div className="border-t border-gray-700/30 px-3 py-3 flex items-center gap-2">
        <Avatar username={user?.username || ''} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{user?.username}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
