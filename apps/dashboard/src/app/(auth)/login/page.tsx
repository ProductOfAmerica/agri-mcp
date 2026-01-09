import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthPageLayout } from '@/components/auth/auth-page-layout';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your FieldMCP account to access your dashboard.',
};

export default function LoginPage() {
  return (
    <AuthPageLayout
      title="Welcome Back"
      description="Please enter your details to sign in"
      footer={
        <>
          New on our platform?{' '}
          <Link href="/signup" className="text-card-foreground hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthPageLayout>
  );
}
