import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Users, ArrowRight, X, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type Roadmap = {
  id: number;
  title: string;
  duration: string;
  level: string;
  learners: number;
  techs: string[];
  description: string;
  guide: string; // HTML-safe string (we render with dangerouslySetInnerHTML)
};

/* --------------------------- Long Guides --------------------------- */
/* Each guide is long and structured into headings and lists. */

const roadmapsData: Roadmap[] = [
  {
    id: 1,
    title: "Full Stack Web Development",
    duration: "6 months",
    level: "Beginner → Intermediate",
    learners: 14256,
    techs: ["HTML", "CSS", "JavaScript", "React", "Node.js", "PostgreSQL", "TypeScript"],
    description: "From static pages to production-grade full-stack apps — end-to-end path.",
    guide: `
<h2>Overview</h2>
<p>This Full Stack Web Development roadmap is focused on taking a developer from the basics of HTML and CSS to building, testing, securing, and deploying production-grade web applications. Over a structured 6-month timeline you'll acquire the skills to design user interfaces, build robust backends, model data, and operate continuous deployment workflows. The aim is to finish with 2–3 polished portfolio projects, clear documentation, and an automated CI/CD pipeline demonstrating real-world readiness.</p>

<h3>Skills to Master</h3>
<ul>
<li>Semantic HTML, responsive CSS (Flexbox, Grid), accessibility (a11y)</li>
<li>Modern JavaScript (ES6+), asynchronous programming, browser APIs</li>
<li>React (hooks, context, routing), component architecture and testing</li>
<li>TypeScript fundamentals for safer code</li>
<li>Node.js with Express (or Fastify), RESTful API design, validation and error handling</li>
<li>Relational DB design with PostgreSQL, queries, indices, migrations</li>
<li>Authentication/Authorization (JWT, OAuth patterns), security best practices</li>
<li>Dev tooling: Git, unit & integration testing, linters, formatters</li>
<li>Deployment: Docker basics, Vercel/Render/AWS deployment patterns, CI/CD (GitHub Actions)</li>
</ul>

<h3>Month-by-Month Roadmap</h3>
<p><strong>Month 1 — Foundations:</strong> Learn HTML semantics and CSS layout systems. Build 2-3 static pages (portfolio, landing page, blog index). Understand accessibility basics: keyboard nav, semantic headings, ARIA where required. Start using Git — follow a consistent commit message style and host repos on GitHub.</p>

<p><strong>Month 2 — JavaScript & Tooling:</strong> Deep-dive into vanilla JavaScript — functions, closures, prototypes, async/await, fetch API. Create small interactive components (tabs, modals, form validations). Use npm, learn module systems, and configure a fast bundler (Vite). Add ESLint + Prettier and unit tests for pure JS logic.</p>

<p><strong>Month 3 — Frontend Framework (React):</strong> Learn React basics, component composition, hooks, and lifecycle. Introduce TypeScript gradually. Build a medium project (e.g., notes app or small e-commerce UI) and add component tests (React Testing Library) and snapshot checks. Implement routing and protected client-only routes.</p>

<p><strong>Month 4 — Backend & Databases:</strong> Start Node.js/Express APIs: routes, controllers, middleware, validation (e.g., Joi/Zod). Wire up PostgreSQL, design normalized schemas, and implement migrations. Implement authentication (JWT with refresh tokens or session-based flows). Add API tests and use Postman for manual verification.</p>

<p><strong>Month 5 — Integration & Scaling:</strong> Connect frontend to API, handle auth flows, and implement role-based UI. Learn caching basics (Redis) for expensive queries. Introduce background processing (Bull or equivalent) for async tasks. Containerize with Docker for parity across environments.</p>

<p><strong>Month 6 — Production & Portfolio:</strong> Add CI pipelines (GitHub Actions) to run tests and deploy on push. Deploy frontend to Vercel or Netlify and backend to Render or a cloud VM; incorporate environment variables and secrets management. Add monitoring (Sentry) and logs. Finalize a capstone application and write a technical write-up for each project.</p>

<h3>Practice Projects (deliverables)</h3>
<ul>
<li>Portfolio + Markdown-based blog with SSR/SSG</li>
<li>Task manager with authentication, role-based access, and search</li>
<li>Mini e-commerce storefront with mock checkout and admin panel</li>
</ul>

<h3>Free Resources</h3>
<ul>
<li>MDN Web Docs: https://developer.mozilla.org/</li>
<li>freeCodeCamp: https://www.freecodecamp.org/</li>
<li>Official React docs: https://reactjs.org/</li>
<li>Prisma docs: https://www.prisma.io/docs/</li>
<li>Vercel deployment guides: https://vercel.com/docs</li>
</ul>

<h3>Tips for Success</h3>
<p>Commit to weekly milestones and publicize progress through GitHub readmes and short demo videos. Seek code reviews from peers or mentors, maintain small PRs, and practice writing clear README files. Employers look for clarity, reproducibility, and measurable outcomes — tests, CI status, and deployment links are enormous advantages.</p>
`,
  },

  {
    id: 2,
    title: "Frontend Development",
    duration: "5 months",
    level: "Beginner → Intermediate",
    learners: 11234,
    techs: ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Tailwind"],
    description: "Master modern frontend: performance, UX, accessibility, component-driven design.",
    guide: `
<h2>Overview</h2>
<p>Frontend development is where code meets people. This roadmap prepares you to craft interactive, accessible, and high-performance user interfaces. Over roughly 5 months you'll build component systems, master state management, adopt TypeScript, and design for performance and accessibility. The output should be a polished UI portfolio showcasing production-level components, accessible patterns, and performance engineering.</p>

<h3>Skills to Master</h3>
<ul>
<li>Semantic HTML and accessible markup</li>
<li>Responsive CSS with Grid & Flexbox, CSS architecture (BEM, utility-first)</li>
<li>Modern JavaScript tooling and ESNext syntax</li>
<li>React patterns, hooks, composition, context, and testing</li>
<li>TypeScript in the UI layer</li>
<li>Styling strategies: Tailwind, CSS Modules, Styled Components</li>
<li>Performance: code splitting, lazy loading, image optimization, CWS</li>
<li>Design system thinking and component documentation (Storybook)</li>
</ul>

<h3>Month-by-Month</h3>
<p><strong>Month 1 — Fundamentals:</strong> HTML semantics, CSS layout systems, responsive principles. Build multiple responsive pages and learn devtools profiling.</p>

<p><strong>Month 2 — JavaScript & Accessibility:</strong> Deep JS concepts, event handling, and basic accessibility patterns — keyboard interactions and ARIA roles.</p>

<p><strong>Month 3 — React + TypeScript:</strong> Build several components, integrate TypeScript, and test components using React Testing Library.</p>

<p><strong>Month 4 — Styling & Performance:</strong> Adopt Tailwind or your preferred system, implement critical CSS, and tune performance with lazy-loading and prefetch strategies.</p>

<p><strong>Month 5 — SSR/SSG & Portfolio:</strong> Learn Next.js for SEO and performance, deploy polished sample apps, and document components using Storybook.</p>

<h3>Practice Projects</h3>
<ul>
<li>Marketing site + accessible form flows</li>
<li>Admin dashboard with charts and data tables</li>
<li>Component library published as NPM package</li>
</ul>

<h3>Resources</h3>
<ul>
<li>MDN Web Docs, React Docs, Tailwind CSS docs</li>
<li>Frontend Mentor for real-world UI challenges</li>
<li>A11y Project & Inclusive Components</li>
</ul>

<h3>Tips</h3>
<p>Focus on the end-user: accessibility and performance are key differentiators. Ship small components, test them, and document with stories. Use design tokens and keep visual consistency across projects.</p>
`,
  },

  {
    id: 3,
    title: "Backend Engineering",
    duration: "6 months",
    level: "Intermediate → Advanced",
    learners: 9234,
    techs: ["Node.js", "Express", "PostgreSQL", "Redis", "Docker"],
    description: "Design APIs, build resilient services, manage data and scalability.",
    guide: `
<h2>Overview</h2>
<p>The Backend Engineering roadmap covers designing robust systems that power modern apps — APIs, data modeling, background jobs, scaling, and observability. The emphasis is on engineering discipline: predictable deployments, reliable services, and clear operational procedures.</p>

<h3>Skills to Master</h3>
<ul>
<li>Server-side programming (Node.js) or alternate backend language (Go, Python)</li>
<li>REST and GraphQL API design, idempotency, rate limiting</li>
<li>Relational DB modelling (PostgreSQL), indexing, transactions</li>
<li>Caching with Redis, background processing and task queues</li>
<li>Authentication & authorization (JWT, OAuth2), secure storage</li>
<li>Testing strategies (unit, integration), CI/CD, and containerization</li>
<li>Monitoring, logging, and tracing for observability</li>
</ul>

<h3>Month-by-Month</h3>
<p><strong>Month 1 — Language & Concurrency:</strong> Master Node event loop, async patterns, and module structure. Write testable code and unit tests.</p>

<p><strong>Month 2 — API Design & DB:</strong> Build REST services, model data with PostgreSQL, implement migrations and query optimization.</p>

<p><strong>Month 3 — Security & Auth:</strong> Implement secure auth flows, protect endpoints, and implement data validation and sanitization.</p>

<p><strong>Month 4 — Scaling & Caching:</strong> Add Redis caching, paginate endpoints, and introduce background workers for long-running tasks.</p>

<p><strong>Month 5 — Deployment:</strong> Dockerize services, configure CI pipelines, and deploy to a cloud platform with environment separation.</p>

<p><strong>Month 6 — Observability & Hardening:</strong> Add metrics, tracing, and an alerting strategy. Conduct load tests and implement graceful degradation.</p>

<h3>Practice Projects</h3>
<ul>
<li>Analytics event ingestion pipeline with batching and idempotency</li>
<li>Microservice for processing uploads and generating derivatives</li>
<li>Auth service supporting OAuth and JWT with refresh token rotation</li>
</ul>

<h3>Resources</h3>
<ul>
<li>Node.js official docs, PostgreSQL docs, Redis docs</li>
<li>12factor.net for app design principles</li>
<li>OWASP Top 10 for security fundamentals</li>
</ul>

<h3>Tips</h3>
<p>Prioritize observability and testing. Build reproducible local dev environments and practice on staging before production. Document postmortems and runbook entries for incidents.</p>
`,
  },

  {
    id: 4,
    title: "Mobile Development",
    duration: "5 months",
    level: "Beginner → Intermediate",
    learners: 7345,
    techs: ["React Native", "Expo", "Swift", "Kotlin"],
    description: "Build cross-platform mobile apps with a focus on UX and deployment.",
    guide: `
<h2>Overview</h2>
<p>Mobile Development roadmap trains you to create cross-platform apps (React Native/Expo) and understand native behaviors when needed. You will learn mobile UI patterns, offline storage, native APIs, optimization, and release flows for App Store and Play Store.</p>

<h3>Skills to Master</h3>
<ul>
<li>React Native & Expo; native module basics (Swift/Kotlin)</li>
<li>Navigation patterns and component performance</li>
<li>Offline-first strategies, local DBs (SQLite/Realm)</li>
<li>Push notifications, background tasks, and permissions</li>
<li>Testing on real devices and release pipelines (TestFlight, Play Console)</li>
</ul>

<h3>Month-by-Month</h3>
<p><strong>Month 1 — Basics:</strong> Set up Expo, build UI components, and explore Flexbox layouts on mobile.</p>

<p><strong>Month 2 — Data & Navigation:</strong> Add navigation, persistent storage, and input handling; manage app state effectively.</p>

<p><strong>Month 3 — Native APIs & Performance:</strong> Use device APIs and optimize lists and images for memory and battery.</p>

<p><strong>Month 4 — Backend Integration:</strong> Secure auth flows, offline sync strategies, and efficient networking.</p>

<p><strong>Month 5 — Testing & Release:</strong> End-to-end tests and store submission workflows; set up crash reporting and analytics.</p>

<h3>Practice Projects</h3>
<ul>
<li>Habit tracker with offline sync and scheduled reminders</li>
<li>Photo-sharing app with uploads and image transforms</li>
<li>Delivery tracker with real-time location updates</li>
</ul>

<h3>Resources</h3>
<ul>
<li>React Native docs, Expo docs, official platform docs (Android/iOS)</li>
<li>Debugging guides and performance tips from community blogs</li>
</ul>

<h3>Tips</h3>
<p>Always test on varied devices. Optimize for battery and network constraints; prefer incremental rollouts when releasing to users.</p>
`,
  },

  {
    id: 5,
    title: "DevOps & Cloud Engineering",
    duration: "6 months",
    level: "Intermediate → Advanced",
    learners: 6123,
    techs: ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD"],
    description: "Infrastructure as Code, orchestration, CI/CD, monitoring, and SRE basics.",
    guide: `
<h2>Overview</h2>
<p>DevOps & Cloud Engineering roadmap is focused on automating infrastructure, managing orchestration platforms, and building robust CI/CD pipelines. You will learn to provision cloud resources, containerize services, orchestrate them at scale, and observe production systems with metrics and logs.</p>

<h3>Skills to Master</h3>
<ul>
<li>Linux fundamentals, shell scripting, and system administration</li>
<li>Docker and container registry workflows</li>
<li>Kubernetes primitives and cluster operations</li>
<li>IaC with Terraform and state management</li>
<li>CI/CD pipelines (GitHub Actions/GitLab CI) and GitOps approaches</li>
<li>Monitoring and alerting with Prometheus/Grafana and ELK</li>
</ul>

<h3>Month-by-Month</h3>
<p><strong>Month 1 — Linux & Containers:</strong> Master shell usage and container fundamentals. Containerize sample apps and understand networking.</p>

<p><strong>Month 2 — Kubernetes:</strong> Deploy apps to local clusters (Kind, minikube), manage manifests and config maps, and learn service discovery.</p>

<p><strong>Month 3 — IaC:</strong> Provision cloud infra with Terraform, manage remote state, and adopt module-based design.</p>

<p><strong>Month 4 — CI/CD & GitOps:</strong> Implement pipelines to test and deploy, and learn GitOps for continuous delivery.</p>

<p><strong>Month 5 — Observability & Security:</strong> Add metrics, logging, and secure your pipelines with scanning and policy checks.</p>

<p><strong>Month 6 — Resilience:</strong> Implement autoscaling, backup strategies, and practice incident response drills.</p>

<h3>Practice Projects</h3>
<ul>
<li>CI/CD pipeline for a microservice app with canary or blue/green deploys</li>
<li>Kubernetes cluster with Horizontal Pod Autoscaler and monitoring dashboards</li>
<li>Terraform-managed infra with modules and environment separation</li>
</ul>

<h3>Resources</h3>
<ul>
<li>Terraform docs, Kubernetes docs, AWS official training</li>
<li>CNCF projects and tutorials for hands-on labs</li>
</ul>

<h3>Tips</h3>
<p>Automate repeatable tasks, keep infrastructure versioned, and test backups and restores. Start small and expand; small, reversible changes are safer than large, risky ones.</p>
`,
  },

  {
    id: 6,
    title: "AI / ML Engineering",
    duration: "6 months",
    level: "Advanced",
    learners: 5231,
    techs: ["Python", "NumPy", "Pandas", "TensorFlow", "PyTorch"],
    description: "Data pipelines, model building, deep learning, and MLOps for production systems.",
    guide: `
<h2>Overview</h2>
<p>The AI/ML Engineering roadmap prepares you to build and productionize machine learning models. The path covers math foundations, data preparation, classic ML algorithms, deep learning, and MLOps practices for deployment and monitoring. The emphasis is practical reproducibility and production readiness — designing models that can be served and maintained reliably.</p>

<h3>Skills to Master</h3>
<ul>
<li>Python for data engineering (NumPy, Pandas)</li>
<li>Probability, statistics, linear algebra essentials</li>
<li>Supervised/unsupervised algorithms and evaluation methods</li>
<li>Deep learning with PyTorch/TensorFlow and model tuning</li>
<li>Model serving with FastAPI/TorchServe and containerization</li>
<li>MLOps tools: DVC, MLflow, experiment tracking, and CI for models</li>
</ul>

<h3>Month-by-Month</h3>
<p><strong>Month 1 — Foundations:</strong> Strengthen Python and math fundamentals. Practice EDA with Pandas and visualization.</p>

<p><strong>Month 2 — Classical ML:</strong> Implement regression, classification, tree-based models, cross-validation, and hyperparameter tuning.</p>

<p><strong>Month 3 — Deep Learning:</strong> Build and train CNNs/RNNs and understand optimization, regularization, and transfer learning.</p>

<p><strong>Month 4 — Advanced Architectures:</strong> Work with attention mechanisms and transformers; fine-tune pretrained models for specific tasks.</p>

<p><strong>Month 5 — Deployment & MLOps:</strong> Containerize training and inference code, build prediction APIs, and implement monitoring for model drift.</p>

<p><strong>Month 6 — Production Projects:</strong> Deliver an end-to-end system: ingestion, features, training pipeline, serving endpoint, and monitoring with alerts.</p>

<h3>Practice Projects</h3>
<ul>
<li>Image classification pipeline with augmentation and transfer learning</li>
<li>Recommendation system with offline/online evaluation</li>
<li>End-to-end NLP pipeline with fine-tuning and deployed inference</li>
</ul>

<h3>Resources</h3>
<ul>
<li>Coursera (Andrew Ng), Fast.ai, PyTorch and TensorFlow docs</li>
<li>Kaggle for datasets and competitions</li>
</ul>

<h3>Tips</h3>
<p>Focus on reproducibility. Version datasets, record experiments, and automate retraining where practical. Emphasize explainability and operational monitoring in production settings.</p>
`,
  },

  {
    id: 7,
    title: "Data Science & Analytics",
    duration: "6 months",
    level: "Beginner → Intermediate",
    learners: 4789,
    techs: ["Python", "Pandas", "SQL", "Visualization", "Statistics"],
    description: "Exploratory analysis, statistical inference, dashboards, and data products.",
    guide: `
<h2>Overview</h2>
<p>Data Science & Analytics roadmap trains you to extract insights from data and communicate them effectively. The path emphasizes data cleaning, exploratory analysis, modeling when appropriate, dashboarding, and building repeatable data workflows that stakeholders can trust.</p>

<h3>Skills to Master</h3>
<ul>
<li>SQL for complex querying and joins</li>
<li>Data cleaning and transformation with Pandas</li>
<li>Visualization and storytelling with Matplotlib, Seaborn, or Plotly</li>
<li>Statistical testing and A/B testing design</li>
<li>Basic predictive models and validation techniques</li>
<li>Dashboarding with tools like Tableau or Power BI</li>
</ul>

<h3>Month-by-Month</h3>
<p><strong>Month 1 — SQL & Wrangling:</strong> Master joins, window functions, and aggregation. Clean messy datasets and automate steps with reproducible notebooks.</p>

<p><strong>Month 2 — EDA & Visualization:</strong> Explore distributions, correlations, and conduct feature discovery. Produce clear visual stories for stakeholders.</p>

<p><strong>Month 3 — Stats & Experimentation:</strong> Learn hypothesis testing, effect sizes, and experiment design for valid A/B testing.</p>

<p><strong>Month 4 — Modeling:</strong> Train simple models, validate with cross-validation, and interpret outputs for business impact.</p>

<p><strong>Month 5 — Productionizing Dashboards:</strong> Build scheduled reports, pipeline automation, and lightweight ETL for daily metrics.</p>

<p><strong>Month 6 — Capstone:</strong> Deliver a data product with ingestion, analysis, a model if appropriate, and a dashboard plus business recommendations.</p>

<h3>Practice Projects</h3>
<ul>
<li>Exploratory analysis & dashboard for public datasets</li>
<li>A/B testing pipeline with simulated traffic</li>
<li>Time-series forecasting for inventory or demand</li>
</ul>

<h3>Resources</h3>
<ul>
<li>Kaggle Learn, SQLBolt, Coursera Data Science tracks</li>
</ul>

<h3>Tips</h3>
<p>Communicate business impact, not just model metrics. Keep notebooks reproducible, include assumptions, and provide next-step recommendations alongside charts.</p>
`,
  },

  {
    id: 8,
    title: "Cybersecurity Engineering",
    duration: "6 months",
    level: "Intermediate",
    learners: 3912,
    techs: ["Networking", "Linux", "Cryptography", "Web Security", "Pentesting"],
    description: "Defend systems, identify vulnerabilities, and practice responsible disclosure.",
    guide: `
<h2>Overview</h2>
<p>The Cybersecurity Engineering roadmap equips you to secure systems and respond to incidents. It covers networking fundamentals, secure coding, threat modeling, vulnerability assessment, penetration testing basics in controlled environments, and incident response planning.</p>

<h3>Skills to Master</h3>
<ul>
<li>Networking fundamentals (TCP/IP, DNS, routing)</li>
<li>Linux administration and secure hardening</li>
<li>Secure coding and OWASP Top 10 mitigations</li>
<li>Cryptography basics (TLS, symmetric/asymmetric)</li>
<li>Penetration testing tools (Nmap, Burp, Metasploit) used in lab environments</li>
<li>Incident response and forensics fundamentals</li>
</ul>

<h3>Month-by-Month</h3>
<p><strong>Month 1 — Fundamentals:</strong> Learn networking, packet capture basics (tcpdump, Wireshark), and Linux hardening steps.</p>

<p><strong>Month 2 — Web Security:</strong> Explore common vulnerabilities (XSS, SQLi) and fixes. Practice on intentionally vulnerable lab apps (DVWA, Juice Shop).</p>

<p><strong>Month 3 — Cryptography & Auth:</strong> Study TLS, token security, password storage, and secure key handling patterns.</p>

<p><strong>Month 4 — Pentest Tooling:</strong> Use Nmap, Nikto, and Burp Suite in a safe lab environment for reconnaissance and scanning.</p>

<p><strong>Month 5 — Incident Response:</strong> Build basic playbooks, logging pipelines, and practice containment/forensics in controlled scenarios.</p>

<p><strong>Month 6 — Policy & Governance:</strong> Implement automated dependency scanning, secret detection, and basic compliance checks. Draft a simple security policy and perform a tabletop incident drill.</p>

<h3>Practice Projects</h3>
<ul>
<li>Vulnerable app audit & hardening report</li>
<li>Simple IDS rules and alerting dashboard</li>
<li>Incident response runbook with sample playbook</li>
</ul>

<h3>Resources</h3>
<ul>
<li>OWASP Top 10, TryHackMe, HackTheBox (use legal practice environments)</li>
<li>Official vendor docs for security tools and SANS readings for fundamentals</li>
</ul>

<h3>Tips</h3>
<p>Practice only in legal, isolated environments. Document findings, prioritize fixes by impact & exploitability, and always follow an ethical disclosure process.</p>
`,
  },
];

export default function Roadmaps(): JSX.Element {
  const [query, setQuery] = useState("");
  const [stackFilter, setStackFilter] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Roadmap | null>(null);
  const { toast } = useToast();

  const allStacks = useMemo(() => {
    const s = new Set<string>();
    roadmapsData.forEach((r) => r.techs.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roadmapsData.filter((r) => {
      const matchesQuery =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.techs.join(" ").toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (stackFilter.size === 0) return true;
      return Array.from(stackFilter).some((stk) => r.techs.includes(stk));
    });
  }, [query, stackFilter]);

  const toggleStack = (stack: string) => {
    setStackFilter((prev) => {
      const n = new Set(prev);
      if (n.has(stack)) n.delete(stack);
      else n.add(stack);
      return n;
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-10">
          <Link to="/" className="text-sm text-white/40 hover:text-white/70 mb-6 inline-flex items-center transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
            Roadmap Hub — <span >Deep Learning Paths</span>
          </h1>
          <p className="text-white/40 mb-6 max-w-2xl">
            Choose a structured 5–6 month learning path — each guide gives a comprehensive month-by-month plan, projects, resources, and professional tips.
          </p>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                placeholder="Search roadmaps, descriptions, or stacks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 rounded-xl h-11"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                className={`cursor-pointer px-3 py-1 rounded-lg transition-all ${stackFilter.size === 0
                    ? "bg-white-500/20 text-white-300 border-white-500/30"
                    : "bg-white/[0.04] text-white/50 border-white/10 hover:bg-white/[0.06]"
                  }`}
                onClick={() => setStackFilter(new Set())}
              >
                All Stacks
              </Badge>

              {allStacks.map((s) => (
                <Badge
                  key={s}
                  className={`cursor-pointer px-3 py-1 rounded-lg transition-all ${stackFilter.has(s)
                      ? "bg-white-500/20 text-white-300 border-white-500/30"
                      : "bg-white/[0.04] text-white/50 border-white/10 hover:bg-white/[0.06]"
                    }`}
                  onClick={() => toggleStack(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((r, idx) => (
            <Card key={r.id} className="group p-6 glass hover:bg-white/[0.06] rounded-2xl transition-all duration-500">
              <div className="flex items-start justify-between mb-3">
                <Badge variant="outline" className="border-violet-500/30 text-violet-400 rounded-lg text-[10px] uppercase tracking-wider">
                  {r.level}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <Users className="h-3.5 w-3.5" /> <span>{r.learners.toLocaleString()}</span>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-2 group-hover:text-violet-300 transition-colors">{r.title}</h3>
              <p className="text-sm text-white/40 mb-3 leading-relaxed">{r.description}</p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {r.techs.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px] bg-white/[0.06] text-white/60 border-0 rounded-md px-2 py-0.5">{t}</Badge>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-white/30 mb-4">
                <span><Calendar className="inline h-3 w-3 mr-1" />{r.duration}</span>
                <span>Comprehensive guide</span>
              </div>

              <Button
                className="w-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border-0 rounded-xl h-9 text-sm"
                onClick={() => setSelected(r)}
              >
                View Roadmap
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative z-50 w-full max-w-5xl max-h-[90vh] overflow-y-auto glass-strong rounded-2xl shadow-2xl p-8">
            <button
              aria-label="Close"
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              onClick={() => setSelected(null)}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">{selected.title}</h2>
              <p className="text-sm text-white/40">{selected.duration} · {selected.level}</p>
            </div>

            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div
                className="text-sm leading-relaxed space-y-4 text-white/70"
                dangerouslySetInnerHTML={{ __html: selected.guide }}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                className="bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border-0 rounded-xl"
                onClick={async () => {
                  const plain = selected.guide.replace(/<[^>]*>/g, "");
                  try {
                    await navigator.clipboard.writeText(plain);
                    toast({ title: "Copied ✅", description: `${selected.title} guide copied to clipboard.` });
                  } catch {
                    toast({ title: "Copy failed", description: "Your browser blocked clipboard access.", variant: "destructive" });
                  }
                }}
              >
                Copy Guide
              </Button>
              <Button variant="outline" className="border-white/10 text-white/60 hover:bg-white/5 rounded-xl" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
