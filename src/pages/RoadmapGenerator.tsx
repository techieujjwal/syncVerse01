import { useState, useEffect, type KeyboardEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Loader2, ChevronDown, ChevronUp, Users, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCachedRoadmap, saveRoadmapToCache } from "@/lib/roadmapCache";
import { extractRoadmapText } from "@/lib/roadmapParser";
import { getEdgeErrorMessage } from "@/lib/edgeErrors";

type Peer = {
  id: number;
  name: string;
  city: string;
  email: string;
  lastActive: string;
  topic: string;
};

const dummyPeers: Peer[] = [
  { id: 1, name: "Priya Sharma", city: "Mumbai", email: "priya.sharma@email.com", lastActive: "5 days ago", topic: "machine learning" },
  { id: 2, name: "Rohan Mehta", city: "Delhi", email: "rohan.mehta@email.com", lastActive: "2 days ago", topic: "data science" },
  { id: 3, name: "Ananya Verma", city: "Bangalore", email: "ananya.verma@email.com", lastActive: "1 day ago", topic: "machine learning" },
  { id: 4, name: "Karan Patel", city: "Pune", email: "karan.patel@email.com", lastActive: "3 hours ago", topic: "web development" },
  { id: 5, name: "Neha Gupta", city: "Chennai", email: "neha.gupta@email.com", lastActive: "6 hours ago", topic: "cybersecurity" },
  { id: 6, name: "Aarav Singh", city: "Hyderabad", email: "aarav.singh@email.com", lastActive: "2 days ago", topic: "blockchain" },
  { id: 7, name: "Ishita Nair", city: "Kochi", email: "ishita.nair@email.com", lastActive: "8 hours ago", topic: "UI/UX design" },
  { id: 8, name: "Rahul Jain", city: "Indore", email: "rahul.jain@email.com", lastActive: "10 days ago", topic: "android development" },
  { id: 9, name: "Tanvi Deshmukh", city: "Nagpur", email: "tanvi.deshmukh@email.com", lastActive: "1 day ago", topic: "cloud computing" },
  { id: 10, name: "Manav Kapoor", city: "Lucknow", email: "manav.kapoor@email.com", lastActive: "12 hours ago", topic: "artificial intelligence" },
];

type TopicItem = {
  id: string;
  title: string;
  shortDescription: string;
  subtopics?: string[];
  completed?: boolean;
  projectLink?: string;
};

const normalizeString = (s?: string) =>
  (s || "").toString().trim();

const normalizeTopicInput = (raw: string) => {
  return raw.replace(/\btml\b/gi, "html").toLowerCase();
};

const CURATED_BASIC: Record<string, { shortDescription: string; subtopics: string[] }> = {
  html: {
    shortDescription: "Structure of web pages: tags, elements, semantic meaning and accessibility basics.",
    subtopics: ["HTML syntax & structure", "Semantic elements (header, main, nav, article)", "Forms & inputs", "Accessibility basics (a11y)"],
  },
  css: {
    shortDescription: "Styling and layout: selectors, cascading, Flexbox, Grid, responsive design basics.",
    subtopics: ["Selectors & specificity", "Box model", "Flexbox", "Grid", "Responsive design"],
  },
  javascript: {
    shortDescription: "Programming for the web: language basics, DOM, events, and async patterns.",
    subtopics: ["Syntax & data types", "DOM manipulation", "Events & handlers", "Promises & async/await"],
  },
  react: {
    shortDescription: "Component-driven UI: JSX, state, props, basic hooks and component lifecycle.",
    subtopics: ["JSX & components", "State & props", "useEffect/useState basics", "Routing (intro)"],
  },
  typescript: {
    shortDescription: "Static typing on top of JavaScript: basic types, interfaces, and typing React.",
    subtopics: ["Type annotations", "Interfaces & types", "Generics (intro)"],
  },
};

type RawTopic = Record<string, unknown>;

const asSubtopicArray = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.map(String)
    : typeof v === "string"
      ? v.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];

const parseTopics = (maybeTextOrJson: unknown): TopicItem[] => {
  if (!maybeTextOrJson) return [];

  if (typeof maybeTextOrJson === "object") {
    const record = maybeTextOrJson as Record<string, unknown>;

    if (Array.isArray(record.topics)) {
      return record.topics.map((rawT: unknown, idx: number) => {
        const t = (rawT && typeof rawT === "object" ? rawT : {}) as RawTopic;
        return {
          id: `${Date.now()}-${idx}`,
          title: normalizeString(t.title as string) || normalizeString(t.topic as string) || `Topic ${idx + 1}`,
          shortDescription: normalizeString(t.description as string) || normalizeString(t.shortDescription as string) || "",
          subtopics: asSubtopicArray(t.subtopics),
          completed: !!t.completed,
          projectLink: typeof t.projectLink === "string" ? t.projectLink : "",
        };
      });
    }

    if (Array.isArray(record.weeks)) {
      return record.weeks.map((rawW: unknown, idx: number) => {
        const w = (rawW && typeof rawW === "object" ? rawW : {}) as RawTopic;
        return {
          id: `${Date.now()}-${idx}`,
          title: normalizeString(w.title as string) || `Week ${(w.week as string | number) ?? idx + 1}`,
          shortDescription: (Array.isArray(w.details) ? w.details.join(" · ") : normalizeString(w.details as string)) || "",
          subtopics: asSubtopicArray(w.subtopics),
          completed: !!w.completed,
          projectLink: typeof w.projectLink === "string" ? w.projectLink : "",
        };
      });
    }

    if (Array.isArray(maybeTextOrJson)) {
      return maybeTextOrJson.map((rawIt: unknown, idx: number) => {
        if (typeof rawIt === "string") {
          // Note: put the em-dash first in this character class. A hyphen-first
          // order would be picked up by Tailwind's source scanner (even inside
          // comments) as an arbitrary CSS class and emit broken CSS.
          const m = rawIt.split(/[—:-]/).map((s) => s.trim());
          const title = m[0] || `Topic ${idx + 1}`;
          const desc = m.slice(1).join(" - ") || "";
          return { id: `${Date.now()}-${idx}`, title, shortDescription: desc, subtopics: [], completed: false, projectLink: "" };
        }
        const it = (rawIt && typeof rawIt === "object" ? rawIt : {}) as RawTopic;
        return {
          id: `${Date.now()}-${idx}`,
          title: normalizeString(it.title as string) || normalizeString(it.topic as string) || `Topic ${idx + 1}`,
          shortDescription: normalizeString(it.description as string) || "",
          subtopics: asSubtopicArray(it.subtopics),
          completed: !!it.completed,
          projectLink: typeof it.projectLink === "string" ? it.projectLink : "",
        };
      });
    }

    const maybeStr = String(record.content ?? record.text ?? JSON.stringify(maybeTextOrJson));
    return parseTopics(maybeStr);
  }

  const text = String(maybeTextOrJson).trim();

  if (/^[[{]/.test(text) || /"topics"\s*:/.test(text)) {
    try {
      const parsed = JSON.parse(text);
      return parseTopics(parsed);
    } catch {
      // Not valid JSON — continue with plain-text parsing below.
    }
  }

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const items: TopicItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^(?:\d+\.\s*)?([A-Za-z0-9 &+.#-]{2,60})\s*[—:-]\s*(.+)$/);
    if (m) {
      items.push({
        id: `${Date.now()}-${i}`,
        title: m[1].trim(),
        shortDescription: m[2].trim(),
        subtopics: [],
        completed: false,
        projectLink: "",
      });
      continue;
    }

    if (i + 1 < lines.length && lines[i + 1].match(/^[-*•]\s+/)) {
      const title = line;
      const descBullets: string[] = [];
      let j = i + 1;
      while (j < lines.length && lines[j].match(/^[-*•]\s+/)) {
        descBullets.push(lines[j].replace(/^[-*•]\s+/, "").trim());
        j++;
      }
      items.push({
        id: `${Date.now()}-${i}`,
        title: title,
        shortDescription: descBullets.join(" · "),
        subtopics: [],
        completed: false,
        projectLink: "",
      });
      i = j - 1;
      continue;
    }

    items.push({
      id: `${Date.now()}-${i}`,
      title: line,
      shortDescription: "",
      subtopics: [],
      completed: false,
      projectLink: "",
    });
  }

  return items;
};

const enrichParsedTopics = (queryTopic: string, items: TopicItem[]) => {
  const norm = normalizeTopicInput(queryTopic || "");
  const keys = Object.keys(CURATED_BASIC);

  return items.map((it) => {
    const titleNorm = it.title.toLowerCase();
    const matchedKey = keys.find((k) => norm.includes(k) || titleNorm.includes(k));
    if (!matchedKey) {
      const fallbackKey = keys.find((k) => norm.includes(k));
      if (fallbackKey && (!it.shortDescription || it.shortDescription.length < 10)) {
        return {
          ...it,
          shortDescription: CURATED_BASIC[fallbackKey].shortDescription,
          subtopics: CURATED_BASIC[fallbackKey].subtopics.slice(0, 3),
        };
      }
      return it;
    }

    const curated = CURATED_BASIC[matchedKey];
    const shortDescription = it.shortDescription && it.shortDescription.length > 12 ? it.shortDescription : curated.shortDescription;
    const subtopics = (it.subtopics && it.subtopics.length > 0) ? it.subtopics : curated.subtopics.slice(0, 3);
    return { ...it, shortDescription, subtopics };
  });
};

const RoadmapGenerator = () => {
  const [topic, setTopic] = useState("");
  const [currentKnowledge, setCurrentKnowledge] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedTopics, setParsedTopics] = useState<TopicItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [matchedPeers, setMatchedPeers] = useState<Peer[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!topic.trim()) {
      setMatchedPeers([]);
      return;
    }

    const search = normalizeTopicInput(topic);
    const searchWords = search.split(/\s+/).filter(Boolean);
    const peers = dummyPeers.filter((peer) => {
      const peerTopic = (peer.topic || "").toLowerCase();
      const peerWords = peerTopic.split(/\s+/);
      // Word-boundary matching so "ml" doesn't match "html".
      return (
        peerWords.includes(search) ||
        searchWords.some((w) => peerWords.includes(w)) ||
        searchWords.some((w) => peerTopic.split(" ").some((pw) => pw.startsWith(w) && w.length > 2))
      );
    });
    setMatchedPeers(peers);
  }, [topic]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("basicRoadmapProgress") || "null");
      if (Array.isArray(saved)) setParsedTopics(saved);
    } catch {
      // Corrupted persisted progress — start fresh.
    }
  }, []);

  useEffect(() => {
    if (parsedTopics.length > 0) {
      localStorage.setItem("basicRoadmapProgress", JSON.stringify(parsedTopics));
      const completed = parsedTopics.filter((t) => t.completed).length;
      const percent = parsedTopics.length ? Math.round((completed / parsedTopics.length) * 100) : 0;
      setProgress(percent);
    } else {
      setProgress(0);
    }
  }, [parsedTopics]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic required", description: "Please enter what you want to learn", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setParsedTopics([]);

    try {
      const cached = await getCachedRoadmap(topic, false);
      if (cached) {
        const items = parseTopics(cached);
        if (items.length > 0) {
          const enriched = enrichParsedTopics(topic || currentKnowledge || "", items);
          setParsedTopics(enriched);
          toast({ title: "Roadmap loaded", description: "Found a cached roadmap for this topic." });
          setIsLoading(false);
          return;
        }
      }

      toast({
        title: "Generating your roadmap",
        description: "The AI is researching topics, repos and playlists — this takes 10–30 seconds.",
      });

      const { data, error } = await supabase.functions.invoke("generate-roadmap", {
        body: { topic, currentKnowledge, premium: false },
      });

      if (error) throw new Error(await getEdgeErrorMessage(error));

      const chosen = extractRoadmapText(data);

      if (!chosen) {
        throw new Error("No usable roadmap returned by backend.");
      }

      let items = parseTopics(chosen);
      if (!items || items.length === 0) {
        const parts = (topic || "").split(/[,|/&]/).map((p) => p.trim()).filter(Boolean);
        items = parts.length ? parts.map((p, i) => ({ id: `${Date.now()}-${i}`, title: p, shortDescription: "", subtopics: [], completed: false, projectLink: "" })) : [{ id: `${Date.now()}-0`, title: topic, shortDescription: "", subtopics: [], completed: false, projectLink: "" }];
      }

      const enriched = enrichParsedTopics(topic || currentKnowledge || "", items);

      setParsedTopics(enriched);
      await saveRoadmapToCache(topic, false, enriched);

      toast({ title: "Roadmap ready", description: "Basic topics generated — see below." });
    } catch (err) {
      console.error("Error generating basic roadmap:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate roadmap",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCompletion = (index: number) => {
    setParsedTopics((prev) => prev.map((t, i) => (i === index ? { ...t, completed: !t.completed } : t)));
  };

  const handleProjectLinkChange = (index: number, value: string) => {
    setParsedTopics((prev) => prev.map((t, i) => (i === index ? { ...t, projectLink: value } : t)));
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <Link to="/" className="text-sm text-white/40 hover:text-white/70 mb-6 inline-flex items-center gap-2 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          AI-Powered <span className="text-gradient">Roadmap Tracker</span>
        </h1>
        <p className="text-lg text-white/40 mb-6">Generate a concise list of topics to study.</p>

        <Card className="p-8 glass-strong rounded-2xl mb-8">
          <div className="space-y-6">
            <div>
              <Label className="text-white/60 text-xs font-medium">What do you want to learn?</Label>
              <Input placeholder="e.g. Frontend Development, Machine Learning..." value={topic} onChange={(e) => setTopic(e.target.value)} onKeyDown={handleKeyPress} className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 rounded-xl h-11 mt-1.5" />
            </div>
            <div>
              <Label className="text-white/60 text-xs font-medium">Your current knowledge (optional)</Label>
              <Textarea placeholder="e.g. I know HTML/CSS basics..." value={currentKnowledge} onChange={(e) => setCurrentKnowledge(e.target.value)} onKeyDown={handleKeyPress} className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 rounded-xl mt-1.5" />
            </div>
            <Button onClick={handleGenerate} disabled={isLoading} size="lg" className="w-full bg-gradient-to-r from-cyan-400 to-violet-600 text-white border-0 rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all h-12 font-semibold">
              {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generate Roadmap</>}
            </Button>
          </div>
        </Card>

        {matchedPeers.length > 0 && (
          <Card className="p-8 glass-strong rounded-2xl mb-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-violet-300"><Users className="h-5 w-5" /> Peers learning "{topic}"</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matchedPeers.map((peer) => (
                <Card key={peer.id} className="p-4 glass rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-lg text-white/90">{peer.name}</p>
                      <p className="text-sm text-white/40">{peer.city}</p>
                      <div className="flex items-center text-xs text-white/30 mt-1 gap-1"><Mail className="h-3 w-3" /> {peer.email}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {parsedTopics.length > 0 && (
          <Card className="p-8 glass-strong rounded-2xl mb-8 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white/90">Topics to study</h3>
                <p className="text-sm text-white/40">Concise list of topics and what to focus on for each.</p>
              </div>
              {expanded ? <ChevronUp className="h-6 w-6 text-white/40" /> : <ChevronDown className="h-6 w-6 text-white/40" />}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1" aria-hidden>
                  <Progress value={progress} aria-label="Roadmap completion progress" />
                </div>
                <div className="ml-4 text-sm font-medium text-white/80">
                  {progress}%
                </div>
              </div>
              <div className="mt-2 text-xs text-white/30">
                {parsedTopics.filter((t) => t.completed).length} of {parsedTopics.length} completed
              </div>
            </div>

            {expanded && (
              <div className="mt-6 space-y-4">
                {parsedTopics.map((t, i) => (
                  <div key={t.id} className="p-4 rounded-xl glass" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <h4 className="font-semibold text-lg text-white/90">{i + 1}. {t.title}</h4>
                          <div className={`text-sm ${t.completed ? "text-emerald-400" : "text-white/30"}`}>{t.completed ? "Completed" : "Pending"}</div>
                        </div>
                        {t.shortDescription && <p className="text-sm text-white/40 mt-2">{t.shortDescription}</p>}

                        {t.subtopics && t.subtopics.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-white/30 mb-1">Subtopics</p>
                            <ul className="list-disc ml-6 text-sm text-white/40">
                              {t.subtopics.map((s, si) => <li key={si}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 w-full md:w-[320px]">
                        <Input placeholder="Add project link (optional)" value={t.projectLink ?? ""} onChange={(e) => handleProjectLinkChange(i, e.target.value)} className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 rounded-xl" />
                        <Button onClick={() => toggleCompletion(i)} variant={t.completed ? "default" : "outline"} className={t.completed ? "bg-emerald-500/20 text-emerald-300 border-0 rounded-xl" : "border-white/10 text-white/60 rounded-xl"}>{t.completed ? "Mark Incomplete" : "Mark Done"}</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default RoadmapGenerator;
