import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Key, 
  ArrowRight, 
  Sparkles, 
  UserCheck, 
  School as SchoolIcon, 
  Server, 
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  Terminal,
  Eye,
  EyeOff,
  UserPlus,
  Phone,
  Clock,
  RotateCcw,
  Database,
  Trash2,
  FileCheck,
  Check,
  KeyRound,
  Fingerprint
} from 'lucide-react';
import type { User, School } from '../types.ts';

interface LoginViewProps {
  onLoginSuccess: (user: User, token: string, school: School) => void;
  schoolInfo?: School | null;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, schoolInfo }) => {
  const [authMode, setAuthMode] = useState<'password' | 'otp' | 'register'>('password');
  
  // Password Mode State
  const [email, setEmail] = useState('admin.tech@jnvburhanpur.edu.in');
  const [password, setPassword] = useState('Navodaya@Admin2026');
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState('');
  
  // OTP Mode State
  const [otpRecipient, setOtpRecipient] = useState('admin.tech@jnvburhanpur.edu.in');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpPreviewCode, setOtpPreviewCode] = useState<string | null>(null);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string | null>(null);
  
  // Registration State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'school_admin' | 'teacher'>('teacher');
  const [regPhone, setRegPhone] = useState('');

  // General State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSampleDataModal, setShowSampleDataModal] = useState(false);
  const [cleanWipeSuccess, setCleanWipeSuccess] = useState<string | null>(null);

  // OTP inputs ref for auto-focus
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Standard Password / PIN Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      localStorage.setItem('crlk_auth_token', data.token);
      localStorage.setItem('crlk_auth_user', JSON.stringify(data.user));

      onLoginSuccess(data.user, data.token, data.school);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setOtpSuccessMsg(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: otpRecipient, purpose: 'login' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }

      setOtpStep('verify');
      setOtpCountdown(60);
      setOtpPreviewCode(data.previewCode);
      setOtpSuccessMsg(`6-Digit OTP code sent to ${data.recipient}`);
      
      // Auto focus first digit input
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 4) {
      setErrorMsg('Please enter the full 6-digit code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: otpRecipient, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired code.');
      }

      localStorage.setItem('crlk_auth_token', data.token);
      localStorage.setItem('crlk_auth_user', JSON.stringify(data.user));

      onLoginSuccess(data.user, data.token, data.school);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Digit Keying & Backspace
  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // Handle paste
      const pastedChars = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedChars[i] || '';
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pastedChars.length, 5);
      digitInputRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    if (cleaned && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  // Fill quick test OTP code
  const fillTestOtp = (code: string) => {
    const chars = code.slice(0, 6).split('');
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = chars[i] || '';
    }
    setOtpDigits(newDigits);
  };

  // Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
          phone: regPhone,
        }),
      });

      const newUser = await res.json();
      if (!res.ok) {
        throw new Error(newUser.error || 'Registration failed.');
      }

      // Automatically log in with new user
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, password: regPassword }),
      });
      const loginData = await loginRes.json();

      localStorage.setItem('crlk_auth_token', loginData.token);
      localStorage.setItem('crlk_auth_user', JSON.stringify(loginData.user));

      onLoginSuccess(loginData.user, loginData.token, loginData.school || schoolInfo);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setOtpRecipient(demoEmail);
    setErrorMsg(null);
  };

  // Clean Production Wipe
  const handleCleanProductionWipe = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/database/clean-production', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCleanWipeSuccess('Database reset to clean production mode. Sample devices cleared.');
        setEmail('admin@school.edu.in');
        setPassword('SchoolAdmin@2026');
        setTimeout(() => setCleanWipeSuccess(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreNavodayaSeed = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/database/seed-navodaya', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCleanWipeSuccess('Restored Navodaya JNV Burhanpur smart-board sample fleet.');
        setEmail('admin.tech@jnvburhanpur.edu.in');
        setPassword('Navodaya@Admin2026');
        setTimeout(() => setCleanWipeSuccess(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Floating Helper Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button
          onClick={() => setShowSampleDataModal(true)}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
        >
          <Database className="h-3.5 w-3.5 text-emerald-400" />
          <span>Review Sample Data / DB</span>
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 mb-3">
            <ShieldCheck className="h-8 w-8 text-slate-950" />
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center justify-center gap-2">
            ClassroomLock<span className="text-emerald-400 font-normal text-lg">Cloud</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {schoolInfo?.name || 'Jawahar Navodaya Vidyalaya (JNV) Burhanpur'}
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-850 border border-slate-700/60 text-[11px] text-emerald-400 font-medium mt-2">
            <Server className="h-3 w-3 text-emerald-400" />
            <span>Standalone School Control Server • Direct API & 2FA OTP</span>
          </div>
        </div>

        {/* Clean Wipe Notice */}
        {cleanWipeSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{cleanWipeSuccess}</span>
          </div>
        )}

        {/* Login Container */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md p-6 shadow-2xl">
          {/* 3-Way Mode Toggle: Password vs OTP vs Register */}
          <div className="grid grid-cols-3 p-1 rounded-xl bg-slate-800/80 mb-5 border border-slate-750 text-xs">
            <button
              type="button"
              onClick={() => { setAuthMode('password'); setErrorMsg(null); }}
              className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                authMode === 'password'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Password / PIN
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('otp'); setErrorMsg(null); }}
              className={`py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                authMode === 'otp'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="h-3 w-3" />
              <span>OTP 2FA</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setErrorMsg(null); }}
              className={`py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New Staff
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* MODE 1: Standard Password & PIN Login */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  School Staff Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin.tech@jnvburhanpur.edu.in"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Password / Master Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                id="login-submit-btn"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to School Fleet</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: Real 2FA OTP Login Flow */}
          {authMode === 'otp' && (
            <div className="space-y-4">
              {otpStep === 'request' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Registered School Email or Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Phone className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={otpRecipient}
                        onChange={(e) => setOtpRecipient(e.target.value)}
                        placeholder="e.g. admin.tech@jnvburhanpur.edu.in or 9826012345"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      A 6-digit cryptographic verification OTP valid for 5 minutes will be dispatched.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span>Dispatching 6-Digit OTP...</span>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        <span>Request 6-Digit Login OTP</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 mb-2">
                      <Fingerprint className="h-5 w-5" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-200">Enter 6-Digit Verification Code</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sent to <b className="text-emerald-400">{otpRecipient}</b>
                    </p>
                  </div>

                  {/* 6-Digit Auto-Advancing Input Boxes */}
                  <div className="flex items-center justify-center gap-2 py-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (digitInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        className="h-11 w-11 text-center font-mono font-bold text-base rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-inner"
                      />
                    ))}
                  </div>

                  {/* Preview Code Simulation Chip (Instant Testing for Reviewers) */}
                  {otpPreviewCode && (
                    <div className="p-2.5 rounded-xl bg-slate-850 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] text-slate-300">Active Test Code:</span>
                        <code className="text-xs font-bold text-emerald-400 font-mono tracking-widest">{otpPreviewCode}</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => fillTestOtp(otpPreviewCode)}
                        className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-semibold transition-all cursor-pointer"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || otpDigits.join('').length < 4}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span>Verifying Session...</span>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Verify & Open School Console</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpStep('request')}
                      className="text-slate-400 hover:text-slate-200 text-[11px] cursor-pointer"
                    >
                      ← Change Recipient
                    </button>

                    <button
                      type="button"
                      disabled={otpCountdown > 0 || isLoading}
                      onClick={() => handleSendOtp()}
                      className="text-emerald-400 hover:text-emerald-300 text-[11px] disabled:opacity-40 font-semibold cursor-pointer"
                    >
                      {otpCountdown > 0 ? `Resend code in ${otpCountdown}s` : 'Resend Code'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MODE 3: New Staff Registration */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra (Math Dept)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  School Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ramesh.chandra@jnvburhanpur.edu.in"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="school_admin">School Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone (for OTP)
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer mt-2"
              >
                {isLoading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Create Staff Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 1-Click Fast Credentials for Admins */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>1-Click Test Credentials (JNV Burhanpur Dataset)</span>
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin.tech@jnvburhanpur.edu.in', 'Navodaya@Admin2026')}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 text-left text-xs flex items-center justify-between transition-all group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-emerald-300">Rajesh Sharma (IT Lead / Admin)</div>
                  <div className="text-[10px] text-slate-400">admin.tech@jnvburhanpur.edu.in • PIN: 9821</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  School Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('aditya.mohanani@navodaya.edu.in', 'AdityaNavodaya2026')}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 text-left text-xs flex items-center justify-between transition-all group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-emerald-300">Aditya Mohanani (Student Creator)</div>
                  <div className="text-[10px] text-slate-400">aditya.mohanani@navodaya.edu.in • PIN: 2026</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                  Super Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('ananya.sen@jnvburhanpur.edu.in', 'TeacherPass123')}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 text-left text-xs flex items-center justify-between transition-all group cursor-pointer"
              >
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-emerald-300">Ananya Sen (Science Lead)</div>
                  <div className="text-[10px] text-slate-400">ananya.sen@jnvburhanpur.edu.in • PIN: 1101</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                  Teacher
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-500">
            Protected by ClassroomLock Enterprise Agent Authentication & Local Fleet REST API.
          </p>
        </div>
      </div>

      {/* Sample Data & Database Inspector Modal */}
      {showSampleDataModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-400" />
                <h2 className="text-base font-bold text-slate-100">Review Sample Data & Database State</h2>
              </div>
              <button
                onClick={() => setShowSampleDataModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                ClassroomLock includes full transparency over all stored records. You can review the pre-configured Navodaya Vidyalaya sample accounts, or switch to a clean production database with zero sample devices.
              </p>

              {/* Data Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleCleanProductionWipe}
                  className="p-3 rounded-xl bg-red-950/40 hover:bg-red-950/60 border border-red-500/30 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs mb-1">
                    <Trash2 className="h-4 w-4" />
                    <span>Switch to Clean Production State</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Wipes sample devices and classrooms for a fresh new school commissioning.
                  </p>
                </button>

                <button
                  onClick={handleRestoreNavodayaSeed}
                  className="p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/60 border border-emerald-500/30 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                    <RotateCcw className="h-4 w-4" />
                    <span>Restore Navodaya JNV Sample Data</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Re-seeds Class 9A, 10B, and SmartVision OPS panels for demonstration.
                  </p>
                </button>
              </div>

              {/* Account Credentials Table */}
              <div className="rounded-xl bg-slate-850 border border-slate-750 p-4">
                <h3 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-amber-400" />
                  <span>Pre-Configured Account Credentials</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-750 text-slate-400">
                        <th className="py-2 font-semibold">Name</th>
                        <th className="py-2 font-semibold">Email</th>
                        <th className="py-2 font-semibold">Password</th>
                        <th className="py-2 font-semibold">PIN</th>
                        <th className="py-2 font-semibold">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
                      <tr>
                        <td className="py-2 font-sans font-medium text-slate-200">Rajesh Sharma</td>
                        <td className="py-2">admin.tech@jnvburhanpur.edu.in</td>
                        <td className="py-2 text-emerald-400">Navodaya@Admin2026</td>
                        <td className="py-2 text-amber-400">9821</td>
                        <td className="py-2 font-sans text-emerald-400">school_admin</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-sans font-medium text-slate-200">Aditya Mohanani</td>
                        <td className="py-2">aditya.mohanani@navodaya.edu.in</td>
                        <td className="py-2 text-emerald-400">AdityaNavodaya2026</td>
                        <td className="py-2 text-amber-400">2026</td>
                        <td className="py-2 font-sans text-purple-400">super_admin</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-sans font-medium text-slate-200">Ananya Sen</td>
                        <td className="py-2">ananya.sen@jnvburhanpur.edu.in</td>
                        <td className="py-2 text-emerald-400">TeacherPass123</td>
                        <td className="py-2 text-amber-400">1101</td>
                        <td className="py-2 font-sans text-blue-400">teacher</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSampleDataModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
