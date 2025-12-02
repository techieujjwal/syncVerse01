// Index.tsx
// "use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Code2, Users, Rocket, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

type Accent = "neon" | "elegant" | "vibe";

type BasicTopic = {
  week?: string | number;
  title?: string;
  details?: string[];
  completed?: boolean | number | string;
};

const safeNumber = (v: any, fallback = NaN) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const Index = () => {
  const [user, setUser] = useState<string | null>(null);
  const [dark, setDark] = useState(true);
  const [accent, setAccent] = useState<Accent>("neon");

  // Free roadmap state
  const [freeProgress, setFreeProgress] = useState<number>(42);
  const [freeCompleted, setFreeCompleted] = useState<number>(3);
  const [freeTotal, setFreeTotal] = useState<number>(10);

  // Premium roadmap state
  const [premiumProgress, setPremiumProgress] = useState<number>(18);
  const [premiumCompleted, setPremiumCompleted] = useState<number>(1);
  const [premiumTotal, setPremiumTotal] = useState<number>(6);

  const botpressLoadedRef = useRef(false); // kept but unused (no botpress integration)

  useEffect(() => {
    const loggedUser = localStorage.getItem("username");
    if (loggedUser) setUser(loggedUser);
  }, []);

  // Helper: compute free progress from multiple possible storage shapes
  const computeFreeFromStorage = () => {
    try {
      // 1) Preferred: explicit numeric percentage
      const pRaw = localStorage.getItem("roadmapProgress");
      if (pRaw !== null) {
        const p = safeNumber(pRaw);
        if (!Number.isNaN(p)) {
          setFreeProgress(Math.max(0, Math.min(100, Math.round(p))));
        }
      }

      // 2) explicit completed/total
      const cRaw = localStorage.getItem("roadmapCompleted");
      const tRaw = localStorage.getItem("roadmapTotal");
      if (cRaw !== null && tRaw !== null) {
        const c = Math.max(0, Math.floor(safeNumber(cRaw, 0)));
        const t = Math.max(0, Math.floor(safeNumber(tRaw, 0)));
        if (t > 0) {
          setFreeCompleted(c);
          setFreeTotal(t);
          setFreeProgress(Math.round((c / t) * 100));
          return;
        }
      }

      // 3) basicRoadmapProgress (could be array of strings or objects)
      const basicRaw = localStorage.getItem("basicRoadmapProgress");
      if (basicRaw) {
        try {
          const parsed = JSON.parse(basicRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // If items have completed field, count them; otherwise treat as uncompleted
            const total = parsed.length;
            const completed = parsed.reduce((acc: number, item: any) => {
              if (item && ("completed" in item)) {
                return acc + (item.completed ? 1 : 0);
              }
              // If item is primitive or doesn't have completed, try other heuristic:
              // If it's an object and has truthy `done` or `finished`, count it.
              if (item && (item.done || item.finished)) return acc + 1;
              return acc;
            }, 0);
            setFreeTotal(total);
            setFreeCompleted(completed);
            setFreeProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
            return;
          }
        } catch {
          // ignore parse errors and continue
        }
      }

      // 4) fallback to stored numeric or hardcoded default
      const fallbackP = safeNumber(pRaw);
      if (!Number.isNaN(fallbackP)) {
        setFreeProgress(Math.max(0, Math.min(100, Math.round(fallbackP))));
      } else {
        // Keep previous defaults if nothing present
        setFreeProgress((prev) => prev ?? 42);
      }
    } catch (err) {
      // noop — keep defaults
    }
  };

  // Helper: compute premium progress from premiumWeeks key
  const computePremiumFromStorage = () => {
    try {
      const raw = localStorage.getItem("premiumWeeks");
      if (!raw) {
        // fallback keys some older variants used
        const pRaw = localStorage.getItem("premiumProgress");
        const cRaw = localStorage.getItem("premiumCompleted");
        const tRaw = localStorage.getItem("premiumTotal");
        if (pRaw !== null) {
          const p = safeNumber(pRaw);
          if (!Number.isNaN(p)) setPremiumProgress(Math.max(0, Math.min(100, Math.round(p))));
        }
        if (cRaw !== null && tRaw !== null) {
          const c = Math.max(0, Math.floor(safeNumber(cRaw, 0)));
          const t = Math.max(0, Math.floor(safeNumber(tRaw, 0)));
          if (t > 0) {
            setPremiumCompleted(c);
            setPremiumTotal(t);
            setPremiumProgress(Math.round((c / t) * 100));
          }
        }
        return;
      }

      const weeks = JSON.parse(raw);
      if (Array.isArray(weeks) && weeks.length > 0) {
        const total = weeks.length;
        const completed = weeks.filter((w: any) => !!w?.completed).length;
        setPremiumTotal(total);
        setPremiumCompleted(completed);
        setPremiumProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
      } else {
        // if key exists but empty array
        setPremiumTotal(0);
        setPremiumCompleted(0);
        setPremiumProgress(0);
      }
    } catch (err) {
      // keep defaults
    }
  };

  // initial load
  useEffect(() => {
    computeFreeFromStorage();
    computePremiumFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for storage events (cross-tab updates)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) {
        // fallback: recompute both
        computeFreeFromStorage();
        computePremiumFromStorage();
        return;
      }
      if (e.key === "premiumWeeks" || e.key === "premiumRoadmapProgress" || e.key === "premiumProgress" || e.key === "premiumCompleted" || e.key === "premiumTotal") {
        computePremiumFromStorage();
      }
      if (e.key === "roadmapProgress" || e.key === "roadmapCompleted" || e.key === "roadmapTotal" || e.key === "basicRoadmapProgress") {
        computeFreeFromStorage();
      }
    };

    window.addEventListener("storage", onStorage);

    // custom events for same-tab updates (we dispatch these from premium.tsx and roadmap generator snippets)
    const onPremiumUpdated = () => computePremiumFromStorage();
    const onBasicUpdated = () => computeFreeFromStorage();

    window.addEventListener("premiumWeeksUpdated", onPremiumUpdated);
    window.addEventListener("basicRoadmapUpdated", onBasicUpdated);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("premiumWeeksUpdated", onPremiumUpdated);
      window.removeEventListener("basicRoadmapUpdated", onBasicUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("username");
    setUser(null);
  };

  const community = useMemo(
    () => [
      { name: "Rohit", initials: "U", color: "from-pink-400 to-red-500" },
      { name: "Ujjwal", initials: "J", color: "from-purple-400 to-indigo-500" },
      { name: "Taran", initials: "J", color: "from-green-300 to-teal-400" },
      { name: "Udhav", initials: "U", color: "from-yellow-300 to-orange-400" },
    ],
    []
  );

  const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  // Small progress bar (keeps style simple)
  const ProgressBar = ({ pct }: { pct: number }) => (
    <div className="w-full bg-white/6 rounded-full h-3 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: "linear-gradient(90deg,#00E5FF,#8B5CF6)" }}
      />
    </div>
  );

  return (
    <div className={`${dark ? "dark" : ""}`}>
      {/* === BACKGROUND === */}
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
        {/* === NAVBAR === */}
        <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] md:w-[85%] lg:w-[75%] bg-white/6 dark:bg-black/40 border border-white/6 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-gradient-to-br from-[#00E5FF] to-[#6C33FF]">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-extrabold">SyncVerse</div>
                <div className="text-xs text-white/50 -mt-1">
                  Learn — Build — Ship
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-6 pr-2">
              <Link to="/roadmaps" className="text-sm text-white/70 hover:text-white transition">Roadmaps</Link>
              <Link to="/programs" className="text-sm text-white/70 hover:text-white transition">Programs</Link>
              <Link to="/companies" className="text-sm text-white/70 hover:text-white transition">Companies</Link>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium">{user}</div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm" className="bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] text-white">login</Button>
              </Link>
            )}
          </div>
        </nav>

        {/* === PREMIUM BUTTON === */}
        <div className="fixed top-4 right-[3%] z-50">
          <Link to="/premium"><InteractiveHoverButton text="PREMIUM" /></Link>
        </div>

        {/* === HERO === */}
        <header className="pt-28 pb-12">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
                <motion.div variants={fadeUp} className="mb-4">
                  <span className="inline-flex items-center gap-3 rounded-full px-4 py-1 text-sm font-medium bg-white/6">
                    🚀 <strong>Your Tech Journey — Unified</strong>
                  </span>
                </motion.div>

                <motion.h1 variants={fadeUp} className="text-5xl font-extrabold leading-tight">
                  {user ? (
                    <>
                      Hello{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#8B5CF6]">
                        {user}
                      </span>
                      , Get Started
                    </>
                  ) : (
                    <>
                      Master Tech with <br />
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#feffff] to-[#ffffff]">
                        Structured Learning, Real Community, Real Jobs
                      </span>
                    </>
                  )}
                </motion.h1>

                <motion.p variants={fadeUp} className="mt-6 text-lg text-white/70 max-w-2xl">
                  From curated roadmaps to hands-on programs and a buzzing community — everything designed to get you from zero to product-ready.
                </motion.p>

                <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3 items-center">
                  <Link to="/roadmap-generator">
                    <Button size="lg" className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-400 to-indigo-500 text-black">
                      <span>Generate My Roadmap</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>

                  <Link to="/programs">
                    <Button size="lg" variant="outline" className="px-6 py-3 border-white/10 text-white/90">View Programs</Button>
                  </Link>
                  <h3>Or</h3>

                  <Link to="/experts">
                    <Button size="lg" variant="outline" className="px-6 py-3 border-white/10 text-white/90 bg-red-500">An Expert ?</Button>
                  </Link>

                  <div className="ml-2 text-sm text-white/60">
                    <span className="font-medium">Avg time:</span> 3–6 months · <span className="font-medium">Commitment:</span> 6–10 hrs/week
                  </div>
                </motion.div>
              </motion.div>

              {/* RIGHT PANEL: Dual progress card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="p-6 md:p-8 border border-white/8 backdrop-blur-md bg-black/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-white/70">My Roadmap Progress</div>
                      <div className="text-2xl font-semibold">Keep going — you're doing great</div>
                    </div>
                    <div className="text-sm text-white/60">Updated live</div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Free Roadmap (upper half) */}
                    <div className="p-4 rounded-lg bg-white/3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-xs text-white/60">Free Roadmap</div>
                          <div className="text-sm font-medium">{freeCompleted} / {freeTotal} modules completed</div>
                        </div>
                        <div className="text-sm font-semibold">{Math.round(freeProgress)}%</div>
                      </div>
                      <ProgressBar pct={freeProgress} />
                      <div className="mt-2 text-xs text-white/60">
                        COMPLETE THE ROADMAP TO INCREASE YOUR PROGRESS !!!
                      </div>
                    </div>

                    {/* Premium Roadmap (lower half) */}
                    <div className="p-4 rounded-lg bg-white/3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-xs text-white/60">Premium Roadmap</div>
                          <div className="text-sm font-medium">{premiumTotal > 0 ? `${premiumCompleted} / ${premiumTotal} weeks completed` : "No premium roadmap detected"}</div>
                        </div>
                        <div className="text-sm font-semibold">{Math.round(premiumProgress)}%</div>
                      </div>
                      <ProgressBar pct={premiumProgress} />
                      <div className="mt-2 text-xs text-white/60">
                      COMPLETE THE ROADMAP TO INCREASE YOUR PROGESS !!!

                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </header>

        {/* === FEATURES === */}
        <section className="pb-20">
          <div className="container mx-auto px-6">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={{ show: { transition: { staggerChildren: 0.12 } } }}>
              <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-4">Why SyncVerse works</motion.h2>
              <motion.p variants={fadeUp} className="text-white/70 max-w-3xl mb-8">A unified experience — curated roadmaps, collaborative learning, and placement-driven programs.</motion.p>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: <Code2 className="h-5 w-5 text-white" />, title: "Structured Roadmaps", desc: "Month-by-month learning paths for every stack.", details: "Curated resources, checkpoints, and mini-projects to keep you on track." },
                  { icon: <Users className="h-5 w-5 text-white" />, title: "Peer Learning", desc: "Study together, build together.", details: "Study groups, pair programming, and mentor office hours included." },
                  { icon: <Rocket className="h-5 w-5 text-white" />, title: "Top Internships", desc: "GSOC, MLH, and more.", details: "Placement kits, interview practice, and project reviews to help you land roles." }
                ].map((f, i) => (
                  <motion.div key={i} variants={fadeUp} className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 transition-all duration-500">
                    <div className="absolute inset-0 rounded-2xl pointer-events-none border border-transparent group-hover:border-purple-500 group-hover:shadow-[0_0_30px_#A855F7] transition-all duration-500"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 rounded-lg bg-white/6">{f.icon}</div>
                        <div>
                          <h3 className="font-semibold text-lg">{f.title}</h3>
                          <div className="text-xs text-white/60">{f.desc}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-white/60">{f.details}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* === FOOTER === */}
        <footer className="py-12">
          <div className="container mx-auto px-6">
            <div className="bg-white/4 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-xl font-bold">Ready to build something real?</div>
                <div className="text-sm text-white/70">Join cohorts, build projects, and get pro feedback.</div>
              </div>

              <div className="flex items-center gap-3">
                <Link to="/roadmap-generator">
                  <Button className="px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] text-black">Get my roadmap</Button>
                </Link>
                <Link to="/programs">
                  <Button variant="outline" className="px-5 py-3 border-white/10 text-white/90">See programs</Button>
                </Link>
              </div>
            </div>

            <div className="mt-6 text-xs text-white/50 text-center">© {new Date().getFullYear()} SyncVerse <br /> Crafted By Hexember Devs with ❤️ for learners</div>
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
          100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default Index;
