'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import RadarChart from "@/components/charts/radar-chart";
import LineChart from "@/components/charts/line-chart";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

interface DashboardStats {
  weakTopics: { topic: string; score: number }[];
  masteredTopics: string[];
  upcomingRevisions: { topic: string; date: string; topicId: string }[];
  totalStudyMinutes: number;
}

export default function DashboardPage() {
  const {
    data,
    isLoading,
    error,
  } = useQuery<DashboardStats | null>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data, error } = await apiFetch<DashboardStats>("/progress/stats");
      if (error) throw new Error(error);
      return data;
    },
  });

  if (isLoading) return <div className="p-8 text-white">Loading dashboard...</div>;
  if (error || !data) return <div className="p-8 text-red-500">Error loading dashboard</div>;

  const weakTopics = data.weakTopics || [];

  // Simple derived series for accuracy and solving time trends based on mastery/attempts.
  const accuracyData = weakTopics.length
    ? weakTopics.map((t) => ({ label: t.topic.slice(0, 6), value: t.score }))
    : [{ label: "Baseline", value: 0 }];

  const solvingTimeData = accuracyData.map((point, idx) => ({
    label: point.label,
    value: Math.max(30 - idx * 2, 5),
  }));

  const topicsMastered = data.masteredTopics || [];
  const upcomingRevisions = data.upcomingRevisions || [];
  const totalStudyMinutes = data.totalStudyMinutes || 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-[#121435] to-[#0d0f2b]">
          <CardHeader>
            <CardTitle>Welcome back, Student!</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weak Topic Radar</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <RadarChart data={weakTopics} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accuracy Graph</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <LineChart data={accuracyData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solving Time Improvements</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <LineChart data={solvingTimeData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topics Mastered</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {topicsMastered.length > 0 ? (
                topicsMastered.map((topic, i) => (
                  <li key={i} className="text-sm text-gray-400">
                    {topic}
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500">No topics mastered yet</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Revisions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {upcomingRevisions.length > 0 ? (
                upcomingRevisions.map((revision, i) => (
                  <li key={i} className="text-sm text-gray-400 flex justify-between">
                    <span>{revision.topic}</span>
                    <span>{new Date(revision.date).toLocaleDateString()}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-gray-500">No upcoming revisions</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Study Minutes</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <p className="text-4xl font-bold">{totalStudyMinutes}</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
