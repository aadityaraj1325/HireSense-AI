import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
  ChevronRight,
  X,
  PlusCircle,
  ShieldCheck,
  Play,
  Pause,
  SkipForward,
  Award,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NODE_WIDTH = 190;
const NODE_HEIGHT = 74;

const STATUS_CONFIG = {
  demonstrated: {
    label: "Demonstrated",
    bg: "rgba(16, 185, 129, 0.15)",
    border: "#10b981",
    text: "#34d399",
    glow: "rgba(16, 185, 129, 0.35)",
    icon: CheckCircle2,
  },
  partially_demonstrated: {
    label: "Partially Evidenced",
    bg: "rgba(59, 130, 246, 0.15)",
    border: "#3b82f6",
    text: "#60a5fa",
    glow: "rgba(59, 130, 246, 0.35)",
    icon: Clock,
  },
  self_reported: {
    label: "Self-Reported",
    bg: "rgba(245, 158, 11, 0.15)",
    border: "#f59e0b",
    text: "#fbbf24",
    glow: "rgba(245, 158, 11, 0.35)",
    icon: HelpCircle,
  },
  not_yet_evidenced: {
    label: "Not Yet Evidenced",
    bg: "rgba(239, 68, 68, 0.15)",
    border: "#ef4444",
    text: "#f87171",
    glow: "rgba(239, 68, 68, 0.35)",
    icon: AlertCircle,
  },
  in_progress: {
    label: "In Progress",
    bg: "rgba(168, 85, 247, 0.15)",
    border: "#a855f7",
    text: "#c084fc",
    glow: "rgba(168, 85, 247, 0.35)",
    icon: Clock,
  },
};

export default function SkillDependencyDNAGraph({
  dnaGraph,
  selectedRole,
  onSelectGap,
  onSubmitProof,
  onAddToRoadmap,
}) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 120, y: 70 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Interactive Mouse Spotlight Coordinates
  const [mousePos, setMousePos] = useState({ x: 400, y: 300 });
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);

  const handleCanvasMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Automated DNA Guided Tour / Sequential Flow
  const [isPlayingFlow, setIsPlayingFlow] = useState(false);
  const [flowStepIndex, setFlowStepIndex] = useState(0);

  const nodes = dnaGraph?.nodes || [];
  const edges = dnaGraph?.edges || [];

  // Compute node map for fast coordinate lookups
  const nodeMap = useMemo(() => {
    const map = new Map();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // Root nodes (level 1 / no prerequisites) and Leaf nodes (no dependents)
  const { rootNodes, leafNodes, flowSequence } = useMemo(() => {
    if (!nodes.length) return { rootNodes: [], leafNodes: [], flowSequence: [] };

    const childIds = new Set();
    edges.forEach((e) => childIds.add(e.target));

    const parentIds = new Set();
    edges.forEach((e) => parentIds.add(e.source));

    const roots = nodes.filter((n) => (n.prerequisites || []).length === 0 || !childIds.has(n.id));
    const leaves = nodes.filter((n) => !parentIds.has(n.id));

    // Sort nodes topologically by level for the guided tour
    const sorted = [...nodes].sort((a, b) => (a.level || 1) - (b.level || 1));

    return {
      rootNodes: roots.length > 0 ? roots : [nodes[0]],
      leafNodes: leaves.length > 0 ? leaves : [nodes[nodes.length - 1]],
      flowSequence: sorted,
    };
  }, [nodes, edges]);

  // Compute bounding box for auto-fit
  const bounds = useMemo(() => {
    if (!nodes.length) return { minX: 0, maxX: 1000, minY: 0, maxY: 600 };
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    nodes.forEach((n) => {
      const x = n.position?.x ?? n.x ?? 0;
      const y = n.position?.y ?? n.y ?? 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
    return { minX, maxX: maxX + NODE_WIDTH + 140, minY, maxY: maxY + NODE_HEIGHT + 140 };
  }, [nodes]);

  // Virtual Start & Goal Anchors
  const startPos = useMemo(() => {
    if (!rootNodes.length) return { x: 40, y: 240 };
    const avgY = rootNodes.reduce((acc, n) => acc + (n.position?.y ?? n.y ?? 240), 0) / rootNodes.length;
    return {
      x: Math.max(20, bounds.minX - 190),
      y: avgY,
    };
  }, [rootNodes, bounds.minX]);

  const goalPos = useMemo(() => {
    if (!leafNodes.length) return { x: bounds.maxX + 40, y: 240 };
    const avgY = leafNodes.reduce((acc, n) => acc + (n.position?.y ?? n.y ?? 240), 0) / leafNodes.length;
    return {
      x: bounds.maxX + 40,
      y: avgY,
    };
  }, [leafNodes, bounds.maxX]);

  // Global mouse event listener for dragging: prevents cursor from getting stuck/lost
  useEffect(() => {
    if (!isDragging) return;

    const onGlobalMouseMove = (e) => {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const onGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", onGlobalMouseMove);
    window.addEventListener("mouseup", onGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", onGlobalMouseMove);
      window.removeEventListener("mouseup", onGlobalMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleMouseDown = (e) => {
    if (e.target.closest(".graph-node-interactive") || e.target.closest(".graph-controls")) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(prev * factor, 0.4), 2.2));
  };

  const resetView = () => {
    setZoom(0.85);
    setPan({ x: 120, y: 70 });
  };

  const fitView = () => {
    if (!containerRef.current || !nodes.length) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const widthSpan = bounds.maxX - bounds.minX + 260;
    const heightSpan = bounds.maxY - bounds.minY + 160;
    const scaleX = (clientWidth - 80) / widthSpan;
    const scaleY = (clientHeight - 80) / heightSpan;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.45), 1.25);
    setZoom(newZoom);
    setPan({
      x: 140 - bounds.minX * newZoom,
      y: 80 - bounds.minY * newZoom,
    });
  };

  // Find prerequisite lineage for currently active / hovered node
  const activeNode = selectedNode || (hoveredNodeId ? nodeMap.get(hoveredNodeId) : null);
  const activeLineage = useMemo(() => {
    if (!activeNode && hoveredNodeId !== "START" && hoveredNodeId !== "GOAL") {
      return { parentIds: new Set(), childIds: new Set(), isStartActive: false, isGoalActive: false };
    }

    if (hoveredNodeId === "START") {
      const startChildIds = new Set(rootNodes.map((n) => n.id));
      return { parentIds: new Set(), childIds: startChildIds, isStartActive: true, isGoalActive: false };
    }

    if (hoveredNodeId === "GOAL") {
      const goalParentIds = new Set(leafNodes.map((n) => n.id));
      return { parentIds: goalParentIds, childIds: new Set(), isStartActive: false, isGoalActive: true };
    }

    const parentIds = new Set(activeNode.prerequisites || []);
    const childIds = new Set();
    edges.forEach((e) => {
      if (e.source === activeNode.id) childIds.add(e.target);
    });

    const isConnectedToStart = rootNodes.some((rn) => rn.id === activeNode.id);
    const isConnectedToGoal = leafNodes.some((ln) => ln.id === activeNode.id);

    return {
      parentIds,
      childIds,
      isStartActive: isConnectedToStart,
      isGoalActive: isConnectedToGoal,
    };
  }, [activeNode, hoveredNodeId, edges, rootNodes, leafNodes]);

  // Automated DNA Flow Timer
  useEffect(() => {
    if (!isPlayingFlow || !flowSequence.length) return;

    const timer = setInterval(() => {
      setFlowStepIndex((prev) => {
        const next = prev + 1;
        if (next >= flowSequence.length) {
          setIsPlayingFlow(false);
          setSelectedNode(null);
          return 0;
        }
        setSelectedNode(flowSequence[next]);
        return next;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, [isPlayingFlow, flowSequence]);

  const togglePlayFlow = () => {
    if (isPlayingFlow) {
      setIsPlayingFlow(false);
    } else {
      setIsPlayingFlow(true);
      setFlowStepIndex(0);
      if (flowSequence.length > 0) {
        setSelectedNode(flowSequence[0]);
      }
    }
  };

  // Trigger Start Action: Highlights start flow immediately
  const handleStartInteraction = () => {
    if (flowSequence.length > 0) {
      setSelectedNode(flowSequence[0]);
      setIsPlayingFlow(true);
      setFlowStepIndex(0);
    }
  };

  // Filtered nodes
  const visibleNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (filterStatus !== "all" && n.status !== filterStatus) return false;
      if (searchQuery && !n.label.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [nodes, filterStatus, searchQuery]);

  return (
    <div className="relative rounded-2xl border border-[var(--border)] bg-[#0d1019] overflow-hidden shadow-2xl flex flex-col h-[720px]">
      {/* Graph Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            <Layers size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--ink)] tracking-tight">
                Skill Dependency DNA Graph
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Interactive Stream
              </span>
            </div>
            <p className="text-xs text-[var(--ink-muted)]">
              Topological prerequisite journey for <strong className="text-[var(--accent-strong)]">{selectedRole}</strong>
            </p>
          </div>
        </div>

        {/* Controls, Playback & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Start / Play DNA Flow Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={togglePlayFlow}
            className={cn(
              "h-8 text-xs font-semibold flex items-center gap-1.5 px-3 rounded-xl transition-all shadow-sm",
              isPlayingFlow
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            )}
            title="Start or pause automated sequential flow from Start to Goal"
          >
            {isPlayingFlow ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
            <span>{isPlayingFlow ? "Pause Flow" : "Start DNA Flow"}</span>
            {isPlayingFlow && (
              <span className="text-[10px] font-mono ml-1 px-1.5 py-0.2 rounded bg-amber-500/20">
                {flowStepIndex + 1}/{flowSequence.length}
              </span>
            )}
          </Button>

          <input
            type="text"
            placeholder="Search skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] placeholder-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)] w-36"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 px-2 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All Evidence States</option>
            <option value="demonstrated">Demonstrated</option>
            <option value="partially_demonstrated">Partially Evidenced</option>
            <option value="self_reported">Self-Reported</option>
            <option value="not_yet_evidenced">Not Yet Evidenced</option>
          </select>

          {/* Zoom & Fit Controls */}
          <div className="graph-controls flex items-center gap-1 pl-2 border-l border-[var(--border)]">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 0.15, 2.2))}
              title="Zoom In"
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
            >
              <ZoomIn size={15} />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
              title="Zoom Out"
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
            >
              <ZoomOut size={15} />
            </button>
            <button
              type="button"
              onClick={resetView}
              title="Reset View"
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
            >
              <RotateCcw size={15} />
            </button>
            <button
              type="button"
              onClick={fitView}
              title="Fit to Screen"
              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive SVG Canvas with Bioluminescent Background */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onMouseMove={handleCanvasMouseMove}
        onMouseEnter={() => setIsHoveringCanvas(true)}
        onMouseLeave={() => setIsHoveringCanvas(false)}
        className={cn(
          "relative flex-1 w-full h-full select-none overflow-hidden",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          "bg-gradient-to-br from-[#050811] via-[#090e1c] to-[#070b16]"
        )}
      >
        {/* Dynamic Interactive Bioluminescent Mouse Spotlight */}
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            opacity: isHoveringCanvas ? 1 : 0.65,
            background: `radial-gradient(620px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.12), rgba(59, 130, 246, 0.08), rgba(168, 85, 247, 0.04), transparent 72%)`,
          }}
        />

        {/* Ambient Nebula Cyber-Glow Orbs */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-emerald-500/10 blur-[130px] animate-pulse"
            style={{ animationDuration: "8s" }}
          />
          <div
            className="absolute top-1/4 -right-28 w-[540px] h-[540px] rounded-full bg-blue-500/10 blur-[140px] animate-pulse"
            style={{ animationDuration: "11s", animationDelay: "2.5s" }}
          />
          <div
            className="absolute -bottom-32 left-1/3 w-[520px] h-[520px] rounded-full bg-purple-500/10 blur-[130px] animate-pulse"
            style={{ animationDuration: "10s", animationDelay: "5s" }}
          />
        </div>

        <svg
          className="absolute inset-0 w-full h-full"
          style={{
            overflow: "visible",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            transition: isDragging ? "none" : "transform 0.15s ease-out",
          }}
        >
          <defs>
            {/* Fine Cyber Grid synchronized with canvas pan and zoom */}
            <pattern
              id="cyber-grid-fine"
              width={30 * zoom}
              height={30 * zoom}
              patternUnits="userSpaceOnUse"
              x={pan.x % (30 * zoom)}
              y={pan.y % (30 * zoom)}
            >
              <path
                d={`M ${30 * zoom} 0 L 0 0 0 ${30 * zoom}`}
                fill="none"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="1"
              />
              <circle cx="0" cy="0" r="0.8" fill="rgba(255, 255, 255, 0.1)" />
            </pattern>

            {/* Major Cyber Matrix Grid */}
            <pattern
              id="cyber-grid-major"
              width={150 * zoom}
              height={150 * zoom}
              patternUnits="userSpaceOnUse"
              x={pan.x % (150 * zoom)}
              y={pan.y % (150 * zoom)}
            >
              <path
                d={`M ${150 * zoom} 0 L 0 0 0 ${150 * zoom}`}
                fill="none"
                stroke="rgba(16, 185, 129, 0.06)"
                strokeWidth="1.5"
              />
              <circle cx="0" cy="0" r="2.5" fill="rgba(52, 211, 153, 0.22)" />
            </pattern>

            {/* Rich Gradient Fill for Node Cards */}
            <linearGradient id="node-card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#171e2e" />
              <stop offset="100%" stopColor="#101524" />
            </linearGradient>

            <marker
              id="dna-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#475569" />
            </marker>
            <marker
              id="dna-arrow-active"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#10b981" />
            </marker>
            <filter id="glow-dot" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="edge-grad-normal" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#334155" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#475569" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="edge-grad-active" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="start-edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Synchronized Cyber Grid Surface */}
          <rect
            x={-pan.x / zoom - 200}
            y={-pan.y / zoom - 200}
            width="5000"
            height="3500"
            fill="url(#cyber-grid-fine)"
            className="pointer-events-none"
          />
          <rect
            x={-pan.x / zoom - 200}
            y={-pan.y / zoom - 200}
            width="5000"
            height="3500"
            fill="url(#cyber-grid-major)"
            className="pointer-events-none"
          />

          {/* START ANCHOR EDGES: Connected from START into all Level 1 / Root Skills */}
          {rootNodes.map((rn) => {
            const rx = rn.position?.x ?? rn.x ?? 0;
            const ry = (rn.position?.y ?? rn.y ?? 0) + NODE_HEIGHT / 2;
            const sx = startPos.x + 130;
            const sy = startPos.y + 35;
            const dx = Math.max(Math.abs(rx - sx) * 0.5, 40);
            const pathData = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${rx - dx} ${ry}, ${rx} ${ry}`;
            const isStartEdgeActive =
              activeLineage.isStartActive ||
              hoveredNodeId === "START" ||
              (activeNode && activeNode.id === rn.id) ||
              isPlayingFlow;

            return (
              <g key={`start->${rn.id}`}>
                <path
                  id={`start-path-${rn.id}`}
                  d={pathData}
                  fill="none"
                  stroke={isStartEdgeActive ? "url(#start-edge-grad)" : "#334155"}
                  strokeWidth={isStartEdgeActive ? 2.5 : 1.5}
                  strokeDasharray={isStartEdgeActive ? "6 3" : undefined}
                  markerEnd={isStartEdgeActive ? "url(#dna-arrow-active)" : "url(#dna-arrow)"}
                  className={isStartEdgeActive ? "animate-pulse" : ""}
                />
                {isStartEdgeActive && (
                  <circle r="3.5" fill="#34d399" filter="url(#glow-dot)">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path={pathData} />
                  </circle>
                )}
              </g>
            );
          })}

          {/* INTERNAL PREREQUISITE EDGES (Curved Bezier Paths) */}
          {edges.map((edge) => {
            const src = nodeMap.get(edge.source);
            const tgt = nodeMap.get(edge.target);
            if (!src || !tgt) return null;

            const x1 = (src.position?.x ?? src.x ?? 0) + NODE_WIDTH;
            const y1 = (src.position?.y ?? src.y ?? 0) + NODE_HEIGHT / 2;
            const x2 = tgt.position?.x ?? tgt.x ?? 0;
            const y2 = (tgt.position?.y ?? tgt.y ?? 0) + NODE_HEIGHT / 2;

            const dx = Math.max(Math.abs(x2 - x1) * 0.5, 40);
            const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            const isEdgeActive =
              activeNode &&
              (edge.source === activeNode.id ||
                edge.target === activeNode.id ||
                (activeLineage.parentIds.has(edge.source) && edge.target === activeNode.id));

            return (
              <g key={edge.id}>
                <path
                  id={`path-${edge.id}`}
                  d={pathData}
                  fill="none"
                  stroke={isEdgeActive ? "url(#edge-grad-active)" : "url(#edge-grad-normal)"}
                  strokeWidth={isEdgeActive ? 2.5 : 1.5}
                  strokeDasharray={isEdgeActive ? "6 3" : undefined}
                  markerEnd={isEdgeActive ? "url(#dna-arrow-active)" : "url(#dna-arrow)"}
                  className={isEdgeActive ? "animate-pulse" : ""}
                />
                {isEdgeActive && (
                  <circle r="3.5" fill="#34d399" filter="url(#glow-dot)">
                    <animateMotion dur="2s" repeatCount="indefinite" path={pathData} />
                  </circle>
                )}
              </g>
            );
          })}

          {/* GOAL ANCHOR EDGES: Connected from Leaf Skills into Target Role Mastery */}
          {leafNodes.map((ln) => {
            const lx = (ln.position?.x ?? ln.x ?? 0) + NODE_WIDTH;
            const ly = (ln.position?.y ?? ln.y ?? 0) + NODE_HEIGHT / 2;
            const gx = goalPos.x;
            const gy = goalPos.y + 35;
            const dx = Math.max(Math.abs(gx - lx) * 0.5, 40);
            const pathData = `M ${lx} ${ly} C ${lx + dx} ${ly}, ${gx - dx} ${gy}, ${gx} ${gy}`;
            const isGoalEdgeActive =
              activeLineage.isGoalActive ||
              hoveredNodeId === "GOAL" ||
              (activeNode && activeNode.id === ln.id);

            return (
              <g key={`goal->${ln.id}`}>
                <path
                  d={pathData}
                  fill="none"
                  stroke={isGoalEdgeActive ? "url(#edge-grad-active)" : "#334155"}
                  strokeWidth={isGoalEdgeActive ? 2.5 : 1.5}
                  strokeDasharray={isGoalEdgeActive ? "6 3" : undefined}
                  markerEnd={isGoalEdgeActive ? "url(#dna-arrow-active)" : "url(#dna-arrow)"}
                />
                {isGoalEdgeActive && (
                  <circle r="3.5" fill="#a855f7" filter="url(#glow-dot)">
                    <animateMotion dur="2.4s" repeatCount="indefinite" path={pathData} />
                  </circle>
                )}
              </g>
            );
          })}

          {/* START ANCHOR NODE (Genesis Foundation) */}
          <g
            transform={`translate(${startPos.x}, ${startPos.y})`}
            className="graph-node-interactive cursor-pointer group"
            onClick={handleStartInteraction}
            onMouseEnter={() => setHoveredNodeId("START")}
            onMouseLeave={() => setHoveredNodeId(null)}
          >
            {/* Glowing Halo */}
            <rect
              x="-6"
              y="-6"
              width="142"
              height="82"
              rx="20"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeOpacity={hoveredNodeId === "START" || activeLineage.isStartActive ? "0.9" : "0.3"}
              className="transition-opacity animate-pulse"
            />
            <rect
              x="0"
              y="0"
              width="130"
              height="70"
              rx="16"
              fill="#062e1e"
              stroke="#10b981"
              strokeWidth="2"
              className="group-hover:stroke-emerald-400 transition-colors shadow-lg"
            />
            <foreignObject x="8" y="10" width="114" height="50">
              <div className="flex flex-col items-center justify-center h-full text-center select-none">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Play size={13} className="fill-emerald-400 animate-bounce" />
                  <span>START</span>
                </div>
                <span className="text-[10px] text-emerald-200/80 mt-0.5">
                  Career Origin
                </span>
                <span className="text-[9px] font-mono text-emerald-400/90 mt-0.5">
                  Click to Begin Flow
                </span>
              </div>
            </foreignObject>
          </g>

          {/* GOAL ANCHOR NODE (Role Mastery) */}
          <g
            transform={`translate(${goalPos.x}, ${goalPos.y})`}
            className="graph-node-interactive cursor-pointer group"
            onMouseEnter={() => setHoveredNodeId("GOAL")}
            onMouseLeave={() => setHoveredNodeId(null)}
          >
            <rect
              x="-6"
              y="-6"
              width="152"
              height="82"
              rx="20"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeOpacity={hoveredNodeId === "GOAL" || activeLineage.isGoalActive ? "0.9" : "0.3"}
              className="transition-opacity animate-pulse"
            />
            <rect
              x="0"
              y="0"
              width="140"
              height="70"
              rx="16"
              fill="#220c3a"
              stroke="#a855f7"
              strokeWidth="2"
              className="group-hover:stroke-purple-400 transition-colors shadow-lg"
            />
            <foreignObject x="8" y="10" width="124" height="50">
              <div className="flex flex-col items-center justify-center h-full text-center select-none">
                <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs uppercase tracking-wider">
                  <Award size={14} className="text-purple-400" />
                  <span>ROLE MASTERY</span>
                </div>
                <span className="text-[10px] text-purple-200/80 mt-0.5 truncate max-w-[120px]">
                  {selectedRole}
                </span>
                <span className="text-[9px] font-mono text-purple-300/80 mt-0.5">
                  100% Target Met
                </span>
              </div>
            </foreignObject>
          </g>

          {/* INTERACTIVE SKILL NODES */}
          {visibleNodes.map((node) => {
            const x = node.position?.x ?? node.x ?? 0;
            const y = node.position?.y ?? node.y ?? 0;
            const statusConfig = STATUS_CONFIG[node.status] || STATUS_CONFIG.not_yet_evidenced;
            const Icon = statusConfig.icon;
            const isSelected = selectedNode?.id === node.id;
            const isHovered = hoveredNodeId === node.id;
            const isParent = activeLineage.parentIds.has(node.id);
            const isChild = activeLineage.childIds.has(node.id);
            const isActive = isSelected || isHovered || isParent || isChild;

            return (
              <g
                key={node.id}
                transform={`translate(${x}, ${y})`}
                className="graph-node-interactive cursor-pointer transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(node);
                  setIsPlayingFlow(false);
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                {/* Glow Filter on active/selected */}
                {isActive && (
                  <rect
                    x="-5"
                    y="-5"
                    width={NODE_WIDTH + 10}
                    height={NODE_HEIGHT + 10}
                    rx="17"
                    fill="none"
                    stroke={isSelected || isHovered ? "#10b981" : isParent ? "#60a5fa" : "#c084fc"}
                    strokeWidth="2.5"
                    strokeOpacity="0.85"
                    filter="url(#glow-dot)"
                  />
                )}

                {/* Node Box */}
                <rect
                  x="0"
                  y="0"
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx="12"
                  fill="url(#node-card-grad)"
                  stroke={isActive ? statusConfig.border : "rgba(255,255,255,0.08)"}
                  strokeWidth={isActive ? "2" : "1"}
                  className="hover:stroke-[var(--accent)] transition-all shadow-xl"
                />

                {/* Status indicator bar (Left border pill) */}
                <rect
                  x="0"
                  y="0"
                  width="5"
                  height={NODE_HEIGHT}
                  rx="2"
                  fill={statusConfig.border}
                />

                {/* Node Label & Category */}
                <foreignObject x="12" y="8" width={NODE_WIDTH - 20} height={NODE_HEIGHT - 16}>
                  <div className="flex flex-col justify-between h-full select-none text-left">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--ink-muted)] truncate">
                        {node.category || "Skill"}
                      </span>
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold"
                        style={{
                          backgroundColor: statusConfig.bg,
                          color: statusConfig.text,
                        }}
                      >
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-[var(--ink)] truncate mt-1">
                      {node.label}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[var(--ink-muted)]">
                      <span>
                        Prereqs: {node.prerequisites?.length || 0}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        Level {node.level || 1}
                      </span>
                    </div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {/* Empty Search Overlay */}
        {visibleNodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-6">
            <p className="text-sm text-[var(--ink-muted)]">
              {nodes.length === 0
                ? "Loading Topological DNA Graph..."
                : `No skills found matching “${searchQuery}” or filter.`}
            </p>
          </div>
        )}

        {/* Floating DNA Flow Active HUD */}
        {isPlayingFlow && activeNode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl bg-[var(--surface)]/95 border border-[var(--accent)]/40 shadow-2xl backdrop-blur-md flex items-center gap-3 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-xs">
              <span className="text-[var(--ink-muted)]">Sequencing DNA: </span>
              <strong className="text-[var(--ink)]">{activeNode.label}</strong>
              <span className="text-[10px] font-mono text-[var(--accent-strong)] ml-2">
                (Level {activeNode.level || 1})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPlayingFlow(false)}
              className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] ml-2 pl-2 border-l border-[var(--border)]"
            >
              Stop
            </button>
          </div>
        )}
      </div>

      {/* Legend & Start Helper Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 border-t border-[var(--border)] bg-[var(--surface)] text-xs z-10">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={handleStartInteraction}
            className="flex items-center gap-1.5 font-semibold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider text-[11px]"
          >
            <Play size={12} className="fill-current" />
            <span>Go to Start</span>
          </button>
          <span className="text-[var(--border)]">|</span>
          <span className="text-[11px] font-medium text-[var(--ink-muted)] uppercase tracking-wider">
            DNA Status:
          </span>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cfg.border }}
              />
              <span className="text-[11px] text-[var(--ink-muted)]">{cfg.label}</span>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-[var(--ink-muted)]">
          Click <strong>START</strong> or any skill to stream dependency flow &amp; submit proof
        </div>
      </div>

      {/* Slide-out Node Detail Drawer */}
      {selectedNode && (
        <div className="absolute top-0 right-0 bottom-0 w-96 border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl z-30 flex flex-col p-5 overflow-y-auto animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    STATUS_CONFIG[selectedNode.status]?.border || "#10b981",
                }}
              />
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-muted)]">
                {selectedNode.category || "Skill Detail"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4">
            <h4 className="text-lg font-bold text-[var(--ink)] tracking-tight">
              {selectedNode.label}
            </h4>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant={
                  selectedNode.status === "demonstrated"
                    ? "success"
                    : selectedNode.status === "partially_demonstrated"
                    ? "accent"
                    : selectedNode.status === "self_reported"
                    ? "warning"
                    : "danger"
                }
              >
                {STATUS_CONFIG[selectedNode.status]?.label || selectedNode.status}
              </Badge>
              {selectedNode.importance && (
                <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                  {selectedNode.importance}
                </span>
              )}
            </div>
          </div>

          {/* Role Impact */}
          <div className="mt-4 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5 mb-1">
              <Sparkles size={13} className="text-[var(--accent)]" />
              Role Impact &amp; Relevance
            </div>
            <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
              {selectedNode.whyItMatters ||
                selectedNode.whyPrerequisite ||
                `${selectedNode.label} is an architectural pillar for ${selectedRole}. Mastering it unlocks practical execution on modern distributed stacks.`}
            </p>
          </div>

          {/* Prerequisites Chain */}
          <div className="mt-5">
            <div className="text-xs font-semibold text-[var(--ink)] mb-2 flex items-center justify-between">
              <span>Prerequisites ({selectedNode.prerequisites?.length || 0})</span>
              <span className="text-[10px] text-[var(--ink-muted)] font-normal">
                Strict dependency order
              </span>
            </div>

            {selectedNode.prerequisites && selectedNode.prerequisites.length > 0 ? (
              <div className="space-y-1.5">
                {selectedNode.prerequisites.map((pId) => {
                  const pNode = nodeMap.get(pId);
                  const isDone =
                    pNode?.status === "demonstrated" ||
                    pNode?.status === "partially_demonstrated";
                  return (
                    <div
                      key={pId}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg border text-xs",
                        isDone
                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
                          : "border-amber-500/20 bg-amber-500/5 text-amber-300"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle2 size={13} className="text-emerald-400" />
                        ) : (
                          <AlertCircle size={13} className="text-amber-400" />
                        )}
                        <span className="font-medium">{pNode?.label || pId}</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-80">
                        {isDone ? "Evidenced" : "Missing Prereq"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--ink-muted)] italic">
                Foundational prerequisite. Directly connected to START.
              </p>
            )}
          </div>

          {/* Practical Recommended Project Artifact */}
          {selectedNode.practicalExercise && (
            <div className="mt-5 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <div className="text-xs font-semibold text-[var(--ink)] mb-1">
                Recommended Verification Artifact
              </div>
              <p className="text-xs text-[var(--ink-muted)]">
                {selectedNode.practicalExercise}
              </p>
            </div>
          )}

          {/* Action CTAs */}
          <div className="mt-auto pt-6 space-y-2">
            <Button
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => {
                onSubmitProof?.({
                  gapId: selectedNode.id,
                  skillName: selectedNode.label,
                });
              }}
            >
              <ShieldCheck size={14} />
              Submit Evidence / Proof
            </Button>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => {
                onAddToRoadmap?.(selectedNode.id);
              }}
            >
              <PlusCircle size={14} />
              Bridge to Career Roadmap
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
