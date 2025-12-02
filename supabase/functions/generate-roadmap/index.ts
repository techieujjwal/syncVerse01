// index.ts - Version 16 (Gemini + GitHub + YouTube enrichment, Deno edge function)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// Roadmap schema (same as yours; model should return this shape)
const ROADMAP_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "The title of the learning roadmap." },
    duration_weeks: { type: "number", description: "Estimated duration in weeks." },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          section_title: { type: "string" },
          weeks_allotted: { type: "number" },
          topics: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["section_title", "weeks_allotted", "topics"],
      },
    },
  },
  required: ["title", "duration_weeks", "sections"],
};

// Helper: fetch top GitHub repos for a query (unauthenticated works but rate-limited).
async function fetchGitHubRepos(topic: string, per_page = 18): Promise<string[]> {
  try {
    const token = Deno.env.get("GITHUB_TOKEN") || "";
    const q = encodeURIComponent(`${topic}`);
    const url =
      `https://api.github.com/search/repositories?q=${q}+in:name,description,readme&sort=stars&order=desc&per_page=${per_page}`;
    const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
    if (token) headers.Authorization = `token ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn("GitHub search non-ok", res.status);
      return [];
    }
    const json = await res.json();
    if (!json?.items || !Array.isArray(json.items)) return [];

    // return html_url for top repos
    return json.items.map((it: any) => it.html_url).filter(Boolean);
  } catch (err) {
    console.error("fetchGitHubRepos error", err);
    return [];
  }
}

// Helper: fetch YouTube playlists using API key. Returns playlist URLs.
async function fetchYouTubePlaylists(topic: string, maxResults = 8): Promise<string[]> {
  try {
    const key = Deno.env.get("YT_API_KEY") || "";
    if (!key) return [];
    const q = encodeURIComponent(`${topic} playlist`);
    const url =
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&maxResults=${maxResults}&q=${q}&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn("YouTube API non-ok", res.status);
      return [];
    }
    const json = await res.json();
    if (!json?.items || !Array.isArray(json.items)) return [];
    const playlists = json.items
      .map((it: any) => (it.id?.playlistId ? `https://www.youtube.com/playlist?list=${it.id.playlistId}` : null))
      .filter(Boolean);
    return playlists;
  } catch (err) {
    console.error("fetchYouTubePlaylists error", err);
    return [];
  }
}

// Convert sections -> expanded weeks array based on weeks_allotted
function expandSectionsToWeeks(sections: any[]): { week: number; title: string; details: string[] }[] {
  const weeksArr: { week: number; title: string; details: string[] }[] = [];
  let weekCounter = 1;
  for (const s of sections) {
    const titleBase = s.section_title ?? `Section ${weekCounter}`;
    const allocate = Number(s.weeks_allotted) || 1;
    // If topics available, distribute topics across weeks evenly
    const topics: string[] = Array.isArray(s.topics) ? s.topics.map(String) : [];

    for (let i = 0; i < allocate; i++) {
      const idx = i;
      const title = allocate === 1 ? titleBase : `${titleBase} — Part ${i + 1}`;
      // select a slice of topics for this week if many topics exist
      const details = topics.length
        ? topics.slice(Math.floor((i * topics.length) / allocate), Math.ceil(((i + 1) * topics.length) / allocate))
        : [`Study: ${titleBase}`];

      weeksArr.push({
        week: weekCounter,
        title,
        details: details.length ? details : [`Focus on ${titleBase}`],
      });
      weekCounter++;
    }
  }
  return weeksArr;
}

// Serve the edge function
serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // parse request body JSON (topic optional)
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const topic = (body.topic && String(body.topic).trim()) || "frontend development";
    const GEMINI_API_KEY_1 = Deno.env.get("GEMINI_API_KEY_1");
    const MODEL_NAME = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";

    if (!GEMINI_API_KEY_1) {
      return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY_1 secret." }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    // Build prompt dynamically with provided topic
    const prompt = `
You are an expert career coach. Generate a detailed learning roadmap for "${topic}".
Return ONLY valid JSON that conforms to this schema:
{
  "title": string,
  "duration_weeks": number,
  "sections": [
    {
      "section_title": string,
      "weeks_allotted": number,
      "topics": [string, ...]
    }, ...
  ]
}
Keep each "topics" entry short (1 line). Provide realistic sections and weeks_allotted that add up to duration_weeks (approx).
`;

    // Payload uses generationConfig (as you fixed)
    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: ROADMAP_SCHEMA,
      },
    };

    // Call Gemini
    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY_1}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const apiData = await apiRes.json();
    if (!apiRes.ok) {
      console.error("Gemini HTTP Error:", apiData);
      throw new Error(`Gemini API returned status ${apiRes.status}: ${apiData.error?.message || JSON.stringify(apiData)}`);
    }

    // Extract text (defensive)
    const responseText = apiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText || typeof responseText !== "string" || !responseText.trim()) {
      console.error("Gemini returned empty/unusable response:", apiData);
      return new Response(
        JSON.stringify({
          error: "AI failed to generate clean JSON content (try again).",
          gemini_details: apiData,
        }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Parse model JSON
    let roadmapData: any;
    try {
      roadmapData = JSON.parse(responseText.trim());
    } catch (err) {
      console.error("Failed to parse Gemini JSON:", err, responseText);
      return new Response(
        JSON.stringify({
          error: "Failed to parse JSON returned by model.",
          gemini_text: responseText,
        }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Validate minimal shape
    const sections = Array.isArray(roadmapData.sections) ? roadmapData.sections : [];
    if (!sections.length) {
      console.warn("Model did not return sections; synthesizing simple sections.");
      roadmapData = {
        title: roadmapData.title || `${topic} roadmap`,
        duration_weeks: roadmapData.duration_weeks || 6,
        sections: [
          { section_title: "Foundations", weeks_allotted: 2, topics: ["Basics", "Core APIs"] },
          { section_title: "Core / Hands-on", weeks_allotted: 3, topics: ["State management", "Projects"] },
          { section_title: "Project & Advanced", weeks_allotted: 1, topics: ["Project", "Wrap-up"] },
        ],
      };
    }

    // Expand sections to per-week items
    const weeksBase = expandSectionsToWeeks(roadmapData.sections);

    // Fetch external enrichment: GitHub repos & YouTube playlists
    // Fetch a modest number and distribute across weeks
    const topRepos = await fetchGitHubRepos(topic, Math.min(24, Math.max(8, weeksBase.length * 2)));
    const playlists = await fetchYouTubePlaylists(topic, Math.min(12, weeksBase.length * 2));

    // Distribute repos/playlists across weeks
    const enrichedWeeks: any[] = weeksBase.map((w, idx) => {
      // choose up to 3 repos, cycling through topRepos
      const reposAssigned: string[] = [];
      for (let k = 0; k < 3 && topRepos.length; k++) {
        const pick = topRepos[(idx * 3 + k) % topRepos.length];
        if (pick && !reposAssigned.includes(pick)) reposAssigned.push(pick);
      }

      // choose 1 playlist if available, else fallback to search URL
      const playlistPick = playlists.length ? playlists[idx % playlists.length] : `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " playlist")}`;

      // simple project suggestions
      const projects = [
        `Mini project: Build a small ${topic} prototype related to "${w.title}"`,
        `Challenge: Add 1 feature to the prototype (UX / performance / tests)`,
      ];

      return {
        week: w.week,
        title: w.title,
        details: w.details,
        repos: reposAssigned,
        projects,
        youtube: [playlistPick],
      };
    });

    // Final payload returned to client
    const out = {
      title: roadmapData.title || `${topic} roadmap`,
      duration_weeks: roadmapData.duration_weeks || enrichedWeeks.length,
      weeks: enrichedWeeks,
      meta: {
        source: "gemini+github+youtube",
        generated_at: new Date().toISOString(),
        topic,
      },
      // include raw model output for debugging if needed
      raw_model: roadmapData,
    };

    return new Response(JSON.stringify(out), { status: 200, headers: CORS_HEADERS });
  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: `Failed to generate roadmap: ${String(error?.message || error)}` }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});
