import { cx } from './cx';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

export interface SnackbarProps {
  message: string;
  variant?: 'success' | 'error';
  onDismiss: () => void;
}

/** MD3 snackbar. Errors are announced assertively, everything else politely. */
export function Snackbar({ message, variant = 'success', onDismiss }: SnackbarProps) {
  const isError = variant === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={cx('snackbar active', isError && 'error')}
    >
      <Icon name={isError ? 'error' : 'check_circle'} />
      <div className="max">{message}</div>
      <IconButton icon="close" label="Dismiss notification" onClick={onDismiss} />
    </div>
  );
}
