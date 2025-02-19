import { createSignal, Show, splitProps, type ComponentProps } from "solid-js";
import { cn } from "../lib/utils";
import { createDownloader } from "../download";
import { createTween } from "@solid-primitives/tween";

function Button(props: ComponentProps<"button">) {
  const [, rest] = splitProps(props, ["children", "class"]);

  return (
    <button
      type="button"
      class={cn(
        "rounded-lg px-4 py-2 text-sm font-medium transition-colors bg-indigo-500 text-white hover:bg-indigo-600 disabled:hover:bg-indigo-500",
        props.class,
      )}
      {...rest}
    >
      {props.children}
    </button>
  );
}

function Input(props: ComponentProps<"input"> & { error?: string }) {
  const [, rest] = splitProps(props, ["class", "error"]);

  return (
    <div>
      <div class="relative">
        <input
          type="text"
          class={cn(
            "w-full rounded-lg border-0 px-4 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm",
            props.class,
            {
              "pr-10 ring-red-300 focus:ring-red-500": !!props.error,
            },
          )}
          {...rest}
        />
        {props.error && (
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              class="size-5 text-red-500"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
      {props.error && (
        <p class="mt-2 text-sm text-red-600" id="error-message">
          {props.error}
        </p>
      )}
    </div>
  );
}

export function PageDownloader() {
  const [url, setUrl] = createSignal("");
  const [isDownloading, setIsDownloading] = createSignal(false);
  const [downloadData, setDownloadData] = createSignal<{
    tempDir: FileSystemDirectoryHandle;
    filename: string;
    url: string;
  } | null>(null);
  const [progress, setProgress] = createSignal(0);

  const springedProgress = createTween(progress, {
    duration: 200,
  });

  let downloader: Awaited<ReturnType<typeof createDownloader>>;

  const startDownload = async () => {
    downloader = await createDownloader();

    setIsDownloading(true);
    setDownloadData(null);
    try {
      const result = await downloader.download(url(), {
        onProgress: (progress) => setProgress(progress),
      });

      setDownloadData(result);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const saveFile = async () => {
    const data = downloadData();
    if (!data) return;

    try {
      await downloader.save(data.url, data.tempDir, data.filename);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Save failed:", error);
    }
  };

  return (
    <div class="mx-auto max-w-2xl space-y-4 p-6">
      <h1 class="text-2xl font-semibold text-gray-900 mb-6">M3U8 Downloader</h1>
      <div class="space-y-4">
        <Input
          type="text"
          value={url()}
          onInput={(e) => setUrl(e.currentTarget.value)}
          placeholder="Enter M3U8 URL"
          disabled={isDownloading()}
        />
        <div class="flex gap-3">
          <Button
            onClick={() => startDownload()}
            disabled={!url() || isDownloading()}
            class={"flex-1"}
            style={
              isDownloading()
                ? {
                    background:
                      `linear-gradient(90deg, var(--color-indigo-700) 0%, var(--color-indigo-700) ${springedProgress() * 100 - 1}%, ` +
                      `var(--color-indigo-600) ${springedProgress() * 100 - 0.5}%, var(--color-indigo-500) ${springedProgress() * 100}%, var(--color-indigo-500) 100%)`,
                  }
                : undefined
            }
          >
            <Show when={isDownloading()} fallback="Download">
              <div class="flex items-center justify-center gap-2">
                <span>Downloading</span>
                <span>{Math.round(progress() * 100)}%</span>
              </div>
            </Show>
          </Button>
          <Show when={isDownloading()}>
            <Button
              onClick={() => downloader?.abort()}
              class="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              Abort
            </Button>
          </Show>
          <Show when={downloadData()}>
            <Button onClick={saveFile} class="flex-1">
              Save File
            </Button>
          </Show>
        </div>
      </div>
    </div>
  );
}
