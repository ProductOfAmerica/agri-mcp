import { createClient } from '@/lib/supabase/server';
import { ManageButton } from './manage-button';
import { UpgradeButton } from './upgrade-button';

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('developer_id', user!.id)
    .single();

  const tier = subscription?.tier ?? 'free';
  const isPaid = tier !== 'free';
  const isCanceling = subscription?.cancel_at_period_end;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-gray-500 mb-1">Current Plan</div>
            <div className="text-2xl font-bold capitalize">
              {tier}
              {isCanceling && (
                <span className="ml-2 text-sm font-normal text-orange-600">
                  (Cancels at period end)
                </span>
              )}
            </div>
            <div className="text-gray-600 mt-1">
              {subscription?.monthly_request_limit?.toLocaleString() ?? 1000}{' '}
              requests/month
            </div>
            {isCanceling && subscription?.current_period_end && (
              <div className="text-orange-600 text-sm mt-1">
                Access until {new Date(subscription.current_period_end).toLocaleDateString()}
              </div>
            )}
          </div>
          {isPaid && <ManageButton />}
        </div>
      </div>

      {!isPaid && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="text-xl font-bold mb-2">Developer</div>
            <div className="text-3xl font-bold mb-4">
              $99<span className="text-lg text-gray-500">/mo</span>
            </div>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li>50,000 requests/month</li>
              <li>100 requests/minute</li>
              <li>Production API access</li>
              <li>Email support</li>
            </ul>
            <UpgradeButton tier="developer" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6 ring-2 ring-green-500">
            <div className="text-xl font-bold mb-2">Startup</div>
            <div className="text-3xl font-bold mb-4">
              $299<span className="text-lg text-gray-500">/mo</span>
            </div>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li>250,000 requests/month</li>
              <li>500 requests/minute</li>
              <li>Production API access</li>
              <li>Priority support</li>
            </ul>
            <UpgradeButton tier="startup" />
          </div>
        </div>
      )}
    </div>
  );
}
