'use client';

import { useState } from 'react';

export function ManageButton() {
  const [loading, setLoading] = useState(false);

  async function handleManage() {
    setLoading(true);

    const response = await fetch('/api/billing/portal', {
      method: 'POST',
    });

    const { url } = await response.json();

    if (url) {
      window.location.href = url;
    }

    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleManage}
      disabled={loading}
      className="text-green-600 hover:text-green-700 font-medium"
    >
      {loading ? 'Loading...' : 'Manage Subscription'}
    </button>
  );
}
