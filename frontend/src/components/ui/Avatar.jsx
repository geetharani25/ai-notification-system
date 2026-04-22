const COLORS = [
  'bg-purple-600', 'bg-blue-600', 'bg-green-600', 'bg-yellow-600',
  'bg-red-600', 'bg-pink-600', 'bg-indigo-600', 'bg-teal-600',
];

export default function Avatar({ username = '?', size = 'md' }) {
  const index = (username.charCodeAt(0) || 0) % COLORS.length;
  const initials = username.slice(0, 2).toUpperCase();
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-sm';

  return (
    <div className={`${sizeClass} ${COLORS[index]} rounded-md flex items-center justify-center font-semibold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
}
