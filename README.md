# 🔍 Source Code Search CLI

A powerful, fast, and intelligent command-line tool for searching through source code files. Built with TypeScript and Node.js, it offers both filename and content searching with smart performance optimizations.

## ✨ Features

- **🚀 Fast Search**: Parallel file processing with configurable concurrency
- **🎯 Smart Filtering**: Built-in support for 130+ source code file types
- **📊 Progress Tracking**: Real-time progress updates and search time estimation
- **🔄 Flexible Search Modes**: Search by filename, content, or both
- **📝 Regex Support**: Full regular expression support with automatic detection
- **🚫 Smart Exclusions**: Automatically excludes common build/cache directories
- **💾 Memory Efficient**: Streaming file processing for large files
- **🎨 User-Friendly**: Interactive prompts for large searches with colorful output

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g source-code-search
```

### From Source

```bash
git clone https://github.com/swantrace/source-code-search.git
cd source-code-search
npm install
npm run build
npm link
```

### Quick Install Script

```bash
curl -sSL https://raw.githubusercontent.com/swantrace/source-code-search/main/install.sh | bash
```

## 🚀 Usage

### Basic Usage

```bash
# Search for "function" in current directory (source files only)
codesearch function

# Search in specific directory
codesearch useState ./src

# Search with file type filter
codesearch "class.*extends" --file-types js,ts
```

### Command Syntax

```
codesearch <pattern> [directory] [OPTIONS]
```

### Arguments

- **`pattern`**: Regular expression or string to search for
- **`directory`**: Directory to search in (defaults to current directory)

### Options

| Option           | Short | Description                                                    |
| ---------------- | ----- | -------------------------------------------------------------- |
| `--file-types`   | `-t`  | Comma-separated file extensions (`js,ts,py`) or `source`/`all` |
| `--name-only`    | `-n`  | Search only in file names                                      |
| `--content-only` | `-c`  | Search only in file content                                    |
| `--ignore-case`  | `-i`  | Case-insensitive search                                        |
| `--verbose`      | `-v`  | Show detailed output with full file paths                      |
| `--exclude`      | `-e`  | Comma-separated directories to exclude                         |
| `--help`         | `-h`  | Show help message                                              |

### Examples

```bash
# Basic content and filename search
codesearch function ./src

# Search only JavaScript/TypeScript files
codesearch useState --file-types js,ts

# Find files by name using regex
codesearch "\.tsx?$" --name-only

# Case-insensitive content search
codesearch "class.*extends" --ignore-case

# Search all file types (including docs, configs, etc.)
codesearch README --file-types all

# Custom exclusion patterns
codesearch config --exclude node_modules,dist,build

# Find specific filenames
codesearch Dockerfile --name-only

# Complex regex pattern (use quotes)
codesearch "import.*from.*['\"]\." --file-types ts,js
```

## 🏗️ Architecture

The project is structured as a modular TypeScript application:

```
src/
├── index.ts              # Main library exports
├── cli.ts                # Command-line interface
├── types.ts              # TypeScript interfaces
├── finder.ts             # Core search engine
├── file-collector.ts     # File system traversal
├── content-search.ts     # Content searching with streams
├── search-orchestrator.ts # Search coordination and progress
├── parsers.ts            # Input parsing and regex handling
├── output.ts             # Result formatting and display
├── input.ts              # User interaction
├── utils.ts              # Utility functions
├── help.ts               # Help text generation
└── constants.ts          # File extensions and exclusions
```

### Key Components

- **🔧 Finder Engine**: Event-driven search with parallel processing
- **📁 File Collector**: Efficient directory traversal with permission handling
- **🔍 Content Search**: Streaming-based content matching for large files
- **📊 Search Orchestrator**: Progress tracking and user interaction
- **⚙️ Smart Parsers**: Automatic regex detection and file type filtering

## 🎛️ File Type Support

### Built-in Categories

- **`source`** (default): 130+ programming language extensions
- **`all`**: All file types including documentation and configuration files
- **Custom**: Specify exact extensions like `js,ts,py,go`

### Supported Languages

Ada, Assembly, Astro, Bash, C/C++, C#, Clojure, Crystal, CSS, Dart, Dockerfile, Elixir, Elm, Erlang, F#, Fortran, Go, GraphQL, Groovy, Haskell, HTML, Java, JavaScript, JSON, Julia, Kotlin, Lua, Markdown, MATLAB, Nim, Pascal, Perl, PHP, Python, R, Ruby, Rust, Scala, Shell scripts, SQL, Swift, TypeScript, YAML, Zig, and many more.

## ⚡ Performance Features

- **Parallel Processing**: Configurable concurrency (default: 20 files simultaneously)
- **Smart File Categorization**: Different processing strategies for small/large/binary files
- **Stream Processing**: Memory-efficient handling of large files
- **Progress Estimation**: Intelligent time estimation based on file types and sizes
- **Permission Handling**: Graceful handling of access-denied errors

## 🚫 Default Exclusions

Automatically excludes common directories:

- `node_modules`, `dist`, `build`, `target`
- `.git`, `.svn`, `.hg`
- `.cache`, `.tmp`, `temp`
- IDE directories (`.vscode`, `.idea`)
- Language-specific build dirs (`.cargo`, `.gradle`, `__pycache__`)
- And 50+ more common patterns

## 🔧 API Usage

You can also use this as a library in your Node.js projects:

```typescript
import {
  createFinder,
  parseFileTypes,
  createSearchRegex,
} from "source-code-search";

const finder = createFinder({
  excludeDirectories: ["node_modules", "dist"],
  fileTypeFilter: parseFileTypes("js,ts"),
});

const regex = createSearchRegex("useState", false);

finder.onFound((result) => {
  console.log("Name matches:", result.byName);
  console.log("Content matches:", result.byContent);
});

finder.searchContent(regex, "./src");
```

## 🛠️ Development

### Prerequisites

- Node.js 16+
- TypeScript 5+

### Setup

```bash
git clone <repository>
cd source-code-search
npm install
```

### Scripts

```bash
npm run build        # Compile TypeScript
npm run dev          # Watch mode compilation
npm run cli          # Build and run CLI
npm run clean        # Remove dist directory
```

### Project Structure

- **TypeScript**: Strict mode with ES2022 target
- **CommonJS**: For Node.js compatibility
- **Event-Driven**: Asynchronous architecture with EventEmitter
- **Stream-Based**: Memory-efficient file processing

## 📊 Performance Benchmarks

The tool includes intelligent performance estimation:

- **Small text files**: ~150 files/second
- **Large text files**: ~10 MB/second
- **Binary files**: ~50 MB/second (often skipped)
- **Parallel processing**: Up to 20x speedup on multi-core systems

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- **CLI Commands**: Both `codesearch` and `cs` shortcuts available
- **TypeScript**: Full type safety with exported interfaces
- **Node.js**: Built with modern Node.js built-in modules
- **Cross-Platform**: Works on Linux, macOS, and Windows

---

**Happy Searching! 🔍✨**
