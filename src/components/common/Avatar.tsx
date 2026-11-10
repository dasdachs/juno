import { useEffect, useState } from 'react';
import { AVATAR_DATA_URL_PATTERN } from '../../lib/payloadValidation';
import { Icon, cx } from '../ui';

export type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  avatarUrl?: string;
  name?: string;
  size?: AvatarSize;
}

const ICON_SIZE: Record<AvatarSize, 'small' | 'medium' | 'extra'> = {
  sm: 'small',
  md: 'medium',
  lg: 'extra',
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

  // Only an image embedded in the encrypted profile is ever rendered. A remote
  // URL would tell its server the user's IP and when they open the app.
  if (avatarUrl && AVATAR_DATA_URL_PATTERN.test(avatarUrl) && !imageFailed) {
    return (
      <div className={cx('avatar', size)}>
        <img
          src={avatarUrl}
          alt={name ? `${name}'s avatar` : 'Avatar'}
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  const initials = name ? getInitials(name) : '';

  if (initials) {
    return <div className={cx('avatar initials', size)}>{initials}</div>;
  }

  return (
    <div className={cx('avatar placeholder', size)}>
      <Icon name="person" size={ICON_SIZE[size]} />
    </div>
  );
}
