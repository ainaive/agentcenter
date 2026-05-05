import type { Locale, TagLabel } from "@/types";

export const TAG_LABELS: Record<string, TagLabel> = {
  search: { en: "search", zh: "搜索" },
  "real-time": { en: "real-time", zh: "实时" },
  stable: { en: "stable", zh: "稳定版" },
  beta: { en: "beta", zh: "测试版" },
  official: { en: "official", zh: "官方" },
  python: { en: "python", zh: "Python" },
  sandbox: { en: "sandbox", zh: "沙箱" },
  api: { en: "api", zh: "API" },
  vcs: { en: "vcs", zh: "版本控制" },
  docs: { en: "docs", zh: "文档" },
  sync: { en: "sync", zh: "同步" },
  integration: { en: "integration", zh: "集成" },
  summarize: { en: "summarize", zh: "摘要" },
  vision: { en: "vision", zh: "视觉" },
  ocr: { en: "ocr", zh: "OCR" },
  messaging: { en: "messaging", zh: "消息" },
  i18n: { en: "i18n", zh: "国际化" },
  calendar: { en: "calendar", zh: "日历" },
  data: { en: "data", zh: "数据" },
  charts: { en: "charts", zh: "图表" },
  analytics: { en: "analytics", zh: "分析" },
  sql: { en: "sql", zh: "SQL" },
  database: { en: "database", zh: "数据库" },
  code: { en: "code", zh: "代码" },
  explain: { en: "explain", zh: "解释" },
  architecture: { en: "architecture", zh: "架构" },
  review: { en: "review", zh: "评审" },
  devops: { en: "devops", zh: "DevOps" },
  cloud: { en: "cloud", zh: "云" },
  testing: { en: "testing", zh: "测试" },
  automation: { en: "automation", zh: "自动化" },
  iot: { en: "iot", zh: "物联网" },
};

export function tagLabel(key: string, locale: Locale): string {
  return TAG_LABELS[key]?.[locale] ?? key;
}
