import { getProgress, saveProgress } from "../lib/storage";
import type { SegmentInfo, DownloadOptions } from "../types";

async function downloadSegment(
  url: string,
  abortSignal: AbortSignal,
  retryCount = 0,
  maxRetries = 3,
): Promise<ArrayBuffer> {
  try {
    const response = await fetch(url, { signal: abortSignal });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    if (retryCount < maxRetries) {
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * 2 ** retryCount),
      );
      return downloadSegment(url, abortSignal, retryCount + 1, maxRetries);
    }
    throw error;
  }
}

export async function downloadSegments(
  db: IDBDatabase,
  playlistUrl: string,
  segments: SegmentInfo[],
  abortSignal: AbortSignal,
  options: DownloadOptions = {},
) {
  const { concurrency = 3, maxRetries = 3, onProgress } = options;

  const root = await navigator.storage.getDirectory();
  const tempDir = await root.getDirectoryHandle("temp", { create: true });

  const progress = (await getProgress(db, playlistUrl)) || {
    totalSegments: segments.length,
    downloadedSegments: new Set<number>(),
    lastDownloadedIndex: -1,
  };

  const remainingSegments = segments.filter(
    (segment) => !progress.downloadedSegments.has(segment.index),
  );

  let downloadedCount = progress.downloadedSegments.size;

  const downloadWorker = async () => {
    while (remainingSegments.length > 0) {
      const segment = remainingSegments.shift();
      if (!segment) break;

      try {
        const buffer = await downloadSegment(
          segment.url,
          abortSignal,
          0,
          maxRetries,
        );

        const segmentHandle = await tempDir.getFileHandle(
          `segment-${segment.index}.ts`,
          { create: true },
        );
        const writable = await segmentHandle.createWritable();
        await writable.write(buffer);
        await writable.close();

        progress.downloadedSegments.add(segment.index);
        progress.lastDownloadedIndex = Math.max(
          progress.lastDownloadedIndex,
          segment.index,
        );

        downloadedCount++;
        onProgress?.(downloadedCount / segments.length);

        await saveProgress(db, playlistUrl, progress);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw error;
        }
        remainingSegments.unshift(segment);
        throw error;
      }
    }
  };

  await Promise.all(
    Array.from({ length: concurrency }, () => downloadWorker()),
  );

  return tempDir;
}
