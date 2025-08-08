import { COMMON_SOURCE_EXTENSIONS, DEFAULT_EXCLUDES } from "./constants";

export function parseFileTypes(fileTypes: string): RegExp | null {
  // Default to "source" if no file types specified
  const effectiveFileTypes = fileTypes || "source";

  if (effectiveFileTypes.toLowerCase() === "source") {
    // Create regex for all common source code extensions
    // Escape special regex characters in extensions
    const escapedExtensions = COMMON_SOURCE_EXTENSIONS.map((ext) =>
      ext.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    );
    const pattern = `\\.(${escapedExtensions.join("|")})$`;
    return new RegExp(pattern, "i");
  }

  if (effectiveFileTypes.toLowerCase() === "all") {
    // Search all files - return null to disable file type filtering
    return null;
  }

  // Parse custom file types
  const extensions = effectiveFileTypes
    .split(",")
    .map((ext) => ext.trim().replace(/^\./, "")) // Remove leading dots
    .filter((ext) => ext.length > 0)
    .map((ext) => ext.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); // Escape special chars

  if (extensions.length === 0) return null;

  const pattern = `\\.(${extensions.join("|")})$`;
  return new RegExp(pattern, "i");
}

export function parseExcludes(excludeOption?: string): string[] {
  if (!excludeOption) {
    return DEFAULT_EXCLUDES;
  }

  return excludeOption
    .split(",")
    .map((dir) => dir.trim())
    .filter((dir) => dir.length > 0);
}

export function createSearchRegex(
  pattern: string,
  ignoreCase: boolean
): RegExp {
  try {
    // Check if it's already a regex pattern (contains regex special characters)
    const regexChars = /[.*+?^${}()|[\]\\]/;
    const flags = ignoreCase ? "i" : "";

    if (regexChars.test(pattern)) {
      // Treat as regex
      return new RegExp(pattern, flags);
    } else {
      // Treat as literal string, escape special characters
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(escapedPattern, flags);
    }
  } catch (error) {
    console.error(`Invalid pattern: ${pattern}`);
    process.exit(1);
  }
}
