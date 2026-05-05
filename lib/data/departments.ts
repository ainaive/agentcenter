import type { Department, Locale } from "@/types";

export const DEPARTMENTS: Department[] = [
  {
    id: "eng",
    name: "Engineering",
    nameZh: "研发中心",
    children: [
      {
        id: "eng.cloud",
        name: "Cloud Platform",
        nameZh: "云平台",
        children: [
          { id: "eng.cloud.infra", name: "Infrastructure", nameZh: "基础设施" },
          { id: "eng.cloud.devops", name: "DevOps", nameZh: "DevOps" },
        ],
      },
      {
        id: "eng.product",
        name: "Product Engineering",
        nameZh: "产品研发",
        children: [
          { id: "eng.product.web", name: "Web Apps", nameZh: "Web 应用" },
          { id: "eng.product.mobile", name: "Mobile", nameZh: "移动端" },
        ],
      },
      {
        id: "eng.ai",
        name: "AI Lab",
        nameZh: "AI 实验室",
        children: [
          { id: "eng.ai.research", name: "Research", nameZh: "研究" },
          { id: "eng.ai.applied", name: "Applied AI", nameZh: "应用 AI" },
        ],
      },
    ],
  },
  {
    id: "biz",
    name: "Business",
    nameZh: "业务部",
    children: [
      { id: "biz.sales", name: "Sales", nameZh: "销售" },
      { id: "biz.marketing", name: "Marketing", nameZh: "市场" },
    ],
  },
  {
    id: "ops",
    name: "Operations",
    nameZh: "运营",
    children: [
      { id: "ops.support", name: "Customer Support", nameZh: "客户支持" },
      { id: "ops.finance", name: "Finance", nameZh: "财务" },
    ],
  },
];

// Hardcoded for now; comes from the authenticated user's defaultDeptId once auth lands (Phase 6).
export const MY_DEPT_ID = "eng.cloud.infra";

export function findDept(
  id: string,
  list: Department[] = DEPARTMENTS,
): Department | null {
  for (const d of list) {
    if (d.id === id) return d;
    if (d.children) {
      const found = findDept(id, d.children);
      if (found) return found;
    }
  }
  return null;
}

export function deptPath(id: string, locale: Locale): string[] {
  const parts = id.split(".");
  const path: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const d = findDept(parts.slice(0, i + 1).join("."));
    if (d) path.push(locale === "zh" ? d.nameZh : d.name);
  }
  return path;
}

export function isDescendant(deptId: string, ancestorId: string): boolean {
  return deptId === ancestorId || deptId.startsWith(ancestorId + ".");
}
