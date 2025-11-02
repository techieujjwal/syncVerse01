"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Code2, Users, Rocket, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShootingStars } from "@/components/ui/shooting-stars";

type Accent = "neon" | "elegant" | "vibe";

/**
 * Make TypeScript aware of the botpress global (safe any)
 */
declare global {
  interface Window {
    botpressWebChat?: any;
  }
}

const Index = () => {
  const [user, setUser] = useState<string | null>(null);
  const [dark, setDark] = useState(true);
  const [accent, setAccent] = useState<Accent>("neon");
  const botpressLoadedRef = useRef(false);

  useEffect(() => {
    const loggedUser = localStorage.getItem("username");
    if (loggedUser) setUser(loggedUser);
  }, []);

  useEffect(() => {
    // Client-only + idempotent
    if (typeof window === "undefined") return;
    if (botpressLoadedRef.current) return;

    const INJECT_ID = "bp-webchat-inject";
    const CUSTOM_ID = "bp-custom-20251101201231";
    const INJECT_SRC = "https://cdn.botpress.cloud/webchat/v3.3/inject.js";
    const CUSTOM_SRC = "https://files.bpcontent.cloud/2025/11/01/20/20251101201231-4LQ29P7C.js";

    const appendScriptToHead = (id: string, src: string, defer = false) => {
      const existing = document.getElementById(id) as HTMLScriptElement | null;
      if (existing) return existing;
      const s = document.createElement("script");
      s.id = id;
      s.src = src;
      s.async = true;
      if (defer) s.defer = true;
      document.head.appendChild(s);
      return s;
    };

    try {
      // 1) Add injector to head
      const inject = appendScriptToHead(INJECT_ID, INJECT_SRC, false);

      // Safety: if inject script already present and window.botpressWebChat exists, skip waiting
      const onInjectorReady = () => {
        try {
          // 2) Once injector is ready, append the instance script
          appendScriptToHead(CUSTOM_ID, CUSTOM_SRC, true);

          // 3) Optional: auto-show chat after short delay (only for testing/confirmation)
          setTimeout(() => {
            try {
              if (window.botpressWebChat && typeof window.botpressWebChat.sendEvent === "function") {
                window.botpressWebChat.sendEvent({ type: "show" });
              }
            } catch (err) {
              // no-op
            }
          }, 2500);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Failed to append Botpress instance script:", err);
        }
      };

      // If injector already loaded and botpress available, use immediately
      if (window.botpressWebChat) {
        onInjectorReady();
      } else if (inject) {
        // Listen to onload; also add a fallback timeout in case onload doesn't fire
        let fired = false;
        inject.addEventListener("load", () => {
          fired = true;
          onInjectorReady();
        });

        // Fallback: if load doesn't fire in X ms, attempt anyway
        const fallbackTimeout = setTimeout(() => {
          if (!fired) {
            onInjectorReady();
          }
        }, 6000);

        // No cleanup function necessary for single-page load, but guard memory:
        // (we won't remove scripts on unmount because we want chat to persist across routes)
        // Clear fallback if unmounted quickly
        const cleanup = () => clearTimeout(fallbackTimeout);
        // call cleanup on unmount
        return cleanup;
      } else {
        // If unable to append inject script (very unlikely), still try instance after delay
        setTimeout(onInjectorReady, 3000);
      }

      botpressLoadedRef.current = true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Botpress integration error:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("username");
    setUser(null);
  };

  const community = useMemo(
    () => [
      { name: "Rohit", initials: "R", color: "from-pink-400 to-red-500" },
      { name: "Ujjwal", initials: "U", color: "from-purple-400 to-indigo-500" },
      { name: "Taran", initials: "T", color: "from-green-300 to-teal-400" },
      { name: "Udhav", initials: "U", color: "from-yellow-300 to-orange-400" },
    ],
    []
  );

  const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <div className={`${dark ? "dark" : ""}`}>
      {/* === BACKGROUND === */}
      <div className="fixed inset-0 z-0 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1)_0%,rgba(0,0,0,0)_80%)]" />
        <div className="absolute inset-0 stars" />
        <ShootingStars starColor="#9E00FF" trailColor="#2EB9DF" minSpeed={15} maxSpeed={35} minDelay={1000} maxDelay={3000} />
        <ShootingStars starColor="#FF0099" trailColor="#FFB800" minSpeed={10} maxSpeed={25} minDelay={2000} maxDelay={4000} />
        <ShootingStars starColor="#00FF9E" trailColor="#00B8FF" minSpeed={20} maxSpeed={40} minDelay={1500} maxDelay={3500} />
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
                <div className="text-xs text-white/50 -mt-1">Learn — Build — Ship</div>
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
                <Button size="sm" className="bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] text-white">Get Started</Button>
              </Link>
            )}
          </div>
        </nav>

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
                      , welcome back 👋
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
                  From curated roadmaps to hands-on programs and a buzzing community — everything designed to get you from
                  zero to product-ready.
                </motion.p>

                <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3 items-center">
                  <Link to="/roadmap-generator">
                    <Button size="lg" className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-400 to-indigo-500 text-black">
                      <span>Generate My Roadmap</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>

                  <Link to="/programs">
                    <Button size="lg" variant="outline" className="px-6 py-3 border-white/10 text-white/90">
                      View Programs
                    </Button>
                  </Link>

                  <div className="ml-2 text-sm text-white/60">
                    <span className="font-medium">Avg time:</span> 3–6 months ·{" "}
                    <span className="font-medium">Commitment:</span> 6–10 hrs/week
                  </div>
                </motion.div>
              </motion.div>

              {/* RIGHT PANEL */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="p-6 md:p-8 border border-white/8 backdrop-blur-md bg-black/30">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-white/70">Active cohorts</div>
                      <div className="text-2xl font-semibold">Frontend Fundamentals</div>
                    </div>
                    <div className="text-sm text-white/60">Starts in 3 days</div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex -space-x-3">
                      {community.map((c) => (
                        <motion.div key={c.name} whileHover={{ scale: 1.12, y: -6 }} className="w-10 h-10 rounded-full ring-2 ring-white/8 flex items-center justify-center">
                          <div className={`w-full h-full rounded-full bg-gradient-to-br ${c.color} flex items-center justify-center text-black/80`}>
                            {c.initials}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="text-sm text-white/60">1.2k learners · 98% completion</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-md p-3 bg-white/3">
                      <div className="text-xs text-white/60">Next session</div>
                      <div className="text-sm font-medium">Live Q&A — Sat, 7 PM</div>
                    </div>
                    <div className="rounded-md p-3 bg-white/3">
                      <div className="text-xs text-white/60">Mentors</div>
                      <div className="text-sm font-medium">Weekly office hours</div>
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
              <motion.p variants={fadeUp} className="text-white/70 max-w-3xl mb-8">
                A unified experience — curated roadmaps, collaborative learning, and placement-driven programs.
              </motion.p>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: <Code2 className="h-5 w-5 text-white" />,
                    title: "Structured Roadmaps",
                    desc: "Month-by-month learning paths for every stack.",
                    details: "Curated resources, checkpoints, and mini-projects to keep you on track.",
                  },
                  {
                    icon: <Users className="h-5 w-5 text-white" />,
                    title: "Peer Learning",
                    desc: "Study together, build together.",
                    details: "Study groups, pair programming, and mentor office hours included.",
                  },
                  {
                    icon: <Rocket className="h-5 w-5 text-white" />,
                    title: "Top Internships",
                    desc: "GSOC, MLH, and more.",
                    details: "Placement kits, interview practice, and project reviews to help you land roles.",
                  },
                ].map((f, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 transition-all duration-500"
                  >
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

            <div className="mt-6 text-xs text-white/50 text-center">
              © {new Date().getFullYear()} SyncVerse · Crafted with ❤️ for learners
            </div>
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
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default Index;
