import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";

export async function checkContentWithStream(
  filePath: string,
  regex: RegExp
): Promise<boolean> {
  try {
    // For small files, read directly for better performance
    const stats = await stat(filePath);
    const fileSize = stats.size;

    // Use direct read for files smaller than 100KB
    if (fileSize < 100 * 1024) {
      try {
        const content = await readFile(filePath, "utf-8");
        return regex.test(content);
      } catch (readError: any) {
        if (readError.code === "EACCES" || readError.code === "EPERM") {
          return false;
        }
        throw readError;
      }
    }

    // Use streaming for larger files
    return checkLargeFileWithStream(filePath, regex);
  } catch (statError: any) {
    if (statError.code === "EACCES" || statError.code === "EPERM") {
      return false;
    }
    // If we can't stat the file, try streaming anyway
    return checkLargeFileWithStream(filePath, regex);
  }
}

function checkLargeFileWithStream(
  filePath: string,
  regex: RegExp
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, {
      encoding: "utf-8",
      highWaterMark: 64 * 1024, // 64KB chunks for better performance
    });
    let buffer = "";
    let found = false;

    stream.on("data", (chunk: string | Buffer) => {
      if (found) return; // Already found, no need to continue processing

      const chunkStr = chunk.toString("utf-8");
      buffer += chunkStr;

      // Test the current buffer
      if (regex.test(buffer)) {
        found = true;
        stream.destroy(); // Stop reading the file
        resolve(true);
        return;
      }

      // Optimized buffer management
      const maxBufferSize = 2 * 1024 * 1024; // 2MB buffer for larger files
      if (buffer.length > maxBufferSize) {
        // Keep more characters for complex patterns that might span chunks
        const keepSize = Math.min(5000, buffer.length / 2);
        buffer = buffer.slice(-keepSize);
      }
    });

    stream.on("end", () => {
      if (!found) {
        resolve(false);
      }
    });

    stream.on("error", (error: NodeJS.ErrnoException) => {
      // Skip permission denied errors silently
      if (error.code === "EACCES" || error.code === "EPERM") {
        resolve(false);
        return;
      }
      reject(error);
    });
  });
}
