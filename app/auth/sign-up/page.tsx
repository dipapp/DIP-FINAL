'use client';
import { FormEvent, useEffect, useState, Suspense } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTab, setSelectedTab] = useState(1); // 0 = Log In, 1 = Sign Up

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'login') setSelectedTab(0);
    if (tab === 'signup') setSelectedTab(1);
  }, [searchParams]);

  // Sign In fields
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [optedInMarketing, setOptedInMarketing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms and Conditions.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: `${firstName} ${lastName}` });
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email: cred.user.email,
        firstName,
        lastName,
        phoneNumber,
        marketingOptIn: optedInMarketing,
        isAdmin: cred.user.email === 'admin@dipmembers.com',
        isActive: true,
        createdAt: serverTimestamp(),
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-blue-900 to-slate-900"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Logo Section with Holographic Effect */}
          <div className="text-center space-y-6">
            <div className="relative group mx-auto w-fit">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-all duration-1000 animate-pulse"></div>
              <div className="relative bg-black/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl shadow-purple-500/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/dip-logo.png" alt="DIP Logo" className="h-24 w-auto mx-auto drop-shadow-2xl" />
                <div className="absolute top-4 right-4 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
                <div className="absolute bottom-4 left-4 w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-black bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent tracking-tight">
                SECURE ACCESS
              </h1>
              <p className="text-lg text-gray-300 font-medium">
                Advanced membership benefits that protect you
              </p>
            </div>
          </div>

          {/* Holographic Tab Selector */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
            <div className="relative bg-black/60 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 shadow-xl">
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`relative py-4 px-6 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 ${
                    selectedTab === 0 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => setSelectedTab(0)}
                >
                  {selectedTab === 0 && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 rounded-xl"></div>
                      <div className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                    </>
                  )}
                  <span className="relative flex items-center justify-center space-x-2">
                    <span>🔑</span>
                    <span>LOG IN</span>
                  </span>
                </button>
                
                <button
                  className={`relative py-4 px-6 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 ${
                    selectedTab === 1 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => setSelectedTab(1)}
                >
                  {selectedTab === 1 && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000 rounded-xl"></div>
                      <div className="absolute top-1 right-1 w-2 h-2 bg-purple-400 rounded-full animate-ping"></div>
                    </>
                  )}
                  <span className="relative flex items-center justify-center space-x-2">
                    <span>🚀</span>
                    <span>SIGN UP</span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Error Display */}
          {error && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl blur opacity-30 animate-pulse"></div>
              <div className="relative bg-red-900/40 backdrop-blur-xl border border-red-400/30 rounded-2xl p-6 shadow-xl shadow-red-500/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                    <span className="text-lg">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-red-300 mb-1">Authentication Error</h4>
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                </div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
              </div>
            </div>
          )}

          {/* Enhanced Sign In Form */}
          {selectedTab === 0 && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative bg-black/60 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl shadow-cyan-500/20">
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      <input 
                        type="email" 
                        placeholder="✉️ Email Address" 
                        className="relative w-full bg-black/40 backdrop-blur-xl border border-cyan-400/30 rounded-xl px-6 py-4 text-white placeholder-gray-400 font-medium transition-all duration-300 focus:border-cyan-400/60 focus:bg-black/60 focus:shadow-xl focus:shadow-cyan-500/20" 
                        value={signInEmail} 
                        onChange={(e) => setSignInEmail(e.target.value)} 
                        required 
                      />
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      <input 
                        type="password" 
                        placeholder="🔒 Password" 
                        className="relative w-full bg-black/40 backdrop-blur-xl border border-cyan-400/30 rounded-xl px-6 py-4 text-white placeholder-gray-400 font-medium transition-all duration-300 focus:border-cyan-400/60 focus:bg-black/60 focus:shadow-xl focus:shadow-cyan-500/20" 
                        value={signInPassword} 
                        onChange={(e) => setSignInPassword(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="group relative overflow-hidden w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-700 text-white font-black text-lg py-4 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative flex items-center justify-center space-x-3">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>AUTHENTICATING...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>ACCESS DASHBOARD</span>
                          <span>🚀</span>
                        </>
                      )}
                    </span>
                  </button>
                  
                  <div className="text-center">
                    <button type="button" className="group text-sm text-cyan-300 hover:text-cyan-200 transition-colors duration-300">
                      <span className="relative">
                        🔐 Forgot password?
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                      </span>
                    </button>
                  </div>
                </form>
                
                {/* Scanning Line Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
                <div className="absolute top-4 right-4 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Enhanced Sign Up Form */}
          {selectedTab === 1 && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="relative bg-black/60 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl shadow-purple-500/20">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      <input 
                        type="text" 
                        placeholder="👤 First Name" 
                        className="relative w-full bg-black/40 backdrop-blur-xl border border-purple-400/30 rounded-xl px-6 py-4 text-white placeholder-gray-400 font-medium transition-all duration-300 focus:border-purple-400/60 focus:bg-black/60 focus:shadow-xl focus:shadow-purple-500/20" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                        required 
                      />
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      <input 
                        type="text" 
                        placeholder="👤 Last Name" 
                        className="relative w-full bg-black/40 backdrop-blur-xl border border-purple-400/30 rounded-xl px-6 py-4 text-white placeholder-gray-400 font-medium transition-all duration-300 focus:border-purple-400/60 focus:bg-black/60 focus:shadow-xl focus:shadow-purple-500/20" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      <input 
                        type="tel" 
                        placeholder="📱 Phone Number" 
                        className="relative w-full bg-black/40 backdrop-blur-xl border border-purple-400/30 rounded-xl px-6 py-4 text-white placeholder-gray-400 font-medium transition-all duration-300 focus:border-purple-400/60 focus:bg-black/60 focus:shadow-xl focus:shadow-purple-500/20" 
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value)} 
                      />
                      <p className="text-xs text-gray-400 mt-2 px-2">📞 Used for emergency communications</p>
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      <input 
                        type="email" 
                        placeholder="✉️ Email Address" 
                        className="relative w-full bg-black/40 backdrop-blur-xl border border-purple-400/30 rounded-xl px-6 py-4 text-white placeholder-gray-400 font-medium transition-all duration-300 focus:border-purple-400/60 focus:bg-black/60 focus:shadow-xl focus:shadow-purple-500/20" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                      />
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      <input 
                        type="password" 
                        placeholder="🔒 Password (6+ characters)" 
                        className="relative w-full bg-black/40 backdrop-blur-xl border border-purple-400/30 rounded-xl px-6 py-4 text-white placeholder-gray-400 font-medium transition-all duration-300 focus:border-purple-400/60 focus:bg-black/60 focus:shadow-xl focus:shadow-purple-500/20" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                      />
                    </div>
                    
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      <input 
                        type="password" 
                        placeholder="🔒 Confirm Password" 
                        className="relative w-full bg-black/40 backdrop-blur-xl border border-purple-400/30 rounded-xl px-6 py-4 text-white placeholder-gray-400 font-medium transition-all duration-300 focus:border-purple-400/60 focus:bg-black/60 focus:shadow-xl focus:shadow-purple-500/20" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                  {/* Enhanced Terms and Conditions */}
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl blur"></div>
                      <div className="relative bg-black/40 backdrop-blur-xl border border-emerald-400/30 rounded-xl p-4">
                        <div className="flex items-start space-x-4">
                          <button 
                            type="button" 
                            onClick={() => setAgreedToTerms(!agreedToTerms)} 
                            className={`relative mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                              agreedToTerms 
                                ? 'bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30' 
                                : 'border-gray-400 hover:border-emerald-400/50 bg-black/20'
                            }`}
                          >
                            {agreedToTerms && (
                              <>
                                <span className="text-sm font-bold">✓</span>
                                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg blur opacity-30 animate-pulse"></div>
                              </>
                            )}
                          </button>
                          
                          <div className="flex-1 text-sm">
                            <p className="text-gray-300 leading-relaxed mb-3">
                              I agree to the <span className="text-emerald-300 font-semibold">Terms of Service</span> and acknowledge the <span className="text-emerald-300 font-semibold">Privacy Policy</span>. I consent to receive disclosures electronically and to use electronic signatures.
                            </p>
                            <div className="flex space-x-6">
                              <a href="#" className="group text-xs text-emerald-300 hover:text-emerald-200 transition-colors duration-300">
                                <span className="relative">
                                  📜 Terms of Service
                                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                                </span>
                              </a>
                              <a href="#" className="group text-xs text-emerald-300 hover:text-emerald-200 transition-colors duration-300">
                                <span className="relative">
                                  🛡️ Privacy Policy
                                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                                </span>
                              </a>
                            </div>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur"></div>
                      <div className="relative bg-black/40 backdrop-blur-xl border border-blue-400/30 rounded-xl p-4">
                        <div className="flex items-start space-x-4">
                          <button 
                            type="button" 
                            onClick={() => setOptedInMarketing(!optedInMarketing)} 
                            className={`relative mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                              optedInMarketing 
                                ? 'bg-gradient-to-br from-blue-400 to-purple-500 border-blue-400 text-white shadow-lg shadow-blue-500/30' 
                                : 'border-gray-400 hover:border-blue-400/50 bg-black/20'
                            }`}
                          >
                            {optedInMarketing && (
                              <>
                                <span className="text-sm font-bold">✓</span>
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg blur opacity-30 animate-pulse"></div>
                              </>
                            )}
                          </button>
                          
                          <p className="flex-1 text-sm text-gray-300">
                            📬 I'd like to receive product updates and exclusive member benefits.
                          </p>
                        </div>
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></div>
                      </div>
                    </div>
                    
                    {/* Privacy Notice */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-600/10 to-gray-700/10 rounded-xl blur"></div>
                      <div className="relative bg-black/30 backdrop-blur-xl border border-gray-500/30 rounded-xl p-4">
                        <p className="text-xs text-gray-400 leading-relaxed">
                          🔒 <span className="text-gray-300 font-medium">Data Protection:</span> We collect identity, vehicle, insurance, and contact information to provide membership services, verify identity, process requests, and prevent fraud. Data is retained only as necessary for these purposes. Learn more in our Privacy Policy.
                        </p>
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  {/* Enhanced Submit Button */}
                  <button 
                    type="submit" 
                    disabled={!agreedToTerms || loading} 
                    className={`group relative overflow-hidden w-full font-black text-lg py-4 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed ${
                      agreedToTerms 
                        ? 'bg-gradient-to-r from-purple-500 via-pink-600 to-red-700 text-white hover:shadow-2xl hover:shadow-purple-500/30' 
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {agreedToTerms && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    )}
                    <span className="relative flex items-center justify-center space-x-3">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>ACTIVATING MEMBERSHIP...</span>
                        </>
                      ) : agreedToTerms ? (
                        <>
                          <span>🚀</span>
                          <span>ACTIVATE MEMBERSHIP</span>
                          <span>⚡</span>
                        </>
                      ) : (
                        <>
                          <span>🔒</span>
                          <span>ACCEPT TERMS TO CONTINUE</span>
                        </>
                      )}
                    </span>
                  </button>
                </form>
                
                {/* Scanning Line Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl"></div>
                <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
