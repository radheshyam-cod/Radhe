'use client'

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@conceptpulse.edu")
  const [password, setPassword] = useState("admin123")
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: (variables: any) => {
      const formData = new URLSearchParams();
      formData.append('username', variables.email);
      formData.append('password', variables.password);

      return fetch("/api/auth/admin-login", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }).then(res => res.json());
    },
    onSuccess: (data) => {
      if (data.access_token) {
        // In a real app, you would store the token securely
        router.push('/admin')
      } else {
        console.error(data.detail)
      }
    }
  })

  const handleLogin = () => {
    mutation.mutate({ email, password })
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>ConceptPulse Admin Area</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="admin@conceptpulse.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleLogin} disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Logging in...' : 'Login'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
