import { useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Image as KImage,
  Text as KText,
  Transformer,
} from "react-konva";
import {
  FaTrash,
  FaArrowLeft,
  FaDownload,
  FaPlus,
  FaMinus,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";

import hat from "./hatf.png";
import cigerate from "./one.png";
import cigerates from "./two.png";
import headphones from "./three.png";
import glasses from "./glasses.png";
import dad from "./dad.png";
import faceNormal from "../faces/normal.jpeg";
import faceHappy from "../faces/happy.png";
import faceAngry from "../faces/angry.png";
import faceSad from "../faces/sad.png";
import faceFear from "../faces/fear.png";
import faceRomantic from "../faces/romantic.png";
import styleLambo from "../styles/lambo.png";
import stylePc from "../styles/pc.png";
import styleRide from "../styles/ride.png";

const FACE_GALLERY = [
  { id: "normal", label: "Normal", src: faceNormal },
  { id: "happy", label: "Happy", src: faceHappy },
  { id: "angry", label: "Angry", src: faceAngry },
  { id: "sad", label: "Sad", src: faceSad },
  { id: "fear", label: "Fear", src: faceFear },
  { id: "romantic", label: "Romantic", src: faceRomantic },
];

const STYLE_GALLERY = [
  { id: "lambo", label: "Lambo", src: styleLambo },
  { id: "pc", label: "PC", src: stylePc },
  { id: "ride", label: "Ride", src: styleRide },
];

function reorderLayer(items, id, position) {
  const idx = items.findIndex((x) => x.id === id);
  if (idx === -1) return items;
  const item = items[idx];
  const rest = items.filter((x) => x.id !== id);
  if (position === "front") return [...rest, item];
  if (position === "back") return [item, ...rest];
  return items;
}

/* ---------- helpers ---------- */
function useHtmlImage(src) {
  const [img, setImg] = useState(null);
  useEffect(() => {
    if (!src) return setImg(null);
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => setImg(image);
    image.src = src;
    return () => setImg(null);
  }, [src]);
  return img;
}

const SAMPLE_STICKERS = [
  { id: "hat", label: "Hat", src: hat },
  { id: "cigerate-one", label: "Cigarette", src: cigerate },
  { id: "cigerate-two", label: "Cigarette", src: cigerates },
  { id: "glasses", label: "Glasses", src: glasses },
  { id: "headphones", label: "headphones", src: headphones },
  { id: "dad", label: "Dad", src: dad },
];

/* ---------- Sticker Component ---------- */
function Sticker({ node, selected, onSelect, onChange }) {
  const ref = useRef(null);
  const tr = useRef(null);
  const img = useHtmlImage(node.src);

  useEffect(() => {
    if (selected && tr.current && ref.current) {
      tr.current.nodes([ref.current]);
      tr.current.getLayer().batchDraw();
    }
  }, [selected]);

  return (
    <>
      <KImage
        ref={ref}
        image={img}
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rotation={node.r}
        crop={
          node.cropW
            ? {
                x: node.cropX,
                y: node.cropY,
                width: node.cropW,
                height: node.cropH,
              }
            : undefined
        }
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) =>
          onChange({ ...node, x: e.target.x(), y: e.target.y() })
        }
        onTransformEnd={() => {
          const n = ref.current;
          const scaleX = n.scaleX();
          const scaleY = n.scaleY();
          n.scaleX(1);
          n.scaleY(1);
          onChange({
            ...node,
            x: n.x(),
            y: n.y(),
            r: n.rotation(),
            w: Math.max(20, n.width() * scaleX),
            h: Math.max(20, n.height() * scaleY),
          });
        }}
      />
      {selected && (
        <Transformer
          ref={tr}
          rotateEnabled
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "middle-left",
            "middle-right",
            "top-center",
            "bottom-center",
          ]}
          boundBoxFunc={(oldB, newB) => {
            if (newB.width < 20 || newB.height < 20) return oldB;
            return newB;
          }}
        />
      )}
    </>
  );
}

/* ---------- Text Component ---------- */
function EditableText({ node, selected, onSelect, onChange }) {
  const ref = useRef(null);
  const tr = useRef(null);

  useEffect(() => {
    if (selected && tr.current && ref.current) {
      tr.current.nodes([ref.current]);
      tr.current.getLayer().batchDraw();
    }
  }, [selected]);

  return (
    <>
      <KText
        ref={ref}
        x={node.x}
        y={node.y}
        text={node.text}
        fontSize={node.fontSize}
        fontFamily="Impact, Arial Black, sans-serif"
        fill="#fff"
        stroke="#000"
        strokeWidth={2}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) =>
          onChange({ ...node, x: e.target.x(), y: e.target.y() })
        }
        onTransformEnd={() => {
          const n = ref.current;
          const scale = Math.max(n.scaleX(), n.scaleY());
          n.scaleX(1);
          n.scaleY(1);
          onChange({
            ...node,
            x: n.x(),
            y: n.y(),
            fontSize: Math.max(10, n.fontSize() * scale),
          });
        }}
      />
      {selected && (
        <Transformer
          ref={tr}
          rotateEnabled={false}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "middle-left",
            "middle-right",
          ]}
          boundBoxFunc={(oldB, newB) => {
            if (newB.width < 20 || newB.height < 20) return oldB;
            return newB;
          }}
        />
      )}
    </>
  );
}

/* ---------- Main Editor ---------- */
export default function Editor({ image, onBack, initialFaceSrc = null, allowBackgroundDownload = true }) {
  const stageRef = useRef(null);
  const wrapRef = useRef(null);
  const initialFacePlaced = useRef(false);
  const [size, setSize] = useState(500);
  const bgImg = useHtmlImage(image);

  const [stickers, setStickers] = useState([]);
  const [texts, setTexts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [textInput1, setTextInput1] = useState("");
  const [textInput2, setTextInput2] = useState("");
  const [stickersOpen, setStickersOpen] = useState(true);
  const [facesOpen, setFacesOpen] = useState(false);
  const [stylesOpen, setStylesOpen] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop) {
        setSize(500);
        return;
      }
      const styles = getComputedStyle(el);
      const padX =
        parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
      const borderX =
        parseFloat(styles.borderLeftWidth) + parseFloat(styles.borderRightWidth);
      const available = el.clientWidth - padX - borderX;
      const s = Math.max(260, Math.min(500, Math.floor(available)));
      setSize(s);
    };

    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    initialFacePlaced.current = false;
    setStickers([]);
    setTexts([]);
    setSelectedId(null);
  }, [image, initialFaceSrc]);

  useEffect(() => {
    if (!initialFaceSrc || !size || initialFacePlaced.current) return;

    const faceImg = new window.Image();
    faceImg.onload = () => {
      const maxDim = size * 0.82;
      const aspect = faceImg.width / faceImg.height || 1;
      const w = aspect >= 1 ? maxDim : maxDim * aspect;
      const h = aspect >= 1 ? maxDim / aspect : maxDim;

      const id = crypto.randomUUID();
      setStickers([
        {
          id,
          src: initialFaceSrc,
          x: (size - w) / 2,
          y: (size - h) / 2,
          w,
          h,
          r: 0,
        },
      ]);
      setSelectedId(id);
      initialFacePlaced.current = true;
    };
    faceImg.src = initialFaceSrc;
  }, [initialFaceSrc, size]);

  const deselect = (e) => {
    if (e.target === e.target.getStage()) setSelectedId(null);
  };

  const addStickerFromSrc = (src) => {
    const base = size * 0.3;
    setStickers((arr) => [
      ...arr,
      {
        id: crypto.randomUUID(),
        src,
        x: size / 2 - base / 2,
        y: size / 2 - base / 2,
        w: base,
        h: base,
        r: 0,
      },
    ]);
  };

  const addFaceFromGallery = (faceItem) => {
    addStickerFromSrc(faceItem.src);
  };

  const addStyleFromGallery = (styleItem) => {
    const base = size * 0.85;
    setStickers((arr) => [
      ...arr,
      {
        id: crypto.randomUUID(),
        src: styleItem.src,
        x: size / 2 - base / 2,
        y: size / 2 - base / 2,
        w: base,
        h: base,
        r: 0,
      },
    ]);
  };

  const addText = (text) => {
    if (!text) return;
    const baseFont = 30;
    setTexts((arr) => [
      ...arr,
      {
        id: crypto.randomUUID(),
        text,
        x: size / 4,
        y: size / 4,
        fontSize: baseFont,
      },
    ]);
  };

  const deleteNode = () => {
    setStickers((arr) => arr.filter((x) => x.id !== selectedId));
    setTexts((arr) => arr.filter((x) => x.id !== selectedId));
    setSelectedId(null);
  };

  const selectedStickerIndex = stickers.findIndex((s) => s.id === selectedId);
  const selectedTextIndex = texts.findIndex((t) => t.id === selectedId);
  const hasLayerSelection = selectedStickerIndex !== -1 || selectedTextIndex !== -1;

  const moveSelectedLayer = (position) => {
    if (selectedStickerIndex !== -1) {
      setStickers((arr) => reorderLayer(arr, selectedId, position));
    } else if (selectedTextIndex !== -1) {
      setTexts((arr) => reorderLayer(arr, selectedId, position));
    }
  };

  const canSendLayerBack =
    selectedStickerIndex > 0 || selectedTextIndex > 0;
  const canBringLayerFront =
    (selectedStickerIndex !== -1 && selectedStickerIndex < stickers.length - 1) ||
    (selectedTextIndex !== -1 && selectedTextIndex < texts.length - 1);

  const renderBackgroundImage = () => {
    if (!bgImg || !bgImg.width || !bgImg.height) return null;
    const imgW = bgImg.width;
    const imgH = bgImg.height;
    const scale = Math.min(size / imgW, size / imgH);
    const newW = imgW * scale;
    const newH = imgH * scale;
    const x = (size - newW) / 2;
    const y = (size - newH) / 2;
    return (
      <KImage
        image={bgImg}
        x={x}
        y={y}
        width={newW}
        height={newH}
        listening={false}
      />
    );
  };

  const canDownload =
    stickers.length > 0 || texts.length > 0 || allowBackgroundDownload;

  /* ---------- Download Function ---------- */
  const download = () => {
    if (!bgImg || !canDownload) return;
    setSelectedId(null);
    setTimeout(() => {
      const pixelRatio = 2;
      const barHeight = 40;
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = size * pixelRatio;
      tmpCanvas.height = (size + barHeight) * pixelRatio;
      const ctx = tmpCanvas.getContext("2d");

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);

      const imgW = bgImg.width;
      const imgH = bgImg.height;
      const scale = Math.min(size / imgW, size / imgH) * pixelRatio;
      const newW = imgW * scale;
      const newH = imgH * scale;
      const x = (size * pixelRatio - newW) / 2;
      const y = (size * pixelRatio - newH) / 2;
      ctx.drawImage(bgImg, x, y, newW, newH);

      const drawSticker = (s) =>
        new Promise((resolve) => {
          const stickerImg = new Image();
          stickerImg.crossOrigin = "anonymous";
          stickerImg.src = s.src;
          stickerImg.onload = () => {
            ctx.save();
            ctx.translate((s.x + s.w / 2) * pixelRatio, (s.y + s.h / 2) * pixelRatio);
            ctx.rotate((s.r * Math.PI) / 180);
            ctx.drawImage(
              stickerImg,
              s.cropX ?? 0,
              s.cropY ?? 0,
              s.cropW ?? stickerImg.width,
              s.cropH ?? stickerImg.height,
              (-s.w / 2) * pixelRatio,
              (-s.h / 2) * pixelRatio,
              s.w * pixelRatio,
              s.h * pixelRatio
            );
            ctx.restore();
            resolve();
          };
        });

      const drawText = (t) => {
        ctx.save();
        ctx.font = `${t.fontSize * pixelRatio}px Impact, Arial Black, sans-serif`;
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2 * pixelRatio;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.strokeText(t.text, t.x * pixelRatio, t.y * pixelRatio);
        ctx.fillText(t.text, t.x * pixelRatio, t.y * pixelRatio);
        ctx.restore();
      };

      const allPromises = stickers.map(drawSticker);
      Promise.all(allPromises).then(() => {
        texts.forEach(drawText);

        // Bottom bar
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, size * pixelRatio, tmpCanvas.width, barHeight * pixelRatio);
        ctx.fillStyle = "#000";
        ctx.font = `${16 * pixelRatio}px "Comic Sans MS", cursive, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "SON PFP GENERATOR",
          tmpCanvas.width / 2,
          size * pixelRatio + (barHeight / 2) * pixelRatio
        );

        const url = tmpCanvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = "pfp.png";
        a.click();
      });
    }, 100);
  };

  return (
    <div className="editorApp">
      <aside className="side side--left">
        {hasLayerSelection ? (
          <div className="editor-layer-controls">
            <span className="label">Layer order</span>
            <p className="editor-layer-hint">
              Tap an item on the canvas, then move it in front of or behind others.
            </p>
            <div className="editor-layer-btns">
              <button
                type="button"
                className="btn secondary editor-layer-btn"
                onClick={() => moveSelectedLayer("back")}
                disabled={!canSendLayerBack}
                title="Place behind other stickers / text"
              >
                <FaArrowDown aria-hidden />
                <span>Send to back</span>
              </button>
              <button
                type="button"
                className="btn secondary editor-layer-btn"
                onClick={() => moveSelectedLayer("front")}
                disabled={!canBringLayerFront}
                title="Place on top of other stickers / text"
              >
                <FaArrowUp aria-hidden />
                <span>Bring to front</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="editor-layer-hint editor-layer-hint--idle">
            Select a sticker or text on the canvas to change layer order.
          </p>
        )}

        <div className="editor-text-panel">
          <div className="label">Add Text</div>
          <input
            type="text"
            placeholder="Enter text 1"
            value={textInput1}
            onChange={(e) => setTextInput1(e.target.value)}
          />
          <button
            type="button"
            className="btn primary editor-text-btn"
            onClick={() => {
              addText(textInput1);
              setTextInput1("");
            }}
          >
            Add Text 1
          </button>

          <input
            type="text"
            placeholder="Enter text 2"
            value={textInput2}
            onChange={(e) => setTextInput2(e.target.value)}
          />
          <button
            type="button"
            className="btn primary editor-text-btn"
            onClick={() => {
              addText(textInput2);
              setTextInput2("");
            }}
          >
            Add Text 2
          </button>
        </div>
      </aside>

      <div className="canvasWrap" ref={wrapRef}>
        <Stage
          ref={stageRef}
          width={size}
          height={size}
          onMouseDown={deselect}
          onTouchStart={deselect}
          className="stage"
        >
          <Layer>
            {renderBackgroundImage()}

            {stickers.map((s) => (
              <Sticker
                key={s.id}
                node={s}
                selected={s.id === selectedId}
                onSelect={() => setSelectedId(s.id)}
                onChange={(n) =>
                  setStickers((arr) => arr.map((x) => (x.id === s.id ? n : x)))
                }
              />
            ))}

            {texts.map((t) => (
              <EditableText
                key={t.id}
                node={t}
                selected={t.id === selectedId}
                onSelect={() => setSelectedId(t.id)}
                onChange={(n) =>
                  setTexts((arr) => arr.map((x) => (x.id === t.id ? n : x)))
                }
              />
            ))}
          </Layer>
        </Stage>

        {selectedId && (
          <button className="floatingDelete" onClick={deleteNode}>
            <FaTrash />
          </button>
        )}
      </div>

      <aside className="side side--right">
        <div className="editor-toolbar">
          <button type="button" className="btn secondary" onClick={onBack}>
            <FaArrowLeft /> Back
          </button>

          <button
            type="button"
            className={`btn primary${canDownload ? "" : " btn--disabled"}`}
            onClick={download}
            disabled={!canDownload}
            title={
              canDownload
                ? "Download your PFP"
                : "Add a face, sticker, or text before downloading"
            }
          >
            <FaDownload /> Download
          </button>
        </div>

        <div className="editor-galleries">
        <div className="editor-section">
          <div className="editor-section-header">
            <span className="label editor-section-title">Sticker Gallery</span>
            <button
              type="button"
              className="btn collapse-btn"
              onClick={() => {
                setStickersOpen((open) => {
                  const next = !open;
                  if (next) {
                    setFacesOpen(false);
                    setStylesOpen(false);
                  }
                  return next;
                });
              }}
              aria-expanded={stickersOpen}
              aria-controls="sticker-gallery-grid"
              aria-label={stickersOpen ? "Collapse sticker gallery" : "Expand sticker gallery"}
            >
              {stickersOpen ? <FaMinus /> : <FaPlus />}
            </button>
          </div>
          {stickersOpen && (
            <div className="grid" id="sticker-gallery-grid">
              {SAMPLE_STICKERS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="card"
                  title={s.label}
                  onClick={() => addStickerFromSrc(s.src)}
                >
                  <img src={s.src} alt={s.label} />
                  <div className="caption">{s.label}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="editor-section">
          <div className="editor-section-header">
            <span className="label editor-section-title">Face Gallery</span>
            <button
              type="button"
              className="btn collapse-btn"
              onClick={() => {
                setFacesOpen((open) => {
                  const next = !open;
                  if (next) {
                    setStickersOpen(false);
                    setStylesOpen(false);
                  }
                  return next;
                });
              }}
              aria-expanded={facesOpen}
              aria-controls="face-gallery-grid"
              aria-label={facesOpen ? "Collapse face gallery" : "Expand face gallery"}
            >
              {facesOpen ? <FaMinus /> : <FaPlus />}
            </button>
          </div>
          {facesOpen && (
            <div className="grid" id="face-gallery-grid">
              {FACE_GALLERY.map((face) => (
                <button
                  key={face.id}
                  type="button"
                  className="card card--face"
                  title={face.label}
                  onClick={() => addFaceFromGallery(face)}
                >
                  <img src={face.src} alt={face.label} />
                  <div className="caption">{face.label}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="editor-section">
          <div className="editor-section-header">
            <span className="label editor-section-title">Styles Gallery</span>
            <button
              type="button"
              className="btn collapse-btn"
              onClick={() => {
                setStylesOpen((open) => {
                  const next = !open;
                  if (next) {
                    setStickersOpen(false);
                    setFacesOpen(false);
                  }
                  return next;
                });
              }}
              aria-expanded={stylesOpen}
              aria-controls="styles-gallery-grid"
              aria-label={stylesOpen ? "Collapse styles gallery" : "Expand styles gallery"}
            >
              {stylesOpen ? <FaMinus /> : <FaPlus />}
            </button>
          </div>
          {stylesOpen && (
            <div className="grid" id="styles-gallery-grid">
              {STYLE_GALLERY.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className="card card--style"
                  title={style.label}
                  onClick={() => addStyleFromGallery(style)}
                >
                  <img src={style.src} alt={style.label} />
                  <div className="caption">{style.label}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      </aside>
    </div>
  );
}
