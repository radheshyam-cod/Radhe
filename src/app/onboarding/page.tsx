'use client'

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [year, setYear] = useState("");
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (variables: { name: string; school: string; year: string }) => {
      const { error } = await apiFetch("/user/update", {
        method: "POST",
        body: JSON.stringify({
          name: variables.name,
          school: variables.school,
          year: Number.isNaN(Number(variables.year)) ? undefined : Number(variables.year),
        }),
      });
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      toast("Profile updated");
      router.push('/dashboard');
    },
    onError: (err: any) => {
      console.error(err);
      toast(err?.message || 'Failed to save profile');
    },
  });

  const handleOnboarding = () => {
    mutation.mutate({ name, school, year });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Welcome to ConceptPulse</CardTitle>
          <CardDescription>Please complete your profile to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="school">School/College</Label>
              <Input id="school" placeholder="Enter your school or college" value={school} onChange={(e) => setSchool(e.target.value)} />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="year">Class/Year</Label>
              <Input id="year" placeholder="Enter your class or year" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleOnboarding} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save and Continue'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
