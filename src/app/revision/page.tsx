'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';
import { apiFetch } from "@/lib/api-client";

interface DashboardStats {
  upcomingRevisions: { topic: string; date: string; topicId: number }[];
}

export default function RevisionPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery<DashboardStats | null>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data, error } = await apiFetch<DashboardStats>('/progress/stats');
      if (error) throw new Error(error);
      return data;
    },
  });

  const revisions = data?.upcomingRevisions || [];

  if (isLoading) return <div className="p-8 text-white">Loading revisions...</div>;

  return (
    <div className="min-h-screen bg-[#0d0f2b] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#7aa2ff]">Spaced Repetition</h1>

        <div className="grid gap-6">
          {revisions.map((rev, i) => (
            <Card key={i} className="bg-[#121435] border-[#1d204d] text-slate-100 flex justify-between items-center p-4">
              <div>
                <CardTitle className="text-lg">{rev.topic}</CardTitle>
                <p className="text-sm text-slate-400">Due: {new Date(rev.date).toLocaleDateString()}</p>
              </div>
              <Button
                onClick={() => router.push(`/questions?topicId=${rev.topicId}`)}
                className="bg-[#7aa2ff] text-[#0d0f2b]"
              >
                Start Revision
              </Button>
            </Card>
          ))}
          {revisions.length === 0 && (
            <div className="text-center text-slate-400 py-12">
              No revisions due today. Great job!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
