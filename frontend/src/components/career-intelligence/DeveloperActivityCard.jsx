import React from "react";
import { Link } from "react-router-dom";
import { Code2, ArrowUpRight, Star, GitCommit, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

function GithubIcon({ size = 18, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function DeveloperActivityCard({ developerIntelligence = {} }) {
  const hasConnectedGitHub = developerIntelligence.hasConnectedGitHub;
  const totalRepos = developerIntelligence.totalRepos || 0;
  const recentActivities = developerIntelligence.recentActivityCount || 0;
  const topLanguages = developerIntelligence.topLanguages || [];
  const repositories = developerIntelligence.repositories || [];

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 lg:p-7 shadow-card space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Code2 size={18} />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-[var(--ink)]">
              Developer Intelligence & Proof
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Coding consistency, commits, and verified repositories
            </p>
          </div>
        </div>

        <Link
          to="/developer-tracker"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]"
        >
          <span>Open Dev Tracker</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Platform Connection Status */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
        <div className="flex items-center gap-3">
          <GithubIcon size={20} className="text-[var(--ink)]" />
          <div>
            <div className="text-xs font-bold text-[var(--ink)]">GitHub Sync</div>
            <div className="text-[11px] text-[var(--ink-muted)]">
              {hasConnectedGitHub ? "Actively connected & tracking proof" : "No account connected"}
            </div>
          </div>
        </div>

        {hasConnectedGitHub ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 size={13} />
            <span>Connected</span>
          </span>
        ) : (
          <Link
            to="/developer-tracker"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[var(--ink)] text-[var(--bg)] hover:opacity-90"
          >
            Connect
          </Link>
        )}
      </div>

      {/* Developer Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
            <span>Public Repos</span>
            <Code2 size={13} />
          </div>
          <div className="text-xl font-bold text-[var(--ink)] mt-1">
            {totalRepos}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
          <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
            <span>30-Day Activity</span>
            <GitCommit size={13} />
          </div>
          <div className="text-xl font-bold text-[var(--ink)] mt-1">
            {recentActivities} <span className="text-xs font-normal text-[var(--ink-muted)]">events</span>
          </div>
        </div>
      </div>

      {/* Top Languages */}
      {topLanguages.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-[var(--ink)]">Top Stack Languages</div>
          <div className="flex flex-wrap gap-1.5">
            {topLanguages.map((lang, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2.5 py-1 rounded-xl bg-[var(--surface-2)] text-[var(--ink)] border border-[var(--border)] font-medium"
              >
                {lang.name} ({lang.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Verified Repositories Sample */}
      {repositories.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-xs font-semibold text-[var(--ink)]">Verified Repositories</div>
          <div className="space-y-1.5">
            {repositories.slice(0, 3).map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent)] transition-all group"
              >
                <span className="text-xs font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] truncate">
                  {r.name}
                </span>
                <div className="flex items-center gap-2 text-[11px] text-[var(--ink-muted)] shrink-0">
                  <span>{r.language || "Code"}</span>
                  {r.stars > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                      <Star size={11} fill="currentColor" /> {r.stars}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
