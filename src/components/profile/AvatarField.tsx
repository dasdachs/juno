import { useState, type ChangeEvent } from 'react';
import { fileToAvatarDataUrl } from '../../lib/avatarImage';
import { Button, Icon } from '../ui';

interface AvatarFieldProps {
  avatarUrl: string;
  onChange: (avatarUrl: string) => void;
}

/** Picks a picture from this device and hands back an embedded data URL. */
export function AvatarField({ avatarUrl, onChange }: AvatarFieldProps) {
  const [error, setError] = useState('');

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    try {
      onChange(await fileToAvatarDataUrl(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not use that image');
    }
  };

  return (
    <div className="stack tight">
      <div className="avatar-actions">
        <label htmlFor="avatar-file" className="button border file-button">
          <Icon name="add_a_photo" />
          <span>Avatar</span>
          <input id="avatar-file" type="file" accept="image/*" onChange={handleFile} />
        </label>
        {avatarUrl && (
          <Button variant="text" onClick={() => onChange('')}>
            Remove
          </Button>
        )}
      </div>
      {error && <p className="error-text small-text">{error}</p>}
      <p className="supporting">
        Choose a picture from this device. It is shrunk and stored encrypted with your
        profile; nothing is uploaded.
      </p>
    </div>
  );
}
