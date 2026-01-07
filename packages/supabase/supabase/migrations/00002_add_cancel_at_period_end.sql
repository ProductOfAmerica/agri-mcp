-- Add cancel_at_period_end to track pending cancellations
ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;
