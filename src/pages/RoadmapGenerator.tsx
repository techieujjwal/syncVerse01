import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Users,
  Mail,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const dummyPeers = [
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
  { id: 11, name: "Diya Chatterjee", city: "Kolkata", email: "diya.chatterjee@email.com", lastActive: "4 days ago", topic: "data analytics" },
  { id: 12, name: "Harsh Raj", city: "Patna", email: "harsh.raj@email.com", lastActive: "3 hours ago", topic: "web development" },
  { id: 13, name: "Simran Kaur", city: "Amritsar", email: "simran.kaur@email.com", lastActive: "7 days ago", topic: "machine learning" },
  { id: 14, name: "Aditya Joshi", city: "Jaipur", email: "aditya.joshi@email.com", lastActive: "6 hours ago", topic: "blockchain" },
  { id: 15, name: "Ritika Das", city: "Guwahati", email: "ritika.das@email.com", lastActive: "9 days ago", topic: "AI ethics" },
  { id: 16, name: "Sarthak Bansal", city: "Noida", email: "sarthak.bansal@email.com", lastActive: "2 days ago", topic: "cloud computing" },
  { id: 17, name: "Aditi Rao", city: "Surat", email: "aditi.rao@email.com", lastActive: "1 hour ago", topic: "frontend development" },
  { id: 18, name: "Vivek Mishra", city: "Varanasi", email: "vivek.mishra@email.com", lastActive: "4 hours ago", topic: "backend development" },
  { id: 19, name: "Kavya Pillai", city: "Thiruvananthapuram", email: "kavya.pillai@email.com", lastActive: "3 days ago", topic: "mobile app development" },
  { id: 20, name: "Tanishq Sinha", city: "Ranchi", email: "tanishq.sinha@email.com", lastActive: "9 hours ago", topic: "IoT" },
  { id: 21, name: "Pooja Yadav", city: "Bhopal", email: "pooja.yadav@email.com", lastActive: "11 hours ago", topic: "data science" },
  { id: 22, name: "Rajeev Menon", city: "Coimbatore", email: "rajeev.menon@email.com", lastActive: "5 days ago", topic: "AI/ML" },
  { id: 23, name: "Sneha Tiwari", city: "Kanpur", email: "sneha.tiwari@email.com", lastActive: "8 days ago", topic: "blockchain" },
  { id: 24, name: "Anshul Gaur", city: "Ghaziabad", email: "anshul.gaur@email.com", lastActive: "3 hours ago", topic: "full stack development" },
  { id: 25, name: "Mitali Borkar", city: "Nashik", email: "mitali.borkar@email.com", lastActive: "2 days ago", topic: "AI research" },
  { id: 26, name: "Yash Chauhan", city: "Vadodara", email: "yash.chauhan@email.com", lastActive: "7 hours ago", topic: "cloud computing" },
  { id: 27, name: "Divya Pandey", city: "Agra", email: "divya.pandey@email.com", lastActive: "5 days ago", topic: "web development" },
  { id: 28, name: "Naman Arora", city: "Chandigarh", email: "naman.arora@email.com", lastActive: "3 hours ago", topic: "data engineering" },
  { id: 29, name: "Sia Kapoor", city: "Delhi", email: "sia.kapoor@email.com", lastActive: "1 day ago", topic: "cloud security" },
  { id: 30, name: "Aryan Khanna", city: "Gurgaon", email: "aryan.khanna@email.com", lastActive: "2 hours ago", topic: "DevOps" },
];

const RoadmapGenerator = () => {
  const [topic, setTopic] = useState("");
  const [currentKnowledge, setCurrentKnowledge] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedRoadmap, setParsedRoadmap] = useState([]);
  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [matchedPeers, setMatchedPeers] = useState([]);
  const { toast } = useToast();

  // Normalize function for better matching
  const normalize = (text) =>
    text.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();

  useEffect(() => {
    if (!topic.trim()) {
      setMatchedPeers([]);
      return;
    }

    const search = normalize(topic);
    const peers = dummyPeers.filter((peer) => {
      const peerTopic = normalize(peer.topic);
      return (
        peerTopic.includes(search) ||
        search.includes(peerTopic) ||
        peerTopic.split(" ").some((word) => search.includes(word))
      );
    });

    setMatchedPeers(peers);
  }, [topic]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("roadmapProgress"));
    if (saved) setParsedRoadmap(saved);
  }, []);

  useEffect(() => {
    if (parsedRoadmap.length > 0) {
      localStorage.setItem("roadmapProgress", JSON.stringify(parsedRoadmap));
      const completed = parsedRoadmap.filter((w) => w.completed).length;
      setProgress((completed / parsedRoadmap.length) * 100);
    }
  }, [parsedRoadmap]);

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
    setParsedRoadmap([]);

    try {
      const { data, error } = await supabase.functions.invoke("generate-roadmap", {
        body: { topic, currentKnowledge },
      });

      if (error) throw error;
      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      const extracted = parseWeeks(data.roadmap);
      setParsedRoadmap(extracted);
      toast({
        title: "Success!",
        description: "Detailed roadmap generated successfully 🚀",
      });
    } catch (error) {
      console.error("Error generating roadmap:", error);
      toast({
        title: "Error",
        description: "Failed to generate roadmap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const parseWeeks = (text) => {
    const lines = text.split("\n");
    const weeks = [];
    let currentWeek = null;

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
        };
      } else if (currentWeek && line.trim() !== "") {
        currentWeek.details.push(line.trim());
      }
    });

    if (currentWeek) weeks.push(currentWeek);
    return weeks;
  };

  const toggleWeekCompletion = (index) => {
    setParsedRoadmap((prev) =>
      prev.map((w, i) => (i === index ? { ...w, completed: !w.completed } : w))
    );
  };

  const handleProjectLinkChange = (index, value) => {
    setParsedRoadmap((prev) =>
      prev.map((w, i) => (i === index ? { ...w, projectLink: value } : w))
    );
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-background">
      <div className="container mx-auto max-w-5xl">
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-primary mb-6 inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <h1 className="text-5xl font-bold mb-4">
          AI-Powered <span className="text-gradient">Roadmap Tracker</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          Generate a roadmap and track your weekly progress.
        </p>

        {/* Input Section */}
        <Card className="p-8 border-border bg-card mb-8">
          <div className="space-y-6">
            <div>
              <Label>What do you want to learn?</Label>
              <Input
                placeholder="e.g. Frontend Development, Machine Learning..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
            <div>
              <Label>Your current knowledge (optional)</Label>
              <Textarea
                placeholder="e.g. I know HTML/CSS basics..."
                value={currentKnowledge}
                onChange={(e) => setCurrentKnowledge(e.target.value)}
                onKeyDown={handleKeyPress}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Generate Roadmap
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* 🔹 Peers Section */}
        {matchedPeers.length > 0 && (
          <Card className="p-8 border-border bg-card mb-8 animate-fade-in">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" /> Peers learning "{topic}"
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matchedPeers.map((peer) => (
                <Card key={peer.id} className="p-4 border border-border/40 bg-background/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-lg">{peer.name}</p>
                      <p className="text-sm text-muted-foreground">{peer.city}</p>
                      <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                        <Mail className="h-3 w-3" /> {peer.email}
                      </div>
                    </div>
                    <Button
  size="sm"
  variant="outline"
  onClick={(e) => {
    // 1️⃣ Open Botpress chatbot
    if (window.botpressWebChat) {
      window.botpressWebChat.sendEvent({ type: "show" });
    }

    // 2️⃣ Show tick animation on button click
    const tick = document.createElement("div");
    tick.innerHTML = `
      <div class="fixed inset-0 flex items-center justify-center z-[9999] bg-black/30">
        <div class="animate-[pop_0.8s_ease-out_forwards] flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" 
               class="w-20 h-20 text-green-400 drop-shadow-xl" 
               fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <style>
        @keyframes pop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
      </style>
    `;
    document.body.appendChild(tick);

    // remove after animation completes
    setTimeout(() => tick.remove(), 1500);
  }}
>
  💬 Connect
</Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Progress Tracker */}
        {parsedRoadmap.length > 0 && (
          <Card
            className="p-8 border-border bg-card mb-8 transition-all duration-300 cursor-pointer hover:shadow-lg"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Overall Progress: {Math.round(progress)}%
                </h3>
                <Progress value={progress} className="h-3" />
              </div>
              {expanded ? (
                <ChevronUp className="h-6 w-6 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            {expanded && (
              <div className="mt-8 space-y-4 animate-fadeIn">
                {parsedRoadmap.map((week, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border border-border/40 bg-background/60"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          Week {week.week}: {week.title}
                        </h3>
                        <ul className="list-disc ml-6 text-sm text-muted-foreground">
                          {week.details.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 items-center mt-2 sm:mt-0">
                        <Input
                          placeholder="Add project link"
                          value={week.projectLink}
                          onChange={(e) =>
                            handleProjectLinkChange(index, e.target.value)
                          }
                        />
                        <Button
                          variant={week.completed ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWeekCompletion(index);
                          }}
                        >
                          {week.completed ? "Completed ✅" : "Mark Done"}
                        </Button>
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
