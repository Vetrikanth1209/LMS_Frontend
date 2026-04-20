// import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";
// import dayjs from "dayjs";
// import { createRoot } from "react-dom/client";
// import BackgroundImg from "../assests/cert_bg.jpg";
// import DigiSign from "../assests/DigiSign.png";
// import { getUserById, getModuleById, fetchAggregateScores, fetchOrGenerateCertificates } from "../axios";
// import {
//   Dialog,
//   DialogContent,
//   DialogTitle,
//   Box,
//   Typography,
//   IconButton,
// } from "@mui/material";
// import { styled, alpha } from "@mui/material/styles";
// import { QRCodeCanvas } from "qrcode.react";
// import CloseIcon from "@mui/icons-material/Close";

// // Certificate template
// const CertificateTemplate = ({ forwardedRef, certificateId }) => {
//   const [userDetails, setUserDetails] = useState(null);
//   const [moduleDetails, setModuleDetails] = useState(null);
//   const [aggregateScore, setAggregateScore] = useState(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       const storedUser = localStorage.getItem("true");
//       if (!storedUser) return;

//       try {
//         const user = JSON.parse(storedUser);
//         const userId = user?.user?.user_id;
//         const modId = user?.user?.mod_poc_id?.mod_id;
//         const pocId = user?.user?.mod_poc_id?.mod_poc_id;

//         if (userId) {
//           const userData = await getUserById(userId);
//           setUserDetails(userData);
//         }

//         if (modId) {
//           const moduleData = await getModuleById(modId);
//           setModuleDetails(moduleData);
//         }

//         if (userId && pocId) {
//           const scoreData = await fetchAggregateScores(pocId, userId);
//           setAggregateScore(scoreData.response);
//         }
//       } catch (error) {
//         console.error("Error fetching certificate data:", error);
//       }
//     };

//     fetchData();
//   }, []);

//   if (!userDetails || !moduleDetails || !aggregateScore || !certificateId) return null;

//   const percentage = aggregateScore?.average_percentage?.toFixed(2) || "0.00";
//   const issueDate = dayjs().format("DD-MM-YYYY");
//   const verificationUrl = `https://zealoustechcorp.com/verify?certificateId=${encodeURIComponent(certificateId)}`;

//   return (
//     <div
//       style={{
//         width: "100%",
//         maxWidth: "29.7cm",
//         margin: "0 auto",
//         transform: "scale(calc(100vw / 1200))",
//         transformOrigin: "top center",
//         overflow: "hidden",
//       }}
//     >
//       <div
//         ref={forwardedRef}
//         style={{
//           width: "29.7cm",
//           height: "21cm",
//           background: "transparent",
//           position: "relative",
//           fontFamily: "Times New Roman",
//           padding: "60px",
//           boxSizing: "border-box",
//           color: "#000",
//           textAlign: "center",
//         }}
//       >
//         <img
//           src={BackgroundImg}
//           alt="Background"
//           style={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             width: "100%",
//             height: "100%",
//             zIndex: -1,
//             objectFit: "cover",
//           }}
//           onError={(e) => console.error("Failed to load background image:", e, BackgroundImg)}
//         />
//         <div style={{ marginTop: "130px", display: "flex", flexDirection: "column", alignItems: "flex-end", width: "fit-content", marginLeft: "auto", marginRight: "auto" }}>
//           <h2 style={{ fontSize: 47, charSpace: 0.1, margin: 0 }}>CERTIFICATE OF COMPLETION</h2>
//           <p style={{ fontSize: 27, fontStyle: "italic", fontFamily: "Charm", margin: "5px 0 0 0" }}>
//             Certificate ID: {certificateId}
//           </p>
//         </div>

//         <p style={{ fontSize: 27, fontWeight: "bold", marginTop: "10px" }}>
//           WE ARE PROUDLY PRESENT THIS SKILL WORKSHOP
//         </p>
//         <p style={{ fontSize: 27, fontWeight: "bold", marginTop: "5px" }}>CERTIFICATE TO</p>

//         <div style={{ display: "inline-block", textAlign: "center", marginTop: "5px" }}>
//           <h3 style={{ fontSize: 27, color: "black", fontWeight: "bold" }}>
//             {userDetails.full_name?.toUpperCase()}
//             {userDetails.rollno ? ` ${userDetails.rollno}` : ""}
//           </h3>
//         </div>

//         <p style={{ fontSize: 27, margin: "10px auto", width: "80%" }}>
//           Department of <strong>{userDetails.department}</strong> from <strong>{userDetails.college}</strong> on
//           <strong> {moduleDetails.mod_name}</strong>. Obtained a mark of <strong>{percentage}%</strong>.<br />
//           Duration: {moduleDetails.mod_duration}.
//         </p>

//         <div
//           style={{
//             position: "absolute",
//             bottom: "90px",
//             left: "220px",
//             textAlign: "center",
//           }}
//         >
//           <QRCodeCanvas
//             value={verificationUrl}
//             size={100}
//             level="H"
//             style={{ marginBottom: "28px", marginLeft: "5px" }}
//           />
//         </div>

//         <div
//           style={{
//             position: "absolute",
//             bottom: "40px",
//             left: "200px",
//             textAlign: "center",
//             fontSize: 27,
//           }}
//         >
//           <strong>{issueDate}</strong>
//           <div style={{ height: "2px", backgroundColor: "#35b5ff", width: "140px", margin: "5px auto 0" }} />
//           <span style={{ fontWeight: "bold" }}>Date of Issue</span>
//         </div>

//         <div
//           style={{
//             position: "absolute",
//             bottom: "40px",
//             right: "60px",
//             textAlign: "center",
//             fontSize: 27,
//           }}
//         >
//           <img
//             src={DigiSign || "/placeholder.svg"}
//             alt="Digital Signature"
//             style={{ height: "90px", width: "90px", marginBottom: "5px" }}
//           />
//           <div style={{ height: "2px", backgroundColor: "#35b5ff", width: "200px", margin: "5px auto 0" }} />
//           <span style={{ fontWeight: "bold" }}>Head - Technology & Training</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Generate PDF
// const generateCertificate = async (certificateId, setProgress, setError) => {
//   const certificateRef = { current: null };
//   const container = document.createElement("div");
//   container.style.position = "absolute";
//   container.style.left = "-9999px";
//   document.body.appendChild(container);
//   const root = createRoot(container);

//   try {
//     root.render(<CertificateTemplate forwardedRef={(el) => (certificateRef.current = el)} certificateId={certificateId} />);

//     setProgress(20);
//     await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for rendering

//     if (!certificateRef.current) {
//       throw new Error("Failed to render certificate template");
//     }

//     console.log("Loading background image from:", BackgroundImg);
//     const background = new Image();
//     background.src = BackgroundImg;
//     await new Promise((resolve, reject) => {
//       background.onload = () => {
//         console.log("Background image loaded successfully:", background.src, background.width, background.height);
//         resolve();
//       };
//       background.onerror = (error) => {
//         console.error("Failed to load background image:", error, BackgroundImg);
//         reject(new Error(`Failed to load background image: ${BackgroundImg}`));
//       };
//     });

//     setProgress(40);
//     const canvas = await html2canvas(certificateRef.current, {
//       useCORS: true,
//       backgroundColor: "transparent",
//       scale: 2,
//     });

//     setProgress(60);
//     const imgData = canvas.toDataURL("image/jpeg", 0.8);
//     console.log(`Canvas data URL size: ${(imgData.length * 0.75 / 1024 / 1024).toFixed(2)} MB`);

//     const pdf = new jsPDF({
//       orientation: "landscape",
//       unit: "mm",
//       format: [297, 210],
//       compress: true,
//     });
//     console.log("Adding background to PDF:", background.src);
//     pdf.addImage(background, "JPEG", 0, 0, 297, 210);
//     pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);

//     const storedUser = localStorage.getItem("true");
//     const user = storedUser ? JSON.parse(storedUser) : null;
//     const filename = user?.user?.full_name ? `${user.user.full_name}_Certificate.pdf` : "Certificate.pdf";

//     pdf.save(filename);

//     setProgress(90);
//     const pdfBlob = pdf.output("blob");
//     const pdfUrl = URL.createObjectURL(pdfBlob);
//     window.open(pdfUrl, "_blank");

//     URL.revokeObjectURL(pdfUrl);
//     setProgress(100);
//   } catch (error) {
//     console.error("Error generating certificate:", error);
//     setError(error.message || "Failed to generate certificate PDF");
//   } finally {
//     root.unmount();
//     document.body.removeChild(container);
//   }
// };

// // Styled Components
// const CurvyDialog = styled(Dialog)(({ theme }) => ({
//   "& .MuiDialog-paper": {
//     borderRadius: "20px",
//     backgroundColor: "#ffffff",
//     boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)",
//     overflow: "hidden",
//     transition: "all 0.3s ease",
//     width: "90vw",
//     maxWidth: "400px",
//     [theme.breakpoints.up("sm")]: {
//       maxWidth: "600px",
//     },
//     "&:hover": {
//       transform: "scale(1.02)",
//       boxShadow: "0 12px 24px rgba(0, 0, 0, 0.2)",
//     },
//   },
// }));

// const CurvyDialogTitle = styled(DialogTitle)(({ theme }) => ({
//   background: "linear-gradient(135deg, #0c83c8 0%, #3a9bd7 100%)",
//   color: "#ffffff",
//   padding: theme.spacing(2, 3),
//   fontSize: "1.25rem",
//   fontWeight: 600,
//   textAlign: "center",
//   borderTopLeftRadius: "20px",
//   borderTopRightRadius: "20px",
//   [theme.breakpoints.down("sm")]: {
//     fontSize: "1rem",
//     padding: theme.spacing(1.5, 2),
//   },
// }));

// const CurvyDialogContent = styled(DialogContent)(({ theme }) => ({
//   padding: theme.spacing(4),
//   display: "flex",
//   flexDirection: "column",
//   alignItems: "center",
//   gap: theme.spacing(2),
//   backgroundColor: "#f9fafc",
//   borderBottomLeftRadius: "20px",
//   borderBottomRightRadius: "20px",
//   [theme.breakpoints.down("sm")]: {
//     padding: theme.spacing(2),
//   },
// }));

// const ProgressBarContainer = styled(Box)(({ theme }) => ({
//   width: "100%",
//   height: "12px",
//   marginTop: theme.spacing(2),
//   backgroundColor: alpha(theme.palette.grey[300], 0.5),
//   borderRadius: "12px",
//   overflow: "hidden",
//   position: "relative",
//   transition: "all 0.3s ease",
//   "&:hover": {
//     backgroundColor: alpha(theme.palette.grey[300], 0.7),
//     boxShadow: `0 0 8px ${alpha("#fc7a46", 0.3)}`,
//     transform: "scale(1.01)",
//   },
//   [theme.breakpoints.down("sm")]: {
//     height: "8px",
//     marginTop: theme.spacing(1),
//   },
// }));

// const ProgressBarFill = styled(Box)(({ theme, value }) => ({
//   width: `${value}%`,
//   height: "100%",
//   background: "linear-gradient(90deg, #0c83c8 0%, #fc7a46 100%)",
//   borderRadius: "12px",
//   transition: "width 0.5s ease-in-out",
//   position: "relative",
//   "&::after": {
//     content: '""',
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
//     animation: "shimmer 2s infinite",
//   },
//   "@keyframes shimmer": {
//     "0%": { transform: "translateX(-100%)" },
//     "100%": { transform: "translateX(100%)" },
//   },
// }));

// const CloseButton = styled(IconButton)(({ theme }) => ({
//   backgroundColor: alpha(theme.palette.grey[200], 0.8),
//   color: theme.palette.grey[700],
//   borderRadius: "50%",
//   padding: theme.spacing(1),
//   transition: "all 0.3s ease",
//   "&:hover": {
//     backgroundColor: alpha(theme.palette.grey[300], 0.9),
//     transform: "scale(1.2)",
//     boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
//   },
//   [theme.breakpoints.down("sm")]: {
//     padding: theme.spacing(0.5),
//   },
// }));

// // Certificate Generator component
// const CertificateGenerator = forwardRef((props, ref) => {
//   const [open, setOpen] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [error, setError] = useState(null);
//   const [certificateId, setCertificateId] = useState(null);

//   useImperativeHandle(ref, () => ({
//     handleDownloadCertificate,
//   }));

//   const handleDownloadCertificate = async () => {
//     setOpen(true);
//     setProgress(0);
//     setError(null);

//     try {
//       const storedUser = localStorage.getItem("true");
//       if (!storedUser) {
//         throw new Error("No user data found in localStorage");
//       }

//       const user = JSON.parse(storedUser);
//       const userId = user?.user?.user_id;
//       const pocId = user?.user?.mod_poc_id?.mod_poc_id;

//       if (!userId || !pocId) {
//         throw new Error("Invalid userId or pocId");
//       }

//       const certId = await fetchOrGenerateCertificates(pocId, userId);
//       setCertificateId(certId);

//       await generateCertificate(certId, setProgress, setError);
//     } catch (err) {
//       console.error("Error in certificate generation:", err);
//       const errorMessage = err.message || "Failed to generate certificate.";
//       setError(errorMessage);
//     }
//   };

//   const handleClose = () => {
//     setOpen(false);
//     setProgress(0);
//     setError(null);
//     setCertificateId(null);
//   };

//   return (
//     <CurvyDialog
//       open={open}
//       onClose={progress === 100 || error ? handleClose : undefined}
//       fullWidth
//     >
//       <CurvyDialogTitle>Generating Certificate</CurvyDialogTitle>
//       <CurvyDialogContent>
//         <Box sx={{ width: "100%", textAlign: "center" }}>
//           {error ? (
//             <Typography
//               variant="body1"
//               color="error"
//               sx={{
//                 fontWeight: 500,
//                 fontSize: { xs: "0.9rem", sm: "1rem" },
//                 animation: "fadeIn 0.5s ease-in",
//                 "@keyframes fadeIn": {
//                   "0%": { opacity: 0 },
//                   "100%": { opacity: 1 },
//                 },
//               }}
//             >
//               {error}
//             </Typography>
//           ) : (
//             <>
//               <ProgressBarContainer>
//                 <ProgressBarFill value={progress} />
//               </ProgressBarContainer>
//               <Typography
//                 variant="body1"
//                 sx={{
//                   mt: 2,
//                   color: progress === 100 ? "#0c83c8" : "#333",
//                   fontWeight: 500,
//                   fontSize: { xs: "0.9rem", sm: "1rem" },
//                   animation: progress === 100 ? "pulse 1.5s infinite" : "fadeIn 0.5s ease-in",
//                   "@keyframes pulse": {
//                     "0%": { opacity: 0.8 },
//                     "50%": { opacity: 1 },
//                     "100%": { opacity: 0.8 },
//                   },
//                   "@keyframes fadeIn": {
//                     "0%": { opacity: 0 },
//                     "100%": { opacity: 1 },
//                   },
//                 }}
//               >
//                 {progress === 100 ? "Certificate Generated!" : `Progress: ${progress}%`}
//               </Typography>
//             </>
//           )}
//         </Box>
//         {(progress === 100 || error) && (
//           <CloseButton
//             onClick={handleClose}
//             sx={{
//               position: "absolute",
//               top: { xs: 8, sm: 16 },
//               right: { xs: 8, sm: 16 },
//             }}
//           >
//             <CloseIcon sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }} />
//           </CloseButton>
//         )}
//       </CurvyDialogContent>
//     </CurvyDialog>
//   );
// });

// export default CertificateGenerator;






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
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";

import TEMPLATE_JSON from "../assests/certificate-template.json";
import "../styles/Certificate_Generator.css";

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN SETUP — ONE TIME ONLY
// ─────────────────────────────────────────────────────────────────────────────
//
//  IN CERTMAKER:
//  ─────────────
//  Step 1: Design the COMPLETE certificate (logo, borders, static text,
//          signature, stamps, decorations — everything).
//
//  Step 2: For each dynamic field, type EXACTLY {{field_key}} in the textbox.
//          Supported keys:
//            {{name}}             → student full name
//            {{roll_no}}          → roll number
//            {{department}}       → department
//            {{college}}          → college name
//            {{course}}           → course / module name
//            {{duration}}         → course duration
//            {{mark_percentage}}  → marks percentage
//            {{certificate_id}}   → certificate ID
//            {{issue_date}}       → auto date (DD-MM-YYYY)
//
//  Step 3: Click "⬇ JSON" → rename → src/assests/certificate-template.json
//
//  Step 4: DO NOT export a separate PNG background.
//          The JSON already contains everything — backgrounds, images,
//          shapes, static text, AND the {{field}} positions.
//          The code renders 100% from JSON only.
//
//  IMPORTANT: No certificate-bg.png is needed or used anymore.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Helper: load image as HTMLImageElement ───────────────────────────────────
const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img       = new Image();
    img.crossOrigin = "anonymous";
    img.onload      = () => resolve(img);
    img.onerror     = () => reject(new Error(`Cannot load image: ${src}`));
    img.src         = src;
  });

// ─── Helper: load a Google Font ──────────────────────────────────────────────
const loadGoogleFont = (fontFamily) =>
  new Promise((resolve) => {
    if (!fontFamily || fontFamily === "Times New Roman") { resolve(); return; }
    const name = fontFamily.replace(/ /g, "+");
    const id   = `gfont-${name}`;
    if (document.getElementById(id)) { resolve(); return; }
    const link   = document.createElement("link");
    link.id      = id;
    link.rel     = "stylesheet";
    link.href    = `https://fonts.googleapis.com/css2?family=${name}:ital,wght@0,400;0,700;1,400;1,700&display=swap`;
    link.onload  = () => setTimeout(resolve, 800);
    link.onerror = resolve;
    document.head.appendChild(link);
  });

// ─── Build data map — all possible key aliases admin might use ────────────────
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
  certificate_id:  certId               || "",
  cert_id:         certId               || "",
  issue_date:      dayjs().format("DD-MM-YYYY"),
  date:            dayjs().format("DD-MM-YYYY"),
  year:            dayjs().format("YYYY"),
});

// ─── CORE: Render entire certificate from JSON onto HTML5 Canvas ──────────────
const renderCertificateToCanvas = async (dataMap) => {
  if (!TEMPLATE_JSON || !TEMPLATE_JSON.objects) {
    throw new Error(
      "certificate-template.json is missing or invalid.\n" +
      "Export JSON from CertMaker → place at: src/assests/certificate-template.json"
    );
  }

  const objects = TEMPLATE_JSON.objects || [];
  const canvasW = TEMPLATE_JSON.width   || 1800;
  const canvasH = TEMPLATE_JSON.height  || 1272;

  const usedFonts = [
    ...new Set(
      objects
        .filter((o) => o.type === "textbox" || o.type === "i-text")
        .map((o) => o.fontFamily)
        .filter(Boolean)
    ),
  ];
  await Promise.all(usedFonts.map(loadGoogleFont));

  const canvas  = document.createElement("canvas");
  canvas.width  = canvasW;
  canvas.height = canvasH;
  const ctx     = canvas.getContext("2d");

  ctx.fillStyle = TEMPLATE_JSON.background || "#ffffff";
  ctx.fillRect(0, 0, canvasW, canvasH);

  for (const obj of objects) {
    const scaleX  = obj.scaleX  || 1;
    const scaleY  = obj.scaleY  || 1;
    const opacity = obj.opacity ?? 1;
    const left    = obj.left    || 0;
    const top     = obj.top     || 0;

    ctx.save();
    ctx.globalAlpha = opacity;

    if (obj.angle) {
      const cx = left + (obj.width  * scaleX) / 2;
      const cy = top  + (obj.height * scaleY) / 2;
      ctx.translate(cx, cy);
      ctx.rotate((obj.angle * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    if (obj.type === "rect") {
      const w  = (obj.width  || 0) * scaleX;
      const h  = (obj.height || 0) * scaleY;
      const rx = obj.rx || 0;
      ctx.fillStyle   = obj.fill   || "transparent";
      ctx.strokeStyle = obj.stroke || "transparent";
      ctx.lineWidth   = (obj.strokeWidth || 0) * scaleX;
      ctx.beginPath();
      if (rx > 0 && ctx.roundRect) {
        ctx.roundRect(left, top, w, h, rx * scaleX);
      } else {
        ctx.rect(left, top, w, h);
      }
      if (obj.fill   && obj.fill   !== "transparent") ctx.fill();
      if (obj.stroke && obj.stroke !== "transparent") ctx.stroke();
      ctx.restore();
      continue;
    }

    if (obj.type === "circle") {
      const r = (obj.radius || 50) * scaleX;
      ctx.fillStyle   = obj.fill   || "transparent";
      ctx.strokeStyle = obj.stroke || "transparent";
      ctx.lineWidth   = (obj.strokeWidth || 0) * scaleX;
      ctx.beginPath();
      ctx.arc(left + r, top + r, r, 0, 2 * Math.PI);
      if (obj.fill   && obj.fill   !== "transparent") ctx.fill();
      if (obj.stroke && obj.stroke !== "transparent") ctx.stroke();
      ctx.restore();
      continue;
    }

    if (obj.type === "line") {
      ctx.strokeStyle = obj.stroke || "#000000";
      ctx.lineWidth   = (obj.strokeWidth || 1) * scaleX;
      ctx.beginPath();
      const x1 = left + (obj.x1 ?? -(obj.width  / 2 || 50));
      const y1 = top  + (obj.y1 ?? 0);
      const x2 = left + (obj.x2 ?? (obj.width   / 2 || 50));
      const y2 = top  + (obj.y2 ?? 0);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
      continue;
    }

    if (obj.type === "triangle") {
      const w = (obj.width  || 100) * scaleX;
      const h = (obj.height || 80)  * scaleY;
      ctx.fillStyle   = obj.fill   || "transparent";
      ctx.strokeStyle = obj.stroke || "transparent";
      ctx.lineWidth   = (obj.strokeWidth || 0) * scaleX;
      ctx.beginPath();
      ctx.moveTo(left + w / 2, top);
      ctx.lineTo(left + w,     top + h);
      ctx.lineTo(left,         top + h);
      ctx.closePath();
      if (obj.fill   && obj.fill   !== "transparent") ctx.fill();
      if (obj.stroke && obj.stroke !== "transparent") ctx.stroke();
      ctx.restore();
      continue;
    }

    if (obj.type === "image") {
      const src = obj.src || obj._element?.src;
      if (src) {
        try {
          const imgEl = await loadImage(src);
          const w     = (obj.width  || imgEl.naturalWidth)  * scaleX;
          const h     = (obj.height || imgEl.naturalHeight) * scaleY;
          ctx.drawImage(imgEl, left, top, w, h);
        } catch (_) { /* skip broken image silently */ }
      }
      ctx.restore();
      continue;
    }

    if (obj.type !== "textbox" && obj.type !== "i-text") {
      ctx.restore();
      continue;
    }

    let text = (obj.text || "").replace(/\{\{(\w+)\}\}/g, (_, key) =>
      dataMap[key] !== undefined ? String(dataMap[key]) : ""
    );

    if (obj._fieldKey && dataMap[obj._fieldKey] !== undefined) {
      if ((obj.text || "").trim() === `{{${obj._fieldKey}}}`) {
        text = String(dataMap[obj._fieldKey]);
      }
    }

    const fontSize   = (obj.fontSize   || 24) * scaleY;
    const fontWeight = (obj.fontWeight === "bold" || obj.fontWeight === 700)
                         ? "bold" : "normal";
    const fontStyle  = obj.fontStyle === "italic" ? "italic" : "normal";
    const fontFamily = obj.fontFamily || "Times New Roman";

    ctx.font         = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
    ctx.fillStyle    = obj.fill || "#000000";
    ctx.textBaseline = "top";

    const textAlign = obj.textAlign || "left";
    ctx.textAlign   = textAlign;

    const boxW  = (obj.width || 400) * scaleX;
    const lineH = fontSize * (obj.lineHeight || 1.16);

    let anchorX = left;
    if (textAlign === "center") anchorX = left + boxW / 2;
    if (textAlign === "right")  anchorX = left + boxW;

    const rawLines = text.split("\n");
    let   curY     = top;

    for (const rawLine of rawLines) {
      const words   = rawLine.split(" ");
      let   curLine = "";

      for (const word of words) {
        const test = curLine ? `${curLine} ${word}` : word;
        if (ctx.measureText(test).width > boxW && curLine) {
          ctx.fillText(curLine, anchorX, curY);
          curLine = word;
          curY   += lineH;
        } else {
          curLine = test;
        }
      }
      if (curLine) {
        ctx.fillText(curLine, anchorX, curY);
        curY += lineH;
      }
    }

    if (obj.underline) {
      const m      = ctx.measureText(text);
      let   startX = anchorX;
      if (textAlign === "center") startX = anchorX - m.width / 2;
      if (textAlign === "right")  startX = anchorX - m.width;
      ctx.beginPath();
      ctx.strokeStyle = obj.fill || "#000000";
      ctx.lineWidth   = Math.max(1, fontSize * 0.05);
      ctx.moveTo(startX, top + fontSize + 2);
      ctx.lineTo(startX + m.width, top + fontSize + 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  return canvas;
};

// ─── Main generation function ─────────────────────────────────────────────────
const generateCertificate = async (certId, apiData, setProgress, setError) => {
  try {
    setProgress(15);

    const dataMap = buildDataMap(certId, apiData);
    setProgress(30);

    const canvas  = await renderCertificateToCanvas(dataMap);
    setProgress(70);

    const imgData = canvas.toDataURL("image/jpeg", 0.97);
    const pdf     = new jsPDF({
      orientation: "landscape",
      unit:        "mm",
      format:      [297, 210],
      compress:    true,
    });
    pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);

    const filename = `${apiData.full_name || "Certificate"}_Certificate.pdf`;
    pdf.save(filename);
    setProgress(90);

    const blob = pdf.output("blob");
    const url  = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 15000);

    setProgress(100);
  } catch (err) {
    console.error("Certificate generation error:", err);
    setError(err.message || "Failed to generate certificate.");
  }
};

// ─── Steps definition ─────────────────────────────────────────────────────────
const STEPS = [
  { label: "Verifying session",         from: 0,  to: 10  },
  { label: "Generating certificate ID", from: 10, to: 20  },
  { label: "Fetching your details",     from: 20, to: 35  },
  { label: "Loading template",          from: 35, to: 55  },
  { label: "Rendering certificate",     from: 55, to: 80  },
  { label: "Exporting PDF",             from: 80, to: 95  },
  { label: "Done!",                     from: 95, to: 100 },
];

const getStepIndex = (progress) =>
  STEPS.findIndex((s) => progress >= s.from && progress < s.to) ??
  (progress >= 100 ? STEPS.length : 0);

// ─── CertificateGenerator Component ──────────────────────────────────────────
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
      const storedUser = localStorage.getItem("true");
      if (!storedUser) throw new Error("No user session found. Please log in again.");
      const parsed = JSON.parse(storedUser);
      const userId = parsed?.user?.user_id;
      const pocId  = parsed?.user?.mod_poc_id?.mod_poc_id;
      const modId  = parsed?.user?.mod_poc_id?.mod_id;
      if (!userId || !pocId) throw new Error("Invalid session — missing userId or pocId.");

      // 2. Certificate ID
      setProgress(10);
      const certId = await fetchOrGenerateCertificates(pocId, userId);
      if (!certId) throw new Error("No certificate ID returned from server.");

      // 3. Fetch data
      setProgress(20);
      const [userDetails, moduleDetails, scoreData] = await Promise.all([
        getUserById(userId),
        getModuleById(modId),
        fetchAggregateScores(pocId, userId),
      ]);

      setProgress(35);
      const apiData = {
        full_name:       userDetails?.full_name                   || "",
        rollno:          userDetails?.rollno                      || "",
        department:      userDetails?.department                  || "",
        college:         userDetails?.college                     || "",
        mod_name:        moduleDetails?.mod_name                  || "",
        mod_duration:    moduleDetails?.mod_duration              || "",
        mark_percentage: Number(
                           scoreData?.response?.average_percentage || 0
                         ).toFixed(2),
      };

      // 4. Render + export
      await generateCertificate(certId, apiData, setProgress, setError);

    } catch (err) {
      console.error("Certificate generation failed:", err);
      setError(err.message || "Failed to generate certificate.");
    }
  };

  const handleClose = () => {
    if (progress > 0 && progress < 100 && !error) return;
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
      {/* ── Header ── */}
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
          <IconButton
            className="cert-close-btn"
            onClick={handleClose}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* ── Body ── */}
      <Box className="cert-dialog-body">
        {error ? (
          /* ── Error state ── */
          <Box className="cert-error-container">
            <ErrorOutlineIcon className="cert-error-icon" />
            <Typography className="cert-error-title">
              Generation Failed
            </Typography>
            <Typography className="cert-error-message">
              {error}
            </Typography>
            <Box className="cert-action-btn" onClick={handleClose}>
              Close
            </Box>
          </Box>

        ) : isDone ? (
          /* ── Success state ── */
          <Box className="cert-success-container">
            <CheckCircleIcon className="cert-success-icon" />
            <Typography className="cert-success-title">
              Certificate Generated!
            </Typography>
            <Typography className="cert-success-subtitle">
              Your PDF has been downloaded and opened in a new tab.
            </Typography>
            <Box className="cert-action-btn" onClick={handleClose}>
              Close
            </Box>
          </Box>

        ) : (
          /* ── Progress state ── */
          <>
            {/* Spinning icon */}
            <WorkspacePremiumIcon className="cert-spin-icon" />

            {/* Progress bar */}
            <Box style={{ width: "100%" }}>
              <Box className="cert-progress-header">
                <Typography className="cert-progress-label">
                  {STEPS[Math.min(stepIndex, STEPS.length - 1)]?.label || "Processing..."}
                </Typography>
                <Typography className="cert-progress-percent">
                  {Math.round(progress)}%
                </Typography>
              </Box>
              <Box className="cert-progress-track">
                <Box
                  className="cert-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </Box>
            </Box>

            {/* Step list */}
            <Box className="cert-steps-list">
              {STEPS.slice(0, -1).map((step, i) => {
                const done   = progress >= step.to;
                const active = !done && progress >= step.from;

                const rowClass = [
                  "cert-step-row",
                  done   ? "cert-step-row--done"   : "",
                  active ? "cert-step-row--active" : "",
                ].join(" ").trim();

                const dotClass = [
                  "cert-step-dot",
                  done   ? "cert-step-dot--done"   : "",
                  active ? "cert-step-dot--active" : "",
                ].join(" ").trim();

                const labelClass = [
                  "cert-step-label",
                  done   ? "cert-step-label--done"   : "",
                  active ? "cert-step-label--active" : "",
                ].join(" ").trim();

                return (
                  <Box key={i} className={rowClass}>
                    <Box className={dotClass}>
                      {done ? "✓" : i + 1}
                    </Box>
                    <Typography className={labelClass}>
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