import { NextResponse } from "next/server";

const API_URL = process.env.OCS_API_URL || "https://ocs-api.esimvault.cloud/v1";
const OCS_TOKEN = process.env.OCS_TOKEN || "HgljQn4Uhe6Ny07qTzYqPLjJ";
const ALLOWED = (process.env.OCS_ALLOWED_ACCOUNTS || "3771")
  .split(",").map(a=>Number(a.trim())).filter(Boolean);

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
    const { accountId } = await req.json() || {};
    const acct = Number(accountId);
    if (!ALLOWED.includes(acct)) {
      return NextResponse.json({ error: "Forbidden for this account" }, { status: 403 });
    }

    // No limit/offset — OCS rejected them
    const attempts = [
      { listSubscriber:  { accountId: acct } },
      { listSubscriber:  { accountid:  acct } },
      { listSubscribers: { accountId: acct } },
      { listSubscribers: { accountid:  acct } }
    ];

    for (const body of attempts) {
      try {
        const data = await callOCS(body);

        // Some OCS versions return result.subscribers, others result.subscriberList
        const subs = data?.result?.subscribers ?? data?.result?.subscriberList ?? [];
        if (Array.isArray(subs)) {
          return NextResponse.json({ result: { subscribers: subs } });
        }
        if (data && !data.error) return NextResponse.json(data);
      } catch (e) {
        // try next variant
      }
    }

    return NextResponse.json({ result: { subscribers: [] } });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
