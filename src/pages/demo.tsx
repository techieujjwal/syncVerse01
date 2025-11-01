"use client";
import React, { useState, useEffect } from "react";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { GlowCard } from "@/components/spotlight-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronUp, Loader2, Sparkles, Users, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ShootingStarsDemo() {
  const [view, setView] = useState("home");
  const [topic, setTopic] = useState("");
  const [currentKnowledge, setCurrentKnowledge] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedRoadmap, setParsedRoadmap] = useState([]);
  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [matchedPeers, setMatchedPeers] = useState([]);
  const { toast } = useToast();

  // Dummy peers
  const peers = [
    { id: 1, name: "Priya Sharma", city: "Mumbai", email: "priya@email.com", topic: "machine learning" },
    { id: 2, name: "Rohan Mehta", city: "Delhi", email: "rohan@email.com", topic: "web development" },
    { id: 3, name: "Ananya Verma", city: "Bangalore", email: "ananya@email.com", topic: "AI" },
  ];

  useEffect(() => {
    if (!topic.trim()) {
      setMatchedPeers([]);
      return;
    }
    const t = topic.toLowerCase();
    setMatchedPeers(peers.filter(p => p.topic.toLowerCase().includes(t)));
  }, [topic]);

  const parseWeeks = (text) => {
    const lines = text.split("\n");
    const weeks = [];
    let currentWeek = null;
    lines.forEach(line => {
      const match = line.match(/week\s*(\d+):?\s*(.*)/i);
      if (match) {
        if (currentWeek) weeks.push(currentWeek);
        currentWeek = { week: match[1], title: match[2], details: [], completed: false, projectLink: "" };
      } else if (currentWeek && line.trim()) {
        currentWeek.details.push(line.trim());
      }
    });
    if (currentWeek) weeks.push(currentWeek);
    return weeks;
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic required", description: "Please enter a topic", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-roadmap", {
        body: { topic, currentKnowledge },
      });
      if (error) throw error;
      const roadmap = parseWeeks(data.roadmap);
      setParsedRoadmap(roadmap);
      toast({ title: "Roadmap created!", description: "Scroll down to view your weekly plan 🚀" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not generate roadmap", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWeekCompletion = (i) =>
    setParsedRoadmap(prev => prev.map((w, idx) => (idx === i ? { ...w, completed: !w.completed } : w)));

  const handleProjectLinkChange = (i, v) =>
    setParsedRoadmap(prev => prev.map((w, idx) => (idx === i ? { ...w, projectLink: v } : w)));

  useEffect(() => {
    const completed = parsedRoadmap.filter(w => w.completed).length;
    if (parsedRoadmap.length > 0) setProgress((completed / parsedRoadmap.length) * 100);
  }, [parsedRoadmap]);

  // ---------- HOME SCREEN ----------
  if (view === "home")
    return (
      <div className="h-[40rem] w-full bg-black relative overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,rgba(0,0,0,0)_80%)]" />
          <div className="stars absolute inset-0" />
        </div>

        <div className="relative z-10 text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">Your AI Roadmap Hub 🚀</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Learn smarter, track progress, and connect with peers — all in one place.
          </p>
        </div>

        <div className="flex gap-10 relative z-10">
          <div onClick={() => setView("generate")}>
            <GlowCard title="Generate Roadmap" description="Create your AI learning path" />
          </div>
          <div onClick={() => setView("progress")}>
            <GlowCard title="Progress Tracker" description="Track weekly roadmap progress" />
          </div>
          <div onClick={() => setView("peers")}>
            <GlowCard title="Peer Connect" description="Find people learning like you" />
          </div>
        </div>

        {/* Shooting Stars BG */}
        <ShootingStars starColor="#FF00E5" trailColor="#00D1FF" minSpeed={15} maxSpeed={35} minDelay={1000} maxDelay={3000} />
        <style jsx>{`
          .stars {
            background-image:
              radial-gradient(2px 2px at 20px 30px, #eee, transparent),
              radial-gradient(2px 2px at 40px 70px, #fff, transparent),
              radial-gradient(2px 2px at 50px 160px, #ddd, transparent),
              radial-gradient(2px 2px at 90px 40px, #fff, transparent),
              radial-gradient(2px 2px at 130px 80px, #fff, transparent);
            background-repeat: repeat;
            background-size: 200px 200px;
            animation: twinkle 5s ease-in-out infinite;
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </div>
    );

  // ---------- GENERATE ROADMAP ----------
  if (view === "generate")
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <Card className="p-8 w-full max-w-3xl bg-neutral-900 border border-neutral-700">
          <h2 className="text-3xl font-bold mb-4">Generate Your Roadmap</h2>
          <Label>What do you want to learn?</Label>
          <Input className="mb-4 bg-neutral-800" placeholder="e.g. Frontend Development" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <Label>Your current knowledge</Label>
          <Textarea className="mb-4 bg-neutral-800" placeholder="e.g. I know HTML basics..." value={currentKnowledge} onChange={(e) => setCurrentKnowledge(e.target.value)} />
          <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />} Generate
          </Button>
          {parsedRoadmap.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold mb-3">Generated Weekly Plan</h3>
              {parsedRoadmap.map((w, i) => (
                <div key={i} className="p-3 border border-neutral-700 rounded mb-3">
                  <p className="font-semibold">Week {w.week}: {w.title}</p>
                  <ul className="list-disc ml-6 text-gray-300">
                    {w.details.map((d, j) => <li key={j}>{d}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Button variant="outline" className="mt-6" onClick={() => setView("home")}>Back Home</Button>
      </div>
    );

  // ---------- PROGRESS TRACKER ----------
  if (view === "progress")
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <Card className="p-8 w-full max-w-3xl bg-neutral-900 border border-neutral-700 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <h2 className="text-2xl font-bold mb-2">Progress Overview</h2>
          <Progress value={progress} className="h-3 mb-3" />
          <p className="text-gray-400">{Math.round(progress)}% completed</p>
          {expanded && (
            <div className="mt-6 space-y-4">
              {parsedRoadmap.map((week, i) => (
                <div key={i} className="p-4 border border-neutral-700 rounded">
                  <h3 className="font-semibold mb-2">Week {week.week}: {week.title}</h3>
                  <ul className="list-disc ml-6 text-gray-400 mb-2">
                    {week.details.map((d, j) => <li key={j}>{d}</li>)}
                  </ul>
                  <Input className="bg-neutral-800 mb-2" placeholder="Add project link" value={week.projectLink} onChange={(e) => handleProjectLinkChange(i, e.target.value)} />
                  <Button variant={week.completed ? "default" : "outline"} onClick={() => toggleWeekCompletion(i)}>
                    {week.completed ? "Completed ✅" : "Mark Done"}
                  </Button>
                </div>
              ))}
            </div>
          )}
          {expanded ? <ChevronUp className="mx-auto mt-4" /> : <ChevronDown className="mx-auto mt-4" />}
        </Card>
        <Button variant="outline" className="mt-6" onClick={() => setView("home")}>Back Home</Button>
      </div>
    );

  // ---------- PEER CONNECT ----------
  if (view === "peers")
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <Card className="p-8 w-full max-w-3xl bg-neutral-900 border border-neutral-700">
          <h2 className="text-2xl font-bold mb-4">Find Peers Learning Like You</h2>
          <Input className="bg-neutral-800 mb-4" placeholder="Enter a topic..." value={topic} onChange={(e) => setTopic(e.target.value)} />
          {matchedPeers.length > 0 ? (
            <div className="space-y-3">
              {matchedPeers.map((p) => (
                <div key={p.id} className="p-4 border border-neutral-700 rounded flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-gray-400">{p.city}</p>
                    <div className="flex text-sm items-center gap-2 text-gray-500"><Mail className="h-4 w-4" /> {p.email}</div>
                  </div>
                  <Button variant="outline">💬 Connect</Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No peers found yet.</p>
          )}
        </Card>
        <Button variant="outline" className="mt-6" onClick={() => setView("home")}>Back Home</Button>
      </div>
    );
}
