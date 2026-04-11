import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm mode="signup" />
    </Suspense>
  );
}
