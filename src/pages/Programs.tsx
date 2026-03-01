import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, Calendar, DollarSign, X } from "lucide-react";
import { Link } from "react-router-dom";

type Program = {

  id: number;
  name: string;
  shortName?: string;
  logo?: string;
  duration?: string;
  deadline?: string;
  stipend?: string;
  techStacks: string[];
  description: string;
  applyLink: string;
  guide: string;
};

const programs: Program[] = [
  {
    id: 1,
    name: "Google Summer of Code",
    shortName: "GSoC",
    logo: "🌞",
    duration: "12 weeks",
    deadline: "Typically February–April (varies yearly)",
    stipend: "Varies by country / year",
    techStacks: ["C++", "Python", "JavaScript", "Go", "Rust"],
    description:
      "A global mentoring program connecting student developers with open-source organizations to work on real projects.",
    applyLink: "https://summerofcode.withgoogle.com/",
    guide: `
About the program
Google Summer of Code (GSoC) is a long-running global program run by Google that pairs student contributors with established open-source organizations. Participants produce significant code contributions over a summer coding period under mentorship; the program emphasizes real-world engineering, maintainability, and community collaboration. GSoC is widely recognized by employers and the open-source community as an indicator of meaningful contribution and professional discipline.

Eligibility
- Typically open to students and recent graduates (age policies vary by year; check the official site).
- Comfortable with coding and version control (Git/GitHub/GitLab).
- Willingness to communicate in English and adhere to project timelines.
- Note: exact eligibility rules may vary; always verify the current year’s policy on the official site.

Selection process
1. Explore participating organizations and their project ideas on the official site.
2. Engage with the organization early — comment on issues, join their chat channels, and submit small contributions demonstrating your intent.
3. Draft a clear proposal that includes problem statement, milestones, deliverables, timeline (weekly), and evaluation criteria.
4. Organizations assess applicants by prior contributions, the proposal’s clarity and feasibility, and communication with mentors.
5. Selected students enter the coding phase where regular updates and mentor interactions are required.

Preparation roadmap (6 months)
- Month 1: Master Git fundamentals — branching, rebases vs merges, pull requests, and CI basics.
- Month 2: Identify 2–3 organizations that match your skills. Read issue trackers and existing code. Fix small docs/typo issues to get familiar.
- Month 3: Complete 3–5 small PRs (documentation, tests, tiny bug fixes). Join community calls and learn code ownership & contribution workflow.
- Month 4: Build a rough project plan and a prototype if possible. Share it with potential mentors and ask for feedback.
- Month 5: Finalize and polish your proposal; seek peer reviews; prepare a short timeline and set communication checkpoints.
- Month 6: Submit proposal; prepare environment and development checklist for the coding period.

Tips
- Quality > quantity: one clear, well-documented contribution beats many shallow ones.
- Communicate proactively: ask clarifying questions, give status updates, and be respectful to maintainers' time.
- Keep a public, annotated repo of your past contributions and learning notes.
- Structure your proposal with measurable milestones and fallback plans.

Resources
- Official: https://summerofcode.withgoogle.com/
- GSoC Archive (past organizations & projects): https://summerofcode.withgoogle.com/archive
- Git & GitHub guides: https://docs.github.com/en/get-started
`,
  },

  {
    id: 2,
    name: "Outreachy",
    shortName: "Outreachy",
    logo: "🌍",
    duration: "3 months",
    deadline: "Cycles typically in spring/fall — check site",
    stipend: "Varies; paid internships",
    techStacks: ["Python", "JavaScript", "Documentation", "Open Source"],
    description:
      "Paid internships for people from underrepresented groups to work on open-source projects with mentorship.",
    applyLink: "https://www.outreachy.org/",
    guide: `
About the program
Outreachy is a remote, paid internship program that seeks to increase diversity and inclusion in open-source software. The program is specifically tailored for applicants from groups historically underrepresented in tech. Participants work on real open-source projects, receive mentorship, and are paid for their internships. Outreachy emphasizes community engagement, long-term contribution, and respectful collaboration.

Eligibility
- Open to applicants who meet Outreachy's diversity/eligibility criteria (check the official page for current details).
- Requires internet access and the ability to contribute remotely during the internship period.
- No formal educational requirement — focus is on demonstrated interest and community fit.
- Familiarity with Git/GitHub and basic coding or documentation skills is recommended.

Selection process
1. Applicants explore participating organizations and choose a project of interest.
2. During the contribution period, applicants make meaningful contributions (bug fixes, documentation, tests) while interacting constructively with mentors.
3. Applicants submit a final project proposal or application that explains objectives and deliverables.
4. Mentors evaluate submissions based on quality of contributions, communication, and alignment with project goals.
5. Selected interns proceed to the internship with mentor-guided milestones.

Preparation roadmap (5 months)
- Month 1: Study Outreachy’s pages; join community channels; review project lists and choose 1–2 organizations.
- Month 2: Get comfortable with Git and the chosen project's codebase; fix docs and tiny issues to build credibility.
- Month 3: Make progressively larger contributions like bug fixes and small features; communicate with mentors for clarity.
- Month 4: Draft a proposal that includes deliverables, timeline, and testing plan; ask for feedback.
- Month 5: Polish your proposal and contributions; prepare a daily/weekly work plan for the internship.

Tips
- Start early: contributions before the proposal period strongly improve chances.
- Focus on good communication and maintainers’ preferred workflow.
- Document your process and keep an activity log for the selection committee.

Resources
- Official: https://www.outreachy.org/
- Outreachy applicant resources and past projects on their site.
- Open Source Guides: https://opensource.guide/how-to-contribute
`,
  },

  {
    id: 3,
    name: "MLH Fellowship",
    shortName: "MLH",
    logo: "🚀",
    duration: "12 weeks",
    deadline: "Rolling / cohort dates on site",
    stipend: "Varies",
    techStacks: ["React", "Node.js", "Python", "DevOps", "Full Stack"],
    description:
      "A remote tech fellowship providing mentorship, project-based work, and collaboration experience with industry partners.",
    applyLink: "https://fellowship.mlh.io/",
    guide: `
About the program
The MLH Fellowship is a remote, cohort-based program that focuses on collaborative open-source and production work. Fellows are grouped into pods to work on real projects under mentor supervision. The fellowship places an emphasis on project delivery, soft skills (communication, teamwork), and open-source engagement.

Eligibility
- Typically targeted at students and early-career developers; open details found on the MLH site.
- Comfortable committing to the fellowship schedule and remote collaboration.
- Demonstrated ability to code and use GitHub effectively.

Selection process
1. Applicants submit their details, GitHub links, and motivations.
2. MLH screens applications for alignment with projects and potential.
3. Shortlisted candidates may have conversations or small technical assessments; selection focuses on collaboration potential.
4. Accepted fellows are assigned to pods and start project work with mentor oversight.

Preparation roadmap (4–6 months)
- Month 1: Strengthen GitHub profile and create 1–2 polished projects with documentation.
- Month 2: Contribute to open-source or team projects to demonstrate collaboration.
- Month 3: Practice remote collaboration tools (Slack, Zoom, GitHub Projects); learn testing and CI basics.
- Month 4: Build soft-skill evidence (blog posts, presentations) demonstrating teamwork and communication.
- Month 5: Prepare portfolio and rehearse talking about your projects concisely.

Tips
- Show consistent, quality contributions and a collaborative mindset.
- Build a polished README and clear commit history in your repos.
- If given a take-home task, communicate your approach clearly and deliver a readable solution.

Resources
- Official: https://fellowship.mlh.io/
- GitHub Learning Lab: https://lab.github.com/
- MLH blog and past fellows’ write-ups for practical insights.
`,
  },

  {
    id: 4,
    name: "Linux Foundation Mentorship (LFX)",
    shortName: "LFX Mentorship",
    logo: "🐧",
    duration: "12–16 weeks",
    deadline: "Varies by project",
    stipend: "Paid (varies)",
    techStacks: ["Linux", "Kubernetes", "Go", "C", "Cloud Native"],
    description:
      "Mentorship programs under the Linux Foundation and CNCF, ideal for system-level work, cloud-native, and infrastructure projects.",
    applyLink: "https://mentorship.lfx.linuxfoundation.org/",
    guide: `
About the program
The Linux Foundation’s mentorship efforts (often via LFX Mentorship and CNCF projects) connect contributors with large open-source ecosystems such as Kubernetes, Hyperledger, and other cloud-native tools. These mentorships are anchored in production-grade projects, emphasizing deep technical skills, professional workflows, and maintainership practices.

Eligibility
- Typically for contributors with intermediate to advanced knowledge in target domains (Linux internals, container tech, systems languages).
- Familiarity with Linux, container tooling (Docker, Kubernetes), or systems programming (C, Go) is helpful.
- Must be comfortable reading and contributing to large codebases and following professional review processes.

Selection process
1. Browse project listings on LFX and CNCF mentorship pages and pick projects matching your background.
2. Begin contributing (documentation fixes, tests, small bug fixes) to demonstrate interest and ability.
3. Prepare an application or outreach demonstrating prior contributions and a plan for the mentorship.
4. Mentors evaluate candidates on code quality, communication, and potential to deliver on the proposed work.

Preparation roadmap (6 months)
- Month 1–2: Solidify fundamentals in Linux, containers, and Go/C/C++ as applicable.
- Month 3: Contribute to repo docs, tests, or small patches to understand code structure.
- Month 4: Engage with maintainers via mailing lists or issues to clarify scope.
- Month 5: Draft a clear mentorship proposal mapping deliverables to milestones.
- Month 6: Polish your development environment and automation (linting, CI).

Tips
- Focus on maintainability and tests — production projects prize stable contributions.
- Prepare to learn deeply; mentors expect thoughtful, well-tested proposals.
- Build demonstrable artifacts and clear documentation for your contributions.

Resources
- LFX Mentorship portal: https://mentorship.lfx.linuxfoundation.org/
- CNCF project resources: https://www.cncf.io/projects/
- Linux Journey: https://linuxjourney.com/
`,
  },

  {
    id: 5,
    name: "Season of KDE",
    shortName: "SoK",
    logo: "💙",
    duration: "Approx 3 months",
    deadline: "Check season.kde.org for current dates",
    stipend: "Volunteer / community recognition",
    techStacks: ["C++", "Qt", "QML", "Python"],
    description:
      "A community-driven contribution period for KDE which pairs contributors with mentors for projects across the KDE ecosystem.",
    applyLink: "https://season.kde.org/",
    guide: `
About the program
Season of KDE (SoK) enables contributors to work on KDE projects with mentoring. While not always paid, SoK provides mentorship, experience in desktop and cross-platform software, and deep community exposure. Participants often focus on UI/UX improvements, features, or platform integrations.

Eligibility
- Open to contributors of any background; familiarity with C++/Qt or Python is helpful.
- Willingness to work with community workflows and follow project guidelines.
- No strict academic or age requirement — focus is on contribution readiness.

Selection process
1. Explore KDE project ideas and contact mentors via KDE community channels.
2. Submit a proposal and early contributions to demonstrate commitment.
3. Mentors assess proposals for feasibility, contribution history, and alignment with community goals.
4. Selected contributors then work with mentors on the scoped project.

Preparation roadmap (4 months)
- Month 1: Learn Qt basics and set up a KDE development environment.
- Month 2: Start with documentation or small bug fixes to build familiarity.
- Month 3: Engage with mentors and propose a scoped feature or improvement.
- Month 4: Implement the feature with tests and documentation, and submit a polished PR.

Tips
- Community fit matters — be respectful, persistent, and open to feedback.
- Document your setup steps and design decisions for reviewers.
- SoK is a pathway to stronger open-source portfolio items and potential GSoC applications.

Resources
- Season of KDE: https://season.kde.org/
- KDE Community Wiki: https://community.kde.org/Get_Involved
`,
  },

  {
    id: 6,
    name: "GitHub Externship",
    shortName: "GitHub Externship",
    logo: "🐙",
    duration: "8–12 weeks",
    deadline: "Varies by cohort",
    stipend: "Varies",
    techStacks: ["JavaScript", "TypeScript", "DevOps", "Full Stack"],
    description:
      "A program pairing students with startups and open-source initiatives via GitHub-hosted projects for hands-on engineering experience.",
    applyLink: "https://github.com/about/careers",
    guide: `
About the program
GitHub Externship programs (and related campus externships / training cohorts) connect students with industry partners and maintainers using GitHub’s ecosystem. Externs gain experience in real deployments, automation practices, and collaborative engineering workflows using GitHub Actions, packages, and issue triage.

Eligibility
- Often targeted at university students (3rd/4th year) or early-career engineers.
- A strong GitHub history and portfolio helps; emphasis on clean repos and readable code.
- Familiarity with web stacks, GitHub Actions, and collaborative workflows is a plus.

Selection process
1. Submit application with resume and GitHub portfolio.
2. Recruiters shortlist candidates based on project quality and contribution history.
3. Interviews focus on team fit, problem solving, and GH proficiency.
4. Selected externs are assigned projects and mentors within participating organizations.

Preparation roadmap (4 months)
- Month 1: Harden one full-stack project and ensure excellent README and tests.
- Month 2: Learn GitHub Actions, basic CI/CD pipelines, and automation scripting.
- Month 3: Contribute to open-source repos and get comfortable with PR etiquette.
- Month 4: Tailor your portfolio for interviews and prepare behavioral examples of teamwork.

Tips
- Keep a clean, professional GitHub profile with clear documentation.
- Show automation skills (a simple Action or workflow in a repo is a plus).
- Demonstrate impact with metrics (e.g., test coverage, performance improvements).

Resources
- GitHub Careers & externship info: https://github.com/about/careers
- GitHub Learning Lab: https://lab.github.com/
`,
  },

  {
    id: 7,
    name: "Hacktoberfest",
    shortName: "Hacktoberfest",
    logo: "🎃",
    duration: "October (month-long)",
    deadline: "October every year",
    stipend: "Community rewards (swag, etc.)",
    techStacks: ["Open Source", "Web", "Docs", "Automation"],
    description:
      "A month-long celebration encouraging contributors to make meaningful open-source contributions in October.",
    applyLink: "https://hacktoberfest.com/",
    guide: `
About the program
Hacktoberfest is an annual event coordinated by DigitalOcean and partners that encourages open-source contribution for the month of October. Participants make a number of valid pull requests to repositories that accept Hacktoberfest contributions and earn swag or community recognition. The program is beginner friendly and aims to onboard contributors into OSS.

Eligibility
- Open to anyone with a GitHub account.
- Repositories must be registered for Hacktoberfest to count contributions.
- Follow event rules for what constitutes a valid PR.

Selection process
There is no formal selection; instead, contributors must make the required number of valid pull requests (usually 4) to eligible repositories in October. Repos and PRs are verified according to event rules.

Preparation roadmap (2–3 months leading up)
- August–September: Learn Git/GitHub basics; find beginner-friendly repos and label filters.
- Late September: Start small practice PRs to understand maintainer expectations.
- October: Focus on high-quality contributions; include tests or documentation improvements where possible.

Tips
- Focus on quality of PRs; maintainers can reject PRs that are low quality or spammy.
- Read contributing guidelines and always open an issue if unsure.
- Start with documentation, tests, or tiny bug fixes to build confidence.

Resources
- Official: https://hacktoberfest.com/
- First Contributions repo: https://github.com/firstcontributions/first-contributions
`,
  },

  {
    id: 8,
    name: "Google STEP Internship",
    shortName: "STEP",
    logo: "💻",
    duration: "12 weeks (varies)",
    deadline: "Annual — check Google careers",
    stipend: "Paid internship",
    techStacks: ["Algorithms", "System Design", "Java", "Python", "C++"],
    description:
      "A Google internship program aimed at first- and second-year undergraduate students to get practical engineering experience.",
    applyLink: "https://careers.google.com/students/",
    guide: `
About the program
The Google STEP (Student Training in Engineering Program) internship offers early-career students hands-on experience in software engineering at Google. It is structured to teach core engineering practices, problem solving, and teamwork. STEP typically includes mentorship, project work, and professional development sessions.

Eligibility
- Often targeted at first- or second-year undergraduate students (check current eligibility).
- Some background in programming and data structures is expected.
- Strong academics and extracurricular project evidence recommended.

Selection process
1. Submit application through Google Student Careers portal with resume and link to projects.
2. Shortlisted applicants may undergo interviews focusing on problem solving and coding basics.
3. Selected interns are placed on teams with mentors and given project deliverables.

Preparation roadmap (3–6 months)
- Month 1–2: Strengthen core CS fundamentals — arrays, trees, graphs, and basic algorithms.
- Month 2–4: Practice coding challenges and timed exercises (LeetCode/Educative).
- Month 4–6: Build small projects demonstrating system design basics and code clarity.

Tips
- Practice clear problem explanations and communicate thought process during interviews.
- Maintain concise, well-documented projects on GitHub.
- Show continuous learning and evidence of teamwork in your portfolio.

Resources
- Google Students portal: https://careers.google.com/students/
- Cracking the Coding Interview & practice sites: https://leetcode.com/
`,
  },

  {
    id: 9,
    name: "Google Developer Student Clubs (GDSC)",
    shortName: "GDSC",
    logo: "🎓",
    duration: "Academic year",
    deadline: "Apply via local campus chapter",
    stipend: "Volunteer/community leadership",
    techStacks: ["Android", "Flutter", "Web", "Cloud"],
    description:
      "Campus-based developer groups supported by Google that run projects, workshops, and community events to build practical skills.",
    applyLink: "https://developers.google.com/community/gdsc",
    guide: `
About the program
Google Developer Student Clubs (GDSC) are campus-based student groups supported by Google that enable students to learn, build, and lead. GDSCs run workshops, hackathons, and project-based learning tracks. Participation helps students gain leadership experience and hands-on technical skills.

Eligibility
- Typically university students; campus-based membership.
- Interest in organizing events, learning new tech stacks, and building projects.

Selection process
Campus or regional organizers usually run selection for student lead positions; membership can be open. Cambridge to campus processes vary. For leadership roles, demonstration of past involvement, event organization, or project work is advantageous.

Preparation roadmap (ongoing)
- Semester 1: Join or start a GDSC chapter and attend workshops.
- Semester 2: Lead a small project or mini-hackathon; mentor juniors.
- Semester 3: Build substantial group projects that demonstrate applied skills.

Tips
- Focus on event organization, documentation, and peer mentorship.
- Use GDSC to network with industry mentors and other students.
- Document outcomes and maintain a public portfolio of group projects.

Resources
- Official: https://developers.google.com/community/gdsc
- GDSC community resources and previous project showcases online.
`,
  },

  {
    id: 10,
    name: "Girlscript Summer of Code (GSSoC)",
    shortName: "GSSoC",
    logo: "💜",
    duration: "3 months",
    deadline: "Varies — usually mid-year",
    stipend: "Volunteer / mentorship",
    techStacks: ["Web Dev", "Open Source", "Python", "JS"],
    description:
      "A program by GirlScript to encourage open-source contributions, mentorship, and community learning, often with multiple beginner-friendly projects.",
    applyLink: "https://gssoc.girlscript.tech/",
    guide: `
About the program
Girlscript Summer of Code (GSSoC) is an India-focused open-source initiative that mentors contributors across web, mobile, and other domains. GSSoC provides community-centric support, workshops, and projects designed for learners moving into production-level code and open-source workflows.

Eligibility
- Open to learners and enthusiasts; beginner-friendly.
- Suitable for students and early-career devs who want mentorship.

Selection process
1. Applicants are encouraged to join community channels and contribute to repos.
2. Submissions and early contributions are used to evaluate fit; mentors look for consistent effort.
3. Program matching is often based on interests and demonstrated commitment.

Preparation roadmap (3 months)
- Month 1: Join GirlScript communities, set up GitHub, and complete onboarding tasks.
- Month 2: Make small contributions and attend mentor-led workshops.
- Month 3: Submit project contributions and participate in demos.

Tips
- Lean on community mentorship — ask for feedback and iterate fast.
- Focus on learning practical skills: project structuring, testing, and documentation.

Resources
- Official: https://gssoc.girlscript.tech/
- GirlScript community repos and guides.
`,
  },

  {
    id: 11,
    name: "AWS Educate / AWS Cloud Upskill",
    shortName: "AWS Cloud",
    logo: "☁️",
    duration: "Self-paced / cohort",
    deadline: "Rolling",
    stipend: "N/A",
    techStacks: ["Cloud", "AWS", "DevOps", "Serverless"],
    description:
      "AWS Cloud upskill programs & student initiatives offering cloud training, credits, and project-based learning.",
    applyLink: "https://aws.amazon.com/training/",
    guide: `
About the program
AWS student programs and cloud upskill tracks provide free and paid training resources, cloud credits, and project templates. These programs range from beginner-level cloud fundamentals to advanced architecture pathways. Ideal for learners seeking cloud certifications and hands-on deployment experience.

Eligibility
- Open to students, educators, and professionals; program-specific criteria may apply.
- Some resources require a verified student email or partnerships for access to credits.

Selection process
Most AWS educational offerings are self-selection (register and follow the curriculum). Cohort-based bootcamps may have application windows and selection criteria based on motivation and prior basics.

Preparation roadmap (3–6 months)
- Month 1: AWS Cloud Practitioner essentials — core services and console basics.
- Month 2: Build a simple web app and deploy using S3 + CloudFront or Elastic Beanstalk.
- Month 3: Learn serverless fundamentals (Lambda, API Gateway) and basic IAM practices.
- Month 4–6: Prepare for AWS certifications or advanced topics (EKS, observability).

Tips
- Use free-tier and credits responsibly; automate deployments with Infrastructure-as-Code.
- Build small, deployable projects that demonstrate cloud architecture and cost awareness.

Resources
- AWS Training: https://aws.amazon.com/training/
- AWS Free Tier & Labs, AWS Educate materials and official docs.
`,
  },

  {
    id: 12,
    name: "KWoC (Kharagpur Winter of Code) & Similar Local Programs",
    shortName: "KWoC",
    logo: "❄️",
    duration: "Varies (winter cohort)",
    deadline: "Check program pages annually",
    stipend: "Varies / often volunteer",
    techStacks: ["Open Source", "Web", "Documentation", "Python"],
    description:
      "Regional and university-driven winter-of-code programs (like KWoC) provide mentorship and project work for participants into open-source during winter months.",
    applyLink: "https://kwoc.kossiitkgp.org/",
    guide: `
About the program
KWoC-style winter-of-code initiatives are time-boxed contribution programs hosted by universities or communities (KOSS IIT KGP for KWoC). They focus on onboarding contributors to open-source projects with mentorship, introductory workshops, and defined tasks or projects.

Eligibility
- Varies by local program; many are open to students and community members.
- Traditionally beginner-friendly with plenty of introductory issues to fix.

Selection process
1. Register on the program portal and join community groups.
2. Complete onboarding tasks and small contributions during the participation window.
3. Maintain activity, submit final reports, and possibly demonstrate final projects.

Preparation roadmap (2–3 months)
- Month 1: Learn Git and find beginner issues in participating repositories.
- Month 2: Contribute small patches and attend mentor sessions.
- Month 3: Complete project milestones and present results.

Tips
- Engage with local community mentors and pair up with other participants.
- Use the program as a stepping stone to larger global programs (GSoC, Outreachy).

Resources
- KWoC (KOSS IIT KGP) & local program pages
- Beginner-friendly open-source guides and community repos
`,
  },
];

export default function Programs(): JSX.Element {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStacks, setSelectedStacks] = useState<Set<string>>(new Set());
  const [modalProgram, setModalProgram] = useState<Program | null>(null);

  const allTechStacks = useMemo(() => {
    const set = new Set<string>();
    programs.forEach((p) => p.techStacks.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, []);

  const filteredPrograms = programs.filter((p) => {
    const searchMatch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.techStacks.join(" ").toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedStacks.size === 0) return searchMatch;
    const has = Array.from(selectedStacks).some((s) =>
      p.techStacks.includes(s)
    );
    return searchMatch && has;
  });

  const toggleStack = (stack: string) => {
    setSelectedStacks((prev) => {
      const next = new Set(prev);
      if (next.has(stack)) next.delete(stack);
      else next.add(stack);
      return next;
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
            Opportunity Hub — <span className="text-gradient">Programs & Prep Guides</span>
          </h1>
          <p className="text-white/40 mb-6 max-w-2xl">
            Browse top global & regional programs (GSoC, Outreachy, MLH, LFX, Hacktoberfest, and more). Use search and tech filters — click "Apply Now" to visit the official page or "View Prep Guide" for a quick, structured prep plan.
          </p>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                placeholder="Search programs, descriptions, or stacks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 rounded-xl h-11"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                className={`cursor-pointer px-3 py-1 rounded-lg transition-all ${selectedStacks.size === 0
                  ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                  : "bg-white/[0.04] text-white/50 border-white/10 hover:bg-white/[0.06]"
                  }`}
                onClick={() => setSelectedStacks(new Set())}
              >
                All Stacks
              </Badge>
              {allTechStacks.map((stack) => (
                <Badge
                  key={stack}
                  className={`cursor-pointer px-3 py-1 rounded-lg transition-all ${selectedStacks.has(stack)
                    ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                    : "bg-white/[0.04] text-white/50 border-white/10 hover:bg-white/[0.06]"
                    }`}
                  onClick={() => toggleStack(stack)}
                >
                  {stack}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPrograms.map((p) => (
            <Card key={p.id} className="group p-6 glass hover:bg-white/[0.06] rounded-2xl transition-all duration-500">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/20 flex items-center justify-center text-lg font-bold text-white/70 flex-shrink-0">
                  {(p.shortName || p.name).charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold group-hover:text-violet-300 transition-colors">{p.name}</h2>
                  <p className="text-sm text-white/40 leading-relaxed mt-1">{p.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.techStacks.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px] bg-white/[0.06] text-white/60 border-0 rounded-md px-2 py-0.5">
                    {t}
                  </Badge>
                ))}
              </div>

              <div className="text-xs flex justify-between text-white/30 mb-4">
                <span><Calendar className="inline h-3 w-3 mr-1" /> {p.deadline}</span>
                <span><DollarSign className="inline h-3 w-3 mr-1" /> {p.stipend}</span>
              </div>

              <div className="flex gap-2">
                <a href={p.applyLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button className="w-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border-0 rounded-xl h-9 text-sm">Apply Now</Button>
                </a>
                <Button variant="outline" className="flex-1 border-white/10 text-white/60 hover:bg-white/5 rounded-xl h-9 text-sm" onClick={() => setModalProgram(p)}>
                  Prep Guide
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {modalProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalProgram(null)} />
          <div className="relative glass-strong rounded-2xl shadow-2xl w-full max-w-3xl p-8 overflow-y-auto max-h-[85vh]">
            <button
              aria-label="Close"
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              onClick={() => setModalProgram(null)}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/20 flex items-center justify-center text-lg font-bold text-white/70 flex-shrink-0">
                {(modalProgram.shortName || modalProgram.name).charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{modalProgram.name}</h2>
                <p className="text-sm text-white/40">{modalProgram.description}</p>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-white/70 leading-relaxed font-sans">{modalProgram.guide}</pre>
            </div>

            <div className="mt-6 flex gap-3">
              <a href={modalProgram.applyLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border-0 rounded-xl">
                  <ExternalLink className="mr-2 h-4 w-4" /> Official Apply Page
                </Button>
              </a>
              <Button variant="outline" className="flex-1 border-white/10 text-white/60 hover:bg-white/5 rounded-xl" onClick={() => setModalProgram(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
