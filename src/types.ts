export interface FileInfo {
  path: string;
  name: string;
  size: number;
}

export interface CliOptions {
  pattern?: string;
  directory?: string;
  fileTypes?: string;
  nameOnly?: boolean;
  contentOnly?: boolean;
  help?: boolean;
  ignoreCase?: boolean;
  verbose?: boolean;
  exclude?: string;
}

export interface SearchOptions {
  excludeDirectories?: string[];
  fileTypeFilter?: RegExp | null;
  nameOnly?: boolean;
  contentOnly?: boolean;
}

export interface SearchResult {
  byName: string[];
  byContent: string[];
}

export interface SearchStats {
  totalFiles: number;
  totalSize: number;
  nameMatches: number;
}

export interface SearchProgress {
  current: number;
  total: number;
  file: string;
}
