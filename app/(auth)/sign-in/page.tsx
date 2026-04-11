import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm mode="signin" />
    </Suspense>
  );
}
