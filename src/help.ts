import { DEFAULT_EXCLUDES } from "./constants";

export function showHelp() {
  console.log(`
🔍 Source Code Search CLI

USAGE:
  codesearch <pattern> [directory] [OPTIONS]
  
ARGUMENTS:
  pattern     Regular expression or string to search for
  directory   Directory to search in (defaults to current directory)

OPTIONS:
  --file-types, -t    Comma-separated list of file extensions (e.g., "js,ts,py")
                      Use "source" for common source code files (default)
                      Use "all" to search all file types
                      (default: source files only)
  --name-only, -n     Search only in file names, skip content search
                      (default: false - search both names and content)
  --ignore-case, -i   Case-insensitive search
                      (default: false - case sensitive)
  --verbose, -v       Show detailed output with full file paths
                      (default: false - show relative paths only)
  --exclude, -e       Comma-separated list of directories to exclude
                      (default: ${DEFAULT_EXCLUDES.join(", ")})
  --help, -h          Show this help message

EXAMPLES:
  codesearch function ./src                      # Search for "function" in ./src (source files only)
  codesearch useState --file-types js,ts        # Search in JS/TS files only
  codesearch "\.tsx?$" --name-only              # Find TypeScript files by name (regex needs quotes)
  codesearch "class.*extends" --ignore-case     # Case-insensitive content search (regex needs quotes)
  codesearch TODO --file-types source           # Search in all source code files (explicit)
  codesearch README --file-types all            # Search in all file types including docs
  codesearch main /home/user/projects           # Search in specific directory  
  codesearch config --exclude node_modules,dist # Custom exclude patterns
  codesearch Dockerfile --name-only             # Find Dockerfile by exact name
`);
}
