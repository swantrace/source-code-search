import { spawn } from "node:child_process";
import { CliOptions, SearchResult } from "./types";

export function formatResults(found: SearchResult, options: CliOptions) {
  const { nameOnly, contentOnly, verbose } = options;
  let totalFiles = 0;
  let output = "";

  if (!contentOnly && found.byName.length > 0) {
    output += `\n📁 Files matching by name (${found.byName.length}):\n`;
    found.byName.forEach((file) => {
      output += `  📄 ${file}\n`;
    });
    totalFiles += found.byName.length;
  }

  if (!nameOnly && found.byContent.length > 0) {
    output += `\n📝 Files matching by content (${found.byContent.length}):\n`;
    found.byContent.forEach((file) => {
      output += `  📄 ${file}\n`;
    });
    totalFiles += found.byContent.length;
  }

  if (totalFiles === 0) {
    output += "\n❌ No matches found\n";
  } else {
    output += `\n✅ Total: ${totalFiles} files found\n`;
  }

  // If output is long, pipe to less for scrollable viewing
  if (output.split("\n").length > 40) {
    const less = spawn("less", [], {
      stdio: ["pipe", process.stdout, process.stderr],
    });
    less.stdin.on("error", (err: any) => {
      if (err.code !== "EPIPE") {
        console.error("Error writing to less:", err);
      }
      // Ignore EPIPE (user quit less early)
    });
    less.stdin.write(output);
    less.stdin.end();
  } else {
    process.stdout.write(output);
  }
}
