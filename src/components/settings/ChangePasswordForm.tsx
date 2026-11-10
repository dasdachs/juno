import { Button, TextField } from '../ui';
import { useChangePassword } from './useChangePassword';

export function ChangePasswordForm() {
  const form = useChangePassword();

  if (!form.isChangingPassword) {
    return (
      <div className="settings-block">
        <Button variant="text" icon="key" fullWidth onClick={() => form.setIsChangingPassword(true)}>
          Change Password
        </Button>
      </div>
    );
  }

  return (
    <div className="settings-block stack">
      <TextField
        type="password"
        label="Current password"
        value={form.currentPassword}
        onChange={form.setCurrentPassword}
      />
      <TextField
        type="password"
        label="New password (min 12 characters)"
        value={form.newPassword}
        onChange={form.setNewPassword}
      />
      <TextField
        type="password"
        label="Confirm new password"
        value={form.confirmPassword}
        onChange={form.setConfirmPassword}
      />
      {form.passwordError && <p className="small-text error-text">{form.passwordError}</p>}
      {form.passwordSuccess && <p className="small-text primary-text">Password changed successfully</p>}
      <div className="button-row">
        <Button variant="text" onClick={form.handleCancel}>
          Cancel
        </Button>
        <Button onClick={form.handlePasswordChange}>Save</Button>
      </div>
    </div>
  );
}
