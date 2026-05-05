import type { FuncCatKey, FuncTaxonomyNode } from "@/types";

export const FUNC_TAXONOMY: FuncTaxonomyNode[] = [
  {
    key: "workTask",
    l1: [
      { key: "systemDesign", l2: ["reqAnalysis", "funcDesign", "archDesign"] },
      { key: "softDev", l2: ["frontend", "backend", "devops"] },
      { key: "testing", l2: ["unitTest", "intTest", "perfTest"] },
    ],
  },
  {
    key: "business",
    l1: [
      { key: "network", l2: ["http", "grpc", "mqtt"] },
      { key: "embedded", l2: ["rtos", "firmware", "drivers"] },
      { key: "cloud", l2: ["aws", "azure", "k8s"] },
    ],
  },
  {
    key: "tools",
    l1: [
      { key: "docs", l2: ["markdown", "pdf", "wiki"] },
      { key: "data", l2: ["csv", "sql", "viz"] },
      { key: "vcs", l2: ["git", "pr", "cicd"] },
    ],
  },
];

export const FUNC_CAT_COLORS: Record<FuncCatKey, string> = {
  workTask: "oklch(62% 0.18 255)",
  business: "oklch(62% 0.18 145)",
  tools: "oklch(62% 0.18 55)",
};
