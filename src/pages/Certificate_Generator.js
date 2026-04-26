import { useEffect, useRef, useState, useCallback } from "react";

const GOOGLE_FONTS = [
  "Cinzel","Playfair Display","Cormorant Garamond","EB Garamond",
  "Libre Baskerville","Merriweather","Lora","Crimson Text",
  "Raleway","Montserrat","Josefin Sans","Nunito","Poppins",
  "Dancing Script","Great Vibes","Pacifico","Sacramento",
  "Oswald","Bebas Neue","Anton","Teko",
  "Source Serif Pro","Bitter","Domine","Spectral",
  "Roboto Slab","Zilla Slab","Arvo"
];

const BACKEND_FIELDS = [
  { key: "certificate_id", label: "Certificate ID", icon: "🆔" },
  { key: "name",           label: "Student Name",   icon: "👤" },
  { key: "roll_no",        label: "Roll No",         icon: "🔢" },
  { key: "department",     label: "Department",      icon: "🏛️" },
  { key: "college",        label: "College",         icon: "🎓" },
  { key: "course",         label: "Course",          icon: "📚" },
  { key: "mark_percentage",label: "Mark %",          icon: "📊" },
  { key: "duration",       label: "Duration",        icon: "📅" },
];

const SAMPLE_DATA = {
  certificate_id: "CERT-2024-0042",
  name: "Arjun Krishnamurthy",
  roll_no: "21CS045",
  department: "Computer Science",
  college: "PSG College of Technology",
  course: "Full Stack Development",
  mark_percentage: "92.4%",
  duration: "6 Months",
};

// ─── Inject CSS ────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #F5F2EE;
    --surface:   #FDFCFB;
    --surface2:  #F0EDE8;
    --border:    #E2DDD6;
    --border2:   #CCC6BC;
    --text:      #1C1814;
    --text2:     #6B6560;
    --text3:     #A09890;
    --accent:    #C17F3B;
    --accent2:   #8B5A24;
    --accentBg:  #FDF4E9;
    --red:       #C0392B;
    --redBg:     #FDECEA;
    --green:     #2D7A51;
    --greenBg:   #EAF5EE;
    --canvas-bg: #E8E3DC;
  }

  .certapp {
    display: flex; flex-direction: column; height: 100vh;
    background: var(--bg); font-family: 'DM Sans', sans-serif;
    color: var(--text); overflow: hidden;
  }

  /* ── TOPBAR ── */
  .topbar {
    background: var(--surface); border-bottom: 1px solid var(--border);
    padding: 0 14px; display: flex; align-items: center; gap: 6px;
    height: 52px; flex-shrink: 0; overflow-x: auto; overflow-y: hidden;
    scrollbar-width: none;
  }
  .topbar::-webkit-scrollbar { display: none; }

  .logo {
    font-family: 'DM Serif Display', serif;
    font-size: 17px; font-weight: 400; color: var(--accent);
    letter-spacing: .5px; margin-right: 10px; white-space: nowrap;
    display: flex; align-items: center; gap: 7px;
  }
  .logo-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--accent); display: inline-block;
  }

  .tb-sep { width: 1px; height: 26px; background: var(--border); flex-shrink: 0; margin: 0 2px; }

  .tb-btn {
    background: transparent; border: 1px solid transparent;
    color: var(--text2); padding: 5px 10px; border-radius: 6px;
    cursor: pointer; font-size: 12px; font-weight: 500; white-space: nowrap;
    font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 5px;
    transition: all .15s;
  }
  .tb-btn:hover { background: var(--surface2); border-color: var(--border); color: var(--text); }
  .tb-btn.active { background: var(--accentBg); border-color: var(--accent); color: var(--accent); }

  .tb-icon-btn {
    background: transparent; border: 1px solid transparent;
    color: var(--text2); width: 30px; height: 30px; border-radius: 6px;
    cursor: pointer; font-size: 13px; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0; transition: all .15s;
    font-family: 'DM Sans', sans-serif;
  }
  .tb-icon-btn:hover { background: var(--surface2); border-color: var(--border); color: var(--text); }

  .tb-primary {
    background: var(--accent); border: 1px solid var(--accent2);
    color: #fff; padding: 6px 14px; border-radius: 7px;
    cursor: pointer; font-size: 12px; font-weight: 600; white-space: nowrap;
    font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 5px;
    transition: all .15s;
  }
  .tb-primary:hover { background: var(--accent2); }

  .tb-danger {
    background: transparent; border: 1px solid var(--border);
    color: var(--red); padding: 5px 10px; border-radius: 6px;
    cursor: pointer; font-size: 12px; font-weight: 500; white-space: nowrap;
    font-family: 'DM Sans', sans-serif;
    transition: all .15s;
  }
  .tb-danger:hover { background: var(--redBg); border-color: var(--red); }

  .color-swatch {
    width: 28px; height: 28px; border: 2px solid var(--border);
    border-radius: 6px; cursor: pointer; padding: 0; overflow: hidden;
    transition: border-color .15s;
  }
  .color-swatch:hover { border-color: var(--accent); }

  .num-input {
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); padding: 4px 7px; border-radius: 6px;
    font-size: 12px; width: 54px; font-family: 'DM Sans', sans-serif;
    outline: none;
  }
  .num-input:focus { border-color: var(--accent); }

  /* ── WORKSPACE ── */
  .workspace { display: flex; flex: 1; overflow: hidden; }

  /* ── PANELS ── */
  .left-panel {
    width: 218px; background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column; overflow-y: auto; flex-shrink: 0;
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
  }
  .right-panel {
    width: 228px; background: var(--surface);
    border-left: 1px solid var(--border);
    display: flex; flex-direction: column; overflow-y: auto; flex-shrink: 0;
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
  }

  .panel-head {
    padding: 9px 14px; font-size: 9px; font-weight: 700;
    color: var(--text3); text-transform: uppercase; letter-spacing: 2px;
    background: var(--surface2); border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .tab-row { display: flex; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .tab-item {
    flex: 1; padding: 10px 4px; font-size: 11px; font-weight: 600;
    text-align: center; cursor: pointer; color: var(--text3);
    border-bottom: 2px solid transparent; transition: all .15s;
    background: transparent;
    letter-spacing: .3px;
  }
  .tab-item.active {
    color: var(--accent); border-bottom-color: var(--accent);
    background: var(--accentBg);
  }
  .tab-item:hover:not(.active) { color: var(--text2); background: var(--surface2); }

  .panel-body { padding: 10px; }

  .field-chip {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 8px 10px; margin-bottom: 5px;
    cursor: pointer; font-size: 12px; display: flex; align-items: center;
    gap: 9px; transition: all .15s;
  }
  .field-chip:hover { border-color: var(--accent); background: var(--accentBg); }
  .field-chip-label { color: var(--text); font-weight: 600; font-size: 12px; }
  .field-chip-key { color: var(--text3); font-size: 10px; font-family: 'JetBrains Mono', monospace; }

  .shape-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 10px; }
  .shape-btn {
    background: var(--surface); border: 1px solid var(--border);
    color: var(--text2); border-radius: 8px; padding: 10px 6px;
    cursor: pointer; font-size: 11px; font-weight: 500; text-align: center;
    font-family: 'DM Sans', sans-serif; transition: all .15s;
  }
  .shape-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accentBg); }
  .shape-btn-icon { font-size: 20px; margin-bottom: 3px; display: block; }

  /* ── LAYERS ── */
  .layer-item {
    padding: 7px 12px; font-size: 11px; cursor: pointer;
    display: flex; align-items: center; gap: 7px;
    border-bottom: 1px solid var(--border2);
    color: var(--text2); transition: all .12s; font-weight: 500;
  }
  .layer-item:hover { background: var(--surface2); }
  .layer-item.selected { background: var(--accentBg); color: var(--accent); border-left: 2px solid var(--accent); }
  .layer-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* ── CANVAS AREA ── */
  .canvas-area {
    flex: 1; display: flex; align-items: center; justify-content: center;
    background: var(--canvas-bg);
    background-image:
      linear-gradient(rgba(0,0,0,.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,.03) 1px, transparent 1px);
    background-size: 24px 24px;
    overflow: auto; position: relative;
  }
  .canvas-shadow {
    box-shadow:
      0 1px 3px rgba(0,0,0,.08),
      0 4px 16px rgba(0,0,0,.10),
      0 12px 40px rgba(0,0,0,.12);
    border-radius: 3px;
  }

  /* ── ZOOM ── */
  .zoom-bar {
    position: absolute; bottom: 16px; right: 16px;
    display: flex; gap: 4px; align-items: center;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 9px; padding: 4px 6px;
    box-shadow: 0 2px 10px rgba(0,0,0,.1);
  }
  .zoom-pct {
    font-size: 11px; font-weight: 600; color: var(--text2);
    min-width: 46px; text-align: center; font-family: 'JetBrains Mono', monospace;
  }
  .zoom-btn {
    background: transparent; border: none; color: var(--text2);
    width: 24px; height: 24px; border-radius: 5px; cursor: pointer;
    font-size: 14px; display: flex; align-items: center; justify-content: center;
    transition: all .12s;
  }
  .zoom-btn:hover { background: var(--surface2); color: var(--text); }

  /* ── PREVIEW BADGE ── */
  .preview-badge {
    position: absolute; top: 14px; left: 50%; transform: translateX(-50%);
    background: var(--accent); color: #fff;
    padding: 5px 18px; border-radius: 20px; font-size: 11px; font-weight: 700;
    box-shadow: 0 4px 14px rgba(193,127,59,.4); white-space: nowrap;
    display: flex; align-items: center; gap: 7px;
  }
  .preview-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; animation: pulse 1.4s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

  /* ── FONT PICKER ── */
  .font-picker-wrap { position: relative; }
  .font-picker-dropdown {
    position: absolute; top: 36px; left: 0; right: 0;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 9px; z-index: 999; max-height: 300px; overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0,0,0,.15);
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
  }
  .font-search { padding: 8px 10px; border-bottom: 1px solid var(--border); }
  .font-search input {
    width: 100%; background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); padding: 5px 9px; border-radius: 6px;
    font-size: 12px; font-family: 'DM Sans', sans-serif; outline: none;
  }
  .font-item {
    padding: 8px 14px; cursor: pointer; font-size: 14px;
    border-bottom: 1px solid var(--border2); color: var(--text2);
    transition: all .1s;
  }
  .font-item:hover { background: var(--surface2); color: var(--text); }
  .font-item.active-font { color: var(--accent); background: var(--accentBg); font-weight: 600; }

  /* ── RIGHT PROPS PANEL ── */
  .prop-row { margin-bottom: 11px; }
  .prop-label { font-size: 10px; font-weight: 700; color: var(--text3); text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 4px; }
  .prop-input {
    width: 100%; background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); padding: 6px 9px; border-radius: 7px;
    font-size: 12px; font-family: 'DM Sans', sans-serif; outline: none; transition: border .15s;
  }
  .prop-input:focus { border-color: var(--accent); }
  .prop-row-split { display: flex; gap: 6px; }
  .prop-row-split .prop-input { flex: 1; }
  .prop-section-title {
    font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
    color: var(--text3); padding: 8px 0 6px; margin-top: 4px;
    border-top: 1px solid var(--border);
  }
  .prop-color-row { display: flex; align-items: center; gap: 8px; }
  .prop-color-input { flex: 1; height: 32px; border: 1px solid var(--border); border-radius: 7px; cursor: pointer; padding: 2px; }
  .obj-actions { display: flex; gap: 6px; margin-top: 14px; }
  .obj-actions .tb-btn { flex: 1; justify-content: center; }
  .obj-actions .tb-danger { flex: 1; text-align: center; }

  /* ── API SECTION ── */
  .api-section { padding: 12px 12px 0; }
  .api-endpoint {
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    color: var(--accent); background: var(--accentBg);
    border: 1px solid var(--border); border-radius: 6px;
    padding: 5px 8px; margin-bottom: 8px; word-break: break-all;
  }
  .api-data-preview {
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 7px; padding: 8px 10px; margin-top: 8px;
    font-size: 11px; font-family: 'JetBrains Mono', monospace;
    max-height: 180px; overflow-y: auto;
    scrollbar-width: thin; scrollbar-color: var(--border) transparent;
  }
  .api-kv { display: flex; gap: 6px; margin-bottom: 3px; }
  .api-key { color: var(--accent2); }
  .api-val { color: var(--text2); }
  .api-error { font-size: 11px; color: var(--red); background: var(--redBg); border-radius: 6px; padding: 6px 8px; margin-top: 6px; }
  .api-success { font-size: 11px; color: var(--green); background: var(--greenBg); border-radius: 6px; padding: 6px 8px; margin-top: 6px; }

  /* ── RANGE SLIDER ── */
  input[type=range] {
    -webkit-appearance: none; width: 100%; height: 4px;
    background: var(--border2); border-radius: 4px; outline: none;
    cursor: pointer;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 15px; height: 15px; border-radius: 50%;
    background: var(--accent); cursor: pointer; border: 2px solid #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,.2);
  }

  .select-input {
    width: 100%; background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); padding: 6px 9px; border-radius: 7px;
    font-size: 12px; font-family: 'DM Sans', sans-serif; outline: none;
    cursor: pointer;
  }
  .select-input:focus { border-color: var(--accent); }

  textarea.prop-input { height: 72px; resize: vertical; line-height: 1.4; }

  .obj-type-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;
    color: var(--accent2); background: var(--accentBg);
    border: 1px solid var(--border); border-radius: 5px;
    padding: 3px 8px; margin-bottom: 12px;
  }
  .obj-dynamic-tag {
    color: var(--text3); font-size: 9px; font-weight: 500; margin-left: 4px;
    text-transform: none; letter-spacing: 0;
  }

  .empty-selection {
    padding: 16px 14px;
  }
  .canvas-settings-title {
    font-size: 11px; font-weight: 600; color: var(--text2); margin-bottom: 12px;
  }

  .loading-dot {
    display: inline-block; animation: pulse 1s infinite;
  }
`;

// ─── Inject styles ────────────────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById("certmaker-styles")) return;
  const style = document.createElement("style");
  style.id = "certmaker-styles";
  style.textContent = CSS;
  document.head.appendChild(style);
}

// ─── Load script utility ──────────────────────────────────────────────────────
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      // Already added — wait a tick and resolve
      setTimeout(resolve, 100);
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function Certificate_Generator() {
  const canvasRef    = useRef(null);
  const fabricRef    = useRef(null);
  const fileInputRef = useRef(null);
  const bgInputRef   = useRef(null);

  const [fabricReady, setFabricReady] = useState(false);
  const [selectedObj,  setSelectedObj]  = useState(null);
  const [zoom,         setZoom]         = useState(1);
  const [activeFont,   setActiveFont]   = useState("Cinzel");
  const [fontSize,     setFontSize]     = useState(28);
  const [textColor,    setTextColor]    = useState("#1a1a2e");
  const [fillColor,    setFillColor]    = useState("#c17f3b");
  const [strokeColor,  setStrokeColor]  = useState("#8b5a24");
  const [strokeWidth,  setStrokeWidth]  = useState(2);
  const [opacity,      setOpacity]      = useState(100);
  const [layers,       setLayers]       = useState([]);
  const [apiData,      setApiData]      = useState(null);
  const [apiLoading,   setApiLoading]   = useState(false);
  const [apiError,     setApiError]     = useState("");
  const [previewMode,  setPreviewMode]  = useState(false);
  const [showFont,     setShowFont]     = useState(false);
  const [fontSearch,   setFontSearch]   = useState("");
  const [activeTab,    setActiveTab]    = useState("fields");
  const [canvasSize,   setCanvasSize]   = useState({ w: 900, h: 636 });
  const [bgColor,      setBgColor]      = useState("#ffffff");

  // ─── Boot: inject CSS + load Fabric ─────────────────────────────────────
  useEffect(() => {
    injectStyles();

    // Load Google Fonts
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${GOOGLE_FONTS.map(
      f => `family=${f.replace(/ /g, "+")}:ital,wght@0,400;0,700;1,400`
    ).join("&")}&display=swap`;
    document.head.appendChild(link);

    // Load Fabric from CDN
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js")
      .then(() => {
        if (window.fabric) setFabricReady(true);
        else setTimeout(() => { if (window.fabric) setFabricReady(true); }, 500);
      })
      .catch(() => {
        // fallback CDN
        loadScript("https://unpkg.com/fabric@5.3.1/dist/fabric.min.js")
          .then(() => setFabricReady(true));
      });
  }, []);

  // ─── Init Fabric canvas once ready ──────────────────────────────────────
  useEffect(() => {
    if (!fabricReady || !canvasRef.current || fabricRef.current) return;

    const canvas = new window.fabric.Canvas(canvasRef.current, {
      width: canvasSize.w,
      height: canvasSize.h,
      backgroundColor: bgColor,
      preserveObjectStacking: true,
      selection: true,
    });
    fabricRef.current = canvas;

    canvas.on("selection:created", syncSel);
    canvas.on("selection:updated", syncSel);
    canvas.on("selection:cleared", () => { setSelectedObj(null); syncLayers(); });
    canvas.on("object:modified", syncLayers);
    canvas.on("object:added",   syncLayers);
    canvas.on("object:removed", syncLayers);

    addDefaultTemplate(canvas);
    // eslint-disable-next-line
  }, [fabricReady]);

  const syncSel = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    setSelectedObj(obj || null);
    if (obj) {
      if (obj.type === "textbox" || obj.type === "i-text") {
        setActiveFont(obj.fontFamily || "Cinzel");
        setFontSize(obj.fontSize || 28);
        setTextColor(obj.fill || "#1a1a2e");
      }
      if (obj.fill && typeof obj.fill === "string") setFillColor(obj.fill);
      if (obj.stroke) setStrokeColor(obj.stroke);
      if (obj.strokeWidth !== undefined) setStrokeWidth(obj.strokeWidth);
      setOpacity(Math.round((obj.opacity ?? 1) * 100));
    }
    syncLayers();
  // eslint-disable-next-line
  }, []);

  const syncLayers = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objs = canvas.getObjects().map((o, i) => ({
      id: i, type: o.type,
      label: o._fieldKey
        ? `{{${o._fieldKey}}}`
        : o.type === "textbox" ? (o.text?.slice(0, 20) || "Text") : o.type,
      visible: o.visible !== false, obj: o,
    }));
    setLayers([...objs].reverse());
  }, []);

  // ─── Default template ─────────────────────────────────────────────────────
  const addDefaultTemplate = (canvas) => {
    const F = window.fabric;
    const W = canvas.width, H = canvas.height;

    canvas.add(new F.Rect({
      left: 18, top: 18, width: W - 36, height: H - 36,
      fill: "transparent", stroke: "#C9A055", strokeWidth: 3, rx: 4, ry: 4,
    }));
    canvas.add(new F.Rect({
      left: 28, top: 28, width: W - 56, height: H - 56,
      fill: "transparent", stroke: "#C9A055", strokeWidth: 1, rx: 2, ry: 2,
    }));

    canvas.add(new F.Textbox("CERTIFICATE OF COMPLETION", {
      left: 0, top: 56, width: W,
      fontFamily: "Cinzel", fontSize: 30, fill: "#1C1814",
      fontWeight: "700", textAlign: "center",
    }));

    canvas.add(new F.Textbox("This is to certify that", {
      left: 0, top: 122, width: W,
      fontFamily: "Cormorant Garamond", fontSize: 18, fill: "#6B6560",
      textAlign: "center",
    }));

    const nameText = new F.Textbox("{{name}}", {
      left: 0, top: 150, width: W,
      fontFamily: "Great Vibes", fontSize: 48, fill: "#8B5A24",
      textAlign: "center",
    });
    nameText._fieldKey = "name";
    canvas.add(nameText);

    canvas.add(new F.Line([180, 228, W - 180, 228], {
      stroke: "#C9A055", strokeWidth: 1.5,
    }));

    const courseText = new F.Textbox(
      "has successfully completed the course {{course}}\nduring {{duration}} with {{mark_percentage}} marks.", {
      left: 60, top: 248, width: W - 120,
      fontFamily: "Cormorant Garamond", fontSize: 18, fill: "#3A3228",
      textAlign: "center", lineHeight: 1.6,
    });
    courseText._fieldKey = "course";
    canvas.add(courseText);

    canvas.add(new F.Textbox(
      "Department: {{department}}   |   College: {{college}}", {
      left: 60, top: 340, width: W - 120,
      fontFamily: "Raleway", fontSize: 13, fill: "#6B6560",
      textAlign: "center",
    }));

    canvas.add(new F.Textbox(
      "Roll No: {{roll_no}}                    Certificate ID: {{certificate_id}}", {
      left: 60, top: 510, width: W - 120,
      fontFamily: "Raleway", fontSize: 11, fill: "#9A9088",
      textAlign: "center",
    }));

    canvas.renderAll();
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getFabric = () => fabricRef.current;

  const applyToSelected = useCallback((props) => {
    const obj = getFabric()?.getActiveObject();
    if (!obj) return;
    obj.set(props);
    getFabric().renderAll();
    // Update local state if fill/font changed
    if (props.fill) setTextColor(props.fill);
    if (props.fontFamily) setActiveFont(props.fontFamily);
    if (props.fontSize) setFontSize(props.fontSize);
  }, []);

  // ─── Add elements ─────────────────────────────────────────────────────────
  const addText = () => {
    if (!getFabric()) return;
    const F = window.fabric;
    const t = new F.Textbox("Your text here", {
      left: 100, top: 100, fontFamily: activeFont, fontSize, fill: textColor, width: 300,
    });
    getFabric().add(t);
    getFabric().setActiveObject(t);
    getFabric().renderAll();
  };

  const addFieldText = (field) => {
    if (!getFabric()) return;
    const F = window.fabric;
    const t = new F.Textbox(`{{${field.key}}}`, {
      left: 150, top: 200, fontFamily: activeFont, fontSize: 24, fill: textColor, width: 400,
    });
    t._fieldKey = field.key;
    getFabric().add(t);
    getFabric().setActiveObject(t);
    getFabric().renderAll();
  };

  const addRect = () => {
    if (!getFabric()) return;
    getFabric().add(new window.fabric.Rect({
      left: 100, top: 100, width: 200, height: 80,
      fill: fillColor, stroke: strokeColor, strokeWidth,
    }));
    getFabric().renderAll();
  };

  const addCircle = () => {
    if (!getFabric()) return;
    getFabric().add(new window.fabric.Circle({
      left: 200, top: 150, radius: 50,
      fill: fillColor, stroke: strokeColor, strokeWidth,
    }));
    getFabric().renderAll();
  };

  const addLine = () => {
    if (!getFabric()) return;
    getFabric().add(new window.fabric.Line([100, 200, 600, 200], {
      stroke: strokeColor, strokeWidth,
    }));
    getFabric().renderAll();
  };

  const addTriangle = () => {
    if (!getFabric()) return;
    getFabric().add(new window.fabric.Triangle({
      left: 200, top: 100, width: 100, height: 80,
      fill: fillColor, stroke: strokeColor, strokeWidth,
    }));
    getFabric().renderAll();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !getFabric()) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      window.fabric.Image.fromURL(ev.target.result, (img) => {
        img.scaleToWidth(150);
        img.set({ left: 80, top: 80 });
        getFabric().add(img);
        getFabric().setActiveObject(img);
        getFabric().renderAll();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !getFabric()) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      window.fabric.Image.fromURL(ev.target.result, (img) => {
        const c = getFabric();
        img.set({ left: 0, top: 0, selectable: false, evented: false });
        img.scaleToWidth(c.width);
        c.add(img);
        c.sendToBack(img);
        c.renderAll();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const applyFont = (font) => {
    setActiveFont(font);
    applyToSelected({ fontFamily: font });
    setShowFont(false);
  };

  const deleteSelected = () => {
    const c = getFabric();
    if (!c) return;
    const obj = c.getActiveObject();
    if (obj) { c.remove(obj); c.renderAll(); }
  };

  const duplicateSelected = () => {
    const c = getFabric();
    const obj = c?.getActiveObject();
    if (!obj) return;
    obj.clone((cloned) => {
      cloned.set({ left: obj.left + 20, top: obj.top + 20 });
      c.add(cloned);
      c.setActiveObject(cloned);
      c.renderAll();
    });
  };

  const bringForward  = () => { const c=getFabric(); c?.bringForward(c.getActiveObject()); c?.renderAll(); };
  const sendBackward  = () => { const c=getFabric(); c?.sendBackwards(c.getActiveObject()); c?.renderAll(); };
  const bringToFront  = () => { const c=getFabric(); c?.bringToFront(c.getActiveObject()); c?.renderAll(); };
  const sendToBack    = () => { const c=getFabric(); c?.sendToBack(c.getActiveObject()); c?.renderAll(); };

  const handleZoom = (delta) => {
    const nz = Math.min(3, Math.max(0.25, zoom + delta));
    setZoom(nz);
    const c = getFabric();
    if (!c) return;
    c.setZoom(nz);
    c.setWidth(canvasSize.w * nz);
    c.setHeight(canvasSize.h * nz);
    c.renderAll();
  };

  const resetZoom = () => {
    setZoom(1);
    const c = getFabric();
    if (!c) return;
    c.setZoom(1);
    c.setWidth(canvasSize.w);
    c.setHeight(canvasSize.h);
    c.renderAll();
  };

  const fetchFromAPI = async () => {
    setApiLoading(true);
    setApiError("");
    try {
      const res = await fetch("/generateCertificate");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setApiData(data);
    } catch {
      setApiData(SAMPLE_DATA);
      setApiError("API unavailable — loaded sample data.");
    } finally {
      setApiLoading(false);
    }
  };

  const populatePreview = (data) => {
    const c = getFabric();
    if (!c) return;
    c.getObjects().forEach((obj) => {
      if (obj.type === "textbox" || obj.type === "i-text") {
        let text = obj.text;
        Object.entries(data).forEach(([k, v]) => {
          text = text.replaceAll(`{{${k}}}`, v);
        });
        obj._originalText = obj._originalText || obj.text;
        obj.set("text", text);
      }
    });
    c.renderAll();
    setPreviewMode(true);
  };

  const resetPreview = () => {
    const c = getFabric();
    if (!c) return;
    c.getObjects().forEach((obj) => {
      if (obj._originalText) {
        obj.set("text", obj._originalText);
        delete obj._originalText;
      }
    });
    c.renderAll();
    setPreviewMode(false);
  };

  const exportPNG = () => {
    const c = getFabric();
    if (!c) return;
    const rz = c.getZoom();
    c.setZoom(1); c.setWidth(canvasSize.w); c.setHeight(canvasSize.h);
    const url = c.toDataURL({ format: "png", quality: 1, multiplier: 2 });
    c.setZoom(rz); c.setWidth(canvasSize.w * rz); c.setHeight(canvasSize.h * rz);
    c.renderAll();
    const a = document.createElement("a");
    a.href = url; a.download = "certificate.png"; a.click();
  };

  const exportJSON = () => {
    const c = getFabric();
    if (!c) return;
    const json = c.toJSON(["_fieldKey", "_originalText"]);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "certificate-template.json"; a.click();
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file || !getFabric()) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = JSON.parse(ev.target.result);
      getFabric().loadFromJSON(json, () => getFabric().renderAll());
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const updateCanvasBg = (color) => {
    setBgColor(color);
    getFabric()?.setBackgroundColor(color, () => getFabric().renderAll());
  };

  const filteredFonts = GOOGLE_FONTS.filter(f =>
    f.toLowerCase().includes(fontSearch.toLowerCase())
  );

  const isText  = selectedObj && (selectedObj.type === "textbox" || selectedObj.type === "i-text");
  const isShape = selectedObj && !isText;

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="certapp">
      {/* ─── TOPBAR ─── */}
      <div className="topbar">
        <div className="logo">
          <span className="logo-dot"/>
          CertMaker
        </div>
        <div className="tb-sep"/>

        <button className="tb-btn" onClick={addText}>＋ Text</button>
        <button className="tb-btn" onClick={addRect}>▭ Rect</button>
        <button className="tb-btn" onClick={addCircle}>◯ Circle</button>
        <button className="tb-btn" onClick={addLine}>— Line</button>
        <button className="tb-btn" onClick={addTriangle}>△ Triangle</button>
        <button className="tb-btn" onClick={() => fileInputRef.current.click()}>🖼 Image</button>
        <button className="tb-btn" onClick={() => bgInputRef.current.click()}>🌄 BG</button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImageUpload}/>
        <input ref={bgInputRef}   type="file" accept="image/*" style={{display:"none"}} onChange={handleBgUpload}/>

        <div className="tb-sep"/>

        {/* Font picker */}
        <div className="font-picker-wrap">
          <button
            className="tb-btn"
            style={{ minWidth: 148, fontFamily: activeFont, justifyContent: "space-between" }}
            onClick={() => setShowFont(v => !v)}
          >
            <span style={{ fontFamily: activeFont }}>{activeFont}</span>
            <span style={{ marginLeft: 6, opacity: .5, fontFamily: "sans-serif", fontSize: 10 }}>▾</span>
          </button>
          {showFont && (
            <div className="font-picker-dropdown">
              <div className="font-search">
                <input
                  placeholder="Search fonts…"
                  value={fontSearch}
                  onChange={e => setFontSearch(e.target.value)}
                  autoFocus
                />
              </div>
              {filteredFonts.map(f => (
                <div
                  key={f}
                  className={`font-item${activeFont === f ? " active-font" : ""}`}
                  style={{ fontFamily: f }}
                  onClick={() => applyFont(f)}
                >
                  {f}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Font size */}
        <input
          className="num-input" type="number" value={fontSize} min={6} max={200}
          onChange={e => { setFontSize(+e.target.value); applyToSelected({ fontSize: +e.target.value }); }}
        />

        {/* Style toggles */}
        <button className="tb-icon-btn" title="Bold"      onClick={() => applyToSelected({ fontWeight: selectedObj?.fontWeight==="bold"?"normal":"bold" })}><b>B</b></button>
        <button className="tb-icon-btn" title="Italic"    onClick={() => applyToSelected({ fontStyle: selectedObj?.fontStyle==="italic"?"normal":"italic" })}><i>I</i></button>
        <button className="tb-icon-btn" title="Underline" onClick={() => applyToSelected({ underline: !selectedObj?.underline })}><u>U</u></button>
        <button className="tb-icon-btn" title="Left"   onClick={() => applyToSelected({ textAlign:"left" })}>◁</button>
        <button className="tb-icon-btn" title="Center" onClick={() => applyToSelected({ textAlign:"center" })}>◈</button>
        <button className="tb-icon-btn" title="Right"  onClick={() => applyToSelected({ textAlign:"right" })}>▷</button>

        <div className="tb-sep"/>

        <span style={{ fontSize:10, color:"var(--text3)" }}>Text</span>
        <input type="color" className="color-swatch" value={textColor}
          onChange={e => { setTextColor(e.target.value); applyToSelected({ fill: e.target.value }); }}/>
        <span style={{ fontSize:10, color:"var(--text3)" }}>Fill</span>
        <input type="color" className="color-swatch" value={fillColor}
          onChange={e => { setFillColor(e.target.value); applyToSelected({ fill: e.target.value }); }}/>
        <span style={{ fontSize:10, color:"var(--text3)" }}>Border</span>
        <input type="color" className="color-swatch" value={strokeColor}
          onChange={e => { setStrokeColor(e.target.value); applyToSelected({ stroke: e.target.value }); }}/>

        <div className="tb-sep"/>

        <button className="tb-icon-btn" title="Bring Forward" onClick={bringForward}>↑</button>
        <button className="tb-icon-btn" title="Send Backward"  onClick={sendBackward}>↓</button>
        <button className="tb-icon-btn" title="Bring to Front" onClick={bringToFront}>⇑</button>
        <button className="tb-icon-btn" title="Send to Back"   onClick={sendToBack}>⇓</button>
        <button className="tb-icon-btn" title="Duplicate"      onClick={duplicateSelected}>⧉</button>
        <button className="tb-icon-btn" title="Delete" style={{ color:"var(--red)" }} onClick={deleteSelected}>✕</button>

        <div className="tb-sep"/>

        <button className="tb-primary" onClick={exportPNG}>⬇ Export PNG</button>
        <button className="tb-btn"     onClick={exportJSON}>⬇ JSON</button>
        <label className="tb-btn" style={{ cursor:"pointer" }}>
          ⬆ Import
          <input type="file" accept=".json" style={{ display:"none" }} onChange={importJSON}/>
        </label>
      </div>

      {/* ─── WORKSPACE ─── */}
      <div className="workspace">

        {/* ── LEFT PANEL ── */}
        <div className="left-panel">
          <div className="tab-row">
            {["fields","layers","api"].map(t => (
              <div key={t} className={`tab-item${activeTab===t?" active":""}`} onClick={() => setActiveTab(t)}>
                {t === "fields" ? "Fields" : t === "layers" ? "Layers" : "API"}
              </div>
            ))}
          </div>

          {activeTab === "fields" && (
            <>
              <div className="panel-head">Backend Data Fields</div>
              <div className="panel-body">
                <p style={{ fontSize:11, color:"var(--text3)", marginBottom:9, lineHeight:1.5 }}>
                  Click a field to add it to the canvas.
                </p>
                {BACKEND_FIELDS.map(f => (
                  <div key={f.key} className="field-chip" onClick={() => addFieldText(f)}>
                    <span style={{ fontSize:16 }}>{f.icon}</span>
                    <div>
                      <div className="field-chip-label">{f.label}</div>
                      <div className="field-chip-key">{`{{${f.key}}}`}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="panel-head">Quick Shapes</div>
              <div className="shape-grid">
                {[
                  { label:"Rectangle", fn:addRect,     icon:"▭" },
                  { label:"Circle",    fn:addCircle,   icon:"◯" },
                  { label:"Line",      fn:addLine,     icon:"—" },
                  { label:"Triangle",  fn:addTriangle, icon:"△" },
                ].map(s => (
                  <button key={s.label} className="shape-btn" onClick={s.fn}>
                    <span className="shape-btn-icon">{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === "layers" && (
            <>
              <div className="panel-head">Layers</div>
              {layers.length === 0 && (
                <div style={{ padding:"16px 12px", fontSize:11, color:"var(--text3)" }}>
                  No objects yet. Add elements to the canvas.
                </div>
              )}
              {layers.map((l, i) => {
                const isSel = fabricRef.current?.getActiveObject() === l.obj;
                return (
                  <div
                    key={i}
                    className={`layer-item${isSel?" selected":""}`}
                    onClick={() => {
                      fabricRef.current?.setActiveObject(l.obj);
                      fabricRef.current?.renderAll();
                      syncSel();
                    }}
                  >
                    <span style={{ fontSize:13 }}>
                      {l.type==="textbox"?"T":l.type==="image"?"🖼":l.type==="rect"?"▭":l.type==="circle"?"◯":"◆"}
                    </span>
                    <span className="layer-label">{l.label}</span>
                    <span
                      style={{ opacity:.5, cursor:"pointer", fontSize:12 }}
                      onClick={e => {
                        e.stopPropagation();
                        l.obj.set("visible", !l.visible);
                        fabricRef.current?.renderAll();
                        syncLayers();
                      }}
                    >{l.visible ? "👁" : "🚫"}</span>
                  </div>
                );
              })}
            </>
          )}

          {activeTab === "api" && (
            <>
              <div className="panel-head">API Integration</div>
              <div className="api-section">
                <div style={{ fontSize:11, color:"var(--text3)", marginBottom:6 }}>Endpoint</div>
                <div className="api-endpoint">/generateCertificate</div>
                <button
                  className="tb-btn"
                  style={{ width:"100%", justifyContent:"center" }}
                  onClick={fetchFromAPI}
                  disabled={apiLoading}
                >
                  {apiLoading ? <><span className="loading-dot">⏳</span> Fetching…</> : "⬇ Fetch Data"}
                </button>
                {apiError && <div className="api-error">{apiError}</div>}
                {apiData && (
                  <>
                    <div className="api-data-preview">
                      {Object.entries(apiData).map(([k, v]) => (
                        <div key={k} className="api-kv">
                          <span className="api-key">{k}:</span>
                          <span className="api-val">{v}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      className="tb-primary"
                      style={{ width:"100%", justifyContent:"center", marginTop:8 }}
                      onClick={() => previewMode ? resetPreview() : populatePreview(apiData)}
                    >
                      {previewMode ? "↩ Reset Preview" : "▶ Preview with Data"}
                    </button>
                  </>
                )}
                {!apiData && !apiLoading && (
                  <button
                    className="tb-btn"
                    style={{ width:"100%", justifyContent:"center", marginTop:6, opacity:.8 }}
                    onClick={() => setApiData(SAMPLE_DATA)}
                  >
                    Use Sample Data
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── CANVAS AREA ── */}
        <div className="canvas-area" onClick={() => showFont && setShowFont(false)}>
          {!fabricReady && (
            <div style={{
              position:"absolute", inset:0, display:"flex",
              alignItems:"center", justifyContent:"center",
              flexDirection:"column", gap:12,
            }}>
              <div style={{ fontSize:24, animation:"spin 1s linear infinite" }}>⟳</div>
              <div style={{ fontSize:13, color:"var(--text3)" }}>Loading canvas engine…</div>
              <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
          <div className="canvas-shadow">
            <canvas ref={canvasRef}/>
          </div>

          {/* Zoom bar */}
          <div className="zoom-bar">
            <button className="zoom-btn" onClick={() => handleZoom(-0.1)}>−</button>
            <span className="zoom-pct">{Math.round(zoom * 100)}%</span>
            <button className="zoom-btn" onClick={() => handleZoom(+0.1)}>＋</button>
            <button className="zoom-btn" style={{ fontSize:11, width:"auto", padding:"0 8px" }} onClick={resetZoom}>Fit</button>
          </div>

          {previewMode && (
            <div className="preview-badge">
              <span className="preview-dot"/>
              Preview Mode — fields populated with live data
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          <div className="panel-head">Properties</div>

          {!selectedObj && (
            <div className="empty-selection">
              <div className="canvas-settings-title">Canvas Settings</div>
              <div className="prop-row">
                <div className="prop-label">Background Color</div>
                <input type="color" value={bgColor}
                  onChange={e => updateCanvasBg(e.target.value)}
                  style={{ width:"100%", height:34, border:"1px solid var(--border)", borderRadius:7, cursor:"pointer" }}
                />
              </div>
              <div className="prop-row">
                <div className="prop-label">Canvas Size</div>
                <div className="prop-row-split">
                  <input className="prop-input" type="number" placeholder="W" value={canvasSize.w}
                    onChange={e => setCanvasSize(s => ({ ...s, w: +e.target.value }))}/>
                  <input className="prop-input" type="number" placeholder="H" value={canvasSize.h}
                    onChange={e => setCanvasSize(s => ({ ...s, h: +e.target.value }))}/>
                </div>
              </div>
              <button className="tb-btn" style={{ width:"100%", justifyContent:"center" }} onClick={() => {
                const c = getFabric();
                if (!c) return;
                c.setWidth(canvasSize.w); c.setHeight(canvasSize.h); c.renderAll();
              }}>Apply Size</button>
              <div style={{ marginTop:18, padding:"12px", background:"var(--surface2)", borderRadius:8, border:"1px solid var(--border)" }}>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--text2)", marginBottom:6 }}>Quick Start</div>
                <div style={{ fontSize:11, color:"var(--text3)", lineHeight:1.6 }}>
                  • Click a field in the <b>Fields</b> tab to add dynamic data<br/>
                  • Use <b>API</b> tab to fetch real data<br/>
                  • Click any object to edit its properties<br/>
                  • Export as PNG when done
                </div>
              </div>
            </div>
          )}

          {selectedObj && (
            <div style={{ padding:12 }}>
              <div className="obj-type-badge">
                {selectedObj.type?.toUpperCase()}
                {selectedObj._fieldKey && <span className="obj-dynamic-tag">dynamic field</span>}
              </div>

              {/* Position */}
              <div className="prop-row">
                <div className="prop-label">Position (X · Y)</div>
                <div className="prop-row-split">
                  <input className="prop-input" type="number"
                    value={Math.round(selectedObj.left || 0)}
                    onChange={e => { applyToSelected({ left: +e.target.value }); }}/>
                  <input className="prop-input" type="number"
                    value={Math.round(selectedObj.top || 0)}
                    onChange={e => { applyToSelected({ top: +e.target.value }); }}/>
                </div>
              </div>

              <div className="prop-row">
                <div className="prop-label">Rotation (°)</div>
                <input className="prop-input" type="number"
                  value={Math.round(selectedObj.angle || 0)}
                  onChange={e => applyToSelected({ angle: +e.target.value })}/>
              </div>

              <div className="prop-row">
                <div className="prop-label">Opacity — {opacity}%</div>
                <input type="range" min={0} max={100} value={opacity}
                  onChange={e => { setOpacity(+e.target.value); applyToSelected({ opacity: +e.target.value / 100 }); }}/>
              </div>

              {/* TEXT PROPS */}
              {isText && (
                <>
                  <div className="prop-section-title">Text</div>
                  <div className="prop-row">
                    <div className="prop-label">Content</div>
                    <textarea
                      className="prop-input"
                      value={selectedObj.text || ""}
                      onChange={e => applyToSelected({ text: e.target.value })}
                    />
                  </div>
                  <div className="prop-row">
                    <div className="prop-label">Font Family</div>
                    <select className="select-input" value={activeFont}
                      onChange={e => applyFont(e.target.value)}>
                      {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="prop-row">
                    <div className="prop-label">Font Size</div>
                    <input className="prop-input" type="number" value={fontSize}
                      onChange={e => { setFontSize(+e.target.value); applyToSelected({ fontSize: +e.target.value }); }}/>
                  </div>
                  <div className="prop-row">
                    <div className="prop-label">Text Color</div>
                    <input type="color" value={textColor}
                      style={{ width:"100%", height:34, border:"1px solid var(--border)", borderRadius:7, cursor:"pointer" }}
                      onChange={e => { setTextColor(e.target.value); applyToSelected({ fill: e.target.value }); }}/>
                  </div>
                  <div className="prop-row">
                    <div className="prop-label">Letter Spacing</div>
                    <input className="prop-input" type="number"
                      value={selectedObj.charSpacing || 0}
                      onChange={e => applyToSelected({ charSpacing: +e.target.value })}/>
                  </div>
                  <div className="prop-row">
                    <div className="prop-label">Line Height</div>
                    <input className="prop-input" type="number" step={0.1}
                      value={selectedObj.lineHeight || 1.16}
                      onChange={e => applyToSelected({ lineHeight: +e.target.value })}/>
                  </div>
                </>
              )}

              {/* SHAPE PROPS */}
              {isShape && (
                <>
                  <div className="prop-section-title">Shape</div>
                  <div className="prop-row">
                    <div className="prop-label">Fill Color</div>
                    <input type="color" value={fillColor}
                      style={{ width:"100%", height:34, border:"1px solid var(--border)", borderRadius:7, cursor:"pointer" }}
                      onChange={e => { setFillColor(e.target.value); applyToSelected({ fill: e.target.value }); }}/>
                  </div>
                  <div className="prop-row">
                    <div className="prop-label">Border Color</div>
                    <input type="color" value={strokeColor}
                      style={{ width:"100%", height:34, border:"1px solid var(--border)", borderRadius:7, cursor:"pointer" }}
                      onChange={e => { setStrokeColor(e.target.value); applyToSelected({ stroke: e.target.value }); }}/>
                  </div>
                  <div className="prop-row">
                    <div className="prop-label">Border Width</div>
                    <input className="prop-input" type="number" value={strokeWidth}
                      onChange={e => { setStrokeWidth(+e.target.value); applyToSelected({ strokeWidth: +e.target.value }); }}/>
                  </div>
                  {selectedObj.type === "rect" && (
                    <div className="prop-row">
                      <div className="prop-label">Corner Radius</div>
                      <input className="prop-input" type="number"
                        value={selectedObj.rx || 0}
                        onChange={e => applyToSelected({ rx: +e.target.value, ry: +e.target.value })}/>
                    </div>
                  )}
                </>
              )}

              <div className="obj-actions">
                <button className="tb-btn" onClick={duplicateSelected}>⧉ Dup</button>
                <button className="tb-danger" onClick={deleteSelected}>✕ Delete</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}