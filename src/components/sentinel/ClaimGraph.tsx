"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import type { Node as NodeType } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";

interface QueryResult {
  found: boolean;
  exact_sentence?: string;
  page_number?: number;
  context?: string;
  verdict?: string;
  paperTitle?: string;
  paperId?: string;
  claim?: string;
}

interface ClaimGraphProps {
  results: QueryResult[];
}

type ClaimNodeType = NodeType<{ label: string; fullText: string }, "claim">;
type PaperNodeType = NodeType<{ label: string; fullText: string }, "paper">;
type SentenceNodeType = NodeType<{ label: string; fullText: string }, "sentence">;
type VerdictNodeType = NodeType<{ label: string }, "verdict">;

function ClaimNode({ data }: NodeProps<ClaimNodeType>) {
  return (
    <div
      style={{
        background: "#0a0a0a",
        border: "1px solid #3b82f6",
        padding: "8px 12px",
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#fff",
        maxWidth: "220px",
        position: "relative",
      }}
      title={data.fullText}
    >
      <Handle type="target" position={Position.Top} style={{ background: "#333" }} />
      {data.label}
      <Handle type="source" position={Position.Bottom} style={{ background: "#333" }} />
    </div>
  );
}

function PaperNode({ data }: NodeProps<PaperNodeType>) {
  return (
    <div
      style={{
        background: "#0a0a0a",
        border: "1px solid #00ff41",
        padding: "8px 12px",
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#00ff41",
        maxWidth: "220px",
        position: "relative",
      }}
      title={data.fullText}
    >
      <Handle type="target" position={Position.Top} style={{ background: "#333" }} />
      {data.label}
      <Handle type="source" position={Position.Bottom} style={{ background: "#333" }} />
    </div>
  );
}

function SentenceNode({ data }: NodeProps<SentenceNodeType>) {
  return (
    <div
      style={{
        background: "#0a0a0a",
        border: "1px solid #fff",
        padding: "8px 12px",
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#ccc",
        maxWidth: "260px",
        position: "relative",
      }}
      title={data.fullText}
    >
      <Handle type="target" position={Position.Top} style={{ background: "#333" }} />
      &quot;{data.label}&quot;
      <Handle type="source" position={Position.Bottom} style={{ background: "#333" }} />
    </div>
  );
}

function VerdictNode({ data }: NodeProps<VerdictNodeType>) {
  const color =
    data.label === "SUPPORTS"
      ? "#00ff41"
      : data.label === "REFUTES"
      ? "#ef4444"
      : "#6b7280";
  return (
    <div
      style={{
        background: "#0a0a0a",
        border: `1px solid ${color}`,
        padding: "4px 10px",
        fontFamily: "monospace",
        fontSize: "11px",
        color,
        fontWeight: "bold",
        position: "relative",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "#333" }} />
      {data.label}
    </div>
  );
}

const nodeTypes = {
  claim: ClaimNode,
  paper: PaperNode,
  sentence: SentenceNode,
  verdict: VerdictNode,
};

function buildNodesAndEdges(results: QueryResult[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let idCounter = 0;

  results.forEach((r) => {
    const claimId = `claim-${idCounter}`;
    const paperId = `paper-${idCounter}`;
    const sentenceId = `sentence-${idCounter}`;
    const verdictId = `verdict-${idCounter}`;

    nodes.push({
      id: claimId,
      type: "claim",
      position: { x: 0, y: 0 },
      data: {
        label: (r.claim ?? "Claim").slice(0, 50) + ((r.claim ?? "").length > 50 ? "..." : ""),
        fullText: r.claim ?? "",
      },
    });

    if (r.paperId) {
      nodes.push({
        id: paperId,
        type: "paper",
        position: { x: 0, y: 0 },
        data: {
          label: (r.paperTitle ?? "Paper").slice(0, 40) + ((r.paperTitle ?? "").length > 40 ? "..." : ""),
          fullText: r.paperTitle ?? "",
        },
      });
      edges.push({
        id: `e-${claimId}-${paperId}`,
        source: claimId,
        target: paperId,
        label: "found in",
        style: { stroke: "#333", strokeDasharray: "4 4" },
        labelStyle: { fill: "#666", fontFamily: "monospace", fontSize: 10 },
        animated: true,
      });
    }

    if (r.found && r.exact_sentence) {
      nodes.push({
        id: sentenceId,
        type: "sentence",
        position: { x: 0, y: 0 },
        data: {
          label: r.exact_sentence.slice(0, 80) + (r.exact_sentence.length > 80 ? "..." : ""),
          fullText: r.exact_sentence,
        },
      });
      edges.push({
        id: `e-${paperId}-${sentenceId}`,
        source: paperId,
        target: sentenceId,
        label: `page ${r.page_number ?? "?"}`,
        style: { stroke: "#333", strokeDasharray: "4 4" },
        labelStyle: { fill: "#666", fontFamily: "monospace", fontSize: 10 },
        animated: true,
      });

      nodes.push({
        id: verdictId,
        type: "verdict",
        position: { x: 0, y: 0 },
        data: { label: r.verdict ?? "UNRELATED" },
      });
      edges.push({
        id: `e-${sentenceId}-${verdictId}`,
        source: sentenceId,
        target: verdictId,
        label: "verdict",
        style: { stroke: "#333", strokeDasharray: "4 4" },
        labelStyle: { fill: "#666", fontFamily: "monospace", fontSize: 10 },
        animated: true,
      });
    }

    idCounter++;
  });

  return { nodes, edges };
}

function layoutGraph(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((n) => {
    g.setNode(n.id, { width: 220, height: 40 });
  });
  edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  const laidOutNodes = nodes.map((n) => {
    const node = g.node(n.id);
    return {
      ...n,
      position: { x: node.x - 110, y: node.y - 20 },
    };
  });

  return { nodes: laidOutNodes, edges };
}

function GraphInner({ results }: ClaimGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const { fitView } = useReactFlow();

  const allNodesEdges = useMemo(() => {
    const { nodes: rawNodes, edges: rawEdges } = buildNodesAndEdges(results);
    return layoutGraph(rawNodes, rawEdges);
  }, [results]);

  useEffect(() => {
    setVisibleCount(0);
  }, [results]);

  useEffect(() => {
    if (visibleCount < allNodesEdges.nodes.length) {
      const timer = setTimeout(() => {
        setVisibleCount((c) => c + 1);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, allNodesEdges.nodes.length]);

  useEffect(() => {
    const visibleNodes = allNodesEdges.nodes.slice(0, visibleCount);
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = allNodesEdges.edges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
    setNodes(visibleNodes);
    setEdges(visibleEdges);
  }, [visibleCount, allNodesEdges, setNodes, setEdges]);

  useEffect(() => {
    if (visibleCount > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 });
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [visibleCount, fitView]);

  const onInit = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  return (
    <div style={{ width: "100%", height: "400px", background: "#000", position: "relative" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        onInit={onInit}
        style={{ background: "#000" }}
      >
        <Background color="#1a1a1a" gap={16} size={1} variant={BackgroundVariant.Dots} />
        <Controls style={{ background: "#0a0a0a", border: "1px solid #333" }} />
      </ReactFlow>
    </div>
  );
}

export default function ClaimGraph({ results }: ClaimGraphProps) {
  return (
    <ReactFlowProvider>
      <GraphInner results={results} />
    </ReactFlowProvider>
  );
}
