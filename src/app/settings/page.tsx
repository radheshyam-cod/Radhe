'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      document.cookie = 'token=; Max-Age=0; path=/;';
    }
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#0d0f2b] p-8">
      <div className="max-w-xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#7aa2ff]">Settings</h1>

        <Card className="bg-[#121435] border-[#1d204d] text-slate-100">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Profile</span>
              <Button variant="outline" onClick={() => router.push('/onboarding')}>
                Edit Profile
              </Button>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-[#1d204d]">
              <span>Session</span>
              <Button variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
