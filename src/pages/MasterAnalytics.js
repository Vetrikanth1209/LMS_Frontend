import React, { useState, useEffect, useRef } from "react";
import {
  Box, Select, MenuItem, Paper, Typography, Button, CircularProgress,
  Alert, Fade, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Tabs, Tab, TablePagination, Chip, LinearProgress,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, Avatar,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Business as BusinessIcon, Book as BookIcon, Person as PersonIcon,
  Search as SearchIcon, Group as GroupIcon, Assessment as AssessmentIcon,
  Percent as PercentIcon, TrendingUp as TrendingUpIcon,
  EmojiEvents as TrophyIcon, School as SchoolIcon, BarChart as BarChartIcon,
  Close as CloseIcon, Email as EmailIcon, Phone as PhoneIcon,
  Badge as BadgeIcon, Download as DownloadIcon,
  EventAvailable as AttendanceIcon, PieChart as PieChartIcon,
  GridView as GridViewIcon, Equalizer as EqualizerIcon,
} from "@mui/icons-material";
import axios from "axios";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title,
  Tooltip, Legend, ArcElement, PointElement, LineElement, Filler,
} from "chart.js";
import Admin_Dash from "../components/AdminDash";
import { getModId, getOrgId, getPocId } from "../axios";
import "../styles/MasterAnalytics.css";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, Filler,
);

/* ── PDF helpers ────────────────────────────────────────────── */
const loadScript = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

const downloadSectionAsPDF = async (elementRef, filename = "report.pdf") => {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const el = elementRef.current;
  if (!el) return;
  const canvas = await window.html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
  const imgData = canvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? "landscape" : "portrait",
    unit: "px", format: [canvas.width / 2, canvas.height / 2],
  });
  pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(filename);
};

/* ── Design tokens ──────────────────────────────────────────── */
const C = {
  primary:   "#0c83c8",
  secondary: "#fc7a46",
  success:   "#22c55e",
  warning:   "#f59e0b",
  danger:    "#ef4444",
  bg:        "#f0f4f8",
};

const inputSx = (primary, secondary) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px", bgcolor: "white", fontSize: "14px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    "& fieldset": { borderColor: alpha(primary, 0.3) },
    "&:hover fieldset": { borderColor: primary },
    "&.Mui-focused fieldset": { borderColor: primary, borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { color: primary, fontWeight: 500, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  "& .MuiInputLabel-root.Mui-focused": { color: secondary },
});

const getScoreColor = (pct) => pct >= 75 ? C.success : pct >= 50 ? C.warning : C.danger;
const getScoreLabel = (pct) =>
  pct >= 75 ? { label: "Excellent", color: C.success }
  : pct >= 50 ? { label: "Average", color: C.warning }
  : { label: "Needs Work", color: C.danger };

/* ── ScoreBar ───────────────────────────────────────────────── */
const ScoreBar = ({ value, max }) => {
  const pct = max === 0 ? 0 : (value / max) * 100;
  return (
    <Box className="cp-scorebar">
      <LinearProgress variant="determinate" value={pct}
        sx={{
          flex: 1, height: 8, borderRadius: 4,
          bgcolor: alpha(getScoreColor(pct), 0.15),
          "& .MuiLinearProgress-bar": { bgcolor: getScoreColor(pct), borderRadius: 4 },
        }}
      />
      <Typography className="cp-scorebar-label" style={{ color: getScoreColor(pct) }}>
        {pct.toFixed(0)}%
      </Typography>
    </Box>
  );
};

/* ── StatCard ───────────────────────────────────────────────── */
const StatCard = ({ title, value, sub, icon, color }) => (
  <Paper className="cp-stat-card" style={{ border: `0.5px solid ${alpha(color, 0.2)}`, boxShadow: `0 4px 20px ${alpha(color, 0.12)}` }}>
    <Box className="cp-stat-card-orb" style={{ background: alpha(color, 0.08) }} />
    <Box className="cp-stat-card-inner">
      <Box>
        <Typography className="cp-stat-card-title" style={{ color: alpha(color, 0.8) }}>{title}</Typography>
        <Typography className="cp-stat-card-value" style={{ color }}>{value}</Typography>
        {sub && <Typography className="cp-stat-card-sub">{sub}</Typography>}
      </Box>
      <Box className="cp-stat-card-icon" style={{ bgcolor: alpha(color, 0.12) }}>
        {React.cloneElement(icon, { sx: { color, fontSize: 22 } })}
      </Box>
    </Box>
  </Paper>
);

/* ── SectionHeader ──────────────────────────────────────────── */
const SectionHeader = ({ icon, title, color, extra }) => (
  <Box className="cp-section-header" style={{ borderBottom: `2px solid ${alpha(color, 0.15)}` }}>
    <Box className="cp-section-header-left">
      <Box className="cp-section-header-icon" style={{ background: alpha(color, 0.12) }}>
        {React.cloneElement(icon, { sx: { color, fontSize: 20 } })}
      </Box>
      <Typography className="cp-section-header-title">{title}</Typography>
    </Box>
    {extra}
  </Box>
);

/* ── PDFDownloadButton ──────────────────────────────────────── */
const PDFDownloadButton = ({ sectionRef, filename }) => (
  <Button size="small" variant="outlined" startIcon={<DownloadIcon />}
    onClick={() => downloadSectionAsPDF(sectionRef, filename)}
    className="cp-btn-pdf"
    sx={{ borderColor: alpha(C.primary, 0.4), color: C.primary, "&:hover": { borderColor: C.primary, bgcolor: alpha(C.primary, 0.06) } }}
  >
    Download PDF
  </Button>
);

/* ── StudentDetailDialog ────────────────────────────────────── */
const StudentDetailDialog = ({ open, onClose, student, pocId, individualData }) => {
  const detail = individualData?.response || null;
  const getInitials = (name) => name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  const InfoRow = ({ icon, label, value }) => (
    <Box className="cp-info-row">
      <Box className="cp-info-row-icon">
        {React.cloneElement(icon, { sx: { color: C.primary, fontSize: 16 } })}
      </Box>
      <Box>
        <Typography className="cp-info-row-label">{label}</Typography>
        <Typography className="cp-info-row-value">{value || "—"}</Typography>
      </Box>
    </Box>
  );

  const barChartData = {
    labels: detail?.tests?.map((t) => t.test_name) || [],
    datasets: [
      { label: "Score Obtained", data: detail?.tests?.map((t) => t.result_score) || [], backgroundColor: C.primary, borderColor: C.primary, borderWidth: 1, borderRadius: 6 },
      { label: "Maximum Score",  data: detail?.tests?.map((t) => t.test_total_score) || [], backgroundColor: "#e0e0e0", borderColor: "#e0e0e0", borderWidth: 1, borderRadius: 6 },
    ],
  };
  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: "top", align: "end", labels: { boxWidth: 12, padding: 15 } }, title: { display: true, text: "Test-wise Performance", font: { size: 15, weight: 600, family: "'Plus Jakarta Sans', sans-serif" }, color: "#1a1a1a", padding: { bottom: 20 } } },
    scales: { y: { beginAtZero: true, grid: { color: "#f5f5f5" }, ticks: { font: { family: "'Plus Jakarta Sans', sans-serif" } } }, x: { grid: { display: false }, ticks: { font: { family: "'Plus Jakarta Sans', sans-serif" } } } },
  };
  const doughnutData = {
    labels: ["Achieved Score", "Remaining Score"],
    datasets: [{ data: detail ? [detail.total_result_score, detail.total_test_score - detail.total_result_score] : [0, 0], backgroundColor: [C.primary, "#e0e0e0"], borderColor: "#fff", borderWidth: 3 }],
  };
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: "65%",
    plugins: { legend: { position: "bottom", labels: { padding: 20, font: { size: 13, family: "'Plus Jakarta Sans', sans-serif" } } }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw}` } } },
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ className: "cp-dialog-paper" }}>
      <DialogTitle sx={{ p: 0 }}>
        <Box className="cp-dialog-header">
          <Box className="cp-dialog-header-left">
            <Avatar className="cp-dialog-avatar">{getInitials(student?.user_name || "")}</Avatar>
            <Box>
              <Typography className="cp-dialog-student-name">{student?.user_name || "Student"}</Typography>
              <Typography className="cp-dialog-student-sub">Student Performance Report</Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {!detail && (
          <Box className="cp-dialog-loading">
            <CircularProgress sx={{ color: C.primary }} />
            <Typography className="cp-dialog-loading-text">Loading student details...</Typography>
          </Box>
        )}
        {detail && (
          <Box sx={{ p: 3 }}>
            <Box className="cp-dialog-stat-grid">
              {[
                { label: "Total Score",    value: detail.total_result_score, sub: `out of ${detail.total_test_score}`,            color: C.primary },
                { label: "Avg Percentage", value: `${detail.average_percentage}%`, sub: getScoreLabel(detail.average_percentage).label, color: getScoreColor(detail.average_percentage) },
                { label: "Tests Taken",    value: detail?.tests?.length || 0, sub: "assessments",                                 color: C.success },
              ].map(({ label, value, sub, color }) => (
                <Paper key={label} className="cp-dialog-stat-card">
                  <Typography style={{ fontSize: "11px", fontWeight: 700, color }}>{label}</Typography>
                  <Typography style={{ fontSize: "26px", fontWeight: 700, color }}>{value}</Typography>
                  <Typography style={{ fontSize: "12px", color: "#aaa" }}>{sub}</Typography>
                </Paper>
              ))}
            </Box>

            {detail.userDetails && (
              <Paper className="cp-dialog-user-details">
                <Typography className="cp-dialog-section-label">Personal Details</Typography>
                <Box className="cp-dialog-user-grid">
                  <InfoRow icon={<PersonIcon />} label="Full Name"   value={detail.userDetails.full_name} />
                  <InfoRow icon={<EmailIcon />}  label="Email"       value={detail.userDetails.email} />
                  <InfoRow icon={<BadgeIcon />}  label="Roll No"     value={detail.userDetails.rollno} />
                  <InfoRow icon={<PhoneIcon />}  label="Mobile"      value={detail.userDetails.mobile_no || "Not provided"} />
                  <InfoRow icon={<SchoolIcon />} label="Department"  value={detail.userDetails.department} />
                  <InfoRow icon={<SchoolIcon />} label="College"     value={detail.userDetails.college} />
                </Box>
              </Paper>
            )}

            <Table size="small">
              <TableHead>
                <TableRow>
                  {["#", "Test Name", "Score", "Max", "Percentage"].map((h) => (
                    <TableCell key={h} className="cp-th">{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {detail?.tests?.map((test, idx) => (
                  <TableRow key={test.test_id}>
                    <TableCell className="cp-td">{idx + 1}</TableCell>
                    <TableCell className="cp-td">{test.test_name}</TableCell>
                    <TableCell className="cp-td">{test.result_score}</TableCell>
                    <TableCell className="cp-td">{test.test_total_score}</TableCell>
                    <TableCell className="cp-td">{test.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Box sx={{ mb: 4, mt: 2 }}>
              <Typography className="cp-chart-section-title">Performance Analytics</Typography>
              <Box className="cp-dialog-charts-grid">
                <Paper className="cp-chart-paper" sx={{ height: 320 }}>
                  <Bar data={barChartData} options={barOptions} />
                </Paper>
                <Paper className="cp-chart-paper cp-chart-paper--doughnut" sx={{ height: 320 }}>
                  <Typography className="cp-doughnut-label">Overall Score Breakdown</Typography>
                  <Box sx={{ flex: 1, position: "relative" }}>
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  </Box>
                  <Box className="cp-doughnut-footer">
                    <Typography className="cp-doughnut-pct" style={{ color: C.primary }}>{detail.average_percentage}%</Typography>
                    <Typography className="cp-doughnut-sub">Average Performance</Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

/* ── buildAttendanceData ────────────────────────────────────── */
const buildAttendanceData = (students, testWiseResults) =>
  testWiseResults.map((test) => {
    const total = students.length;
    const attended = students.filter((s) => s.tests.some((t) => t.test_id === test.test_id && t.scored_mark > 0)).length;
    const absent = total - attended;
    return {
      test_name: test.test_name, test_id: test.test_id,
      test_date: test.test_activeAt || "N/A",
      attended, absent, total,
      attendance_pct: total === 0 ? 0 : ((attended / total) * 100).toFixed(1),
    };
  });

/* ── AttendanceReportSection ────────────────────────────────── */
const AttendanceReportSection = ({ students, testWiseResults }) => {
  const sectionRef = useRef(null);
  const data = buildAttendanceData(students, testWiseResults);

  const chartData = {
    labels: data.map((d) => d.test_name),
    datasets: [
      { label: "Attended", data: data.map((d) => d.attended), backgroundColor: alpha(C.success, 0.8), borderColor: C.success, borderWidth: 1.5, borderRadius: 8 },
      { label: "Absent",   data: data.map((d) => d.absent),   backgroundColor: alpha(C.danger,  0.7), borderColor: C.danger,  borderWidth: 1.5, borderRadius: 8 },
    ],
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: "top", labels: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }, boxWidth: 14 } } },
    scales: { y: { beginAtZero: true, grid: { color: "#f5f5f5" }, ticks: { font: { family: "'Plus Jakarta Sans', sans-serif" } } }, x: { grid: { display: false }, ticks: { font: { family: "'Plus Jakarta Sans', sans-serif" } } } },
  };

  return (
    <Paper className="cp-section-paper">
      <SectionHeader icon={<AttendanceIcon />} title="Attendance Report" color={C.success}
        extra={<PDFDownloadButton sectionRef={sectionRef} filename="attendance_report.pdf" />}
      />
      <Box ref={sectionRef} className="cp-section-inner">
        <Box className="cp-attend-stats-grid">
          {[
            { label: "Total Students",  value: students.length, color: C.primary },
            { label: "Tests Conducted", value: testWiseResults.length, color: C.secondary },
            { label: "Avg Attendance",  value: data.length === 0 ? "0%" : `${(data.reduce((s, d) => s + parseFloat(d.attendance_pct), 0) / data.length).toFixed(1)}%`, color: C.success },
            { label: "Avg Absent",      value: data.length === 0 ? "0" : (data.reduce((s, d) => s + d.absent, 0) / data.length).toFixed(1), color: C.danger },
          ].map(({ label, value, color }) => (
            <Paper key={label} className="cp-mini-stat" style={{ border: `1px solid ${alpha(color, 0.15)}` }}>
              <Typography className="cp-mini-stat-label" style={{ color: alpha(color, 0.8) }}>{label}</Typography>
              <Typography className="cp-mini-stat-value" style={{ color }}>{value}</Typography>
            </Paper>
          ))}
        </Box>
        <Box className="cp-chart-box-260"><Bar data={chartData} options={chartOptions} /></Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>{["Test Name","Date","Total Students","Attended","Absent","Attendance %"].map((h) => <TableCell key={h} className="cp-th">{h}</TableCell>)}</TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i} sx={{ "&:hover": { bgcolor: alpha(C.success, 0.03) } }}>
                  <TableCell className="cp-td cp-td-bold">{row.test_name}</TableCell>
                  <TableCell className="cp-td">{row.test_date}</TableCell>
                  <TableCell className="cp-td">{row.total}</TableCell>
                  <TableCell className="cp-td"><Chip label={row.attended} size="small" sx={{ bgcolor: alpha(C.success, 0.12), color: C.success, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }} /></TableCell>
                  <TableCell className="cp-td"><Chip label={row.absent}   size="small" sx={{ bgcolor: alpha(C.danger,  0.1),  color: C.danger,  fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }} /></TableCell>
                  <TableCell className="cp-td"><ScoreBar value={parseFloat(row.attendance_pct)} max={100} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Paper>
  );
};

/* ── DayWisePieSection ──────────────────────────────────────── */
const DayWisePieSection = ({ students, testWiseResults }) => {
  const sectionRef = useRef(null);
  const data = buildAttendanceData(students, testWiseResults);
  const scoreColors = [C.primary, C.secondary, C.success, C.warning, C.danger, "#8b5cf6", "#06b6d4", "#ec4899"];

  return (
    <Paper className="cp-section-paper">
      <SectionHeader icon={<PieChartIcon />} title="Day-wise Statistics (Pie Chart)" color={C.secondary}
        extra={<PDFDownloadButton sectionRef={sectionRef} filename="daywise_statistics.pdf" />}
      />
      <Box ref={sectionRef} className="cp-section-inner">
        <Box className="cp-pie-grid" style={{ gridTemplateColumns: `repeat(${Math.min(data.length, 3)}, 1fr)` }}>
          {data.map((test, idx) => {
            const colorAttended = scoreColors[idx % scoreColors.length];
            const pieData = {
              labels: ["Attended", "Absent"],
              datasets: [{ data: [test.attended, test.absent], backgroundColor: [alpha(colorAttended, 0.85), alpha(C.danger, 0.7)], borderColor: ["#fff", "#fff"], borderWidth: 3 }],
            };
            const pieOptions = {
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: "bottom", labels: { font: { size: 12, family: "'Plus Jakarta Sans', sans-serif" }, padding: 12, boxWidth: 12 } }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} (${((ctx.raw / test.total) * 100).toFixed(1)}%)` } } },
            };
            return (
              <Paper key={test.test_id} className="cp-pie-card" style={{ border: `1px solid ${alpha(colorAttended, 0.2)}` }}>
                <Typography className="cp-pie-card-title">{test.test_name}</Typography>
                <Typography className="cp-pie-card-date">{test.test_date}</Typography>
                <Box className="cp-pie-chart-box"><Pie data={pieData} options={pieOptions} /></Box>
                <Box className="cp-pie-chips">
                  <Chip label={`${test.attended} Attended`} size="small" sx={{ bgcolor: alpha(colorAttended, 0.12), color: colorAttended, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                  <Chip label={`${test.absent} Absent`}     size="small" sx={{ bgcolor: alpha(C.danger, 0.1),        color: C.danger,       fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                </Box>
                <Typography className="cp-pie-pct" style={{ color: colorAttended }}>{test.attendance_pct}%</Typography>
                <Typography className="cp-pie-pct-sub">Attendance Rate</Typography>
              </Paper>
            );
          })}
        </Box>
        {data.length === 0 && <Box className="cp-empty-state"><Typography className="cp-empty-text">No test data available</Typography></Box>}
      </Box>
    </Paper>
  );
};

/* ── IndividualProgressGridSection ─────────────────────────── */
const IndividualProgressGridSection = ({ students, testWiseResults }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [pdfLoading, setPdfLoading] = useState(false);

  const processedStudents = React.useMemo(() => {
    let list = students.map((student) => {
      const totalScore = student.tests.reduce((s, t) => s + t.scored_mark, 0);
      const totalMax   = student.tests.reduce((s, t) => s + t.total_mark, 0);
      const overallPct = totalMax > 0 ? parseFloat(((totalScore / totalMax) * 100).toFixed(1)) : 0;
      return { ...student, _totalScore: totalScore, _totalMax: totalMax, _overallPct: overallPct };
    });
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((s) => s.user_name.toLowerCase().includes(q) || (s.rollno || "").toLowerCase().includes(q));
    }
    if (filterStatus === "excellent")  list = list.filter((s) => s._overallPct >= 75);
    else if (filterStatus === "average")   list = list.filter((s) => s._overallPct >= 50 && s._overallPct < 75);
    else if (filterStatus === "needswork") list = list.filter((s) => s._overallPct < 50);
    if (sortBy === "name")        list = [...list].sort((a, b) => a.user_name.localeCompare(b.user_name));
    else if (sortBy === "rollno")      list = [...list].sort((a, b) => (a.rollno || "").localeCompare(b.rollno || ""));
    else if (sortBy === "score_desc")  list = [...list].sort((a, b) => b._overallPct - a._overallPct);
    else if (sortBy === "score_asc")   list = [...list].sort((a, b) => a._overallPct - b._overallPct);
    return list;
  }, [students, searchQuery, filterStatus, sortBy]);

  const paginatedStudents = processedStudents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await new Promise((resolve, reject) => {
        if (window.jspdf) return resolve();
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
      await new Promise((resolve, reject) => {
        if (window.jspdf?.jsPDF?.prototype?.autoTable) return resolve();
        if (document.querySelector('script[src*="jspdf-autotable"]')) { setTimeout(resolve, 200); return; }
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
        s.onload = () => setTimeout(resolve, 100); s.onerror = reject;
        document.head.appendChild(s);
      });
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });
      const moduleName  = processedStudents[0]?.module_name      || "Module";
      const collegeName = processedStudents[0]?.college_name     || "College";
      const pocName     = processedStudents[0]?.module_poc_name  || "POC";
      const generatedDate = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      doc.setFillColor(12, 131, 200);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont("helvetica", "bold");
      doc.text("Individual Progress Report — Per Day", 14, 11);
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(`${collegeName}   |   Module: ${moduleName}   |   POC: ${pocName}   |   Generated: ${generatedDate}`, 14, 20);
      doc.text(`Total Records: ${processedStudents.length}   |   Tests: ${testWiseResults.length}`, 14, 26);
      const excellent = processedStudents.filter((s) => s._overallPct >= 75).length;
      const average   = processedStudents.filter((s) => s._overallPct >= 50 && s._overallPct < 75).length;
      const needsWork = processedStudents.filter((s) => s._overallPct < 50).length;
      const avgPct    = processedStudents.length > 0 ? (processedStudents.reduce((s, x) => s + x._overallPct, 0) / processedStudents.length).toFixed(1) : 0;
      doc.setFillColor(245, 248, 252); doc.rect(0, 28, doc.internal.pageSize.getWidth(), 14, "F");
      doc.setTextColor(60, 60, 60); doc.setFontSize(9); doc.setFont("helvetica", "bold");
      const statsY = 37; const pageW = doc.internal.pageSize.getWidth();
      doc.text(`Class Average: ${avgPct}%`, 14, statsY);
      doc.setTextColor(34, 197, 94);  doc.text(`Excellent (≥75%): ${excellent}`, pageW * 0.25, statsY);
      doc.setTextColor(245, 158, 11); doc.text(`Average (50–74%): ${average}`,   pageW * 0.45, statsY);
      doc.setTextColor(239, 68, 68);  doc.text(`Needs Work (<50%): ${needsWork}`, pageW * 0.65, statsY);
      const testHeaders = testWiseResults.map((t) => ({ header: `${t.test_name}\n${t.test_activeAt || ""}`, dataKey: t.test_id }));
      const columns = [{ header: "#", dataKey: "sno" }, { header: "Student Name", dataKey: "name" }, { header: "Roll No", dataKey: "rollno" }, ...testHeaders, { header: "Total\nScore", dataKey: "total" }, { header: "Max\nScore", dataKey: "max" }, { header: "Overall %", dataKey: "pct" }, { header: "Status", dataKey: "status" }];
      const rows = processedStudents.map((student, idx) => {
        const row = { sno: idx + 1, name: student.user_name, rollno: student.rollno || "—", total: student._totalScore, max: student._totalMax, pct: `${student._overallPct}%`, status: student._overallPct >= 75 ? "Excellent" : student._overallPct >= 50 ? "Average" : "Needs Work" };
        testWiseResults.forEach((test) => { const t = student.tests.find((x) => x.test_id === test.test_id); row[test.test_id] = t ? `${t.scored_mark}/${t.total_mark}\n(${t.percentage}%)` : "—"; });
        return row;
      });
      doc.autoTable({
        startY: 45, columns, body: rows, theme: "grid",
        headStyles: { fillColor: [12, 131, 200], textColor: 255, fontStyle: "bold", fontSize: 7.5, cellPadding: { top: 3, bottom: 3, left: 2, right: 2 }, halign: "center", valign: "middle", lineWidth: 0.1, lineColor: [255, 255, 255] },
        bodyStyles: { fontSize: 7.5, cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 }, valign: "middle", lineColor: [230, 236, 244], lineWidth: 0.1 },
        alternateRowStyles: { fillColor: [247, 250, 253] },
        columnStyles: { sno: { halign: "center", cellWidth: 8, fontStyle: "bold" }, name: { cellWidth: 38, fontStyle: "bold" }, rollno: { halign: "center", cellWidth: 20 }, total: { halign: "center", cellWidth: 14 }, max: { halign: "center", cellWidth: 14 }, pct: { halign: "center", cellWidth: 16, fontStyle: "bold" }, status: { halign: "center", cellWidth: 18 }, ...Object.fromEntries(testWiseResults.map((t) => [t.test_id, { halign: "center", cellWidth: 28 }])) },
        didParseCell: (data) => {
          if (data.column.dataKey === "status" && data.section === "body") { const v = data.cell.raw; if (v === "Excellent") { data.cell.styles.textColor = [21,128,61]; data.cell.styles.fontStyle = "bold"; } else if (v === "Average") { data.cell.styles.textColor = [161,98,7]; data.cell.styles.fontStyle = "bold"; } else { data.cell.styles.textColor = [185,28,28]; data.cell.styles.fontStyle = "bold"; } }
          if (data.column.dataKey === "pct" && data.section === "body") { const v = parseFloat(data.cell.raw); if (v >= 75) data.cell.styles.textColor = [21,128,61]; else if (v >= 50) data.cell.styles.textColor = [161,98,7]; else data.cell.styles.textColor = [185,28,28]; }
          if (testWiseResults.some((t) => t.test_id === data.column.dataKey) && data.section === "body") { const v = data.cell.raw; if (v && v !== "—") { const m = v.match(/\((\d+(?:\.\d+)?)%\)/); if (m) { const p = parseFloat(m[1]); if (p >= 75) data.cell.styles.textColor = [21,128,61]; else if (p >= 50) data.cell.styles.textColor = [161,98,7]; else data.cell.styles.textColor = [185,28,28]; } } }
          if (data.column.dataKey === "sno" && data.section === "body") data.cell.styles.textColor = [100, 116, 139];
        },
        didDrawPage: (data) => { const pW = doc.internal.pageSize.getWidth(); const pH = doc.internal.pageSize.getHeight(); doc.setFontSize(7.5); doc.setTextColor(150); doc.text(`Page ${doc.getCurrentPageInfo().pageNumber} of ${doc.getNumberOfPages()} — Individual Progress Report`, pW / 2, pH - 6, { align: "center" }); doc.text(`${collegeName} — ${moduleName}`, 14, pH - 6); doc.text(`Generated: ${generatedDate}`, pW - 14, pH - 6, { align: "right" }); },
        margin: { top: 45, left: 8, right: 8, bottom: 14 }, tableWidth: "auto", rowPageBreak: "auto",
      });
      doc.save(`individual_progress_report_${moduleName.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF generation failed. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  const excellent = processedStudents.filter((s) => s._overallPct >= 75).length;
  const average   = processedStudents.filter((s) => s._overallPct >= 50 && s._overallPct < 75).length;
  const needsWork = processedStudents.filter((s) => s._overallPct < 50).length;

  return (
    <Paper className="cp-section-paper">
      <SectionHeader icon={<GridViewIcon />} title="Individual's Progress Per Day (Grid)" color={C.primary}
        extra={
          <Button variant="contained" size="small" startIcon={pdfLoading ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
            onClick={handleDownloadPDF} disabled={pdfLoading} className="cp-btn-export"
            sx={{ background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})`, boxShadow: `0 3px 12px ${alpha(C.primary, 0.35)}`, "&:hover": { background: `linear-gradient(90deg, ${C.secondary}, ${C.primary})` }, "&.Mui-disabled": { opacity: 0.6 } }}>
            {pdfLoading ? "Generating..." : `Export All ${students.length} Records`}
          </Button>
        }
      />

      {/* Controls */}
      <Box className="cp-grid-controls">
        <Box className="cp-grid-search">
          <SearchIcon sx={{ fontSize: 16, color: alpha(C.primary, 0.6) }} />
          <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            placeholder="Search by name or roll no…" className="cp-grid-search-input" />
          {searchQuery && <Box onClick={() => setSearchQuery("")} className="cp-grid-search-clear">×</Box>}
        </Box>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }} displayEmpty
            sx={{ borderRadius: "10px", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif", "& .MuiOutlinedInput-notchedOutline": { borderColor: alpha(C.primary, 0.25) } }}>
            <MenuItem value="all">All Students</MenuItem>
            <MenuItem value="excellent">Excellent ≥75%</MenuItem>
            <MenuItem value="average">Average 50–74%</MenuItem>
            <MenuItem value="needswork">Needs Work &lt;50%</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} displayEmpty
            sx={{ borderRadius: "10px", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif", "& .MuiOutlinedInput-notchedOutline": { borderColor: alpha(C.primary, 0.25) } }}>
            <MenuItem value="name">Sort: Name A–Z</MenuItem>
            <MenuItem value="rollno">Sort: Roll No</MenuItem>
            <MenuItem value="score_desc">Sort: Highest First</MenuItem>
            <MenuItem value="score_asc">Sort: Lowest First</MenuItem>
          </Select>
        </FormControl>
        <Box className="cp-grid-legend">
          {[{ label: `Excellent: ${excellent}`, color: C.success }, { label: `Average: ${average}`, color: C.warning }, { label: `Needs Work: ${needsWork}`, color: C.danger }].map(({ label, color }) => (
            <Chip key={label} label={label} size="small" sx={{ bgcolor: alpha(color, 0.1), color, fontWeight: 700, fontSize: "11px", fontFamily: "'Plus Jakarta Sans', sans-serif", border: `1px solid ${alpha(color, 0.25)}` }} />
          ))}
        </Box>
      </Box>

      <Typography className="cp-grid-count">
        Showing {paginatedStudents.length} of {processedStudents.length} students{searchQuery && ` matching "${searchQuery}"`}
      </Typography>

      <TableContainer className="cp-grid-table-container">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className="cp-th cp-th-center cp-th-narrow">#</TableCell>
              <TableCell className="cp-th cp-th-sticky" sx={{ position: "sticky", left: 0, zIndex: 3, minWidth: 160, boxShadow: `2px 0 8px ${alpha(C.primary, 0.07)}` }}>
                Student Name
              </TableCell>
              <TableCell className="cp-th cp-th-center" sx={{ minWidth: 90 }}>Roll No</TableCell>
              {testWiseResults.map((test) => (
                <TableCell key={test.test_id} className="cp-th cp-th-center" sx={{ minWidth: 100 }}>
                  <Box>
                    <Typography className="cp-th-test-name">{test.test_name}</Typography>
                    <Typography className="cp-th-test-date">{test.test_activeAt || "N/A"}</Typography>
                  </Box>
                </TableCell>
              ))}
              <TableCell className="cp-th cp-th-center" sx={{ minWidth: 80 }}>Overall %</TableCell>
              <TableCell className="cp-th cp-th-center" sx={{ minWidth: 100 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedStudents.map((student, sIdx) => {
              const globalIdx = page * rowsPerPage + sIdx + 1;
              const overallPct = student._overallPct;
              const badge = getScoreLabel(overallPct);
              const isEven = sIdx % 2 === 0;
              return (
                <TableRow key={student.user_id || sIdx}
                  sx={{ bgcolor: isEven ? "white" : alpha(C.primary, 0.015), "&:hover": { bgcolor: alpha(C.primary, 0.05), transition: "background 0.15s" } }}>
                  <TableCell className="cp-td cp-td-center cp-td-rownum">{globalIdx}</TableCell>
                  <TableCell className="cp-td cp-td-bold cp-td-sticky"
                    sx={{ position: "sticky", left: 0, bgcolor: isEven ? "white" : alpha(C.primary, 0.015), zIndex: 1, boxShadow: `2px 0 8px ${alpha(C.primary, 0.05)}` }}>
                    <Box className="cp-grid-name-cell">
                      <Box className="cp-grid-name-avatar" style={{ background: alpha(badge.color, 0.12), color: badge.color }}>
                        {student.user_name.charAt(0).toUpperCase()}
                      </Box>
                      <Typography className="cp-grid-name-text">{student.user_name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell className="cp-td cp-td-center">
                    <Chip label={student.rollno || "—"} size="small" sx={{ bgcolor: alpha(C.primary, 0.07), color: C.primary, fontWeight: 600, fontSize: "11px", fontFamily: "'Plus Jakarta Sans', sans-serif", height: 22 }} />
                  </TableCell>
                  {testWiseResults.map((test) => {
                    const t = student.tests.find((x) => x.test_id === test.test_id);
                    const pct = t ? t.percentage : null;
                    const scoreColor = pct !== null ? getScoreColor(pct) : "#e2e8f0";
                    return (
                      <TableCell key={test.test_id} className="cp-td cp-td-center cp-td-score">
                        {pct !== null ? (
                          <Box className="cp-score-badge" style={{ background: alpha(scoreColor, 0.08), border: `1px solid ${alpha(scoreColor, 0.2)}` }}>
                            <Typography className="cp-score-badge-mark" style={{ color: scoreColor }}>{t.scored_mark}/{t.total_mark}</Typography>
                            <Typography className="cp-score-badge-pct" style={{ color: alpha(scoreColor, 0.8) }}>{pct}%</Typography>
                          </Box>
                        ) : (
                          <Box className="cp-absent-badge">
                            <Typography className="cp-absent-text">Absent</Typography>
                          </Box>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="cp-td cp-td-center">
                    <Box className="cp-overall-pct">
                      <Typography className="cp-overall-pct-value" style={{ color: badge.color }}>{overallPct}%</Typography>
                      <Box className="cp-overall-pct-bar" style={{ background: alpha(badge.color, 0.15) }}>
                        <Box style={{ width: `${overallPct}%`, height: "100%", background: badge.color, borderRadius: 2 }} />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell className="cp-td cp-td-center">
                    <Chip label={badge.label} size="small" sx={{ bgcolor: alpha(badge.color, 0.1), color: badge.color, fontWeight: 700, fontSize: "11px", fontFamily: "'Plus Jakarta Sans', sans-serif", border: `1px solid ${alpha(badge.color, 0.25)}` }} />
                  </TableCell>
                </TableRow>
              );
            })}
            {paginatedStudents.length === 0 && (
              <TableRow><TableCell colSpan={4 + testWiseResults.length} className="cp-td-empty">No students match your search / filter.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination rowsPerPageOptions={[10, 15, 25, 50, { label: "All", value: -1 }]} component="div"
        count={processedStudents.length} rowsPerPage={rowsPerPage} page={page}
        onPageChange={(_, p) => setPage(p)}
        onRowsPerPageChange={(e) => { const v = parseInt(e.target.value, 10); setRowsPerPage(v === -1 ? processedStudents.length : v); setPage(0); }}
        sx={{ "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "12px" } }}
      />
    </Paper>
  );
};

/* ── OverallColumnChartSection ──────────────────────────────── */
const OverallColumnChartSection = ({ students, testWiseResults }) => {
  const sectionRef = useRef(null);
  const sorted = [...students].map((s) => {
    const total = s.tests.reduce((acc, t) => acc + t.scored_mark, 0);
    const max   = s.tests.reduce((acc, t) => acc + t.total_mark, 0);
    return { name: s.user_name, total, max, pct: max > 0 ? (total / max) * 100 : 0 };
  }).sort((a, b) => b.total - a.total);

  const barData = {
    labels: sorted.map((s) => s.name.split(" ")[0]),
    datasets: [
      { label: "Score Obtained", data: sorted.map((s) => s.total), backgroundColor: sorted.map((s) => alpha(getScoreColor(s.pct), 0.8)), borderColor: sorted.map((s) => getScoreColor(s.pct)), borderWidth: 1.5, borderRadius: 6, borderSkipped: false },
      { label: "Max Score",      data: sorted.map((s) => s.max),   backgroundColor: alpha("#cbd5e1", 0.6), borderColor: "#cbd5e1", borderWidth: 1, borderRadius: 6, borderSkipped: false },
    ],
  };
  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: "top", labels: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }, boxWidth: 14 } }, tooltip: { callbacks: { afterLabel: (ctx) => { if (ctx.datasetIndex === 0) return `Percentage: ${sorted[ctx.dataIndex]?.pct.toFixed(1)}%`; return ""; } } } },
    scales: { y: { beginAtZero: true, grid: { color: "#f0f0f0" }, ticks: { font: { family: "'Plus Jakarta Sans', sans-serif" } }, title: { display: true, text: "Marks", font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }, color: "#888" } }, x: { grid: { display: false }, ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 }, maxRotation: 45 }, title: { display: true, text: "Students", font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }, color: "#888" } } },
  };
  const excellent  = sorted.filter((s) => s.pct >= 75).length;
  const needsWork  = sorted.filter((s) => s.pct < 50).length;
  const totalMax      = sorted.reduce((a, s) => a + s.max, 0);
  const totalObtained = sorted.reduce((a, s) => a + s.total, 0);

  return (
    <Paper className="cp-section-paper">
      <SectionHeader icon={<EqualizerIcon />} title="Overall Column Chart — Total Test Marks" color={C.primary}
        extra={<PDFDownloadButton sectionRef={sectionRef} filename="overall_column_chart.pdf" />}
      />
      <Box ref={sectionRef} className="cp-section-inner">
        <Box className="cp-overall-stats-grid">
          {[
            { label: "Total Students",    value: students.length, color: C.primary },
            { label: "Total Marks (Sum)", value: totalObtained,   color: C.secondary },
            { label: "Max Possible",      value: totalMax,         color: "#64748b" },
            { label: "Excellent (≥75%)",  value: excellent,        color: C.success },
            { label: "Needs Work (<50%)", value: needsWork,        color: C.danger },
          ].map(({ label, value, color }) => (
            <Paper key={label} className="cp-mini-stat" style={{ border: `1px solid ${alpha(color, 0.2)}` }}>
              <Typography className="cp-mini-stat-label" style={{ color: alpha(color, 0.8) }}>{label}</Typography>
              <Typography className="cp-mini-stat-value" style={{ color, fontSize: "22px" }}>{value}</Typography>
            </Paper>
          ))}
        </Box>
        <Box className="cp-chart-box-340"><Bar data={barData} options={barOptions} /></Box>
        <Box className="cp-legend-row">
          {[{ label: "Excellent (≥75%)", color: C.success }, { label: "Average (50–74%)", color: C.warning }, { label: "Needs Work (<50%)", color: C.danger }].map(({ label, color }) => (
            <Box key={label} className="cp-legend-item">
              <Box className="cp-legend-dot" style={{ background: color }} />
              <Typography className="cp-legend-text">{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

/* ══════════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════════ */
const ClassPerformance = () => {
  const [students, setStudents] = useState([]);
  const [testWiseResults, setTestWiseResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orgId, setOrgId] = useState("");
  const [modId, setModId] = useState("");
  const [modPocId, setModPocId] = useState("");
  const [loadedData, setLoadedData] = useState(false);
  const [studentTabValue, setStudentTabValue] = useState(0);
  const [testWisePage, setTestWisePage] = useState(0);
  const [testWiseRowsPerPage, setTestWiseRowsPerPage] = useState(5);
  const [studentWisePage, setStudentWisePage] = useState(0);
  const [studentWiseRowsPerPage, setStudentWiseRowsPerPage] = useState(5);
  const [overallPage, setOverallPage] = useState(0);
  const [overallRowsPerPage, setOverallRowsPerPage] = useState(5);
  const [orgs, setOrgs] = useState([]);
  const [modules, setModules] = useState([]);
  const [pocs, setPocs] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [individualData, setIndividualData] = useState(null);

  useEffect(() => {
    (async () => {
      try { setOrgs(await getOrgId()); } catch (e) { console.error(e); }
      try { setModules(await getModId()); } catch (e) { console.error(e); }
      try { setPocs(await getPocId()); } catch (e) { console.error(e); }
    })();
  }, []);

  const getAggregateScore = (student) => {
    const totalScored   = student.tests.reduce((sum, t) => sum + t.scored_mark, 0);
    const totalPossible = student.tests.reduce((sum, t) => sum + t.total_mark, 0);
    const scale = student.details.aggregate_score || 100;
    return { score: totalScored, maxScore: totalPossible, aggregateScore: totalPossible === 0 ? 0 : Number(((totalScored / totalPossible) * scale).toFixed(2)) };
  };

  const handleFetchData = async () => {
    if (!orgId || !modId || !modPocId) { setError("Please enter all IDs (Organization, Module, POC)"); return; }
    setLoading(true); setError(null);
    try {
      const sessionData = JSON.parse(localStorage.getItem("true"));
      const token = sessionData?.token;
      const response = await axios.get(`http://localhost:5000/api/fetch_details/${orgId}/${modId}/${modPocId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = response.data;
      if (!Array.isArray(data.user_scores)) throw new Error("Invalid response: user_scores is not an array");
      const modTests = Array.isArray(data.poc?.mod_tests) ? data.poc.mod_tests : [];
      const enhancedData = data.user_scores.map((user) => {
        const scores = user.scores || {};
        const tests  = Array.isArray(scores.tests) ? scores.tests : [];
        return {
          user_name: user.name || "Unknown", user_id: user.userId || user.user_id || user._id || user.id || null,
          college_name: data.organization?.org_name || "Unknown College", module_name: data.module?.mod_name || "Unknown Module",
          module_poc_name: data.poc?.poc_name || "Unknown POC", module_poc_id: data.poc?.poc_id || "",
          rollno: scores.userDetails?.rollno || "—", department: scores.userDetails?.department || "—",
          email: scores.userDetails?.email || "—", userDetails: scores.userDetails || null,
          tests: tests.map((test, idx) => {
            const modTest = modTests.find((mt) => mt.test_id === test.test_id) || {};
            return { test_id: test.test_id, scored_mark: test.result_score || 0, total_mark: test.test_total_score || 0, date: modTest.activeAt || test.assigned_date || "", name: test.name || modTest.name || `Test ${idx + 1}`, percentage: test.percentage || 0, test_language: test.test_language || modTest.test_language || "N/A" };
          }),
          details: { aggregate_score: scores.aggregate_score || 0, total_days: scores.total_days || 0, attend_test_days: scores.attend_test_days || 0, not_attend_test_days: scores.not_attend_test_days || 0 },
          totalScoredMarks: tests.reduce((sum, t) => sum + (t.result_score || 0), 0),
          totalMarks: tests.reduce((sum, t) => sum + (t.test_total_score || 0), 0),
          totalTestDays: tests.length,
        };
      });
      setStudents(enhancedData);
      setTestWiseResults(data.test_wise_total_result || []);
      setLoadedData(true);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const getIndividualTestScore = async (pocId, userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/aggregate_scores/${pocId}/${userId}`, { headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem("true"))?.token}` } });
      return response.data;
    } catch (error) { setError(error.message || "Failed to load individual test scores"); return null; }
  };

  const handleStudentClick = async (student) => {
    const userId = student.user_id;
    const pocId  = student.module_poc_id;
    if (!userId) { setError("User ID not found on this student record"); return; }
    if (!pocId)  { setError("POC ID not found"); return; }
    try {
      setLoading(true);
      const data = await getIndividualTestScore(pocId, userId);
      setIndividualData(data); setSelectedStudent(student); setDialogOpen(true);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const calculateClassMetrics = () => {
    const totalStudents = students.length;
    if (totalStudents === 0) return { avgScore: "0.0", avgPercentage: "0.0", totalStudents: 0, totalMarks: 0, topScorer: null, passRate: "0.0" };
    const totalScoredMarks   = students.reduce((sum, s) => sum + getAggregateScore(s).score, 0);
    const totalPossibleMarks = students.reduce((sum, s) => sum + getAggregateScore(s).maxScore, 0);
    const topScorer = [...students].sort((a, b) => getAggregateScore(b).score - getAggregateScore(a).score)[0];
    const passed = students.filter((s) => { const { score, maxScore } = getAggregateScore(s); return maxScore > 0 && (score / maxScore) * 100 >= 50; }).length;
    return { avgScore: (totalScoredMarks / totalStudents).toFixed(1), avgPercentage: totalPossibleMarks === 0 ? "0.0" : ((totalScoredMarks / totalPossibleMarks) * 100).toFixed(1), totalStudents, totalMarks: (totalPossibleMarks / totalStudents).toFixed(0), topScorer, passRate: ((passed / totalStudents) * 100).toFixed(1) };
  };

  const getTestWiseBarData = () => ({
    labels: testWiseResults.map((t, i) => t.test_name || `Test ${i + 1}`),
    datasets: [{ label: "Average %", data: testWiseResults.map((t) => t.average_percentage), backgroundColor: testWiseResults.map((t) => alpha(getScoreColor(t.average_percentage), 0.8)), borderColor: testWiseResults.map((t) => getScoreColor(t.average_percentage)), borderWidth: 1.5, borderRadius: 8 }],
  });

  const getScoreDistributionData = () => {
    const exc = students.filter((s) => { const { score, maxScore } = getAggregateScore(s); return maxScore > 0 && (score / maxScore) * 100 >= 75; }).length;
    const avg = students.filter((s) => { const { score, maxScore } = getAggregateScore(s); const p = maxScore > 0 ? (score / maxScore) * 100 : 0; return p >= 50 && p < 75; }).length;
    const low = students.filter((s) => { const { score, maxScore } = getAggregateScore(s); return maxScore > 0 && (score / maxScore) * 100 < 50; }).length;
    return { labels: ["Excellent (≥75%)", "Average (50-74%)", "Needs Work (<50%)"], datasets: [{ data: [exc, avg, low], backgroundColor: [alpha(C.success, 0.8), alpha(C.warning, 0.8), alpha(C.danger, 0.8)], borderColor: [C.success, C.warning, C.danger], borderWidth: 2 }] };
  };

  const getStudentProgressData = () => {
    const sorted = [...students].sort((a, b) => { const pa = getAggregateScore(a); const pb = getAggregateScore(b); return pb.maxScore > 0 ? pb.score / pb.maxScore - (pa.maxScore > 0 ? pa.score / pa.maxScore : 0) : 0; }).slice(0, 10);
    return { labels: sorted.map((s) => s.user_name.split(" ")[0]), datasets: [{ label: "Score %", fill: true, borderColor: C.primary, backgroundColor: alpha(C.primary, 0.1), tension: 0.4, pointRadius: 5, data: sorted.map((s) => { const { score, maxScore } = getAggregateScore(s); return maxScore > 0 ? ((score / maxScore) * 100).toFixed(1) : 0; }), pointBackgroundColor: sorted.map((s) => { const { score, maxScore } = getAggregateScore(s); return getScoreColor(maxScore > 0 ? (score / maxScore) * 100 : 0); }) }] };
  };

  const metrics = calculateClassMetrics();

  const clickBadge = (
    <Chip label="Click row for details" size="small" sx={{ bgcolor: alpha(C.primary, 0.08), color: C.primary, fontWeight: 600, fontSize: "11px", fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
  );

  return (
    <>
      <Admin_Dash />
      <Box className="cp-page-wrapper">
        <Box className="cp-page-inner">

          {/* Page Header */}
          <Box className="cp-page-header">
            <Typography className="cp-page-eyebrow">Analytics</Typography>
            <Typography className="cp-page-title">Class Performance</Typography>
            <Typography className="cp-page-subtitle">Fetch and analyse student results by organisation, module and POC.</Typography>
          </Box>

          {/* Search Panel */}
          <Paper className="cp-section-paper">
            <SectionHeader icon={<SearchIcon />} title="Enter Course Details" color={C.primary} />
            <Box className="cp-search-grid">
              <FormControl fullWidth sx={inputSx(C.primary, C.secondary)}>
                <InputLabel>Organization</InputLabel>
                <Select value={orgId} onChange={(e) => setOrgId(e.target.value)} label="Organization">
                  {orgs.map((org) => <MenuItem key={org.org_id} value={org.org_id}>{org.org_name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={inputSx(C.primary, C.secondary)}>
                <InputLabel>Module</InputLabel>
                <Select value={modId} onChange={(e) => setModId(e.target.value)} label="Module">
                  {modules.map((mod) => <MenuItem key={mod.mod_id} value={mod.mod_id}>{mod.mod_name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={inputSx(C.primary, C.secondary)}>
                <InputLabel>POC</InputLabel>
                <Select value={modPocId} onChange={(e) => setModPocId(e.target.value)} label="POC">
                  {pocs.map((poc) => <MenuItem key={poc.mod_poc_id} value={poc.mod_poc_id}>{poc.mod_poc_name}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <Box className="cp-fetch-btn-row">
              <Button variant="contained"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                onClick={handleFetchData} disabled={loading} className="cp-btn-fetch"
                sx={{ background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})`, boxShadow: `0 4px 16px ${alpha(C.primary, 0.35)}`, "&:hover": { background: `linear-gradient(90deg, ${C.secondary}, ${C.primary})` } }}>
                {loading ? "Fetching..." : "Fetch Data"}
              </Button>
            </Box>
          </Paper>

          {error && <Alert severity="error" className="cp-alert">{error} — Please verify the entered IDs and try again.</Alert>}
          {loadedData && !loading && !error && students.length === 0 && (
            <Alert severity="info" className="cp-alert">No data found. Please verify the IDs and try again.</Alert>
          )}

          {loadedData && !loading && !error && students.length > 0 && (
            <Fade in timeout={600}>
              <Box>
                {/* Course Info */}
                <Paper className="cp-course-info-paper">
                  <Box className="cp-course-info-grid">
                    {[
                      { icon: <BusinessIcon />, label: "Organisation",    value: students[0].college_name,      color: C.primary },
                      { icon: <BookIcon />,     label: "Module",          value: students[0].module_name,       color: C.secondary },
                      { icon: <PersonIcon />,   label: "Point of Contact", value: students[0].module_poc_name, color: C.primary },
                    ].map(({ icon, label, value, color }) => (
                      <Box key={label} className="cp-course-info-item">
                        <Box className="cp-course-info-icon" style={{ background: alpha(color, 0.1) }}>
                          {React.cloneElement(icon, { sx: { color, fontSize: 20 } })}
                        </Box>
                        <Box>
                          <Typography className="cp-course-info-label">{label}</Typography>
                          <Typography className="cp-course-info-value">{value}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>

                {/* Stat Cards */}
                <Box className="cp-stat-cards-grid">
                  <StatCard title="Total Students"  value={metrics.totalStudents}          icon={<GroupIcon />}      color={C.primary} />
                  <StatCard title="Avg Score"        value={metrics.avgScore}               sub={`out of ${metrics.totalMarks}`} icon={<AssessmentIcon />} color={C.secondary} />
                  <StatCard title="Avg Percentage"   value={`${metrics.avgPercentage}%`}    icon={<PercentIcon />}    color={C.success} />
                  <StatCard title="Pass Rate"         value={`${metrics.passRate}%`}         sub="≥ 50% threshold"    icon={<TrendingUpIcon />} color={C.warning} />
                </Box>

                {/* Top Scorer */}
                {metrics.topScorer && (
                  <Paper className="cp-top-scorer" onClick={() => handleStudentClick(metrics.topScorer)}>
                    <Box className="cp-top-scorer-icon"><TrophyIcon sx={{ color: C.warning, fontSize: 22 }} /></Box>
                    <Box>
                      <Typography className="cp-top-scorer-label">Top Scorer — click to view profile</Typography>
                      <Typography className="cp-top-scorer-name">
                        {metrics.topScorer.user_name}
                        <Typography component="span" className="cp-top-scorer-score">
                          — {getAggregateScore(metrics.topScorer).score} / {getAggregateScore(metrics.topScorer).maxScore} marks
                        </Typography>
                      </Typography>
                    </Box>
                    <Chip
                      label={`${getAggregateScore(metrics.topScorer).maxScore > 0 ? ((getAggregateScore(metrics.topScorer).score / getAggregateScore(metrics.topScorer).maxScore) * 100).toFixed(1) : 0}%`}
                      sx={{ ml: "auto", bgcolor: alpha(C.success, 0.12), color: C.success, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    />
                  </Paper>
                )}

                {/* Charts Row */}
                <Box className="cp-charts-row">
                  <Paper className="cp-chart-card">
                    <SectionHeader icon={<BarChartIcon />} title="Test-Wise Average Performance" color={C.primary} />
                    <Box className="cp-chart-box-240">
                      <Bar data={getTestWiseBarData()} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` }, grid: { color: "#f5f5f5" } }, x: { grid: { display: false } } } }} />
                    </Box>
                  </Paper>
                  <Paper className="cp-chart-card">
                    <SectionHeader icon={<GroupIcon />} title="Score Distribution" color={C.secondary} />
                    <Box className="cp-chart-box-240 cp-chart-box-center">
                      <Doughnut data={getScoreDistributionData()} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 12, family: "'Plus Jakarta Sans', sans-serif" }, boxWidth: 12 } } }, cutout: "65%" }} />
                    </Box>
                  </Paper>
                </Box>

                <Paper className="cp-section-paper">
                  <SectionHeader icon={<TrendingUpIcon />} title="Top 10 Students — Score %" color={C.primary} />
                  <Box className="cp-chart-box-220">
                    <Line data={getStudentProgressData()} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100, ticks: { callback: (v) => `${v}%` }, grid: { color: "#f5f5f5" } }, x: { grid: { display: false } } } }} />
                  </Box>
                </Paper>

                {/* Test-Wise Results Table */}
                <Paper className="cp-section-paper">
                  <SectionHeader icon={<AssessmentIcon />} title="Test-Wise Results" color={C.primary} />
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>{["Test Name","Date","Total Score","Avg Mark","Students Attended","Avg %","Performance"].map((h) => <TableCell key={h} className="cp-th">{h}</TableCell>)}</TableRow>
                      </TableHead>
                      <TableBody>
                        {testWiseResults.slice(testWisePage * testWiseRowsPerPage, testWisePage * testWiseRowsPerPage + testWiseRowsPerPage).map((test, idx) => {
                          const pct = test.average_percentage;
                          const badge = getScoreLabel(pct);
                          return (
                            <TableRow key={idx} sx={{ "&:hover": { bgcolor: alpha(C.primary, 0.03) } }}>
                              <TableCell className="cp-td cp-td-bold">{test.test_name || "N/A"}</TableCell>
                              <TableCell className="cp-td">{test.test_activeAt || "N/A"}</TableCell>
                              <TableCell className="cp-td">{test.test_total_score || 0}</TableCell>
                              <TableCell className="cp-td">{test.average_mark.toFixed(2)}</TableCell>
                              <TableCell className="cp-td">{test.num_students_attended}</TableCell>
                              <TableCell className="cp-td"><ScoreBar value={pct} max={100} /></TableCell>
                              <TableCell className="cp-td"><Chip label={badge.label} size="small" sx={{ bgcolor: alpha(badge.color, 0.12), color: badge.color, fontWeight: 600, fontSize: "11px", fontFamily: "'Plus Jakarta Sans', sans-serif" }} /></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={testWiseResults.length} rowsPerPage={testWiseRowsPerPage} page={testWisePage} onPageChange={(_, p) => setTestWisePage(p)} onRowsPerPageChange={(e) => { setTestWiseRowsPerPage(parseInt(e.target.value, 10)); setTestWisePage(0); }} />
                </Paper>

                {/* Overall Rankings */}
                <Paper className="cp-section-paper">
                  <SectionHeader icon={<SchoolIcon />} title="Overall Student Rankings" color={C.secondary} extra={clickBadge} />
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>{["Rank","Student","Total Score","Max Score","Percentage","Tests Taken","Status"].map((h) => <TableCell key={h} className="cp-th">{h}</TableCell>)}</TableRow>
                      </TableHead>
                      <TableBody>
                        {[...students].sort((a, b) => getAggregateScore(b).score - getAggregateScore(a).score).slice(overallPage * overallRowsPerPage, overallPage * overallRowsPerPage + overallRowsPerPage).map((student, idx) => {
                          const { score, maxScore } = getAggregateScore(student);
                          const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
                          const rank = overallPage * overallRowsPerPage + idx + 1;
                          const badge = getScoreLabel(pct);
                          return (
                            <TableRow key={student.user_name + idx} onClick={() => handleStudentClick(student)} className="cp-row-clickable">
                              <TableCell className="cp-td">
                                <Box className="cp-rank-badge" style={{ background: rank <= 3 ? alpha(C.warning, 0.15) : "#f5f5f5" }}>
                                  <Typography className="cp-rank-num" style={{ color: rank <= 3 ? C.warning : "#aaa" }}>{rank}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell className="cp-td cp-td-bold">{student.user_name}</TableCell>
                              <TableCell className="cp-td">{score}</TableCell>
                              <TableCell className="cp-td">{maxScore}</TableCell>
                              <TableCell className="cp-td" sx={{ minWidth: 140 }}><ScoreBar value={pct} max={100} /></TableCell>
                              <TableCell className="cp-td">{student.tests.length}</TableCell>
                              <TableCell className="cp-td"><Chip label={badge.label} size="small" sx={{ bgcolor: alpha(badge.color, 0.12), color: badge.color, fontWeight: 600, fontSize: "11px", fontFamily: "'Plus Jakarta Sans', sans-serif" }} /></TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={students.length} rowsPerPage={overallRowsPerPage} page={overallPage} onPageChange={(_, p) => setOverallPage(p)} onRowsPerPageChange={(e) => { setOverallRowsPerPage(parseInt(e.target.value, 10)); setOverallPage(0); }} />
                </Paper>

                {/* Student-Wise Per Test */}
                <Paper className="cp-section-paper">
                  <SectionHeader icon={<AssessmentIcon />} title="Student-Wise Per Test" color={C.primary} extra={clickBadge} />
                  <Tabs value={studentTabValue} onChange={(_, v) => { setStudentTabValue(v); setStudentWisePage(0); }}
                    sx={{ mb: 2, "& .MuiTabs-indicator": { bgcolor: C.primary }, "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "13px", "&.Mui-selected": { color: C.primary } } }}>
                    {testWiseResults.map((test, idx) => <Tab key={test.test_id} label={test.test_name || `Test ${idx + 1}`} />)}
                  </Tabs>
                  {testWiseResults.map((test, idx) =>
                    studentTabValue === idx && (
                      <Box key={test.test_id}>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>{["Student","Score","Total","Percentage","Language","Status"].map((h) => <TableCell key={h} className="cp-th">{h}</TableCell>)}</TableRow>
                            </TableHead>
                            <TableBody>
                              {students.flatMap((student) =>
                                student.tests.filter((t) => t.test_id === test.test_id).map((t) => ({ student_name: student.user_name, student_obj: student, scored_mark: t.scored_mark, total_mark: t.total_mark, percentage: t.percentage, test_language: t.test_language })),
                              ).slice(studentWisePage * studentWiseRowsPerPage, studentWisePage * studentWiseRowsPerPage + studentWiseRowsPerPage).map((row, rowIdx) => {
                                const badge = getScoreLabel(row.percentage);
                                return (
                                  <TableRow key={`${test.test_id}-${row.student_name}-${rowIdx}`} onClick={() => handleStudentClick(row.student_obj)} className="cp-row-clickable">
                                    <TableCell className="cp-td cp-td-bold">{row.student_name}</TableCell>
                                    <TableCell className="cp-td">{row.scored_mark}</TableCell>
                                    <TableCell className="cp-td">{row.total_mark}</TableCell>
                                    <TableCell className="cp-td" sx={{ minWidth: 140 }}><ScoreBar value={row.percentage} max={100} /></TableCell>
                                    <TableCell className="cp-td"><Chip label={row.test_language || "N/A"} size="small" sx={{ bgcolor: alpha(C.primary, 0.08), color: C.primary, fontWeight: 500, fontSize: "11px", fontFamily: "'Plus Jakarta Sans', sans-serif" }} /></TableCell>
                                    <TableCell className="cp-td"><Chip label={badge.label} size="small" sx={{ bgcolor: alpha(badge.color, 0.12), color: badge.color, fontWeight: 600, fontSize: "11px", fontFamily: "'Plus Jakarta Sans', sans-serif" }} /></TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={students.flatMap((s) => s.tests.filter((t) => t.test_id === test.test_id)).length} rowsPerPage={studentWiseRowsPerPage} page={studentWisePage} onPageChange={(_, p) => setStudentWisePage(p)} onRowsPerPageChange={(e) => { setStudentWiseRowsPerPage(parseInt(e.target.value, 10)); setStudentWisePage(0); }} />
                      </Box>
                    ),
                  )}
                </Paper>

                {/* New Sections */}
                <AttendanceReportSection students={students} testWiseResults={testWiseResults} />
                <DayWisePieSection       students={students} testWiseResults={testWiseResults} />
                <IndividualProgressGridSection students={students} testWiseResults={testWiseResults} />
                <OverallColumnChartSection     students={students} testWiseResults={testWiseResults} />
              </Box>
            </Fade>
          )}
        </Box>
      </Box>

      <StudentDetailDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelectedStudent(null); }}
        student={selectedStudent} pocId={modPocId} individualData={individualData}
      />
    </>
  );
};

export default ClassPerformance;