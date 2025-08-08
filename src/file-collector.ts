import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import EventEmitter from "node:events";
import { FileInfo } from "./types";

export async function collectFiles(
  directory: string,
  emitter: EventEmitter,
  options: {
    excludeDirectories: string[];
    fileTypeFilter?: RegExp | null;
    maxConcurrency?: number; // Add concurrency control
  }
): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  const maxConcurrency = options.maxConcurrency ?? 50; // Default limit
  await collectFilesRecursive(
    directory,
    emitter,
    { ...options, maxConcurrency },
    files
  );
  return files;
}

async function collectFilesRecursive(
  directory: string,
  emitter: EventEmitter,
  options: {
    excludeDirectories: string[];
    fileTypeFilter?: RegExp | null;
    maxConcurrency?: number;
  },
  files: FileInfo[]
): Promise<void> {
  try {
    const dirFiles = await readdir(directory, { withFileTypes: true });

    // Separate directories and files for different processing strategies
    const directories: string[] = [];
    const filePromises: Promise<void>[] = [];

    for (const file of dirFiles) {
      const filePath = path.join(directory, file.name);

      if (file.isDirectory()) {
        // Check if directory should be excluded
        if (!options.excludeDirectories.includes(file.name)) {
          directories.push(filePath);
        }
      } else if (file.isFile()) {
        // Process files in parallel
        filePromises.push(
          processFile(filePath, file.name, options, files, emitter)
        );
      }
    }

    // Process all files in the current directory in parallel
    if (filePromises.length > 0) {
      await Promise.allSettled(filePromises);
    }

    // Process directories recursively with controlled concurrency
    if (directories.length > 0) {
      const maxConcurrency = options.maxConcurrency ?? 10; // Lower default for directories
      const directoryTasks = directories.map(
        (dirPath) => () =>
          collectFilesRecursive(dirPath, emitter, options, files).catch(
            (dirError) => {
              if (!isPermissionError(dirError)) {
                emitter.emit("error", dirError);
              }
              // Continue with other directories even if one fails
            }
          )
      );

      // Process directories with concurrency control
      for (let i = 0; i < directoryTasks.length; i += maxConcurrency) {
        const batch = directoryTasks.slice(i, i + maxConcurrency);
        await Promise.allSettled(batch.map((task) => task()));
      }
    }
  } catch (error: any) {
    if (isPermissionError(error)) {
      return;
    }
    emitter.emit("error", error);
  }
}

async function processFile(
  filePath: string,
  fileName: string,
  options: { fileTypeFilter?: RegExp | null },
  files: FileInfo[],
  emitter: EventEmitter
): Promise<void> {
  // Skip files that don't match file type filter
  if (options.fileTypeFilter && !options.fileTypeFilter.test(filePath)) {
    return;
  }

  try {
    const stats = await stat(filePath);
    const fileInfo: FileInfo = {
      path: filePath,
      name: fileName,
      size: stats.size,
    };
    files.push(fileInfo);
    emitter.emit("fileFound", fileInfo);
  } catch (statError: any) {
    if (isPermissionError(statError)) {
      return;
    }
    // Emit error but continue
    emitter.emit(
      "error",
      new Error(`Failed to stat file ${filePath}: ${statError}`)
    );
  }
}

function isPermissionError(error: any): boolean {
  return error.code === "EACCES" || error.code === "EPERM";
}
