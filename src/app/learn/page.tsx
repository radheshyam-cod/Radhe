'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useSearchParams } from 'next/navigation';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from "@/lib/api-client";

interface LearningContent {
  feynman: string;
  analogy: string;
  example: string;
  misconception: string;
}

function buildMindMapSvg(title: string): string {
  return `<svg width="400" height="200" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <style>
    .node { fill: #121435; stroke: #7aa2ff; stroke-width: 2; }
    .text { font-family: sans-serif; font-size: 12px; fill: #7aa2ff; text-anchor: middle; }
    .line { stroke: #1d204d; stroke-width: 1; }
  </style>
  <g>
    <rect x="150" y="80" width="100" height="40" rx="5" class="node"/>
    <text x="200" y="105" class="text">${title}</text>
  </g>
</svg>`;
}

function LearnPageContent() {
  const searchParams = useSearchParams();
  const noteId = searchParams.get('noteId');
  const topicId = searchParams.get('topicId');

  const { data, isLoading, error } = useQuery<LearningContent | null>({
    queryKey: ['learn', noteId, topicId],
    queryFn: async () => {
      const { data, error } = await apiFetch<{ content: LearningContent }>(
        '/ai/generate-learning',
        {
          method: 'POST',
          body: JSON.stringify({ noteId, topicId }),
        },
      );
      if (error) throw new Error(error);
      return data?.content ?? null;
    },
  });

  const name = 'Concept';
  const topic = data && {
    name,
    feynman: data.feynman,
    explanations: [data.example, data.misconception],
    analogies: [data.analogy],
    mindMap: buildMindMapSvg(name),
    solvedExample: data.example,
  };

  if (isLoading) return <div className="min-h-screen bg-background p-8 text-white">Loading learning content...</div>;
  if (error || !topic) return <div className="min-h-screen bg-background p-8 text-red-500">Failed to load learning content</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <motion.div
        className="max-w-4xl mx-auto space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-[#121435] to-[#0d0f2b]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Learn: {topic.name}</CardTitle>
          </CardHeader>
        </Card>

        <Tabs defaultValue="feynman" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-[#121435]">
            <TabsTrigger value="feynman">Feynman</TabsTrigger>
            <TabsTrigger value="explanations">Explanations</TabsTrigger>
            <TabsTrigger value="analogies">Analogies</TabsTrigger>
            <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
            <TabsTrigger value="example">Solved Example</TabsTrigger>
          </TabsList>

          <TabsContent value="feynman">
            <Card className="bg-[#121435] border-[#1d204d]">
              <CardHeader>
                <CardTitle>The Feynman Technique</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{topic.feynman}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="explanations">
            <Card className="bg-[#121435] border-[#1d204d]">
              <CardHeader>
                <CardTitle>Multiple Explanations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topic.explanations.map((exp: string, i: number) => (
                  <p key={i}>{exp}</p>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analogies">
            <Card className="bg-[#121435] border-[#1d204d]">
              <CardHeader>
                <CardTitle>Analogies &amp; Real Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topic.analogies.map((analogy: string, i: number) => (
                  <p key={i}>{analogy}</p>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mindmap">
            <Card className="bg-[#121435] border-[#1d204d]">
              <CardHeader>
                <CardTitle>Mind Map / Flowchart</CardTitle>
              </CardHeader>
              <CardContent dangerouslySetInnerHTML={{ __html: topic.mindMap }} />
            </Card>
          </TabsContent>

          <TabsContent value="example">
            <Card className="bg-[#121435] border-[#1d204d]">
              <CardHeader>
                <CardTitle>Step-by-step Solved Example</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{topic.solvedExample}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <LearnPageContent />
    </React.Suspense>
  );
}
