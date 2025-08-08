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

  // Set up found handler for name-only mode
  finder.onFound((found) => {
    console.log(""); // Clear progress line
    formatResults(found, options);
  });

  // Start initial search (collection + name matching)
  const collectedFiles = await finder.search(searchRegex, searchDir);

  // If name-only mode, the search completed with results already shown
  if (options.nameOnly) {
    return;
  }

  // If no collectedFiles, something went wrong
  if (!collectedFiles) {
    console.log("\n❌ Search completed but no result returned");
    return;
  }

  console.log(`\n\n📊 Discovery complete:`);
  console.log(`   • Total files: ${collectedFiles.length}`);
  console.log(
    `   • Total size: ${formatFileSize(
      collectedFiles.reduce((sum, f) => sum + f.size, 0)
    )}`
  );

  if (finder.found.byName.length > 0) {
    console.log(`   • Name matches: ${finder.found.byName.length}`);
  }

  if (collectedFiles.length > 0) {
    console.log(`   • Files to search for content: ${collectedFiles.length}`);
    const totalSizeToSearch = collectedFiles.reduce(
      (sum, f) => sum + f.size,
      0
    );
    // Use advanced estimation with file details for better accuracy
    console.log(
      `   • Estimated time: ${estimateSearchTime(
        collectedFiles.map((f) => ({ size: f.size, path: f.path })),
        20
      )}`
    );

    if (collectedFiles.length > 100 || totalSizeToSearch > 50 * 1024 * 1024) {
      // 50MB
      const shouldContinue = await askUserConfirmation(
        `This will search ${collectedFiles.length} files for content. Continue?`
      );
      if (!shouldContinue) {
        console.log("❌ Search cancelled");
        // Show name results if any
        if (finder.found.byName.length > 0) {
          formatResults(finder.found, options);
        }
        return;
      }
    }

    console.log("\n🔍 Searching file contents...");

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

    // Continue with content search
    await finder.searchContent(searchRegex, collectedFiles);
  } else {
    // No files to search for content, show results immediately
    formatResults(finder.found, options);
  }
}
