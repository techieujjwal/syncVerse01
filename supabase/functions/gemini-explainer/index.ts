import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers — restrict to known SyncVerse origins in production.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_QUESTION_CHARS = 4000;
const MAX_CONTEXT_CHARS = 12000;

function buildSystemInstruction(): string {
  return `
--- ROLE AND PERSONALITY ---
You are a PREMIUM human-like coding mentor inside a product called SyncVerse.

1.  Personality: You talk like a friendly senior dev helping a junior. Your tone must be consistently motivating, encouraging, and positive.
2.  Language: Use simple, clear, and direct language only. The explanation must be crystal clear and easy to grasp.
3.  Audience: Explain like you're talking to a 14–16 year old who just started coding.
4.  Tone: Use real, calm encouragement. Avoid being overly formal or using cringe quotes. The output quality must be excellent and premium.

--- FORMATTING RULES (STRICT) ---
1.  Do NOT use the asterisk (*) or hyphen (-) for bullet points.
2.  Use only numbered lists (1., 2., 3...) for major sections.
3.  Use only lettered lists (a., b., c...) for sub-points within sections.
4.  Keep paragraphs short and scannable.
5.  Ensure the final response has a "Premium feel."

--- REQUIRED ANSWER STRUCTURE ---
1.  Simple Breakdown
    a. Explain the concept in the simplest possible language.
    b. Speak as if you're talking to your younger sibling.
2.  Why This Matters
    a. Focus only on practical utility: real dev jobs, freelancing, open source.
3.  Real-Life Example Connection
    a. Use a major consumer app (e.g., Instagram, YouTube, Zomato).
4.  3-Day Micro Plan (Actionable Steps)
    a. Day 1: Basics and core understanding.
    b. Day 2: Hands-on practice and a small, focused challenge.
    c. Day 3: Revision and a mini stretch goal.
5.  Mini Project (Your Next Step)
    a. Name the project (catchy and relevant).
    b. State what it will do.
    c. Provide 3–4 simple step-by-step instructions to start it.
6.  Senior Dev Motivation Talk
    a. Calm, encouraging, human. End by re-iterating consistency over speed.

Rules reminder: Do NOT use * or - bullets anywhere. Use only numbers and letters for lists.
--- END OF SYSTEM PROMPT ---
`.trim();
}

function buildUserPrompt(
  topic: string,
  week: string,
  weekTitle: string,
  roadmapContext: string,
  question: string
): string {
  return `
--- CONTEXT INJECTION ---
1.  Topic: ${topic}
2.  Week Info:
    a. Week number: ${week}
    b. Week title: ${weekTitle}
3.  Roadmap/Learning Material Context: ${roadmapContext}
4.  Student's Question: ${question}

Provide the answer following the required 6-part structure.
`.trim();
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  try {
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const str = (v: unknown, fallback: string) => {
      const s = typeof v === "string" || typeof v === "number" ? String(v) : "";
      return s.slice(0, 200) || fallback;
    };

    const topic = str(body.topic, "Not provided");
    const week =
      (typeof body.week === "string" || typeof body.week === "number"
        ? String(body.week)
        : ""
      ).slice(0, 40) || "Not provided";
    const weekTitle = typeof body.weekTitle === "string" ? body.weekTitle.slice(0, 200) : "";
    const weekTitle = String(body.weekTitle ?? "").slice(0, 200);
    const roadmapContext = String(body.roadmapContext ?? "").slice(0, MAX_CONTEXT_CHARS);
    const question = String(body.question ?? "").slice(0, MAX_QUESTION_CHARS);

    if (!question.trim() && !roadmapContext.trim()) {
      return new Response(
        JSON.stringify({ error: "Provide a question or roadmap context to explain." }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const MODEL_NAME = Deno.env.get("GEMINI_MODEL") || DEFAULT_MODEL;

    if (!GEMINI_API_KEY) {
      console.error("gemini-explainer: GEMINI_API_KEY secret is not set.");
      return new Response(
        JSON.stringify({
          error:
            "The AI mentor is not configured on the server (missing GEMINI_API_KEY secret). " +
            "Ask the site administrator to set it via: supabase secrets set GEMINI_API_KEY=...",
        }),
        { status: 503, headers: CORS_HEADERS }
      );
    }

    const payload = {
      systemInstruction: { parts: [{ text: buildSystemInstruction() }] },
      contents: [{ role: "user", parts: [{ text: buildUserPrompt(topic, week, weekTitle, roadmapContext, question) }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    const apiData: unknown = await apiRes.json().catch(() => null);
    const apiRecord = apiData && typeof apiData === "object" ? (apiData as Record<string, unknown>) : null;
    const apiError =
      apiRecord && typeof apiRecord.error === "object" && apiRecord.error !== null
        ? (apiRecord.error as Record<string, unknown>)
        : null;

    if (!apiRes.ok) {
      const apiMsg =
        (apiError && typeof apiError.message === "string" && apiError.message) ||
        `Gemini API returned status ${apiRes.status}`;
      console.error("gemini-explainer: Gemini HTTP error:", apiRes.status, apiMsg);
      // Surface rate limits clearly so the client can show a useful message.
      const status = apiRes.status === 429 ? 429 : 502;
      return new Response(
        JSON.stringify({
          error:
            apiRes.status === 429
              ? "The AI mentor is rate-limited right now. Please wait a moment and try again."
              : `AI service error: ${apiMsg}`,
        }),
        { status, headers: CORS_HEADERS }
      );
    }

    const candidates = apiRecord && Array.isArray(apiRecord.candidates) ? apiRecord.candidates : [];
    const firstCandidate = candidates[0];
    const candidateRecord =
      firstCandidate && typeof firstCandidate === "object" ? (firstCandidate as Record<string, unknown>) : null;
    const content =
      candidateRecord && typeof candidateRecord.content === "object" && candidateRecord.content !== null
        ? (candidateRecord.content as Record<string, unknown>)
        : null;
    const parts = content && Array.isArray(content.parts) ? content.parts : [];

    const responseText = parts
      .map((p) => (p && typeof p === "object" && typeof (p as Record<string, unknown>).text === "string" ? (p as Record<string, unknown>).text as string : ""))
      .join("\n")
      .trim();

    if (!responseText) {
      const promptFeedback = apiRecord && typeof apiRecord.promptFeedback === "object" && apiRecord.promptFeedback !== null
        ? (apiRecord.promptFeedback as Record<string, unknown>)
        : null;
      const reason =
        (candidateRecord && typeof candidateRecord.finishReason === "string" && candidateRecord.finishReason) ||
        (promptFeedback && typeof promptFeedback.blockReason === "string" && promptFeedback.blockReason);
      console.error("gemini-explainer: empty response. finishReason:", reason);
      return new Response(
        JSON.stringify({
          error: reason
            ? `The AI could not answer this (reason: ${reason}). Try rephrasing your question.`
            : "The AI returned an empty response. Please try again.",
        }),
        { status: 502, headers: CORS_HEADERS }
      );
    }

    return new Response(JSON.stringify({ answer: responseText }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error("gemini-explainer: unhandled error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: `Failed to get explanation: ${message}` }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
});
