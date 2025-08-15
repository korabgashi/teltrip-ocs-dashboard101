import { NextResponse } from "next/server";

const API_URL = process.env.OCS_API_URL || "https://ocs-api.esimvault.cloud/v1";
const OCS_TOKEN = process.env.OCS_TOKEN || "HgljQn4Uhe6Ny07qTzYqPLjJ";
const ALLOWED = (process.env.OCS_ALLOWED_ACCOUNTS || "3771").split(",").map(a=>Number(a.trim())).filter(Boolean);

async function callOCS(body) {
  const r = await fetch(`${API_URL}?token=${OCS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store"
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`OCS ${r.status}: ${text.slice(0,300)}`);
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

export async function POST(req) {
  try {
    const { accountId, limit = 200, offset = 0 } = await req.json() || {};
    const acct = Number(accountId);
    if (!ALLOWED.includes(acct)) return NextResponse.json({ error: "Forbidden for this account" }, { status: 403 });

    const attempts = [
      { listSubscriber:  { accountId: acct, limit, offset } },
      { listSubscriber:  { accountid:  acct, limit, offset } },
      { listSubscribers: { accountId: acct, limit, offset } },
      { listSubscribers: { accountid:  acct, limit, offset } }
    ];

    for (const body of attempts) {
      try {
        const data = await callOCS(body);
        if (Array.isArray(data?.result?.subscribers)) return NextResponse.json(data);
        if (data && !data.error) return NextResponse.json(data);
      } catch {}
    }
    return NextResponse.json({ result: { subscribers: [] } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}