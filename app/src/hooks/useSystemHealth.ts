import { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'error';
  uptime: number;
  timestamp: string;
  services: {
    database?: string;
    redis?: string;
    rpc?: string;
    buyback?: string;
  };
  errors: {
    last_hour: number;
    last_24h: number;
  };
  balances: {
    vault?: string;
    treasury?: string;
    vault_reserve?: string;
  };
  lastBuybackAt?: string | null;
  responseTime?: string;
}

export const useSystemHealth = (autoRefresh = true) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/health/system`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setHealth(data);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchHealth();

    // Setup auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return {
    health,
    loading,
    error,
    refresh: fetchHealth,
  };
};


