export interface GrafoNode {
  id: string;
  label: string;
  kind: string;
  group: string;
  weight: number;
}
export interface GrafoEdge {
  from: string;
  to: string;
  type: "IMPORTS" | "CALLS" | string;
  weight: number;
}
export interface GrafoData {
  meta: { repo: string; indexedAt: string; stats: Record<string, number>; commit: string; description: string };
  nodes: GrafoNode[];
  edges: GrafoEdge[];
  communities: { id: string; label: string; count: number; cohesion: number }[];
  processes: { label: string; steps: number; type: string }[];
}
