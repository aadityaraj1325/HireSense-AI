import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  FolderGit2,
  Search,
  ExternalLink,
  Star,
  GitFork,
  Clock,
  Sparkles,
  RefreshCw,
  GitBranch,
  Filter,
} from "lucide-react";
import { useDeveloperRepositories, useSyncPlatform } from "@/hooks/useDeveloperTracker";
import { relativeTime } from "@/lib/utils";

const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  HTML: "#e34c26",
  CSS: "#563d7c",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Go: "#00ADD8",
  Rust: "#dea584",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
  Dart: "#00B4AB",
};

export function RepositoriesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [sortBy, setSortBy] = useState("updated");

  const { data, isLoading } = useDeveloperRepositories({
    search: searchTerm || undefined,
    language: selectedLanguage !== "all" ? selectedLanguage : undefined,
    sort: sortBy,
  });

  const syncMutation = useSyncPlatform();

  const repos = data?.repositories || [];
  const totalCount = data?.totalCount ?? 0;
  const availableLanguages = data?.languages || [];

  const handleSync = () => {
    syncMutation.mutate("github");
  };

  return (
    <Card className="border-[var(--border)] overflow-hidden shadow-card">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderGit2 className="text-[var(--accent)]" size={18} />
            <CardTitle>Synchronized GitHub Repositories</CardTitle>
            <Badge tone="accent" className="text-xs">
              {totalCount} Repos
            </Badge>
          </div>
          <CardDescription>
            Real-time persisted repositories fetched directly from GitHub API. Detects new repos, commit activity, and metadata changes.
          </CardDescription>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncMutation.isPending}
          className="text-xs gap-1.5 shrink-0"
        >
          <RefreshCw size={12} className={syncMutation.isPending ? "animate-spin" : ""} />
          {syncMutation.isPending ? "Syncing Repos..." : "Sync Repos Now"}
        </Button>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
            <Input
              placeholder="Search repositories by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Language filter */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="h-10 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="all">All Languages</option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>

            {/* Sort filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="updated">Recently Updated</option>
              <option value="pushed">Recently Pushed</option>
              <option value="stars">Most Stars</option>
              <option value="name">Repository Name</option>
              <option value="created">Recently Created</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-[var(--ink-muted)]">
            Loading repository records from database...
          </div>
        ) : repos.length === 0 ? (
          <div className="py-12 rounded-2xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--ink-muted)] space-y-2">
            <FolderGit2 size={32} className="mx-auto text-[var(--ink-muted)] opacity-50" />
            <p className="font-semibold text-[var(--ink)]">No repositories found</p>
            <p>
              {searchTerm || selectedLanguage !== "all"
                ? "Try adjusting your search query or language filter."
                : "Click 'Sync Repos Now' to pull your public repositories from GitHub."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {repos.map((repo) => {
              const langColor = LANGUAGE_COLORS[repo.language] || "#888888";
              const isRecent = repo.createdAt && new Date(repo.createdAt) > new Date(Date.now() - 7 * 86400000);

              return (
                <div
                  key={repo._id || repo.githubRepoId}
                  className="p-4 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] hover:border-[var(--accent)]/50 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FolderGit2 size={15} className="text-[var(--accent)] shrink-0" />
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-xs text-[var(--ink)] hover:text-[var(--accent)] truncate flex items-center gap-1"
                        >
                          <span className="truncate">{repo.name}</span>
                          <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </a>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isRecent && (
                          <Badge tone="success" className="text-[9px] px-1.5 py-0">
                            New
                          </Badge>
                        )}
                        <span className="text-[10px] px-1.5 py-0.2 rounded border border-[var(--border)] text-[var(--ink-muted)] uppercase font-mono">
                          {repo.visibility || "public"}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--ink-muted)] line-clamp-2 leading-relaxed min-h-[32px]">
                      {repo.description || "No repository description provided."}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[var(--border)]/50 text-[11px]">
                    <div className="flex items-center justify-between text-[var(--ink-muted)]">
                      {repo.language ? (
                        <span className="flex items-center gap-1.5 font-medium text-[var(--ink)] text-[11px]">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: langColor }}
                          />
                          {repo.language}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--ink-muted)] italic">
                          No language
                        </span>
                      )}

                      <div className="flex items-center gap-2.5 font-mono text-[10px]">
                        <span className="flex items-center gap-0.5">
                          <Star size={11} className="text-amber-400" />
                          {repo.stars || 0}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <GitFork size={11} className="text-[var(--ink-muted)]" />
                          {repo.forks || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[var(--ink-muted)] pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {repo.pushedAt ? `Pushed ${relativeTime(repo.pushedAt)}` : `Updated ${relativeTime(repo.updatedAt)}`}
                      </span>

                      {repo.defaultBranch && (
                        <span className="font-mono text-[9px] text-[var(--ink-muted)]/75">
                          {repo.defaultBranch}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

