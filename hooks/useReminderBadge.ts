import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function useReminderBadge() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }
    const { count: n } = await supabase
      .from('reminders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_dismissed', false)
      .eq('is_sent', false);

    setCount(n ?? 0);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { count, refresh };
}
