import { useState, useEffect } from 'react';
import Avatar from '../ui/Avatar.jsx';
import UrgencyBadge from '../ui/UrgencyBadge.jsx';
import { useSocket } from '../../context/SocketContext.jsx';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function MessageBubble({ message, isOwn }) {
  const { socket } = useSocket();
  const [urgency, setUrgency] = useState(message.urgency);
  const [urgencyReason, setUrgencyReason] = useState(message.urgency_reason);

  useEffect(() => {
    if (!socket || message.type !== 'channel') return;
    const handler = ({ messageId, urgency: u, reason }) => {
      if (messageId === message.id) {
        setUrgency(u);
        setUrgencyReason(reason);
      }
    };
    socket.on('message_classified', handler);
    return () => socket.off('message_classified', handler);
  }, [socket, message.id, message.type]);

  const URGENCY_BG = { high: 'bg-red-950/30 border border-red-800/30', medium: 'bg-yellow-950/30 border border-yellow-800/30', low: '' };
  const containerClass = urgency ? URGENCY_BG[urgency] : '';

  return (
    <div className={`flex gap-3 px-4 py-2 hover:bg-white/[0.02] group rounded ${containerClass}`}>
      <Avatar username={message.sender_username} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-semibold text-sm ${isOwn ? 'text-blue-300' : 'text-white'}`}>
            {message.sender_username}
          </span>
          <span
            className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
            title={new Date(message.created_at).toLocaleString()}
          >
            {timeAgo(message.created_at)}
          </span>
          {urgency && <UrgencyBadge urgency={urgency} reason={urgencyReason} />}
        </div>
        <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
}
