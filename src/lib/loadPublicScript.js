const scriptPromiseCache = new Map();

function ensureBrowser() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Script loader is only available in browser");
  }
}

export function loadPublicScript(src) {
  ensureBrowser();

  const cached = scriptPromiseCache.get(src);
  if (cached) return cached;

  const promise = new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${src}"]`);

    const cleanup = () => {
      script?.removeEventListener("load", handleLoad);
      script?.removeEventListener("error", handleError);
    };

    const handleLoad = () => {
      if (script) {
        script.dataset.loadState = "loaded";
      }
      cleanup();
      resolve();
    };

    const handleError = (event) => {
      if (script) {
        script.dataset.loadState = "error";
      }
      cleanup();
      reject(new Error(`Failed to load script: ${src}`));
    };

    if (script?.dataset.loadState === "loaded") {
      resolve();
      return;
    }

    if (script && (script.readyState === "loaded" || script.readyState === "complete")) {
      script.dataset.loadState = "loaded";
      resolve();
      return;
    }

    if (!script) {
      script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.loadState = "loading";
      document.head.appendChild(script);
    }

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
  }).catch((error) => {
    scriptPromiseCache.delete(src);
    throw error;
  });

  scriptPromiseCache.set(src, promise);
  return promise;
}
