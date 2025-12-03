'use client';

import { useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiFetch } from '@/lib/api-client';
import { toast } from '@/components/ui/sonner';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  const handleSendOtp = async () => {
    if (!phone) {
      toast('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      toast('OTP sent successfully');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast(error?.message || 'Failed to send OTP. Please check the number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult) {
      toast('Please request an OTP first.');
      return;
    }
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();

      const { data, error } = await apiFetch<{ access_token: string; token_type: string }>(
        '/auth/login',
        {
          method: 'POST',
          auth: false,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token: idToken }),
        },
      );

      if (error || !data) {
        throw new Error(error || 'Login failed on server');
      }

      localStorage.setItem('access_token', data.access_token);
      toast('Logged in successfully');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast(error?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0f2b] p-4">
      <Card className="w-full max-w-md bg-[#121435] border-[#1d204d] text-slate-100">
        <CardHeader>
          <CardTitle className="text-[#7aa2ff]">Welcome to ConceptPulse</CardTitle>
          <CardDescription className="text-slate-400">Login with your phone number</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!confirmationResult ? (
            <>
              <Input
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-[#0d0f2b] border-[#1d204d] text-white"
              />
              <div id="recaptcha-container"></div>
              <Button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-[#7aa2ff] text-[#0d0f2b] hover:bg-[#8fb0ff]"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </>
          ) : (
            <>
              <Input
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="bg-[#0d0f2b] border-[#1d204d] text-white"
              />
              <Button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full bg-[#7aa2ff] text-[#0d0f2b] hover:bg-[#8fb0ff]"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </>
          )}

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#1d204d]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#121435] px-2 text-slate-400">Or continue with</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={async () => {
              setLoading(true);
              try {
                const { data, error } = await apiFetch<{ access_token: string }>('/auth/login-demo', {
                  method: 'POST',
                });
                if (error || !data) throw new Error(error || 'Demo login failed');

                localStorage.setItem('access_token', data.access_token);
                toast('Logged in as Demo User');
                router.push('/dashboard');
              } catch (err: any) {
                toast(err.message);
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full border-[#1d204d] text-slate-300 hover:bg-[#1d204d] hover:text-white"
          >
            Demo Login (Skip SMS)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
