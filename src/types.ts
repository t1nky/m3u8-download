export interface DownloadProgress {
  totalSegments: number;
  downloadedSegments: Set<number>;
  lastDownloadedIndex: number;
}

export interface SegmentInfo {
  index: number;
  url: string;
  duration: number;
}

export interface DownloadOptions {
  concurrency?: number;
  maxRetries?: number;
  onProgress?: (progress: number) => void;
}
