import { IconButton, TextField } from '../ui';
import { PasswordStrength } from './PasswordStrength';
import type { PasswordFields } from './usePasswordFields';

interface PasswordInputsProps {
  fields: PasswordFields;
  hasVault: boolean;
}

/** Password field with reveal toggle; adds strength meter and confirmation when creating. */
export function PasswordInputs({ fields, hasVault }: PasswordInputsProps) {
  const { password, setPassword, confirmPassword, setConfirmPassword, showPassword, setShowPassword } = fields;

  return (
    <>
      <TextField
        id="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={setPassword}
        placeholder={hasVault ? 'Enter password' : 'Create a strong password'}
        autoFocus
        required
        trailing={
          <IconButton
            icon={showPassword ? 'visibility_off' : 'visibility'}
            label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(!showPassword)}
          />
        }
      />

      {!hasVault && (
        <>
          <PasswordStrength password={password} />
          <TextField
            id="confirm"
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirm your password"
            required
          />
        </>
      )}
    </>
  );
}
