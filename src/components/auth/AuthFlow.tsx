import { useVault } from '../../contexts/VaultContext';
import { UnlockScreen } from '../UnlockScreen';
import { OnboardingCheck } from '../OnboardingCheck';
import { Loading } from '../common/Loading';
import { Outlet } from 'react-router-dom';

export function AuthFlow() {
  const { isLoading, isVaultUnlocked } = useVault();

  if (isLoading) {
    return <Loading />;
  }

  if (!isVaultUnlocked) {
    return <UnlockScreen />;
  }

  return (
    <OnboardingCheck>
      <Outlet />
    </OnboardingCheck>
  );
}
