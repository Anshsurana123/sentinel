import { tavily } from "@tavily/core";
import { incrementTavilyCount } from "./tavilyQuota";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY! });

// ─── YouTube Video Search ────────────────────────────────────────────────────

export async function searchYouTubeLecture(
  topic: string,
  subject: string
): Promise<{ label: string; url: string; description: string } | null> {
  try {
    const query = `${topic} ${subject} lecture tutorial site:youtube.com`;

    const response = await client.search(query, {
      searchDepth: "basic",
      maxResults: 5,
      includeDomains: ["youtube.com"],
    });

    incrementTavilyCount(1);

    const best =
      response.results.find(
        (r) =>
          r.url.includes("youtube.com/watch") || r.url.includes("youtu.be/")
      ) ?? response.results[0];

    if (!best) return null;

    return {
      label: best.title ?? `${topic} — Video Lecture`,
      url: best.url,
      description: best.content
        ? best.content.slice(0, 120).trim() + "..."
        : `Video lecture covering ${topic} in ${subject}`,
    };
  } catch {
    return null;
  }
}

// ─── Question Bank Search ────────────────────────────────────────────────────

export async function searchQuestionBank(
  topic: string,
  subject: string
): Promise<{ label: string; url: string; description: string } | null> {
  try {
    const khanQuery = `${topic} ${subject} practice problems site:khanacademy.org`;

    const khanResponse = await client.search(khanQuery, {
      searchDepth: "basic",
      maxResults: 5,
      includeDomains: ["khanacademy.org"],
    });

    incrementTavilyCount(1);

    const khanResult = khanResponse.results[0];

    if (khanResult?.url) {
      return {
        label: khanResult.title ?? `Khan Academy — ${topic}`,
        url: khanResult.url,
        description: khanResult.content
          ? khanResult.content.slice(0, 120).trim() + "..."
          : `Practice problems for ${topic} on Khan Academy`,
      };
    }

    const mitQuery = `${topic} ${subject} problem set site:ocw.mit.edu`;

    const mitResponse = await client.search(mitQuery, {
      searchDepth: "basic",
      maxResults: 3,
      includeDomains: ["ocw.mit.edu"],
    });

    incrementTavilyCount(1);

    const mitResult = mitResponse.results[0];

    if (mitResult?.url) {
      return {
        label: mitResult.title ?? `MIT OCW — ${topic} Problems`,
        url: mitResult.url,
        description: mitResult.content
          ? mitResult.content.slice(0, 120).trim() + "..."
          : `MIT OpenCourseWare problem set for ${topic}`,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Formula Sheet Search ────────────────────────────────────────────────────

export async function searchFormulaSheet(
  topic: string,
  subject: string
): Promise<{ label: string; url: string; description: string } | null> {
  try {
    const query = `${topic} ${subject} formula sheet cheatsheet`;

    const response = await client.search(query, {
      searchDepth: "basic",
      maxResults: 5,
      includeDomains: [
        "hyperphysics.phy-astr.gsu.edu",
        "physics.info",
        "cheatsheets.quantecon.org",
        "mathworld.wolfram.com",
        "chem.libretexts.org",
        "tutorial.math.lamar.edu",
      ],
    });

    incrementTavilyCount(1);

    const best = response.results[0];

    if (!best) {
      const broadResponse = await client.search(
        `${topic} formula sheet filetype:pdf OR cheatsheet`,
        { searchDepth: "basic", maxResults: 3 }
      );

      incrementTavilyCount(1);

      const broadBest = broadResponse.results[0];
      if (!broadBest) return null;
      return {
        label: broadBest.title ?? `${topic} Formula Sheet`,
        url: broadBest.url,
        description: broadBest.content
          ? broadBest.content.slice(0, 120).trim() + "..."
          : `Formula reference sheet for ${topic}`,
      };
    }

    return {
      label: best.title ?? `${topic} — Formula Reference`,
      url: best.url,
      description: best.content
        ? best.content.slice(0, 120).trim() + "..."
        : `Formula sheet and reference for ${topic} in ${subject}`,
    };
  } catch {
    return null;
  }
}

// ─── Main: Fetch All Sources For One Day ─────────────────────────────────────

export async function fetchSourcesForDay(
  topics: string[],
  subject: string
): Promise<{
  video: { label: string; url: string; description: string } | null;
  questionbank: { label: string; url: string; description: string } | null;
  formula: { label: string; url: string; description: string } | null;
}> {
  const topicString = topics.join(" and ");

  const [video, questionbank, formula] = await Promise.all([
    searchYouTubeLecture(topicString, subject),
    searchQuestionBank(topicString, subject),
    searchFormulaSheet(topicString, subject),
  ]);

  return { video, questionbank, formula };
}
