"use client";
import React, { useState, useEffect } from "react";
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
  Copy, // 👈 added
} from "lucide-react";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const normalize = (text: string) =>
  text.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();

// Smaller peer sample for premium vibe squads (you can expand later)
const premiumPeers = [
  {
    id: 1,
    name: "Priya Sharma",
    city: "Mumbai",
    email: "priya.sharma@email.com",
    topic: "frontend react",
    lastActive: "5 hours ago",
  },
  {
    id: 2,
    name: "Rohan Mehta",
    city: "Delhi",
    email: "rohan.mehta@email.com",
    topic: "full stack js",
    lastActive: "1 day ago",
  },
  {
    id: 3,
    name: "Ananya Verma",
    city: "Bangalore",
    email: "ananya.verma@email.com",
    topic: "machine learning",
    lastActive: "2 days ago",
  },
  {
    id: 4,
    name: "Harsh Raj",
    city: "Patna",
    email: "harsh.raj@email.com",
    topic: "web development",
    lastActive: "3 hours ago",
  },
];

type Week = {
  week: string;
  title: string;
  details: string[];
  completed: boolean;
  projectLink: string;
  reflection: string;
};

const parseWeeks = (text: string): Week[] => {
  const lines = text.split("\n");
  const weeks: Week[] = [];
  let currentWeek: Week | null = null;

  lines.forEach((line) => {
    const weekMatch = line.match(/week\s*(\d+):?\s*(.*)/i);
    if (weekMatch) {
      if (currentWeek) weeks.push(currentWeek);
      currentWeek = {
        week: weekMatch[1],
        title: weekMatch[2] || "Untitled",
        details: [],
        completed: false,
        projectLink: "",
        reflection: "",
      };
    } else if (currentWeek && line.trim() !== "") {
      currentWeek.details.push(line.trim());
    }
  });

  if (currentWeek) weeks.push(currentWeek);
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

  // Load saved premium progress (separate from free)
  useEffect(() => {
    const saved = localStorage.getItem("premiumRoadmapProgress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Week[];
        setWeeks(parsed);
      } catch {
        // ignore invalid
      }
    }
  }, []);

  // Save + compute progress
  useEffect(() => {
    if (weeks.length > 0) {
      localStorage.setItem("premiumRoadmapProgress", JSON.stringify(weeks));
      const completed = weeks.filter((w) => w.completed).length;
      setProgress((completed / weeks.length) * 100);
    } else {
      setProgress(0);
    }
  }, [weeks]);

  // Peer search for vibe squads
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

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter what you want to learn",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setWeeks([]);
    setRoadmapText(null);

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-roadmap",
        {
          body: { topic, currentKnowledge, premium: true },
        }
      );

      if (error) throw error;
      if ((data as any).error) {
        toast({
          title: "Error",
          description: (data as any).error,
          variant: "destructive",
        });
        return;
      }

      const text = (data as any).roadmap as string;
      setRoadmapText(text || "");
      const extracted = parseWeeks(text);
      setWeeks(extracted);

      toast({
        title: "Premium roadmap ready 🚀",
        description: "You now have a weekly plan + smart tracking.",
      });
    } catch (err) {
      console.error("Error generating premium roadmap:", err);
      toast({
        title: "Error",
        description: "Failed to generate roadmap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWeekCompletion = (index: number) => {
    setWeeks((prev) =>
      prev.map((w, i) => (i === index ? { ...w, completed: !w.completed } : w))
    );
  };

  const handleProjectLinkChange = (index: number, value: string) => {
    setWeeks((prev) =>
      prev.map((w, i) => (i === index ? { ...w, projectLink: value } : w))
    );
  };

  const handleReflectionChange = (index: number, value: string) => {
    setWeeks((prev) =>
      prev.map((w, i) => (i === index ? { ...w, reflection: value } : w))
    );
  };

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const getAdaptiveMessage = () => {
    if (!weeks.length) return "Generate a roadmap to see adaptive suggestions.";

    if (progress < 35)
      return "You’re in slow & steady mode. Repeat core weeks, focus on basics and consistency instead of speed.";
    if (progress < 75)
      return "You’re in balanced mode. Keep this pace, and add 1 extra mini-project every 2 weeks.";
    return "You’re in push mode. Time to tackle advanced projects, open source issues, or internships alongside your roadmap.";
  };

  const nextActiveWeek = weeks.find((w) => !w.completed);

  // 🔥 Send user to /aihelp where Gemini tutor runs
  const openTutor = (forWeek?: Week) => {
    const params = new URLSearchParams();
    if (topic) params.set("topic", topic);
    if (forWeek?.week) params.set("week", forWeek.week);
    if (forWeek?.title) params.set("title", forWeek.title);

    // also send roadmap context as state
    const roadmapContext =
      forWeek?.details?.join("\n") ||
      `Week ${forWeek?.week || ""}: ${forWeek?.title || ""}`;
    navigate(`/aihelp?${params.toString()}`, {
      state: {
        topic,
        week: forWeek?.week,
        weekTitle: forWeek?.title,
        roadmapContext,
      },
    });
  };

  // ✨ Copy week roadmap text to clipboard
  const copyWeekToClipboard = async (week: Week) => {
    const text = [
      `Week ${week.week}: ${week.title}`,
      "",
      ...week.details,
      "",
      week.projectLink ? `Project link: ${week.projectLink}` : "",
      week.reflection ? `Reflection: ${week.reflection}` : "",
    ]
      .join("\n")
      .trim();

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
        toast({
          title: "Copied ✅",
          description: `Week ${week.week} roadmap copied to clipboard.`,
        });
      } else {
        // Fallback
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        toast({
          title: "Copied ✅",
          description: `Week ${week.week} roadmap copied to clipboard.`,
        });
      }
    } catch (err) {
      console.error("Copy failed:", err);
      toast({
        title: "Copy failed",
        description: "Could not copy this week. Try manually selecting the text.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="dark">
      {/* BACKGROUND */}
      <div className="fixed inset-0 z-0 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,rgba(0,0,0,0)_80%)]" />
        <div className="absolute inset-0 stars" />
        <ShootingStars
          starColor="#9E00FF"
          trailColor="#2EB9DF"
          minSpeed={15}
          maxSpeed={35}
          minDelay={1000}
          maxDelay={3000}
        />
        <ShootingStars
          starColor="#FF0099"
          trailColor="#FFB800"
          minSpeed={10}
          maxSpeed={25}
          minDelay={2000}
          maxDelay={4000}
        />
        <ShootingStars
          starColor="#00FF9E"
          trailColor="#00B8FF"
          minSpeed={20}
          maxSpeed={40}
          minDelay={1500}
          maxDelay={3500}
        />
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
                <div className="text-xs text-white/50 -mt-1">
                  For builders who are serious.
                </div>
              </div>
            </div>

            <Link to="/">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-white/20 text-white/80"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Button>
            </Link>
          </div>
        </header>

        {/* HERO + SUMMARY */}
        <section className="pb-10 pt-4">
          <div className="container mx-auto px-6">
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            >
              <motion.div
                variants={fadeUp}
                className="flex items.center gap-2 mb-3"
              >
                <Sparkles className="h-5 w-5 text-violet-300" />
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-200/80">
                  Premium experience
                </p>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="text-3xl md:text-4xl font-bold mb-3"
              >
                The version of SyncVerse that feels{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#A855F7]">
                  alive and learning with you.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-white/70 max-w-3xl mb-6"
              >
                Premium gives you the best roadmaps with everything included,
                an AI tutor that feels like a human on call, a deeply smart
                coding chatbot, and a weekly system that tracks your reality
                and updates your roadmap to match it.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-wrap gap-3 items-center mb-8"
              >
                <Button className="px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] text.black">
                  Get Premium Access
                </Button>
                <p className="text-xs text-white/60">
                  Early access · Features roll out in phases · Limited seats for
                  serious devs.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FEATURE GRID 1 */}
        <section className="pb-8">
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
                All-in-one roadmaps and AI that actually thinks.
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="text-white/70 max-w-3xl mb-6"
              >
                Not just a list of topics. Premium builds a complete learning
                system around you — content, projects, revision, feedback,
                accountability and adaptation.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="grid md:grid-cols-3 gap-6 mb-8"
              >
                {/* Best roadmaps */}
                <Card className="relative p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Code2 className="h-5 w-5 text-cyan-300" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        Best roadmaps, fully loaded
                      </h3>
                      <p className="text-xs text-white/60">
                        Every detail included
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">
                    Roadmaps with everything: concepts, videos, articles,
                    hands-on tasks, revision blocks, mock interviews and
                    deep-dive phases for when you&apos;re ready.
                  </p>
                </Card>

                {/* AI live on-call tutor */}
                <Card className="relative p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <PhoneCall className="h-5 w-5 text-emerald-300" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        AI tutor, live on call
                      </h3>
                      <p className="text-xs text-white/60">
                        Doubts don&apos;t wait
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">
                    When you&apos;re stuck, Premium feels like having a senior
                    dev on call. Step-by-step help, code walkthroughs, bug
                    explanations — not just &quot;here&apos;s the docs&quot;.
                  </p>
                </Card>

                {/* Human-like chatbot */}
                <Card className="relative p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Bot className="h-5 w-5 text-pink-300" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        Chatbot with emotions & context
                      </h3>
                      <p className="text-xs text-white/60">
                        Less bot, more teammate
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">
                    A coding chatbot that knows your stack, your past questions,
                    your goals — and responds like a human teammate:
                    encouraging, honest and sometimes brutally real about your
                    consistency.
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
              <motion.p
                variants={fadeUp}
                className="text-white/70 max-w-3xl mb-6"
              >
                Learn in public with your squad, push projects every week, and
                let the system adjust to your speed instead of making you feel
                guilty.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="grid md:grid-cols-3 gap-6 mb-10"
              >
                {/* Vibe coding with friends */}
                <Card className="relative p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="h-5 w-5 text-sky-300" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        Vibe coding with friends
                      </h3>
                      <p className="text-xs text.white/60">
                        Squad-based Synced Roadmaps
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text.white/70">
                    Form squads, share the same roadmap, and see each
                    other&apos;s completion %. Push each other on days you feel
                    lazy and celebrate when everyone ships.
                  </p>
                </Card>

                {/* Weekly projects aligned to roadmap */}
                <Card className="relative p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Activity className="h-5 w-5 text-amber-300" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        Weekly projects & acts
                      </h3>
                      <p className="text-xs text-white/60">
                        Directly from your roadmap
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text.white/70">
                    Every week, you get focused tasks and mini-projects built
                    from your roadmap. Less watching, more doing — and a growing
                    portfolio by default.
                  </p>
                </Card>

                {/* Weekly record + auto roadmap update */}
                <Card className="relative p-6 bg-white/5 border border-white/10 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <Rocket className="h-5 w-5 text-violet-300" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        Weekly record & smart roadmap
                      </h3>
                      <p className="text-xs text.white/60">
                        Adapts to your reality
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text.white/70">
                    At the end of each week, Premium records what you actually
                    did. Next week&apos;s roadmap updates — slowing down, adding
                    revision, or pushing harder based on your real reach.
                  </p>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* PREMIUM WORKSPACE SECTION */}
        <section className="pb-14">
          <div className="container mx-auto px-6">
            <Card className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold mb-1">
                      Premium workspace
                    </h2>
                    <p className="text-sm text-white/70">
                      Your roadmap, weekly reality, AI tutor and vibe squad — in
                      one place.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" />
                    Beta mode · features evolve with user feedback
                  </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Column 1: Roadmap generator */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white/80 mb-1">
                      1. Generate your premium roadmap
                    </h3>
                    <div>
                      <Label className="text-xs text-white/70">
                        What do you want to learn?
                      </Label>
                      <Input
                        className="mt-1 bg-black/40 border-white/20 text-sm"
                        placeholder="e.g. Frontend + System Design"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyDown={handleKeyPress}
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-white/70">
                        What do you already know? (optional)
                      </Label>
                      <Textarea
                        className="mt-1 bg-black/40 border-white/20 text-sm min-h-[80px]"
                        placeholder="e.g. I know HTML/CSS and some JS..."
                        value={currentKnowledge}
                        onChange={(e) => setCurrentKnowledge(e.target.value)}
                        onKeyDown={handleKeyPress}
                      />
                    </div>

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

                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-white/70 mb-1">
                        Raw roadmap text
                      </h4>
                      <div className="min-h-[120px] max-h-[180px] overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/70 whitespace-pre-wrap">
                        {roadmapText ? (
                          roadmapText
                        ) : (
                          <span className="text-white/40">
                            After generation, the full roadmap text appears here.
                            Free version stops here. Premium adds tracking +
                            adaptation.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Weekly plan + progress + reflections */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white/80 mb-1">
                      2. Weekly plan, reflections & AI tutor
                    </h3>

                    <div className="mb-2">
                      <Label className="text-xs text-white/70">
                        Overall progress
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={progress} className="h-2" />
                        <span className="text-xs text-white/70 w-10 text-right">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>

                    {nextActiveWeek && (
                      <Card className="bg-black/40 border border-white/10 p-3 mb-2">
                        <p className="text-xs text-white/60 mb-1">
                          This week&apos;s active focus
                        </p>
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
                              Generate a roadmap to see weekly tasks, reflections
                              and links here.
                            </p>
                          )}

                          {weeks.map((week, i) => (
                            <div
                              key={i}
                              className="border border-white/10 rounded-lg p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs font-semibold">
                                    Week {week.week}: {week.title}
                                  </p>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTutor(week);
                                    }}
                                  >
                                    Ask AI tutor
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-[11px] px-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyWeekToClipboard(week);
                                    }}
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

                              <ul className="list-disc ml-4 text-[11px] text-white/70">
                                {week.details.map((d, j) => (
                                  <li key={j}>{d}</li>
                                ))}
                              </ul>

                              <Input
                                className="bg-black/50 border-white/20 text-[11px]"
                                placeholder="Paste project/demo link for this week"
                                value={week.projectLink}
                                onChange={(e) =>
                                  handleProjectLinkChange(i, e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                              />

                              <Textarea
                                className="bg-black/50 border-white/20 text-[11px] min-h-[60px] mt-1"
                                placeholder="Reflection: What did you actually do this week? Where did you get stuck?"
                                value={week.reflection}
                                onChange={(e) =>
                                  handleReflectionChange(i, e.target.value)
                                }
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.stopPropagation()}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    <Card className="bg-black/40 border border-white/10 p-3">
                      <p className="text-xs font-semibold text-white/80 mb-1">
                        Adaptive roadmap suggestion
                      </p>
                      <p className="text-[11px] text-white/70">
                        {getAdaptiveMessage()}
                      </p>
                    </Card>
                  </div>

                  {/* Column 3: Vibe squad */}
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
                          No matches yet. In full Premium, this connects to
                          real user profiles and squads.
                        </p>
                      )}

                      {matchedPeers.map((p) => (
                        <Card
                          key={p.id}
                          className="bg-black/40 border border-white/10 p-3"
                        >
                          <p className="text-sm font-semibold">{p.name}</p>
                          <p className="text-xs text-white/60">{p.city}</p>
                          <p className="text-[11px] text-white/60 mt-1">
                            Learning: {p.topic}
                          </p>
                          <p className="text-[10px] text-white/40">
                            Last active: {p.lastActive}
                          </p>
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
                      Later, this connects to real squads, live rooms and weekly
                      accountability check-ins as part of Premium.
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
            © {new Date().getFullYear()} SyncVerse Premium · Built for devs who
            actually ship.
          </div>
        </footer>
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

export default Premium;
