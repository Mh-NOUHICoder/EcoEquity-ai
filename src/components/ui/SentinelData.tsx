"use client";

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function SentinelData() {
  const { state } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      setDebugInfo(null);

      try {
        const end = new Date();
        const start = new Date();
        start.setMonth(end.getMonth() - 1);
        const fmt = (d: Date) => d.toISOString().split('.')[0] + 'Z';

        const coords = state.userLocation || [52.5, 13.3]; // Default to Berlin if no location
        const [lat, lng] = coords;
        const bbox = `${lng - 0.1},${lat - 0.1},${lng + 0.1},${lat + 0.1}`;

        const body = {
          bbox,
          datetime: `${fmt(start)}/${fmt(end)}`,
          collections: 'sentinel-2-l2a',
          limit: 5,
        };
        console.log('[SentinelData] Fetching POST /api/sentinel/catalog');
        const res = await fetch('/api/sentinel/catalog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        console.log(`[SentinelData] Response status: ${res.status}`);

        if (!res.ok) {
          const text = await res.text();
          setDebugInfo(`HTTP ${res.status}\n${text}`);
          throw new Error(`Request failed with status ${res.status}`);
        }

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const json = await res.json();
          setData(json);
        } else {
          const text = await res.text();
          setDebugInfo(`HTTP ${res.status}\nNon-JSON response:\n${text}`);
          throw new Error("Received non-JSON response from API");
        }
      } catch (err) {
        console.error('[SentinelData] Error:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [state.userLocation]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 text-gray-300">
          <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-sm font-mono">Loading Sentinel Debug Data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-800 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Sentinel API Debugger</h2>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${error ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
          {error ? 'ERROR' : 'OK'}
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-950/30 border border-red-500/20 rounded text-red-300 text-xs font-mono">
          {error}
        </div>
      )}

      {debugInfo && (
        <div className="p-3 bg-gray-950 border border-gray-800 rounded">
          <p className="text-[10px] text-gray-500 uppercase mb-1">Raw Response</p>
          <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap break-all">
            {debugInfo}
          </pre>
        </div>
      )}

      {data && (
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 uppercase">Parsed JSON</p>
          <pre className="text-xs text-emerald-400/80 bg-black/40 p-3 rounded overflow-auto max-h-60 font-mono">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
