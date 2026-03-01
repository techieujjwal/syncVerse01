"use client";

import React, { useState, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { useToast } from "@/hooks/use-toast";

import { ArrowLeft, Loader2, Sparkles, Code2 } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as
  | string
  | undefined;
const GEMINI_MODEL =
  (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ||
  "models/gemini-2.0-flash";

type NavState = {
  topic?: string;
  week?: string;
  weekTitle?: string;
  roadmapContext?: string;
} | undefined;

const buildPrompt = (
  topic = "Not provided",
  week = "Not provided",
  weekTitle = "Not provided",
  roadmapContext = "No roadmap text provided.",
  question = "Explain this simply and tell me what to do next."
) => {
  return `
--- ROLE AND PERSONALITY ---
You are a PREMIUM human-like coding mentor inside a product called SyncVerse Premium.

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

--- CONTEXT INJECTION ---
1.  Topic: ${topic}
2.  Week Info:
    a. Week number: ${week}
    b. Week title: ${weekTitle}
3.  Roadmap/Learning Material Context: ${roadmapContext}
4.  Student's Question: ${question}

--- REQUIRED ANSWER STRUCTURE ---
Provide the answer following this exact 6-part structure. The explanation in section 1 must be the absolute clearest explanation possible. The tone throughout must be motivating:

1.  Simple Breakdown
    a. Explain the concept in the simplest possible language.
    b. Speak as if you're talking to your younger sibling.

2.  Why This Matters
    a. Focus only on practical utility: How this helps in real dev jobs, freelancing projects, or contributing to open source.

3.  Real-Life Example Connection
    a. Use a major consumer app (e.g., Instagram, YouTube, Zomato).
    b. Explain the connection to the concept clearly and concisely.

4.  3-Day Micro Plan (Actionable Steps)
    a. Day 1: Basic stuff and core understanding.
    b. Day 2: Hands-on practice and a small, focused challenge.
    c. Day 3: Revision and a mini stretch goal to apply the concept uniquely.

5.  Mini Project (Your Next Step)
    a. Name the project (keep it catchy and relevant).
    b. Clearly state what the mini project will do.
    c. Provide 3–4 simple, step-by-step instructions on how to start the project.

6.  Senior Dev Motivation Talk
    a. Deliver a human, calm, and encouraging message.
    b. Speak like a senior dev who genuinely wants the student to succeed.
    c. Conclude by re-iterating the importance of consistency over speed.

Rules reminder:
1. Do NOT use * or - bullets anywhere.
2. Use only numbers and letters for lists.
3. Keep the tone simple, human and premium at all times.

--- END OF PROMPT ---
`.trim();
};

const AiHelp = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navState = location.state as NavState;

  const [topic, setTopic] = useState("");
  const [week, setWeek] = useState("");
  const [weekTitle, setWeekTitle] = useState("");
  const [roadmapContext, setRoadmapContext] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const qTopic = searchParams.get("topic");
    if (qTopic) setTopic(qTopic);

    if (navState?.week) setWeek(navState.week);
    if (navState?.weekTitle) setWeekTitle(navState.weekTitle);
    if (navState?.roadmapContext) setRoadmapContext(navState.roadmapContext);

    if (navState?.roadmapContext) {
      setQuestion(
        "Explain this in very simple words like you are my senior friend. Give steps, examples and small motivation."
      );
    }
  }, [navState, searchParams]);

  const handleAsk = async () => {
    if (!GEMINI_API_KEY) {
      toast({
        title: "Gemini not configured",
        description:
          "VITE_GEMINI_API_KEY is missing. Add it in .env.local and restart.",
        variant: "destructive",
      });
      return;
    }

    if (!GEMINI_MODEL) {
      toast({
        title: "Gemini model missing",
        description:
          "VITE_GEMINI_MODEL is missing. Example: models/gemini-2.0-flash",
        variant: "destructive",
      });
      return;
    }

    if (!question.trim() && !roadmapContext.trim()) {
      toast({
        title: "Nothing to explain",
        description:
          "Type a question or make sure roadmap content is filled in.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAnswer(null);

    try {
      const prompt = buildPrompt(
        topic || "Not provided",
        week || "Not provided",
        weekTitle || "Not provided",
        roadmapContext || "No roadmap text provided.",
        question || "Explain this simply and tell me what to do next."
      );

      const url = `https://generativelanguage.googleapis.com/v1beta/${GEMINI_MODEL}:generateContent`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      if (!res.ok) {
        let errMsg = "Gemini API error";
        try {
          const errJson = await res.json();
          errMsg =
            errJson?.error?.message ||
            errJson?.error?.status ||
            JSON.stringify(errJson);
        } catch {
          const errText = await res.text();
          errMsg = errText || errMsg;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();

      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || "")
          .join("\n")
          .trim() || "No explanation received.";

      setAnswer(text);

      toast({
        title: "Explanation ready",
        description: "Scroll down to read your custom explanation.",
      });
    } catch (err: any) {
      setAnswer(
        `Could not get explanation.\n\n${typeof err?.message === "string"
          ? err.message
          : "Check DevTools for details."
        }`
      );
      toast({
        title: "Could not get explanation",
        description:
          typeof err?.message === "string"
            ? err.message
            : "See console for details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark">
      <div className="fixed inset-0 z-0 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12)_0%,rgba(0,0,0,0)_80%)]" />
        <div className="absolute inset-0 stars" />
        <ShootingStars starColor="#9E00FF" trailColor="#2EB9DF" />
        <ShootingStars starColor="#FF0099" trailColor="#FFB800" />
      </div>

      <main className="relative z-10 min-h-screen text-slate-100 overflow-hidden pt-20 pb-12">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">
                  SyncVerse · AI Mentor
                </div>
                <div className="text-xs text-white/40 -mt-0.5">
                  Context-aware explanations, tuned to your roadmap
                </div>
              </div>
            </div>

            <Link to="/premium">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-white/10 text-white/60 hover:text-white hover:border-white/20 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Premium
              </Button>
            </Link>
          </div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="mb-6"
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 mb-3 rounded-full px-3 py-1 glass text-[11px]"
            >
              <Sparkles className="h-4 w-4 text-violet-300" />
              <span>Context-aware, human-style explanations</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-3xl md:text-4xl font-bold mb-2 tracking-tight"
            >
              Get your roadmap explained like a friend on a call.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-sm md:text-base text-white/50 max-w-2xl"
            >
              Clear, simple explanations, action plans and real motivation — tuned to the exact week you're on.
            </motion.p>
          </motion.div>

          <Card className="glass-strong rounded-2xl p-6 md:p-8">
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3">
                  <Label className="text-xs text-white/50">
                    Topic / Track (optional)
                  </Label>
                  <Input
                    className="bg-white/[0.04] border-white/10 text-sm rounded-xl"
                    placeholder="e.g. Frontend with React, DSA in JS, ML with Python..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />

                  <Label className="text-xs text-white/50 mt-2">
                    Roadmap part you're stuck on
                  </Label>
                  <Textarea
                    className="bg-white/[0.04] border-white/10 text-sm min-h-[90px] rounded-xl"
                    placeholder="This is auto-filled when you click AI tutor from Premium, but you can also paste anything here."
                    value={roadmapContext}
                    onChange={(e) => setRoadmapContext(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs text-white/50">
                    Week (optional)
                  </Label>
                  <Input
                    className="bg-white/[0.04] border-white/10 text-sm rounded-xl"
                    placeholder="e.g. 3"
                    value={week}
                    onChange={(e) => setWeek(e.target.value)}
                  />

                  <Label className="text-xs text-white/50">
                    Week title (optional)
                  </Label>
                  <Input
                    className="bg-white/[0.04] border-white/10 text-sm rounded-xl"
                    placeholder="e.g. React State & Props"
                    value={weekTitle}
                    onChange={(e) => setWeekTitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-white/50">
                  What do you want help with?
                </Label>
                <Textarea
                  className="bg-white/[0.04] border-white/10 text-sm min-h-[100px] rounded-xl"
                  placeholder="e.g. Explain this in super simple words and tell me exactly what to do for the next 3 days."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <Button
                  className="px-6 py-2 bg-gradient-to-r from-cyan-400 to-violet-600 text-white text-sm flex items-center gap-2 rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all"
                  onClick={handleAsk}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Asking your AI mentor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Get explanation
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4">
                <Label className="text-xs text-white/50 mb-1 block">
                  AI mentor answer
                </Label>
                <div className="min-h-[160px] rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                  {answer ? (
                    answer
                  ) : (
                    <span className="text-white/30">
                      When you hit "Get explanation", your step-by-step
                      breakdown will appear here — with a 3-day
                      micro plan, a mini project and a motivation talk.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AiHelp;
