import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function MessageList({ messages, emptyText = 'No messages yet. Say hello!' }) {
  const { user } = useAuth();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
