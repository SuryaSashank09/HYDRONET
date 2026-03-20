import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

/**
 * useApi — generic data fetching hook
 * Usage: const { data, loading, error, refetch } = useApi('/structures');
 */
export function useApi(url, params = {}, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url, { params });
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch, ...deps]);

  return { data, loading, error, refetch: fetch };
}

/**
 * useMutation — for POST/PUT/PATCH/DELETE operations
 * Usage: const { mutate, loading, error } = useMutation('post', '/reports');
 */
export function useMutation(method, url) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const mutate = useCallback(async (body, extraUrl = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api[method](`${url}${extraUrl}`, body);
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Request failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [method, url]);

  return { mutate, loading, error };
}
