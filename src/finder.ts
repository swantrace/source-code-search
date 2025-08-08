import EventEmitter from "node:events";
import {
  FileInfo,
  SearchOptions,
  SearchResult,
  SearchStats,
  SearchProgress,
} from "./types";
import { checkContentWithStream } from "./content-search";
import { collectFiles } from "./file-collector";

export function createFinder(options?: SearchOptions) {
  const emitter = new EventEmitter();
  const excludeDirs = options?.excludeDirectories || [];
  const fileTypeFilter = options?.fileTypeFilter;
  const nameOnly = options?.nameOnly || false;
  const contentOnly = options?.contentOnly || false;

  // Move found results to finder level
  const found: SearchResult = {
    byName: [],
    byContent: [],
  };

  async function search(regex: RegExp, directory: string = process.cwd()) {
    // Reset results for new search
    found.byName = [];
    found.byContent = [];

    // Phase 1: Collect all files
    emitter.emit("phase", "collecting");
    const collectedFiles = await collectFiles(directory, emitter, {
      excludeDirectories: excludeDirs,
      fileTypeFilter,
    });

    // Phase 2: Check filename matches
    const nameMatches = collectedFiles.filter(
      (file) => !contentOnly && regex.test(file.name)
    );
    found.byName = nameMatches.map((f) => f.path);

    // Emit collection complete with file stats
    emitter.emit("collectionComplete", {
      totalFiles: collectedFiles.length,
      totalSize: collectedFiles.reduce((sum, f) => sum + f.size, 0),
      nameMatches: found.byName.length,
    });

    // If name-only mode, we're done
    if (nameOnly) {
      emitter.emit("found", found);
      return collectedFiles;
    }

    // Return only collectedFiles for content search
    return collectedFiles;
  }

  async function searchContent(
    regex: RegExp,
    collectedFiles: FileInfo[],
    maxConcurrency: number = 20
  ) {
    // Phase 3: Content search (with progress and parallelization)
    emitter.emit("phase", "searching");

    let searchedCount = 0;
    const totalFiles = collectedFiles.length;
    const contentMatches: string[] = [];

    // Process files in parallel batches
    const processBatch = async (batch: FileInfo[]) => {
      const batchPromises = batch.map(async (file) => {
        try {
          const hasMatch = await checkContentWithStream(file.path, regex);

          // Thread-safe counter increment and progress update
          const currentCount = ++searchedCount;
          emitter.emit("searchProgress", {
            current: currentCount,
            total: totalFiles,
            file: file.path,
          });

          if (hasMatch) {
            contentMatches.push(file.path);
          }
        } catch (fileError: any) {
          if (fileError.code !== "EACCES" && fileError.code !== "EPERM") {
            emitter.emit(
              "error",
              new Error(`Failed to read file ${file.path}: ${fileError}`)
            );
          }
        }
      });

      await Promise.allSettled(batchPromises);
    };

    // Process files in controlled batches to prevent overwhelming the system
    for (let i = 0; i < collectedFiles.length; i += maxConcurrency) {
      const batch = collectedFiles.slice(i, i + maxConcurrency);
      await processBatch(batch);
    }

    // Update found results
    found.byContent = contentMatches;
    emitter.emit("found", found);
  }

  return {
    search,
    searchContent,
    found, // Expose found as a property
    onFound: (callback: (found: SearchResult) => void) => {
      emitter.on("found", callback);
    },
    onError: (callback: (error: Error) => void) => {
      emitter.on("error", callback);
    },
    onFileFound: (callback: (file: FileInfo) => void) => {
      emitter.on("fileFound", callback);
    },
    onPhase: (callback: (phase: "collecting" | "searching") => void) => {
      emitter.on("phase", callback);
    },
    onCollectionComplete: (callback: (stats: SearchStats) => void) => {
      emitter.on("collectionComplete", callback);
    },
    onSearchProgress: (callback: (progress: SearchProgress) => void) => {
      emitter.on("searchProgress", callback);
    },
    removeAllListeners: () => {
      emitter.removeAllListeners();
    },
  };
}
