import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthPageLayout } from '@/components/auth/auth-page-layout';
import { SignupForm } from '@/components/auth/signup-form';

export const metadata: Metadata = {
  title: 'Sign Up',
  description:
    'Create a FieldMCP account to start connecting your AI to agricultural data.',
};

export default function SignupPage() {
  return (
    <AuthPageLayout
      title="Create Account"
      description="Please enter your details to sign up"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-card-foreground hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthPageLayout>
  );
}
