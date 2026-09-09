import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function RegisterPortal() {
  const [email, setEmail] = useState('');
  const [profileId, setProfileId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Read URL query tokens safely using the standard browser Web API
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const emailToken = queryParams.get('email') || '';
    const idToken = queryParams.get('id') || '';

    setEmail(emailToken);
    setProfileId(idToken);
  }, []);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Client-side Validation Checks
    if (!password || !confirmPassword) {
      setMessage({ type: 'error', text: 'All credentials matrices must be populated.' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Security authentication keys do not match.' });
      return;
    }
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 tokens long.' });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!supabase) throw new Error('Supabase client node not correctly initialized.');

      // 1. Fire registration request to Supabase Auth microservice
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            profile_id: profileId // Embed references to link rows cleanly
          }
        }
      });

      if (authError) throw authError;

      if (!authData?.user) {
        throw new Error('Credential creation finished but failed to resolve valid user session.');
      }

      // 2. Clear out temp registration flags inside public database if profile ID is verified
      if (profileId) {
        const { error: dbUpdateError } = await supabase
          .from('profiles')
          .update({
            role: 'employee',
            updated_at: new Date().toISOString()
          })
          .eq('id', profileId);

        if (dbUpdateError) {
          console.error("Profiles sync structural failure:", dbUpdateError.message);
          // Don't halt the flow completely if auth succeeded, but let the dev know
        }
      }

      setMessage({ type: 'success', text: 'Account provisioned! Redirecting to internal employee node...' });
      
      // Route using window routing since this is a clean Vite framework
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);

    } catch (err) {
      console.error("Registration engine exception caught:", err);
      setMessage({ type: 'error', text: err.message || 'System pipe dropped request during execution loop.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#111827] border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
        
        <div className="text-center space-y-2">
          <h1 className="text-xl font-black uppercase tracking-wider text-orange-500">TOSBS ONBOARDING</h1>
          <h2 className="text-md font-bold text-white">Create Your Account</h2>
          <p className="text-xs text-slate-400">
            Welcome, <span className="text-slate-200 font-semibold">{email || 'Team Member'}</span>. Set up your access keys.
          </p>
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Work Identity Email</label>
            <input
              type="email" disabled value={email}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-800 bg-[#0B0F19]/50 text-slate-500 font-medium outline-none cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Choose Secure Password</label>
            <input
              type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-800 bg-[#0B0F19] text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confirm Password Sequence</label>
            <input
              type="password" required placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-800 bg-[#0B0F19] text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {message.text && (
            <div className={`text-[11px] font-medium p-3 rounded-xl border ${
              message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit" disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Provisioning Matrix Node...' : 'Create Account & Start Onboarding →'}
          </button>
        </form>
      </div>
    </div>
  );
}