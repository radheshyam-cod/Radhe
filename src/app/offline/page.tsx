'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getQueuedAttempts, clearQueuedAttempts } from "@/lib/offline-queue";
import { apiFetch } from "@/lib/api-client";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const refreshQueue = async () => {
      const items = await getQueuedAttempts();
      setQueuedCount(items.length);
    };

    refreshQueue();

    const handleOnline = () => {
      setIsOnline(true);
      refreshQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSyncNow = async () => {
    const attempts = await getQueuedAttempts();
    if (!attempts.length) return;

    const { error } = await apiFetch('/offline/sync', {
      method: 'POST',
      body: JSON.stringify({ attempts }),
    });
    if (!error) {
      await clearQueuedAttempts();
      setQueuedCount(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f2b] p-8 flex items-center justify-center">
      <Card className="w-full max-w-md bg-[#121435] border-[#1d204d] text-slate-100">
        <CardHeader>
          <CardTitle className="text-[#7aa2ff]">Offline Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`p-4 rounded-lg text-center ${
              isOnline ? 'bg-green-900/20 text-green-400' : 'bg-yellow-900/20 text-yellow-400'
            }`}
          >
            {isOnline ? 'You are Online' : 'You are Offline'}
          </div>
          <p className="text-slate-300 text-center">
            Your recent notes and questions are available offline. Progress will sync when you
            reconnect.
          </p>

          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p>Queued attempts waiting to sync: {queuedCount}</p>
            <Button onClick={handleSyncNow} disabled={!queuedCount || !isOnline} className="w-full">
              Sync now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
