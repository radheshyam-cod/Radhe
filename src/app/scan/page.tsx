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

export default function ScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data, error } = await apiFetch<any>('/notes/scan', {
        method: 'POST',
        body: formData,
      });
      if (error || !data) {
        throw new Error(error || 'Failed to scan note');
      }
      return data;
    },
    onSuccess: (data: any) => {
      toast('Note scanned successfully');
      router.push(`/learn?noteId=${data.id}`);
    },
    onError: (err: any) => {
      console.error(err);
      toast(err?.message || 'Failed to scan note');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleScan = () => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      mutation.mutate(formData);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[450px]">
        <CardHeader>
          <CardTitle>Note Scanner</CardTitle>
          <CardDescription>Upload your handwritten notes or PDFs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="notes">Upload File</Label>
              <Input id="notes" type="file" onChange={handleFileChange} />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleScan} disabled={!file || mutation.isPending}>
            {mutation.isPending ? 'Scanning...' : 'Scan and Analyze'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
