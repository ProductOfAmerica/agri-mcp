'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function SuccessRefresh() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');

  useEffect(() => {
    if (success === 'true') {
      const timeout = setTimeout(() => {
        router.replace('/dashboard/billing');
        router.refresh();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [success, router]);

  return null;
}
