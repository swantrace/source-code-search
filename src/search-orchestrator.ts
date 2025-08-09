import path from "node:path";
import { createFinder, FileInfo } from "./index";
import { CliOptions } from "./types";
import { formatResults } from "./output";
import { formatFileSize, estimateSearchTime } from "./utils";
import { askUserConfirmation } from "./input";

export async function performSearch(
  finder: ReturnType<typeof createFinder>,
  searchRegex: RegExp,
  searchDir: string,
  options: CliOptions
) {
  let allFiles: FileInfo[] = [];
  let totalSize = 0;

  // Phase 1: File Discovery
  console.log("\n🔍 Discovering files...");
  finder.onFileFound((file) => {
    allFiles.push(file);
    totalSize += file.size;
    process.stdout.write(
      `\r📁 Found: ${allFiles.length} files, ${formatFileSize(totalSize)} total`
    );
  });

  finder.onError((error) => {
    console.error(`❌ Search error: ${error.message}`);
    if (options.verbose) {
      console.error(error.stack);
    }
  });

  // Set up found handler for results
  finder.onFound((found) => {
    console.log(""); // Clear progress line
    formatResults(found, options);
  });

  // Handle collection completion
  finder.onCollectionComplete(async ({ collectedFiles, cancel }) => {
    const totalFiles = collectedFiles.length;
    const totalSize = collectedFiles.reduce((sum, f) => sum + f.size, 0);
    const nameMatches = finder.found.byName.length;

    console.log(`\n\n📊 Discovery complete:`);
    console.log(`   • Total files: ${totalFiles}`);
    console.log(`   • Total size: ${formatFileSize(totalSize)}`);

    if (nameMatches > 0) {
      console.log(`   • Name matches: ${nameMatches}`);
    }

    if (options.nameOnly) {
      return; // Don't proceed with content search
    }

    if (collectedFiles.length > 0) {
      console.log(`   • Files to search for content: ${collectedFiles.length}`);

      console.log(
        `   • Estimated time: ${estimateSearchTime(
          collectedFiles.map((f) => ({ size: f.size, path: f.path })),
          20
        )}`
      );

      if (collectedFiles.length > 100 || totalSize > 50 * 1024 * 1024) {
        // 50MB
        const shouldContinueSearch = await askUserConfirmation(
          `This will search ${collectedFiles.length} files for content. Continue?`
        );

        if (!shouldContinueSearch) {
          // Cancel the search and prevent content search from starting
          cancel();
          console.log("❌ Search cancelled");

          // Show name results if any
          if (finder.found.byName.length > 0) {
            formatResults(finder.found, options);
          }
        }
      }
    }
  });

  // Content search started handler
  finder.onContentSearchStarted(() => {
    console.log("\n🔍 Searching file contents...");
  });

  // Progress during content search
  finder.onSearchProgress((progress) => {
    const percentage = Math.round((progress.current / progress.total) * 100);
    const fileName = path.basename(progress.file);
    process.stdout.write(
      `\r🔎 Searching [${percentage}%]: ${
        fileName.length > 40 ? fileName.substring(0, 37) + "..." : fileName
      }`
    );
  });

  // Start the search
  await finder.search(searchRegex, searchDir);
}
