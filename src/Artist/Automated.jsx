import { useEffect, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Group,
  Image as KImage,
  Transformer,
} from "react-konva";

import SiteLogo from "../buttons/SiteLogo";
import hat from "./hatt.png";
import cigerate from "./cigerate1.png";



import Footer from "./Footer";
import "./Motion.css";



/* ---------- helpers ---------- */
function useHtmlImage(src) {
  const [img, setImg] = useState(null);
  useEffect(() => {
    if (!src) return setImg(null);
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => setImg(image);
    image.src = src;
    setImg(image);
  }, [src]);
  return img;
}

const SAMPLE_STICKERS = [
  { id: "hat", label: "Hat", src: hat },
  { id: "cigerate", label: "Cigarette", src: cigerate },
];

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

/* ---------- main ---------- */
export default function App() {
  const stageRef = useRef(null);
  const wrapRef = useRef(null);
  const [size, setSize] = useState(600);
  const [bgSrc, setBgSrc] = useState(null);
  const bgImg = useHtmlImage(bgSrc);

  const [maskCircle, setMaskCircle] = useState(false);
  const [stickers, setStickers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  // responsive square canvas
  useEffect(() => {
    const onResize = () => {
      const el = wrapRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const s = Math.max(280, Math.min(800, w));
      setSize(s);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const addStickerFromSrc = (src) => {
    const base = size * 0.3;
    setStickers((arr) => [
      ...arr,
      {
        id: crypto.randomUUID(),
        src,
        x: size / 2 - base / 2,
        y: size / 2 - base * 0.2,
        w: base,
        h: base * 0.4,
        r: 0,
      },
    ]);
  };

  const handleUploadBg = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      setBgSrc(r.result.toString());
      setShowEditor(true);
    };
    r.readAsDataURL(file);
  };

  const deselect = (e) => {
    if (e.target === e.target.getStage()) setSelectedId(null);
  };

  const download = () => {
    setSelectedId(null);
    setTimeout(() => {
      const pixelRatio = 2;
      const main = stageRef.current.toCanvas({ pixelRatio });
      const footerH = Math.max(48, Math.round(size * 0.09)) * pixelRatio;

      const out = document.createElement("canvas");
      out.width = main.width;
      out.height = main.height + footerH;
      const ctx = out.getContext("2d");

      ctx.drawImage(main, 0, 0);

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, main.height, out.width, footerH);
      ctx.fillStyle = "#000";
      ctx.font = `${Math.floor(footerH * 0.45)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "son pfp generator",
        out.width / 2,
        main.height + footerH / 2
      );

      const url = out.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "pfp.png";
      a.click();
    }, 100);
  };

  /* ---------- RENDER ---------- */
  if (!showEditor) {
    const handleDrop = (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleUploadBg(e.dataTransfer.files[0]);
        e.dataTransfer.clearData();
      }
    };

    return (
      <div className="uploadPage" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
        <SiteLogo className="site-logo--hero logo" />
        <h1 className="ai-pfp-title">AI PFP Maker</h1>
        <p className="subtitle">Upload an image to start creating your Son PFP</p>

        <div className="uploadBox">
          <label htmlFor="uploadInput" className="uploadArea">
            <span>+ Upload an image</span>
            <input
              id="uploadInput"
              type="file"
              accept="image/*"
              onChange={(e) => handleUploadBg(e.target.files?.[0])}
              className="hiddenInput"
            />
          </label>
        </div>


<Footer/>
        
      </div>

      
    );
  }

  return (
    <div className="app">
      {/* Canvas */}
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
              {bgImg && (
                <KImage image={bgImg} x={0} y={0} width={size} height={size} />
              )}
              {stickers.map((s) => (
                <Sticker
                  key={s.id}
                  node={s}
                  selected={s.id === selectedId}
                  onSelect={() => setSelectedId(s.id)}
                  onChange={(n) =>
                    setStickers((arr) =>
                      arr.map((x) => (x.id === s.id ? n : x))
                    )
                  }
                />
              ))}
            </Group>
          </Layer>
        </Stage>
      </div>

      {/* Controls */}
      <aside className="side">
        <div className="row">
          <label className="switch">
            <input
              type="checkbox"
              checked={maskCircle}
              onChange={(e) => setMaskCircle(e.target.checked)}
            />
            <span>Round Mask</span>
          </label>

          <button className="btn primary" onClick={download}>
            Download
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

        {selectedId && (
          <button
            className="btn danger"
            onClick={() =>
              setStickers((arr) => arr.filter((x) => x.id !== selectedId))
            }
          >
            Delete selected
          </button>
        )}
      </aside>
    </div>
  );
}
