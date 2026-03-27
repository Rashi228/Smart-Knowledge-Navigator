import React, { useState } from 'react';
import { Bot, Mail, Lock, ArrowRight, ShieldCheck, Database, UploadCloud, Cpu } from 'lucide-react';

export default function Login({ onLogin, onNavigateRegister }) {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState('');

   const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      try {
         const formData = new URLSearchParams();
         formData.append('username', email);
         formData.append('password', password);

         const response = await fetch('http://localhost:8000/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
         });

         if (!response.ok) throw new Error('Invalid credentials');

         const data = await response.json();
         localStorage.setItem('hyperrag_token', data.access_token);
         onLogin(data.access_token);
      } catch (err) {
         setError(err.message);
      } finally {
         setLoading(false);
      }
   };

   const pathD = "M 50 150 C 100 50, 200 50, 250 150 S 400 250, 450 150";

   return (
      <div className="flex min-h-screen bg-slate-50 font-sans w-full">

         {/* Left Marketing Panel - Vibrant Light Flow Diagram */}
         <div className="hidden lg:flex w-[55%] items-center justify-center p-12 relative overflow-hidden bg-white">

            {/* Stunning Soft Background Orbs */}
            <div className="absolute top-[5%] left-[10%] w-[30rem] h-[30rem] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[5%] right-[10%] w-[35rem] h-[35rem] bg-pink-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
            <div className="absolute top-[40%] left-[40%] w-[25rem] h-[25rem] bg-cyan-100/60 rounded-full mix-blend-multiply filter blur-[90px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>

            <div className="w-full max-w-2xl relative z-10 flex flex-col items-center">

               <div className="w-full text-center">
                  <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-4 tracking-tight">
                     Intelligent Knowledge. <br />
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-pink-500 to-amber-500">Self-Healing.</span>
                  </h1>
                  <p className="text-slate-600 text-lg mb-4 font-medium max-w-lg mx-auto">
                     Experience the world's most resilient local architecture. Watch your private data flow securely.
                  </p>
               </div>

               {/* Gorgeous Animated SVG Flow Diagram */}
               <div className="w-full relative h-[26rem] mt-6 select-none">

                  <svg viewBox="0 0 500 300" className="absolute inset-0 w-full h-full z-0 overflow-visible" style={{ filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.06))' }}>
                     {/* Background Shadow Track */}
                     <path d={pathD} stroke="#f1f5f9" strokeWidth="12" fill="none" strokeLinecap="round" />

                     {/* Main Gradient Track */}
                     <path d={pathD} stroke="url(#flowGradient)" strokeWidth="6" fill="none" strokeLinecap="round" />

                     {/* Animated Data Packets traveling along the path */}
                     <circle r="6" fill="#f43f5e" className="shadow-[0_0_15px_#f43f5e]">
                        <animateMotion dur="4s" repeatCount="indefinite" path={pathD} />
                     </circle>
                     <circle r="5" fill="#3b82f6" opacity="0.8">
                        <animateMotion dur="4s" begin="1.3s" repeatCount="indefinite" path={pathD} />
                     </circle>
                     <circle r="7" fill="#8b5cf6" opacity="0.9">
                        <animateMotion dur="4s" begin="2.6s" repeatCount="indefinite" path={pathD} />
                     </circle>

                     <defs>
                        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                           <stop offset="0%" stopColor="#8b5cf6" />
                           <stop offset="50%" stopColor="#ec4899" />
                           <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                     </defs>
                  </svg>

                  {/* Nodes Positioned along the wave */}

                  {/* Node 1: Ingest */}
                  {/* Path starts at (50, 150) -> matches 10% x, 50% y */}
                  <div className="absolute top-[50%] left-[10%] -translate-x-1/2 -translate-y-1/2 z-10 w-20 h-20 bg-white/80 backdrop-blur-xl rounded-[1rem] shadow-xl flex flex-col items-center justify-center border border-white group hover:scale-110 transition-transform duration-300">
                     <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 mb-1.5">
                        <UploadCloud className="w-5 h-5 text-white" />
                     </div>
                     <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-700">Ingest</span>
                  </div>

                  {/* Node 2: Storage */}
                  {/* Path apex roughly at (150, 75) -> matches 30% x, 25% y */}
                  <div className="absolute top-[25%] left-[30%] -translate-x-1/2 -translate-y-1/2 z-10 w-20 h-20 bg-white/80 backdrop-blur-xl rounded-[1rem] shadow-xl flex flex-col items-center justify-center border border-white group hover:scale-110 transition-transform duration-300">
                     <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-200 mb-1.5">
                        <Database className="w-5 h-5 text-white" />
                     </div>
                     <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-700">Store</span>
                  </div>

                  {/* Node 3: Macrophage */}
                  {/* Path midpoint (250, 150) -> matches 50% x, 50% y */}
                  <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-10 w-20 h-20 bg-white/80 backdrop-blur-xl rounded-[1rem] shadow-xl flex flex-col items-center justify-center border border-white group hover:scale-110 transition-transform duration-300">
                     <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 mb-1.5">
                        <ShieldCheck className="w-5 h-5 text-white" />
                     </div>
                     <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-700">Immune</span>
                  </div>

                  {/* Node 4: Agents */}
                  {/* Path trough (350, 225) -> matches 70% x, 75% y */}
                  <div className="absolute top-[75%] left-[70%] -translate-x-1/2 -translate-y-1/2 z-10 w-20 h-20 bg-white/80 backdrop-blur-xl rounded-[1rem] shadow-xl flex flex-col items-center justify-center border border-white group hover:scale-110 transition-transform duration-300">
                     <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-200 mb-1.5">
                        <Cpu className="w-5 h-5 text-white" />
                     </div>
                     <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-700">Agents</span>
                  </div>

                  {/* Node 5: Output */}
                  {/* Path ends (450, 150) -> matches 90% x, 50% y */}
                  <div className="absolute top-[50%] left-[90%] -translate-x-1/2 -translate-y-1/2 z-10 w-20 h-20 bg-white/80 backdrop-blur-xl rounded-[1rem] shadow-xl flex flex-col items-center justify-center border border-white group hover:scale-110 transition-transform duration-300">
                     <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-cyan-200 mb-1.5">
                        <Bot className="w-5 h-5 text-white" />
                     </div>
                     <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-700">Respond</span>
                  </div>

                  {/* Floating Info Badges */}
                  <div className="absolute top-[16%] left-[10%] z-0 px-3 py-1.5 bg-white/90 backdrop-blur border border-pink-100 rounded-full text-[10px] font-bold text-pink-500 shadow-sm animate-pulse whitespace-nowrap hidden xl:block">
                     Qdrant & Neo4j Active
                  </div>

                  <div className="absolute top-[80%] left-[45%] z-0 px-3 py-1.5 bg-white/90 backdrop-blur border border-indigo-100 rounded-full text-[10px] font-bold text-indigo-500 shadow-sm animate-bounce whitespace-nowrap hidden xl:block" style={{ animationDelay: '1s' }}>
                     Verifying Logic...
                  </div>
               </div>

            </div>
         </div>

         {/* Right Login Panel - Beautiful Vibrant Whites */}
         <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-white/50 relative">
            {/* Subtle ambient blur behind form */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/50 backdrop-blur-lg z-0"></div>

            <div className="w-full max-w-sm relative z-10">

               <div className="mb-10 lg:hidden flex items-center space-x-3 justify-center">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                     <Bot className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 tracking-tight">HyperRAG-X</h1>
               </div>

               <div className="mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                  <p className="text-slate-500 font-medium">Log in to your isolated knowledge workspace.</p>
               </div>

               {error && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-xl text-center font-bold animate-in fade-in">
                     {error}
                  </div>
               )}

               <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Workspace Email</label>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                           <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                           type="text"
                           required
                           className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 font-medium placeholder-slate-400 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                           placeholder="admin@hyperrag.local"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                        />
                     </div>
                  </div>

                  <div>
                     <div className="flex justify-between items-center mb-2 ml-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Access Protocol</label>
                        <a href="#" className="text-xs text-indigo-500 font-bold hover:text-indigo-600 transition-colors">Emergency Reset?</a>
                     </div>
                     <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                           <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                           type="password"
                           required
                           className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 font-medium placeholder-slate-400 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                           placeholder="••••••••"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                        />
                     </div>
                  </div>

                  <button
                     type="submit"
                     disabled={loading}
                     className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-[0_8px_25px_-8px_rgba(99,102,241,0.6)] text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:hover:translate-y-0 mt-8 group"
                  >
                     {loading ? 'Authenticating...' : 'Initialize Workspace'}
                     {!loading && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  </button>
               </form>

               <div className="mt-10 text-center text-sm font-medium">
                  <span className="text-slate-500">New network entity node? </span>
                  <button onClick={onNavigateRegister} className="font-bold text-indigo-600 hover:text-indigo-700 underline decoration-indigo-200 underline-offset-4 cursor-pointer hover:decoration-indigo-400 transition-colors ml-1">
                     Build System
                  </button>
               </div>

            </div>
         </div>
      </div>
   );
}
