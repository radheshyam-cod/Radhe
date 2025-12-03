'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

interface TimetableSlot {
  time: string;
  topic: string;
  activity: string;
}

interface TimetableDay {
  day: string;
  date: string;
  slots: TimetableSlot[];
}

interface TimetableResponse {
  schedule: TimetableDay[];
}

export default function TimetablePage() {
  const { data, isLoading, error } = useQuery<TimetableResponse | null>({
    queryKey: ['timetable'],
    queryFn: async () => {
      const { data, error } = await apiFetch<TimetableResponse>('/timetable/generate', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (error) throw new Error(error);
      return data;
    },
  });

  const schedule = data?.schedule || [];

  return (
    <div className="min-h-screen bg-background p-8">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-[#121435] to-[#0d0f2b] mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Your Smart Timetable</CardTitle>
          </CardHeader>
        </Card>

        {isLoading && <div className="text-white">Generating your timetable...</div>}
        {error && !isLoading && <div className="text-red-500">Failed to load timetable</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {schedule.map((day) => (
            <Card key={day.date} className="bg-[#121435] border-[#1d204d]">
              <CardHeader>
                <CardTitle>
                  {day.day} • {new Date(day.date).toLocaleDateString()}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {day.slots.map((slot, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[#0d0f2b]">
                    <p className="font-bold text-[#7aa2ff]">{slot.time}</p>
                    <p>{slot.topic}</p>
                    <p className="text-sm text-gray-400">{slot.activity}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
