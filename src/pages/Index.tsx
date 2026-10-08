import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Code2, Users, Rocket, LogOut, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { useAuth } from "@/context/AuthContext";

type BasicTopic = {
  week?: string | number;
  title?: string;
  details?: string[];
  completed?: boolean | number | string;
};

type ProgressItem = BasicTopic & { done?: unknown; finished?: unknown };

const safeNumber = (v: unknown, fallback = NaN) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const Index = () => {
  const { user: authUser, profile, signOut } = useAuth();
  const displayName = profile?.display_name || authUser?.email?.split("@")[0] || null;
  const [dark, setDark] = useState(true);

  const [freeProgress, setFreeProgress] = useState<number>(42);
  const [freeCompleted, setFreeCompleted] = useState<number>(3);
  const [freeTotal, setFreeTotal] = useState<number>(10);

  const [premiumProgress, setPremiumProgress] = useState<number>(18);
  const [premiumCompleted, setPremiumCompleted] = useState<number>(1);
  const [premiumTotal, setPremiumTotal] = useState<number>(6);

  const botpressLoadedRef = useRef(false);

  const computeFreeFromStorage = () => {
    try {
      const pRaw = localStorage.getItem("roadmapProgress");
      if (pRaw !== null) {
        const p = safeNumber(pRaw);
        if (!Number.isNaN(p)) {
          setFreeProgress(Math.max(0, Math.min(100, Math.round(p))));
        }
      }

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

      const basicRaw = localStorage.getItem("basicRoadmapProgress");
      if (basicRaw) {
        try {
          const parsed = JSON.parse(basicRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const total = parsed.length;
            const completed = parsed.reduce((acc: number, item: ProgressItem) => {
              if (item && ("completed" in item)) {
                return acc + (item.completed ? 1 : 0);
              }
              if (item && (item.done || item.finished)) return acc + 1;
              return acc;
            }, 0);
            setFreeTotal(total);
            setFreeCompleted(completed);
            setFreeProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
            return;
          }
        } catch {
          // Malformed basicRoadmapProgress — fall through to other sources.
        }
      }

      // Only override the default when a value was actually stored.
      // Number(null) === 0, so an unguarded read would show 0% for new users.
      if (pRaw !== null) {
        const fallbackP = safeNumber(pRaw);
        if (!Number.isNaN(fallbackP)) {
          setFreeProgress(Math.max(0, Math.min(100, Math.round(fallbackP))));
        }
      }
    } catch (err) {
      // localStorage unavailable (e.g. privacy mode) — keep defaults.
    }
  };

  const computePremiumFromStorage = () => {
    try {
      const raw = localStorage.getItem("premiumWeeks");
      if (!raw) {
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
        const completed = weeks.filter((w: { completed?: unknown }) => !!w?.completed).length;
        setPremiumTotal(total);
        setPremiumCompleted(completed);
        setPremiumProgress(total > 0 ? Math.round((completed / total) * 100) : 0);
      } else {
        setPremiumTotal(0);
        setPremiumCompleted(0);
        setPremiumProgress(0);
      }
    } catch (err) {
      // Malformed premiumWeeks — keep the fallback progress values.
    }
  };

  useEffect(() => {
    computeFreeFromStorage();
    computePremiumFromStorage();
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) {
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

    const onPremiumUpdated = () => computePremiumFromStorage();
    const onBasicUpdated = () => computeFreeFromStorage();

    window.addEventListener("premiumWeeksUpdated", onPremiumUpdated);
    window.addEventListener("basicRoadmapUpdated", onBasicUpdated);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("premiumWeeksUpdated", onPremiumUpdated);
      window.removeEventListener("basicRoadmapUpdated", onBasicUpdated);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  const ProgressBar = ({ pct, variant = "default" }: { pct: number; variant?: "default" | "premium" }) => (
    <div className="w-full bg-white/[0.06] rounded-full h-2.5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${Math.max(0, Math.min(100, pct))}%`,
          background: variant === "premium"
            ? "linear-gradient(90deg, #A855F7, #EC4899)"
            : "linear-gradient(90deg, #06B6D4, #8B5CF6)",
        }}
      />
    </div>
  );

  return (
    <div className={`${dark ? "dark" : ""}`}>
      <div className="fixed inset-0 z-0 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.08)_0%,rgba(0,0,0,0)_70%)]" />
        <div className="absolute inset-0 stars" />
        <ShootingStars starColor="#9E00FF" trailColor="#2EB9DF" minSpeed={15} maxSpeed={35} minDelay={1000} maxDelay={3000} />
        <ShootingStars starColor="#FF0099" trailColor="#FFB800" minSpeed={10} maxSpeed={25} minDelay={2000} maxDelay={4000} />
        <ShootingStars starColor="#00FF9E" trailColor="#00B8FF" minSpeed={20} maxSpeed={40} minDelay={1500} maxDelay={3500} />
      </div>

      <main className="relative z-10 min-h-screen text-slate-100 overflow-hidden">
        <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[96%] md:w-[85%] lg:w-[75%] glass-strong rounded-2xl px-3 md:px-5 py-3 shadow-2xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 shadow-lg shadow-violet-500/20">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">SyncVerse</div>
                <div className="text-[11px] text-white/40 -mt-0.5 font-medium tracking-wider uppercase">
                  Learn · Build · Ship
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-6 pr-2">
              <Link to="/roadmaps" className="text-sm text-white/60 hover:text-white transition-colors duration-200">
                Roadmaps
              </Link>
              <Link to="/internships" className="text-sm text-white/60 hover:text-white transition-colors duration-200 flex items-center gap-1.5" aria-label="Internships">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Internships</span>
              </Link>
              <Link to="/programs" className="text-sm text-white/60 hover:text-white transition-colors duration-200">Programs</Link>
              <Link to="/companies" className="text-sm text-white/60 hover:text-white transition-colors duration-200">Companies</Link>
            </div>

            {authUser ? (
              <div className="flex items-center gap-2 md:gap-3">
                <div className="text-sm font-medium text-white/90 hidden sm:block max-w-[100px] truncate">{displayName}</div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-1.5 border-white/10 text-white/70 hover:text-white hover:border-white/20 text-xs md:text-sm">
                  <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button size="sm" className="bg-gradient-to-r from-cyan-400 to-violet-600 text-white border-0 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </nav>

        <div className="fixed top-4 right-[3%] z-40 hidden lg:block">
          <Link to="/premium"><InteractiveHoverButton text="PREMIUM" /></Link>
        </div>

        <header className="pt-24 md:pt-32 pb-10 md:pb-16">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
                <motion.div variants={fadeUp} className="mb-5">
                  <span className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-xs font-semibold glass tracking-wide uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Your Tech Journey — Unified
                  </span>
                </motion.div>

                <motion.h1 variants={fadeUp} className="text-3xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] tracking-tight">
                  {authUser ? (
                    <>
                      Welcome back,{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-white 150 to-black-500">
                        {displayName}
                      </span>
                    </>
                  ) : (
                    <>
                      Master Tech with{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/70">
                        Structured Learning, Real Community, Real Jobs
                      </span>
                    </>
                  )}
                </motion.h1>

                <motion.p variants={fadeUp} className="mt-6 text-lg text-white/50 max-w-xl leading-relaxed">
                  From curated roadmaps to hands-on programs and a buzzing community — everything designed to get you from zero to product-ready.
                </motion.p>

                <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-3 items-center">
                  <Link to="/roadmap-generator">
                    <Button size="lg" className="group flex items-center gap-2.5 px-7 py-3 bg-gradient-to-r from-cyan-400 to-violet-600 text-white border-0 shadow-xl shadow-violet-500/20 hover:shadow-violet-500/35 transition-all duration-300 rounded-xl">
                      <span className="font-semibold">Generate My Roadmap</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>

                  <Link to="/programs">
                    <Button size="lg" variant="outline" className="px-7 py-3 border-white/10 text-white/80 hover:bg-white/5 hover:border-white/20 rounded-xl transition-all duration-300">
                      View Programs
                    </Button>
                  </Link>

                  <Link to="/experts">
                    <Button size="lg" variant="outline" className="px-7 py-3 border-white-500/30 text-white-400 hover:bg-blue-500/10 hover:border-black-500/50 rounded-xl transition-all duration-300">
                      An Expert?
                    </Button>
                  </Link>
                </motion.div>

                <motion.div variants={fadeUp} className="mt-5 text-sm text-white/30">
                  Avg time: 3–6 months · Commitment: 6–10 hrs/week
                </motion.div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="p-6 md:p-8 glass-strong rounded-2xl shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-xs text-white/40 uppercase tracking-wider font-medium">Progress Overview</div>
                      <div className="text-xl font-semibold mt-1 text-white/90">My Roadmap Progress</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-white/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Free Roadmap</div>
                          <div className="text-sm font-medium text-white/80 mt-0.5">{freeCompleted} / {freeTotal} modules</div>
                        </div>
                        <div className="text-lg font-bold text-cyan-400">{Math.round(freeProgress)}%</div>
                      </div>
                      <ProgressBar pct={freeProgress} />
                      <div className="mt-2.5 text-[11px] text-white/25 font-medium">
                        Complete the roadmap to track your progress
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Premium Roadmap</div>
                          <div className="text-sm font-medium text-white/80 mt-0.5">
                            {premiumTotal > 0 ? `${premiumCompleted} / ${premiumTotal} weeks` : "No premium roadmap detected"}
                          </div>
                        </div>
                        <div className="text-lg font-bold text-violet-400">{Math.round(premiumProgress)}%</div>
                      </div>
                      <ProgressBar pct={premiumProgress} variant="premium" />
                      <div className="mt-2.5 text-[11px] text-white/25 font-medium">
                        Complete the roadmap to track your progress
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </header>

        <section className="pb-24">
          <div className="container mx-auto px-6">
            <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={{ show: { transition: { staggerChildren: 0.12 } } }}>
              <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-3 tracking-tight">Why SyncVerse works</motion.h2>
              <motion.p variants={fadeUp} className="text-white/50 max-w-3xl mb-10">
                A unified experience — curated roadmaps, collaborative learning, and placement-driven programs.
              </motion.p>

              <div className="grid md:grid-cols-3 gap-5">
                {[
                  { icon: <Code2 className="h-5 w-5 text-white-400" />, title: "Structured Roadmaps", desc: "Month-by-month learning paths for every stack.", details: "Curated resources, checkpoints, and mini-projects to keep you on track.", color: "from-white-500/20 to-white-500/5" },
                  { icon: <Users className="h-5 w-5 text-white-400" />, title: "Peer Learning", desc: "Study together, build together.", details: "Study groups, pair programming, and mentor office hours included.", color: "from-white-500/20 to-white-500/5" },
                  { icon: <Rocket className="h-5 w-5 text-white-400" />, title: "Top Internships", desc: "GSOC, MLH, and more.", details: "Placement kits, interview practice, and project reviews to help you land roles.", color: "from-white-500/20 to-white-500/5" },
                ].map((f, i) => (
                  <motion.div key={i} variants={fadeUp} className="group relative p-6 rounded-2xl glass hover:bg-white/[0.06] transition-all duration-500">
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-white/[0.06]">{f.icon}</div>
                        <div>
                          <h3 className="font-semibold text-lg">{f.title}</h3>
                          <div className="text-xs text-white/40">{f.desc}</div>
                        </div>
                      </div>
                      <div className="text-sm text-white/50 leading-relaxed">{f.details}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <footer className="py-16">
          <div className="container mx-auto px-6">
            <div className="glass-strong rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="text-2xl font-bold tracking-tight">Ready to build something real?</div>
                <div className="text-sm text-white/40 mt-1">Join cohorts, build projects, and get expert feedback.</div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link to="/roadmap-generator">
                  <Button className="px-7 py-3 bg-gradient-to-r from-cyan-400 to-violet-600 text-white border-0 rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all">
                    Get my roadmap
                  </Button>
                </Link>
                <Link to="/programs">
                  <Button variant="outline" className="px-6 py-3 border-white/10 text-white/70 hover:bg-white/5 rounded-xl">
                    See programs
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-8 text-xs text-white/25 text-center">
              © {new Date().getFullYear()} SyncVerse · Crafted by Hexember Devs
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
