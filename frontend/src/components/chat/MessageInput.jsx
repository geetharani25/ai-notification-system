import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext.jsx';

export default function MessageInput({ placeholder, onSend, targetId, chatType }) {
  const { socket } = useSocket();
  const [text, setText] = useState('');
  const typingTimer = useRef(null);
  const isTyping = useRef(false);

  const emitTyping = (typing) => {
    if (!socket) return;
    const event = typing ? 'typing_start' : 'typing_stop';
    socket.emit(event, { targetId, type: chatType });
    isTyping.current = typing;
  };

  const handleChange = (e) => {
    setText(e.target.value);
    if (!isTyping.current) emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!text.trim()) return;
      emitTyping(false);
      clearTimeout(typingTimer.current);
      onSend(text.trim());
      setText('');
    }
  };

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  return (
    <div className="px-4 pb-4">
      <div className="flex items-end gap-2 bg-[#2a2d31] rounded-lg border border-gray-700 focus-within:border-gray-500 transition-colors">
        <textarea
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-500 resize-none px-4 py-3 focus:outline-none max-h-40 overflow-y-auto"
          style={{ lineHeight: '1.5' }}
        />
        <button
          onClick={() => { if (!text.trim()) return; onSend(text.trim()); setText(''); }}
          className="mb-2 mr-2 p-1.5 rounded bg-[#4a9eff] hover:bg-[#3a8eef] disabled:opacity-40 transition-colors"
          disabled={!text.trim()}
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-gray-600 mt-1 ml-1">Enter to send · Shift+Enter for new line</p>
    </div>
  );
}
