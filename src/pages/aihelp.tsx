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

// Env vars (no quotes in .env.local)
// VITE_GEMINI_API_KEY=...
// VITE_GEMINI_MODEL=models/gemini-2.0-flash   (or whatever you use)
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

  // Prefill context coming from Premium page
  useEffect(() => {
    const qTopic = searchParams.get("topic");
    if (qTopic) setTopic(qTopic);

    if (navState?.week) setWeek(navState.week);
    if (navState?.weekTitle) setWeekTitle(navState.weekTitle);
    if (navState?.roadmapContext) setRoadmapContext(navState.roadmapContext);

    // If user came from a specific week, prefill a default question
    if (navState?.roadmapContext) {
      setQuestion(
        "Explain this in very simple words like you are my senior friend. Give steps, examples and small motivation."
      );
    }
  }, [navState, searchParams]);

  const buildPrompt = () => {
    return `
You are a PREMIUM human-like coding mentor inside a product called SyncVerse Premium.

Your style:
1. Talk like a friendly senior dev helping a junior.
2. Super simple language. No big fancy words.
3. You explain like to a 12–15 year old who is smart but new to tech.
4. You are honest, motivating and practical.

Formatting rules (VERY IMPORTANT):
1. Do NOT use * or - bullet points.
2. Use only numbered points like 1, 2, 3 and lettered points like a, b, c.
3. No Markdown bullet lists. No * at the start of lines.
4. Keep paragraphs short. No giant walls of text.

Context you know:

1. Topic / Track:
   ${topic || "Not provided"}

2. Week info:
   a. Week number: ${week || "Not provided"}
   b. Week title: ${weekTitle || "Not provided"}

3. Roadmap content:
${roadmapContext || "No specific roadmap text provided."}

4. Student question:
${question || "Explain this simply and tell me what to do next."}

How to answer (follow this structure exactly):

1. Simple breakdown
   a. In 2–3 lines, explain what this topic / week is really about in very simple English.
   b. Pretend you are explaining to your younger sibling.

2. Why this matters for you
   a. Explain how this will help in real projects, jobs or internships.
   b. Keep it practical, not textbook style.

3. Real-life style example
   a. Give one simple example from real life or apps (like Instagram, Zomato, Swiggy, YouTube etc.) that connects to this topic.
   b. Explain this example in 2–4 lines.

4. 3-day micro plan
   Day 1: Very small, focused tasks the student can do today.
   Day 2: Slightly deeper tasks + 1 tiny challenge.
   Day 3: Final practice, revision + one small stretch goal.

5. Tiny project idea
   a. Name of project (1 short line).
   b. What the project does (2–3 lines).
   c. Exact steps to start building it.

6. Motivation boost
   a. Encourage the student in 2–4 lines.
   b. Be real: talk about consistency, small wins and that it’s okay to be slow.
   c. Make it feel like a human is cheering for them, not a robot.

Remember:
1. No * bullets.
2. Use only 1,2,3 and a,b,c style.
3. Stay kind, real and premium in tone.
    `.trim();
  };

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
      const prompt = buildPrompt();

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
          console.error("Gemini error JSON:", errJson);
          errMsg =
            errJson?.error?.message ||
            errJson?.error?.status ||
            JSON.stringify(errJson);
        } catch {
          const errText = await res.text();
          console.error("Gemini error TEXT:", errText);
          errMsg = errText || errMsg;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      console.log("Gemini response:", data);

      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || "")
          .join("\n")
          .trim() || "No explanation received.";

      setAnswer(text);

      toast({
        title: "Premium AI mentor answered ✨",
        description: "Scroll down to read your custom explanation.",
      });
    } catch (err: any) {
      console.error("AI helper error:", err);
      setAnswer(
        `❌ AI could not get explanation.\n\n${
          typeof err?.message === "string"
            ? err.message
            : "Check DevTools → Network → last Gemini request for full details."
        }`
      );
      toast({
        title: "AI could not get explanation",
        description:
          typeof err?.message === "string"
            ? err.message
            : "See console for full Gemini error.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark">
      {/* BACKGROUND */}
      <div className="fixed inset-0 z-0 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12)_0%,rgba(0,0,0,0)_80%)]" />
        <div className="absolute inset-0 stars" />
        <ShootingStars starColor="#9E00FF" trailColor="#2EB9DF" />
        <ShootingStars starColor="#FF0099" trailColor="#FFB800" />
      </div>

      <main className="relative z-10 min-h-screen text-slate-100 overflow-hidden pt-20 pb-12">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-gradient-to-br from-[#00E5FF] to-[#6C33FF]">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-extrabold">
                  SyncVerse · Premium AI Mentor
                </div>
                <div className="text-xs text-white/60 -mt-1">
                  Feels like a human senior dev, not a chatbot.
                </div>
              </div>
            </div>

            <Link to="/premium">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-white/20 text-white/80"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Premium
              </Button>
            </Link>
          </div>

          {/* Header */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="mb-6"
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 mb-3 rounded-full px-3 py-1 bg-white/5 border border-white/10 text-[11px]"
            >
              <Sparkles className="h-4 w-4 text-violet-300" />
              <span>Context-aware, human-style explanations</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-3xl md:text-4xl font-bold mb-2"
            >
              Get your roadmap explained like a friend on a call.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-sm md:text-base text-white/70 max-w-2xl"
            >
              No robotic answers. Just clear, simple explanations, tiny action
              plans and real motivation — tuned to the exact week you&apos;re on.
            </motion.p>
          </motion.div>

          {/* Main card */}
          <Card className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
            <div className="space-y-6">
              {/* Context inputs */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3">
                  <Label className="text-xs text-white/70">
                    Topic / Track (optional)
                  </Label>
                  <Input
                    className="bg-black/40 border-white/20 text-sm"
                    placeholder="e.g. Frontend with React, DSA in JS, ML with Python…"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />

                  <Label className="text-xs text-white/70 mt-2">
                    Roadmap part you&apos;re stuck on
                  </Label>
                  <Textarea
                    className="bg-black/40 border-white/20 text-sm min-h-[90px]"
                    placeholder="This is auto-filled when you click AI tutor from Premium, but you can also paste anything here."
                    value={roadmapContext}
                    onChange={(e) => setRoadmapContext(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs text-white/70">
                    Week (optional)
                  </Label>
                  <Input
                    className="bg-black/40 border-white/20 text-sm"
                    placeholder="e.g. 3"
                    value={week}
                    onChange={(e) => setWeek(e.target.value)}
                  />

                  <Label className="text-xs text-white/70">
                    Week title (optional)
                  </Label>
                  <Input
                    className="bg-black/40 border-white/20 text-sm"
                    placeholder="e.g. React State & Props"
                    value={weekTitle}
                    onChange={(e) => setWeekTitle(e.target.value)}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="space-y-2">
                <Label className="text-xs text-white/70">
                  What do you want help with?
                </Label>
                <Textarea
                  className="bg-black/40 border-white/20 text-sm min-h-[100px]"
                  placeholder="e.g. Explain this in super simple words and tell me exactly what to do for the next 3 days."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>

              {/* Action button */}
              <div className="flex items-center justify-between gap-4">
                <Button
                  className="px-6 py-2 bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] text-black text-sm flex items-center gap-2 rounded-full shadow-[0_0_25px_rgba(129,140,248,0.45)]"
                  onClick={handleAsk}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Asking your AI mentor…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Get premium explanation
                    </>
                  )}
                </Button>
                
              </div>

              {/* Answer box */}
              <div className="mt-4">
                <Label className="text-xs text-white/70 mb-1 block">
                  AI mentor answer
                </Label>
                <div className="min-h-[160px] rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                  {answer ? (
                    answer
                  ) : (
                    <span className="text-white/40">
                      When you hit “Get premium explanation”, your step-by-step,
                      human-style breakdown will appear here — with a tiny
                      3-day plan and a project idea.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      <style jsx>{`
        .stars {
          background-image: radial-gradient(2px 2px at 20px 30px, #fff, transparent),
            radial-gradient(2px 2px at 40px 70px, #fff, transparent),
            radial-gradient(2px 2px at 50px 160px, #fff, transparent),
            radial-gradient(2px 2px at 90px 40px, #fff, transparent),
            radial-gradient(2px 2px at 130px 80px, #fff, transparent),
            radial-gradient(2px 2px at 160px 120px, #fff, transparent);
          background-repeat: repeat;
          background-size: 200px 200px;
          animation: twinkle 5s ease-in-out infinite;
          opacity: 0.5;
        }
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default AiHelp;
