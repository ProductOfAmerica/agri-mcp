import { NextResponse } from 'next/server';
import { config, TIER_TO_PRICE } from '@/lib/config';
import { getStripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier } = body as { tier: 'developer' | 'startup' };

    const priceId = TIER_TO_PRICE[tier];
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('developer_id', user.id)
      .single();

    const stripe = getStripe();
    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          developer_id: user.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('developer_id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${config.appUrl}/dashboard/billing?success=true`,
      cancel_url: `${config.appUrl}/dashboard/billing?canceled=true`,
      metadata: {
        developer_id: user.id,
        tier,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 },
    );
  }
}
