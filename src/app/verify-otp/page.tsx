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
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { toast } from "@/components/ui/sonner";

export default function VerifyOtpPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <VerifyOtpContent />
    </React.Suspense>
  );
}

function VerifyOtpContent() {
  const [otp, setOtp] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");

  const mutation = useMutation({
    mutationFn: async (variables: { phone: string; otp: string }) => {
      const { data, error } = await apiFetch<{ token: string }>("/auth/verify-otp", {
        method: "POST",
        auth: false,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variables),
      });
      if (error || !data) throw new Error(error || "OTP verification failed");
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem("access_token", data.token);
      toast("Logged in successfully");
      router.push("/dashboard");
    },
    onError: (err: any) => {
      console.error(err);
      toast(err?.message || "Invalid OTP");
    },
  });

  const handleVerify = () => {
    if (!phone) {
      toast("Missing phone number in URL. Please restart login.");
      return;
    }
    mutation.mutate({ phone, otp });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Verify OTP</CardTitle>
          <CardDescription>Enter the OTP sent to your phone</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                placeholder="Enter your OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleVerify} disabled={mutation.isPending}>
            {mutation.isPending ? 'Verifying...' : 'Verify'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
