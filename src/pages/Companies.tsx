import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const companies = [
  {
    id: 1,
    name: "Mozilla",
    description: "Building the open web with Firefox and related tools",
    githubUrl: "https://github.com/mozilla",
    techStacks: ["Rust", "JavaScript", "C++", "Python"],
    gsocYears: ["2024", "2023", "2022", "2021"],
    projects: 15,
    color: "from-orange-500/20 to-red-500/10",
  },
  {
    id: 2,
    name: "TensorFlow",
    description: "Open-source machine learning framework by Google",
    githubUrl: "https://github.com/tensorflow",
    techStacks: ["Python", "C++", "JavaScript"],
    gsocYears: ["2024", "2023", "2022"],
    projects: 12,
    color: "from-amber-500/20 to-orange-500/10",
  },
  {
    id: 3,
    name: "Kubernetes",
    description: "Container orchestration platform",
    githubUrl: "https://github.com/kubernetes",
    techStacks: ["Go", "Python", "Shell"],
    gsocYears: ["2024", "2023", "2022", "2021"],
    projects: 20,
    color: "from-blue-500/20 to-cyan-500/10",
  },
  {
    id: 4,
    name: "Apache Software Foundation",
    description: "Supporting open-source software projects",
    githubUrl: "https://github.com/apache",
    techStacks: ["Java", "Python", "C++", "Scala"],
    gsocYears: ["2024", "2023", "2022", "2021", "2020"],
    projects: 50,
    color: "from-red-500/20 to-rose-500/10",
  },
  {
    id: 5,
    name: "Python Software Foundation",
    description: "Advancing Python and its ecosystem",
    githubUrl: "https://github.com/python",
    techStacks: ["Python", "C"],
    gsocYears: ["2024", "2023", "2022", "2021"],
    projects: 18,
    color: "from-yellow-500/20 to-blue-500/10",
  },
  {
    id: 6,
    name: "CNCF",
    description: "Cloud Native Computing Foundation projects",
    githubUrl: "https://github.com/cncf",
    techStacks: ["Go", "Rust", "JavaScript", "Python"],
    gsocYears: ["2024", "2023", "2022"],
    projects: 25,
    color: "from-sky-500/20 to-blue-500/10",
  },
  {
    id: 7,
    name: "Wikimedia Foundation",
    description: "Maintaining Wikipedia and sister projects",
    githubUrl: "https://github.com/wikimedia",
    techStacks: ["PHP", "JavaScript", "Python"],
    gsocYears: ["2024", "2023", "2022", "2021", "2020"],
    projects: 22,
    color: "from-emerald-500/20 to-teal-500/10",
  },
  {
    id: 8,
    name: "Git",
    description: "Distributed version control system",
    githubUrl: "https://github.com/git",
    techStacks: ["C", "Shell", "Perl"],
    gsocYears: ["2024", "2023", "2022"],
    projects: 8,
    color: "from-violet-500/20 to-purple-500/10",
  }
];

const Companies = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStack, setSelectedStack] = useState<string | null>(null);

  const allTechStacks = Array.from(new Set(companies.flatMap(c => c.techStacks)));

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStack = !selectedStack || company.techStacks.includes(selectedStack);
    return matchesSearch && matchesStack;
  });

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-10">
          <Link to="/" className="text-sm text-white/40 hover:text-white/70 mb-6 inline-flex items-center transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
            GSOC <span className="text-gradient">Organizations</span>
          </h1>
          <p className="text-lg text-white/40 max-w-2xl mb-8">
            Explore organizations participating in GSOC. Filter by tech stack to find companies matching your skills.
          </p>

          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 rounded-xl h-11"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            <Badge
              variant={selectedStack === null ? "default" : "outline"}
              className={`cursor-pointer px-3 py-1 rounded-lg transition-all ${selectedStack === null
                  ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                  : "bg-white/[0.04] text-white/50 border-white/10 hover:bg-white/[0.06]"
                }`}
              onClick={() => setSelectedStack(null)}
            >
              All Stacks
            </Badge>
            {allTechStacks.map(stack => (
              <Badge
                key={stack}
                variant={selectedStack === stack ? "default" : "outline"}
                className={`cursor-pointer px-3 py-1 rounded-lg transition-all ${selectedStack === stack
                    ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                    : "bg-white/[0.04] text-white/50 border-white/10 hover:bg-white/[0.06]"
                  }`}
                onClick={() => setSelectedStack(stack)}
              >
                {stack}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((company, idx) => (
            <Card
              key={company.id}
              className="group p-6 glass hover:bg-white/[0.06] rounded-2xl transition-all duration-500 relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${company.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center text-lg font-bold text-white/70">
                    {company.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-0.5">{company.name}</h3>
                    <p className="text-xs text-white/40">{company.projects} active projects</p>
                  </div>
                </div>

                <p className="text-sm text-white/50 mb-4 leading-relaxed">{company.description}</p>

                <div className="mb-4">
                  <p className="text-[10px] text-white/30 mb-2 uppercase tracking-wider font-medium">Tech Stack</p>
                  <div className="flex flex-wrap gap-1.5">
                    {company.techStacks.map(tech => (
                      <Badge key={tech} variant="secondary" className="text-[10px] bg-white/[0.06] text-white/60 border-0 rounded-md px-2 py-0.5">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <p className="text-[10px] text-white/30 mb-2 uppercase tracking-wider font-medium">GSOC Participation</p>
                  <div className="flex flex-wrap gap-1.5">
                    {company.gsocYears.map(year => (
                      <Badge key={year} variant="outline" className="text-[10px] border-violet-500/20 text-violet-400/70 rounded-md px-2 py-0.5">
                        {year}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 border-white/10 text-white/60 hover:bg-white/5 hover:text-white/80 rounded-xl h-9 text-sm" asChild>
                    <a href={company.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Github className="mr-1.5 h-3.5 w-3.5" />
                      GitHub
                    </a>
                  </Button>
                  <Button className="flex-1 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border-0 rounded-xl h-9 text-sm">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    Projects
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Companies;
