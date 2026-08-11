import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

export type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  avatarUrl?: string;
  name?: string;
  size?: AvatarSize;
}

const CONTAINER_SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
};

const TEXT_SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'text-xs',
  md: 'text-base',
  lg: 'text-2xl',
};

const ICON_SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
};

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function Avatar({ avatarUrl, name, size = 'md' }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  const containerClasses = `${CONTAINER_SIZE_CLASSES[size]} rounded-full flex items-center justify-center overflow-hidden shrink-0`;

  if (avatarUrl && !imageFailed) {
    return (
      <div className={`${containerClasses} bg-gray-100 dark:bg-gray-800`}>
        <img
          src={avatarUrl}
          alt={name ? `${name}'s avatar` : 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  const initials = name ? getInitials(name) : '';

  if (initials) {
    return (
      <div className={`${containerClasses} bg-rose-500 text-white font-medium ${TEXT_SIZE_CLASSES[size]}`}>
        {initials}
      </div>
    );
  }

  return (
    <div className={`${containerClasses} bg-rose-100 dark:bg-rose-950`}>
      <User className={`${ICON_SIZE_CLASSES[size]} text-rose-600 dark:text-rose-400`} />
    </div>
  );
}
