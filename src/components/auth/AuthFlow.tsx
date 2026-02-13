import { useCompositeAuth } from '../../contexts/CompositeAuthContext';
import { OAuthScreen } from './OAuthScreen';
import { UnlockScreen } from '../UnlockScreen';
import { OnboardingCheck } from '../OnboardingCheck';
import { Loading } from '../common/Loading';
import { Outlet } from 'react-router-dom';

export function AuthFlow() {
  const { flowState } = useCompositeAuth();

  switch (flowState) {
    case 'initializing':
      return <Loading />;

    case 'oauth_required':
      return <OAuthScreen />;

    case 'vault_locked':
      return <UnlockScreen />;

    case 'fully_authenticated':
      return (
        <OnboardingCheck>
          <Outlet />
        </OnboardingCheck>
      );
  }
}
