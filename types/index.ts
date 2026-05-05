export type Locale = "en" | "zh";

export type ExtensionCategory = "skills" | "mcp" | "slash" | "plugins";
export type ExtensionScope = "personal" | "org" | "enterprise";
export type ExtensionBadge = "official" | "popular" | "new";
export type FuncCatKey = "workTask" | "business" | "tools";

export interface Department {
  id: string;
  name: string;
  nameZh: string;
  children?: Department[];
}

export interface FuncTaxonomyNode {
  key: FuncCatKey;
  l1: { key: string; l2: string[] }[];
}

export interface TagLabel {
  en: string;
  zh: string;
}

export interface Extension {
  id: number;
  dept: string;
  tags: string[];
  name: string;
  nameZh: string;
  author: string;
  category: ExtensionCategory;
  badge: ExtensionBadge | null;
  downloads: number;
  stars: number;
  color: string;
  icon: string;
  funcCat: FuncCatKey;
  subCat: string;
  scope: ExtensionScope;
  desc: string;
  descZh: string;
}

export interface Collection {
  id: string;
  name: string;
  nameZh: string;
  count: number;
}
