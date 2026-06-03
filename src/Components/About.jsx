import { useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Group,
  Image as KImage,
  Text as KText,
  Transformer,
} from "react-konva";
import { FaTrash, FaArrowLeft, FaDownload } from "react-icons/fa";

import hat from "../Artist/hatf.png";
import cigerate from "../Artist/one.png";
import cigerates from "../Artist/two.png";
import headphones from "../Artist/three.png";
import glasses from "../Artist/glasses.png";
import dad from "../Artist/dad.png";




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
  { id: "cigerate", label: "Cigarette", src: cigerate },
    { id: "cigerate", label: "Cigarette", src: cigerates },
  { id: "glasses", label: "Glasses", src: glasses },
      { id: "headphones", label: "headphones", src: headphones },
  { id: "Dad", label: "Dad", src: dad },
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
          const scaleX = n.scaleX();
          const scaleY = n.scaleY();
          n.scaleX(1);
          n.scaleY(1);
          onChange({
            ...node,
            x: n.x(),
            y: n.y(),
            fontSize: Math.max(10, n.fontSize() * scaleY),
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
export default function Editor({ image, onBack }) {
  const stageRef = useRef(null);
  const wrapRef = useRef(null);
  const [size, setSize] = useState(500);
  const bgImg = useHtmlImage(image);

  const [maskCircle, setMaskCircle] = useState(false);
  const [stickers, setStickers] = useState([]);
  const [texts, setTexts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [textInput1, setTextInput1] = useState("");
  const [textInput2, setTextInput2] = useState("");

  useEffect(() => {
    const onResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop) setSize(500);
      else {
        const el = wrapRef.current;
        if (!el) return;
        const w = el.clientWidth;
        const s = Math.max(280, Math.min(500, w));
        setSize(s);
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  /* ---------- Download Function ---------- */
  const download = () => {
    if (!bgImg) return;
    setSelectedId(null);
    setTimeout(() => {
      const pixelRatio = 2;
      const barHeight = 40;
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = maskCircle ? size * pixelRatio : size * pixelRatio;
      tmpCanvas.height = (size + barHeight) * pixelRatio;
      const ctx = tmpCanvas.getContext("2d");

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);

      if (maskCircle) {
        ctx.save();
        const r = (size / 2) * pixelRatio;
        ctx.beginPath();
        ctx.arc(r, r, r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      }

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

        if (maskCircle) ctx.restore();

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
            <Group
              clipFunc={
                maskCircle
                  ? (ctx) => {
                      const r = size / 2 - 1;
                      ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2, false);
                    }
                  : undefined
              }
            >
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
            </Group>
          </Layer>
        </Stage>

        {selectedId && (
          <button className="floatingDelete" onClick={deleteNode}>
            <FaTrash />
          </button>
        )}
      </div>

      <aside className="side">
        <div className="row">
          <button className="btn secondary" onClick={onBack}>
            <FaArrowLeft /> Back
          </button>

          <button
            className={`btn toggle ${maskCircle ? "active" : ""}`}
            onClick={() => setMaskCircle(!maskCircle)}
          >
            {maskCircle ? "Unround Mask" : "Round Mask"}
          </button>

          <button className="btn primary" onClick={download}>
            <FaDownload /> Download
          </button>
        </div>

        <div className="label">Sticker Gallery</div>
        <div className="grid">
          {SAMPLE_STICKERS.map((s) => (
            <button
              key={s.id}
              className="card"
              title={s.label}
              onClick={() => addStickerFromSrc(s.src)}
            >
              <img src={s.src} alt={s.label} />
              <div className="caption">{s.label}</div>
            </button>
          ))}
        </div>

        <div className="label">Add Text</div>
        <input
          type="text"
          placeholder="Enter text 1"
          value={textInput1}
          onChange={(e) => setTextInput1(e.target.value)}
        />
        <button onClick={() => { addText(textInput1); setTextInput1(""); }}>
          Add Text 1
        </button>

       
      </aside>
    </div>
  );
}
