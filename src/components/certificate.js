import { forwardRef, useImperativeHandle, useState } from "react";
import jsPDF from "jspdf";
import dayjs from "dayjs";
import {
  fetchOrGenerateCertificates,
  getUserById,
  getModuleById,
  fetchAggregateScores,
} from "../axios";
import {
  Dialog,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon            from "@mui/icons-material/Close";
import CheckCircleIcon      from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon     from "@mui/icons-material/ErrorOutline";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

import TEMPLATE_JSON from "../assests/certificate-template.json";
import "../styles/Certificate_Generator.css";

// ─────────────────────────────────────────────────────────────────────────────
//  THE CORRECT PIPELINE (read this before touching anything):
//
//  1. Read jsonW × jsonH from the template (the CertMaker workspace size).
//  2. Create an offscreen canvas EXACTLY jsonW × jsonH pixels — 1:1 mapping,
//     no scaling yet. This means every coordinate from the JSON maps directly.
//  3. Draw all objects at their exact JSON coordinates (after origin correction).
//  4. Use toDataURL to get a JPEG of that canvas.
//  5. Create jsPDF with a custom page whose mm dimensions preserve the
//     JSON aspect ratio:  pdfW = LONG_EDGE,  pdfH = LONG_EDGE / (jsonW/jsonH)
//  6. addImage(jpeg, "JPEG", 0, 0, pdfW, pdfH) — fills the ENTIRE page.
//
//  WHY this works:
//  - jsPDF "mm" unit means the numbers you pass to addImage ARE millimetres.
//    If page is 297×210 mm and you addImage at (0,0,297,210) it fills the page.
//  - The canvas pixel count does NOT matter for PDF output quality —
//    what matters is the mm dimensions you tell jsPDF.
//  - To get sharper output, we render the canvas at SCALE × jsonW/H pixels,
//    but the PDF dimensions stay the same mm values.
// ─────────────────────────────────────────────────────────────────────────────

const PDF_LONG_EDGE_MM = 297;  // mm — change to 210 for A5, etc.
const CANVAS_SCALE     = 3;    // render 3× bigger than JSON for sharpness

// ─── Load an <img> element from a URL ────────────────────────────────────────
const loadImage = (src) =>
  new Promise((resolve, reject) => {
    if (!src) { reject(new Error("No src")); return; }
    const img       = new Image();
    img.crossOrigin = "anonymous";
    img.onload      = () => resolve(img);
    img.onerror     = () => reject(new Error(`Image load failed: ${src}`));
    img.src         = src;
  });

// ─── Inject a Google Font link and wait for browser to parse it ───────────────
const loadGoogleFont = (fontFamily) =>
  new Promise((resolve) => {
    const skip = !fontFamily
      || fontFamily.toLowerCase() === "times new roman"
      || fontFamily.toLowerCase() === "serif"
      || fontFamily.toLowerCase() === "sans-serif"
      || fontFamily.toLowerCase() === "monospace";
    if (skip) { resolve(); return; }

    const id = `gfont-${fontFamily.replace(/ /g, "_")}`;
    if (document.getElementById(id)) { resolve(); return; }

    const link   = document.createElement("link");
    link.id      = id;
    link.rel     = "stylesheet";
    link.href    = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, "+")}:ital,wght@0,400;0,600;0,700;1,400;1,700&display=swap`;
    link.onload  = () => setTimeout(resolve, 1000); // 1 s for browser rasteriser
    link.onerror = resolve;                          // don't crash if font 404s
    document.head.appendChild(link);
  });

// ─── Build the data-substitution map ─────────────────────────────────────────
const buildDataMap = (certId, apiData) => ({
  name:            apiData.full_name    || "",
  full_name:       apiData.full_name    || "",
  student_name:    apiData.full_name    || "",
  roll_no:         apiData.rollno       || "",
  rollno:          apiData.rollno       || "",
  roll:            apiData.rollno       || "",
  department:      apiData.department   || "",
  dept:            apiData.department   || "",
  college:         apiData.college      || "",
  institution:     apiData.college      || "",
  course:          apiData.mod_name     || "",
  mod_name:        apiData.mod_name     || "",
  module:          apiData.mod_name     || "",
  course_name:     apiData.mod_name     || "",
  duration:        apiData.mod_duration || "",
  mod_duration:    apiData.mod_duration || "",
  period:          apiData.mod_duration || "",
  mark_percentage: `${Number(apiData.mark_percentage || 0).toFixed(2)}%`,
  percentage:      `${Number(apiData.mark_percentage || 0).toFixed(2)}%`,
  marks:           `${Number(apiData.mark_percentage || 0).toFixed(2)}%`,
  score:           `${Number(apiData.mark_percentage || 0).toFixed(2)}%`,
  certificate_id:  certId              || "",
  cert_id:         certId              || "",
  issue_date:      dayjs().format("DD-MM-YYYY"),
  date:            dayjs().format("DD-MM-YYYY"),
  year:            dayjs().format("YYYY"),
});

// ─── Replace every {{token}} in a string ─────────────────────────────────────
const fillTokens = (text, dataMap) =>
  (text || "").replace(/\{\{(\w+)\}\}/g, (_, key) =>
    key in dataMap ? String(dataMap[key]) : ""
  );

// ─────────────────────────────────────────────────────────────────────────────
//  POSITION RESOLVER
//
//  Fabric stores `left` / `top` as the position of the object's ORIGIN POINT.
//  originX / originY describe which point that is:
//    "left"   / "top"    → the top-left corner  (nothing to adjust)
//    "center" / "center" → the centre           (subtract half the size)
//    "right"  / "bottom" → the far corner       (subtract the full size)
//
//  `scaleX` / `scaleY` multiply the declared `width` / `height`.
//  All numbers are in JSON coordinate space; multiply by `s` for canvas pixels.
// ─────────────────────────────────────────────────────────────────────────────
const getRect = (obj, s) => {
  const sw = (obj.scaleX || 1);
  const sh = (obj.scaleY || 1);
  const rw = (obj.width  || 0) * sw;
  const rh = (obj.height || 0) * sh;

  let x = obj.left || 0;
  let y = obj.top  || 0;

  // Correct for horizontal origin
  if      (obj.originX === "center") x -= rw / 2;
  else if (obj.originX === "right")  x -= rw;
  // "left" (default) needs no adjustment

  // Correct for vertical origin
  if      (obj.originY === "center") y -= rh / 2;
  else if (obj.originY === "bottom") y -= rh;
  // "top" (default) needs no adjustment

  return { x: x * s, y: y * s, w: rw * s, h: rh * s };
};

// ─── Rotate ctx around a point ───────────────────────────────────────────────
const rotateAround = (ctx, cx, cy, angleDeg) => {
  ctx.translate(cx, cy);
  ctx.rotate((angleDeg * Math.PI) / 180);
  ctx.translate(-cx, -cy);
};

// ─── Draw word-wrapped text, return the Y after the last line ─────────────────
const drawWrappedText = (ctx, text, ax, y, boxW, lineH) => {
  for (const rawLine of text.split("\n")) {
    if (boxW <= 10) {
      ctx.fillText(rawLine, ax, y);
      y += lineH;
      continue;
    }
    let line = "";
    for (const word of rawLine.split(" ")) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > boxW && line) {
        ctx.fillText(line, ax, y);
        line = word;
        y += lineH;
      } else {
        line = test;
      }
    }
    if (line) { ctx.fillText(line, ax, y); y += lineH; }
  }
  return y;
};

// ─────────────────────────────────────────────────────────────────────────────
//  CORE RENDERER
//  Takes the Fabric.js JSON + filled dataMap, returns a canvas element
//  whose pixels exactly represent the certificate at CANVAS_SCALE resolution.
// ─────────────────────────────────────────────────────────────────────────────
const renderToCanvas = async (dataMap) => {
  if (!TEMPLATE_JSON?.objects?.length) {
    throw new Error(
      "certificate-template.json is empty or missing. " +
      "Export from CertMaker → src/assests/certificate-template.json"
    );
  }

  const objects = TEMPLATE_JSON.objects;
  const jsonW   = TEMPLATE_JSON.width  || 900;
  const jsonH   = TEMPLATE_JSON.height || 636;
  const s       = CANVAS_SCALE;            // pixels per JSON unit

  // ── Load all fonts first ────────────────────────────────────────────────
  const fonts = [...new Set(
    objects
      .filter(o => o.type === "textbox" || o.type === "i-text")
      .map(o => o.fontFamily)
      .filter(Boolean)
  )];
  await Promise.all(fonts.map(loadGoogleFont));

  // ── Create canvas at scaled resolution ─────────────────────────────────
  const canvas  = document.createElement("canvas");
  canvas.width  = jsonW * s;
  canvas.height = jsonH * s;
  const ctx     = canvas.getContext("2d");

  // Background colour (from template)
  ctx.fillStyle = TEMPLATE_JSON.background || "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ── Render each object ──────────────────────────────────────────────────
  for (const obj of objects) {
    if (obj.visible === false) continue;

    const { x, y, w, h } = getRect(obj, s);
    const opacity         = obj.opacity ?? 1;

    ctx.save();
    ctx.globalAlpha = opacity;

    if (obj.angle) {
      rotateAround(ctx, x + w / 2, y + h / 2, obj.angle);
    }

    // ── RECT ──────────────────────────────────────────────────────────────
    if (obj.type === "rect") {
      ctx.beginPath();
      const rx = (obj.rx || 0) * s;
      if (rx && ctx.roundRect) ctx.roundRect(x, y, w, h, rx);
      else ctx.rect(x, y, w, h);
      if (obj.fill   && obj.fill   !== "transparent") { ctx.fillStyle   = obj.fill;   ctx.fill();   }
      if (obj.stroke && obj.stroke !== "transparent" && (obj.strokeWidth || 0) > 0) {
        ctx.strokeStyle = obj.stroke;
        ctx.lineWidth   = obj.strokeWidth * s;
        ctx.stroke();
      }
      ctx.restore(); continue;
    }

    // ── CIRCLE / ELLIPSE ──────────────────────────────────────────────────
    if (obj.type === "circle" || obj.type === "ellipse") {
      const rx = obj.type === "circle"
        ? (obj.radius || 0) * (obj.scaleX || 1) * s
        : (obj.rx || obj.width  / 2 || 50) * (obj.scaleX || 1) * s;
      const ry = obj.type === "circle" ? rx
        : (obj.ry || obj.height / 2 || 50) * (obj.scaleY || 1) * s;
      ctx.beginPath();
      ctx.ellipse(x + rx, y + ry, rx, ry, 0, 0, 2 * Math.PI);
      if (obj.fill   && obj.fill   !== "transparent") { ctx.fillStyle   = obj.fill;   ctx.fill();   }
      if (obj.stroke && obj.stroke !== "transparent" && (obj.strokeWidth || 0) > 0) {
        ctx.strokeStyle = obj.stroke; ctx.lineWidth = obj.strokeWidth * s; ctx.stroke();
      }
      ctx.restore(); continue;
    }

    // ── LINE ──────────────────────────────────────────────────────────────
    if (obj.type === "line") {
      // Fabric line: left/top is center of bounding box; x1/y1/x2/y2 are
      // relative to that center.
      const cx2 = x + w / 2;
      const cy2 = y + h / 2;
      const hw  = ((obj.width  || 100) * (obj.scaleX || 1)) / 2 * s;
      const hh  = ((obj.height || 0)   * (obj.scaleY || 1)) / 2 * s;
      ctx.beginPath();
      ctx.moveTo(
        cx2 + (obj.x1 !== undefined ? obj.x1 * s : -hw),
        cy2 + (obj.y1 !== undefined ? obj.y1 * s : -hh)
      );
      ctx.lineTo(
        cx2 + (obj.x2 !== undefined ? obj.x2 * s :  hw),
        cy2 + (obj.y2 !== undefined ? obj.y2 * s :  hh)
      );
      ctx.strokeStyle = obj.stroke     || "#000000";
      ctx.lineWidth   = (obj.strokeWidth || 1) * s;
      ctx.stroke();
      ctx.restore(); continue;
    }

    // ── TRIANGLE ──────────────────────────────────────────────────────────
    if (obj.type === "triangle") {
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x,     y + h);
      ctx.closePath();
      if (obj.fill   && obj.fill   !== "transparent") { ctx.fillStyle   = obj.fill;   ctx.fill();   }
      if (obj.stroke && obj.stroke !== "transparent" && (obj.strokeWidth || 0) > 0) {
        ctx.strokeStyle = obj.stroke; ctx.lineWidth = obj.strokeWidth * s; ctx.stroke();
      }
      ctx.restore(); continue;
    }

    // ── IMAGE ─────────────────────────────────────────────────────────────
    if (obj.type === "image") {
      const src = obj.src || obj._element?.src;
      if (src) {
        try {
          const img = await loadImage(src);
          if (obj.cropX != null || obj.cropY != null) {
            ctx.drawImage(
              img,
              (obj.cropX || 0), (obj.cropY || 0),
              obj.width  || img.naturalWidth,
              obj.height || img.naturalHeight,
              x, y, w, h
            );
          } else {
            ctx.drawImage(img, x, y, w, h);
          }
        } catch (e) {
          console.warn("Skipping image:", src, e.message);
        }
      }
      ctx.restore(); continue;
    }

    // ── TEXTBOX / I-TEXT ──────────────────────────────────────────────────
    if (obj.type !== "textbox" && obj.type !== "i-text") {
      ctx.restore(); continue;
    }

    const text = fillTokens(obj.text, dataMap);

    // Font string
    const fSize   = (obj.fontSize   || 24) * s;
    const fWeight = (obj.fontWeight === "bold" || obj.fontWeight === 700) ? "bold" : "normal";
    const fStyle  = obj.fontStyle  === "italic" ? "italic" : "normal";
    const fFamily = obj.fontFamily || "Times New Roman";
    ctx.font         = `${fStyle} ${fWeight} ${fSize}px "${fFamily}"`;
    ctx.fillStyle    = obj.fill || "#000000";
    ctx.textBaseline = "top";

    const align  = obj.textAlign || "left";
    ctx.textAlign = align;

    // Anchor X: Fabric textbox `left` is always the LEFT edge of the box
    // regardless of textAlign. textAlign shifts text WITHIN the box.
    let anchorX = x;
    if (align === "center") anchorX = x + w / 2;
    if (align === "right")  anchorX = x + w;

    const lineH = fSize * (obj.lineHeight || 1.16);

    drawWrappedText(ctx, text, anchorX, y, w, lineH);

    // Underline
    if (obj.underline) {
      const flat = text.replace(/\n/g, " ");
      const mw   = ctx.measureText(flat).width;
      let ulX    = anchorX;
      if (align === "center") ulX = anchorX - mw / 2;
      if (align === "right")  ulX = anchorX - mw;
      ctx.beginPath();
      ctx.strokeStyle = obj.fill || "#000000";
      ctx.lineWidth   = Math.max(1, fSize * 0.05);
      ctx.moveTo(ulX,      y + fSize + 2);
      ctx.lineTo(ulX + mw, y + fSize + 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  return { canvas, jsonW, jsonH };
};

// ─────────────────────────────────────────────────────────────────────────────
//  PDF GENERATOR
//
//  Converts the canvas to JPEG and creates a jsPDF whose page perfectly matches
//  the JSON canvas aspect ratio — so the image fills 100% of every page edge.
// ─────────────────────────────────────────────────────────────────────────────
const generateCertificatePDF = async (certId, apiData, setProgress, setError) => {
  try {
    setProgress(15);
    const dataMap = buildDataMap(certId, apiData);

    setProgress(30);
    const { canvas, jsonW, jsonH } = await renderToCanvas(dataMap);

    setProgress(72);

    // ── Compute PDF page dimensions in mm ──────────────────────────────────
    // We match the JSON's aspect ratio exactly, with the long edge = PDF_LONG_EDGE_MM.
    // This guarantees zero white space on any side.
    const ar       = jsonW / jsonH;                    // e.g. 900/636 ≈ 1.415
    const isLandscape = ar >= 1;

    let pdfW, pdfH;
    if (isLandscape) {
      pdfW = PDF_LONG_EDGE_MM;
      pdfH = Math.round((PDF_LONG_EDGE_MM / ar) * 100) / 100;
    } else {
      pdfH = PDF_LONG_EDGE_MM;
      pdfW = Math.round((PDF_LONG_EDGE_MM * ar) * 100) / 100;
    }

    // ── Build PDF ──────────────────────────────────────────────────────────
    const pdf = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait",
      unit:        "mm",
      format:      [pdfW, pdfH],   // ← custom page size = exact aspect ratio
      compress:    true,
    });

    // Convert canvas → high-quality JPEG
    const imgData = canvas.toDataURL("image/jpeg", 0.97);

    // Place image at (0,0) spanning the FULL page in mm — no margins, no gaps
    pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);

    setProgress(90);

    // Save + open
    const filename = `${(apiData.full_name || "Certificate").replace(/\s+/g, "_")}_Certificate.pdf`;
    pdf.save(filename);

    const blob = pdf.output("blob");
    const url  = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 20000);

    setProgress(100);
  } catch (err) {
    console.error("[CertGen] PDF generation error:", err);
    setError(err.message || "Failed to generate PDF.");
  }
};

// ─── Progress step definitions ────────────────────────────────────────────────
const STEPS = [
  { label: "Verifying session",         from: 0,  to: 10  },
  { label: "Generating certificate ID", from: 10, to: 20  },
  { label: "Fetching your details",     from: 20, to: 35  },
  { label: "Rendering template",        from: 35, to: 75  },
  { label: "Exporting PDF",             from: 75, to: 95  },
  { label: "Done!",                     from: 95, to: 100 },
];

const getStepIndex = (p) => {
  const i = STEPS.findIndex(s => p >= s.from && p < s.to);
  return i === -1 ? (p >= 100 ? STEPS.length : 0) : i;
};

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const CertificateGenerator = forwardRef((props, ref) => {
  const [open,     setOpen]     = useState(false);
  const [progress, setProgress] = useState(0);
  const [error,    setError]    = useState(null);

  useImperativeHandle(ref, () => ({ handleDownloadCertificate }));

  const handleDownloadCertificate = async () => {
    setOpen(true);
    setProgress(0);
    setError(null);

    try {
      // 1. Session
      const raw = localStorage.getItem("true");
      if (!raw) throw new Error("No user session. Please log in again.");
      let parsed;
      try { parsed = JSON.parse(raw); }
      catch { throw new Error("Session data is corrupted. Please log in again."); }

      const userId = parsed?.user?.user_id;
      const pocId  = parsed?.user?.mod_poc_id?.mod_poc_id;
      const modId  = parsed?.user?.mod_poc_id?.mod_id;
      if (!userId) throw new Error("Session is missing user_id.");
      if (!pocId)  throw new Error("Session is missing poc_id.");

      // 2. Certificate ID
      setProgress(10);
      let certId;
      try { certId = await fetchOrGenerateCertificates(pocId, userId); }
      catch (e) { throw new Error(`Certificate ID fetch failed: ${e.message}`); }
      if (!certId) throw new Error("Server returned no certificate ID.");

      // 3. Fetch user / module / score data in parallel
      setProgress(20);
      let userDetails = {}, moduleDetails = {}, scoreData = {};
      try {
        [userDetails, moduleDetails, scoreData] = await Promise.all([
          getUserById(userId),
          modId ? getModuleById(modId) : Promise.resolve({}),
          fetchAggregateScores(pocId, userId),
        ]);
      } catch (e) {
        throw new Error(`Data fetch failed: ${e.message}`);
      }

      setProgress(35);
      const apiData = {
        full_name:       userDetails?.full_name                         || "",
        rollno:          userDetails?.rollno                            || "",
        department:      userDetails?.department                        || "",
        college:         userDetails?.college                           || "",
        mod_name:        moduleDetails?.mod_name                        || "",
        mod_duration:    moduleDetails?.mod_duration                    || "",
        mark_percentage: Number(scoreData?.response?.average_percentage || 0).toFixed(2),
      };

      // 4. Render + export
      await generateCertificatePDF(certId, apiData, setProgress, setError);

    } catch (err) {
      console.error("[CertGen] Fatal:", err);
      setError(err.message || "Certificate generation failed.");
    }
  };

  const handleClose = () => {
    if (progress > 0 && progress < 100 && !error) return; // block during generation
    setOpen(false);
    setProgress(0);
    setError(null);
  };

  const isDone    = progress >= 100;
  const stepIndex = getStepIndex(progress);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      PaperProps={{ className: "cert-dialog-paper" }}
    >
      {/* Header */}
      <Box className="cert-dialog-header">
        <WorkspacePremiumIcon className="cert-dialog-header__icon" />
        <Box sx={{ flex: 1 }}>
          <Typography className="cert-dialog-header__title">
            Certificate Generation
          </Typography>
          <Typography className="cert-dialog-header__subtitle">
            Crescent EdTech · Official Certificate
          </Typography>
        </Box>
        {(isDone || error) && (
          <IconButton className="cert-close-btn" onClick={handleClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Body */}
      <Box className="cert-dialog-body">

        {/* Error state */}
        {error && (
          <Box className="cert-error-container">
            <ErrorOutlineIcon className="cert-error-icon" />
            <Typography className="cert-error-title">Generation Failed</Typography>
            <Typography className="cert-error-message">{error}</Typography>
            <Box className="cert-action-btn" onClick={handleClose} sx={{ cursor: "pointer" }}>
              Close
            </Box>
          </Box>
        )}

        {/* Success state */}
        {!error && isDone && (
          <Box className="cert-success-container">
            <CheckCircleIcon className="cert-success-icon" />
            <Typography className="cert-success-title">Certificate Generated!</Typography>
            <Typography className="cert-success-subtitle">
              Your PDF has been downloaded and opened in a new tab.
            </Typography>
            <Box className="cert-action-btn" onClick={handleClose} sx={{ cursor: "pointer" }}>
              Close
            </Box>
          </Box>
        )}

        {/* Progress state */}
        {!error && !isDone && (
          <>
            <WorkspacePremiumIcon className="cert-spin-icon" />

            <Box sx={{ width: "100%" }}>
              <Box className="cert-progress-header">
                <Typography className="cert-progress-label">
                  {STEPS[Math.min(stepIndex, STEPS.length - 1)]?.label || "Processing..."}
                </Typography>
                <Typography className="cert-progress-percent">
                  {Math.round(progress)}%
                </Typography>
              </Box>
              <Box className="cert-progress-track">
                <Box className="cert-progress-fill" style={{ width: `${progress}%` }} />
              </Box>
            </Box>

            <Box className="cert-steps-list">
              {STEPS.slice(0, -1).map((step, i) => {
                const done   = progress >= step.to;
                const active = !done && progress >= step.from;
                return (
                  <Box
                    key={i}
                    className={[
                      "cert-step-row",
                      done   && "cert-step-row--done",
                      active && "cert-step-row--active",
                    ].filter(Boolean).join(" ")}
                  >
                    <Box
                      className={[
                        "cert-step-dot",
                        done   && "cert-step-dot--done",
                        active && "cert-step-dot--active",
                      ].filter(Boolean).join(" ")}
                    >
                      {done ? "✓" : i + 1}
                    </Box>
                    <Typography
                      className={[
                        "cert-step-label",
                        done   && "cert-step-label--done",
                        active && "cert-step-label--active",
                      ].filter(Boolean).join(" ")}
                    >
                      {step.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </>
        )}

      </Box>
    </Dialog>
  );
});

export default CertificateGenerator;