import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtime(channel, table, event, callback) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    const subscription = supabase
      .channel(channel)
      .on(
        'postgres_changes',
        { event, schema: 'public', table },
        (payload) => {
          callbackRef.current(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [channel, table, event])
}
