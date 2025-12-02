"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Sparkles,
  Code2,
  Bot,
  PhoneCall,
  Activity,
  Users,
  Rocket,
  Loader2,
  Mail,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const normalize = (text: string) =>
  text ? text.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim() : "";

const premiumPeers = [
  { id: 1, name: "Priya Sharma", city: "Mumbai", email: "priya@example.com", topic: "frontend react", lastActive: "5 hours ago" },
  { id: 2, name: "Rohan Mehta", city: "Delhi", email: "rohan@example.com", topic: "full stack js", lastActive: "1 day ago" },
  { id: 3, name: "Ananya Verma", city: "Bangalore", email: "ananya@example.com", topic: "machine learning", lastActive: "2 days ago" },
  { id: 4, name: "Harsh Raj", city: "Patna", email: "harsh@example.com", topic: "web development", lastActive: "3 hours ago" },
];

type Week = {
  week: string;
  title: string;
  details: string[];
  repos: string[];      // added
  projects: string[];   // added
  youtube: string[];    // added
  completed: boolean;
  projectLink: string;
  reflection: string;
};

/**
 * parseWeeks: Accepts free text OR JSON-like responses.
 * Enhanced to detect repos/projects/youtube lines in plaintext and also map structured JSON fields.
 */
const parseWeeks = (text?: string): Week[] => {
  if (!text || typeof text !== "string") return [];

  const trimmed = text.trim();

  // Helper: convert an array of objects / strings into Week[]
  const topicsToWeeks = (arr: Array<any>) => {
    return arr.map((s: any, idx: number) => {
      const title =
        s.section_title ??
        s.title ??
        (typeof s === "string" ? s.substring(0, 60) : `Week ${idx + 1}`);
      const weekNum =
        s.week ??
        (typeof s.section_title === "string" && (s.section_title.match(/week\s*(\d+)/i) || [])[1]) ??
        String(idx + 1);

      const details = Array.isArray(s.topics)
        ? s.topics.map((t: any) => String(t))
        : Array.isArray(s.details)
        ? s.details.map((d: any) => String(d))
        : typeof s.topics === "string"
        ? s.topics.split("\n").map((t: string) => t.trim()).filter(Boolean)
        : Array.isArray(s.details)
        ? s.details.map(String)
        : [];

      // Attempt to pull repos/projects/youtube if present in structured object
      const repos = s.repos ?? s.github ?? s.repo ?? [];
      const projects = s.projects ?? s.projectIdeas ?? s.tasks ?? [];
      const youtube = s.youtube ?? s.playlists ?? s.videos ?? [];

      return {
        week: String(weekNum),
        title: String(title),
        details,
        repos: Array.isArray(repos) ? repos.map(String) : typeof repos === "string" ? repos.split(",").map((r: string) => r.trim()).filter(Boolean) : [],
        projects: Array.isArray(projects) ? projects.map(String) : typeof projects === "string" ? projects.split(",").map((p: string) => p.trim()).filter(Boolean) : [],
        youtube: Array.isArray(youtube) ? youtube.map(String) : typeof youtube === "string" ? youtube.split(",").map((y: string) => y.trim()).filter(Boolean) : [],
        completed: false,
        projectLink: "",
        reflection: "",
      } as Week;
    });
  };

  // 1) JSON-ish detection and parsing
  if (/^[\[{]/.test(trimmed) || /"sections"\s*:|"\bweeks\b"\s*:|"repos"\s*:|"projects"\s*:|\"youtube\"/i.test(trimmed)) {
    let jsonSubstring = trimmed;
    try {
      const firstBrace = Math.min(
        ...["{", "["]
          .map((c) => {
            const i = trimmed.indexOf(c);
            return i === -1 ? Number.MAX_SAFE_INTEGER : i;
          })
          .filter((v) => v !== Number.MAX_SAFE_INTEGER)
      );
      if (firstBrace > 0 && firstBrace < trimmed.length) {
        jsonSubstring = trimmed.slice(firstBrace);
      }
    } catch {
      jsonSubstring = trimmed;
    }

    try {
      const parsed = JSON.parse(jsonSubstring);

      if (parsed?.sections && Array.isArray(parsed.sections)) {
        return topicsToWeeks(parsed.sections);
      }

      if (parsed?.weeks && Array.isArray(parsed.weeks)) {
        return topicsToWeeks(parsed.weeks);
      }

      if (Array.isArray(parsed)) {
        return topicsToWeeks(parsed);
      }

      if (Array.isArray(parsed?.choices)) {
        const choice = parsed.choices[0];
        const content = choice?.message?.content ?? choice?.text;
        if (typeof content === "string") {
          return parseWeeks(content);
        }
      }

      const maybeArray =
        parsed?.result ?? parsed?.data ?? parsed?.text ?? parsed?.content;
      if (maybeArray) {
        if (typeof maybeArray === "string") {
          try {
            const inner = JSON.parse(maybeArray);
            if (Array.isArray(inner)) return topicsToWeeks(inner);
            return parseWeeks(inner && typeof inner === "string" ? inner : JSON.stringify(inner));
          } catch {
            // fallback to text parsing
          }
        } else if (Array.isArray(maybeArray)) {
          return topicsToWeeks(maybeArray);
        }
      }
    } catch (err) {
      console.warn("parseWeeks JSON parse failed (premium), falling back to text parsing:", err);
      // fall through to text parsing
    }
  }

  // 2) Plain-text parsing: detect "Week X" blocks, and detect in-block lines for Repos:, Projects:, YouTube:
  const lines = trimmed.split("\n");
  const weeks: Week[] = [];
  let currentWeek: Week | null = null;

  const pushCurrent = () => {
    if (currentWeek) weeks.push(currentWeek);
    currentWeek = null;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    const weekMatch = line.match(/week\s*(\d+)\s*[:\-\.]?\s*(.*)/i);
    if (weekMatch) {
      if (currentWeek) pushCurrent();
      currentWeek = {
        week: weekMatch[1],
        title: (weekMatch[2] || `Week ${weekMatch[1]}`).trim(),
        details: [],
        repos: [],
        projects: [],
        youtube: [],
        completed: false,
        projectLink: "",
        reflection: "",
      };
      return;
    }

    if (!currentWeek && line) {
      // If there's no explicit week headings, treat short lines as separate weeks later
      // We collect them as ephemeral weeks below
      currentWeek = {
        week: String(weeks.length + 1),
        title: line,
        details: [],
        repos: [],
        projects: [],
        youtube: [],
        completed: false,
        projectLink: "",
        reflection: "",
      };
      pushCurrent();
      return;
    }

    if (currentWeek && line) {
      // Recognize structured prefixes
      if (/^(repos?:|github:)/i.test(line)) {
        const rest = line.replace(/^(repos?:|github:)\s*/i, "");
        const parts = rest.split(/,|;|\||\band\b/).map((p) => p.trim()).filter(Boolean);
        currentWeek.repos.push(...parts);
      } else if (/^(projects?:|project ideas:)/i.test(line)) {
        const rest = line.replace(/^(projects?:|project ideas:)\s*/i, "");
        const parts = rest.split(/,|;|\||\band\b/).map((p) => p.trim()).filter(Boolean);
        currentWeek.projects.push(...parts);
      } else if (/^(youtube:|playlists?:|videos?:)/i.test(line)) {
        const rest = line.replace(/^(youtube:|playlists?:|videos?:)\s*/i, "");
        const parts = rest.split(/,|;|\||\band\b/).map((p) => p.trim()).filter(Boolean);
        currentWeek.youtube.push(...parts);
      } else {
        // regular detail/bullet
        const cleaned = line.replace(/^[\-\*\•]\s*/, "").trim();
        if (cleaned) currentWeek.details.push(cleaned);
      }
    }
  });

  // push any remaining week if not already pushed
  if (currentWeek) pushCurrent();

  return weeks;
};

const Premium = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [currentKnowledge, setCurrentKnowledge] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [roadmapText, setRoadmapText] = useState<string | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const [peerSearch, setPeerSearch] = useState("");
  const [matchedPeers, setMatchedPeers] = useState(premiumPeers);

  const weekRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("premiumRoadmapProgress");
    if (saved) {
      try {
        setWeeks(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (weeks.length > 0) {
      localStorage.setItem("premiumRoadmapProgress", JSON.stringify(weeks));
      const completed = weeks.filter((w) => w.completed).length;
      setProgress((completed / weeks.length) * 100);
    } else setProgress(0);
  }, [weeks]);

  useEffect(() => {
    if (!peerSearch.trim()) {
      setMatchedPeers(premiumPeers);
      return;
    }
    const search = normalize(peerSearch);
    setMatchedPeers(
      premiumPeers.filter((p) => {
        const topicNorm = normalize(p.topic);
        return (
          topicNorm.includes(search) ||
          search.includes(topicNorm) ||
          topicNorm.split(" ").some((word) => search.includes(word)) ||
          normalize(p.city).includes(search) ||
          normalize(p.name).includes(search)
        );
      })
    );
  }, [peerSearch]);

  // PREMIUM: handleGenerate attempts to extract repos/projects/youtube from backend,
  // and synthesizes placeholders when missing so premium always shows richer content.
  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic required", description: "Please enter what you want to learn", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setWeeks([]);
    setRoadmapText(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-roadmap", {
        body: { topic, currentKnowledge, premium: true },
      });

      console.log("Supabase response:", { data, error });
      if (error) throw error;

      let maybe: any = data;

      // If supabase returns a string that is JSON
      if (typeof maybe === "string") {
        try {
          maybe = JSON.parse(maybe);
        } catch {
          // keep string if not JSON
        }
      }

      // Candidate extraction
      const candidates = [
        maybe?.roadmap,
        maybe?.result,
        maybe?.text,
        maybe?.data,
        maybe,
      ];

      let text: string | undefined;
      for (const c of candidates) {
        if (!c) continue;
        if (typeof c === "string" && c.trim()) {
          text = c;
          break;
        }
        if (typeof c === "object") {
          if (typeof c.content === "string" && c.content.trim()) {
            text = c.content;
            break;
          }
          if (Array.isArray((c as any).choices)) {
            const choice = (c as any).choices[0];
            const msg = choice?.message?.content || choice?.text;
            if (typeof msg === "string" && msg.trim()) {
              text = msg;
              break;
            }
          }
          // If object has sections / weeks directly, stringify for parseWeeks JSON path
          if (Array.isArray(c.sections) || Array.isArray(c.weeks) || Array.isArray(c)) {
            text = typeof c === "string" ? c : JSON.stringify(c);
            break;
          }
        }
      }

      // Last resort: if maybe is long string
      if (!text && maybe) {
        const str = typeof maybe === "string" ? maybe : JSON.stringify(maybe);
        if (str && str.trim().length > 0) {
          text = str;
        }
      }

      if (!text) {
        console.warn("No roadmap text found:", maybe);
        setRoadmapText("No roadmap returned from backend. Check console logs for Supabase response.");
        toast({
          title: "No roadmap returned",
          description: "Backend returned unexpected shape. Check console for 'Supabase response'.",
          variant: "destructive",
        });
        return;
      }

      setRoadmapText(text);

      let extracted = parseWeeks(text);

      // If parseWeeks returned nothing, synthesize a 6-week enriched plan with repos/projects/youtube placeholders
      if (!Array.isArray(extracted) || extracted.length === 0) {
        extracted = Array.from({ length: 6 }).map((_, i) => {
          const title = `${topic} — ${i === 0 ? "Foundations" : i === 1 ? "Core Concepts" : i === 2 ? "Hands-on" : i === 3 ? "Advanced Patterns" : i === 4 ? "Project" : "Wrap-up"}`;
          const slug = normalize(topic).replace(/\s+/g, "-") || "topic";
          return {
            week: String(i + 1),
            title,
            details: [
              `Key concepts to study during ${title}`,
              `Suggested focus areas & practice tasks`
            ],
            repos: [
              `https://github.com/your-org/${slug}-starter`,
              `https://github.com/your-org/${slug}-examples`,
            ],
            projects: [
              `Build a ${slug} demo app (mini)`,
              `Create a portfolio project demonstrating ${topic}`,
            ],
            youtube: [
              `https://www.youtube.com/playlist?list=PL_${slug}_${i + 1}`,
            ],
            completed: false,
            projectLink: "",
            reflection: "",
          } as Week;
        });
      } else {
        // Ensure repos/projects/youtube exist per week (placeholder if missing)
        extracted = extracted.map((w, idx) => {
          const slug = normalize(topic).replace(/\s+/g, "-") || "topic";
          const repos = Array.isArray(w.repos) && w.repos.length ? w.repos : [`https://github.com/your-org/${slug}-starter`];
          const projects = Array.isArray(w.projects) && w.projects.length ? w.projects : [`Mini project: ${w.title} demo`, `Portfolio idea: ${topic} ${idx + 1}`];
          const youtube = Array.isArray(w.youtube) && w.youtube.length ? w.youtube : [`https://www.youtube.com/playlist?list=PL_${slug}_${idx + 1}`];

          return {
            ...w,
            repos,
            projects,
            youtube,
            completed: !!w.completed,
            projectLink: w.projectLink ?? "",
            reflection: w.reflection ?? "",
          } as Week;
        });
      }

      // Deduplicate small things and limit to 24 weeks max
      const cleaned = extracted.slice(0, 24).map((w, idx) => ({
        ...w,
        week: String(idx + 1),
        title: String(w.title),
        details: Array.isArray(w.details) ? w.details : [],
        repos: Array.from(new Set((w.repos || []).map(String))).slice(0, 8),
        projects: Array.from(new Set((w.projects || []).map(String))).slice(0, 8),
        youtube: Array.from(new Set((w.youtube || []).map(String))).slice(0, 8),
      }));

      setWeeks(cleaned);

      toast({ title: "Premium roadmap ready 🚀", description: "An enriched roadmap (repos, projects, playlists) has been generated." });
    } catch (err) {
      console.error("Error generating premium roadmap:", err);
      toast({ title: "Error", description: "Failed to generate roadmap. Try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWeekCompletion = (index: number) => {
    setWeeks((prev) => {
      const wasCompletedBefore = prev[index]?.completed;
      const updated = prev.map((w, i) => (i === index ? { ...w, completed: !w.completed } : w));
      if (!wasCompletedBefore) {
        let targetIndex = updated.findIndex((w, i) => i > index && !w.completed);
        if (targetIndex === -1) targetIndex = updated.findIndex((w) => !w.completed);
        if (targetIndex !== -1) {
          setTimeout(() => {
            const el = weekRefs.current[targetIndex];
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 0);
        }
      }
      return updated;
    });
  };

  const handleProjectLinkChange = (index: number, value: string) =>
    setWeeks((prev) => prev.map((w, i) => (i === index ? { ...w, projectLink: value } : w)));

  const handleReflectionChange = (index: number, value: string) =>
    setWeeks((prev) => prev.map((w, i) => (i === index ? { ...w, reflection: value } : w)));

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const getAdaptiveMessage = () => {
    if (!weeks.length) return "Generate a roadmap to see adaptive suggestions.";
    if (progress < 35) return "Slow & steady. Focus on basics and consistency.";
    if (progress < 75) return "Balanced mode — add mini-projects occasionally.";
    return "Push mode — tackle advanced projects and open-source.";
  };

  useEffect(() => {
    const completed = weeks.filter((w) => w.completed).length;
    setProgress(weeks.length ? (completed / weeks.length) * 100 : 0);
  }, [weeks]);

  const nextActiveWeek = weeks.find((w) => !w.completed);

  const openTutor = (forWeek?: Week) => {
    const params = new URLSearchParams();
    if (topic) params.set("topic", topic);
    if (forWeek?.week) params.set("week", forWeek.week);
    if (forWeek?.title) params.set("title", forWeek.title);
    const roadmapContext = forWeek?.details?.join("\n") || `Week ${forWeek?.week || ""}: ${forWeek?.title || ""}`;
    navigate(`/aihelp?${params.toString()}`, { state: { topic, week: forWeek?.week, weekTitle: forWeek?.title, roadmapContext } });
  };

  const copyWeekToClipboard = async (week: Week) => {
    const text = [
      `Week ${week.week}: ${week.title}`,
      "",
      ...week.details,
      "",
      week.repos && week.repos.length ? `Repos:\n${week.repos.join("\n")}` : "",
      week.projects && week.projects.length ? `Projects:\n${week.projects.join("\n")}` : "",
      week.youtube && week.youtube.length ? `YouTube/Playlists:\n${week.youtube.join("\n")}` : "",
      "",
      week.projectLink ? `Project link: ${week.projectLink}` : "",
      week.reflection ? `Reflection: ${week.reflection}` : ""
    ].filter(Boolean).join("\n\n").trim();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied ✅", description: `Week ${week.week} roadmap copied.` });
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast({ title: "Copied ✅", description: `Week ${week.week} roadmap copied.` });
      }
    } catch (err) {
      console.error("Copy failed:", err);
      toast({ title: "Copy failed", description: "Could not copy this week.", variant: "destructive" });
    }
  };

  return (
    <div className="dark">
      {/* BACKGROUND */}
      <div className="fixed inset-0 z-0 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,rgba(0,0,0,0)_80%)]" />
        <div className="absolute inset-0 stars" />
        <ShootingStars starColor="#9E00FF" trailColor="#2EB9DF" minSpeed={15} maxSpeed={35} minDelay={1000} maxDelay={3000} />
        <ShootingStars starColor="#FF0099" trailColor="#FFB800" minSpeed={10} maxSpeed={25} minDelay={2000} maxDelay={4000} />
        <ShootingStars starColor="#00FF9E" trailColor="#00B8FF" minSpeed={20} maxSpeed={40} minDelay={1500} maxDelay={3500} />
      </div>

      <main className="relative z-10 min-h-screen text-slate-100 overflow-hidden">
        {/* TOP BAR */}
        <header className="pt-6 pb-4">
          <div className="container mx-auto px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-gradient-to-br from-[#00E5FF] to-[#6C33FF]">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-extrabold">SyncVerse Premium</div>
                <div className="text-xs text-white/50 -mt-1">For builders who are serious.</div>
              </div>
            </div>

            <Link to="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2 border-white/20 text-white/80">
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Button>
            </Link>
          </div>
        </header>

        {/* HERO + SUMMARY */}
        <section className="pb-10 pt-4">
          <div className="container mx-auto px-6">
            <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
              <motion.div variants={fadeUp} className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-violet-300" />
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-200/80">Premium experience</p>
              </motion.div>

              <motion.h1 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-3">
                The version of SyncVerse that feels{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#A855F7]">alive and learning with you.</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-white/70 max-w-3xl mb-6">
                Premium gives you the best roadmaps with everything included, an AI tutor that feels like a human on call, a deeply smart coding chatbot, and a weekly system that tracks your reality and updates your roadmap to match it.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-wrap gap-3 items-center mb-8">
                <Button className="px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] text-black">Get Premium Access</Button>
                <p className="text-xs text-white/60">Early access · Features roll out in phases · Limited seats for serious devs.</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FEATURE GRID 1 */}
        <section className="pb-8">
          <div className="container mx-auto px-6">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
              <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-semibold mb-2">All-in-one roadmaps and AI that actually thinks.</motion.h2>
              <motion.p variants={fadeUp} className="text-white/70 max-w-3xl mb-6">
                Not just a list of topics. Premium builds a complete learning system around you — content, projects, revision, feedback, accountability and adaptation.
              </motion.p>

              <motion.div variants={fadeUp} className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Best roadmaps */}
                <Card className="relative p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Code2 className="h-5 w-5 text-cyan-300" />
                    <div>
                      <h3 className="font-semibold text-lg">Best roadmaps, fully loaded</h3>
                      <p className="text-xs text-white/60">Every detail included</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">Roadmaps with everything: concepts, videos, articles, hands-on tasks, revision blocks, mock interviews and deep-dive phases for when you&apos;re ready.</p>
                </Card>

                {/* AI live on-call tutor */}
                <Card className="relative p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <PhoneCall className="h-5 w-5 text-emerald-300" />
                    <div>
                      <h3 className="font-semibold text-lg">AI tutor, live on call</h3>
                      <p className="text-xs text-white/60">Doubts don’t wait</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">
                    When you're stuck, Premium feels like having a senior dev on call.
                    Step-by-step help, code walkthroughs, bug explanations — not just “read docs”.
                  </p>
                </Card>

                {/* Human-like chatbot */}
                <Card className="relative p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Bot className="h-5 w-5 text-pink-300" />
                    <div>
                      <h3 className="font-semibold text-lg">Chatbot with emotions & context</h3>
                      <p className="text-xs text-white/60">Less bot, more teammate</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">
                    A coding chatbot that knows your stack, your past questions, your goals — 
                    and responds like a human teammate.
                  </p>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FEATURE GRID 2 */}
        <section className="pb-10">
          <div className="container mx-auto px-6">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            >
              <motion.h2
                variants={fadeUp}
                className="text-2xl md:text-3xl font-semibold mb-2"
              >
                Vibe coding, real progress tracking, adaptive roadmap.
              </motion.h2>

              <motion.p variants={fadeUp} className="text-white/70 max-w-3xl mb-6">
                Learn in public with your squad, push projects every week, and
                let the system adjust to your speed.
              </motion.p>

              <motion.div variants={fadeUp} className="grid md:grid-cols-3 gap-6 mb-10">
                {/* Vibe coding */}
                <Card className="relative p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="h-5 w-5 text-sky-300" />
                    <div>
                      <h3 className="font-semibold text-lg">Vibe coding with friends</h3>
                      <p className="text-xs text-white/60">Squad-based roadmaps</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">
                    Form squads, share same roadmap, see each other’s % and push each other to ship.
                  </p>
                </Card>

                {/* Weekly projects */}
                <Card className="relative p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Activity className="h-5 w-5 text-amber-300" />
                    <div>
                      <h3 className="font-semibold text-lg">Weekly projects & acts</h3>
                      <p className="text-xs text-white/60">Directly from your roadmap</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">
                    Every week, focused tasks and mini-projects built from your roadmap.
                  </p>
                </Card>

                {/* Adaptive roadmap */}
                <Card className="relative p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Rocket className="h-5 w-5 text-violet-300" />
                    <div>
                      <h3 className="font-semibold text-lg">Weekly record & smart roadmap</h3>
                      <p className="text-xs text-white/60">Adapts to your reality</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">
                    Each week adapts based on what you actually completed.
                  </p>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* PREMIUM WORKSPACE */}
        <section className="pb-14">
          <div className="container mx-auto px-6">
            <Card className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="flex flex-col gap-8">
                
                {/* Title Bar */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold mb-1">Premium workspace</h2>
                    <p className="text-sm text-white/70">
                      Your roadmap, weekly reality, AI tutor and vibe squad — all in one.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    Beta mode · evolving continuously
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">

                  {/* Column 1 — Generate Roadmap */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white/80 mb-1">
                      1. Generate your premium roadmap
                    </h3>

                    {/* Topic Input */}
                    <div>
                      <Label className="text-xs text-white/70">What do you want to learn?</Label>
                      <Input
                        className="mt-1 bg-black/40 border-white/20 text-sm"
                        placeholder="e.g. Frontend + System Design"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyDown={handleKeyPress}
                      />
                    </div>

                    {/* Knowledge Input */}
                    <div>
                      <Label className="text-xs text-white/70">What do you already know?</Label>
                      <Textarea
                        className="mt-1 bg-black/40 border-white/20 text-sm min-h-[80px]"
                        placeholder="e.g. I know HTML/CSS and some JS..."
                        value={currentKnowledge}
                        onChange={(e) => setCurrentKnowledge(e.target.value)}
                        onKeyDown={handleKeyPress}
                      />
                    </div>

                    {/* Generate Button */}
                    <Button
                      className="mt-2 px-5 py-2 bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] text-black text-sm flex items-center gap-2"
                      onClick={handleGenerate}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate Premium Roadmap
                        </>
                      )}
                    </Button>

                    {/* Raw Text Output */}
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-white/70 mb-1">Raw roadmap text</h4>
                      <div className="min-h-[120px] max-h-[180px] overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/70 whitespace-pre-wrap">
                        {roadmapText ? roadmapText : (
                          <span className="text-white/40">
                            After generation, the full roadmap text appears here.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column 2 — Weeks */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white/80 mb-1">
                      2. Weekly plan, reflections & AI tutor
                    </h3>

                    {/* Progress */}
                    <div className="mb-2">
                      <Label className="text-xs text-white/70">Overall progress</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={progress} className="h-2" />
                        <span className="text-xs text-white/70 w-10 text-right">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>

                    {/* Active Week Card */}
                    {nextActiveWeek && (
                      <Card className="bg-black/40 border border-white/10 p-3 mb-2">
                        <p className="text-xs text-white/60 mb-1">This week's active focus</p>
                        <p className="text-sm font-semibold">
                          Week {nextActiveWeek.week}: {nextActiveWeek.title}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 h-7 text-[11px] px-2"
                          onClick={() => openTutor(nextActiveWeek)}
                        >
                          Talk to AI tutor about this week
                        </Button>
                      </Card>
                    )}

                    {/* Expandable Weekly Breakdown */}
                    <Card
                      className="bg-black/40 border border-white/10 cursor-pointer"
                      onClick={() => setExpanded(!expanded)}
                    >
                      <div className="flex items-center justify-between px-3 py-2">
                        <p className="text-xs font-semibold text-white/80">
                          Weekly breakdown & reflections
                        </p>
                        {expanded ? (
                          <ChevronUp className="h-4 w-4 text-white/60" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-white/60" />
                        )}
                      </div>

                      {expanded && (
                        <div className="px-3 pb-3 space-y-3">
                          {!weeks.length && (
                            <p className="text-xs text-white/50">
                              Generate a roadmap to see weekly tasks.
                            </p>
                          )}

                          {weeks.map((week, i) => (
                            <div
                              key={i}
                              ref={(el) => (weekRefs.current[i] = el)}
                              className="border border-white/10 rounded-lg p-3 space-y-2"
                            >
                              {/* Week Header */}
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs font-semibold">
                                    Week {week.week}: {week.title}
                                  </p>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-2 flex-wrap">
                                  <Button size="sm" variant="outline"
                                    className="h-7 text-[11px] px-2"
                                    onClick={(e) => { e.stopPropagation(); openTutor(week); }}
                                  >
                                    Ask AI tutor
                                  </Button>

                                  <Button size="sm" variant="outline"
                                    className="h-7 text-[11px] px-2"
                                    onClick={(e) => { e.stopPropagation(); copyWeekToClipboard(week); }}
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy week
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant={week.completed ? "default" : "outline"}
                                    className="h-7 text-[11px] px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleWeekCompletion(i);
                                    }}
                                  >
                                    {week.completed ? "Completed ✅" : "Mark done"}
                                  </Button>
                                </div>
                              </div>

                              {/* Details */}
                              <ul className="list-disc ml-4 text-[11px] text-white/70">
                                {week.details.map((d, j) => (
                                  <li key={j}>{d}</li>
                                ))}
                              </ul>

                              {/* Premium extras: repos */}
                              {Array.isArray(week.repos) && week.repos.length > 0 && (
                                <div className="mb-2">
                                  <div className="text-sm font-semibold">Recommended GitHub Repos</div>
                                  <ul className="ml-6 text-sm">
                                    {week.repos.map((r, idx) => (
                                      <li key={idx}>
                                        <a href={r} target="_blank" rel="noreferrer" className="underline">
                                          {r}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Premium extras: projects */}
                              {Array.isArray(week.projects) && week.projects.length > 0 && (
                                <div className="mb-2">
                                  <div className="text-sm font-semibold">Project Suggestions</div>
                                  <ul className="ml-6 text-sm">
                                    {week.projects.map((p, idx) => (
                                      <li key={idx}>{p}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Premium extras: youtube */}
                              {Array.isArray(week.youtube) && week.youtube.length > 0 && (
                                <div className="mb-2">
                                  <div className="text-sm font-semibold">YouTube / Playlists</div>
                                  <ul className="ml-6 text-sm">
                                    {week.youtube.map((y, idx) => (
                                      <li key={idx}>
                                        <a href={y} target="_blank" rel="noreferrer" className="underline">
                                          {y}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Project Link */}
                              <Input
                                className="bg-black/50 border-white/20 text-[11px]"
                                placeholder="Paste project/demo link"
                                value={week.projectLink}
                                onChange={(e) =>
                                  handleProjectLinkChange(i, e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                              />

                              {/* Reflection */}
                              <Textarea
                                className="bg-black/50 border-white/20 text-[11px] min-h-[60px] mt-1"
                                placeholder="Reflection: What did you do this week?"
                                value={week.reflection}
                                onChange={(e) => handleReflectionChange(i, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    {/* Adaptive Suggestion */}
                    <Card className="bg-black/40 border border-white/10 p-3">
                      <p className="text-xs font-semibold text-white/80 mb-1">
                        Adaptive roadmap suggestion
                      </p>
                      <p className="text-[11px] text-white/70">{getAdaptiveMessage()}</p>
                    </Card>
                  </div>

                  {/* Column 3 — Vibe Squad */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white/80 mb-1">
                      3. Vibe coding squad (preview)
                    </h3>

                    <Label className="text-xs text-white/70">
                      Search people by topic, name or city
                    </Label>

                    <Input
                      className="mt-1 bg-black/40 border-white/20 text-sm"
                      placeholder="e.g. react, full stack, delhi..."
                      value={peerSearch}
                      onChange={(e) => setPeerSearch(e.target.value)}
                    />

                    <div className="mt-2 space-y-2 max-h-[230px] overflow-y-auto">
                      {!matchedPeers.length && (
                        <p className="text-xs text-white/50">
                          No matches yet.
                        </p>
                      )}

                      {matchedPeers.map((p) => (
                        <Card key={p.id} className="bg-black/40 border border-white/10 p-3">
                          <p className="text-sm font-semibold">{p.name}</p>
                          <p className="text-xs text-white/60">{p.city}</p>
                          <p className="text-[11px] text-white/60 mt-1">Learning: {p.topic}</p>
                          <p className="text-[10px] text-white/40">Last active: {p.lastActive}</p>

                          <div className="flex items-center gap-2 text-[11px] text-white/60 mt-1">
                            <Mail className="h-3 w-3" />
                            <span>{p.email}</span>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 h-7 text-[11px] px-2"
                            onClick={() => openTutor()}
                          >
                            💬 Ask AI to plan session
                          </Button>
                        </Card>
                      ))}
                    </div>

                    <p className="text-[11px] text-white/50">
                      Later this connects to real squads, live rooms, and weekly accountability.
                    </p>
                  </div>

                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-10">
          <div className="container mx-auto px-6 text-center text-xs text-white/50">
            © {new Date().getFullYear()} SyncVerse Premium · Built for devs who actually ship.
          </div>
        </footer>
      </main>

      {/* BACKGROUND STAR FIELD STYLE */}
      <style>{`
        .stars {
          background-image:
            radial-gradient(2px 2px at 20px 30px, #fff, transparent),
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
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default Premium;
