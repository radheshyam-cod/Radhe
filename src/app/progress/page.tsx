'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";

interface DashboardStats {
  weakTopics: { topic: string; score: number }[];
  masteredTopics: string[];
}

export default function ProgressPage() {
  const { data } = useQuery<DashboardStats | null>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data, error } = await apiFetch<DashboardStats>('/progress/stats');
      if (error) throw new Error(error);
      return data;
    },
  });

  const mastered = data?.masteredTopics || [];
  const weak = data?.weakTopics || [];

  return (
    <div className="min-h-screen bg-[#0d0f2b] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#7aa2ff]">Your Progress</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-[#121435] border-[#1d204d] text-slate-100">
            <CardHeader>
              <CardTitle className="text-green-400">Mastered Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {mastered.map((t, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    {t}
                  </li>
                ))}
                {mastered.length === 0 && <li className="text-slate-500">Keep studying to master topics!</li>}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-[#121435] border-[#1d204d] text-slate-100">
            <CardHeader>
              <CardTitle className="text-yellow-400">Focus Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {weak.map((t, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span>{t.topic}</span>
                    <span className="text-sm text-slate-400">{t.score}%</span>
                  </li>
                ))}
                {weak.length === 0 && <li className="text-slate-500">No weak spots detected yet.</li>}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
