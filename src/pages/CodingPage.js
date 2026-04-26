import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  CssBaseline,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Alert,
  Typography,
  Tooltip,
  Stack,
  createTheme,
  ThemeProvider,
  useMediaQuery,
  alpha,
  styled,
  Switch,
  Chip,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { Editor } from "@monaco-editor/react";
import PlayArrowIcon             from "@mui/icons-material/PlayArrow";
import CodeIcon                  from "@mui/icons-material/Code";
import JavaIcon                  from "@mui/icons-material/DeveloperMode";
import PythonIcon                from "@mui/icons-material/Memory";
import CppIcon                   from "@mui/icons-material/IntegrationInstructions";
import CIcon                     from "@mui/icons-material/SettingsEthernet";
import RefreshIcon               from "@mui/icons-material/Refresh";
import SaveIcon                  from "@mui/icons-material/Save";
import FormatListNumberedIcon    from "@mui/icons-material/FormatListNumbered";
import JavascriptIcon            from "@mui/icons-material/Code";
import TerminalIcon              from "@mui/icons-material/Terminal";
import KeyboardArrowUpIcon       from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon     from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowLeftIcon     from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon    from "@mui/icons-material/KeyboardArrowRight";
import NavigateNextIcon          from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon        from "@mui/icons-material/NavigateBefore";
import DoneIcon                  from "@mui/icons-material/Done";
import InfoIcon                  from "@mui/icons-material/Info";
import WarningAmberIcon          from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon    from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon        from "@mui/icons-material/CancelOutlined";
import BugReportIcon             from "@mui/icons-material/BugReport";
import { fetchCodeById, fetchTestCaseById, compileCode, submitTestResult, getTestById } from "../axios";
import "../styles/CodePage.css";

// ── Language mapping ──────────────────────────────────────────────────────────
const languageApiMap = {
  python:     "python",
  java:       "java",
  cpp:        "cpp",
  c:          "c",
  javascript: "javascript",
};

// ── Theme toggle switch ───────────────────────────────────────────────────────
const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    transform: "translateX(6px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(22px)",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          "#fff"
        )}" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/></svg>')`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: theme.palette.mode === "dark" ? "#8796A5" : "#aab4be",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: theme.palette.mode === "dark" ? "#003892" : "#001e3c",
    width: 32,
    height: 32,
    "&::before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
        "#fff"
      )}" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/></svg>')`,
    },
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    backgroundColor: theme.palette.mode === "dark" ? "#8796A5" : "#aab4be",
    borderRadius: 20 / 2,
  },
}));

// ── MUI theme ─────────────────────────────────────────────────────────────────
const createAppTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary:    { main: "#0c83c8" },
      secondary:  { main: "#fc7a46" },
      background: {
        default: mode === "dark" ? "#111827" : "#f9fafb",
        paper:   mode === "dark" ? "#1f2937" : "#ffffff",
      },
      text: {
        primary:   mode === "dark" ? "#f3f4f6" : "#1f2937",
        secondary: mode === "dark" ? "#9ca3af" : "#6b7280",
      },
      success: { main: "#22c55e" },
      error:   { main: "#ef4444" },
      warning: { main: "#f59e0b" },
      info:    { main: "#3b82f6" },
      divider: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    },
    typography: {
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 500, textTransform: "none" },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');
        `,
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: "none",
            "&:hover": {
              boxShadow:
                mode === "dark"
                  ? "0 4px 12px rgba(12,131,200,0.25)"
                  : "0 4px 12px rgba(12,131,200,0.15)",
            },
          },
          containedPrimary:   { background: "#0c83c8", "&:hover": { background: "#095e8f" } },
          containedSecondary: { background: "#fc7a46", "&:hover": { background: "#e55e2c" } },
          outlined: { borderWidth: 1.5 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            boxShadow:
              mode === "dark"
                ? "0 4px 6px -1px rgba(0,0,0,0.2)"
                : "0 4px 6px -1px rgba(0,0,0,0.05)",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            overflow: "hidden",
            border: `1px solid ${mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}`,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: { root: { transition: "all 0.2s ease-in-out" } },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 6, fontWeight: 500 } },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor:
              mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          },
        },
      },
      MuiSelect: {
        styleOverrides: { root: { borderRadius: 8 } },
      },
      MuiAlert: {
        styleOverrides: {
          root: { fontFamily: "'Inter','Helvetica','Arial',sans-serif !important", borderRadius: 8 },
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            "& .MuiAlert-root": {
              fontFamily: "'Inter','Helvetica','Arial',sans-serif !important",
            },
          },
        },
      },
    },
  });

// ── Terminal line renderer ────────────────────────────────────────────────────
// type: "info" | "success" | "error" | "warn" | "plain"
const TerminalLine = ({ line }) => {
  const colours = {
    info:    "#60a5fa",
    success: "#4ade80",
    error:   "#f87171",
    warn:    "#fbbf24",
    plain:   "#e5e7eb",
  };
  return (
    <div style={{
      color: colours[line.type] || colours.plain,
      fontFamily: "'Fira Code', monospace",
      fontSize: 13,
      lineHeight: "1.65",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    }}>
      {line.text}
    </div>
  );
};

// ── parseRunResponse ──────────────────────────────────────────────────────────
// Inspects actualOutput from the backend result to classify error type.
const parseRunResponse = (apiResult) => {
  const actual = (apiResult.actualOutput || "").trim();

  const compilePatterns = [
    /error:/i, /SyntaxError/i, /IndentationError/i, /NameError/i,
    /cannot find symbol/i, /error: expected/i, /undefined reference/i,
    /fatal error/i, /compilation failed/i, /javac/i, /\^~/, /\^/,
  ];
  const runtimePatterns = [
    /Traceback \(most recent call last\)/i, /Exception in thread/i,
    /RuntimeError/i, /SegmentationFault/i, /Segmentation fault/i,
    /java\.lang\./i, /SIGSEGV/i, /killed/i, /ZeroDivisionError/i,
    /AttributeError/i, /IndexError/i, /KeyError/i, /ValueError/i,
    /OverflowError/i, /RecursionError/i, /MemoryError/i, /core dumped/i,
  ];

  const hasCompileError = compilePatterns.some((p) => p.test(actual));
  const hasRuntimeError = !hasCompileError && runtimePatterns.some((p) => p.test(actual));

  return { hasCompileError, hasRuntimeError, cleanOutput: actual };
};

// ── CodingPage ────────────────────────────────────────────────────────────────
const CodingPage = () => {
  const { codeId }    = useParams();
  const { state }     = useLocation();
  const navigate      = useNavigate();
  const [mode, setMode] = useState(localStorage.getItem("themeMode") || "dark");
  const theme   = createAppTheme(mode);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ── State ────────────────────────────────────────────────────────────────
  const [testId,       setTestId]       = useState(localStorage.getItem("test_id") || "");
  const [userId,       setUserId]       = useState("");
  const [pocId,        setPocId]        = useState("");
  const [studentName,  setStudentName]  = useState("");
  const [timer,        setTimer]        = useState(parseInt(localStorage.getItem("test_timer")) || 0);
  const timerRef = useRef(null);

  const savedTestResult = JSON.parse(localStorage.getItem("test_result")) || {};
  const [testResult, setTestResult] = useState({
    result_user_id:    savedTestResult.result_user_id    || state?.result_user_id    || "",
    codingAnswered:    savedTestResult.codingAnswered    || state?.codingAnswered    || 0,
    codingCorrect:     savedTestResult.codingCorrect     || state?.codingCorrect     || 0,
    codingIds:         savedTestResult.codingIds         || state?.codingIds         || [],
    codingNotAnswered: savedTestResult.codingNotAnswered || state?.codingNotAnswered || 0,
    codingNotVisited:  savedTestResult.codingNotVisited  || state?.codingNotVisited  || 0,
    codingWrong:       savedTestResult.codingWrong       || state?.codingWrong       || 0,
    marked:            savedTestResult.marked            || state?.marked            || 0,
    mcqAnswered:       savedTestResult.mcqAnswered       || state?.mcqAnswered       || 0,
    mcqCorrect:        savedTestResult.mcqCorrect        || state?.mcqCorrect        || 0,
    mcqNotAnswered:    savedTestResult.mcqNotAnswered    || state?.mcqNotAnswered    || 0,
    mcqNotVisited:     savedTestResult.mcqNotVisited     || state?.mcqNotVisited     || 0,
    mcqWrong:          savedTestResult.mcqWrong          || state?.mcqWrong          || 0,
    result_poc_id:     savedTestResult.result_poc_id     || state?.result_poc_id     || "",
    result_score:      savedTestResult.result_score      || state?.result_score      || 0,
    result_total_score:savedTestResult.result_total_score|| state?.result_total_score|| 0,
    studentName:       savedTestResult.studentName       || state?.studentName       || "",
    testLanguage:      savedTestResult.testLanguage      || state?.testLanguage      || "",
    testName:          savedTestResult.testName          || state?.testName          || "",
    currentCodingIndex:savedTestResult.currentCodingIndex|| state?.currentCodingIndex|| 0,
    codingResults:     savedTestResult.codingResults     || state?.codingResults     || [],
    testInstructions:  savedTestResult.testInstructions  || state?.testInstructions  || [],
  });

  // ── Terminal lines: [{ type, text }] ─────────────────────────────────────
  const [terminalLines,          setTerminalLines]          = useState([]);
  const [runLoading,             setRunLoading]             = useState(false);

  const [input,                  setInput]                  = useState("");
  const inputRef                                            = useRef("");
  const [language,               setLanguage]               = useState("python");
  const [loading,                setLoading]                = useState(false);
  const [selectedCode,           setSelectedCode]           = useState(null);
  const [testCases,              setTestCases]              = useState([]);
  const [showOutput,             setShowOutput]             = useState(true);
  const [outputMinimized,        setOutputMinimized]        = useState(false);
  const [openProgressDialog,     setOpenProgressDialog]     = useState(false);
  const [snackbarOpen,           setSnackbarOpen]           = useState(false);
  const [snackbarMessage,        setSnackbarMessage]        = useState("");
  const [snackbarSeverity,       setSnackbarSeverity]       = useState("success");
  const [showTestCases,          setShowTestCases]          = useState(!isMobile);
  const [testCasesCollapsed,     setTestCasesCollapsed]     = useState(false);
  const [editorWidth,            setEditorWidth]            = useState(60);
  const [outputHeight,           setOutputHeight]           = useState(30);
  const [resetDialogOpen,        setResetDialogOpen]        = useState(false);
  const [submitConfirmDialogOpen,setSubmitConfirmDialogOpen]= useState(false);
  const [fetchedTestCodingIds,   setFetchedTestCodingIds]   = useState([]);
  const [hasSubmitted,           setHasSubmitted]           = useState(false);
  const [instructionsOpen,       setInstructionsOpen]       = useState(false);
  const [isFullScreen,           setIsFullScreen]           = useState(true);
  const [showFullScreenPrompt,   setShowFullScreenPrompt]   = useState(true);

  // ── Run Test Cases dialog ─────────────────────────────────────────────────
  const [testCaseDialogOpen,   setTestCaseDialogOpen]   = useState(false);
  const [testCaseResults,      setTestCaseResults]      = useState([]);
  const [runTestCasesLoading,  setRunTestCasesLoading]  = useState(false);

  // ── Fullscreen warning state ──────────────────────────────────────────────
  const MAX_FULLSCREEN_WARNINGS = 5;
  const [fullScreenExitCount,    setFullScreenExitCount]    = useState(
    () => parseInt(localStorage.getItem("fs_exit_count") || "0")
  );
  const [fullScreenWarningOpen,  setFullScreenWarningOpen]  = useState(false);
  const fullScreenExitCountRef = useRef(
    parseInt(localStorage.getItem("fs_exit_count") || "0")
  );

  const isDraggingRef      = useRef(false);
  const dividerRef         = useRef(null);
  const outputDividerRef   = useRef(null);
  const resizeTimeoutRef   = useRef(null);
  const editorRef          = useRef(null);
  const resizeObserverRef  = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  // Keep inputRef in sync for use inside callbacks that capture stale closures
  const handleSetInput = (val) => {
    inputRef.current = val;
    setInput(val);
  };

  // ── Language data ─────────────────────────────────────────────────────────
  const templates = {
    python:     `print("Hello World")`,
    java:       `import java.util.*;\npublic class Progman {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello World");\n\t}\n}`,
    c:          `#include <stdio.h>\nint main() {\n\tprintf("Hello World");\n\treturn 0;\n}`,
    cpp:        `#include <iostream>\nusing namespace std;\nint main() {\n\tcout << "Hello World";\n\treturn 0;\n}`,
    javascript: `console.log("Hello World");`,
  };

  const languageIcons = {
    python:     <PythonIcon fontSize="small" />,
    java:       <JavaIcon fontSize="small" />,
    cpp:        <CppIcon fontSize="small" />,
    c:          <CIcon fontSize="small" />,
    javascript: <JavascriptIcon fontSize="small" />,
  };

  const languageNames = {
    python: "Python", java: "Java", cpp: "C++", c: "C", javascript: "JavaScript",
  };

  const defaultInstructions = [
    "Read each problem statement carefully and ensure you understand the requirements before coding.",
    "Write your solution in the provided code editor using the selected programming language.",
    "Test your code against the provided test cases before submitting to verify correctness.",
    "Save your progress frequently using the Save button to avoid losing work.",
    "Malpractice Warning: Do not attempt to navigate away from the test, use browser back/forward buttons, or switch tabs. Such actions will result in immediate test submission.",
    "Malpractice Warning: Copying, pasting, or using external tools (including AI assistance) is strictly prohibited and will lead to automatic test submission.",
    "Malpractice Warning: Rapid code input or suspicious keyboard shortcuts (e.g., Ctrl+V, Alt+/) will be flagged as potential malpractice.",
    "Submit your test only when you are ready to finalize all answers. Once submitted, no further changes can be made.",
    "Ensure you are in full-screen mode during the test to maintain a secure testing environment.",
    "Contact the test administrator for any technical issues or clarifications during the test.",
  ];

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    window.history.pushState(null, null, window.location.href);
    for (let i = 0; i < 10; i++) window.history.pushState(null, null, window.location.href);
    const handlePopState = (event) => {
      event.preventDefault();
      if (!hasSubmitted) {
        setSnackbarMessage("Malpractice detected: Attempted navigation. Test submitted automatically.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        handleFinalSubmit(true);
      }
      window.history.pushState(null, null, window.location.href);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [hasSubmitted]);

  useEffect(() => {
    const storedUser = localStorage.getItem("true");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setStudentName(user.user.full_name || "");
        setUserId(user.user.user_id || "");
        setPocId(user.user.mod_poc_id?.mod_poc_id || "");
        setTestResult((prev) => {
          const updatedTestResult = {
            ...prev,
            studentName:    user.user.full_name             || prev.studentName,
            result_user_id: user.user.user_id               || prev.result_user_id,
            result_poc_id:  user.user.mod_poc_id?.mod_poc_id|| prev.result_poc_id,
          };
          localStorage.setItem("test_result", JSON.stringify(updatedTestResult));
          return updatedTestResult;
        });
      } catch (error) {
        console.error("Error parsing stored user data:", error);
        setSnackbarMessage("Invalid user data in localStorage.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } else {
      setSnackbarMessage("No user data found in localStorage.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  }, []);

  useEffect(() => {
    if (codeId) {
      const savedPayload = localStorage.getItem(`code_${codeId}`);
      if (savedPayload) {
        try {
          const parsedPayload = JSON.parse(savedPayload);
          const savedLanguage = Object.keys(languageApiMap).find((key) => languageApiMap[key] === parsedPayload.language) || "python";
          setLanguage((cur) => (cur === "python" || !cur ? savedLanguage : cur));
          handleSetInput(parsedPayload.code || templates[savedLanguage]);
        } catch (error) {
          console.error("Error parsing saved payload:", error);
          handleSetInput(templates[language]);
        }
      } else {
        handleSetInput(templates[language]);
      }
    }
  }, [codeId]);

  useEffect(() => {
    const fetchTestData = async () => {
      if (!testId) { setSnackbarMessage("No test ID found in localStorage."); setSnackbarSeverity("error"); setSnackbarOpen(true); setLoading(false); return; }
      try {
        const res = await getTestById(testId);
        setFetchedTestCodingIds(res.test_coding_id || []);
        setTestResult((prev) => {
          const updatedTestResult = {
            ...prev,
            codingIds:         res.test_coding_id || prev.codingIds,
            testName:          res.test_name       || prev.testName,
            testLanguage:      res.test_language   || prev.testLanguage,
            result_total_score:(res.test_mcq_id?.length || 0) + (res.test_coding_id?.length || 0) * 10,
            testInstructions:  res.test_instructions || defaultInstructions,
          };
          localStorage.setItem("test_result", JSON.stringify(updatedTestResult));
          return updatedTestResult;
        });
        setTestCases([]);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch test:", err);
        setSnackbarMessage("Failed to fetch test data."); setSnackbarSeverity("error"); setSnackbarOpen(true); setLoading(false);
      }
    };
    fetchTestData();
  }, [testId]);

  useEffect(() => {
    if (!timer || timer <= 0 || hasSubmitted) {
      if (timer <= 0 && !hasSubmitted) handleFinalSubmit(true);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimer((prev) => { const n = prev - 1; localStorage.setItem("test_timer", n); return n; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timer, hasSubmitted]);

  // ── Fullscreen 5-warning logic ────────────────────────────────────────────
  useEffect(() => {
    const handleFullScreenChange = () => {
      const full = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      if (!full) {
        setIsFullScreen(false);
        if (!hasSubmitted) {
          const n = fullScreenExitCountRef.current + 1;
          fullScreenExitCountRef.current = n;
          setFullScreenExitCount(n);
          localStorage.setItem("fs_exit_count", String(n));
          if (n >= MAX_FULLSCREEN_WARNINGS) {
            setSnackbarMessage("Fullscreen exited 5 times. Test submitted automatically."); setSnackbarSeverity("error"); setSnackbarOpen(true);
            handleFinalSubmit(true);
          } else {
            setFullScreenWarningOpen(true);
          }
        }
      } else {
        setIsFullScreen(true); setShowFullScreenPrompt(false); setFullScreenWarningOpen(false);
      }
    };
    document.addEventListener("fullscreenchange",       handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("mozfullscreenchange",    handleFullScreenChange);
    document.addEventListener("MSFullscreenChange",     handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange",       handleFullScreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullScreenChange);
      document.removeEventListener("mozfullscreenchange",    handleFullScreenChange);
      document.removeEventListener("MSFullscreenChange",     handleFullScreenChange);
    };
  }, [hasSubmitted]);

  useEffect(() => {
    const handleMalpractice = (reason) => {
      if (!hasSubmitted) {
        setSnackbarMessage(`Malpractice detected: ${reason}. Test submitted automatically.`); setSnackbarSeverity("error"); setSnackbarOpen(true);
        handleFinalSubmit(true);
      }
    };
    const handleVisibilityChange = () => { if (document.hidden) handleMalpractice("Tab switching or minimizing browser"); };
    const handleContextMenu = (e) => { e.preventDefault(); handleMalpractice("Right-click attempt"); };
    const handleCopy  = (e) => { e.preventDefault(); handleMalpractice("Copy attempt"); };
    const handlePaste = (e) => { e.preventDefault(); handleMalpractice("Paste attempt"); };
    const handleKeyDown = (e) => {
      if (e.keyCode === 91 || e.keyCode === 92) { e.preventDefault(); handleMalpractice("Windows key usage"); }
      if (e.key === "PrintScreen" || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s")) { e.preventDefault(); handleMalpractice("Screenshot attempt"); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "v") { e.preventDefault(); handleMalpractice("Clipboard shortcut attempt"); }
      if ((e.altKey && e.key === "/") || (e.ctrlKey && e.key.toLowerCase() === "i")) { e.preventDefault(); handleMalpractice("Suspected AI tool shortcut"); }
    };
    let lastInputTime = Date.now();
    const handleEditorInput = (e) => {
      const now = Date.now(); const diff = now - lastInputTime; lastInputTime = now;
      if (e.target.value && e.target.value.length > 100 && diff < 500) handleMalpractice("Rapid code input detected (possible AI paste)");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu",      handleContextMenu);
    document.addEventListener("copy",             handleCopy);
    document.addEventListener("paste",            handlePaste);
    document.addEventListener("keydown",          handleKeyDown);
    const editorElement = document.querySelector(".monaco-editor .inputarea");
    if (editorElement) editorElement.addEventListener("input", handleEditorInput);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu",      handleContextMenu);
      document.removeEventListener("copy",             handleCopy);
      document.removeEventListener("paste",            handlePaste);
      document.removeEventListener("keydown",          handleKeyDown);
      if (editorElement) editorElement.removeEventListener("input", handleEditorInput);
    };
  }, [hasSubmitted]);

  const saveSubmissionPayload = useCallback(() => {
    const formattedTestCases = testCases.map((tc) => ({
      input: Array.isArray(tc.testcase_input) ? tc.testcase_input.join("\n") : tc.testcase_input || "",
      expectedOutput: Array.isArray(tc.testcase_output) ? tc.testcase_output.join("\n") : tc.testcase_output || "",
    }));
    localStorage.setItem(`code_${codeId}`, JSON.stringify({ language: languageApiMap[language], code: inputRef.current, testCases: formattedTestCases }));
  }, [codeId, language, testCases]);

  const debounce = (func, delay) => (...args) => {
    clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => func(...args), delay);
  };

  const debouncedSave = useCallback(debounce(saveSubmissionPayload, 1000), [saveSubmissionPayload]);
  useEffect(() => { if (codeId && input) debouncedSave(); }, [input, language, codeId, debouncedSave]);
  useEffect(() => () => clearTimeout(autoSaveTimeoutRef.current), []);

  useEffect(() => {
    if (isMobile) { setShowTestCases(true); setTestCasesCollapsed(false); }
    else { setEditorWidth(60); setTestCasesCollapsed(false); }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup",   handleMouseUp);
      document.removeEventListener("mousemove", handleOutputMouseMove);
      document.removeEventListener("mouseup",   handleOutputMouseUp);
      document.body.classList.remove("resize-active");
      clearTimeout(resizeTimeoutRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    };
  }, [isMobile]);

  useEffect(() => {
    if (typeof ResizeObserver !== "undefined") {
      const cb = (entries) => { window.requestAnimationFrame(() => { if (!Array.isArray(entries) || !entries.length) return; if (editorRef.current) editorRef.current.layout(); }); };
      resizeObserverRef.current = new ResizeObserver(cb);
      const c = document.querySelector(".monaco-editor");
      if (c) resizeObserverRef.current.observe(c);
    }
    return () => { if (resizeObserverRef.current) resizeObserverRef.current.disconnect(); };
  }, []);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (!isMobile) { e.preventDefault(); isDraggingRef.current = true; document.body.classList.add("resize-active"); document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", handleMouseUp); }
  };
  const handleMouseMove = useCallback((e) => {
    if (isDraggingRef.current && dividerRef.current) {
      const r = dividerRef.current.parentElement.getBoundingClientRect();
      setEditorWidth(Math.max(30, Math.min(80, ((e.clientX - r.left) / r.width) * 100)));
    }
  }, []);
  const handleMouseUp = () => { isDraggingRef.current = false; document.body.classList.remove("resize-active"); document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); if (editorRef.current) setTimeout(() => editorRef.current.layout(), 10); };

  const handleOutputMouseDown = (e) => { e.preventDefault(); isDraggingRef.current = true; document.body.classList.add("resize-active"); document.addEventListener("mousemove", handleOutputMouseMove); document.addEventListener("mouseup", handleOutputMouseUp); };
  const handleOutputMouseMove = useCallback((e) => {
    if (isDraggingRef.current && outputDividerRef.current) {
      const r = outputDividerRef.current.parentElement.getBoundingClientRect();
      setOutputHeight(Math.max(20, Math.min(50, ((r.bottom - e.clientY) / r.height) * 100)));
    }
  }, []);
  const handleOutputMouseUp = () => { isDraggingRef.current = false; document.body.classList.remove("resize-active"); document.removeEventListener("mousemove", handleOutputMouseMove); document.removeEventListener("mouseup", handleOutputMouseUp); if (editorRef.current) setTimeout(() => editorRef.current.layout(), 10); };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    if (isMobile) { const t = document.querySelector(".monaco-editor .inputarea"); if (t) { t.style.fontSize = "16px"; t.style.lineHeight = "normal"; } }
  };

  // ── UI handlers ───────────────────────────────────────────────────────────
  const toggleTheme = () => {
    const n = mode === "dark" ? "light" : "dark"; setMode(n); localStorage.setItem("themeMode", n);
    setTimeout(() => { if (editorRef.current) editorRef.current.updateOptions({ theme: n === "dark" ? "vs-dark" : "vs" }); }, 10);
  };
  const toggleOutput    = () => { if (outputMinimized) { setOutputMinimized(false); setShowOutput(true); } else setOutputMinimized(!outputMinimized); };
  const toggleTestCases = () => setTestCasesCollapsed(!testCasesCollapsed);
  const handleEditorChange = (value) => handleSetInput(value || "");

  const handleLanguageChange = (event) => {
    const nl = event.target.value; setLanguage(() => nl);
    const saved = localStorage.getItem(`code_${codeId}`);
    let newCode = templates[nl];
    if (saved) { try { const p = JSON.parse(saved); if (p.language === languageApiMap[nl]) newCode = p.code || templates[nl]; } catch (e) { console.error(e); } }
    handleSetInput(newCode);
    if (editorRef.current && editorRef.current.getModel()) window.monaco.editor.setModelLanguage(editorRef.current.getModel(), nl);
    saveSubmissionPayload();
  };

  const resetEditor       = () => setResetDialogOpen(true);
  const cancelResetEditor = () => setResetDialogOpen(false);
  const confirmResetEditor = () => {
    handleSetInput(templates[language] || ""); localStorage.removeItem(`code_${codeId}`);
    setSnackbarMessage("Editor reset to template"); setSnackbarSeverity("info"); setSnackbarOpen(true); setResetDialogOpen(false);
  };

  const handleSave = () => {
    const f = testCases.map((tc) => ({ input: Array.isArray(tc.testcase_input) ? tc.testcase_input.join("\n") : tc.testcase_input || "", expectedOutput: Array.isArray(tc.testcase_output) ? tc.testcase_output.join("\n") : tc.testcase_output || "" }));
    localStorage.setItem(`code_${codeId}`, JSON.stringify({ language: languageApiMap[language], code: input, testCases: f }));
    setSnackbarMessage("Progress saved manually"); setSnackbarSeverity("success"); setSnackbarOpen(true);
  };

  const handleReEnterFullScreen = async () => {
    try {
      if (document.documentElement.requestFullscreen)            await document.documentElement.requestFullscreen();
      else if (document.documentElement.mozRequestFullScreen)    await document.documentElement.mozRequestFullScreen();
      else if (document.documentElement.webkitRequestFullscreen) await document.documentElement.webkitRequestFullscreen();
      else if (document.documentElement.msRequestFullscreen)     await document.documentElement.msRequestFullscreen();
      setFullScreenWarningOpen(false);
    } catch (err) { console.error("Failed to re-enter fullscreen:", err); }
  };

  // ── Fetch code and test cases ─────────────────────────────────────────────
  const fetchCodeAndTestCases = async (id) => {
    try {
      setLoading(true);
      const code = await fetchCodeById(id);
      setSelectedCode(code);
      if (!code.code_test_cases_id || code.code_test_cases_id.length === 0) {
        setTestCases([]); setSnackbarMessage("No test cases found for this problem."); setSnackbarSeverity("warning"); setSnackbarOpen(true); return;
      }
      const promises = code.code_test_cases_id.map(async (tid) => { try { return await fetchTestCaseById(tid); } catch (e) { return null; } });
      const responses = await Promise.all(promises);
      const valid = responses.filter((tc) => tc && tc.testcase_input && tc.testcase_output);
      setTestCases(valid.length ? valid : [{ testcase_input: "", testcase_output: "" }]);
      if (!valid.length) { setSnackbarMessage("No valid test cases retrieved."); setSnackbarSeverity("warning"); setSnackbarOpen(true); }
    } catch (err) {
      console.error("Fetch error:", err);
      setTestCases([{ testcase_input: "", testcase_output: "" }]);
      setTerminalLines([{ type: "error", text: `Error fetching problem: ${err.message}.` }]);
      setShowOutput(true); setSnackbarMessage(`Error fetching problem: ${err.message}.`); setSnackbarSeverity("error"); setSnackbarOpen(true);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (codeId) { fetchCodeAndTestCases(codeId); setTerminalLines([]); }
    else { setTerminalLines([{ type: "error", text: "Error: No code ID provided in URL" }]); setShowOutput(true); setSnackbarMessage("No code ID provided in URL."); setSnackbarSeverity("error"); setSnackbarOpen(true); }
  }, [codeId]);

  // ── RUN button: terminal-only, shows errors or "no errors" ───────────────
  const handleRun = async (e) => {
    e.preventDefault();
    setRunLoading(true);
    setShowOutput(true);
    setOutputMinimized(false);

    const lines = [{ type: "info", text: `$ Executing ${languageNames[language]} code...` }];
    setTerminalLines([...lines]);

    try {
      // Use first test case input as stdin so the code gets realistic input
      const firstTc = testCases[0];
      const stdinInput = firstTc
        ? (Array.isArray(firstTc.testcase_input) ? firstTc.testcase_input.join("\n") : firstTc.testcase_input || "")
        : "";

      const payload = {
        language: languageApiMap[language] || language,
        code: input,
        // Use "__RUN_ONLY__" as sentinel expected output — backend still runs code
        testCases: [{ input: stdinInput, expectedOutput: "__RUN_ONLY__" }],
      };

      const { results } = await compileCode(payload);

      if (!results || results.length === 0) {
        lines.push({ type: "error", text: "No output received from compiler." });
        setTerminalLines([...lines]);
        return;
      }

      const result = results[0];
      const { hasCompileError, hasRuntimeError, cleanOutput } = parseRunResponse(result);

      if (hasCompileError) {
        lines.push({ type: "error", text: "╔══════════════════════════════════════╗" });
        lines.push({ type: "error", text: "║          COMPILE ERROR               ║" });
        lines.push({ type: "error", text: "╚══════════════════════════════════════╝" });
        cleanOutput.split("\n").forEach((l) => lines.push({ type: "error", text: l }));
      } else if (hasRuntimeError) {
        lines.push({ type: "warn", text: "╔══════════════════════════════════════╗" });
        lines.push({ type: "warn", text: "║           RUNTIME ERROR              ║" });
        lines.push({ type: "warn", text: "╚══════════════════════════════════════╝" });
        cleanOutput.split("\n").forEach((l) => lines.push({ type: "warn", text: l }));
      } else {
        lines.push({ type: "success", text: "✔  No syntax or runtime errors detected." });
        if (cleanOutput) {
          lines.push({ type: "plain", text: "──────────────── Output ────────────────" });
          cleanOutput.split("\n").forEach((l) => lines.push({ type: "plain", text: l }));
          lines.push({ type: "plain", text: "────────────────────────────────────────" });
        } else {
          lines.push({ type: "plain", text: "(Program produced no output)" });
        }
      }

      setTerminalLines([...lines]);
    } catch (error) {
      lines.push({ type: "error", text: `Execution failed: ${error.message}` });
      setTerminalLines([...lines]);
      setSnackbarMessage("Error running code."); setSnackbarSeverity("error"); setSnackbarOpen(true);
    } finally {
      setRunLoading(false);
    }
  };

  // ── RUN TEST CASES: compare against ALL test cases, open dialog ───────────
  const handleRunTestCases = async () => {
    if (testCases.length === 0) {
      setSnackbarMessage("No test cases available for this problem."); setSnackbarSeverity("warning"); setSnackbarOpen(true);
      return;
    }
    setRunTestCasesLoading(true);
    setTestCaseResults([]);
    setTestCaseDialogOpen(true);

    try {
      const formattedTestCases = testCases.map((tc) => ({
        input: Array.isArray(tc.testcase_input) ? tc.testcase_input.join("\n") : tc.testcase_input || "",
        expectedOutput: Array.isArray(tc.testcase_output) ? tc.testcase_output.join("\n") : tc.testcase_output || "",
      }));

      const payload = { language: languageApiMap[language] || language, code: input, testCases: formattedTestCases };
      const { results } = await compileCode(payload);

      const displayResults = results.map((res, idx) => {
        const { hasCompileError, hasRuntimeError, cleanOutput } = parseRunResponse(res);
        let status = "passed";
        let statusLabel = "Passed";
        if (hasCompileError)  { status = "compile_error"; statusLabel = "Compile Error"; }
        else if (hasRuntimeError) { status = "runtime_error"; statusLabel = "Runtime Error"; }
        else if (!res.passed) { status = "failed";        statusLabel = "Failed"; }

        return {
          index: idx + 1,
          passed: res.passed,
          status,
          statusLabel,
          input: res.input,
          expectedOutput: res.expectedOutput,
          actualOutput: cleanOutput,
          // First 3 test cases show full detail; rest show only pass/fail (hidden)
          isHidden: idx >= 3,
        };
      });

      setTestCaseResults(displayResults);

      // Terminal summary
      const passedCount = displayResults.filter(r => r.passed).length;
      setTerminalLines([
        { type: "info",    text: `$ Ran ${results.length} test case(s)...` },
        { type: passedCount === results.length ? "success" : "warn", text: `Result: ${passedCount}/${results.length} test cases passed.` },
      ]);
      setShowOutput(true); setOutputMinimized(false);

      // Update scoring
      const allPassed = results.every(r => r.passed);
      const codingScore = allPassed ? 10 : 0;
      const newCodingResult = { codeId, score: codingScore, total: 10 };
      let currentTestResult = testResult;
      try { const stored = localStorage.getItem("test_result"); if (stored) currentTestResult = JSON.parse(stored); } catch (e) { console.error(e); }
      currentTestResult.codingResults = currentTestResult.codingResults || [];
      const existingIndex = currentTestResult.codingResults.findIndex(r => r.codeId === codeId);
      let updatedCodingResults = [...currentTestResult.codingResults];
      if (existingIndex !== -1) updatedCodingResults[existingIndex] = newCodingResult;
      else updatedCodingResults.push(newCodingResult);
      const effectiveCodingIds = fetchedTestCodingIds.length > 0 ? fetchedTestCodingIds : (currentTestResult.codingIds || []);
      const updatedTestResult = {
        ...currentTestResult,
        codingResults: updatedCodingResults,
        result_user_id: userId || currentTestResult.result_user_id || "",
        result_test_id: testId || currentTestResult.result_test_id || "",
        result_score: (currentTestResult.mcqCorrect || 0) + updatedCodingResults.reduce((sum, r) => sum + r.score, 0),
        result_total_score: currentTestResult.result_total_score || effectiveCodingIds.length * 10,
        result_poc_id: pocId || currentTestResult.result_poc_id || "",
        codingAnswered: updatedCodingResults.length,
        codingNotAnswered: effectiveCodingIds.length - updatedCodingResults.length,
        codingNotVisited: Math.max(0, effectiveCodingIds.length - updatedCodingResults.length),
        codingCorrect: updatedCodingResults.filter(r => r.score > 0).length,
        codingWrong: updatedCodingResults.filter(r => r.score === 0).length,
        studentName: studentName || currentTestResult.studentName || "",
      };
      localStorage.setItem("test_result", JSON.stringify(updatedTestResult));
      setTestResult(updatedTestResult);
      localStorage.setItem(`code_${codeId}`, JSON.stringify({ language: languageApiMap[language], code: input, testCases: formattedTestCases }));
    } catch (error) {
      console.error("Run test cases error:", error);
      setTestCaseResults([]);
      setSnackbarMessage(`Error running test cases: ${error.message}`); setSnackbarSeverity("error"); setSnackbarOpen(true);
      setTestCaseDialogOpen(false);
    } finally {
      setRunTestCasesLoading(false);
    }
  };

  // ── compileAndEvaluate (used by submit flow) ──────────────────────────────
  const compileAndEvaluate = async (currentCodeId, codeInput, codeLanguage, codeTestCases) => {
    setShowOutput(true); setOutputMinimized(false); setLoading(true); setOpenProgressDialog(true);
    setTerminalLines([{ type: "info", text: "Running code against test cases..." }]);
    try {
      const formattedTestCases = codeTestCases
        .filter(tc => tc?.testcase_input != null && tc?.testcase_output != null)
        .map(tc => ({
          input: Array.isArray(tc.testcase_input) ? tc.testcase_input.join("\n") : tc.testcase_input || "",
          expectedOutput: Array.isArray(tc.testcase_output) ? tc.testcase_output.join("\n") : tc.testcase_output || "",
        }));
      if (!formattedTestCases.length) formattedTestCases.push({ input: "", expectedOutput: "" });
      const payload = { language: languageApiMap[codeLanguage] || codeLanguage, code: codeInput || templates[codeLanguage] || "", testCases: formattedTestCases };
      localStorage.setItem(`code_${currentCodeId}`, JSON.stringify(payload));
      const { results } = await compileCode(payload);
      const lines = [];
      results.forEach((res, i) => {
        if (i < 3) {
          lines.push({ type: "info",  text: `Test Case #${i + 1}:` });
          lines.push({ type: "plain", text: `  Input:    ${res.input}` });
          lines.push({ type: "plain", text: `  Expected: ${res.expectedOutput}` });
          lines.push({ type: "plain", text: `  Actual:   ${res.actualOutput}` });
          lines.push({ type: res.passed ? "success" : "error", text: `  Status:   ${res.passed ? "✅ Passed" : "❌ Failed"}` });
        } else {
          lines.push({ type: res.passed ? "success" : "error", text: `Hidden Test Case #${i + 1}: ${res.passed ? "✅ Passed" : "❌ Failed"}` });
        }
      });
      setTerminalLines(lines);
      const allPassed = results.length > 0 && results.every(r => r.passed);
      const codingScore = allPassed ? 10 : 0;
      const newCodingResult = { codeId: currentCodeId, score: codingScore, total: 10 };
      let currentTestResult = testResult;
      try { const stored = localStorage.getItem("test_result"); if (stored) currentTestResult = JSON.parse(stored); } catch (e) { console.error(e); }
      currentTestResult.codingResults = currentTestResult.codingResults || [];
      const existingIndex = currentTestResult.codingResults.findIndex(r => r.codeId === currentCodeId);
      let updatedCodingResults = [...currentTestResult.codingResults];
      if (existingIndex !== -1) updatedCodingResults[existingIndex] = newCodingResult; else updatedCodingResults.push(newCodingResult);
      const effectiveCodingIds = fetchedTestCodingIds.length > 0 ? fetchedTestCodingIds : (currentTestResult.codingIds || []);
      const updatedTestResult = {
        ...currentTestResult, codingResults: updatedCodingResults,
        result_user_id: userId || currentTestResult.result_user_id || "",
        result_test_id: testId || currentTestResult.result_test_id || "",
        result_score: (currentTestResult.mcqCorrect || 0) + updatedCodingResults.reduce((sum, r) => sum + r.score, 0),
        result_total_score: currentTestResult.result_total_score || effectiveCodingIds.length * 10,
        result_poc_id: pocId || currentTestResult.result_poc_id || "",
        codingAnswered: updatedCodingResults.length,
        codingNotAnswered: effectiveCodingIds.length - updatedCodingResults.length,
        codingNotVisited: Math.max(0, effectiveCodingIds.length - updatedCodingResults.length),
        codingCorrect: updatedCodingResults.filter(r => r.score > 0).length,
        codingWrong: updatedCodingResults.filter(r => r.score === 0).length,
        studentName: studentName || currentTestResult.studentName || "",
      };
      localStorage.setItem("test_result", JSON.stringify(updatedTestResult));
      setTestResult(updatedTestResult);
      setSnackbarMessage("Code compiled and evaluated successfully!"); setSnackbarSeverity("success");
      return { success: true, testResult: updatedTestResult };
    } catch (error) {
      console.error("Compile error:", error);
      setTerminalLines([{ type: "error", text: `Error running code: ${error.message}` }]);
      setSnackbarMessage("Error during code compilation."); setSnackbarSeverity("warning");
      return { success: false, error: error.message };
    } finally { setLoading(false); setOpenProgressDialog(false); setSnackbarOpen(true); }
  };

  const compileAllPrograms = async () => {
    const effectiveCodingIds = fetchedTestCodingIds.length > 0 ? fetchedTestCodingIds : (testResult.codingIds || []);
    setLoading(true); setOpenProgressDialog(true);
    setTerminalLines([{ type: "info", text: "Processing results...\nCompiling all programs..." }]);
    let compilationErrors = 0, processedResults = [];
    try {
      for (const [index, id] of effectiveCodingIds.entries()) {
        setTerminalLines(prev => [...prev, { type: "info", text: `📝 Processing program ${index + 1}/${effectiveCodingIds.length} (ID: ${id})...` }]);
        let codeInput = templates[language] || "", codeLanguage = language, codeTestCases = [{ testcase_input: "", testcase_output: "" }];
        const savedPayload = localStorage.getItem(`code_${id}`);
        if (savedPayload) {
          try {
            const p = JSON.parse(savedPayload);
            codeInput = p.code || templates[language] || "";
            codeLanguage = Object.keys(languageApiMap).find(k => languageApiMap[k] === p.language) || language;
            setTerminalLines(prev => [...prev, { type: "success", text: `   ✅ Using saved code (${codeInput.length} chars)` }]);
          } catch (e) { setTerminalLines(prev => [...prev, { type: "warn", text: "   ⚠️ Error parsing saved code" }]); }
        } else {
          setTerminalLines(prev => [...prev, { type: "warn", text: "   ⚠️ No saved code found, using default template" }]);
          localStorage.setItem(`code_${id}`, JSON.stringify({ language: languageApiMap[language] || language, code: templates[language] || "", testCases: [{ input: "", expectedOutput: "" }] }));
        }
        try {
          const code = await fetchCodeById(id);
          if (code?.code_test_cases_id?.length > 0) {
            const tcPromises = code.code_test_cases_id.map(async tid => { try { const tc = await fetchTestCaseById(tid); return tc?.testcase_input && tc?.testcase_output ? tc : null; } catch (e) { return null; } });
            const responses = await Promise.all(tcPromises);
            codeTestCases = responses.filter(tc => tc !== null);
            setTerminalLines(prev => [...prev, { type: "info", text: `   📋 Found ${codeTestCases.length} test cases` }]);
          } else setTerminalLines(prev => [...prev, { type: "warn", text: "   ⚠️ No test cases found" }]);
        } catch (e) { setTerminalLines(prev => [...prev, { type: "warn", text: "   ⚠️ Error fetching test cases" }]); }
        setTerminalLines(prev => [...prev, { type: "info", text: "   ⚙️ Compiling..." }]);
        const result = await compileAndEvaluate(id, codeInput, codeLanguage, codeTestCases);
        if (!result.success) { compilationErrors++; setTerminalLines(prev => [...prev, { type: "error", text: `   ❌ Failed: ${result.error}` }]); }
        else { processedResults.push(result); setTerminalLines(prev => [...prev, { type: "success", text: "   ✅ Success" }]); }
      }
      setTerminalLines(prev => [...prev, { type: "info", text: "🔄 Finalizing..." }]);
      let finalTestResult = testResult;
      try { const stored = localStorage.getItem("test_result"); if (stored) finalTestResult = JSON.parse(stored); } catch (e) { console.error(e); }
      finalTestResult.codingResults = finalTestResult.codingResults || [];
      const missingIds = effectiveCodingIds.filter(id => !finalTestResult.codingResults.some(r => r.codeId === id));
      for (const mid of missingIds) {
        const sc = localStorage.getItem(`code_${mid}`); let score = 0;
        if (sc) { try { const p = JSON.parse(sc); if (p.code && p.code !== templates[language] && p.code.trim().length > (templates[language]?.length || 0)) score = 5; } catch (e) { console.error(e); } }
        finalTestResult.codingResults.push({ codeId: mid, score, total: 10 });
      }
      finalTestResult.codingAnswered    = finalTestResult.codingResults.length;
      finalTestResult.codingCorrect     = finalTestResult.codingResults.filter(r => r.score > 0).length;
      finalTestResult.codingWrong       = finalTestResult.codingResults.filter(r => r.score === 0).length;
      finalTestResult.codingNotAnswered = Math.max(0, effectiveCodingIds.length - finalTestResult.codingAnswered);
      finalTestResult.codingNotVisited  = Math.max(0, effectiveCodingIds.length - finalTestResult.codingAnswered);
      finalTestResult.result_score      = (finalTestResult.mcqCorrect || 0) + finalTestResult.codingResults.reduce((sum, r) => sum + r.score, 0);
      localStorage.setItem("test_result", JSON.stringify(finalTestResult));
      setTestResult(finalTestResult);
      setTerminalLines(prev => [...prev,
        { type: "success", text: `✅ Done — ${compilationErrors} error(s)` },
        { type: "info",    text: `📈 ${finalTestResult.codingResults.length}/${effectiveCodingIds.length} programs processed` },
        { type: "success", text: `🏆 Score: ${finalTestResult.result_score}/${finalTestResult.result_total_score}` },
      ]);
      setSnackbarMessage(`Compilation completed. ${finalTestResult.codingResults.length}/${effectiveCodingIds.length} processed.`);
      setSnackbarSeverity(compilationErrors > 0 ? "warning" : "success");
      return { success: true, errors: compilationErrors, finalResult: finalTestResult };
    } catch (error) {
      setTerminalLines(prev => [...prev, { type: "error", text: `❌ Error: ${error.message}` }]);
      setSnackbarMessage("Error compiling all programs."); setSnackbarSeverity("error");
      return { success: false, error: error.message };
    } finally { setLoading(false); setOpenProgressDialog(false); setSnackbarOpen(true); }
  };

  const handleFinalSubmit = async (isMalpractice = false) => {
    if (hasSubmitted) return;
    setLoading(true); setOpenProgressDialog(true);
    setTerminalLines([{ type: "info", text: "🚀 Starting final submission process..." }]);
    try {
      setTerminalLines(prev => [...prev, { type: "info", text: "📝 Step 1: Compiling all programs..." }]);
      const compilationResult = await compileAllPrograms();
      if (!compilationResult.success) throw new Error(`Compilation failed: ${compilationResult.error}`);
      if (!isMalpractice) { setSubmitConfirmDialogOpen(true); setLoading(false); setOpenProgressDialog(false); return; }
      setTerminalLines(prev => [...prev, { type: "info", text: "📤 Step 2: Preparing submission..." }]);
      let finalTestResult = compilationResult.finalResult;
      try { const stored = localStorage.getItem("test_result"); if (stored) finalTestResult = JSON.parse(stored); } catch (e) { console.error(e); }
      const resultData = {
        result_user_id: finalTestResult.result_user_id || userId || "",
        result_test_id: finalTestResult.result_test_id || testId || "",
        result_poc_id:  finalTestResult.result_poc_id  || pocId  || "",
        result_score:   finalTestResult.result_score   || 0,
        result_total_score: finalTestResult.result_total_score || 0,
        codingAnswered: finalTestResult.codingAnswered || 0,
        codingCorrect:  finalTestResult.codingCorrect  || 0,
        codingIds:      finalTestResult.codingIds      || [],
        codingNotAnswered: finalTestResult.codingNotAnswered || 0,
        codingNotVisited:  finalTestResult.codingNotVisited  || 0,
        codingWrong:    finalTestResult.codingWrong    || 0,
        marked:         finalTestResult.marked         || 0,
        mcqAnswered:    finalTestResult.mcqAnswered    || 0,
        mcqCorrect:     finalTestResult.mcqCorrect     || 0,
        mcqNotAnswered: finalTestResult.mcqNotAnswered || 0,
        mcqNotVisited:  finalTestResult.mcqNotVisited  || 0,
        mcqWrong:       finalTestResult.mcqWrong       || 0,
        studentName:    finalTestResult.studentName    || studentName || "",
        testLanguage:   finalTestResult.testLanguage   || "",
        testName:       finalTestResult.testName       || "",
        codingResults:  finalTestResult.codingResults  || [],
      };
      setTerminalLines(prev => [...prev, { type: "info", text: "🚀 Step 3: Submitting..." }]);
      await submitTestResult(resultData);
      const effectiveCodingIds = fetchedTestCodingIds.length > 0 ? fetchedTestCodingIds : (testResult.codingIds || []);
      effectiveCodingIds.forEach(id => { try { localStorage.removeItem(`code_${id}`); } catch (e) { console.error(e); } });
      localStorage.removeItem("fs_exit_count");
      setHasSubmitted(true);
      setTerminalLines(prev => [...prev, { type: "success", text: "🎉 Test submitted successfully!" }]);
      setSnackbarMessage("Test submitted successfully!"); setSnackbarSeverity("success"); setSnackbarOpen(true);
      navigate("/test-result", { state: { resultData } });
    } catch (error) {
      console.error(error);
      setTerminalLines(prev => [...prev, { type: "error", text: `💥 Error: ${error.message}` }]);
      setSnackbarMessage(`Error during test submission: ${error.message}`); setSnackbarSeverity("error");
    } finally { setLoading(false); setOpenProgressDialog(false); setSnackbarOpen(true); }
  };

  const confirmFinalSubmit = async () => {
    setSubmitConfirmDialogOpen(false); setLoading(true); setOpenProgressDialog(true);
    setTerminalLines([{ type: "info", text: "Submitting test for final evaluation..." }]);
    try {
      const resultData = {
        result_user_id: testResult.result_user_id || userId || "",
        result_test_id: testResult.result_test_id || testId || "",
        result_poc_id:  testResult.result_poc_id  || pocId  || "",
        result_score:   testResult.result_score   || 0,
        result_total_score: testResult.result_total_score || 0,
        codingAnswered: testResult.codingAnswered || 0,
        codingCorrect:  testResult.codingCorrect  || 0,
        codingIds:      testResult.codingIds      || [],
        codingNotAnswered: testResult.codingNotAnswered || 0,
        codingNotVisited:  testResult.codingNotVisited  || 0,
        codingWrong:    testResult.codingWrong    || 0,
        marked:         testResult.marked         || 0,
        mcqAnswered:    testResult.mcqAnswered    || 0,
        mcqCorrect:     testResult.mcqCorrect     || 0,
        mcqNotAnswered: testResult.mcqNotAnswered || 0,
        mcqNotVisited:  testResult.mcqNotVisited  || 0,
        mcqWrong:       testResult.mcqWrong       || 0,
        studentName:    testResult.studentName    || studentName || "",
        testLanguage:   testResult.testLanguage   || "",
        testName:       testResult.testName       || "",
        codingResults:  testResult.codingResults  || [],
      };
      await submitTestResult(resultData);
      const effectiveCodingIds = fetchedTestCodingIds.length > 0 ? fetchedTestCodingIds : testResult.codingIds;
      effectiveCodingIds.forEach((id) => localStorage.removeItem(`code_${id}`));
      localStorage.removeItem("fs_exit_count");
      setHasSubmitted(true);
      setTerminalLines(prev => [...prev, { type: "success", text: "Test submitted successfully!" }]);
      setSnackbarMessage("Test submitted successfully!"); setSnackbarSeverity("success"); setSnackbarOpen(true);
      navigate("/test-result", { state: { resultData } });
    } catch (error) {
      console.error(error);
      setTerminalLines(prev => [...prev, { type: "error", text: `Error: ${error.message}` }]);
      setSnackbarMessage(`Error: ${error.message}`); setSnackbarSeverity("error"); setSnackbarOpen(true);
    } finally { setLoading(false); setOpenProgressDialog(false); }
  };

  const cancelFinalSubmit = () => { setSubmitConfirmDialogOpen(false); setSnackbarMessage("Submission cancelled."); setSnackbarSeverity("info"); setSnackbarOpen(true); };

  const handlePrevious = async () => {
    saveSubmissionPayload();
    await compileAndEvaluate(codeId, input, language, testCases);
    const effectiveCodingIds = fetchedTestCodingIds.length > 0 ? fetchedTestCodingIds : testResult.codingIds;
    if (testResult.currentCodingIndex > 0) {
      const prevCodeId = effectiveCodingIds[testResult.currentCodingIndex - 1];
      setTestResult((prev) => { const u = { ...prev, currentCodingIndex: prev.currentCodingIndex - 1 }; localStorage.setItem("test_result", JSON.stringify(u)); return u; });
      navigate(`/coding/${prevCodeId}`, { state: { ...testResult, currentCodingIndex: testResult.currentCodingIndex - 1 } });
      window.history.pushState(null, null, window.location.href);
      setSnackbarMessage("Compiled and moved to previous program."); setSnackbarSeverity("info"); setSnackbarOpen(true);
    }
  };

  const handleNext = async () => {
    saveSubmissionPayload();
    await compileAndEvaluate(codeId, input, language, testCases);
    const effectiveCodingIds = fetchedTestCodingIds.length > 0 ? fetchedTestCodingIds : testResult.codingIds;
    if (testResult.currentCodingIndex < effectiveCodingIds.length - 1) {
      const nextCodeId = effectiveCodingIds[testResult.currentCodingIndex + 1];
      setTestResult((prev) => { const u = { ...prev, currentCodingIndex: prev.currentCodingIndex + 1 }; localStorage.setItem("test_result", JSON.stringify(u)); return u; });
      navigate(`/coding/${nextCodeId}`, { state: { ...testResult, currentCodingIndex: testResult.currentCodingIndex + 1 } });
      window.history.pushState(null, null, window.location.href);
      setSnackbarMessage("Compiled and moved to next program."); setSnackbarSeverity("info"); setSnackbarOpen(true);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const effectiveCodingIds   = fetchedTestCodingIds.length > 0 ? fetchedTestCodingIds : testResult.codingIds;
  const isFirstProgram       = testResult.currentCodingIndex === 0;
  const isLastProgram        = testResult.currentCodingIndex >= effectiveCodingIds.length - 1;
  const visibleTestCases     = testCases.slice(0, 3);   // Show only 3 to user
  const hiddenTestCasesCount = testCases.length - 3;
  const warningsRemaining    = MAX_FULLSCREEN_WARNINGS - fullScreenExitCount;

  const difficultyChipClass = (d) => d === "Easy" ? "cp-chip-easy" : d === "Hard" ? "cp-chip-hard" : "cp-chip-medium";

  // Status colour for test case dialog
  const statusColour = (status) => {
    if (status === "passed")        return { color: "#16a34a", bg: "#f0fdf4" };
    if (status === "compile_error") return { color: "#dc2626", bg: "#fff1f2" };
    if (status === "runtime_error") return { color: "#d97706", bg: "#fffbeb" };
    return { color: "#dc2626", bg: "#fff1f2" };
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* ── Progress dialog ─────────────────────────────────────── */}
      <Dialog open={openProgressDialog} PaperProps={{ className: "cp-dialog-paper" }}>
        <DialogContent className="cp-progress-dialog__inner">
          <CircularProgress className="cp-loading-spinner" />
          <Typography variant="h6" color="text.primary" className="cp-progress-dialog__text">
            Processing your code...
          </Typography>
        </DialogContent>
      </Dialog>

      {/* ── Fullscreen warning dialog ────────────────────────────── */}
      <Dialog open={fullScreenWarningOpen} disableEscapeKeyDown PaperProps={{ className: "cp-dialog-paper" }}>
        <DialogContent className="cp-dialog-content">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <WarningAmberIcon sx={{ color: "#f59e0b", fontSize: 32 }} />
            <Typography variant="h6" color="text.primary" className="cp-dialog-title">
              Fullscreen Exited — Warning {fullScreenExitCount} of {MAX_FULLSCREEN_WARNINGS}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" className="cp-dialog-body">
            You have exited fullscreen mode. This is warning <strong>{fullScreenExitCount}</strong> of <strong>{MAX_FULLSCREEN_WARNINGS}</strong>.
          </Typography>
          <Typography variant="body2" sx={{ color: "#ef4444", mt: 1, fontWeight: 600 }}>
            {warningsRemaining > 0
              ? `You have ${warningsRemaining} warning${warningsRemaining !== 1 ? "s" : ""} remaining before the test is automatically submitted.`
              : "This is your final warning. The test will be submitted on next exit."}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please return to fullscreen mode immediately to continue the test.
          </Typography>
        </DialogContent>
        <DialogActions className="cp-dialog-actions">
          <Button onClick={handleReEnterFullScreen} variant="contained" color="warning" className="cp-dialog-btn" sx={{ background: "#f59e0b", "&:hover": { background: "#d97706" } }}>
            Return to Fullscreen
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Submit confirm dialog ────────────────────────────────── */}
      <Dialog open={submitConfirmDialogOpen} PaperProps={{ className: "cp-dialog-paper" }}>
        <DialogContent className="cp-dialog-content">
          <Typography variant="h6" color="text.primary" className="cp-dialog-title">Are you sure you want to submit the test?</Typography>
          <Typography variant="body2" color="text.secondary" className="cp-dialog-body">This action will finalize your test and you won't be able to make further changes.</Typography>
        </DialogContent>
        <DialogActions className="cp-dialog-actions">
          <Button onClick={cancelFinalSubmit}  variant="outlined"   className="cp-dialog-btn">Continue Coding</Button>
          <Button onClick={confirmFinalSubmit} variant="contained" color="error" className="cp-dialog-btn">Submit Test</Button>
        </DialogActions>
      </Dialog>

      {/* ── Instructions dialog ──────────────────────────────────── */}
      <Dialog open={instructionsOpen} onClose={() => setInstructionsOpen(false)} PaperProps={{ className: "cp-dialog-paper" }}>
        <DialogContent className="cp-dialog-content">
          <Typography variant="h6" color="text.primary" className="cp-dialog-title">Test Instructions</Typography>
          <List className="cp-instructions-list">
            {defaultInstructions.map((ins, i) => (
              <ListItem key={i} disablePadding>
                <ListItemText primary={<Typography variant="body2" color="text.secondary" className="cp-instructions-item">{`${i + 1}. ${ins}`}</Typography>} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions className="cp-dialog-actions">
          <Button onClick={() => setInstructionsOpen(false)} variant="contained" color="primary" className="cp-dialog-btn">Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Run Test Cases result dialog ─────────────────────────── */}
      <Dialog
        open={testCaseDialogOpen}
        onClose={() => !runTestCasesLoading && setTestCaseDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: "cp-dialog-paper" }}
      >
        <DialogTitle sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 1, pb: 1 }}>
          <BugReportIcon sx={{ color: "#0c83c8" }} />
          Test Case Results
          {!runTestCasesLoading && testCaseResults.length > 0 && (
            <Chip
              label={`${testCaseResults.filter(r => r.passed).length} / ${testCaseResults.length} Passed`}
              size="small"
              sx={{ ml: 1, background: testCaseResults.every(r => r.passed) ? "#22c55e" : "#ef4444", color: "#fff", fontWeight: 700 }}
            />
          )}
        </DialogTitle>

        <DialogContent sx={{ p: 0, maxHeight: "65vh", overflowY: "auto" }}>
          {runTestCasesLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 4, justifyContent: "center" }}>
              <CircularProgress size={26} sx={{ color: "#0c83c8" }} />
              <Typography variant="body1" sx={{ fontFamily: "Inter, sans-serif" }}>Running all test cases...</Typography>
            </Box>
          ) : testCaseResults.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">No results available.</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: "none", borderRadius: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: mode === "dark" ? "#1f2937" : "#f1f5f9" }}>
                    <TableCell sx={{ fontWeight: 700, fontFamily: "Inter, sans-serif", width: 130 }}>Test Case</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: "Inter, sans-serif", width: 150 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontFamily: "Inter, sans-serif" }}>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {testCaseResults.map((result) => {
                    const sc = statusColour(result.status);
                    return (
                      <TableRow key={result.index} sx={{ "&:hover": { background: mode === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" } }}>
                        {/* Test Case # */}
                        <TableCell sx={{ fontFamily: "Inter, sans-serif", fontWeight: 600, verticalAlign: "top", pt: 1.5 }}>
                          {result.isHidden
                            ? <span style={{ color: "#9ca3af" }}>Hidden #{result.index}</span>
                            : `Test Case #${result.index}`}
                        </TableCell>

                        {/* Status badge */}
                        <TableCell sx={{ verticalAlign: "top", pt: 1.5 }}>
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.2, py: 0.4, borderRadius: 1.5, background: sc.bg, color: sc.color, fontWeight: 700, fontSize: "0.78rem", fontFamily: "Inter, sans-serif" }}>
                            {result.passed
                              ? <CheckCircleOutlineIcon sx={{ fontSize: 15 }} />
                              : <CancelOutlinedIcon    sx={{ fontSize: 15 }} />}
                            {result.statusLabel}
                          </Box>
                        </TableCell>

                        {/* Detail */}
                        <TableCell sx={{ verticalAlign: "top", pt: 1.5 }}>
                          {result.isHidden ? (
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "'Fira Code', monospace", fontStyle: "italic" }}>
                              Details hidden for this test case
                            </Typography>
                          ) : (result.status === "compile_error" || result.status === "runtime_error") ? (
                            <Typography variant="caption" sx={{ fontFamily: "'Fira Code', monospace", color: sc.color, whiteSpace: "pre-wrap", display: "block" }}>
                              {result.actualOutput}
                            </Typography>
                          ) : (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4 }}>
                              <Typography variant="caption" sx={{ fontFamily: "'Fira Code', monospace", color: "text.secondary" }}>
                                <strong>Input:</strong> {result.input || "(none)"}
                              </Typography>
                              <Typography variant="caption" sx={{ fontFamily: "'Fira Code', monospace", color: "text.secondary" }}>
                                <strong>Expected:</strong> {result.expectedOutput}
                              </Typography>
                              <Typography variant="caption" sx={{ fontFamily: "'Fira Code', monospace", color: result.passed ? "#16a34a" : "#dc2626" }}>
                                <strong>Got:</strong> {result.actualOutput || "(no output)"}
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions className="cp-dialog-actions">
          <Button onClick={() => setTestCaseDialogOpen(false)} disabled={runTestCasesLoading} variant="contained" color="primary" className="cp-dialog-btn">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Main snackbar ────────────────────────────────────────── */}
      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} variant="filled" className="cp-snackbar-alert">
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* ── Reset snackbar ───────────────────────────────────────── */}
      <Snackbar open={resetDialogOpen} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity="warning" variant="filled" className="cp-snackbar-alert"
          action={<Box sx={{ display: "flex", gap: 1 }}><Button color="inherit" size="small" onClick={confirmResetEditor}>Reset</Button><Button color="inherit" size="small" onClick={cancelResetEditor}>Cancel</Button></Box>}>
          Reset editor to template? This will clear your current code.
        </Alert>
      </Snackbar>

      {/* ── Page root ───────────────────────────────────────────── */}
      <div className="cp-root">

        {/* ── Toolbar ─────────────────────────────────────────────── */}
        <div className="cp-toolbar">
          <div className="cp-toolbar__left">
            <CodeIcon className="cp-toolbar__logo-icon" />
            <Typography variant="h5" color="text.primary" className="cp-toolbar__title">
              {testResult.testName} — Coding Program {testResult.currentCodingIndex + 1} of {effectiveCodingIds.length || 1}
            </Typography>
            <Tooltip title="View Instructions">
              <IconButton size="small" onClick={() => setInstructionsOpen(true)} sx={{ ml: 1 }}><InfoIcon fontSize="small" /></IconButton>
            </Tooltip>
          </div>

          <div className="cp-toolbar__right">
            {fullScreenExitCount > 0 && (
              <Tooltip title={`Fullscreen exits: ${fullScreenExitCount}/${MAX_FULLSCREEN_WARNINGS}`}>
                <Chip icon={<WarningAmberIcon fontSize="small" />} label={`FS Warnings: ${fullScreenExitCount}/${MAX_FULLSCREEN_WARNINGS}`} size="small"
                  sx={{ background: fullScreenExitCount >= 4 ? "#ef4444" : "#f59e0b", color: "#fff", fontWeight: 600, mr: 1 }} />
              </Tooltip>
            )}
            <div className="cp-badge"><Typography variant="subtitle1" className="cp-badge__text">Time Left: {formatTime(timer)}</Typography></div>
            <div className="cp-badge"><Typography variant="subtitle1" className="cp-badge__text">{studentName || "User"}</Typography></div>
            <FormControl size="small" className="cp-lang-select">
              <Select value={language} onChange={handleLanguageChange}
                renderValue={(sel) => (<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>{languageIcons[sel]}<Typography className="cp-lang-select__label">{languageNames[sel]}</Typography></Box>)}>
                <MenuItem value="python">     <PythonIcon    sx={{ mr: 1, fontSize: "small" }} /> Python     </MenuItem>
                <MenuItem value="java">       <JavaIcon      sx={{ mr: 1, fontSize: "small" }} /> Java       </MenuItem>
                <MenuItem value="cpp">        <CppIcon       sx={{ mr: 1, fontSize: "small" }} /> C++        </MenuItem>
                <MenuItem value="c">          <CIcon         sx={{ mr: 1, fontSize: "small" }} /> C          </MenuItem>
                <MenuItem value="javascript"> <JavascriptIcon sx={{ mr: 1, fontSize: "small" }} /> JavaScript </MenuItem>
              </Select>
            </FormControl>
            <FormGroup>
              <FormControlLabel control={<MaterialUISwitch sx={{ m: 0.5 }} checked={mode === "dark"} onChange={toggleTheme} />} label="" />
            </FormGroup>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className={`cp-body${isMobile ? " cp-body--mobile" : ""}`}>

          {/* Editor column */}
          <div className="cp-editor-col" style={{ width: isMobile ? "100%" : testCasesCollapsed ? "90%" : `${editorWidth}%`, height: isMobile ? "50%" : "auto" }}>

            {/* Editor toolbar */}
            <div className="cp-editor-bar">
              <Typography variant="subtitle1" className="cp-editor-bar__title">Code Editor</Typography>
              <div className="cp-editor-bar__actions">
                <Tooltip title="Reset Code"><IconButton size="small" onClick={resetEditor}><RefreshIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Save Code"><IconButton size="small" onClick={handleSave}><SaveIcon fontSize="small" /></IconButton></Tooltip>

                {/* Run button — terminal only */}
                <Button
                  variant="contained" color="primary" size="small" className="cp-btn-run"
                  onClick={handleRun}
                  disabled={runLoading || loading}
                  startIcon={runLoading ? <CircularProgress size={12} color="inherit" /> : <PlayArrowIcon />}
                >
                  Run
                </Button>

                {/* Run Test Cases button */}
                <Button
                  variant="outlined" size="small" className="cp-btn-run"
                  onClick={handleRunTestCases}
                  disabled={runTestCasesLoading || loading || testCases.length === 0}
                  startIcon={runTestCasesLoading ? <CircularProgress size={12} color="inherit" /> : <BugReportIcon />}
                  sx={{ borderColor: "#fc7a46", color: "#fc7a46", "&:hover": { borderColor: "#e55e2c", color: "#e55e2c", background: "rgba(252,122,70,0.06)" } }}
                >
                  Run Test Cases
                </Button>
              </div>
            </div>

            {/* Monaco editor */}
            <div className="cp-editor-area">
              <Editor
                className="monaco-editor" height="100%" language={language} value={input}
                onChange={handleEditorChange} onMount={handleEditorDidMount}
                theme={mode === "dark" ? "vs-dark" : "vs"}
                options={{ fontSize: 18, minimap: { enabled: !isMobile }, scrollBeyondLastLine: false, lineNumbers: "on", padding: { top: 8 }, smoothScrolling: true, automaticLayout: true, tabIndex: 0, wordWrap: "on", fixedOverflowWidgets: true, ...(isMobile && { fontSize: 16, lineHeight: 24, quickSuggestions: false }) }}
              />
            </div>

            {/* ── Terminal output ── */}
            <div className="cp-output" style={{ height: outputMinimized ? "auto" : `${outputHeight}%` }}>
              <div ref={outputDividerRef} className="cp-output-resize-handle" onMouseDown={handleOutputMouseDown} />
              <div className="cp-output-bar">
                <div className="cp-output-bar__left">
                  <TerminalIcon className="cp-output-bar__icon" />
                  <Typography variant="subtitle1" className="cp-output-bar__title">Terminal</Typography>
                </div>
                <IconButton size="small" onClick={toggleOutput} aria-label={outputMinimized ? "Expand" : "Minimize"}>
                  {outputMinimized ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowUpIcon fontSize="small" />}
                </IconButton>
              </div>
              {!outputMinimized && (
                <div style={{
                  flex: 1,
                  padding: "10px 14px",
                  overflowY: "auto",
                  background: "#0d1117",
                  minHeight: 0,
                }}>
                  {terminalLines.length === 0 ? (
                    <span style={{ color: "#4b5563", fontFamily: "'Fira Code', monospace", fontSize: 13 }}>
                      Press <span style={{ color: "#60a5fa" }}>Run</span> to execute your code,
                      or <span style={{ color: "#fc7a46" }}>Run Test Cases</span> to check all test cases.
                    </span>
                  ) : (
                    terminalLines.map((line, i) => <TerminalLine key={i} line={line} />)
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Vertical resize divider */}
          {!isMobile && !testCasesCollapsed && (
            <div ref={dividerRef} className="cp-col-divider" onMouseDown={handleMouseDown} />
          )}

          {/* Problem / test cases column */}
          <div
            className={`cp-problem-col${isMobile ? " cp-problem-col--mobile" : ""}`}
            style={{ width: isMobile ? "100%" : testCasesCollapsed ? "10%" : `${100 - editorWidth - 1}%`, height: isMobile ? "50%" : "auto" }}
          >
            <div className="cp-problem-bar">
              <div className="cp-problem-bar__left">
                <FormatListNumberedIcon className="cp-problem-bar__icon" />
                <Typography variant="subtitle1" className="cp-problem-bar__title">Problem & Test Cases</Typography>
                {!testCasesCollapsed && (<Chip label={testCases.length} size="small" color="secondary" sx={{ ml: 1, height: 20, fontSize: "0.75rem" }} />)}
              </div>
              <div className="cp-problem-bar__right">
                {isMobile ? (
                  <IconButton size="small" onClick={() => setShowTestCases(!showTestCases)}>
                    {showTestCases ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                  </IconButton>
                ) : (
                  <Tooltip title={testCasesCollapsed ? "Expand" : "Collapse"}>
                    <IconButton size="small" onClick={toggleTestCases}>
                      {testCasesCollapsed ? <KeyboardArrowLeftIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                )}
              </div>
            </div>

            {isMobile && !showTestCases && (
              <div className="cp-collapsed-msg">
                <Typography variant="body2" className="cp-collapsed-msg__text">
                  {testCases.length} test case{testCases.length !== 1 ? "s" : ""} available
                </Typography>
              </div>
            )}

            {!testCasesCollapsed && showTestCases && (
              <div className="cp-problem-body">
                {loading ? (
                  <div className="cp-loading-center"><CircularProgress className="cp-loading-spinner" /></div>
                ) : selectedCode ? (
                  <>
                    <Card className="cp-problem-card">
                      <CardContent className="cp-problem-card__content">
                        <div className="cp-problem-card__header">
                          <Typography variant="subtitle1" className="cp-problem-card__title">{selectedCode.code_title || "Problem"}</Typography>
                          <Chip label="10 Mark" size="small" className={difficultyChipClass(selectedCode.code_difficulty)} sx={{ height: 20, fontSize: "0.75rem" }} />
                        </div>
                        <Divider sx={{ mb: 1 }} />
                        <Typography variant="body2" className="cp-problem-card__statement">{selectedCode.code_problem_statement}</Typography>
                      </CardContent>
                    </Card>

                    {/* Show only first 3 test cases */}
                    {testCases.length > 0 ? (
                      <Stack spacing={1}>
                        {visibleTestCases.map((tc, i) => (
                          <Card key={i} className="cp-testcase-card">
                            <CardContent className="cp-testcase-card__content">
                              <div className="cp-testcase-card__header">
                                <Typography variant="subtitle2" className="cp-testcase-card__title">Test Case #{i + 1}</Typography>
                              </div>
                              <Divider sx={{ mb: 1 }} />
                              {tc.testcase_input && (
                                <Typography className="cp-testcase-card__code">
                                  <strong>Input:</strong><br />
                                  {Array.isArray(tc.testcase_input) ? tc.testcase_input.join("\n") : tc.testcase_input || "No input provided"}
                                </Typography>
                              )}
                              {tc.testcase_output && (
                                <Typography className="cp-testcase-card__code">
                                  <strong>Expected Output:</strong><br />
                                  {Array.isArray(tc.testcase_output) ? tc.testcase_output.join("\n") : tc.testcase_output || "No output provided"}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                        {hiddenTestCasesCount > 0 && (
                          <Typography variant="body2" className="cp-testcase-hidden">
                            + {hiddenTestCasesCount} hidden test case{hiddenTestCasesCount !== 1 ? "s" : ""}
                          </Typography>
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="body2" className="cp-testcase-empty">No test cases available for this problem.</Typography>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" className="cp-testcase-empty">No problem selected or failed to load problem data.</Typography>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="cp-footer">
          <div className="cp-footer__nav">
            <Button variant="outlined" color="primary" onClick={handlePrevious} disabled={isFirstProgram || loading} startIcon={<NavigateBeforeIcon />} size="small" className="cp-btn-nav">Previous</Button>
            <Button variant="outlined" color="primary" onClick={handleNext}     disabled={isLastProgram  || loading} endIcon={<NavigateNextIcon />}    size="small" className="cp-btn-nav">Next</Button>
          </div>
          <Button variant="contained" color="error" onClick={() => handleFinalSubmit(false)} disabled={loading} startIcon={<DoneIcon />} size="small" className="cp-btn-submit">
            Submit Test
          </Button>
        </div>

      </div>
    </ThemeProvider>
  );
};

export default CodingPage;