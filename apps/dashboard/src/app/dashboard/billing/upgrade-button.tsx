'use client';

import { useState } from 'react';

export function UpgradeButton({ tier }: { tier: 'developer' | 'startup' }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);

    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
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
      onClick={handleUpgrade}
      disabled={loading}
      className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? 'Loading...' : 'Upgrade'}
    </button>
  );
}
