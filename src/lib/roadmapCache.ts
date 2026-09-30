import { supabase } from "@/integrations/supabase/client";
import type { Week } from "@/lib/roadmapParser";

function normalizeKey(topic: string): string {
    return topic.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function getCachedRoadmap(topic: string, premium: boolean): Promise<unknown | null> {
    const key = normalizeKey(topic);
    try {
        const { data, error } = await supabase
            .from("roadmaps")
            .select("content")
            .eq("topic_key", key)
            .eq("is_premium", premium)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data) return null;
        return data.content;
    } catch {
        return null;
    }
}

export async function saveRoadmapToCache(
    topic: string,
    premium: boolean,
    content: unknown
): Promise<void> {
    const key = normalizeKey(topic);
    try {
        await supabase.from("roadmaps").upsert(
            {
                topic_key: key,
                topic_display: topic.trim(),
                is_premium: premium,
                content,
            },
            { onConflict: "topic_key,is_premium" }
        );
    } catch {
        // Cache write failures are non-fatal; the roadmap still renders from
        // the in-memory response.
    }
}
