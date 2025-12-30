
"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, AlertCircle } from "lucide-react";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

useEffect(() => {
  const handleAuthCallback = async () => {
    // Check for hash parameters (token from email)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const tokenHash = hashParams.get('token_hash');
    const type = hashParams.get('type');
    
    if (tokenHash && type === 'invite') {
      // Verify the OTP token
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'invite',
      });
      
      if (error) {
        setError('This link is invalid or has expired. Please request a new one.');
      }
      setLoading(false);
      return;
    }
    
    // Check for access_token (alternative flow)
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    
    if (accessToken && type) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      
      if (error) {
        setError('This link is invalid or has expired. Please request a new one.');
      }
      setLoading(false);
      return;
    }
    
    // Check if there's already an existing session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setError('This link is invalid or has expired. Please request a new one.');
    }
    setLoading(false);
  };

  handleAuthCallback();
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== password2) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    // Password set successfully - redirect to dashboard
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Checking link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !password) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-900">Set Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <p className="text-slate-600">
              You can request a new link from your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Choose a Password</CardTitle>
          </div>
          <p className="text-slate-600">Set a secure password for your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password2">Confirm Password</Label>
              <Input
                id="password2"
                type="password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={6}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? 'Saving...' : 'Save Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}