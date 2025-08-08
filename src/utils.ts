import { access } from "node:fs/promises";
import path from "node:path";

export async function validateDirectory(dir: string): Promise<string> {
  const resolvedDir = path.resolve(dir);
  try {
    await access(resolvedDir);
    return resolvedDir;
  } catch {
    console.error(
      `Error: Directory "${dir}" does not exist or is not accessible`
    );
    process.exit(1);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// More advanced estimation that considers file types and patterns
export function estimateSearchTime(
  files: Array<{ size: number; path: string }>,
  maxConcurrency: number = 20
): string {
  if (files.length === 0) return "0 seconds";

  // Categorize files by type and size for more accurate estimation
  const categories = {
    smallText: { files: 0, totalSize: 0, rate: 150 }, // files/second
    largeText: { files: 0, totalSize: 0, rate: 10 }, // MB/second
    binary: { files: 0, totalSize: 0, rate: 50 }, // MB/second (faster, often skip)
  };

  const textExtensions =
    /\.(js|ts|tsx|jsx|py|java|cpp|c|h|cs|php|rb|go|rs|scala|kt|swift|dart|vue|html|css|scss|sass|less|xml|json|yaml|yml|toml|ini|cfg|conf|md|txt|log|sql|sh|bash|zsh|fish|ps1|bat|cmd|dockerfile|makefile|gradle|maven|sbt|cargo|package|gemfile|pipfile|requirements)$/i;
  const smallFileThreshold = 100 * 1024; // 100KB

  for (const file of files) {
    const isText = textExtensions.test(file.path);
    const isSmall = file.size < smallFileThreshold;

    if (isText && isSmall) {
      categories.smallText.files++;
      categories.smallText.totalSize += file.size;
    } else if (isText && !isSmall) {
      categories.largeText.files++;
      categories.largeText.totalSize += file.size;
    } else {
      categories.binary.files++;
      categories.binary.totalSize += file.size;
    }
  }

  let totalTime = 0;

  // Calculate time for each category
  const effectiveConcurrency = Math.min(maxConcurrency, files.length);

  // Small text files
  if (categories.smallText.files > 0) {
    const timePerWorker =
      categories.smallText.files / categories.smallText.rate;
    totalTime += timePerWorker / effectiveConcurrency;
  }

  // Large text files
  if (categories.largeText.files > 0) {
    const sizeMB = categories.largeText.totalSize / (1024 * 1024);
    const timePerWorker = sizeMB / categories.largeText.rate;
    totalTime += timePerWorker / Math.sqrt(effectiveConcurrency); // Diminishing returns for I/O
  }

  // Binary files (usually skipped or processed faster)
  if (categories.binary.files > 0) {
    const sizeMB = categories.binary.totalSize / (1024 * 1024);
    const timePerWorker = sizeMB / categories.binary.rate;
    totalTime += timePerWorker / effectiveConcurrency;
  }

  // Add overhead
  totalTime += files.length * 0.001; // 1ms per file
  totalTime = Math.max(totalTime, files.length * 0.0005); // Minimum time

  // Format result
  if (totalTime < 1) return "< 1 second";
  if (totalTime < 2) return "~1 second";
  if (totalTime < 60)
    return `~${Math.ceil(totalTime)} second${
      Math.ceil(totalTime) > 1 ? "s" : ""
    }`;

  const minutes = Math.ceil(totalTime / 60);
  if (minutes < 60) return `~${minutes} minute${minutes > 1 ? "s" : ""}`;

  const hours = Math.ceil(minutes / 60);
  return `~${hours} hour${hours > 1 ? "s" : ""}`;
}
