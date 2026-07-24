// Aggregated job search API route.
// Deployed on Vercel, this runs as a serverless function at /api/search.
//
// Sources used (all free, public, ToS-compliant developer APIs — no scraping
// of sites like Indeed/LinkedIn, which block/prohibit that):
//   - Remotive   (https://remotive.com/api/remote-jobs)  — no key required
//   - RemoteOK   (https://remoteok.com/api)               — no key required
//   - Arbeitnow  (https://www.arbeitnow.com/api/job-board-api) — no key required
//   - Adzuna     (https://developer.adzuna.com)           — optional, free key
//
// Adzuna is optional: if you don't set ADZUNA_APP_ID / ADZUNA_APP_KEY as
// environment variables, that source is silently skipped and the other
// three still return real, live results.

export const dynamic = "force-dynamic";

const FOUR_DAY_PHRASES = [
  "4 day week",
  "4-day week",
  "four day week",
  "four-day week",
  "32 hour week",
  "32-hour week",
  "compressed workweek",
  "compressed work week",
  "9/80",
];

function stripHtml(html = "") {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeIncludes(haystack, needle) {
  if (!needle) return true;
  return (haystack || "").toLowerCase().includes(needle.toLowerCase());
}

async function fetchRemotive(keyword) {
  try {
    const res = await fetch(
      `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(
        keyword
      )}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((j) => ({
      id: `remotive-${j.id}`,
      title: j.title,
      company: j.company_name,
      location: j.candidate_required_location || "Remote",
      url: j.url,
      source: "Remotive",
      remote: true,
      jobType: j.job_type || null,
      salary: j.salary || null,
      postedAt: j.publication_date || null,
      description: stripHtml(j.description).slice(0, 240),
    }));
  } catch {
    return [];
  }
}

async function fetchRemoteOK(keyword) {
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: {
        "User-Agent":
          "4DayWeekFinder/1.0 (personal job search tool; contact: set-your-email@example.com)",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = Array.isArray(data) ? data.slice(1) : []; // first item is a legal notice, not a job
    return jobs
      .filter((j) =>
        safeIncludes(
          `${j.position} ${(j.tags || []).join(" ")} ${j.company}`,
          keyword
        )
      )
      .map((j) => ({
        id: `remoteok-${j.id}`,
        title: j.position,
        company: j.company,
        location: j.location || "Remote",
        url: j.url ? `https://remoteok.com${j.url}` : j.apply_url,
        source: "Remote OK",
        remote: true,
        jobType: null,
        salary: j.salary_min ? `$${j.salary_min}\u2013$${j.salary_max}` : null,
        postedAt: j.date || null,
        description: stripHtml(j.description || "").slice(0, 240),
      }));
  } catch {
    return [];
  }
}

async function fetchArbeitnow(keyword) {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || [])
      .filter((j) => safeIncludes(`${j.title} ${j.description}`, keyword))
      .map((j) => ({
        id: `arbeitnow-${j.slug}`,
        title: j.title,
        company: j.company_name,
        location: j.location || (j.remote ? "Remote" : ""),
        url: j.url,
        source: "Arbeitnow",
        remote: !!j.remote,
        jobType: (j.job_types || []).join(", ") || null,
        salary: null,
        postedAt: j.created_at
          ? new Date(j.created_at * 1000).toISOString()
          : null,
        description: stripHtml(j.description || "").slice(0, 240),
      }));
  } catch {
    return [];
  }
}

async function fetchAdzuna(keyword, { partTimeOnly } = {}) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];
  try {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: "25",
      what: keyword,
    });
    if (partTimeOnly) params.set("full_time", "0");
    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/us/search/1?${params.toString()}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((j) => ({
      id: `adzuna-${j.id}`,
      title: j.title,
      company: j.company?.display_name || "Unknown",
      location: j.location?.display_name || "",
      url: j.redirect_url,
      source: "Adzuna",
      remote: /remote/i.test(j.location?.display_name || ""),
      jobType: j.contract_time || null,
      salary: j.salary_min
        ? `$${Math.round(j.salary_min)}\u2013$${Math.round(j.salary_max)}`
        : null,
      postedAt: j.created || null,
      description: stripHtml(j.description || "").slice(0, 240),
    }));
  } catch {
    return [];
  }
}

function matchesFourDay(job) {
  const text = `${job.title} ${job.description} ${job.jobType || ""}`.toLowerCase();
  return FOUR_DAY_PHRASES.some((p) => text.includes(p));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get("q") || "").trim();
  const category = searchParams.get("category") || "general"; // general | fourday | remote | parttime

  if (!keyword) {
    return Response.json(
      { jobs: [], error: "Missing required query param: q" },
      { status: 400 }
    );
  }

  const partTimeOnly = category === "parttime";

  const [remotive, remoteok, arbeitnow, adzuna] = await Promise.all([
    fetchRemotive(keyword),
    fetchRemoteOK(keyword),
    fetchArbeitnow(keyword),
    fetchAdzuna(keyword, { partTimeOnly }),
  ]);

  let jobs = [...remotive, ...remoteok, ...arbeitnow, ...adzuna];

  if (category === "fourday") {
    jobs = jobs.filter(matchesFourDay);
  } else if (category === "remote") {
    jobs = jobs.filter((j) => j.remote);
  } else if (category === "parttime") {
    jobs = jobs.filter(
      (j) =>
        /part.?time/i.test(j.jobType || "") ||
        /part.?time/i.test(j.description || "")
    );
  }

  // De-duplicate by title + company (rough but effective across sources)
  const seen = new Set();
  jobs = jobs.filter((j) => {
    const key = `${j.title}|${j.company}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  jobs.sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0));

  return Response.json({
    jobs: jobs.slice(0, 60),
    count: jobs.length,
    sources: {
      remotive: remotive.length,
      remoteok: remoteok.length,
      arbeitnow: arbeitnow.length,
      adzuna: adzuna.length,
    },
    adzunaEnabled: Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY),
  });
}
