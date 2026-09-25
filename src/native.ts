import { scanBrowserSaveFiles } from "./browser-scan";

type NativeReply = {
  files?: Array<{ path: string; text: string; modified: number }>;
  folderName?: string;
  cancelled?: boolean;
  needsFolder?: boolean;
  warning?: string;
};

declare global {
  interface Window {
    webkit?: { messageHandlers?: { digDuck?: { postMessage: (body: Record<string, string>) => Promise<NativeReply> } } };
  }
}

const bridge = () => window.webkit?.messageHandlers?.digDuck;
export const isNativeApp = () => Boolean(bridge());

export async function scanNativeSaves(action: "choose" | "restore" | "rescan") {
  const handler = bridge();
  if (!handler) throw new Error("Please reopen Dig Duck.");
  const result = await handler.postMessage({ action });
  if (result.cancelled || result.needsFolder) return null;
  if (!result.files?.length) throw new Error("No saves found. Choose the Sneaky Sasquatch save folder.");
  const files = result.files.map(({ path, text, modified }) => {
    const file = new File([text], path.split("/").at(-1)!, { lastModified: modified });
    Object.defineProperty(file, "webkitRelativePath", { value: `Saves/${path}` });
    return file;
  });
  const scan = await scanBrowserSaveFiles(files);
  scan.saveRoot = result.folderName ?? "Sneaky Sasquatch saves";
  return { scan, warning: result.warning };
}

export async function forgetNativeFolder() {
  await bridge()?.postMessage({ action: "forget" });
}

export async function copyText(text: string) {
  if (isNativeApp()) await bridge()!.postMessage({ action: "copy", text });
  else await navigator.clipboard.writeText(text);
}
