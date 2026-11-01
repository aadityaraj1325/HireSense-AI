import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  RefreshCw,
  Trash2,
  Plus,
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Terminal,
  Trophy,
  Brain,
  Layers,
  Search,
  Check,
} from "lucide-react";
import { useConnectPlatform, useDisconnectPlatform, useSyncPlatform, useVerifyLink } from "@/hooks/useDeveloperTracker";
import { relativeTime } from "@/lib/utils";

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

const PLATFORM_METADATA = {
  github: {
    name: "GitHub",
    icon: GithubIcon,
    color: "#ffffff",
    type: "REST & Public Events API",
    description: "Syncs public repositories, commit pushes, pull requests, stars, and language distribution.",
    placeholder: "e.g. https://github.com/aadityaraj1325 or aadityaraj1325",
    supportsToken: true,
  },
  leetcode: {
    name: "LeetCode",
    icon: Code2,
    color: "#FFA116",
    type: "GraphQL Profile Proxy",
    description: "Syncs problem statistics by difficulty (Easy, Medium, Hard), languages, and recent submissions.",
    placeholder: "e.g. https://leetcode.com/u/your_handle or your_handle",
    supportsToken: false,
  },
  codeforces: {
    name: "Codeforces",
    icon: Terminal,
    color: "#1F8ACB",
    type: "Official Public API",
    description: "Syncs contest rating history, max rating, accepted problem tags, and competition ranks.",
    placeholder: "e.g. https://codeforces.com/profile/tourist or tourist",
    supportsToken: false,
  },
  hackerrank: {
    name: "HackerRank",
    icon: Trophy,
    color: "#00EA64",
    type: "Verified Profile Link",
    description: "Links public developer portfolio, certificates, and practice credentials.",
    placeholder: "e.g. https://www.hackerrank.com/profile/your_username",
    supportsToken: false,
  },
  codechef: {
    name: "CodeChef",
    icon: Brain,
    color: "#5B4638",
    type: "Verified Profile Link",
    description: "Tracks competitive contest participation and problem-solving activity.",
    placeholder: "e.g. https://www.codechef.com/users/chef_handle",
    supportsToken: false,
  },
  geeksforgeeks: {
    name: "GeeksforGeeks",
    icon: Layers,
    color: "#2F8D46",
    type: "Verified Profile Link",
    description: "Links practice score, problem count, and coding streak achievements.",
    placeholder: "e.g. https://auth.geeksforgeeks.org/user/gfg_username",
    supportsToken: false,
  },
  atcoder: {
    name: "AtCoder",
    icon: Terminal,
    color: "#333333",
    type: "Verified Profile Link",
    description: "Links competitive contest rankings and algorithmic submission milestones.",
    placeholder: "e.g. https://atcoder.jp/users/chokudai",
    supportsToken: false,
  },
  kaggle: {
    name: "Kaggle",
    icon: Trophy,
    color: "#20BEFF",
    type: "Verified Profile Link",
    description: "Links machine learning competition medals, datasets, and community notebooks.",
    placeholder: "e.g. https://www.kaggle.com/username",
    supportsToken: false,
  },
};

export function PlatformConnectionModal({ profile, onClose }) {
  const [selectedPlatform, setSelectedPlatform] = useState("github");
  const [linkOrHandle, setLinkOrHandle] = useState("");
  const [token, setToken] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Live Verification State
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const connectMutation = useConnectPlatform();
  const disconnectMutation = useDisconnectPlatform();
  const syncMutation = useSyncPlatform();
  const verifyLinkMutation = useVerifyLink();

  const connectedPlatforms = profile?.platforms || [];

  // Auto-detect platform from URL input
  const handleInputChange = (val) => {
    setLinkOrHandle(val);
    setVerificationResult(null); // clear preview on change

    const lower = val.toLowerCase();
    if (lower.includes("github.com")) setSelectedPlatform("github");
    else if (lower.includes("leetcode.com")) setSelectedPlatform("leetcode");
    else if (lower.includes("codeforces.com")) setSelectedPlatform("codeforces");
    else if (lower.includes("hackerrank.com")) setSelectedPlatform("hackerrank");
    else if (lower.includes("codechef.com")) setSelectedPlatform("codechef");
    else if (lower.includes("geeksforgeeks.org")) setSelectedPlatform("geeksforgeeks");
    else if (lower.includes("atcoder.jp")) setSelectedPlatform("atcoder");
    else if (lower.includes("kaggle.com")) setSelectedPlatform("kaggle");
  };

  const handleVerify = async (tokenOverride) => {
    if (!linkOrHandle.trim()) return;
    setVerificationLoading(true);
    setVerificationResult(null);

    const activeToken = tokenOverride !== undefined ? tokenOverride : token.trim();

    try {
      const res = await verifyLinkMutation.mutateAsync({
        platform: selectedPlatform,
        linkOrHandle: linkOrHandle.trim(),
        token: activeToken || undefined,
      });
      setVerificationResult(res);
      if (res.platform) setSelectedPlatform(res.platform);
    } catch (err) {
      setVerificationResult({
        valid: false,
        error: err?.response?.data?.error?.message || err?.message || "Failed to verify connection.",
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleConnect = async (e, clearToken = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!linkOrHandle.trim()) return;

    const tokenToSend = clearToken ? undefined : (token.trim() || undefined);

    await connectMutation.mutateAsync({
      platform: selectedPlatform,
      handle: linkOrHandle.trim(),
      connectionType: selectedPlatform === "github" || selectedPlatform === "codeforces" ? "api" : "public_profile",
      token: tokenToSend,
    });

    setLinkOrHandle("");
    setToken("");
    setVerificationResult(null);
    setShowAddForm(false);
  };

  const handleSync = (platform) => {
    syncMutation.mutate(platform);
  };

  const handleDisconnect = (platform) => {
    if (window.confirm(`Disconnect ${PLATFORM_METADATA[platform]?.name || platform}?`)) {
      disconnectMutation.mutate(platform);
    }
  };

  const isEmailInput = linkOrHandle.includes("@") && linkOrHandle.includes(".");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in-50">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden bg-[var(--surface)] border-[var(--border)] shadow-2xl">
        <CardHeader className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <CardTitle className="text-xl">Developer Platform Connections</CardTitle>
            <CardDescription>
              Connect verified coding profiles by pasting your profile URL or handle. Auto-validates and tracks daily activity.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto p-6 space-y-6">
          {/* Add Connection Form Trigger */}
          {!showAddForm ? (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
              <div>
                <h4 className="text-sm font-semibold text-[var(--ink)]">
                  Connect by Profile Link or Username
                </h4>
                <p className="text-xs text-[var(--ink-muted)]">
                  Paste your public URL (e.g. https://github.com/aadityaraj1325) or username.
                </p>
              </div>
              <Button
                variant="accent"
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="gap-1.5"
              >
                <Plus size={15} /> Connect Platform
              </Button>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="p-5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] space-y-4 animate-in fade-in-50">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="text-sm font-semibold text-[var(--ink)]">
                  Link Developer Profile
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                    Select Platform *
                  </label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => {
                      setSelectedPlatform(e.target.value);
                      setVerificationResult(null);
                    }}
                    className="w-full h-10 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-xs text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    {Object.entries(PLATFORM_METADATA).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.name} ({meta.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--ink)] block mb-1">
                    Profile URL or Username *
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      required
                      placeholder={PLATFORM_METADATA[selectedPlatform]?.placeholder || "Paste link or handle"}
                      value={linkOrHandle}
                      onChange={(e) => handleInputChange(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerify()}
                      disabled={verificationLoading || !linkOrHandle.trim()}
                      className="h-10 text-xs shrink-0 gap-1.5"
                    >
                      <Search size={13} className={verificationLoading ? "animate-spin" : ""} />
                      {verificationLoading ? "Checking..." : "Verify Link"}
                    </Button>
                  </div>
                </div>

                {/* Email detection notice */}
                {isEmailInput && (
                  <div className="sm:col-span-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <div>
                      <strong>Email detected:</strong> Platform APIs require your <strong>public username</strong> (e.g. <span className="font-mono text-white">aadityaraj1325</span>) or profile URL (<span className="font-mono text-white">https://github.com/aadityaraj1325</span>), not an email address.
                    </div>
                  </div>
                )}

                {/* Live Verification Preview Box */}
                {verificationResult && (
                  <div className="sm:col-span-2 space-y-2">
                    {verificationResult.valid ? (
                      <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2.5 animate-in fade-in-50">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            {verificationResult.preview?.avatarUrl ? (
                              <img
                                src={verificationResult.preview.avatarUrl}
                                alt="Avatar"
                                className="h-9 w-9 rounded-full ring-2 ring-emerald-500/50"
                              />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                                ✓
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                                <CheckCircle2 size={14} className="text-emerald-400" />
                                {verificationResult.preview?.name || verificationResult.handle} Verified
                              </div>
                              <div className="text-[11px] text-[var(--ink-muted)]">
                                Handle: <span className="font-mono text-[var(--ink)]">@{verificationResult.handle}</span>
                                {verificationResult.preview?.publicRepos !== undefined && (
                                  <span className="ml-2">· {verificationResult.preview.publicRepos} Public Repos</span>
                                )}
                                {verificationResult.preview?.totalSolved !== undefined && (
                                  <span className="ml-2">· {verificationResult.preview.totalSolved} Solved</span>
                                )}
                                {verificationResult.preview?.rating !== undefined && (
                                  <span className="ml-2">· Rating {verificationResult.preview.rating}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge tone="success" className="text-[10px]">Ready to Connect</Badge>
                        </div>

                        {/* Token Warning Callout if token was rejected but public profile succeeded */}
                        {(verificationResult.preview?.tokenWarning || verificationResult.tokenWarning) && (
                          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1.5">
                              <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-400" />
                              <span>{verificationResult.preview?.tokenWarning || verificationResult.tokenWarning}</span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setToken("");
                                handleVerify("");
                              }}
                              className="h-6 px-2 text-[10px] shrink-0 text-amber-200 border-amber-500/40 hover:bg-amber-500/20"
                            >
                              Clear Token
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {String(verificationResult.error || "").toLowerCase().includes("401") ||
                        String(verificationResult.error || "").toLowerCase().includes("unauthorized") ? (
                          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-2">
                            <div className="font-semibold flex items-center gap-1.5 text-amber-300">
                              <AlertTriangle size={15} className="text-amber-400" />
                              GitHub Token Rejected (401 Bad credentials)
                            </div>
                            <p className="text-[11px] leading-relaxed text-[var(--ink-muted)]">
                              The access token or password you entered was rejected by GitHub. <strong>Public GitHub profiles do not require any token!</strong> Click below to verify and connect without a token.
                            </p>
                            <Button
                              type="button"
                              variant="accent"
                              size="sm"
                              onClick={() => {
                                setToken("");
                                handleVerify("");
                              }}
                              disabled={verificationLoading}
                              className="h-7 text-xs gap-1.5 font-medium"
                            >
                              <RefreshCw size={12} className={verificationLoading ? "animate-spin" : ""} />
                              Clear Token & Verify Public Profile
                            </Button>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 space-y-1">
                            <div className="font-semibold flex items-center gap-1.5">
                              <AlertTriangle size={14} className="text-red-400" />
                              Verification Warning
                            </div>
                            <p className="text-[11px] leading-relaxed">{verificationResult.error}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {PLATFORM_METADATA[selectedPlatform]?.supportsToken && (
                  <div className="sm:col-span-2 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-[var(--ink)] flex items-center gap-1.5">
                        <span>Personal Access Token</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--ink-muted)] font-normal">
                          Strictly Optional
                        </span>
                      </label>
                      {token && (
                        <button
                          type="button"
                          onClick={() => {
                            setToken("");
                            if (verificationResult?.valid) setVerificationResult(null);
                          }}
                          className="text-[11px] text-[var(--accent)] hover:underline"
                        >
                          Clear Token
                        </button>
                      )}
                    </div>
                    <Input
                      type="password"
                      placeholder="Optional — leave empty to connect with free public access"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                    <span className="text-[11px] text-[var(--ink-muted)] block leading-relaxed">
                      💡 <strong>No token or password is needed!</strong> Pasting your profile URL (e.g. <span className="font-mono text-emerald-400">https://github.com/aadityaraj1325</span>) tracks your public repositories, commits, and languages directly without authentication.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={connectMutation.isPending || !linkOrHandle.trim()}
                >
                  {connectMutation.isPending ? "Connecting & Syncing..." : "Connect Platform"}
                </Button>
              </div>
            </form>
          )}

          {/* Connected Platforms List */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
              Connected Platforms ({connectedPlatforms.length})
            </h4>

            {connectedPlatforms.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-[var(--border)] text-center text-xs text-[var(--ink-muted)]">
                No developer platforms connected yet. Paste your GitHub or LeetCode profile URL above to begin tracking live stats.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {connectedPlatforms.map((conn) => {
                  const meta = PLATFORM_METADATA[conn.platform] || {
                    name: conn.platform,
                    icon: Code2,
                    type: "Linked",
                  };
                  const Icon = meta.icon;
                  const isSyncing = syncMutation.isPending && syncMutation.variables === conn.platform;

                  return (
                    <div
                      key={conn.platform}
                      className="p-4 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] flex flex-col justify-between space-y-3 hover:border-[var(--accent)]/40 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--ink)]">
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[var(--ink)] flex items-center gap-1.5">
                              {meta.name}
                              {conn.status === "connected" && (
                                <CheckCircle2 size={13} className="text-emerald-400" />
                              )}
                              {conn.status === "error" && (
                                <AlertTriangle size={13} className="text-amber-400" />
                              )}
                            </div>
                            <div className="text-xs font-mono text-[var(--ink-muted)]">
                              @{conn.handle}
                            </div>
                          </div>
                        </div>

                        <Badge
                          tone={conn.status === "connected" ? "success" : conn.status === "error" ? "warning" : "neutral"}
                          className="text-[10px]"
                        >
                          {conn.status}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-[var(--ink-muted)] space-y-0.5">
                        <div>
                          Integration: <span className="text-[var(--ink)]">{conn.connectionType}</span>
                        </div>
                        <div>
                          Last Synced:{" "}
                          <span className="text-[var(--ink)]">
                            {conn.lastSyncAt ? relativeTime(conn.lastSyncAt) : "Pending"}
                          </span>
                        </div>
                        {conn.lastError && (
                          <div className="text-amber-400 truncate text-[11px]">
                            Note: {conn.lastError}
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs">
                        {conn.profileUrl ? (
                          <a
                            href={conn.profileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
                          >
                            Profile <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span />
                        )}

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="iconSm"
                            title="Sync now"
                            onClick={() => handleSync(conn.platform)}
                            disabled={isSyncing}
                          >
                            <RefreshCw size={13} className={isSyncing ? "animate-spin" : ""} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="iconSm"
                            title="Disconnect"
                            onClick={() => handleDisconnect(conn.platform)}
                            className="hover:text-red-400"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Privacy & Truthfulness Guarantee */}
          <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-start gap-3 text-xs text-[var(--ink-muted)]">
            <Shield size={16} className="text-[var(--accent)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--ink)]">Authenticity Guarantee:</strong> HireSense AI connects solely to authorized public endpoints. We never fabricate commit counts, contest ratings, or problem tallies. If a platform is unverified or disconnected, metrics are explicitly shown as unavailable.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
