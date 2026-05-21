-- Migration: Add updated_at to notifications table
-- This is necessary to satisfy the tr_notifications_updated_at trigger.

ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
