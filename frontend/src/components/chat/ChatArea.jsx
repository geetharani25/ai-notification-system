import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import http from '../../api/http.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';

export default function ChatArea({ channels, users, markReadByContext }) {
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const { channelId, userId } = useParams();
  const isChannel = !!channelId;
  const targetId = isChannel ? Number(channelId) : Number(userId);

  const [messages, setMessages] = useState([]);
  const [header, setHeader] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);

  // Derive header label
  useEffect(() => {
    if (isChannel) {
      const ch = channels.find(c => c.id === targetId);
      setHeader(ch ? `# ${ch.name}` : '#channel');
    } else {
      const u = users.find(u => u.id === targetId);
      setHeader(u ? `@ ${u.username}` : '@user');
    }
  }, [isChannel, targetId, channels, users]);

  // Load history and mark related notifications as read
  useEffect(() => {
    setMessages([]);
    const url = isChannel ? `/messages/channel/${targetId}` : `/messages/dm/${targetId}`;
    http.get(url).then(res => setMessages(res.data)).catch(() => {});
    if (markReadByContext) {
      markReadByContext(isChannel ? 'channel' : 'dm', targetId);
    }
  }, [isChannel, targetId]);

  // Join channel room — wait for authentication before emitting
  useEffect(() => {
    if (!socket || !connected || !isChannel) return;
    socket.emit('join_channel', { channelId: targetId });
    return () => socket.emit('leave_channel', { channelId: targetId });
  }, [socket, connected, isChannel, targetId]);

  // Real-time messages
  useEffect(() => {
    if (!socket) return;

    const handleDM = ({ message }) => {
      if (!isChannel && (message.sender_id === targetId || message.receiver_id === targetId)) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleChannel = ({ message }) => {
      if (isChannel && message.channel_id === targetId) {
        setMessages(prev => [...prev, message]);
      }
    };

    socket.on('new_dm', handleDM);
    socket.on('new_channel_message', handleChannel);

    return () => {
      socket.off('new_dm', handleDM);
      socket.off('new_channel_message', handleChannel);
    };
  }, [socket, isChannel, targetId]);

  // Typing indicators
  useEffect(() => {
    if (!socket) return;
    const handler = ({ userId: uid, username, targetId: tid, type, isTyping }) => {
      const matches = isChannel
        ? type === 'channel' && tid === targetId
        : type === 'dm' && tid === user?.id;
      if (!matches) return;
      setTypingUsers(prev =>
        isTyping ? [...prev.filter(u => u.id !== uid), { id: uid, username }]
                 : prev.filter(u => u.id !== uid)
      );
    };
    socket.on('typing_indicator', handler);
    return () => socket.off('typing_indicator', handler);
  }, [socket, isChannel, targetId, user?.id]);

  const handleSend = useCallback((content) => {
    if (!socket) return;
    if (isChannel) {
      socket.emit('send_channel_message', { channelId: targetId, content });
    } else {
      socket.emit('send_dm', { receiverId: targetId, content });
    }
  }, [socket, isChannel, targetId]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center px-6 py-3 border-b border-gray-700/50 bg-[#1e2124]">
        <div>
          <h2 className="font-semibold text-white">{header}</h2>
          {isChannel && (
            <p className="text-xs text-gray-500">AI urgency classification active for broadcasts</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        emptyText={isChannel ? 'No messages in this channel yet.' : 'No messages yet. Start the conversation!'}
      />

      {/* Typing indicator */}
      <div className="px-4 h-5">
        {typingUsers.length > 0 && (
          <p className="text-xs text-gray-400 italic">
            {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
          </p>
        )}
      </div>

      <MessageInput
        placeholder={isChannel ? `Message #${header.replace('# ', '')}` : `Message ${header.replace('@ ', '@')}`}
        onSend={handleSend}
        targetId={targetId}
        chatType={isChannel ? 'channel' : 'dm'}
      />
    </div>
  );
}
