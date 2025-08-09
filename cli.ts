#!/usr/bin/env node

import { createFinder } from "./src/index";
import { parseArgs } from "node:util";
import { CliOptions } from "./src/types";
import { showHelp } from "./src/help";
import {
  parseFileTypes,
  parseExcludes,
  createSearchRegex,
} from "./src/parsers";
import { validateDirectory } from "./src/utils";
import { performSearch } from "./src/search-orchestrator";

async function main() {
  let finder;
  try {
    const { values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options: {
        "file-types": { type: "string", short: "t" },
        "name-only": { type: "boolean", short: "n" },
        "ignore-case": { type: "boolean", short: "i" },
        verbose: { type: "boolean", short: "v" },
        exclude: { type: "string", short: "e" },
        help: { type: "boolean", short: "h" },
      },
      allowPositionals: true,
    });

    const options: CliOptions = {
      fileTypes: values["file-types"],
      nameOnly: values["name-only"],
      ignoreCase: values["ignore-case"],
      verbose: values["verbose"],
      exclude: values["exclude"],
      help: values["help"],
    };

    if (options.help || positionals.length === 0) {
      showHelp();
      process.exit(options.help ? 0 : 1);
    }

    const [pattern, directory = process.cwd()] = positionals;
    const searchDir = await validateDirectory(directory);
    const excludes = parseExcludes(options.exclude);

    console.log(`🔍 Searching for: "${pattern}"`);
    console.log(`📂 Directory: ${searchDir}`);

    if (options.fileTypes) {
      console.log(`📋 File types: ${options.fileTypes}`);
    }

    if (excludes.length > 0) {
      console.log(`🚫 Excluding: ${excludes.join(", ")}`);
    }

    if (options.nameOnly) {
      console.log(`🏷️  Mode: Name only`);
    }

    const fileTypeRegex = parseFileTypes(options.fileTypes || "");
    finder = createFinder({
      excludeDirectories: excludes,
      fileTypeFilter: fileTypeRegex,
      nameOnly: options.nameOnly,
    });
    const searchRegex = createSearchRegex(pattern, options.ignoreCase || false);

    await performSearch(finder, searchRegex, searchDir, options);
  } catch (error) {
    console.error(
      `❌ Error: ${error instanceof Error ? error.message : error}`
    );
    process.exit(1);
  } finally {
    if (finder) {
      finder.removeAllListeners(); // Clean up event listeners
    }
  }
}

// Run the CLI
main().catch(console.error);
