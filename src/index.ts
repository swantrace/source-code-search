// Main library entry point - exports the public API
export { createFinder } from "./finder";
export * from "./types";

// Utility functions that might be useful for library consumers
export { formatFileSize, estimateSearchTime } from "./utils";
export { parseFileTypes, createSearchRegex } from "./parsers";
