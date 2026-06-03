const SON_MEME_PROMPT =
  'Transform this photo into an "Are ya winning, son?" meme profile picture. ' +
  "Show the person as the son at a computer in a dim bedroom, classic internet meme style, " +
  "warm monitor glow on their face, dad silhouette optional in the doorway, " +
  "square composition suitable for a social media PFP. Keep the person's face recognizable.";

const PUTER_SCRIPT = "https://js.puter.com/v2/";
const AI_MODEL = "gemini-2.5-flash-image-preview";

let puterLoadPromise = null;

function loadPuter() {
  if (typeof window !== "undefined" && window.puter) {
    return Promise.resolve(window.puter);
  }

  if (!puterLoadPromise) {
    puterLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${PUTER_SCRIPT}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(window.puter));
        existing.addEventListener("error", () =>
          reject(new Error("Failed to load AI service."))
        );
        return;
      }

      const script = document.createElement("script");
      script.src = PUTER_SCRIPT;
      script.async = true;
      script.onload = () => {
        if (window.puter) {
          resolve(window.puter);
        } else {
          reject(new Error("AI service loaded but is unavailable."));
        }
      };
      script.onerror = () => reject(new Error("Failed to load AI service."));
      document.head.appendChild(script);
    });
  }

  return puterLoadPromise;
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("Could not read image."));
        return;
      }
      const comma = dataUrl.indexOf(",");
      resolve({
        base64: comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl,
        mimeType: file.type || "image/jpeg",
      });
    };
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

export async function generateSonMemePfp(file, { onProgress } = {}) {
  onProgress?.("Loading AI…");
  const puter = await loadPuter();

  onProgress?.("Preparing your image…");
  const { base64, mimeType } = await fileToBase64(file);

  onProgress?.("Generating Son meme PFP…");
  const imageEl = await puter.ai.txt2img(SON_MEME_PROMPT, {
    model: AI_MODEL,
    input_image: base64,
    input_image_mime_type: mimeType,
  });

  if (!imageEl?.src) {
    throw new Error("AI did not return an image. Please try again.");
  }

  return imageEl.src;
}
