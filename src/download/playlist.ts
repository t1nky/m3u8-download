import { parse } from "hls-parser";
import type {
  Playlist,
  MasterPlaylist,
  Variant,
  MediaPlaylist,
} from "hls-parser/types";
import type { SegmentInfo } from "../types";

export function isMasterPlaylist(parsed: Playlist): parsed is MasterPlaylist {
  return parsed.isMasterPlaylist;
}

export function isMediaPlaylist(parsed: Playlist): parsed is MediaPlaylist {
  return !parsed.isMasterPlaylist;
}

export async function fetchAndParsePlaylist(url: string): Promise<Playlist> {
  const response = await fetch(url);
  const text = await response.text();
  return parse(text);
}

export function getHighestQualityVariant(playlist: MasterPlaylist): Variant {
  if (playlist.variants.length === 0) {
    throw new Error("No variants found in playlist");
  }

  return playlist.variants.reduce((prev, current) => {
    return (prev.resolution?.width ?? -1) > (current.resolution?.width ?? -1)
      ? prev
      : current;
  }, playlist.variants[0]);
}

export async function getSegmentList(
  playlistUrl: string,
): Promise<SegmentInfo[]> {
  const playlist = await fetchAndParsePlaylist(playlistUrl);

  if (!isMediaPlaylist(playlist)) {
    throw new Error("Expected media playlist, got master playlist");
  }

  return playlist.segments.map((segment, index) => ({
    index,
    url: segment.uri,
    duration: segment.duration,
  }));
}
