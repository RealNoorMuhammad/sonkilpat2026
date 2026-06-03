import { useEffect, useRef, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Image as KImage,
  Text as KText,
  Transformer,
} from "react-konva";
import { FaDownload, FaRedo } from "react-icons/fa";
import { Link } from "react-router-dom";
import Footer from "./Footer";
import SiteLogo from "../buttons/SiteLogo";
import memeTemplate from "../buttons/mememaker.png";
import "./comic-buttons.css";
import "./MemeGenerator.css";

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

const isMobileView = () =>
  typeof window !== "undefined" && window.innerWidth <= 768;

const getDefaultFontSize = (stageW) => {
  if (isMobileView()) return 20;
  return Math.max(18, stageW * 0.048);
};

const buildDefaultTexts = (stageW, stageH) => {
  const fontSize = getDefaultFontSize(stageW);
  return [
    {
      id: "text1",
      text: "",
      x: stageW * 0.04,
      y: stageH * 0.05,
      fontSize,
    },
    {
      id: "text2",
      text: "",
      x: stageW * 0.52,
      y: stageH * 0.05,
      fontSize,
    },
  ];
};

function EditableText({ node, selected, onSelect, onChange }) {
  const ref = useRef(null);
  const tr = useRef(null);

  useEffect(() => {
    if (selected && tr.current && ref.current) {
      tr.current.nodes([ref.current]);
      tr.current.getLayer().batchDraw();
    }
  }, [selected]);

  if (!node.text) return null;

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
          const scaleY = n.scaleY();
          n.scaleX(1);
          n.scaleY(1);
          onChange({
            ...node,
            x: n.x(),
            y: n.y(),
            fontSize: Math.max(isMobileView() ? 20 : 10, n.fontSize() * scaleY),
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

function MemeGenerator() {
  const wrapRef = useRef(null);
  const bgImg = useHtmlImage(memeTemplate);
  const [stageSize, setStageSize] = useState({ width: 640, height: 360 });
  const [texts, setTexts] = useState(() => buildDefaultTexts(640, 360));
  const [selectedId, setSelectedId] = useState(null);
  const prevStageRef = useRef({ width: 640, height: 360 });

  const updateStageSize = useCallback(() => {
    const el = wrapRef.current;
    if (!el || !bgImg?.width || !bgImg?.height) return;

    const maxWidth = Math.min(920, el.clientWidth || 920);
    const aspect = bgImg.height / bgImg.width;
    const width = Math.max(280, maxWidth);
    const height = Math.round(width * aspect);

    setStageSize({ width, height });
  }, [bgImg]);

  useEffect(() => {
    updateStageSize();
    window.addEventListener("resize", updateStageSize);
    return () => window.removeEventListener("resize", updateStageSize);
  }, [updateStageSize]);

  useEffect(() => {
    if (!bgImg?.width) return;
    const { width, height } = stageSize;
    if (prevStageRef.current.width === width && prevStageRef.current.height === height) {
      return;
    }

    const prev = prevStageRef.current;
    if (prev.width <= 0 || prev.height <= 0) {
      setTexts(buildDefaultTexts(width, height));
    } else {
      const ratioX = width / prev.width;
      const ratioY = height / prev.height;
      setTexts((arr) =>
        arr.map((t) => ({
          ...t,
          x: t.x * ratioX,
          y: t.y * ratioY,
          fontSize: Math.max(
            isMobileView() ? 20 : 10,
            t.fontSize * ratioY
          ),
        }))
      );
    }
    prevStageRef.current = { width, height };
  }, [bgImg, stageSize]);

  const { width: stageW, height: stageH } = stageSize;

  const setTextContent = (id, value) => {
    setTexts((arr) =>
      arr.map((t) => {
        if (t.id !== id) return t;
        const fontSize =
          t.fontSize < 20 && isMobileView()
            ? 20
            : t.fontSize;
        return { ...t, text: value, fontSize };
      })
    );
  };

  const resetPositions = () => {
    setTexts(buildDefaultTexts(stageW, stageH));
    setSelectedId(null);
  };

  const deselect = (e) => {
    if (e.target === e.target.getStage()) setSelectedId(null);
  };

  const download = () => {
    if (!bgImg?.width || !bgImg?.height) return;

    setSelectedId(null);
    setTimeout(() => {
      const pixelRatio = 2;
      const exportW = bgImg.width * pixelRatio;
      const exportH = bgImg.height * pixelRatio;
      const scale = exportW / stageW;

      const canvas = document.createElement("canvas");
      canvas.width = exportW;
      canvas.height = exportH;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bgImg, 0, 0, exportW, exportH);

      texts.forEach((t) => {
        if (!t.text) return;
        ctx.save();
        const fontSize = t.fontSize * scale;
        ctx.font = `${fontSize}px Impact, Arial Black, sans-serif`;
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2 * scale;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.strokeText(t.text, t.x * scale, t.y * scale);
        ctx.fillText(t.text, t.x * scale, t.y * scale);
        ctx.restore();
      });

      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "son-meme.png";
      a.click();
    }, 100);
  };

  return (
    <div className="meme-generator-page">
      <header className="meme-generator-header">
        <SiteLogo className="site-logo--hero" />
        <h1 className="meme-generator-title">MEME Generator</h1>
        <p className="meme-generator-subtitle">
          Add your text, drag it where you want, then download.
        </p>
      </header>

      <div className="meme-generator-layout">
        <div className="meme-generator-main">
          <div className="meme-generator-canvas-wrap" ref={wrapRef}>
            <Stage
              width={stageW}
              height={stageH}
              onMouseDown={deselect}
              onTouchStart={deselect}
              className="meme-generator-stage"
            >
              <Layer>
                {bgImg && (
                  <KImage
                    image={bgImg}
                    x={0}
                    y={0}
                    width={stageW}
                    height={stageH}
                    listening={false}
                  />
                )}
                {texts.map((t) => (
                  <EditableText
                    key={t.id}
                    node={t}
                    selected={t.id === selectedId}
                    onSelect={() => setSelectedId(t.id)}
                    onChange={(n) =>
                      setTexts((arr) =>
                        arr.map((x) => (x.id === t.id ? n : x))
                      )
                    }
                  />
                ))}
              </Layer>
            </Stage>
          </div>

          <aside className="meme-generator-controls">
            <div className="meme-generator-field">
              <label className="meme-generator-label" htmlFor="meme-text-1">
                Text 1
              </label>
              <input
                id="meme-text-1"
                type="text"
                className="meme-generator-input"
                placeholder="e.g. ARE YA WINNING, SON?"
                value={texts.find((t) => t.id === "text1")?.text || ""}
                onChange={(e) => setTextContent("text1", e.target.value)}
              />
            </div>

            <div className="meme-generator-field">
              <label className="meme-generator-label" htmlFor="meme-text-2">
                Text 2
              </label>
              <input
                id="meme-text-2"
                type="text"
                className="meme-generator-input"
                placeholder="e.g. MAKING PFP, DAD"
                value={texts.find((t) => t.id === "text2")?.text || ""}
                onChange={(e) => setTextContent("text2", e.target.value)}
              />
            </div>

            <p className="meme-generator-hint">
              Tap text on the meme to select, then drag or resize it.
            </p>
          </aside>
        </div>

        <div className="meme-generator-actions">
          <button
            type="button"
            className="comic-btn comic-btn--pill meme-generator-btn"
            onClick={download}
          >
            <FaDownload /> Download
          </button>
          <button
            type="button"
            className="comic-btn comic-btn--pill meme-generator-btn meme-generator-btn--secondary"
            onClick={resetPositions}
          >
            <FaRedo /> Reset positions
          </button>
          <Link
            to="/"
            className="comic-btn comic-btn--pill meme-generator-btn meme-generator-btn--secondary"
          >
            Back home
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default MemeGenerator;
