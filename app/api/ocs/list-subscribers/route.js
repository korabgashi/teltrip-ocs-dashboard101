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
    cache: "no-store",
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`OCS ${r.status}: ${text.slice(0,300)}`);
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function normalizeSubs(data) {
  if (!data) return [];
  // Try all likely result paths
  const res = data.result || data.results || data;
  const candidates = [
    res?.subscribers,
    res?.subscriberList,
    res?.items,
    res?.list,
  ].filter(Boolean);
  for (const c of candidates) if (Array.isArray(c)) return c;

  // Sometimes it comes nested weirdly; flatten any arrays found
  const arrays = [];
  const stack = [res];
  while (stack.length) {
    const v = stack.pop();
    if (Array.isArray(v)) arrays.push(v);
    else if (v && typeof v === "object") stack.push(...Object.values(v));
  }
  for (const a of arrays) if (a.length && typeof a[0] === "object") return a;
  return [];
}

export async function POST(req) {
  try {
    const { accountId } = await req.json() || {};
    const acct = Number(accountId);
    if (!ALLOWED.includes(acct)) {
      return NextResponse.json({ error: "Forbidden for this account" }, { status: 403 });
    }

    // Try a bunch of op names (no limit/offset because your OCS rejects them)
    const attempts = [
      { listSubscriber: { accountId: acct } },
      { listSubscriber: { accountid: acct } },
      { listSubscribers: { accountId: acct } },
      { listSubscribers: { accountid: acct } },
      { ListSubscriber: { accountId: acct } },     // some installs use caps
      { listAllSubscribers: { accountId: acct } }, // alt op names seen in the wild
      { getSubscribers: { accountId: acct } },
    ];

    let last = null;
    for (const body of attempts) {
      try {
        const data = await callOCS(body);
        const subs = normalizeSubs(data);
        if (subs.length > 0) {
          return NextResponse.json({ result: { subscribers: subs }, tried: body });
        }
        last = { data, tried: body };
      } catch (e) {
        last = { error: String(e), tried: body };
      }
    }

    // Return last thing we saw so the UI can show it (already handled on the page)
    return NextResponse.json({ result: { subscribers: [] }, note: last });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
