import { useState } from 'react';
import { changePassword } from '../../lib/crypto';
import { checkPasswordStrength } from '../../lib/passwordPolicy';

/** State and submit logic for the change-password form. */
export function useChangePassword() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    // Same strength bar as vault creation
    const strengthError = checkPasswordStrength(newPassword);
    if (strengthError) {
      setPasswordError(strengthError);
      return;
    }

    let success: boolean;
    try {
      success = await changePassword(currentPassword, newPassword);
    } catch {
      setPasswordError('Could not change the password. Nothing was changed; please try again.');
      return;
    }
    if (success) {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } else {
      setPasswordError('Current password is incorrect');
    }
  };

  const handleCancel = () => {
    setIsChangingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  return {
    isChangingPassword,
    setIsChangingPassword,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    passwordError,
    passwordSuccess,
    handlePasswordChange,
    handleCancel,
  };
}
