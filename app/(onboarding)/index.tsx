import { Redirect } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';

export default function OnboardingIndex() {
  const { profile } = useAuth();
  if (!profile) {
    return <Redirect href="/(onboarding)/profile" />;
  }
  if (!profile.vehicle) {
    return <Redirect href="/(onboarding)/vehicle" />;
  }
  return <Redirect href="/(onboarding)/status" />;
}
