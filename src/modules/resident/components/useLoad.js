import { useCallback, useEffect, useState } from 'react';
import { apiMessage } from '@/modules/resident/services/core/http';

export function useLoad(loader, deps = []) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await loader());
    } catch (err) {
      setError(apiMessage(err, 'Something went wrong'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  return { loading, error, data, reload, setData };
}
