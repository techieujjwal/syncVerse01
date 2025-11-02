"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Star, Zap, Award, TrendingUp, Briefcase, Target, BookOpen } from "lucide-react";

// 类型定义保持不变
type SkillInput = {
  id: string;
  name: string;
  proficiency: number; // 0-5
  lastUsed?: string | null;
};

type UserProfile = {
  id: string;
  name: string;
  city?: string;
  currentTitle?: string;
  currentSalaryLPA?: number;
  yearsExperience?: number;
  skills: SkillInput[];
  goalSalaryLPA?: number;
  goalRole?: string;
};

// 工具函数保持不变
const uid = (prefix = "id") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));

// Mock市场数据保持不变
function mockMarketData() {
  return {
    trendingSkills: [
      { name: "Python", delta: 12 },
      { name: "Kubernetes", delta: 9 },
      { name: "AWS", delta: 7 },
      { name: "Rust", delta: 3 },
      { name: "Blockchain", delta: -1 },
    ],
    roleSalaryMedian: {
      "Backend Engineer": 12,
      "DevOps Engineer": 14,
      "SRE": 15,
      "AI Engineer": 18,
      "Cybersecurity Engineer": 13,
      "Blockchain Engineer": 16,
    },
  };
}

// 预测薪资函数保持不变
function forecastSalary(user: UserProfile, market: ReturnType<typeof mockMarketData>) {
  let base = user.currentSalaryLPA || 0;
  const expFactor = clamp((user.yearsExperience || 0) / 5, 0, 2);
  const skillScore = user.skills.reduce((s, sk) => s + sk.proficiency, 0) / (user.skills.length || 1);
  const trendingBonus = user.skills
    .map((sk) => {
      const found = market.trendingSkills.find((t) => t.name.toLowerCase() === sk.name.toLowerCase());
      if (!found) return 0;
      return (found.delta / 10) * (sk.proficiency / 5);
    })
    .reduce((a, b) => a + b, 0);

  const predicted = Math.round((base * (1 + expFactor * 0.2) + skillScore * 1.8 + trendingBonus * 1.5) * 10) / 10;
  const lower = Math.round(predicted * 0.85 * 10) / 10;
  const upper = Math.round(predicted * 1.25 * 10) / 10;
  return { lower, predicted, upper };
}

// 技能差距分析函数保持不变
function analyzeSkillGap(user: UserProfile, targetRole: string | undefined, market: ReturnType<typeof mockMarketData>) {
  const roleToSkills: Record<string, string[]> = {
    "DevOps Engineer": ["Linux", "Docker", "Kubernetes", "AWS", "CI/CD"],
    "SRE": ["Linux", "Observability", "Kubernetes", "Terraform", "SLO"],
    "AI Engineer": ["Python", "PyTorch", "ML Ops", "Data Pipelines", "TensorFlow"],
    "Blockchain Engineer": ["Solidity", "Smart Contracts", "Ethereum", "Rust", "Crypto"],
    "Cybersecurity Engineer": ["Network Security", "Pentesting", "SIEM", "Detection", "Cloud Security"],
    "Backend Engineer": ["Java", "Spring", "Databases", "System Design", "APIs"],
  };
  const desired = targetRole && roleToSkills[targetRole] ? roleToSkills[targetRole] : ["System Design", "Databases", "Cloud"];
  const userSkillNames = user.skills.map((s) => s.name.toLowerCase());
  const gaps = desired.map((skill) => {
    const idx = userSkillNames.indexOf(skill.toLowerCase());
    const userSkill = idx >= 0 ? user.skills[idx] : null;
    const proficiency = userSkill ? userSkill.proficiency : 0;
    const missing = Math.max(0, 4 - proficiency);
    return { skill, proficiency, missing };
  });
  gaps.sort((a, b) => b.missing - a.missing || a.proficiency - b.proficiency);
  return gaps;
}

// 生成路线图函数保持不变
function generateRoadmap(user: UserProfile, targetRole?: string) {
  const gap = analyzeSkillGap(user, targetRole || user.goalRole, mockMarketData());
  const steps: { id: string; skill: string; weeks: number; outcome: string; resourceHint: string }[] = [];
  gap.forEach((g, i) => {
    if (g.missing <= 0) return;
    const weeks = clamp(2 + g.missing * 3 - Math.floor((user.yearsExperience || 0) / 3), 2, 16);
    steps.push({
      id: uid("step"),
      skill: g.skill,
      weeks,
      outcome: `Attain proficiency ${Math.min(5, g.proficiency + g.missing)}/5 in ${g.skill}`,
      resourceHint: `Project: Build a ${g.skill} focused mini-project + follow curated course`,
    });
  });
  steps.push({
    id: uid("step"),
    skill: "System Design & Interview Prep",
    weeks: 4,
    outcome: "Be interview ready with 6 system design questions and mock interviews",
    resourceHint: "Mock interviews + pramp or mentor sessions",
  });
  return steps;
}

// 徽章计算函数保持不变
function computeBadges(user: UserProfile, planSteps: ReturnType<typeof generateRoadmap>) {
  const badges: { id: string; title: string; description: string; earned: boolean }[] = [];
  const profileComplete = !!user.name && !!user.currentTitle && user.skills.length >= 3 && !!user.currentSalaryLPA;
  badges.push({ id: "badge_profile", title: "Profile Pro", description: "Completed profile with core details.", earned: profileComplete });

  const roadmapExists = planSteps.length > 0;
  badges.push({ id: "badge_roadmap", title: "Roadmap Ready", description: "A personalized roadmap has been generated.", earned: roadmapExists });

  const highAspire = (user.goalSalaryLPA || 0) >= ((user.currentSalaryLPA || 0) * 1.8 + 1);
  badges.push({ id: "badge_aspire", title: "Ambitious", description: "You set a high but achievable salary target.", earned: highAspire });

  const completedWeeks = Number(localStorage.getItem("expert_completed_weeks") || 0);
  const totalWeeks = planSteps.reduce((s, st) => s + st.weeks, 0) || 0;
  const completionRatio = totalWeeks ? completedWeeks / totalWeeks : 0;
  badges.push({ id: "badge_progress", title: "On The Move", description: "Progressing through your roadmap.", earned: completionRatio >= 0.25 });
  badges.push({ id: "badge_halfway", title: "Halfway There", description: "Reached 50% of planned weeks.", earned: completionRatio >= 0.5 });
  badges.push({ id: "badge_done", title: "SuperBadge Achiever", description: "Completed roadmap (simulated).", earned: completionRatio >= 1 });

  return badges;
}

// 🌌 深色网格背景主题调色板
const palette = {
  bg: "relative bg-black text-gray-100",
  card: "bg-gray-800/80 backdrop-blur-lg",
  accent: "bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500",
  primaryText: "text-gray-100",
  subText: "text-gray-400",
  border: "border-gray-700",
  input: "bg-gray-700/50 border-gray-600 text-gray-100",
  button: "bg-gray-700 hover:bg-gray-600",
  skillBar: "bg-gradient-to-r from-purple-500 to-pink-500",
  progress: "bg-gradient-to-r from-green-400 to-teal-400",
};

export default function Expert() {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("expert_profile") : null;
      if (raw) return JSON.parse(raw) as UserProfile;
    } catch (e) {}
    return {
      id: uid("user"),
      name: "",
      city: "",
      currentTitle: "",
      currentSalaryLPA: 5,
      yearsExperience: 2,
      skills: [
        { id: uid("sk"), name: "Java", proficiency: 3 },
        { id: uid("sk"), name: "SQL", proficiency: 3 },
        { id: uid("sk"), name: "Docker", proficiency: 1 },
      ],
      goalSalaryLPA: 10,
      goalRole: "DevOps Engineer",
    } as UserProfile;
  });

  const market = useMemo(() => mockMarketData(), []);

  useEffect(() => {
    try {
      localStorage.setItem("expert_profile", JSON.stringify(user));
    } catch (e) {}
  }, [user]);

  const salaryForecast = useMemo(() => forecastSalary(user, market), [user, market]);
  const planSteps = useMemo(() => generateRoadmap(user, user.goalRole), [user]);
  const badges = useMemo(() => computeBadges(user, planSteps), [user, planSteps]);

  const [editing, setEditing] = useState<"form" | "preview">("form");
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "roadmap" | "market">("profile");

  function updateSkill(id: string, patch: Partial<SkillInput>) {
    setUser((u) => ({ ...u, skills: u.skills.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  }
  function addSkill(name = "") {
    setUser((u) => ({ ...u, skills: [...u.skills, { id: uid("sk"), name, proficiency: 1 }] }));
  }
  function removeSkill(id: string) {
    setUser((u) => ({ ...u, skills: u.skills.filter((s) => s.id !== id) }));
  }

  function resetProgress() {
    localStorage.removeItem("expert_completed_weeks");
    setCopied(false);
  }

  function simulateWeekProgress(weeks = 1) {
    const k = Number(localStorage.getItem("expert_completed_weeks") || 0) + weeks;
    localStorage.setItem("expert_completed_weeks", String(k));
    setUser((u) => ({ ...u }));
  }

  function exportPlan() {
    const payload = { user, forecast: salaryForecast, planSteps, badges };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `career-plan-${user.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyPlanToClipboard() {
    const payload = { user, forecast: salaryForecast, planSteps };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  const completionScore = Math.round(
    clamp(
      (Number(!!user.name) + Number(!!user.currentTitle) + Number(!!user.currentSalaryLPA) + (user.skills.length >= 3 ? 1 : 0)) / 4,
      0,
      1
    ) * 100
  );

  const completedWeeks = Number(localStorage.getItem("expert_completed_weeks") || 0);
  const totalWeeks = planSteps.reduce((s, st) => s + st.weeks, 0) || 0;
  const progressPercentage = totalWeeks ? Math.min(100, Math.round((completedWeeks / totalWeeks) * 100)) : 0;

  return (
    <div
      className={`min-h-screen p-4 md:p-8 ${palette.primaryText}`}
      style={{
        backgroundColor: "#0a0a0a",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* 顶部标题栏 */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="rounded-2xl p-3 shadow-lg"
              style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}
            >
              <Zap className="text-white" size={24} />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Career Catalyst
              </h1>
              <p className="text-sm text-gray-400">AI-powered career growth platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-400">Profile completion</div>
              <div className="text-lg font-bold">{completionScore}%</div>
              <div className="w-24 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                <motion.div 
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #8b5cf6, #ec4899)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${completionScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditing((s) => (s === "form" ? "preview" : "form"))}
              className="rounded-full px-6 py-3 shadow-lg transition flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            >
              {editing === "form" ? "Preview Plan" : "Edit Profile"}
              <ArrowRight className="-rotate-45" />
            </motion.button>
          </div>
        </motion.header>

        {/* 主内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧内容区 */}
          <div className="col-span-1 lg:col-span-7">
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`rounded-2xl p-6 shadow-xl ${palette.card} border ${palette.border}`}
            >
              <AnimatePresence mode="wait">
                {editing === "form" ? (
                  <motion.div key="form" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Briefcase className="text-purple-400" />
                      Tell us about you
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex flex-col gap-2">
                        <span className="text-sm text-gray-400">Full name</span>
                        <motion.input
                          whileFocus={{ scale: 1.02 }}
                          value={user.name}
                          onChange={(e) => setUser((u) => ({ ...u, name: e.target.value }))}
                          className={`rounded-lg p-3 border ${palette.input} transition-all duration-300`}
                          placeholder="Amit Sharma"
                        />
                      </label>

                      <label className="flex flex-col gap-2">
                        <span className="text-sm text-gray-400">City</span>
                        <motion.input
                          whileFocus={{ scale: 1.02 }}
                          value={user.city}
                          onChange={(e) => setUser((u) => ({ ...u, city: e.target.value }))}
                          className={`rounded-lg p-3 border ${palette.input} transition-all duration-300`}
                          placeholder="Bengaluru"
                        />
                      </label>

                      <label className="flex flex-col gap-2">
                        <span className="text-sm text-gray-400">Current title</span>
                        <motion.input
                          whileFocus={{ scale: 1.02 }}
                          value={user.currentTitle}
                          onChange={(e) => setUser((u) => ({ ...u, currentTitle: e.target.value }))}
                          className={`rounded-lg p-3 border ${palette.input} transition-all duration-300`}
                          placeholder="Backend Engineer"
                        />
                      </label>

                      <label className="flex flex-col gap-2">
                        <span className="text-sm text-gray-400">Current salary (LPA)</span>
                        <motion.input
                          whileFocus={{ scale: 1.02 }}
                          type="number"
                          min={0}
                          value={String(user.currentSalaryLPA || "")}
                          onChange={(e) => setUser((u) => ({ ...u, currentSalaryLPA: Number(e.target.value) }))}
                          className={`rounded-lg p-3 border ${palette.input} transition-all duration-300`}
                        />
                      </label>

                      <label className="flex flex-col gap-2">
                        <span className="text-sm text-gray-400">Years Experience</span>
                        <motion.input
                          whileFocus={{ scale: 1.02 }}
                          type="number"
                          min={0}
                          value={String(user.yearsExperience || 0)}
                          onChange={(e) => setUser((u) => ({ ...u, yearsExperience: Number(e.target.value) }))}
                          className={`rounded-lg p-3 border ${palette.input} transition-all duration-300`}
                        />
                      </label>

                      <label className="flex flex-col gap-2">
                        <span className="text-sm text-gray-400">Target role</span>
                        <motion.select
                          whileFocus={{ scale: 1.02 }}
                          value={user.goalRole}
                          onChange={(e) => setUser((u) => ({ ...u, goalRole: e.target.value }))}
                          className={`rounded-lg p-3 border ${palette.input} transition-all duration-300`}
                        >
                          <option>DevOps Engineer</option>
                          <option>SRE</option>
                          <option>AI Engineer</option>
                          <option>Backend Engineer</option>
                          <option>Cybersecurity Engineer</option>
                          <option>Blockchain Engineer</option>
                        </motion.select>
                      </label>

                      <label className="flex flex-col gap-2">
                        <span className="text-sm text-gray-400">Goal salary (LPA)</span>
                        <motion.input
                          whileFocus={{ scale: 1.02 }}
                          type="number"
                          min={0}
                          value={String(user.goalSalaryLPA || "")}
                          onChange={(e) => setUser((u) => ({ ...u, goalSalaryLPA: Number(e.target.value) }))}
                          className={`rounded-lg p-3 border ${palette.input} transition-all duration-300`}
                        />
                      </label>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BookOpen className="text-pink-400" />
                        Skills
                      </h3>
                      <div className="space-y-4">
                        {user.skills.map((sk) => (
                          <motion.div 
                            key={sk.id} 
                            layout
                            whileHover={{ y: -2 }}
                            className={`p-4 rounded-xl border ${palette.border} bg-gray-700/30`}
                          >
                            <div className="flex flex-col md:flex-row md:items-center gap-3">
                              <input
                                value={sk.name}
                                onChange={(e) => updateSkill(sk.id, { name: e.target.value })}
                                className={`rounded-lg p-2 border ${palette.input} flex-1`}
                              />

                              <div className="flex items-center gap-3">
                                <div className="text-sm font-medium text-gray-300">{sk.proficiency}/5</div>
                                <div className="w-24">
                                  <input
                                    type="range"
                                    min={0}
                                    max={5}
                                    value={sk.proficiency}
                                    onChange={(e) => updateSkill(sk.id, { proficiency: Number(e.target.value) })}
                                    className="w-full accent-pink-500"
                                  />
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => removeSkill(sk.id)}
                                  className="text-sm text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-900/30 transition"
                                >
                                  Remove
                                </motion.button>
                              </div>
                            </div>
                            
                            {/* 技能进度条 */}
                            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <motion.div 
                                className={`h-full rounded-full ${palette.skillBar}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${(sk.proficiency / 5) * 100}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </motion.div>
                        ))}

                        <div className="flex flex-wrap gap-3">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => addSkill("")}
                            className="px-4 py-2 rounded-lg border border-dashed border-gray-600 flex items-center gap-2"
                          >
                            <span>+ Add skill</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              const trending = market.trendingSkills.slice(0, 2).map((t) => ({ id: uid("sk"), name: t.name, proficiency: 1 }));
                              setUser((u) => ({ ...u, skills: [...u.skills, ...trending] }));
                            }}
                            className="px-4 py-2 rounded-lg border border-gray-600 flex items-center gap-2"
                          >
                            <TrendingUp size={16} />
                            <span>Add trending</span>
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (!user.name || !user.currentTitle || !user.currentSalaryLPA) {
                            return alert("Please fill name, title and salary");
                          }
                          setEditing("preview");
                        }}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg font-medium"
                      >
                        Generate Roadmap
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="preview" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                        <Target className="text-green-400" />
                        Career Plan Preview
                      </h2>
                      <div className="text-sm px-3 py-1 rounded-full bg-gray-700/50">
                        {user.goalRole}
                      </div>
                    </div>
                    
                    <p className="text-gray-400 mb-6">Forecast & roadmap generated from your profile and live market signals.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <motion.div 
                        whileHover={{ y: -5 }}
                        className={`p-5 rounded-xl border ${palette.border} bg-gradient-to-br from-gray-800/50 to-gray-900/50`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-400">Salary Forecast (LPA)</div>
                          <TrendingUp className="text-green-400" size={18} />
                        </div>
                        <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-400">
                          {salaryForecast.predicted} LPA
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          Range: {salaryForecast.lower} - {salaryForecast.upper} LPA
                        </div>
                      </motion.div>

                      <motion.div 
                        whileHover={{ y: -5 }}
                        className={`p-5 rounded-xl border ${palette.border} bg-gradient-to-br from-gray-800/50 to-gray-900/50`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-400">Readiness Score</div>
                          <Award className="text-yellow-400" size={18} />
                        </div>
                        <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400">
                          {Math.round(Math.min(100, (user.skills.reduce((s, x) => s + x.proficiency, 0) / (user.skills.length * 5)) * 100))}%
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          Based on proficiency + trending skills
                        </div>
                      </motion.div>
                    </div>

                    {/* 进度条 */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Roadmap Progress</span>
                        <span className="font-medium">{progressPercentage}%</span>
                      </div>
                      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${palette.progress}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {completedWeeks} of {totalWeeks} weeks completed
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BookOpen className="text-blue-400" />
                        Learning Roadmap
                      </h3>
                      <div className="space-y-3">
                        {planSteps.map((st, i) => (
                          <motion.div 
                            key={st.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ x: 5 }}
                            className={`p-4 rounded-xl border ${palette.border} flex flex-col md:flex-row md:items-center justify-between gap-3`}
                          >
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xs text-white">
                                  {i + 1}
                                </div>
                                {st.skill}
                              </div>
                              <div className="text-sm text-gray-400 mt-1">{st.outcome} • {st.weeks} weeks</div>
                              <div className="text-xs text-gray-500 mt-2">{st.resourceHint}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm px-2 py-1 rounded bg-gray-700/50">{st.weeks}w</div>
                              <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, (completedWeeks / st.weeks) * 100)}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowExport((p) => !p)}
                        className="px-4 py-2 rounded-lg border border-gray-600 flex items-center gap-2"
                      >
                        <span>Export</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={exportPlan}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center gap-2"
                      >
                        <span>Download JSON</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={copyPlanToClipboard}
                        className="px-4 py-2 rounded-lg bg-gray-700 flex items-center gap-2"
                      >
                        <span>{copied ? "Copied!" : "Copy JSON"}</span>
                      </motion.button>
                    </div>

                    <AnimatePresence>
                      {showExport && (
                        <motion.pre 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 p-4 bg-gray-900/50 rounded-xl max-h-64 overflow-auto text-sm font-mono"
                        >
                          {JSON.stringify({ user, forecast: salaryForecast, planSteps }, null, 2)}
                        </motion.pre>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* SuperBadges 区域 */}
            <motion.div 
              layout 
              className="mt-6 rounded-2xl p-6 shadow-xl ${palette.card} border ${palette.border}"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Award className="text-yellow-400" />
                  SuperBadges
                </h3>
                <div className="text-sm text-gray-400">Milestones & achievements</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((b) => (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ 
                      scale: b.earned ? 1 : 0.95, 
                      opacity: b.earned ? 1 : 0.6,
                      y: b.earned ? 0 : 5
                    }}
                    whileHover={{ y: -5, scale: 1.03 }}
                    className={`p-4 rounded-xl border ${palette.border} ${b.earned ? "bg-gradient-to-br from-gray-800/50 to-gray-900/50" : "bg-gray-800/30"}`}
                  >
                    <div className="flex items-start gap-3">
                      <motion.div 
                        whileHover={{ rotate: 10 }}
                        className={`p-2 rounded-full ${b.earned ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white" : "bg-gray-700 text-gray-500"}`}
                      >
                        <Check size={18} />
                      </motion.div>
                      <div>
                        <div className="font-medium">{b.title}</div>
                        <div className="text-sm text-gray-400 mt-1">{b.description}</div>
                      </div>
                    </div>
                    
                    {b.earned && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        className="h-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mt-3"
                      />
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-400">Simulate progress and unlock badges</div>
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => simulateWeekProgress(2)}
                    className="px-3 py-2 rounded-lg border border-gray-600"
                  >
                    Simulate 2w
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => simulateWeekProgress(6)}
                    className="px-3 py-2 rounded-lg border border-gray-600"
                  >
                    Simulate 6w
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetProgress}
                    className="px-3 py-2 rounded-lg border border-rose-500/50 text-rose-400"
                  >
                    Reset
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 右侧市场信号区域 */}
          <div className="col-span-1 lg:col-span-5">
            <motion.div 
              layout 
              className={`rounded-2xl p-6 shadow-xl h-full ${palette.card} border ${palette.border} sticky top-6`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="text-green-400" />
                  Market Signals
                </h3>
                <div className="text-xs text-gray-400">Auto-updated weekly</div>
              </div>

              {/* 标签页 */}
              <div className="flex border-b border-gray-700 mb-6">
                {["profile", "roadmap", "market"].map((tab) => (
                  <motion.button
                    key={tab}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 text-sm font-medium relative ${
                      activeTab === tab ? "text-purple-400" : "text-gray-400"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {activeTab === tab && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "market" && (
                  <motion.div
                    key="market"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Zap className="text-yellow-400" />
                        Trending Skills
                      </h4>
                      <div className="space-y-3">
                        {market.trendingSkills.map((t) => (
                          <motion.div
                            key={t.name}
                            whileHover={{ x: 5 }}
                            className={`p-3 rounded-lg border ${palette.border} flex items-center justify-between`}
                          >
                            <div>
                              <div className="font-medium">{t.name}</div>
                              <div className="text-sm text-gray-400">Momentum: {t.delta > 0 ? '+' : ''}{t.delta}%</div>
                            </div>
                            <div className={`text-sm px-2 py-1 rounded ${
                              user.skills.some((s) => s.name.toLowerCase() === t.name.toLowerCase())
                                ? "bg-green-900/30 text-green-400"
                                : "bg-gray-700/50 text-gray-400"
                            }`}>
                              {user.skills.some((s) => s.name.toLowerCase() === t.name.toLowerCase()) ? "In profile" : "Not in profile"}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Briefcase className="text-blue-400" />
                        Role Salary Medians
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(market.roleSalaryMedian).map(([r, s]) => (
                          <motion.div
                            key={r}
                            whileHover={{ x: 5 }}
                            className={`p-3 rounded-lg border ${palette.border} flex items-center justify-between`}
                          >
                            <div>
                              <div className="font-medium">{r}</div>
                              <div className="text-sm text-gray-400">Median: {s} LPA</div>
                            </div>
                            <div className={`text-sm px-2 py-1 rounded ${
                              r === user.goalRole
                                ? "bg-purple-900/30 text-purple-400"
                                : "bg-gray-700/50 text-gray-400"
                            }`}>
                              {r === user.goalRole ? "Target" : ""}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-4">Profile Summary</h4>
                      <div className="space-y-4">
                        <div className={`p-4 rounded-lg border ${palette.border}`}>
                          <div className="text-sm text-gray-400 mb-1">Current Role</div>
                          <div className="font-medium">{user.currentTitle || "Not specified"}</div>
                        </div>
                        
                        <div className={`p-4 rounded-lg border ${palette.border}`}>
                          <div className="text-sm text-gray-400 mb-1">Experience</div>
                          <div className="font-medium">{user.yearsExperience || 0} years</div>
                        </div>
                        
                        <div className={`p-4 rounded-lg border ${palette.border}`}>
                          <div className="text-sm text-gray-400 mb-1">Top Skills</div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {user.skills.slice(0, 5).map((skill) => (
                              <div key={skill.id} className="px-3 py-1 rounded-full bg-gray-700/50 text-sm">
                                {skill.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "roadmap" && (
                  <motion.div
                    key="roadmap"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-4">Roadmap Stats</h4>
                      <div className="space-y-4">
                        <div className={`p-4 rounded-lg border ${palette.border}`}>
                          <div className="text-sm text-gray-400 mb-1">Total Duration</div>
                          <div className="font-medium">{totalWeeks} weeks</div>
                        </div>
                        
                        <div className={`p-4 rounded-lg border ${palette.border}`}>
                          <div className="text-sm text-gray-400 mb-1">Skills to Learn</div>
                          <div className="font-medium">{planSteps.length - 1} skills</div>
                        </div>
                        
                        <div className={`p-4 rounded-lg border ${palette.border}`}>
                          <div className="text-sm text-gray-400 mb-1">Estimated Completion</div>
                          <div className="font-medium">
                            {new Date(Date.now() + totalWeeks * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={exportPlan}
                    className="p-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white flex flex-col items-center justify-center gap-1"
                  >
                    <span>Download</span>
                    <span className="text-xs">Plan</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={copyPlanToClipboard}
                    className="p-3 rounded-lg bg-gray-700 flex flex-col items-center justify-center gap-1"
                  >
                    <span>Copy</span>
                    <span className="text-xs">JSON</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => alert('TODO: hook to job search API')}
                    className="p-3 rounded-lg bg-gray-700 flex flex-col items-center justify-center gap-1"
                  >
                    <span>Find</span>
                    <span className="text-xs">Jobs</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => alert('TODO: mentor integration')}
                    className="p-3 rounded-lg bg-gray-700 flex flex-col items-center justify-center gap-1"
                  >
                    <span>Find</span>
                    <span className="text-xs">Mentor</span>
                  </motion.button>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700">
                <h4 className="text-lg font-semibold mb-3">Next Steps</h4>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5"></div>
                    <span>Replace mockMarketData() with real market API</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5"></div>
                    <span>Integrate server-side ML model for accurate forecasts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5"></div>
                    <span>Add Stripe integration for premium mentor hours</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div 
              layout 
              className="mt-6 rounded-2xl p-5 shadow-xl ${palette.card} border ${palette.border}"
            >
              <h4 className="font-bold mb-3 flex items-center gap-2">
                <Star className="text-yellow-400" />
                Demo Tips
              </h4>
              <ol className="text-sm text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs">1</div>
                  <span>Fill profile, add trending skills, generate roadmap</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs">2</div>
                  <span>Simulate progress to unlock SuperBadges</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs">3</div>
                  <span>Download JSON plan for backend integration</span>
                </li>
              </ol>
            </motion.div>
          </div>
        </div>

        <footer className="mt-12 text-center text-xs text-gray-500">
          Career Catalyst — Designed for demo. Replace mocks with real APIs for production.
        </footer>
      </div>
    </div>
  );
}
