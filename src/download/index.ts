import { deleteProgress, initStorage } from "../lib/storage";
import type { DownloadOptions } from "../types";
import { downloadSegments } from "./downloader";
import { streamSaveFile } from "./file";
import {
  fetchAndParsePlaylist,
  getHighestQualityVariant,
  getSegmentList,
  isMasterPlaylist,
} from "./playlist";

export async function createDownloader() {
  const db = await initStorage();
  const abortController = new AbortController();

  const download = async (url: string, options?: DownloadOptions) => {
    const masterPlaylist = await fetchAndParsePlaylist(url);

    if (!isMasterPlaylist(masterPlaylist)) {
      throw new Error("URL must point to a master playlist");
    }

    const variant = getHighestQualityVariant(masterPlaylist);

    if (!variant.uri) {
      throw new Error("Selected variant has no URI");
    }

    const segments = await getSegmentList(variant.uri);

    const tempDir = await downloadSegments(
      db,
      url,
      segments,
      abortController.signal,
      options,
    );

    return {
      url,
      tempDir,
      filename: `download_${Date.now()}.ts`,
    };
  };

  const save = async (
    url: string,
    tempDir: FileSystemDirectoryHandle,
    filename: string,
  ) => {
    await streamSaveFile(db, url, filename, tempDir);
    await deleteProgress(db, url);
  };

  const abort = () => {
    abortController.abort();
  };

  return {
    download,
    save,
    abort,
  };
}
