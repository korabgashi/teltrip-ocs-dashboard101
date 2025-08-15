"use client";
import { useEffect, useMemo, useState } from "react";

async function postJSON(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(json?.error || json?.detail || text || `HTTP ${res.status}`);
  return json;
}

export default function Dashboard(){
  const [accountId, setAccountId] = useState(Number(process.env.NEXT_PUBLIC_DEFAULT_ACCOUNT || 3771));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const json = await postJSON("/api/ocs/list-subscribers", { accountId, limit: 200 });
      setData(json);
    } catch (e) {
      setError(String(e));
      setData(null);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ if (!localStorage.getItem("userId")) { window.location.href='/login'; return; } load(); }, []);

  const rows = useMemo(()=> data?.result?.subscribers || [], [data]);
  const kpis = useMemo(()=> {
    const total = rows.length;
    const active = rows.filter(s => (s.status||'').toUpperCase()==='ACTIVE').length;
    return { total, active, inactive: total - active };
  }, [rows]);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <h1 style={{ fontSize:24, fontWeight:700 }}>OCS Dashboard</h1>
        <div style={{ display:'flex', gap:8 }}>
          <input type="number" value={accountId} onChange={(e)=>setAccountId(Number(e.target.value))}
            style={{ width:160, padding:8, borderRadius:10, border:'1px solid #2a3356', background:'#0f1428', color:'#e9ecf1' }}/>
          <button onClick={load} style={{ padding:'8px 14px', borderRadius:10, border:0, background:'#4b74ff', color:'#fff', fontWeight:600 }}>Refresh</button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop:16, padding:12, borderRadius:12, background:'#3a2030', color:'#ffd4d4', whiteSpace:'pre-wrap' }}>
          <strong>API error:</strong> {error}
        </div>
      )}

      {data && !rows.length && (
        <div style={{ marginTop:16, padding:12, borderRadius:12, background:'#1d233a', color:'#cfd8ff' }}>
          <div style={{ fontWeight:700, marginBottom:8 }}>Raw response (no subscribers parsed):</div>
          <pre style={{ margin:0, whiteSpace:'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginTop:16 }}>
        <div style={{ background:'#151a2e', padding:16, borderRadius:16 }}>
          <div style={{ opacity:0.7 }}>Total Subscribers</div>
          <div style={{ fontSize:28, fontWeight:700 }}>{kpis.total}</div>
        </div>
        <div style={{ background:'#151a2e', padding:16, borderRadius:16 }}>
          <div style={{ opacity:0.7 }}>Active</div>
          <div style={{ fontSize:28, fontWeight:700 }}>{kpis.active}</div>
        </div>
        <div style={{ background:'#151a2e', padding:16, borderRadius:16 }}>
          <div style={{ opacity:0.7 }}>Inactive</div>
          <div style={{ fontSize:28, fontWeight:700 }}>{kpis.inactive}</div>
        </div>
      </div>

      <div style={{ marginTop:24, background:'#151a2e', borderRadius:16, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 2fr 1fr 2fr 1.5fr 1.5fr', padding:12, borderBottom:'1px solid #2a3356', fontWeight:600 }}>
          <div>Subscriber ID</div><div>ICCID</div><div>Status</div><div>Package</div><div>Activated</div><div>Expires</div>
        </div>
        {loading && <div style={{ padding:16 }}>Loading…</div>}
        {!loading && !error && rows.map((s, idx) => (
          <div key={idx} style={{ display:'grid', gridTemplateColumns:'1.2fr 2fr 1fr 2fr 1.5fr 1.5fr', padding:12, borderBottom:'1px solid #2a3356' }}>
            <div>{s.subscriberId || s.subscriberid}</div>
            <div style={{ fontFamily:'ui-monospace,SFMono-Regular,Menlo,Monaco' }}>{s.iccid}</div>
            <div>{s.status}</div>
            <div>{s.prepaidpackagetemplatename || s.packageName}</div>
            <div>{s.tsactivationutc || s.activationDate}</div>
            <div>{s.tsexpirationutc || s.expiryDate}</div>
          </div>
        ))}
        {!loading && !error && rows.length===0 && <div style={{ padding:16, opacity:0.8 }}>No data.</div>}
      </div>
    </div>
  );
}