"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Login(){
  const [email, setEmail] = useState("ops@teltrip.local");
  const router = useRouter();
  useEffect(()=>{ if (typeof window!=='undefined' && localStorage.getItem('userId')) router.push('/dashboard') },[router]);
  const submit=(e)=>{ e.preventDefault(); localStorage.setItem('userId', email || 'ops@teltrip.local'); router.push('/dashboard'); };
  return (
    <div style={{ display:'grid', placeItems:'center', minHeight:'70vh' }}>
      <form onSubmit={submit} style={{ background:'#151a2e', padding:24, borderRadius:16, width:420, boxShadow:'0 10px 40px rgba(0,0,0,0.3)' }}>
        <h1 style={{ fontSize:24, marginBottom:16 }}>Sign in</h1>
        <p style={{ opacity:0.8, marginBottom:16 }}>Demo login (localStorage). Replace with real auth later.</p>
        <label>Email</label>
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@company.com"
          style={{ width:'100%', padding:10, marginTop:8, borderRadius:10, border:'1px solid #2a3356', background:'#0f1428', color:'#e9ecf1' }}/>
        <button type="submit" style={{ marginTop:16, width:'100%', padding:12, border:0, borderRadius:10, background:'#4b74ff', color:'#fff', fontWeight:600 }}>
          Continue
        </button>
      </form>
    </div>
  );
}