-- Fix security issue: Restrict agent_executions SELECT policy to only allow users to view their own executions
-- This prevents agent creators from viewing sensitive user execution data including input_data and output_data

-- Drop the overly permissive policy that allows agent creators to view all executions
DROP POLICY IF EXISTS "Users can view own executions" ON public.agent_executions;

-- Create a new policy that ONLY allows users to view their own execution data
CREATE POLICY "Users can view own executions"
ON public.agent_executions
FOR SELECT
USING (user_id = auth.uid());