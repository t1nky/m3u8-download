import { deleteProgress } from "../lib/storage";

export async function streamSaveFile(
  db: IDBDatabase,
  url: string,
  filename: string,
  tempDir: FileSystemDirectoryHandle,
) {
  try {
    if (!("showSaveFilePicker" in window)) {
      throw new Error("showSaveFilePicker is not supported");
    }

    const fileHandle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: "Video File",
          accept: {
            "video/MP2T": [".ts"],
          },
        },
      ],
    });

    const writable = await fileHandle.createWritable();

    const entries = [];
    for await (const entry of tempDir.values()) {
      if (entry.kind === "file" && entry.name.startsWith("segment-")) {
        entries.push(entry);
      }
    }
    entries.sort((a, b) => {
      const matchA = a.name.match(/segment-(\d+)/);
      const matchB = b.name.match(/segment-(\d+)/);
      if (!matchA || !matchB) return 0;
      const indexA = Number.parseInt(matchA[1], 10);
      const indexB = Number.parseInt(matchB[1], 10);
      return indexA - indexB;
    });

    for (const entry of entries) {
      const file = await (entry as FileSystemFileHandle).getFile();
      await writable.write(file);

      await tempDir.removeEntry(entry.name);
    }

    await writable.close();

    const root = await navigator.storage.getDirectory();
    await root.removeEntry("temp", { recursive: true });
    deleteProgress(db, url);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return;
    }
    throw error;
  }
}
