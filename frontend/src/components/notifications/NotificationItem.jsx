import { useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar.jsx';
import UrgencyBadge from '../ui/UrgencyBadge.jsx';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const URGENCY_BORDER = {
  high:   'border-l-4 border-l-red-500',
  medium: 'border-l-4 border-l-yellow-500',
  low:    'border-l-4 border-l-green-500',
};

export default function NotificationItem({ notification, onRead }) {
  const navigate = useNavigate();

  const handleClick = () => {
    onRead(notification.id);
    if (notification.message_type === 'channel') {
      navigate(`/channel/${notification.channel_id}`);
    } else {
      navigate(`/dm/${notification.sender_id}`);
    }
  };

  const borderClass = URGENCY_BORDER[notification.urgency] || '';
  const unreadClass = !notification.is_read ? 'bg-white/5' : '';

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-white/5 transition-colors ${borderClass} ${unreadClass}`}
    >
      <Avatar username={notification.sender_username} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-sm ${!notification.is_read ? 'font-semibold text-white' : 'text-gray-300'}`}>
            {notification.sender_username}
          </span>
          {notification.urgency && (
            <UrgencyBadge urgency={notification.urgency} reason={notification.urgency_reason} />
          )}
          {!notification.is_read && (
            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-auto" />
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">
          {notification.message_type === 'channel' ? '#channel · ' : 'DM · '}
          {notification.content}
        </p>
        <span className="text-xs text-gray-500">{timeAgo(notification.created_at)}</span>
      </div>
    </button>
  );
}
