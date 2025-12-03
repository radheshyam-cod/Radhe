'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";
import { queueAttemptForSync } from "@/lib/offline-queue";

export default function QuestionsPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <QuestionsContent />
    </React.Suspense>
  );
}

function QuestionsContent() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topicId');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['questions', topicId],
    queryFn: async () => {
      if (!topicId) return null;
      const { data, error } = await apiFetch<{ questions: any[] }>(`/ai/generate-questions?topicId=${topicId}`, {
        method: 'POST',
      });
      if (error) throw new Error(error);
      return data;
    },
    enabled: !!topicId,
  });

  const questions = data?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const attemptMutation = useMutation({
    mutationFn: async (variables: { isCorrect: boolean }) => {
      if (!topicId) return;

      // If offline, queue immediately
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await queueAttemptForSync({
          topicId: Number(topicId),
          questionId: currentQuestion?.id,
          isCorrect: variables.isCorrect,
        });
        return;
      }

      const { error } = await apiFetch('/attempts/log', {
        method: 'POST',
        body: JSON.stringify({
          topicId: Number(topicId),
          questionId: currentQuestion?.id,
          isCorrect: variables.isCorrect,
        }),
      });
      if (error) throw new Error(error);
    },
    onError: async (err: any) => {
      console.error(err);
      // Best-effort offline queue fallback
      if (typeof navigator !== 'undefined' && !navigator.onLine && topicId) {
        await queueAttemptForSync({
          topicId: Number(topicId),
          questionId: currentQuestion?.id,
          isCorrect: selectedAnswer === currentQuestion?.correctAnswer,
        } as any);
        toast('Attempt saved offline and will sync when you reconnect.');
      } else {
        toast(err?.message || 'Failed to record attempt.');
      }
    },
  });

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      toast('Quiz completed!');
    }
  };

  const handleSubmit = () => {
    if (!currentQuestion || !selectedAnswer) return;
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setShowExplanation(true);
    attemptMutation.mutate({ isCorrect });
  };

  if (!topicId) return <div className="p-8 text-white">Please select a topic to practice.</div>;
  if (isLoading) return <div className="p-8 text-white">Loading questions...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading questions</div>;
  if (questions.length === 0) return <div className="p-8 text-white">No questions found.</div>;

  return (
    <div className="min-h-screen bg-[#0d0f2b] p-8 flex items-center justify-center">
      <Card className="w-full max-w-2xl bg-[#121435] border-[#1d204d] text-slate-100">
        <CardHeader>
          <CardTitle className="text-[#7aa2ff]">Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg">{currentQuestion.question}</p>
          <RadioGroup value={selectedAnswer || ''} onValueChange={setSelectedAnswer}>
            {currentQuestion.options.map((option: string, index: number) => (
              <div
                key={index}
                className="flex items-center space-x-2 p-3 rounded-lg border border-[#1d204d] hover:bg-[#1d204d] transition-colors"
              >
                <RadioGroupItem
                  value={option}
                  id={`option-${index}`}
                  className="border-[#7aa2ff] text-[#7aa2ff]"
                />
                <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {showExplanation && (
            <div
              className={`p-4 rounded-lg ${
                selectedAnswer === currentQuestion.correctAnswer
                  ? 'bg-green-900/20 border-green-500/50'
                  : 'bg-red-900/20 border-red-500/50'
              } border`}
            >
              <p className="font-semibold mb-2">
                {selectedAnswer === currentQuestion.correctAnswer
                  ? 'Correct!'
                  : `Incorrect. The correct answer is ${currentQuestion.correctAnswer}.`}
              </p>
              <p className="text-sm text-slate-300">{currentQuestion.explanation}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          {!showExplanation ? (
            <Button
              onClick={handleSubmit}
              disabled={!selectedAnswer || attemptMutation.isPending}
              className="bg-[#7aa2ff] text-[#0d0f2b] hover:bg-[#8fb0ff]"
            >
              Submit Answer
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-[#7aa2ff] text-[#0d0f2b] hover:bg-[#8fb0ff]"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
