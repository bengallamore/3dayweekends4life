"use client";

import { useState } from "react";
import {
  Search,
  ExternalLink,
  Briefcase,
  Loader2,
  MapPin,
  Building2,
} from "lucide-react";

const CATEGORIES = [
  { id: "general", label: "General" },
  { id: "fourday", label: "4-Day Week" },
  { id: "remote", label: "Remote" },
  { id: "parttime", label: "Part-Time" },
];

// Boards without a public search API — kept as one-tap "open in new tab"
// links so the tool still covers them, just not with inline results.
const EXTRA_LINKS = {
  general: [
    {
      name: "Indeed",
      build: (kw) => `https://www.indeed.com/jobs?q=${encodeURIComponent(kw)}`,
    },
    {
      name: "LinkedIn",
      build: (kw) =>
        `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(kw)}`,
    },
    {
      name: "ZipRecruiter",
      build: (kw) =>
        `https://www.ziprecruiter.com/candidate/search?search=${encodeURIComponent(kw)}`,
    },
  ],
  fourday: [
    {
      name: "4dayweek.io",
      build: (kw) =>
        `https://www.google.com/search?q=${encodeURIComponent("site:4dayweek.io " + kw)}`,
    },
    {
      name: "4DayJob.com",
      build: (kw) =>
        `https://www.google.com/search?q=${encodeURIComponent("site:4dayjob.com " + kw)}`,
    },
  ],
  remote: [
    {
      name: "Wellfound",
      build: (kw) =>
        `https://www.google.com/search?q=${encodeURIComponent("site:wellfound.com " + kw)}`,
    },
    {
      name: "Working Nomads",
      build: (kw) =>
        `https://www.workingnomads.com/jobs?search=${encodeURIComponent(kw)}`,
    },
    {
      name: "Jobspresso",
      build: (kw) => `https://jobspresso.co/?s=${encodeURIComponent(kw)}`,
    },
  ],
  parttime: [
    {
      name: "Snagajob",
      build: (kw) =>
        `https://www.snagajob.com/search?q=${encodeURIComponent(kw + " part time")}`,
    },
    {
      name: "SimplyHired",
      build: (kw) =>
        `https://www.simplyhired.com/search?q=${encodeURIComponent(kw + " part time")}`,
    },
  ],
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("general");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  const runSearch = async () => {
    const term = keyword.trim();
    if (!term) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(term)}&category=${category}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setJobs(data.jobs || []);
      setMeta(data);
    } catch (e) {
      setError(e.message || "Something went wrong");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const openExtras = () => {
    const term = keyword.trim();
    if (!term) return;
    (EXTRA_LINKS[category] || []).forEach((b) =>
      window.open(b.build(term), "_blank", "noopener,noreferrer")
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="w-7 h-7 text-emerald-400" />
          <h1 className="text-2xl font-semibold tracking-tight">
            4-Day Week Finder
          </h1>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Real, live aggregated results from Remotive, RemoteOK, Arbeitnow
          {" "}
          {meta?.adzunaEnabled ? "and Adzuna" : "(add an Adzuna key for even more)"}.
        </p>

        <div className="flex gap-2 mb-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="e.g. product manager, nurse, developer..."
            className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-sm outline-none focus:border-emerald-400 placeholder:text-slate-500"
          />
          <button
            onClick={runSearch}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-medium px-4 py-3 rounded-lg text-sm transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                category === c.id
                  ? "bg-emerald-500 border-emerald-500 text-slate-950 font-medium"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4">Couldn't load results: {error}</p>
        )}

        {!loading && meta && jobs.length === 0 && !error && (
          <p className="text-slate-500 text-sm mb-4">
            No matches from live sources for this search. Try a broader
            keyword, or use the links below.
          </p>
        )}

        <div className="flex flex-col gap-3 mb-8">
          {jobs.map((j) => (
            <a
              key={j.id}
              href={j.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-lg px-4 py-3 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{j.title}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {j.company}
                    </span>
                    {j.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {j.location}
                      </span>
                    )}
                    {j.salary && <span>{j.salary}</span>}
                    {j.postedAt && <span>{timeAgo(j.postedAt)}</span>}
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wide text-emerald-400 whitespace-nowrap">
                  {j.source}
                </span>
              </div>
              {j.description && (
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                  {j.description}
                </p>
              )}
            </a>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs uppercase tracking-wide text-slate-500">
              More boards (no public API — opens in a new tab)
            </h2>
            <button
              onClick={openExtras}
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              Open all
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(EXTRA_LINKS[category] || []).map((b) => (
              <button
                key={b.name}
                onClick={() => {
                  const term = keyword.trim();
                  if (!term) return;
                  window.open(b.build(term), "_blank", "noopener,noreferrer");
                }}
                className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-lg px-4 py-3 text-sm transition-colors"
              >
                {b.name}
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </button>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs mt-8">
          Sources: Remotive, RemoteOK, and Arbeitnow are free public APIs with
          no key required. Adzuna (broadest coverage, includes part-time
          filtering) needs a free API key — see README for setup. No account,
          no per-search limits, no cost to run.
        </p>
      </div>
    </div>
  );
}
