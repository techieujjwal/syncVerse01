/**
 * Shared roadmap data parsing.
 *
 * Both the free (RoadmapGenerator) and premium (Premium) flows persist generated
 * roadmaps via roadmapCache (upsert into `public.roadmaps`), which stores the
 * ORIGINAL object returned by the edge function — an object shaped like
 * { title, duration_weeks, weeks: [...], ... } where each week has
 * { week, title, details, repos, projects, youtube }.
 *
 * Premium's old inline parser only handled strings (it started with a
 * `typeof text !== "string"` guard), so cached roadmaps silently failed to load
 * and the user had to regenerate on every visit. parseRoadmapData handles the
 * object, JSON-string and free-text shapes used across the app.
 */

export type Week = {
  week: string;
  title: string;
  details: string[];
  repos: string[];
  projects: string[];
  youtube: string[];
  completed: boolean;
  projectLink: string;
  reflection: string;
};

export const normalize = (text: string) =>
  text ? text.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim() : "";

const asStringArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") return v.split(/\n|,/).map((s) => s.trim()).filter(Boolean);
  return [];
};

type RawWeek = Record<string, unknown> | string;

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const toWeek = (s: unknown, idx: number): Week => {
  const raw = s !== null && typeof s === "object" && !Array.isArray(s)
    ? (s as Record<string, unknown>)
    : {};
  const title =
    raw.section_title ??
    raw.title ??
    (typeof s === "string" ? s.substring(0, 60) : `Week ${idx + 1}`);
  const weekNum =
    raw.week ??
    (typeof raw.section_title === "string"
      ? (raw.section_title.match(/week\s*(\d+)/i) || [])[1]
      : undefined) ??
    String(idx + 1);

  return {
    week: String(weekNum),
    title: String(title),
    details: asStringArray(raw.topics ?? raw.details),
    repos: asStringArray(raw.repos ?? raw.github ?? raw.repo),
    projects: asStringArray(raw.projects ?? raw.projectIdeas ?? raw.tasks),
    youtube: asStringArray(raw.youtube ?? raw.playlists ?? raw.videos),
    completed: !!raw.completed,
    projectLink: typeof raw.projectLink === "string" ? raw.projectLink : "",
    reflection: typeof raw.reflection === "string" ? raw.reflection : "",
  };
};

/**
 * Extract the displayable roadmap payload (string or object with weeks/sections)
 * from an arbitrary edge-function response shape. Returns null when nothing
 * roadmap-like is present.
 */
export function extractRoadmapText(data: unknown): string | null {
  const record = asRecord(data);
  if (record) {
    for (const key of ["roadmap", "result", "text", "data"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) return value;
      if (asRecord(value) || Array.isArray(value)) {
        const nested = extractRoadmapText(value);
        if (nested) return nested;
      }
    }
    if (typeof record.content === "string" && record.content.trim()) return record.content;

    if (Array.isArray(record.choices)) {
      const choice = asRecord(record.choices[0]);
      const message = choice ? asRecord(choice.message) : null;
      const msg = message?.content ?? choice?.text;
      if (typeof msg === "string" && msg.trim()) return msg;
    }

    if (Array.isArray(record.sections) || Array.isArray(record.weeks)) {
      return JSON.stringify(record);
    }
  }

  if (typeof data === "string" && data.trim()) return data;
  if (Array.isArray(data)) return JSON.stringify(data);
  if (data) {
    const str = JSON.stringify(data);
    if (str && str !== "{}" && str !== "null") return str;
  }
  return null;
}

/** Parse a roadmap from the edge function's object shape, a cached weeks array, a JSON string, or free text. */
export function parseRoadmapData(input: unknown): Week[] {
  if (!input) return [];

  // A bare array of week objects — the shape the app actually caches
  // (saveRoadmapToCache stores the cleaned weeks array).
  if (Array.isArray(input)) {
    return input.map((w, i) => toWeek(w, i));
  }

  // Already the stored object shape ({ weeks: [...] }) — the cached case.
  const record = asRecord(input);
  if (record) {
    if (Array.isArray(record.weeks)) return record.weeks.map(toWeek);
    if (Array.isArray(record.sections)) return record.sections.map(toWeek);
    if (Array.isArray(record.topics)) return record.topics.map(toWeek);

    // Unwrap OpenAI-style wrappers defensively.
    if (Array.isArray(record.choices)) {
      const choice = asRecord(record.choices[0]);
      const message = choice ? asRecord(choice.message) : null;
      const content = message?.content ?? choice?.text;
      if (content) return parseRoadmapData(content);
    }

    // Unknown object shape — do NOT stringify and recurse (that would loop
    // forever); let the caller fall back to its default/fallback content.
    return [];
  }

  const text = typeof input === "string" ? input.trim() : "";
  if (!text) return [];

  if (/^[[{]/.test(text)) {
    try {
      // Parsed JSON is an array or object, both handled above, so this
      // recursion terminates.
      return parseRoadmapData(JSON.parse(text));
    } catch {
      // fall through to text parsing
    }
  }

  // Free-text "Week 1: ..." format.
  const lines = text.split("\n");
  const weeks: Week[] = [];
  let current: Week | null = null;

  const pushCurrent = () => {
    if (current) weeks.push(current);
    current = null;
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    const weekMatch = line.match(/week\s*(\d+)\s*[:\-.]?\s*(.*)/i);
    if (weekMatch) {
      pushCurrent();
      current = {
        week: weekMatch[1],
        title: (weekMatch[2] || `Week ${weekMatch[1]}`).trim(),
        details: [],
        repos: [],
        projects: [],
        youtube: [],
        completed: false,
        projectLink: "",
        reflection: "",
      };
      return;
    }

    if (!current && line) {
      current = {
        week: String(weeks.length + 1),
        title: line,
        details: [],
        repos: [],
        projects: [],
        youtube: [],
        completed: false,
        projectLink: "",
        reflection: "",
      };
      pushCurrent();
      return;
    }

    if (current && line) {
      if (/^(repos?:|github:)/i.test(line)) {
        current.repos.push(...line.replace(/^(repos?:|github:)\s*/i, "").split(/,|;|\|/).map((p) => p.trim()).filter(Boolean));
      } else if (/^(projects?:|project ideas:)/i.test(line)) {
        current.projects.push(...line.replace(/^(projects?:|project ideas:)\s*/i, "").split(/,|;|\|/).map((p) => p.trim()).filter(Boolean));
      } else if (/^(youtube:|playlists?:|videos?:)/i.test(line)) {
        current.youtube.push(...line.replace(/^(youtube:|playlists?:|videos?:)\s*/i, "").split(/,|;|\|/).map((p) => p.trim()).filter(Boolean));
      } else {
        const cleaned = line.replace(/^[-*•]\s*/, "").trim();
        if (cleaned) current.details.push(cleaned);
      }
    }
  });
  pushCurrent();

  return weeks;
}
