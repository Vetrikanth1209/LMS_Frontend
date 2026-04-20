import { useEffect, useRef, useState, useCallback } from "react";

// ─── Google Fonts list (popular + elegant) ───────────────────────────────────
const GOOGLE_FONTS = [
  "Cinzel","Playfair Display","Cormorant Garamond","EB Garamond",
  "Libre Baskerville","Merriweather","Lora","Crimson Text",
  "Raleway","Montserrat","Josefin Sans","Nunito","Poppins",
  "Dancing Script","Great Vibes","Pacifico","Sacramento",
  "Oswald","Bebas Neue","Anton","Teko",
  "Source Serif Pro","Bitter","Domine","Spectral",
  "Roboto Slab","Zilla Slab","Arvo"
];

// ─── Mock backend fields (replace with your /generateCertificate response) ────
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

// ─── Sample data preview ──────────────────────────────────────────────────────
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

export default function Certificate_Generator() {
  const canvasRef     = useRef(null);
  const fabricRef     = useRef(null);
  const fileInputRef  = useRef(null);
  const bgInputRef    = useRef(null);

  const [selectedObj,   setSelectedObj]   = useState(null);
  const [zoom,          setZoom]          = useState(1);
  const [activeFont,    setActiveFont]    = useState("Cinzel");
  const [fontSize,      setFontSize]      = useState(28);
  const [textColor,     setTextColor]     = useState("#1a1a2e");
  const [fillColor,     setFillColor]     = useState("#3498db");
  const [strokeColor,   setStrokeColor]   = useState("#1a4a8a");
  const [strokeWidth,   setStrokeWidth]   = useState(2);
  const [opacity,       setOpacity]       = useState(100);
  const [layers,        setLayers]        = useState([]);
  const [fontsLoaded,   setFontsLoaded]   = useState(false);
  const [apiData,       setApiData]       = useState(null);
  const [apiLoading,    setApiLoading]    = useState(false);
  const [apiError,      setApiError]      = useState("");
  const [previewMode,   setPreviewMode]   = useState(false);
  const [showFontPanel, setShowFontPanel] = useState(false);
  const [fontSearch,    setFontSearch]    = useState("");
  const [activeTab,     setActiveTab]     = useState("fields"); // fields | layers | settings
  const [canvasSize,    setCanvasSize]    = useState({ w: 900, h: 636 });
  const [bgColor,       setBgColor]       = useState("#ffffff");

  // ─── Load Google Fonts ────────────────────────────────────────────────────
  useEffect(() => {
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${GOOGLE_FONTS.map(
      f => `family=${f.replace(/ /g, "+")}:ital,wght@0,400;0,700;1,400`
    ).join("&")}&display=swap`;
    document.head.appendChild(link);
    link.onload = () => setFontsLoaded(true);
    setTimeout(() => setFontsLoaded(true), 2000);
  }, []);

  // ─── Init Fabric canvas ───────────────────────────────────────────────────
  useEffect(() => {
    if (!window.fabric) return;
    const canvas = new window.fabric.Canvas(canvasRef.current, {
      width:           canvasSize.w,
      height:          canvasSize.h,
      backgroundColor: bgColor,
      preserveObjectStacking: true,
      selection:       true,
    });
    fabricRef.current = canvas;

    canvas.on("selection:created",  syncSelection);
    canvas.on("selection:updated",  syncSelection);
    canvas.on("selection:cleared",  () => { setSelectedObj(null); syncLayers(); });
    canvas.on("object:modified",    syncLayers);
    canvas.on("object:added",       syncLayers);
    canvas.on("object:removed",     syncLayers);

    addDefaultTemplate(canvas);
    return () => canvas.dispose();
  // eslint-disable-next-line
  }, []);

  const syncSelection = useCallback((e) => {
    const obj = fabricRef.current?.getActiveObject();
    setSelectedObj(obj || null);
    if (obj) {
      if (obj.type === "textbox" || obj.type === "i-text") {
        setActiveFont(obj.fontFamily || "Cinzel");
        setFontSize(obj.fontSize || 28);
        setTextColor(obj.fill || "#1a1a2e");
      }
      if (obj.fill && typeof obj.fill === "string") setFillColor(obj.fill);
      if (obj.stroke) setStrokeColor(obj.stroke);
      if (obj.strokeWidth) setStrokeWidth(obj.strokeWidth);
      setOpacity(Math.round((obj.opacity ?? 1) * 100));
    }
    syncLayers();
  }, []);

  const syncLayers = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objs = canvas.getObjects().map((o, i) => ({
      id:      i,
      type:    o.type,
      label:   o._fieldKey ? `{{${o._fieldKey}}}` : (o.type === "textbox" ? (o.text?.slice(0, 18) || "Text") : o.type),
      visible: o.visible !== false,
      obj:     o,
    }));
    setLayers([...objs].reverse());
  }, []);

  // ─── Default starter template ─────────────────────────────────────────────
  const addDefaultTemplate = (canvas) => {
    const W = canvas.width, H = canvas.height;

    // Outer border rect
    canvas.add(new window.fabric.Rect({
      left: 20, top: 20, width: W - 40, height: H - 40,
      fill: "transparent", stroke: "#bfa060", strokeWidth: 3, rx: 4, ry: 4,
      selectable: true,
    }));
    // Inner border
    canvas.add(new window.fabric.Rect({
      left: 32, top: 32, width: W - 64, height: H - 64,
      fill: "transparent", stroke: "#bfa060", strokeWidth: 1, rx: 2, ry: 2,
      selectable: true,
    }));

    // Title
    canvas.add(new window.fabric.Textbox("CERTIFICATE OF COMPLETION", {
      left: 0, top: 60, width: W,
      fontFamily: "Cinzel", fontSize: 32, fill: "#1a2a4a",
      fontWeight: "700", textAlign: "center",
    }));

    // Subtitle
    canvas.add(new window.fabric.Textbox("This is to certify that", {
      left: 0, top: 130, width: W,
      fontFamily: "Cormorant Garamond", fontSize: 18, fill: "#555",
      textAlign: "center",
    }));

    // Name placeholder
    const nameText = new window.fabric.Textbox("{{name}}", {
      left: 0, top: 160, width: W,
      fontFamily: "Great Vibes", fontSize: 48, fill: "#1a4a8a",
      textAlign: "center",
    });
    nameText._fieldKey = "name";
    canvas.add(nameText);

    // Underline
    canvas.add(new window.fabric.Line([180, 240, W - 180, 240], {
      stroke: "#bfa060", strokeWidth: 1.5,
    }));

    // Course info
    const courseText = new window.fabric.Textbox(
      "has successfully completed the course {{course}}\nduring {{duration}} with {{mark_percentage}} marks.", {
      left: 60, top: 260, width: W - 120,
      fontFamily: "Cormorant Garamond", fontSize: 18, fill: "#333",
      textAlign: "center", lineHeight: 1.6,
    });
    courseText._fieldKey = "course";
    canvas.add(courseText);

    // Details row
    const detailText = new window.fabric.Textbox(
      "Department: {{department}}   |   College: {{college}}", {
      left: 60, top: 350, width: W - 120,
      fontFamily: "Raleway", fontSize: 14, fill: "#444",
      textAlign: "center",
    });
    canvas.add(detailText);

    // Roll no + ID
    const bottomText = new window.fabric.Textbox(
      "Roll No: {{roll_no}}                                Certificate ID: {{certificate_id}}", {
      left: 60, top: 520, width: W - 120,
      fontFamily: "Raleway", fontSize: 12, fill: "#666",
      textAlign: "center",
    });
    canvas.add(bottomText);

    canvas.renderAll();
  };

  // ─── Text operations ──────────────────────────────────────────────────────
  const addText = () => {
    const t = new window.fabric.Textbox("Your text here", {
      left: 100, top: 100,
      fontFamily: activeFont, fontSize, fill: textColor,
      width: 300,
    });
    fabricRef.current.add(t);
    fabricRef.current.setActiveObject(t);
    fabricRef.current.renderAll();
  };

  const addFieldText = (field) => {
    const t = new window.fabric.Textbox(`{{${field.key}}}`, {
      left: 150, top: 200,
      fontFamily: activeFont, fontSize: 24, fill: textColor,
      width: 400,
    });
    t._fieldKey = field.key;
    fabricRef.current.add(t);
    fabricRef.current.setActiveObject(t);
    fabricRef.current.renderAll();
  };

  // ─── Shapes ───────────────────────────────────────────────────────────────
  const addRect = () => {
    fabricRef.current.add(new window.fabric.Rect({
      left: 100, top: 100, width: 200, height: 80,
      fill: fillColor, stroke: strokeColor, strokeWidth,
    }));
    fabricRef.current.renderAll();
  };

  const addCircle = () => {
    fabricRef.current.add(new window.fabric.Circle({
      left: 200, top: 150, radius: 50,
      fill: fillColor, stroke: strokeColor, strokeWidth,
    }));
    fabricRef.current.renderAll();
  };

  const addLine = () => {
    fabricRef.current.add(new window.fabric.Line([100, 200, 600, 200], {
      stroke: strokeColor, strokeWidth,
    }));
    fabricRef.current.renderAll();
  };

  const addTriangle = () => {
    fabricRef.current.add(new window.fabric.Triangle({
      left: 200, top: 100, width: 100, height: 80,
      fill: fillColor, stroke: strokeColor, strokeWidth,
    }));
    fabricRef.current.renderAll();
  };

  // ─── Image upload ─────────────────────────────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      window.fabric.Image.fromURL(ev.target.result, (img) => {
        img.scaleToWidth(150);
        img.set({ left: 80, top: 80 });
        fabricRef.current.add(img);
        fabricRef.current.setActiveObject(img);
        fabricRef.current.renderAll();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      window.fabric.Image.fromURL(ev.target.result, (img) => {
        const canvas = fabricRef.current;
        img.set({ left: 0, top: 0, selectable: false, evented: false });
        img.scaleToWidth(canvas.width);
        canvas.add(img);
        canvas.sendToBack(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ─── Property changes ─────────────────────────────────────────────────────
  const applyToSelected = (props) => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj) return;
    obj.set(props);
    fabricRef.current.renderAll();
  };

  const applyFont = (font) => {
    setActiveFont(font);
    applyToSelected({ fontFamily: font });
    setShowFontPanel(false);
  };

  // ─── Object operations ────────────────────────────────────────────────────
  const deleteSelected = () => {
    const canvas = fabricRef.current;
    const obj = canvas.getActiveObject();
    if (obj) { canvas.remove(obj); canvas.renderAll(); }
  };

  const duplicateSelected = () => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj) return;
    obj.clone((cloned) => {
      cloned.set({ left: obj.left + 20, top: obj.top + 20 });
      fabricRef.current.add(cloned);
      fabricRef.current.setActiveObject(cloned);
      fabricRef.current.renderAll();
    });
  };

  const bringForward  = () => { fabricRef.current?.bringForward(fabricRef.current.getActiveObject()); fabricRef.current?.renderAll(); };
  const sendBackward  = () => { fabricRef.current?.sendBackwards(fabricRef.current.getActiveObject()); fabricRef.current?.renderAll(); };
  const bringToFront  = () => { fabricRef.current?.bringToFront(fabricRef.current.getActiveObject()); fabricRef.current?.renderAll(); };
  const sendToBack    = () => { fabricRef.current?.sendToBack(fabricRef.current.getActiveObject()); fabricRef.current?.renderAll(); };

  // ─── Zoom ─────────────────────────────────────────────────────────────────
  const handleZoom = (delta) => {
    const newZoom = Math.min(3, Math.max(0.3, zoom + delta));
    setZoom(newZoom);
    const canvas = fabricRef.current;
    canvas.setZoom(newZoom);
    canvas.setWidth(canvasSize.w * newZoom);
    canvas.setHeight(canvasSize.h * newZoom);
    canvas.renderAll();
  };

  // ─── API fetch ────────────────────────────────────────────────────────────
  const fetchFromAPI = async () => {
    setApiLoading(true);
    setApiError("");
    try {
      const res = await fetch("/generateCertificate");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setApiData(data);
    } catch (err) {
      // Use mock data if API not available
      setApiData(SAMPLE_DATA);
      setApiError("API not reachable — using sample data for preview.");
    } finally {
      setApiLoading(false);
    }
  };

  // ─── Preview: replace {{field}} with real data ────────────────────────────
  const populatePreview = (data) => {
    const canvas = fabricRef.current;
    canvas.getObjects().forEach((obj) => {
      if (obj.type === "textbox" || obj.type === "i-text") {
        let text = obj.text;
        Object.entries(data).forEach(([k, v]) => {
          text = text.replaceAll(`{{${k}}}`, v);
        });
        obj._originalText = obj._originalText || obj.text;
        obj.set("text", text);
      }
    });
    canvas.renderAll();
    setPreviewMode(true);
  };

  const resetPreview = () => {
    const canvas = fabricRef.current;
    canvas.getObjects().forEach((obj) => {
      if (obj._originalText) {
        obj.set("text", obj._originalText);
        delete obj._originalText;
      }
    });
    canvas.renderAll();
    setPreviewMode(false);
  };

  // ─── Export ───────────────────────────────────────────────────────────────
  const exportPNG = () => {
    const canvas = fabricRef.current;
    const realZoom = canvas.getZoom();
    canvas.setZoom(1);
    canvas.setWidth(canvasSize.w);
    canvas.setHeight(canvasSize.h);
    const dataURL = canvas.toDataURL({ format: "png", quality: 1, multiplier: 2 });
    canvas.setZoom(realZoom);
    canvas.setWidth(canvasSize.w * realZoom);
    canvas.setHeight(canvasSize.h * realZoom);
    canvas.renderAll();
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = "certificate.png";
    a.click();
  };

  const exportJSON = () => {
    const json = fabricRef.current.toJSON(["_fieldKey", "_originalText"]);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "certificate-template.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const json = JSON.parse(ev.target.result);
      fabricRef.current.loadFromJSON(json, () => fabricRef.current.renderAll());
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const updateCanvasBackground = (color) => {
    setBgColor(color);
    fabricRef.current.setBackgroundColor(color, () => fabricRef.current.renderAll());
  };

  const filteredFonts = GOOGLE_FONTS.filter(f =>
    f.toLowerCase().includes(fontSearch.toLowerCase())
  );

  // ─── Styles ───────────────────────────────────────────────────────────────
  const S = {
    app: {
      display: "flex", flexDirection: "column", height: "100vh",
      background: "#0e1117", fontFamily: "'Raleway', sans-serif",
      color: "#e0e0e0", overflow: "hidden",
    },
    topbar: {
      background: "#161b27", borderBottom: "1px solid #252d40",
      padding: "0 12px", display: "flex", alignItems: "center",
      gap: 6, height: 52, flexShrink: 0, flexWrap: "nowrap", overflowX: "auto",
    },
    logo: {
      fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700,
      color: "#c9a84c", letterSpacing: 1, marginRight: 12, whiteSpace: "nowrap",
    },
    sep: { width: 1, height: 28, background: "#252d40", flexShrink: 0 },
    btn: {
      background: "#1e2535", border: "1px solid #2d3a55",
      color: "#cdd6f4", padding: "5px 11px", borderRadius: 7,
      cursor: "pointer", fontSize: 12, whiteSpace: "nowrap",
      transition: "all .15s", fontFamily: "'Raleway', sans-serif",
    },
    btnPrimary: {
      background: "#c9a84c", border: "1px solid #a8883c",
      color: "#1a1200", padding: "5px 12px", borderRadius: 7,
      cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
      fontFamily: "'Raleway', sans-serif",
    },
    btnDanger: {
      background: "#3a1e1e", border: "1px solid #6b2b2b",
      color: "#ff8a8a", padding: "5px 11px", borderRadius: 7,
      cursor: "pointer", fontSize: 12, whiteSpace: "nowrap",
      fontFamily: "'Raleway', sans-serif",
    },
    iconBtn: {
      background: "#1e2535", border: "1px solid #2d3a55",
      color: "#cdd6f4", width: 30, height: 30, borderRadius: 7,
      cursor: "pointer", fontSize: 14, display: "flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    colorInput: {
      width: 30, height: 30, border: "1px solid #2d3a55",
      borderRadius: 7, cursor: "pointer", padding: 2,
      background: "transparent",
    },
    numInput: {
      background: "#1e2535", border: "1px solid #2d3a55",
      color: "#cdd6f4", padding: "4px 6px", borderRadius: 6,
      fontSize: 12, width: 52, fontFamily: "'Raleway', sans-serif",
    },
    workspace: { display: "flex", flex: 1, overflow: "hidden" },
    leftPanel: {
      width: 210, background: "#131720",
      borderRight: "1px solid #1e2535", display: "flex",
      flexDirection: "column", overflowY: "auto", flexShrink: 0,
    },
    rightPanel: {
      width: 220, background: "#131720",
      borderLeft: "1px solid #1e2535", display: "flex",
      flexDirection: "column", overflowY: "auto", flexShrink: 0,
    },
    canvasArea: {
      flex: 1, display: "flex", alignItems: "center",
      justifyContent: "center", background: "#0a0d14",
      backgroundImage: "radial-gradient(circle at 50% 50%, #111827 0%, #0a0d14 100%)",
      overflow: "auto", position: "relative",
    },
    panelTitle: {
      padding: "8px 12px", fontSize: 10, fontWeight: 700,
      color: "#5a6a8a", textTransform: "uppercase", letterSpacing: 1.5,
      background: "#0e1117", borderBottom: "1px solid #1e2535",
    },
    panelBody: { padding: "10px 10px" },
    fieldChip: {
      background: "#1a2035", border: "1px solid #2a3550",
      borderRadius: 8, padding: "7px 10px", marginBottom: 5,
      cursor: "pointer", fontSize: 12, display: "flex",
      alignItems: "center", gap: 7, transition: "all .15s",
    },
    tabRow: {
      display: "flex", borderBottom: "1px solid #1e2535",
    },
    tab: (active) => ({
      flex: 1, padding: "8px 4px", fontSize: 11, textAlign: "center",
      cursor: "pointer", background: active ? "#1e2535" : "transparent",
      color: active ? "#c9a84c" : "#5a6a8a",
      borderBottom: active ? "2px solid #c9a84c" : "2px solid transparent",
      transition: "all .15s",
    }),
    propLabel: { fontSize: 11, color: "#5a6a8a", marginBottom: 3 },
    propInput: {
      width: "100%", background: "#1e2535", border: "1px solid #2d3a55",
      color: "#cdd6f4", padding: "5px 8px", borderRadius: 6,
      fontSize: 12, fontFamily: "'Raleway', sans-serif",
    },
    propRow: { marginBottom: 10 },
    layerItem: (sel) => ({
      padding: "6px 10px", fontSize: 11, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 6,
      borderBottom: "1px solid #1a2035",
      background: sel ? "#1e2a45" : "transparent",
      color: sel ? "#c9a84c" : "#8a9aba",
    }),
    fontPicker: {
      position: "absolute", top: 52, left: 0, right: 0,
      background: "#161b27", border: "1px solid #252d40",
      zIndex: 100, maxHeight: 320, overflowY: "auto",
      boxShadow: "0 8px 32px rgba(0,0,0,.5)", borderRadius: "0 0 10px 10px",
    },
    fontItem: {
      padding: "9px 14px", cursor: "pointer", fontSize: 14,
      borderBottom: "1px solid #1a2030",
    },
    apiSection: {
      padding: 10, borderBottom: "1px solid #1e2535",
    },
    dataPreview: {
      background: "#0e1117", borderRadius: 6, padding: 8,
      fontSize: 11, color: "#8a9aba", marginTop: 6,
      border: "1px solid #1e2535", maxHeight: 180, overflowY: "auto",
    },
  };

  const isText = selectedObj && (selectedObj.type === "textbox" || selectedObj.type === "i-text");
  const isShape = selectedObj && !isText;

  return (
    <div style={S.app}>
      {/* ─── TOPBAR ─── */}
      <div style={S.topbar}>
        <span style={S.logo}>✦ CertMaker</span>
        <div style={S.sep}/>

        {/* Add elements */}
        <button style={S.btn} onClick={addText}>＋ Text</button>
        <button style={S.btn} onClick={addRect}>▭ Rect</button>
        <button style={S.btn} onClick={addCircle}>◯ Circle</button>
        <button style={S.btn} onClick={addLine}>╌ Line</button>
        <button style={S.btn} onClick={addTriangle}>△ Triangle</button>
        <button style={S.btn} onClick={() => fileInputRef.current.click()}>🖼 Image</button>
        <button style={S.btn} onClick={() => bgInputRef.current.click()}>🌄 BG</button>
        <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImageUpload}/>
        <input ref={bgInputRef}   type="file" accept="image/*" style={{display:"none"}} onChange={handleBgUpload}/>

        <div style={S.sep}/>

        {/* Font selector */}
        <div style={{ position: "relative" }}>
          <button
            style={{ ...S.btn, minWidth: 140, fontFamily: activeFont, justifyContent: "space-between", display: "flex", alignItems: "center" }}
            onClick={() => setShowFontPanel(v => !v)}
          >
            <span style={{ fontFamily: activeFont }}>{activeFont}</span>
            <span style={{ marginLeft: 6, opacity: .6, fontFamily: "sans-serif" }}>▾</span>
          </button>
          {showFontPanel && (
            <div style={S.fontPicker}>
              <div style={{ padding: "6px 10px", borderBottom: "1px solid #252d40" }}>
                <input
                  style={{ ...S.propInput, width: "100%" }}
                  placeholder="Search fonts..."
                  value={fontSearch}
                  onChange={e => setFontSearch(e.target.value)}
                  autoFocus
                />
              </div>
              {filteredFonts.map(f => (
                <div
                  key={f}
                  style={{ ...S.fontItem, fontFamily: f, color: activeFont === f ? "#c9a84c" : "#cdd6f4" }}
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
          style={S.numInput} type="number" value={fontSize} min={6} max={200}
          onChange={e => { setFontSize(+e.target.value); applyToSelected({ fontSize: +e.target.value }); }}
        />

        {/* Style buttons */}
        <button style={S.iconBtn} title="Bold"      onClick={() => applyToSelected({ fontWeight: selectedObj?.fontWeight === "bold" ? "normal" : "bold" })}><b>B</b></button>
        <button style={S.iconBtn} title="Italic"    onClick={() => applyToSelected({ fontStyle: selectedObj?.fontStyle === "italic" ? "normal" : "italic" })}><i>I</i></button>
        <button style={S.iconBtn} title="Underline" onClick={() => applyToSelected({ underline: !selectedObj?.underline })}><u>U</u></button>
        <button style={S.iconBtn} title="Left"   onClick={() => applyToSelected({ textAlign: "left" })}>◁</button>
        <button style={S.iconBtn} title="Center" onClick={() => applyToSelected({ textAlign: "center" })}>◈</button>
        <button style={S.iconBtn} title="Right"  onClick={() => applyToSelected({ textAlign: "right" })}>▷</button>

        <div style={S.sep}/>

        {/* Colors */}
        <label style={{ fontSize: 10, color: "#5a6a8a" }}>Text</label>
        <input type="color" style={S.colorInput} value={textColor}
          onChange={e => { setTextColor(e.target.value); applyToSelected({ fill: e.target.value }); }}/>
        <label style={{ fontSize: 10, color: "#5a6a8a" }}>Fill</label>
        <input type="color" style={S.colorInput} value={fillColor}
          onChange={e => { setFillColor(e.target.value); applyToSelected({ fill: e.target.value }); }}/>
        <label style={{ fontSize: 10, color: "#5a6a8a" }}>Border</label>
        <input type="color" style={S.colorInput} value={strokeColor}
          onChange={e => { setStrokeColor(e.target.value); applyToSelected({ stroke: e.target.value }); }}/>

        <div style={S.sep}/>

        {/* Object ops */}
        <button style={S.iconBtn} title="Bring Forward" onClick={bringForward}>↑</button>
        <button style={S.iconBtn} title="Send Backward"  onClick={sendBackward}>↓</button>
        <button style={S.iconBtn} title="Bring to Front" onClick={bringToFront}>⇑</button>
        <button style={S.iconBtn} title="Send to Back"   onClick={sendToBack}>⇓</button>
        <button style={S.iconBtn} title="Duplicate"      onClick={duplicateSelected}>⧉</button>
        <button style={{ ...S.iconBtn, color: "#ff8a8a" }} title="Delete" onClick={deleteSelected}>✕</button>

        <div style={S.sep}/>

        {/* Export */}
        <button style={S.btnPrimary} onClick={exportPNG}>⬇ PNG</button>
        <button style={S.btn} onClick={exportJSON}>⬇ JSON</button>
        <label style={{ ...S.btn, cursor: "pointer" }}>
          ⬆ Import
          <input type="file" accept=".json" style={{ display: "none" }} onChange={importJSON}/>
        </label>
      </div>

      {/* ─── WORKSPACE ─── */}
      <div style={S.workspace}>

        {/* ── LEFT PANEL ── */}
        <div style={S.leftPanel}>
          <div style={S.tabRow}>
            {["fields","layers","api"].map(t => (
              <div key={t} style={S.tab(activeTab === t)} onClick={() => setActiveTab(t)}>
                {t === "fields" ? "Fields" : t === "layers" ? "Layers" : "API"}
              </div>
            ))}
          </div>

          {activeTab === "fields" && (
            <>
              <div style={S.panelTitle}>Backend Data Fields</div>
              <div style={S.panelBody}>
                <p style={{ fontSize: 11, color: "#5a6a8a", marginBottom: 8 }}>
                  Click to add to canvas. Drag to position.
                </p>
                {BACKEND_FIELDS.map(f => (
                  <div key={f.key} style={S.fieldChip}
                    onClick={() => addFieldText(f)}
                    onMouseEnter={e => e.currentTarget.style.background = "#25304d"}
                    onMouseLeave={e => e.currentTarget.style.background = "#1a2035"}
                  >
                    <span>{f.icon}</span>
                    <div>
                      <div style={{ color: "#cdd6f4", fontWeight: 600 }}>{f.label}</div>
                      <div style={{ color: "#5a6a8a", fontSize: 10 }}>{`{{${f.key}}}`}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={S.panelTitle}>Quick Shapes</div>
              <div style={{ ...S.panelBody, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  { label: "Rectangle", fn: addRect, icon: "▭" },
                  { label: "Circle",    fn: addCircle, icon: "◯" },
                  { label: "Line",      fn: addLine, icon: "—" },
                  { label: "Triangle",  fn: addTriangle, icon: "△" },
                ].map(s => (
                  <button key={s.label} style={{
                    background: "#1a2035", border: "1px solid #2a3550",
                    color: "#cdd6f4", borderRadius: 8, padding: "10px 6px",
                    cursor: "pointer", fontSize: 11, textAlign: "center",
                  }} onClick={s.fn}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
                    {s.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === "layers" && (
            <>
              <div style={S.panelTitle}>Layers</div>
              {layers.map((l, i) => (
                <div key={i} style={S.layerItem(fabricRef.current?.getActiveObject() === l.obj)}
                  onClick={() => { fabricRef.current.setActiveObject(l.obj); fabricRef.current.renderAll(); syncSelection(); }}
                >
                  <span style={{ fontSize: 13 }}>
                    {l.type === "textbox" ? "T" : l.type === "image" ? "🖼" : l.type === "rect" ? "▭" : l.type === "circle" ? "◯" : "◆"}
                  </span>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.label}</span>
                  <span
                    style={{ opacity: .5, cursor: "pointer", fontSize: 12 }}
                    onClick={e => {
                      e.stopPropagation();
                      l.obj.set("visible", !l.visible);
                      fabricRef.current.renderAll();
                      syncLayers();
                    }}
                  >{l.visible ? "👁" : "🚫"}</span>
                </div>
              ))}
            </>
          )}

          {activeTab === "api" && (
            <>
              <div style={S.panelTitle}>API Integration</div>
              <div style={S.apiSection}>
                <div style={{ fontSize: 11, color: "#5a6a8a", marginBottom: 8 }}>
                  Endpoint: <span style={{ color: "#c9a84c", fontFamily: "monospace" }}>/generateCertificate</span>
                </div>
                <button
                  style={{ ...S.btn, width: "100%", marginBottom: 6, textAlign: "center" }}
                  onClick={fetchFromAPI}
                  disabled={apiLoading}
                >
                  {apiLoading ? "⏳ Fetching..." : "⬇ Fetch Data"}
                </button>
                {apiError && <div style={{ fontSize: 10, color: "#f0a070", marginBottom: 6 }}>{apiError}</div>}
                {apiData && (
                  <>
                    <div style={S.dataPreview}>
                      {Object.entries(apiData).map(([k, v]) => (
                        <div key={k} style={{ marginBottom: 3 }}>
                          <span style={{ color: "#c9a84c" }}>{k}:</span>{" "}
                          <span style={{ color: "#cdd6f4" }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      style={{ ...S.btnPrimary, width: "100%", marginTop: 8, textAlign: "center" }}
                      onClick={() => previewMode ? resetPreview() : populatePreview(apiData)}
                    >
                      {previewMode ? "↩ Reset Preview" : "▶ Preview with Data"}
                    </button>
                  </>
                )}
                {!apiData && !apiLoading && (
                  <button style={{ ...S.btn, width: "100%", textAlign: "center", opacity: .6 }}
                    onClick={() => { setApiData(SAMPLE_DATA); }}>
                    Use Sample Data
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── CANVAS AREA ── */}
        <div style={S.canvasArea} onClick={() => showFontPanel && setShowFontPanel(false)}>
          <div style={{
            boxShadow: "0 0 60px rgba(201,168,76,.15), 0 4px 40px rgba(0,0,0,.7)",
            borderRadius: 2,
          }}>
            <canvas ref={canvasRef} />
          </div>

          {/* Zoom controls */}
          <div style={{ position: "absolute", bottom: 14, right: 14, display: "flex", gap: 4, alignItems: "center" }}>
            <button style={{ ...S.iconBtn, borderRadius: 6 }} onClick={() => handleZoom(-0.1)}>−</button>
            <span style={{ background: "#161b27", border: "1px solid #1e2535", color: "#c9a84c", padding: "4px 10px", borderRadius: 6, fontSize: 11, minWidth: 48, textAlign: "center" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button style={{ ...S.iconBtn, borderRadius: 6 }} onClick={() => handleZoom(+0.1)}>＋</button>
            <button style={{ ...S.btn, fontSize: 11 }} onClick={() => { setZoom(1); fabricRef.current.setZoom(1); fabricRef.current.setWidth(canvasSize.w); fabricRef.current.setHeight(canvasSize.h); fabricRef.current.renderAll(); }}>Fit</button>
          </div>

          {previewMode && (
            <div style={{
              position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
              background: "#c9a84c", color: "#1a1200", padding: "5px 18px",
              borderRadius: 20, fontSize: 12, fontWeight: 700,
            }}>
              ● Preview Mode — fields populated with real data
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={S.rightPanel}>
          <div style={S.panelTitle}>Properties</div>

          {!selectedObj && (
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 11, color: "#5a6a8a", marginBottom: 12 }}>Canvas Settings</div>
              <div style={S.propRow}>
                <div style={S.propLabel}>Background Color</div>
                <input type="color" value={bgColor}
                  onChange={e => updateCanvasBackground(e.target.value)}
                  style={{ width: "100%", height: 32, border: "1px solid #2d3a55", borderRadius: 6, cursor: "pointer" }}
                />
              </div>
              <div style={S.propRow}>
                <div style={S.propLabel}>Width × Height</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...S.propInput, width: 70 }} type="number" value={canvasSize.w}
                    onChange={e => setCanvasSize(s => ({ ...s, w: +e.target.value }))}/>
                  <span style={{ color: "#5a6a8a", alignSelf: "center" }}>×</span>
                  <input style={{ ...S.propInput, width: 70 }} type="number" value={canvasSize.h}
                    onChange={e => setCanvasSize(s => ({ ...s, h: +e.target.value }))}/>
                </div>
              </div>
              <button style={{ ...S.btn, width: "100%", marginTop: 4 }} onClick={() => {
                fabricRef.current.setWidth(canvasSize.w);
                fabricRef.current.setHeight(canvasSize.h);
                fabricRef.current.renderAll();
              }}>Apply Size</button>
            </div>
          )}

          {selectedObj && (
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: 11, color: "#c9a84c", marginBottom: 10, fontWeight: 700 }}>
                {selectedObj.type?.toUpperCase()}
                {selectedObj._fieldKey && <span style={{ color: "#5a6a8a", marginLeft: 6 }}>(dynamic)</span>}
              </div>

              {/* Position & Size */}
              <div style={S.propRow}>
                <div style={S.propLabel}>Position (X, Y)</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input style={{ ...S.propInput, width: 70 }} type="number"
                    value={Math.round(selectedObj.left || 0)}
                    onChange={e => { applyToSelected({ left: +e.target.value }); }}/>
                  <input style={{ ...S.propInput, width: 70 }} type="number"
                    value={Math.round(selectedObj.top || 0)}
                    onChange={e => { applyToSelected({ top: +e.target.value }); }}/>
                </div>
              </div>

              <div style={S.propRow}>
                <div style={S.propLabel}>Rotation (°)</div>
                <input style={S.propInput} type="number"
                  value={Math.round(selectedObj.angle || 0)}
                  onChange={e => { applyToSelected({ angle: +e.target.value }); }}/>
              </div>

              <div style={S.propRow}>
                <div style={S.propLabel}>Opacity (%)</div>
                <input style={S.propInput} type="range" min={0} max={100} value={opacity}
                  onChange={e => { setOpacity(+e.target.value); applyToSelected({ opacity: +e.target.value / 100 }); }}/>
                <span style={{ fontSize: 11, color: "#8a9aba", marginTop: 2 }}>{opacity}%</span>
              </div>

              {isText && (
                <>
                  <div style={{ ...S.panelTitle, margin: "8px -10px", padding: "6px 10px" }}>Text</div>
                  <div style={S.propRow}>
                    <div style={S.propLabel}>Content</div>
                    <textarea
                      style={{ ...S.propInput, height: 70, resize: "vertical" }}
                      value={selectedObj.text || ""}
                      onChange={e => { applyToSelected({ text: e.target.value }); }}
                    />
                  </div>
                  <div style={S.propRow}>
                    <div style={S.propLabel}>Font Family</div>
                    <select style={S.propInput} value={activeFont}
                      onChange={e => applyFont(e.target.value)}>
                      {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div style={S.propRow}>
                    <div style={S.propLabel}>Font Size</div>
                    <input style={S.propInput} type="number" value={fontSize}
                      onChange={e => { setFontSize(+e.target.value); applyToSelected({ fontSize: +e.target.value }); }}/>
                  </div>
                  <div style={S.propRow}>
                    <div style={S.propLabel}>Color</div>
                    <input type="color" value={textColor} style={{ ...S.colorInput, width: "100%", height: 32 }}
                      onChange={e => { setTextColor(e.target.value); applyToSelected({ fill: e.target.value }); }}/>
                  </div>
                  <div style={S.propRow}>
                    <div style={S.propLabel}>Letter Spacing</div>
                    <input style={S.propInput} type="number"
                      value={selectedObj.charSpacing || 0}
                      onChange={e => applyToSelected({ charSpacing: +e.target.value })}/>
                  </div>
                  <div style={S.propRow}>
                    <div style={S.propLabel}>Line Height</div>
                    <input style={S.propInput} type="number" step={0.1}
                      value={selectedObj.lineHeight || 1.16}
                      onChange={e => applyToSelected({ lineHeight: +e.target.value })}/>
                  </div>
                </>
              )}

              {isShape && (
                <>
                  <div style={{ ...S.panelTitle, margin: "8px -10px", padding: "6px 10px" }}>Shape</div>
                  <div style={S.propRow}>
                    <div style={S.propLabel}>Fill Color</div>
                    <input type="color" value={fillColor} style={{ ...S.colorInput, width: "100%", height: 32 }}
                      onChange={e => { setFillColor(e.target.value); applyToSelected({ fill: e.target.value }); }}/>
                  </div>
                  <div style={S.propRow}>
                    <div style={S.propLabel}>Border Color</div>
                    <input type="color" value={strokeColor} style={{ ...S.colorInput, width: "100%", height: 32 }}
                      onChange={e => { setStrokeColor(e.target.value); applyToSelected({ stroke: e.target.value }); }}/>
                  </div>
                  <div style={S.propRow}>
                    <div style={S.propLabel}>Border Width</div>
                    <input style={S.propInput} type="number" value={strokeWidth}
                      onChange={e => { setStrokeWidth(+e.target.value); applyToSelected({ strokeWidth: +e.target.value }); }}/>
                  </div>
                  {selectedObj.type === "rect" && (
                    <div style={S.propRow}>
                      <div style={S.propLabel}>Corner Radius</div>
                      <input style={S.propInput} type="number"
                        value={selectedObj.rx || 0}
                        onChange={e => applyToSelected({ rx: +e.target.value, ry: +e.target.value })}/>
                    </div>
                  )}
                </>
              )}

              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                <button style={{ ...S.btn, flex: 1 }} onClick={duplicateSelected}>⧉ Dup</button>
                <button style={{ ...S.btnDanger, flex: 1 }} onClick={deleteSelected}>✕ Del</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}