import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/config/api';

export function useWrapped() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWrapped() {
      try {
        // apiRequest uses the API_ENDPOINTS which handles gateway routing implicitly.
        const data = await apiRequest(API_ENDPOINTS.DASHBOARD_WRAPPED);
        setData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching IdeaWrapped metrics", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchWrapped();
  }, []);

  return { data, isLoading, error };
}
