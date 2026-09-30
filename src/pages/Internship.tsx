import React, { useEffect, useState, useRef } from "react";

/**
 * Internships webhook configuration.
 *
 * The n8n webhook is a local dev service by default; in any deployed environment
 * set VITE_INTERNSHIPS_WEBHOOK_URL (and VITE_INTERNSHIPS_WEBHOOK_SECRET if the
 * webhook validates one) via environment variables. The previous hardcoded
 * URL/secret pair leaked the webhook endpoint and its secret into the source
 * repo and the production bundle.
 */
const VITE_WEBHOOK_URL = import.meta.env.VITE_INTERNSHIPS_WEBHOOK_URL as string | undefined;
const VITE_WEBHOOK_SECRET = import.meta.env.VITE_INTERNSHIPS_WEBHOOK_SECRET as string | undefined;

const WEBHOOK_URL = VITE_WEBHOOK_URL ?? "http://localhost:5678/webhook/53cbda32-533b-4b03-a004-4ca6ba21e0da/chat";
const WEBHOOK_CHAT_URL = WEBHOOK_URL;
const WEBHOOK_SECRET = VITE_WEBHOOK_SECRET ?? "";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

type RawAPIResponse = {
  status?: string;
  query?: string;
  results?: Internship[];
  suggested_query?: string | null;
};

export type Internship = {
  id: string | null;
  title: string;
  description: string;
  skills: string[];
  ministry: string | null;
  location: string | null;
  applyUrl: string | null;
  score?: number;
  matchHighlights?: string[];
  lastUpdated?: string | null;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  ts: number;
  pending?: boolean;
};

function timeSince(dateStr?: string | null) {
  if (!dateStr) return "Unknown";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Unknown";
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, "yr"],
    [2592000, "mo"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ];
  for (const [secs, label] of intervals) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) return `${val}${label}`;
  }
  return `${seconds}s`;
}

function useDebouncedValue<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

const cacheKey = (q: string) => `internships_cache::${q.toLowerCase()}`;
function setCache(q: string, payload: RawAPIResponse) {
  try {
    const data = { ts: Date.now(), payload };
    localStorage.setItem(cacheKey(q), JSON.stringify(data));
  } catch {
    // Storage quota/privacy errors are non-fatal.
  }
}
function getCache(q: string): RawAPIResponse | null {
  try {
    const raw = localStorage.getItem(cacheKey(q));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const record = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    if (!record || typeof record.ts !== "number" || !record.payload) return null;
    if (Date.now() - record.ts > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(q));
      return null;
    }
    return record.payload as RawAPIResponse;
  } catch (e) {
    return null;
  }
}

export default function Internships(): JSX.Element {
  const [field, setField] = useState("");
  const debouncedField = useDebouncedValue(field, 350);
  const [results, setResults] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);
  const mounted = useRef(false);
  const searchSeq = useRef(0);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "sys-1",
        role: "system",
        text: "Hi! Ask me to search govt internships by field (e.g., 'data science').",
        ts: Date.now(),
      },
    ];
  });
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const chatSendingRef = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!debouncedField || debouncedField.trim().length < 1) {
      setResults([]);
      setError(null);
      setSuggested(null);
      return;
    }

    const q = debouncedField.trim();

    const cached = getCache(q);
    if (cached) {
      setResults(cached.results || []);
      setSuggested(cached.suggested_query || null);
      return;
    }

    setLoading(true);
    setError(null);

    const seq = ++searchSeq.current;

    (async () => {
      try {
        const payload = { field: q };
        const resp = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internships-secret": WEBHOOK_SECRET,
          },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`Webhook error: ${resp.status} ${resp.statusText} - ${txt}`);
        }

        const data: RawAPIResponse = await resp.json();

        const normalized = (data.results || []).map((r) => ({
          id: r.id ?? null,
          title: r.title ?? "Untitled",
          description: (r.description ?? "").replace(/\s+/g, " ").trim(),
          skills: r.skills ?? [],
          ministry: r.ministry ?? null,
          location: r.location ?? null,
          applyUrl: r.applyUrl ?? r.applyUrl ?? null,
          score: typeof r.score === "number" ? r.score : undefined,
          matchHighlights: r.matchHighlights ?? [],
          lastUpdated: r.lastUpdated ?? null,
        })) as Internship[];

        setCache(q, { status: data.status ?? "ok", query: data.query ?? q, results: normalized, suggested_query: data.suggested_query ?? null });

        if (mounted.current && seq === searchSeq.current) {
          setResults(normalized);
          setSuggested(data.suggested_query ?? null);
          setLoading(false);
        }
      } catch (err) {
        if (!mounted.current || seq !== searchSeq.current) return;
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    })();
  }, [debouncedField]);

  function pushChatMessage(msg: ChatMessage) {
    setChatMessages((s) => [...s, msg]);
    setTimeout(() => {
      chatScrollRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
    }, 50);
  }

  async function sendChatMessage(text: string) {
    if (!text || chatSendingRef.current) return;
    chatSendingRef.current = true;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      ts: Date.now(),
      pending: false,
    };
    pushChatMessage(userMsg);

    const pendingMsg: ChatMessage = {
      id: `a-pending-${Date.now()}`,
      role: "assistant",
      text: "...",
      ts: Date.now(),
      pending: true,
    };
    pushChatMessage(pendingMsg);

    try {
      const resp = await fetch(WEBHOOK_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internships-secret": WEBHOOK_SECRET,
        },
        body: JSON.stringify({ field: text }),
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Chat webhook error: ${resp.status} ${resp.statusText} - ${txt}`);
      }

      let parsed: unknown;
      try {
        parsed = await resp.json();
      } catch {
        const txt = await resp.text();
        parsed = { output: txt };
      }

      setChatMessages((s) => s.filter((m) => !m.pending));

      let assistantText = "";
      const record = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
      if (typeof parsed === "string") {
        assistantText = parsed;
      } else if (record && typeof record.output === "string") {
        assistantText = record.output;
      } else if (record && record.status && record.results) {
        const resultItems = Array.isArray(record.results) ? (record.results as Record<string, unknown>[]) : [];
        const top = resultItems.slice(0, 3);
        if (top.length === 0) {
          assistantText = `I couldn't find internships for "${text}". Try another phrasing.`;
        } else {
          assistantText = `Found ${resultItems.length} internships. Top matches:\n\n` + top.map((it, i: number) => {
            const title = typeof it.title === "string" ? it.title : "Untitled";
            const org = typeof it.ministry === "string" ? it.ministry : "";
            const loc = typeof it.location === "string" ? ` — ${it.location}` : "";
            const apply = typeof it.applyUrl === "string" ? `\nApply: ${it.applyUrl}` : "";
            return `${i + 1}. ${title}${org ? " — " + org : ""}${loc}${apply}`;
          }).join("\n\n");
        }
      } else {
        assistantText = "Sorry — I couldn't understand the response from the server.";
      }

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: assistantText,
        ts: Date.now(),
      };
      pushChatMessage(assistantMsg);
    } catch (err) {
      setChatMessages((s) => s.filter((m) => !m.pending));
      const errMsg: ChatMessage = {
        id: `a-err-${Date.now()}`,
        role: "assistant",
        text: `Error: ${err instanceof Error ? err.message : "Request failed"}`,
        ts: Date.now(),
      };
      pushChatMessage(errMsg);
    } finally {
      chatSendingRef.current = false;
    }
  }

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = chatInput.trim();
    if (!t) return;
    setChatInput("");
    await sendChatMessage(t);
  };

  const topResults = results.slice(0, limit);

  return (
    <>
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold mb-3 tracking-tight">Find Government <span className="text-gradient">Internships</span></h2>
          <p className="text-sm text-white/40 mb-6">Enter your field (e.g. "data science", "frontend", "renewable energy") and get matching government internship listings.</p>

          <div className="flex gap-2 mb-4">
            <input
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="Enter your field (e.g. data science)"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 outline-none focus:border-violet-500/50 transition-colors"
            />
            <button
              onClick={() => { setField(field); }}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-violet-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all"
            >
              Search
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="text-xs text-white/30">Cached: {getCache(field || "") ? "Yes" : "No"}</div>
            <div className="text-xs text-white/30">Showing top {Math.min(limit, results.length)} of {results.length} results</div>
          </div>

          <div className="mb-4">
            {loading && (
              <div className="flex items-center gap-3 glass rounded-xl p-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-violet-400" />
                <div className="text-sm text-white/60">Searching government datasets...</div>
              </div>
            )}

            {error && (
              <div className="glass rounded-xl p-3 text-sm text-red-400 border border-red-500/20">{error}</div>
            )}

            {!loading && !error && suggested && results.length === 0 && (
              <div className="glass rounded-xl p-3 text-sm text-amber-300/80 border border-amber-500/20">
                No results for "{field}". Suggested alternative query: <strong>{suggested}</strong>
              </div>
            )}

            {!loading && !error && results.length === 0 && !suggested && (
              <div className="text-sm text-white/30">No internships found yet for this field. Try different phrasing ("machine learning" vs "ML").</div>
            )}
          </div>

          <div className="grid gap-3">
            {topResults.map((r) => (
              <article key={r.id || r.title} className="glass rounded-2xl p-5 hover:bg-white/[0.06] transition-all duration-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white/90">{r.title}</h3>
                    <div className="text-xs text-white/30 mt-1">
                      {r.ministry ? <span className="mr-2">{r.ministry}</span> : null}
                      {r.location ? <span className="mr-2">· {r.location}</span> : null}
                      {r.score !== undefined ? <span className="ml-2">· Score {Math.round(r.score)}</span> : null}
                    </div>
                    <p className="mt-3 text-sm text-white/50 leading-relaxed">{r.description.length > 350 ? `${r.description.slice(0, 350)}...` : r.description}</p>

                    {r.skills && r.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {r.skills.slice(0, 6).map((s, i) => (
                          <span key={i} className="px-2 py-0.5 text-[10px] bg-white/[0.06] text-white/60 border border-white/[0.08] rounded-md">{s}</span>
                        ))}
                      </div>
                    )}

                    {r.matchHighlights && r.matchHighlights.length > 0 && (
                      <details className="mt-3 text-sm text-white/40">
                        <summary className="cursor-pointer hover:text-white/60 transition-colors">Match details</summary>
                        <ul className="list-disc ml-5 mt-2">
                          {r.matchHighlights.map((m, i) => <li key={i}>{m}</li>)}
                        </ul>
                      </details>
                    )}
                  </div>

                  <div className="flex-shrink-0 ml-4 text-right hidden sm:block">
                    {r.applyUrl ? (
                      <a target="_blank" rel="noopener noreferrer" href={r.applyUrl} className="inline-block px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-all">Apply</a>
                    ) : (
                      <span className="inline-block px-3 py-2 glass text-white/40 rounded-xl text-sm">No link</span>
                    )}
                    <div className="text-xs text-white/20 mt-2">Updated: {timeSince(r.lastUpdated ?? null)}</div>
                  </div>
                </div>

                <div className="mt-4 sm:hidden flex items-center justify-between">
                  {r.applyUrl ? (
                    <a target="_blank" rel="noopener noreferrer" href={r.applyUrl} className="inline-block px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-all">Apply</a>
                  ) : (
                    <span className="inline-block px-3 py-2 glass text-white/40 rounded-xl text-sm">No link</span>
                  )}
                  <div className="text-xs text-white/20">Updated: {timeSince(r.lastUpdated ?? null)}</div>
                </div>
              </article>
            ))}
          </div>

          {results.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm text-white/40">Results:</label>
                <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="px-2 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm">
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={15}>Top 15</option>
                </select>
              </div>

              <div>
                <button onClick={() => { setField(""); setResults([]); }} className="px-3 py-1 rounded-lg border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-all">Clear</button>
              </div>
            </div>
          )}

          <footer className="mt-6 text-xs text-white/20">Data is fetched from government datasets (NCS / data.gov.in / ministry portals). Always check the original posting before applying.</footer>
        </div>
      </div>

      <div className="fixed right-5 bottom-5 z-50">
        <div className={`w-80 md:w-96 glass-strong rounded-2xl overflow-hidden shadow-2xl ${chatOpen ? "block" : "hidden"}`}>
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-cyan-500">
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" className="flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <div className="font-semibold text-white">Internship Bot</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setChatOpen(false); }}
                aria-label="Close chat"
                className="p-1 rounded-full hover:bg-white/20 text-white"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="h-64 overflow-y-auto p-3 bg-black/40" ref={chatScrollRef}>
            {chatMessages.map((m) => (
              <div key={m.id} className={`mb-3 ${m.role === "user" ? "text-right" : "text-left"}`}>
                <div className={`inline-block max-w-[86%] break-words p-2.5 rounded-xl text-sm ${m.role === "user" ? "bg-violet-600 text-white" : "glass text-white/80"}`}>
                  <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
                  <div className="text-[10px] text-white/30 mt-1">{new Date(m.ts).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleChatSubmit} className="flex items-center gap-2 p-3 border-t border-white/[0.08] bg-black/20">
            <input
              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm outline-none placeholder:text-white/20"
              placeholder="Ask me to search internships..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              type="submit"
              className="px-3 py-2 bg-gradient-to-r from-violet-600 to-cyan-500 text-white rounded-xl text-sm"
              aria-label="Send message"
            >
              Send
            </button>
          </form>
        </div>

        <button
          onClick={() => setChatOpen((s) => !s)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Open chat"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </>
  );
}
