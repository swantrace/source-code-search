import EventEmitter from "node:events";
import { FileInfo, SearchOptions, SearchResult, SearchProgress } from "./types";
import { checkContentWithStream } from "./content-search";
import { collectFiles } from "./file-collector";

export function createFinder(options?: SearchOptions) {
  const emitter = new EventEmitter();
  const excludeDirs = options?.excludeDirectories || [];
  const fileTypeFilter = options?.fileTypeFilter;
  const nameOnly = options?.nameOnly || false;

  // Move found results to finder level
  const found: SearchResult = {
    byName: [],
    byContent: [],
  };

  // Add a cancellation state
  let isCancelled = false;

  // Private implementation functions
  async function _collectAndMatchNames(regex: RegExp, directory: string) {
    // Collect all files
    emitter.emit("searchStarted", { directory });
    const collectedFiles = await collectFiles(directory, emitter, {
      excludeDirectories: excludeDirs,
      fileTypeFilter,
    });

    // Check filename matches - always do name matching now
    const nameMatches = collectedFiles.filter((file) => regex.test(file.name));
    found.byName = nameMatches.map((f) => f.path);

    // Emit collection complete with collected files
    emitter.emit("collectionComplete", {
      collectedFiles,
      cancel: () => {
        isCancelled = true;
      },
    });

    if (nameOnly) {
      emitter.emit("found", found);
    }

    return collectedFiles;
  }

  async function _searchContent(
    regex: RegExp,
    collectedFiles: FileInfo[],
    maxConcurrency: number = 20
  ) {
    // Phase 3: Content search (with progress and parallelization)
    emitter.emit("contentSearchStarted", { fileCount: collectedFiles.length });

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

  // Public API
  async function search(
    regex: RegExp,
    directory: string = process.cwd(),
    maxConcurrency: number = 20
  ) {
    // Reset cancellation state and results for new search
    isCancelled = false;
    found.byName = [];
    found.byContent = [];

    const collectedFiles = await _collectAndMatchNames(regex, directory);

    // Provide time for collection complete handlers to potentially cancel the search
    // Wait for all microtasks to finish (which includes promise resolutions from handlers)
    await new Promise((resolve) => setTimeout(resolve, 0));

    if (isCancelled || nameOnly || collectedFiles.length === 0) {
      return found;
    }

    await _searchContent(regex, collectedFiles, maxConcurrency);
    return found;
  }

  return {
    search,
    found, // Expose found as a property
    cancel: () => {
      isCancelled = true;
    }, // Expose cancel function directly
    onFound: (callback: (found: SearchResult) => void) => {
      emitter.on("found", callback);
    },
    onError: (callback: (error: Error) => void) => {
      emitter.on("error", callback);
    },
    onFileFound: (callback: (file: FileInfo) => void) => {
      emitter.on("fileFound", callback);
    },
    onSearchStarted: (callback: (info: { directory: string }) => void) => {
      emitter.on("searchStarted", callback);
    },
    onCollectionComplete: (
      callback: (data: {
        collectedFiles: FileInfo[];
        cancel: () => void;
      }) => void
    ) => {
      emitter.on("collectionComplete", callback);
    },
    onContentSearchStarted: (
      callback: (info: { fileCount: number }) => void
    ) => {
      emitter.on("contentSearchStarted", callback);
    },
    onSearchProgress: (callback: (progress: SearchProgress) => void) => {
      emitter.on("searchProgress", callback);
    },
    removeAllListeners: () => {
      emitter.removeAllListeners();
    },
  };
}
