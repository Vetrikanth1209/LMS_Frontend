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
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CodeIcon from "@mui/icons-material/Code";
import JavaIcon from "@mui/icons-material/DeveloperMode";
import PythonIcon from "@mui/icons-material/Memory";
import CppIcon from "@mui/icons-material/IntegrationInstructions";
import CIcon from "@mui/icons-material/SettingsEthernet";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import JavascriptIcon from "@mui/icons-material/Code";
import TerminalIcon from "@mui/icons-material/Terminal";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import DoneIcon from "@mui/icons-material/Done";
import InfoIcon from "@mui/icons-material/Info";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import BugReportIcon from "@mui/icons-material/BugReport";
import TimerIcon from "@mui/icons-material/Timer";
import PersonIcon from "@mui/icons-material/Person";
import {
  fetchCodeById,
  fetchTestCaseById,
  compileCode,
  submitTestResult,
  getTestById,
} from "../axios";
import "../styles/CodePage.css";
import useAssessmentBackup from "../hooks/assessmentBackup";

// ── Language mapping ──────────────────────────────────────────────────────────
const languageApiMap = {
  python: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
  javascript: "javascript",
};

// ── MUI theme ─────────────────────────────────────────────────────────────────
const createAppTheme = () =>
  createTheme({
    palette: {
      mode: "light",
      primary: { main: "#0c83c8" },
      secondary: { main: "#fc7a46" },
      background: {
        default: "#f9fafb",
        paper: "#ffffff",
      },
      text: {
        primary: "#1f2937",
        secondary: "#6b7280",
      },
      success: { main: "#22c55e" },
      error: { main: "#ef4444" },
      warning: { main: "#f59e0b" },
      info: { main: "#3b82f6" },
      divider: "rgba(0,0,0,0.08)",
    },
    typography: {
      fontFamily: "'Inter', 'Helvetica', 'Arial', sans-serif",
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
          body { background-color: #f9fafb !important; }
        `,
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "0 4px 12px rgba(12,131,200,0.15)",
            },
          },
          containedPrimary: {
            background: "#0c83c8",
            "&:hover": { background: "#095e8f" },
          },
          containedSecondary: {
            background: "#fc7a46",
            "&:hover": { background: "#e55e2c" },
          },
          outlined: { borderWidth: 1.5 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.05)",
            backgroundColor: "#ffffff",
          },
        },
      },
      MuiTypography: {
        styleOverrides: { root: { color: "inherit" } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            color: "#1f2937",
            borderBottomColor: "rgba(0,0,0,0.08)",
          },
          head: { color: "#1f2937", fontWeight: 700 },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: "all 0.2s ease-in-out",
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { borderRadius: 6, fontWeight: 500 } },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: "rgba(0,0,0,0.08)" },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: { borderRadius: 8, color: "#1f2937" },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            color: "#1f2937",
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: "#1f2937",
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            fontFamily: "'Inter','Helvetica','Arial',sans-serif !important",
            borderRadius: 8,
          },
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
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: "#ffffff",
            color: "#1f2937",
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { color: "#1f2937" } },
      },
      MuiDialogContentText: {
        styleOverrides: { root: { color: "#6b7280" } },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: { color: "#1f2937" },
          secondary: { color: "#6b7280" },
        },
      },
    },
  });

// ── Terminal line renderer ────────────────────────────────────────────────────
const TerminalLine = ({ line }) => {
  const colours = {
    info: "#60a5fa",
    success: "#4ade80",
    error: "#f87171",
    warn: "#fbbf24",
    plain: "#e5e7eb",
  };
  return (
    <div
      style={{
        color: colours[line.type] || colours.plain,
        fontFamily: "'Fira Code', monospace",
        fontSize: 13,
        lineHeight: "1.65",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {line.text}
    </div>
  );
};

// ── parseRunResponse ──────────────────────────────────────────────────────────
const parseRunResponse = (apiResult) => {
  const actual = (apiResult.actualOutput || "").trim();
  const compilePatterns = [
    /error:/i,
    /SyntaxError/i,
    /IndentationError/i,
    /NameError/i,
    /cannot find symbol/i,
    /error: expected/i,
    /undefined reference/i,
    /fatal error/i,
    /compilation failed/i,
    /javac/i,
    /\^~/,
    /\^/,
  ];
  const runtimePatterns = [
    /Traceback \(most recent call last\)/i,
    /Exception in thread/i,
    /RuntimeError/i,
    /SegmentationFault/i,
    /Segmentation fault/i,
    /java\.lang\./i,
    /SIGSEGV/i,
    /killed/i,
    /ZeroDivisionError/i,
    /AttributeError/i,
    /IndexError/i,
    /KeyError/i,
    /ValueError/i,
    /OverflowError/i,
    /RecursionError/i,
    /MemoryError/i,
    /core dumped/i,
  ];
  const hasCompileError = compilePatterns.some((p) => p.test(actual));
  const hasRuntimeError =
    !hasCompileError && runtimePatterns.some((p) => p.test(actual));
  return { hasCompileError, hasRuntimeError, cleanOutput: actual };
};

// ── CodingPage ────────────────────────────────────────────────────────────────
const CodingPage = () => {
  const { codeId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const mode = "light";
  const theme = createAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ── State ────────────────────────────────────────────────────────────────
  const [testId, setTestId] = useState(localStorage.getItem("test_id") || "");
  const [userId, setUserId] = useState("");
  const [pocId, setPocId] = useState("");
  const [studentName, setStudentName] = useState("");
  const { saveBackup, loadBackup, clearBackup, addSecurityLog } =
    useAssessmentBackup({
      testId,
      userId,
      pocId,
    });
  const [timer, setTimer] = useState(
    // parseInt(localStorage.getItem("test_timer")) || 0,
    0,
  );
  const timerRef = useRef(null);
  // Track whether the timer has ever been set to a positive value
  // so we don't auto-submit on initial render when timer is 0
  const timerInitializedRef = useRef(false);

  // const savedTestResult = JSON.parse(localStorage.getItem("test_result")) || {};
  const [testResult, setTestResult] = useState({
    result_user_id: state?.result_user_id || "",
    codingAnswered: state?.codingAnswered || 0,
    codingCorrect: state?.codingCorrect || 0,
    codingIds: state?.codingIds || [],
    codingNotAnswered: state?.codingNotAnswered || 0,
    codingNotVisited: state?.codingNotVisited || 0,
    codingWrong: state?.codingWrong || 0,
    marked: state?.marked || 0,
    mcqAnswered: state?.mcqAnswered || 0,
    mcqCorrect: state?.mcqCorrect || 0,
    mcqNotAnswered: state?.mcqNotAnswered || 0,
    mcqNotVisited: state?.mcqNotVisited || 0,
    mcqWrong: state?.mcqWrong || 0,
    result_poc_id: state?.result_poc_id || "",
    result_score: state?.result_score || 0,
    result_total_score: state?.result_total_score || 0,
    studentName: state?.studentName || "",
    testLanguage: state?.testLanguage || "",
    testName: state?.testName || "",
    currentCodingIndex: state?.currentCodingIndex || 0,
    codingResults: state?.codingResults || [],
    testInstructions: state?.testInstructions || [],
  });

  const [terminalLines, setTerminalLines] = useState([]);
  const [runLoading, setRunLoading] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef("");
  const [language, setLanguage] = useState("python");
  const [loading, setLoading] = useState(false);
  const [selectedCode, setSelectedCode] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [showOutput, setShowOutput] = useState(true);
  const [outputMinimized, setOutputMinimized] = useState(false);
  const [openProgressDialog, setOpenProgressDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [showTestCases, setShowTestCases] = useState(!isMobile);
  const [testCasesCollapsed, setTestCasesCollapsed] = useState(false);
  const [editorWidth, setEditorWidth] = useState(60);
  const [outputHeight, setOutputHeight] = useState(30);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [submitConfirmDialogOpen, setSubmitConfirmDialogOpen] = useState(false);
  const [fetchedTestCodingIds, setFetchedTestCodingIds] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [showFullScreenPrompt, setShowFullScreenPrompt] = useState(true);

  const [testCaseDialogOpen, setTestCaseDialogOpen] = useState(false);
  const [testCaseResults, setTestCaseResults] = useState([]);
  const [runTestCasesLoading, setRunTestCasesLoading] = useState(false);

  const MAX_FULLSCREEN_WARNINGS = 5;
  const [fullScreenExitCount, setFullScreenExitCount] = useState(() =>
    parseInt(localStorage.getItem("fs_exit_count") || "0"),
  );
  const [fullScreenWarningOpen, setFullScreenWarningOpen] = useState(false);
  const fullScreenExitCountRef = useRef(
    parseInt(localStorage.getItem("fs_exit_count") || "0"),
  );

  const MAX_WINDOW_SWITCH_WARNINGS = 5;
  const [windowSwitchCount, setWindowSwitchCount] = useState(() =>
    parseInt(localStorage.getItem("window_switch_count") || "0"),
  );
  const [windowSwitchWarningOpen, setWindowSwitchWarningOpen] = useState(false);
  const windowSwitchCountRef = useRef(
    parseInt(localStorage.getItem("window_switch_count") || "0"),
  );

  const isDraggingRef = useRef(false);
  const dividerRef = useRef(null);
  const outputDividerRef = useRef(null);
  const resizeTimeoutRef = useRef(null);
  const editorRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  // Suppress malpractice detection while navigating between coding questions
  const isNavigatingRef = useRef(false);
  // Store the freshly compiled result so confirmFinalSubmit always uses up-to-date data
  const compiledResultRef = useRef(null);

  const handleSetInput = (val) => {
    inputRef.current = val;
    setInput(val);
  };

  // ── Language data ─────────────────────────────────────────────────────────
  const templates = {
    python: `print("Hello World")`,
    java: `import java.util.*;\npublic class Progman {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello World");\n\t}\n}`,
    c: `#include <stdio.h>\nint main() {\n\tprintf("Hello World");\n\treturn 0;\n}`,
    cpp: `#include <iostream>\nusing namespace std;\nint main() {\n\tcout << "Hello World";\n\treturn 0;\n}`,
    javascript: `console.log("Hello World");`,
  };

  const languageIcons = {
    python: <PythonIcon fontSize="small" />,
    java: <JavaIcon fontSize="small" />,
    cpp: <CppIcon fontSize="small" />,
    c: <CIcon fontSize="small" />,
    javascript: <JavascriptIcon fontSize="small" />,
  };

  const languageNames = {
    python: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
    javascript: "JavaScript",
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

  useEffect(() => {
    const interval = setInterval(() => {
      saveBackup({
        timer: {
          remainingTime: timer,
        },
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [timer, saveBackup]);

  useEffect(() => {
    const restoreBackup = async () => {
      const backup = await loadBackup();

      if (!backup) return;

      if (backup.timer?.remainingTime) {
        timerInitializedRef.current = true;
        setTimer(backup.timer.remainingTime);
      }

      if (backup.result) {
        setTestResult(backup.result);
      }

      const savedCode = backup?.coding?.answers?.[codeId];

      if (savedCode) {
        setLanguage(savedCode.language);

        handleSetInput(savedCode.code);
      }

      const fsCount = backup?.security?.fullscreenExitCount || 0;

      setFullScreenExitCount(fsCount);

      fullScreenExitCountRef.current = fsCount;

      const wsCount = backup?.security?.windowSwitchCount || 0;

      setWindowSwitchCount(wsCount);

      windowSwitchCountRef.current = wsCount;
    };

    restoreBackup();
  }, [codeId]);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    window.history.pushState(null, null, window.location.href);
    for (let i = 0; i < 10; i++)
      window.history.pushState(null, null, window.location.href);
    const handlePopState = (event) => {
      event.preventDefault();
      if (!hasSubmitted) {
        setSnackbarMessage(
          "Malpractice detected: Attempted navigation. Test submitted automatically.",
        );
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
            studentName: user.user.full_name || prev.studentName,
            result_user_id: user.user.user_id || prev.result_user_id,
            result_poc_id:
              user.user.mod_poc_id?.mod_poc_id || prev.result_poc_id,
          };
          // localStorage.setItem(
          //   "test_result",
          //   JSON.stringify(updatedTestResult),
          // );
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
      // The restoreBackup effect (above) handles loading any previously
      // saved code from IndexedDB. We only set the template here as a
      // fallback; restoreBackup will overwrite it if saved code exists.
      handleSetInput(templates[language]);
    }
  }, [codeId]);

  useEffect(() => {
    const fetchTestData = async () => {
      if (!testId) {
        setSnackbarMessage("No test ID found in localStorage.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setLoading(false);
        return;
      }
      try {
        const res = await getTestById(testId);
        setFetchedTestCodingIds(res.test_coding_id || []);
        setTestResult((prev) => {
          const updatedTestResult = {
            ...prev,
            codingIds: res.test_coding_id || prev.codingIds,
            testName: res.test_name || prev.testName,
            testLanguage: res.test_language || prev.testLanguage,
            result_total_score:
              (res.test_mcq_id?.length || 0) +
              (res.test_coding_id?.length || 0) * 10,
            testInstructions: res.test_instructions || defaultInstructions,
          };
          // localStorage.setItem(
          //   "test_result",
          //   JSON.stringify(updatedTestResult),
          // );
          return updatedTestResult;
        });
        setTestCases([]);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch test:", err);
        setSnackbarMessage("Failed to fetch test data.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setLoading(false);
      }
    };
    fetchTestData();
  }, [testId]);

  useEffect(() => {
    if (timer > 0) {
      // Mark that the timer has been initialized to a real value
      timerInitializedRef.current = true;
    }
    if (hasSubmitted) return;
    // Only auto-submit on timer expiry if the timer was actually running before
    if (timer <= 0) {
      if (timerInitializedRef.current) {
        handleFinalSubmit(true);
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        const n = prev - 1;
        // localStorage.setItem("test_timer", n);
        return n;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timer, hasSubmitted]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      const full = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      if (!full) {
        setIsFullScreen(false);
        if (!hasSubmitted) {
          const n = fullScreenExitCountRef.current + 1;
          fullScreenExitCountRef.current = n;
          setFullScreenExitCount(n);
          saveBackup({
            security: {
              fullscreenExitCount: n,
            },
          });
          if (n >= MAX_FULLSCREEN_WARNINGS) {
            setSnackbarMessage(
              "Fullscreen exited 5 times. Test submitted automatically.",
            );
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            handleFinalSubmit(true);
          } else {
            setFullScreenWarningOpen(true);
          }
        }
      } else {
        setIsFullScreen(true);
        setShowFullScreenPrompt(false);
        setFullScreenWarningOpen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    document.addEventListener("mozfullscreenchange", handleFullScreenChange);
    document.addEventListener("MSFullscreenChange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullScreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullScreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullScreenChange,
      );
    };
  }, [hasSubmitted]);

  useEffect(() => {
    if (!hasSubmitted) {
      const handleWindowBlur = () => {
        if (hasSubmitted || isNavigatingRef.current) return;
        const newCount = windowSwitchCountRef.current + 1;
        windowSwitchCountRef.current = newCount;
        setWindowSwitchCount(newCount);
        saveBackup({
          security: {
            windowSwitchCount: newCount,
          },
        });
        if (newCount >= MAX_WINDOW_SWITCH_WARNINGS) {
          setSnackbarMessage(
            `Switched away from test ${MAX_WINDOW_SWITCH_WARNINGS} times. Test submitted automatically.`,
          );
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
          handleFinalSubmit(true);
        } else {
          setWindowSwitchWarningOpen(true);
        }
      };
      const handleWindowFocus = () => setWindowSwitchWarningOpen(false);
      window.addEventListener("blur", handleWindowBlur);
      window.addEventListener("focus", handleWindowFocus);
      return () => {
        window.removeEventListener("blur", handleWindowBlur);
        window.removeEventListener("focus", handleWindowFocus);
      };
    }
  }, [hasSubmitted]);

  useEffect(() => {
    const handleMalpractice = (reason) => {
      if (!hasSubmitted && !isNavigatingRef.current) {
        setSnackbarMessage(
          `Malpractice detected: ${reason}. Test submitted automatically.`,
        );
        addSecurityLog("MALPRACTICE", reason);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        handleFinalSubmit(true);
      }
    };
    const blockCopyPaste = (e) => {
      e.preventDefault();
      setSnackbarMessage("Copy/paste is disabled during the test.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
    };
    const handleVisibilityChange = () => {
      if (document.hidden)
        handleMalpractice("Tab switching or minimizing browser");
    };
    const handleContextMenu = (e) => {
      e.preventDefault();
      handleMalpractice("Right-click attempt");
    };
    const handleKeyDown = (e) => {
      if (e.keyCode === 91 || e.keyCode === 92) {
        e.preventDefault();
        handleMalpractice("Windows key usage");
      }
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s")
      ) {
        e.preventDefault();
        handleMalpractice("Screenshot attempt");
      }
      // Block Ctrl+C / Ctrl+X / Ctrl+V / Cmd+C / Cmd+X / Cmd+V silently
      if (
        (e.metaKey || e.ctrlKey) &&
        ["c", "x", "v"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        setSnackbarMessage(
          "Copy/paste shortcuts are disabled during the test.",
        );
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
        return;
      }
      if (
        (e.altKey && e.key === "/") ||
        (e.ctrlKey && e.key.toLowerCase() === "i")
      ) {
        e.preventDefault();
        handleMalpractice("Suspected AI tool shortcut");
      }
    };
    let lastInputTime = Date.now();
    const handleEditorInput = (e) => {
      const now = Date.now();
      const diff = now - lastInputTime;
      lastInputTime = now;
      if (e.target.value && e.target.value.length > 100 && diff < 500)
        handleMalpractice("Rapid code input detected (possible AI paste)");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", blockCopyPaste);
    document.addEventListener("cut", blockCopyPaste);
    document.addEventListener("paste", blockCopyPaste);
    document.addEventListener("keydown", handleKeyDown);
    const editorElement = document.querySelector(".monaco-editor .inputarea");
    if (editorElement)
      editorElement.addEventListener("input", handleEditorInput);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", blockCopyPaste);
      document.removeEventListener("cut", blockCopyPaste);
      document.removeEventListener("paste", blockCopyPaste);
      document.removeEventListener("keydown", handleKeyDown);
      if (editorElement)
        editorElement.removeEventListener("input", handleEditorInput);
    };
  }, [hasSubmitted]);

  //   const saveSubmissionPayload = useCallback(() => {
  //     const formattedTestCases = testCases.map((tc) => ({
  //       input: Array.isArray(tc.testcase_input)
  //         ? tc.testcase_input.join("\n")
  //         : tc.testcase_input || "",
  //       expectedOutput: Array.isArray(tc.testcase_output)
  //         ? tc.testcase_output.join("\n")
  //         : tc.testcase_output || "",
  //     }));
  //     // localStorage.setItem(
  //     //   `code_${codeId}`,
  //     //   JSON.stringify({
  //     //     language: languageApiMap[language],
  //     //     code: inputRef.current,
  //     //     testCases: formattedTestCases,
  //     //   }),
  //     // );
  //     saveBackup({
  //   coding: {
  //     currentCodingIndex:
  //       testResult.currentCodingIndex,

  //     answers: {
  //       [codeId]: {
  //         code: inputRef.current,
  //         language,
  //         lastSavedAt: Date.now(),
  //       },
  //     },
  //   },
  // });
  //   }, [codeId, language, testCases]);

  const saveSubmissionPayload = useCallback(() => {
    saveBackup({
      coding: {
        currentCodingIndex: testResult.currentCodingIndex,

        answers: {
          [codeId]: {
            code: inputRef.current,
            language,
            lastSavedAt: Date.now(),
          },
        },
      },
    });
  }, [codeId, language, testResult.currentCodingIndex, saveBackup]);

  const debounce =
    (func, delay) =>
    (...args) => {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = setTimeout(() => func(...args), delay);
    };

  const debouncedSave = useCallback(debounce(saveSubmissionPayload, 1000), [
    saveSubmissionPayload,
  ]);
  useEffect(() => {
    if (codeId && input) debouncedSave();
  }, [input, language, codeId, debouncedSave]);
  useEffect(() => () => clearTimeout(autoSaveTimeoutRef.current), []);

  useEffect(() => {
    if (isMobile) {
      setShowTestCases(true);
      setTestCasesCollapsed(false);
    } else {
      setEditorWidth(60);
      setTestCasesCollapsed(false);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleOutputMouseMove);
      document.removeEventListener("mouseup", handleOutputMouseUp);
      document.body.classList.remove("resize-active");
      clearTimeout(resizeTimeoutRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    };
  }, [isMobile]);

  useEffect(() => {
    if (typeof ResizeObserver !== "undefined") {
      const cb = (entries) => {
        window.requestAnimationFrame(() => {
          if (!Array.isArray(entries) || !entries.length) return;
          if (editorRef.current) editorRef.current.layout();
        });
      };
      resizeObserverRef.current = new ResizeObserver(cb);
      const c = document.querySelector(".monaco-editor");
      if (c) resizeObserverRef.current.observe(c);
    }
    return () => {
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    };
  }, []);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (!isMobile) {
      e.preventDefault();
      isDraggingRef.current = true;
      document.body.classList.add("resize-active");
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
  };
  const handleMouseMove = useCallback((e) => {
    if (isDraggingRef.current && dividerRef.current) {
      const r = dividerRef.current.parentElement.getBoundingClientRect();
      setEditorWidth(
        Math.max(30, Math.min(80, ((e.clientX - r.left) / r.width) * 100)),
      );
    }
  }, []);
  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.body.classList.remove("resize-active");
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    if (editorRef.current) setTimeout(() => editorRef.current.layout(), 10);
  };

  const handleOutputMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.classList.add("resize-active");
    document.addEventListener("mousemove", handleOutputMouseMove);
    document.addEventListener("mouseup", handleOutputMouseUp);
  };
  const handleOutputMouseMove = useCallback((e) => {
    if (isDraggingRef.current && outputDividerRef.current) {
      const r = outputDividerRef.current.parentElement.getBoundingClientRect();
      setOutputHeight(
        Math.max(20, Math.min(50, ((r.bottom - e.clientY) / r.height) * 100)),
      );
    }
  }, []);
  const handleOutputMouseUp = () => {
    isDraggingRef.current = false;
    document.body.classList.remove("resize-active");
    document.removeEventListener("mousemove", handleOutputMouseMove);
    document.removeEventListener("mouseup", handleOutputMouseUp);
    if (editorRef.current) setTimeout(() => editorRef.current.layout(), 10);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme("custom-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "f3f4f6" },
        { token: "comment", foreground: "6b7280", fontStyle: "italic" },
        { token: "keyword", foreground: "93c5fd" },
        { token: "string", foreground: "86efac" },
        { token: "number", foreground: "fbbf24" },
      ],
      colors: {
        "editor.background": "#111827",
        "editor.foreground": "#f3f4f6",
        "editorLineNumber.foreground": "#6b7280",
        "editorLineNumber.activeForeground": "#f3f4f6",
        "editor.lineHighlightBackground": "#1f2937",
        "editorCursor.foreground": "#60a5fa",
        "editor.selectionBackground": "#374151",
      },
    });
    monaco.editor.defineTheme("custom-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "", foreground: "1f2937" },
        { token: "comment", foreground: "6b7280", fontStyle: "italic" },
        { token: "keyword", foreground: "2563eb" },
        { token: "string", foreground: "16a34a" },
        { token: "number", foreground: "d97706" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#1f2937",
        "editorLineNumber.foreground": "#9ca3af",
        "editorLineNumber.activeForeground": "#1f2937",
        "editor.lineHighlightBackground": "#f3f4f6",
        "editorCursor.foreground": "#0c83c8",
        "editor.selectionBackground": "#dbeafe",
      },
    });
    monaco.editor.setTheme("custom-light");
    if (isMobile) {
      const t = document.querySelector(".monaco-editor .inputarea");
      if (t) {
        t.style.fontSize = "16px";
        t.style.lineHeight = "normal";
      }
    }
  };

  // ── UI handlers ───────────────────────────────────────────────────────────
  // Theme is always light — no toggle needed.

  const toggleOutput = () => {
    if (outputMinimized) {
      setOutputMinimized(false);
      setShowOutput(true);
    } else setOutputMinimized(!outputMinimized);
  };
  const toggleTestCases = () => setTestCasesCollapsed(!testCasesCollapsed);
  const handleEditorChange = (value) => handleSetInput(value || "");

  const handleLanguageChange = (event) => {
    const nl = event.target.value;

    setLanguage(nl);

    handleSetInput(templates[nl]);

    if (editorRef.current && editorRef.current.getModel()) {
      window.monaco.editor.setModelLanguage(editorRef.current.getModel(), nl);
    }

    saveSubmissionPayload();
  };

  const resetEditor = () => setResetDialogOpen(true);
  const cancelResetEditor = () => setResetDialogOpen(false);
  const confirmResetEditor = () => {
    handleSetInput(templates[language] || "");
    // localStorage.removeItem(`code_${codeId}`);
    saveBackup({
      coding: {
        currentCodingIndex: testResult.currentCodingIndex,

        answers: {
          [codeId]: {
            code: inputRef.current,
            language,
            lastSavedAt: Date.now(),
          },
        },
      },
    });
    setSnackbarMessage("Editor reset to template");
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
    setResetDialogOpen(false);
  };

  const handleSave = () => {
    const f = testCases.map((tc) => ({
      input: Array.isArray(tc.testcase_input)
        ? tc.testcase_input.join("\n")
        : tc.testcase_input || "",
      expectedOutput: Array.isArray(tc.testcase_output)
        ? tc.testcase_output.join("\n")
        : tc.testcase_output || "",
    }));
    // localStorage.setItem(
    //   `code_${codeId}`,
    //   JSON.stringify({
    //     language: languageApiMap[language],
    //     code: input,
    //     testCases: f,
    //   }),
    // );
    saveBackup({
      coding: {
        currentCodingIndex: testResult.currentCodingIndex,

        answers: {
          [codeId]: {
            code: inputRef.current,
            language,
            lastSavedAt: Date.now(),
          },
        },
      },
    });
    setSnackbarMessage("Progress saved manually");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };

  const handleReEnterFullScreen = async () => {
    try {
      if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else if (document.documentElement.mozRequestFullScreen)
        await document.documentElement.mozRequestFullScreen();
      else if (document.documentElement.webkitRequestFullscreen)
        await document.documentElement.webkitRequestFullscreen();
      else if (document.documentElement.msRequestFullscreen)
        await document.documentElement.msRequestFullscreen();
      setFullScreenWarningOpen(false);
    } catch (err) {
      console.error("Failed to re-enter fullscreen:", err);
    }
  };

  // ── Fetch code and test cases ─────────────────────────────────────────────
  const fetchCodeAndTestCases = async (id) => {
    try {
      setLoading(true);
      const code = await fetchCodeById(id);
      setSelectedCode(code);
      if (!code.code_test_cases_id || code.code_test_cases_id.length === 0) {
        setTestCases([]);
        setSnackbarMessage("No test cases found for this problem.");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
        return;
      }
      const promises = code.code_test_cases_id.map(async (tid) => {
        try {
          return await fetchTestCaseById(tid);
        } catch (e) {
          return null;
        }
      });
      const responses = await Promise.all(promises);
      const valid = responses.filter(
        (tc) => tc && tc.testcase_input && tc.testcase_output,
      );
      setTestCases(
        valid.length ? valid : [{ testcase_input: "", testcase_output: "" }],
      );
      if (!valid.length) {
        setSnackbarMessage("No valid test cases retrieved.");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setTestCases([{ testcase_input: "", testcase_output: "" }]);
      setTerminalLines([
        { type: "error", text: `Error fetching problem: ${err.message}.` },
      ]);
      setShowOutput(true);
      setSnackbarMessage(`Error fetching problem: ${err.message}.`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codeId) {
      fetchCodeAndTestCases(codeId);
      setTerminalLines([]);
    } else {
      setTerminalLines([
        { type: "error", text: "Error: No code ID provided in URL" },
      ]);
      setShowOutput(true);
      setSnackbarMessage("No code ID provided in URL.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  }, [codeId]);

  // ── RUN button ────────────────────────────────────────────────────────────
  const handleRun = async (e) => {
    e.preventDefault();
    setRunLoading(true);
    setShowOutput(true);
    setOutputMinimized(false);
    const lines = [
      { type: "info", text: `$ Executing ${languageNames[language]} code...` },
    ];
    setTerminalLines([...lines]);
    try {
      const firstTc = testCases[0];
      const stdinInput = firstTc
        ? Array.isArray(firstTc.testcase_input)
          ? firstTc.testcase_input.join("\n")
          : firstTc.testcase_input || ""
        : "";
      const payload = {
        language: languageApiMap[language] || language,
        code: input,
        testCases: [{ input: stdinInput, expectedOutput: "__RUN_ONLY__" }],
      };
      const { results } = await compileCode(payload);
      if (!results || results.length === 0) {
        lines.push({
          type: "error",
          text: "No output received from compiler.",
        });
        setTerminalLines([...lines]);
        return;
      }
      const result = results[0];
      const { hasCompileError, hasRuntimeError, cleanOutput } =
        parseRunResponse(result);
      if (hasCompileError) {
        lines.push({
          type: "error",
          text: "╔══════════════════════════════════════╗",
        });
        lines.push({
          type: "error",
          text: "║          COMPILE ERROR               ║",
        });
        lines.push({
          type: "error",
          text: "╚══════════════════════════════════════╝",
        });
        cleanOutput
          .split("\n")
          .forEach((l) => lines.push({ type: "error", text: l }));
      } else if (hasRuntimeError) {
        lines.push({
          type: "warn",
          text: "╔══════════════════════════════════════╗",
        });
        lines.push({
          type: "warn",
          text: "║           RUNTIME ERROR              ║",
        });
        lines.push({
          type: "warn",
          text: "╚══════════════════════════════════════╝",
        });
        cleanOutput
          .split("\n")
          .forEach((l) => lines.push({ type: "warn", text: l }));
      } else {
        lines.push({
          type: "success",
          text: "✔  No syntax or runtime errors detected.",
        });
        if (cleanOutput) {
          lines.push({
            type: "plain",
            text: "──────────────── Output ────────────────",
          });
          cleanOutput
            .split("\n")
            .forEach((l) => lines.push({ type: "plain", text: l }));
          lines.push({
            type: "plain",
            text: "────────────────────────────────────────",
          });
        } else {
          lines.push({ type: "plain", text: "(Program produced no output)" });
        }
      }
      setTerminalLines([...lines]);
    } catch (error) {
      lines.push({ type: "error", text: `Execution failed: ${error.message}` });
      setTerminalLines([...lines]);
      setSnackbarMessage("Error running code.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setRunLoading(false);
    }
  };

  // ── RUN TEST CASES ────────────────────────────────────────────────────────
  const handleRunTestCases = async () => {
    if (testCases.length === 0) {
      setSnackbarMessage("No test cases available for this problem.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }
    setRunTestCasesLoading(true);
    setTestCaseResults([]);
    setTestCaseDialogOpen(true);
    try {
      const formattedTestCases = testCases.map((tc) => ({
        input: Array.isArray(tc.testcase_input)
          ? tc.testcase_input.join("\n")
          : tc.testcase_input || "",
        expectedOutput: Array.isArray(tc.testcase_output)
          ? tc.testcase_output.join("\n")
          : tc.testcase_output || "",
      }));
      const payload = {
        language: languageApiMap[language] || language,
        code: input,
        testCases: formattedTestCases,
      };
      const { results } = await compileCode(payload);
      const displayResults = results.map((res, idx) => {
        const { hasCompileError, hasRuntimeError, cleanOutput } =
          parseRunResponse(res);
        let status = "passed";
        let statusLabel = "Passed";
        if (hasCompileError) {
          status = "compile_error";
          statusLabel = "Compile Error";
        } else if (hasRuntimeError) {
          status = "runtime_error";
          statusLabel = "Runtime Error";
        } else if (!res.passed) {
          status = "failed";
          statusLabel = "Failed";
        }
        return {
          index: idx + 1,
          passed: res.passed,
          status,
          statusLabel,
          input: res.input,
          expectedOutput: res.expectedOutput,
          actualOutput: cleanOutput,
          isHidden: idx >= 3,
        };
      });
      setTestCaseResults(displayResults);
      const passedCount = displayResults.filter(
        (r) => r.status === "passed",
      ).length;
      setTerminalLines([
        { type: "info", text: `$ Ran ${results.length} test case(s)...` },
        {
          type: passedCount === results.length ? "success" : "warn",
          text: `Result: ${passedCount}/${results.length} test cases passed.`,
        },
      ]);
      setShowOutput(true);
      setOutputMinimized(false);
      const totalTestcases = results.length;
      const passedNow = displayResults.filter(
        (r) => r.status === "passed",
      ).length;
      const perTestcaseMark = totalTestcases > 0 ? 10 / totalTestcases : 0;
      const codingScore = Math.round(passedNow * perTestcaseMark * 100) / 100;
      const newCodingResult = {
        codeId,
        score: codingScore,
        total: 10,
        testcasesPassed: passedNow,
        totalTestcases,
      };
      let currentTestResult = testResult;
      try {
        // const stored = localStorage.getItem("test_result");
        // if (stored) currentTestResult = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
      currentTestResult.codingResults = currentTestResult.codingResults || [];
      const existingIndex = currentTestResult.codingResults.findIndex(
        (r) => r.codeId === codeId,
      );
      let updatedCodingResults = [...currentTestResult.codingResults];
      if (existingIndex !== -1)
        updatedCodingResults[existingIndex] = newCodingResult;
      else updatedCodingResults.push(newCodingResult);
      const effectiveCodingIds =
        fetchedTestCodingIds.length > 0
          ? fetchedTestCodingIds
          : currentTestResult.codingIds || [];
      const updatedTestResult = {
        ...currentTestResult,
        codingResults: updatedCodingResults,
        result_user_id: userId || currentTestResult.result_user_id || "",
        result_test_id: testId || currentTestResult.result_test_id || "",
        result_score:
          (currentTestResult.mcqCorrect || 0) +
          updatedCodingResults.reduce((sum, r) => sum + r.score, 0),
        result_total_score:
          currentTestResult.result_total_score ||
          effectiveCodingIds.length * 10,
        result_poc_id: pocId || currentTestResult.result_poc_id || "",
        codingAnswered: updatedCodingResults.length,
        codingNotAnswered:
          effectiveCodingIds.length - updatedCodingResults.length,
        codingNotVisited: Math.max(
          0,
          effectiveCodingIds.length - updatedCodingResults.length,
        ),
        codingCorrect: updatedCodingResults.filter((r) => r.score > 0).length,
        codingWrong: updatedCodingResults.filter((r) => r.score === 0).length,
        studentName: studentName || currentTestResult.studentName || "",
      };
      // localStorage.setItem("test_result", JSON.stringify(updatedTestResult));
      saveBackup({
        result: updatedTestResult,
      });

      // localStorage.setItem(
      //   `code_${codeId}`,
      //   JSON.stringify({
      //     language: languageApiMap[language],
      //     code: input,
      //     testCases: formattedTestCases,
      //   }),
      // );
      saveBackup({
        coding: {
          currentCodingIndex: testResult.currentCodingIndex,

          answers: {
            [codeId]: {
              code: inputRef.current,
              language,
              lastSavedAt: Date.now(),
            },
          },
        },
      });
    } catch (error) {
      console.error("Run test cases error:", error);
      setTestCaseResults([]);
      setSnackbarMessage(`Error running test cases: ${error.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setTestCaseDialogOpen(false);
    } finally {
      setRunTestCasesLoading(false);
    }
  };

  // ── compileAndEvaluate ────────────────────────────────────────────────────
  const compileAndEvaluate = async (
    currentCodeId,
    codeInput,
    codeLanguage,
    codeTestCases,
  ) => {
    setShowOutput(true);
    setOutputMinimized(false);
    setLoading(true);
    setOpenProgressDialog(true);
    setTerminalLines([
      { type: "info", text: "Running code against test cases..." },
    ]);
    try {
      const formattedTestCases = codeTestCases
        .filter(
          (tc) => tc?.testcase_input != null && tc?.testcase_output != null,
        )
        .map((tc) => ({
          input: Array.isArray(tc.testcase_input)
            ? tc.testcase_input.join("\n")
            : tc.testcase_input || "",
          expectedOutput: Array.isArray(tc.testcase_output)
            ? tc.testcase_output.join("\n")
            : tc.testcase_output || "",
        }));
      if (!formattedTestCases.length)
        formattedTestCases.push({ input: "", expectedOutput: "" });
      const payload = {
        language: languageApiMap[codeLanguage] || codeLanguage,
        code: codeInput || templates[codeLanguage] || "",
        testCases: formattedTestCases,
      };
      localStorage.setItem(`code_${currentCodeId}`, JSON.stringify(payload));
      const { results } = await compileCode(payload);
      const lines = [];
      results.forEach((res, i) => {
        const { hasCompileError, hasRuntimeError } = parseRunResponse(res);
        const trulyPassed = res.passed && !hasCompileError && !hasRuntimeError;
        const statusLabel = hasCompileError
          ? "⚠️ Compile Error"
          : hasRuntimeError
            ? "⚠️ Runtime Error"
            : trulyPassed
              ? "✅ Passed"
              : "❌ Failed";
        const lineType = trulyPassed
          ? "success"
          : hasRuntimeError
            ? "warn"
            : "error";
        if (i < 3) {
          lines.push({ type: "info", text: `Test Case #${i + 1}:` });
          lines.push({ type: "plain", text: `  Input:    ${res.input}` });
          lines.push({
            type: "plain",
            text: `  Expected: ${res.expectedOutput}`,
          });
          lines.push({
            type: "plain",
            text: `  Actual:   ${res.actualOutput}`,
          });
          lines.push({ type: lineType, text: `  Status:   ${statusLabel}` });
        } else {
          lines.push({
            type: lineType,
            text: `Hidden Test Case #${i + 1}: ${statusLabel}`,
          });
        }
      });
      setTerminalLines(lines);
      const classifiedResults = results.map((res) => {
        const { hasCompileError, hasRuntimeError } = parseRunResponse(res);
        const trulyPassed = res.passed && !hasCompileError && !hasRuntimeError;
        return { ...res, trulyPassed };
      });
      const totalTestcases = classifiedResults.length;
      const passedNow = classifiedResults.filter((r) => r.trulyPassed).length;
      const perTestcaseMark = totalTestcases > 0 ? 10 / totalTestcases : 0;
      const codingScore = Math.round(passedNow * perTestcaseMark * 100) / 100;
      const newCodingResult = {
        codeId: currentCodeId,
        score: codingScore,
        total: 10,
        testcasesPassed: passedNow,
        totalTestcases,
      };
      let currentTestResult = testResult;
      try {
        // const stored = localStorage.getItem("test_result");
        // if (stored) currentTestResult = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
      currentTestResult.codingResults = currentTestResult.codingResults || [];
      const existingIndex = currentTestResult.codingResults.findIndex(
        (r) => r.codeId === currentCodeId,
      );
      let updatedCodingResults = [...currentTestResult.codingResults];
      if (existingIndex !== -1)
        updatedCodingResults[existingIndex] = newCodingResult;
      else updatedCodingResults.push(newCodingResult);
      const effectiveCodingIds =
        fetchedTestCodingIds.length > 0
          ? fetchedTestCodingIds
          : currentTestResult.codingIds || [];
      const updatedTestResult = {
        ...currentTestResult,
        codingResults: updatedCodingResults,
        result_user_id: userId || currentTestResult.result_user_id || "",
        result_test_id: testId || currentTestResult.result_test_id || "",
        result_score:
          (currentTestResult.mcqCorrect || 0) +
          updatedCodingResults.reduce((sum, r) => sum + r.score, 0),
        result_total_score:
          currentTestResult.result_total_score ||
          effectiveCodingIds.length * 10,
        result_poc_id: pocId || currentTestResult.result_poc_id || "",
        codingAnswered: updatedCodingResults.length,
        codingNotAnswered:
          effectiveCodingIds.length - updatedCodingResults.length,
        codingNotVisited: Math.max(
          0,
          effectiveCodingIds.length - updatedCodingResults.length,
        ),
        codingCorrect: updatedCodingResults.filter((r) => r.score > 0).length,
        codingWrong: updatedCodingResults.filter((r) => r.score === 0).length,
        studentName: studentName || currentTestResult.studentName || "",
      };
      // localStorage.setItem("test_result", JSON.stringify(updatedTestResult));
      saveBackup({
        result: updatedTestResult,
      });
      setSnackbarMessage("Code compiled and evaluated successfully!");
      setSnackbarSeverity("success");
      return { success: true, testResult: updatedTestResult };
    } catch (error) {
      console.error("Compile error:", error);
      setTerminalLines([
        { type: "error", text: `Error running code: ${error.message}` },
      ]);
      setSnackbarMessage("Error during code compilation.");
      setSnackbarSeverity("warning");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
      setOpenProgressDialog(false);
      setSnackbarOpen(true);
    }
  };

  const compileAllPrograms = async () => {
    const effectiveCodingIds =
      fetchedTestCodingIds.length > 0
        ? fetchedTestCodingIds
        : testResult.codingIds || [];

    setLoading(true);
    setOpenProgressDialog(true);

    setTerminalLines([
      {
        type: "info",
        text: "Processing results...\nCompiling all programs...",
      },
    ]);

    let compilationErrors = 0;
    // Collect coding results directly from each compile call —
    // do NOT read back from React state (which is stale during async loop)
    let collectedCodingResults = [];

    try {
      for (const [index, id] of effectiveCodingIds.entries()) {
        setTerminalLines((prev) => [
          ...prev,
          {
            type: "info",
            text: `📝 Processing program ${index + 1}/${effectiveCodingIds.length} (ID: ${id})...`,
          },
        ]);

        let codeInput = templates[language] || "";

        let codeLanguage = language;

        let codeTestCases = [
          {
            testcase_input: "",
            testcase_output: "",
          },
        ];

        // ─────────────────────────────────────
        // LOAD FROM INDEXEDDB
        // ─────────────────────────────────────

        const backup = await loadBackup();

        const savedPayload = backup?.coding?.answers?.[id];

        if (savedPayload) {
          try {
            codeInput = savedPayload.code || templates[language] || "";

            codeLanguage = savedPayload.language || language;

            setTerminalLines((prev) => [
              ...prev,
              {
                type: "success",
                text: `   ✅ Using saved code (${codeInput.length} chars)`,
              },
            ]);
          } catch (e) {
            console.error(e);

            setTerminalLines((prev) => [
              ...prev,
              {
                type: "warn",
                text: "   ⚠️ Error reading saved code",
              },
            ]);
          }
        } else {
          setTerminalLines((prev) => [
            ...prev,
            {
              type: "warn",
              text: "   ⚠️ No saved code found, using default template",
            },
          ]);
        }

        // ─────────────────────────────────────
        // FETCH TEST CASES
        // ─────────────────────────────────────

        try {
          const code = await fetchCodeById(id);

          if (code?.code_test_cases_id?.length > 0) {
            const tcPromises = code.code_test_cases_id.map(async (tid) => {
              try {
                const tc = await fetchTestCaseById(tid);

                return tc?.testcase_input && tc?.testcase_output ? tc : null;
              } catch (e) {
                return null;
              }
            });

            const responses = await Promise.all(tcPromises);

            codeTestCases = responses.filter((tc) => tc !== null);

            setTerminalLines((prev) => [
              ...prev,
              {
                type: "info",
                text: `   📋 Found ${codeTestCases.length} test cases`,
              },
            ]);
          } else {
            setTerminalLines((prev) => [
              ...prev,
              {
                type: "warn",
                text: "   ⚠️ No test cases found",
              },
            ]);
          }
        } catch (e) {
          console.error(e);

          setTerminalLines((prev) => [
            ...prev,
            {
              type: "warn",
              text: "   ⚠️ Error fetching test cases",
            },
          ]);
        }

        // ─────────────────────────────────────
        // COMPILE
        // ─────────────────────────────────────

        setTerminalLines((prev) => [
          ...prev,
          {
            type: "info",
            text: "   ⚙️ Compiling...",
          },
        ]);

        const result = await compileAndEvaluate(
          id,
          codeInput,
          codeLanguage,
          codeTestCases,
        );

        if (!result.success) {
          compilationErrors++;

          setTerminalLines((prev) => [
            ...prev,
            {
              type: "error",
              text: `   ❌ Failed: ${result.error}`,
            },
          ]);
        } else {
          // Collect the coding result returned by compileAndEvaluate
          // (this avoids relying on stale React state)
          const compiledCodingResults =
            result.testResult?.codingResults || [];
          const thisResult = compiledCodingResults.find(
            (r) => r.codeId === id,
          );
          if (thisResult) {
            // Upsert into collectedCodingResults
            const existingIdx = collectedCodingResults.findIndex(
              (r) => r.codeId === id,
            );
            if (existingIdx !== -1) {
              collectedCodingResults[existingIdx] = thisResult;
            } else {
              collectedCodingResults.push(thisResult);
            }
          }

          setTerminalLines((prev) => [
            ...prev,
            {
              type: "success",
              text: "   ✅ Success",
            },
          ]);
        }
      }

      // ─────────────────────────────────────
      // FINALIZE
      // ─────────────────────────────────────

      setTerminalLines((prev) => [
        ...prev,
        {
          type: "info",
          text: "🔄 Finalizing...",
        },
      ]);

      // Start from the current testResult snapshot for MCQ data etc,
      // but use collectedCodingResults (fresh from compile loop) for coding
      let finalTestResult = {
        ...testResult,
        codingResults: [...collectedCodingResults],
      };

      // ─────────────────────────────────────
      // HANDLE PROGRAMS NOT YET COMPILED
      // (not in collectedCodingResults)
      // ─────────────────────────────────────

      const missingIds = effectiveCodingIds.filter(
        (id) => !finalTestResult.codingResults.some((r) => r.codeId === id),
      );

      for (const mid of missingIds) {
        const backup = await loadBackup();

        const savedCode = backup?.coding?.answers?.[mid];

        let score = 0;

        if (
          savedCode?.code &&
          savedCode.code !== templates[savedCode.language] &&
          savedCode.code.trim().length >
            (templates[savedCode.language]?.length || 0)
        ) {
          score = 5;
        }

        finalTestResult.codingResults.push({
          codeId: mid,
          score,
          total: 10,
          testcasesPassed: 0,
          totalTestcases: 0,
        });
      }

      // ─────────────────────────────────────
      // UPDATE RESULT STATS
      // ─────────────────────────────────────

      finalTestResult.codingAnswered = finalTestResult.codingResults.length;

      finalTestResult.codingCorrect = finalTestResult.codingResults.filter(
        (r) => r.score > 0,
      ).length;

      finalTestResult.codingWrong = finalTestResult.codingResults.filter(
        (r) => r.score === 0,
      ).length;

      finalTestResult.codingNotAnswered = Math.max(
        0,
        effectiveCodingIds.length - finalTestResult.codingAnswered,
      );

      finalTestResult.codingNotVisited = Math.max(
        0,
        effectiveCodingIds.length - finalTestResult.codingAnswered,
      );

      finalTestResult.result_score =
        (finalTestResult.mcqCorrect || 0) +
        finalTestResult.codingResults.reduce((sum, r) => sum + r.score, 0);

      setTestResult(finalTestResult);

      // ─────────────────────────────────────
      // SAVE TO INDEXEDDB
      // ─────────────────────────────────────

      saveBackup({
        result: finalTestResult,
      });

      // ─────────────────────────────────────
      // TERMINAL
      // ─────────────────────────────────────

      setTerminalLines((prev) => [
        ...prev,

        {
          type: "success",
          text: `✅ Done — ${compilationErrors} error(s)`,
        },

        {
          type: "info",
          text: `📈 ${finalTestResult.codingResults.length}/${effectiveCodingIds.length} programs processed`,
        },

        {
          type: "success",
          text: `🏆 Score: ${finalTestResult.result_score}/${finalTestResult.result_total_score}`,
        },
      ]);

      setSnackbarMessage(
        `Compilation completed. ${finalTestResult.codingResults.length}/${effectiveCodingIds.length} processed.`,
      );

      setSnackbarSeverity(compilationErrors > 0 ? "warning" : "success");

      const compilationReturn = {
        success: true,
        errors: compilationErrors,
        finalResult: finalTestResult,
      };
      // Store in ref so confirmFinalSubmit can access the latest compiled result
      // even though React state update (setTestResult) is async
      compiledResultRef.current = compilationReturn;
      return compilationReturn;
    } catch (error) {
      console.error(error);

      setTerminalLines((prev) => [
        ...prev,
        {
          type: "error",
          text: `❌ Error: ${error.message}`,
        },
      ]);

      setSnackbarMessage("Error compiling all programs.");

      setSnackbarSeverity("error");

      return {
        success: false,
        error: error.message,
      };
    } finally {
      setLoading(false);

      setOpenProgressDialog(false);

      setSnackbarOpen(true);
    }
  };

  const handleFinalSubmit = async (isMalpractice = false) => {
    if (hasSubmitted) return;
    setLoading(true);
    setOpenProgressDialog(true);
    setTerminalLines([
      { type: "info", text: "🚀 Starting final submission process..." },
    ]);
    try {
      setTerminalLines((prev) => [
        ...prev,
        { type: "info", text: "📝 Step 1: Compiling all programs..." },
      ]);
      const compilationResult = await compileAllPrograms();
      if (!compilationResult.success)
        throw new Error(`Compilation failed: ${compilationResult.error}`);
      if (!isMalpractice) {
        setSubmitConfirmDialogOpen(true);
        setLoading(false);
        setOpenProgressDialog(false);
        return;
      }
      setTerminalLines((prev) => [
        ...prev,
        { type: "info", text: "📤 Step 2: Preparing submission..." },
      ]);
      let finalTestResult = compilationResult.finalResult;
      try {
        // const stored = localStorage.getItem("test_result");
        // if (stored) finalTestResult = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
      const codingResults_f = finalTestResult.codingResults || [];
      const totalCodingScore_f = codingResults_f.reduce(
        (sum, r) => sum + (r.score || 0),
        0,
      );
      const totalTestcasesPassed_f = codingResults_f.reduce(
        (sum, r) => sum + (r.testcasesPassed || 0),
        0,
      );
      const resultData = {
        result_user_id: finalTestResult.result_user_id || userId || "",
        result_test_id: finalTestResult.result_test_id || testId || "",
        result_poc_id: finalTestResult.result_poc_id || pocId || "",
        result_score: finalTestResult.result_score || 0,
        result_total_score: finalTestResult.result_total_score || 0,
        result_mcq_score: finalTestResult.mcqCorrect || 0,
        result_coding_score: {
          score: totalCodingScore_f,
          testcases_passed: totalTestcasesPassed_f,
        },
        codingAnswered: finalTestResult.codingAnswered || 0,
        codingCorrect: finalTestResult.codingCorrect || 0,
        codingIds: finalTestResult.codingIds || [],
        codingNotAnswered: finalTestResult.codingNotAnswered || 0,
        codingNotVisited: finalTestResult.codingNotVisited || 0,
        codingWrong: finalTestResult.codingWrong || 0,
        marked: finalTestResult.marked || 0,
        mcqAnswered: finalTestResult.mcqAnswered || 0,
        mcqCorrect: finalTestResult.mcqCorrect || 0,
        mcqNotAnswered: finalTestResult.mcqNotAnswered || 0,
        mcqNotVisited: finalTestResult.mcqNotVisited || 0,
        mcqWrong: finalTestResult.mcqWrong || 0,
        studentName: finalTestResult.studentName || studentName || "",
        testLanguage: finalTestResult.testLanguage || "",
        testName: finalTestResult.testName || "",
        codingResults: codingResults_f,
      };
      setTerminalLines((prev) => [
        ...prev,
        { type: "info", text: "🚀 Step 3: Submitting..." },
      ]);
      await submitTestResult(resultData);
      const effectiveCodingIds =
        fetchedTestCodingIds.length > 0
          ? fetchedTestCodingIds
          : testResult.codingIds || [];
      effectiveCodingIds.forEach((id) => {
        try {
          localStorage.removeItem(`code_${id}`);
        } catch (e) {
          console.error(e);
        }
      });
      // localStorage.removeItem("fs_exit_count");
      // localStorage.removeItem("window_switch_count");
      await clearBackup();
      setHasSubmitted(true);
      setTerminalLines((prev) => [
        ...prev,
        { type: "success", text: "🎉 Test submitted successfully!" },
      ]);
      setSnackbarMessage("Test submitted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      navigate("/test-result", { state: { resultData } });
    } catch (error) {
      console.error(error);
      setTerminalLines((prev) => [
        ...prev,
        { type: "error", text: `💥 Error: ${error.message}` },
      ]);
      setSnackbarMessage(`Error during test submission: ${error.message}`);
      setSnackbarSeverity("error");
    } finally {
      setLoading(false);
      setOpenProgressDialog(false);
      setSnackbarOpen(true);
    }
  };

  const confirmFinalSubmit = async () => {
    setSubmitConfirmDialogOpen(false);
    setLoading(true);
    setOpenProgressDialog(true);
    setTerminalLines([
      { type: "info", text: "Submitting test for final evaluation..." },
    ]);
    try {
      // Use the freshly compiled result (stored in ref) rather than stale React state
      const latestResult =
        compiledResultRef.current?.finalResult || testResult;
      const codingResults_c = latestResult.codingResults || [];
      const totalCodingScore_c = codingResults_c.reduce(
        (sum, r) => sum + (r.score || 0),
        0,
      );
      const totalTestcasesPassed_c = codingResults_c.reduce(
        (sum, r) => sum + (r.testcasesPassed || 0),
        0,
      );
      const resultData = {
        result_user_id: latestResult.result_user_id || userId || "",
        result_test_id: latestResult.result_test_id || testId || "",
        result_poc_id: latestResult.result_poc_id || pocId || "",
        result_score: latestResult.result_score || 0,
        result_total_score: latestResult.result_total_score || 0,
        result_mcq_score: latestResult.mcqCorrect || 0,
        result_coding_score: {
          score: totalCodingScore_c,
          testcases_passed: totalTestcasesPassed_c,
        },
        codingAnswered: latestResult.codingAnswered || 0,
        codingCorrect: latestResult.codingCorrect || 0,
        codingIds: latestResult.codingIds || [],
        codingNotAnswered: latestResult.codingNotAnswered || 0,
        codingNotVisited: latestResult.codingNotVisited || 0,
        codingWrong: latestResult.codingWrong || 0,
        marked: latestResult.marked || 0,
        mcqAnswered: latestResult.mcqAnswered || 0,
        mcqCorrect: latestResult.mcqCorrect || 0,
        mcqNotAnswered: latestResult.mcqNotAnswered || 0,
        mcqNotVisited: latestResult.mcqNotVisited || 0,
        mcqWrong: latestResult.mcqWrong || 0,
        studentName: latestResult.studentName || studentName || "",
        testLanguage: latestResult.testLanguage || "",
        testName: latestResult.testName || "",
        codingResults: codingResults_c,
      };
      await submitTestResult(resultData);
      const effectiveCodingIds =
        fetchedTestCodingIds.length > 0
          ? fetchedTestCodingIds
          : latestResult.codingIds;
      effectiveCodingIds.forEach((id) => localStorage.removeItem(`code_${id}`));
      localStorage.removeItem("fs_exit_count");
      localStorage.removeItem("window_switch_count");
      await clearBackup();
      setHasSubmitted(true);
      setTerminalLines((prev) => [
        ...prev,
        { type: "success", text: "Test submitted successfully!" },
      ]);
      setSnackbarMessage("Test submitted successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      navigate("/test-result", { state: { resultData } });
    } catch (error) {
      console.error(error);
      setTerminalLines((prev) => [
        ...prev,
        { type: "error", text: `Error: ${error.message}` },
      ]);
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setOpenProgressDialog(false);
    }
  };

  const cancelFinalSubmit = () => {
    setSubmitConfirmDialogOpen(false);
    setSnackbarMessage("Submission cancelled.");
    setSnackbarSeverity("info");
    setSnackbarOpen(true);
  };

  const handlePrevious = async () => {
    saveSubmissionPayload();
    const effectiveCodingIds =
      fetchedTestCodingIds.length > 0
        ? fetchedTestCodingIds
        : testResult.codingIds;
    if (testResult.currentCodingIndex > 0) {
      const prevCodeId = effectiveCodingIds[testResult.currentCodingIndex - 1];
      setTestResult((prev) => {
        const u = { ...prev, currentCodingIndex: prev.currentCodingIndex - 1 };
        saveBackup({
          coding: {
            currentCodingIndex: prev.currentCodingIndex - 1,
          },
        });
        // localStorage.setItem("test_result", JSON.stringify(u));
        return u;
      });
      isNavigatingRef.current = true;
      navigate(`/coding/${prevCodeId}`, {
        state: {
          ...testResult,
          currentCodingIndex: testResult.currentCodingIndex - 1,
        },
      });
      window.history.pushState(null, null, window.location.href);
      setSnackbarMessage("Moved to previous program.");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
    }
  };

  const handleNext = async () => {
    saveSubmissionPayload();
    const effectiveCodingIds =
      fetchedTestCodingIds.length > 0
        ? fetchedTestCodingIds
        : testResult.codingIds;
    if (testResult.currentCodingIndex < effectiveCodingIds.length - 1) {
      const nextCodeId = effectiveCodingIds[testResult.currentCodingIndex + 1];
      setTestResult((prev) => {
        const u = { ...prev, currentCodingIndex: prev.currentCodingIndex + 1 };
        // localStorage.setItem("test_result", JSON.stringify(u));
        saveBackup({
          coding: {
            currentCodingIndex: prev.currentCodingIndex + 1,
          },
        });
        return u;
      });
      isNavigatingRef.current = true;
      navigate(`/coding/${nextCodeId}`, {
        state: {
          ...testResult,
          currentCodingIndex: testResult.currentCodingIndex + 1,
        },
      });
      window.history.pushState(null, null, window.location.href);
      setSnackbarMessage("Moved to next program.");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
    }
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)
      .toString()
      .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const effectiveCodingIds =
    fetchedTestCodingIds.length > 0
      ? fetchedTestCodingIds
      : testResult.codingIds;
  const isFirstProgram = testResult.currentCodingIndex === 0;
  const isLastProgram =
    testResult.currentCodingIndex >= effectiveCodingIds.length - 1;
  const visibleTestCases = testCases.slice(0, 3);
  const hiddenTestCasesCount = testCases.length - 3;
  const fsWarningsRemaining = MAX_FULLSCREEN_WARNINGS - fullScreenExitCount;
  const wsWarningsRemaining = MAX_WINDOW_SWITCH_WARNINGS - windowSwitchCount;

  const difficultyChipClass = (d) =>
    d === "Easy"
      ? "cp-chip-easy"
      : d === "Hard"
        ? "cp-chip-hard"
        : "cp-chip-medium";

  const statusColour = (status) => {
    if (status === "passed") return { color: "#16a34a", bg: "#f0fdf4" };
    if (status === "compile_error") return { color: "#dc2626", bg: "#fff1f2" };
    if (status === "runtime_error") return { color: "#d97706", bg: "#fffbeb" };
    return { color: "#dc2626", bg: "#fff1f2" };
  };

  // ── Dynamic styles driven by mode ─────────────────────────────────────────
  // NOTE: surfaceBg is used as inline style to OVERRIDE the CSS class .cp-toolbar
  // which uses var(--bg-surface). The inline style must win — we use !important
  // via a data attribute trick in the CSS (see CodePage.css .cp-toolbar[data-mode]).
  const surfaceBg = "#ffffff";
  const pageBg = "#f9fafb";
  const borderColor = "rgba(0,0,0,0.08)";
  const textPrimary = "#1f2937";
  const textMuted = "#6b7280";
  const codeBg = "#f3f4f6";

  // Timer colour: red when < 5 min, yellow when < 10 min
  const timerColor =
    timer < 300 ? "#ef4444" : timer < 600 ? "#f59e0b" : "#059669";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div data-theme="light">
      <ThemeProvider theme={theme}>
        <CssBaseline />

        {/* ── Progress dialog ──────────────────────────────────────── */}
        <Dialog open={openProgressDialog}>
          <DialogContent
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 4,
              bgcolor: surfaceBg,
            }}
          >
            <CircularProgress sx={{ color: "#0c83c8" }} />
            <Typography
              variant="h6"
              sx={{ color: textPrimary, fontFamily: "Inter, sans-serif" }}
            >
              Processing your code...
            </Typography>
          </DialogContent>
        </Dialog>

        {/* ── Fullscreen warning dialog ─────────────────────────────── */}
        <Dialog open={fullScreenWarningOpen} disableEscapeKeyDown>
          <DialogContent sx={{ p: 3, bgcolor: surfaceBg, minWidth: 360 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <WarningAmberIcon sx={{ color: "#f59e0b", fontSize: 32 }} />
              <Typography
                variant="h6"
                sx={{
                  color: textPrimary,
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                }}
              >
                Fullscreen Exited — Warning {fullScreenExitCount} of{" "}
                {MAX_FULLSCREEN_WARNINGS}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{ color: textMuted, fontFamily: "Inter, sans-serif", mb: 1 }}
            >
              You have exited fullscreen mode. This is warning{" "}
              <strong style={{ color: textPrimary }}>
                {fullScreenExitCount}
              </strong>{" "}
              of{" "}
              <strong style={{ color: textPrimary }}>
                {MAX_FULLSCREEN_WARNINGS}
              </strong>
              .
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#ef4444", fontWeight: 600, mb: 1 }}
            >
              {fsWarningsRemaining > 0
                ? `You have ${fsWarningsRemaining} warning${fsWarningsRemaining !== 1 ? "s" : ""} remaining before the test is automatically submitted.`
                : "This is your final warning. The test will be submitted on next exit."}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: textMuted, fontFamily: "Inter, sans-serif" }}
            >
              Please return to fullscreen mode immediately to continue the test.
            </Typography>
          </DialogContent>
          <DialogActions
            sx={{
              p: 2,
              bgcolor: surfaceBg,
              borderTop: `1px solid ${borderColor}`,
            }}
          >
            <Button
              onClick={handleReEnterFullScreen}
              variant="contained"
              sx={{
                background: "#f59e0b",
                "&:hover": { background: "#d97706" },
                fontFamily: "Inter, sans-serif",
              }}
            >
              Return to Fullscreen
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Window-switch warning dialog ──────────────────────────── */}
        <Dialog open={windowSwitchWarningOpen} disableEscapeKeyDown>
          <DialogContent sx={{ p: 3, bgcolor: surfaceBg, minWidth: 360 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <WarningAmberIcon sx={{ color: "#f59e0b", fontSize: 32 }} />
              <Typography
                variant="h6"
                sx={{
                  color: textPrimary,
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                }}
              >
                Window Switch Detected — Warning {windowSwitchCount} of{" "}
                {MAX_WINDOW_SWITCH_WARNINGS}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{ color: textMuted, fontFamily: "Inter, sans-serif", mb: 1 }}
            >
              You switched away from the test window. This is warning{" "}
              <strong style={{ color: textPrimary }}>
                {windowSwitchCount}
              </strong>{" "}
              of{" "}
              <strong style={{ color: textPrimary }}>
                {MAX_WINDOW_SWITCH_WARNINGS}
              </strong>
              .
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#ef4444", fontWeight: 600, mb: 1 }}
            >
              {wsWarningsRemaining > 0
                ? `You have ${wsWarningsRemaining} warning${wsWarningsRemaining !== 1 ? "s" : ""} remaining before the test is automatically submitted.`
                : "This is your final warning. The test will be submitted on the next window switch."}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: textMuted, fontFamily: "Inter, sans-serif" }}
            >
              Please stay on the test window and do not switch to other
              applications.
            </Typography>
          </DialogContent>
          <DialogActions
            sx={{
              p: 2,
              bgcolor: surfaceBg,
              borderTop: `1px solid ${borderColor}`,
            }}
          >
            <Button
              onClick={() => setWindowSwitchWarningOpen(false)}
              variant="contained"
              sx={{
                background: "#f59e0b",
                "&:hover": { background: "#d97706" },
                fontFamily: "Inter, sans-serif",
              }}
            >
              I Understand, Continue Test
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Submit confirm dialog ─────────────────────────────────── */}
        <Dialog open={submitConfirmDialogOpen}>
          <DialogContent sx={{ p: 3, bgcolor: surfaceBg, minWidth: 320 }}>
            <Typography
              variant="h6"
              sx={{
                color: textPrimary,
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                mb: 1,
              }}
            >
              Are you sure you want to submit the test?
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: textMuted, fontFamily: "Inter, sans-serif" }}
            >
              This action will finalize your test and you won't be able to make
              further changes.
            </Typography>
          </DialogContent>
          <DialogActions
            sx={{
              p: 2,
              bgcolor: surfaceBg,
              borderTop: `1px solid ${borderColor}`,
            }}
          >
            <Button
              onClick={cancelFinalSubmit}
              variant="outlined"
              sx={{ fontFamily: "Inter, sans-serif" }}
            >
              Continue Coding
            </Button>
            <Button
              onClick={confirmFinalSubmit}
              variant="contained"
              color="error"
              sx={{ fontFamily: "Inter, sans-serif" }}
            >
              Submit Test
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Instructions dialog ───────────────────────────────────── */}
        <Dialog
          open={instructionsOpen}
          onClose={() => setInstructionsOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogContent sx={{ p: 3, bgcolor: surfaceBg }}>
            <Typography
              variant="h6"
              sx={{
                color: textPrimary,
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                mb: 1.5,
              }}
            >
              Test Instructions
            </Typography>
            <List sx={{ p: 0 }}>
              {defaultInstructions.map((ins, i) => (
                <ListItem
                  key={i}
                  disablePadding
                  sx={{ mb: 0.5, alignItems: "flex-start" }}
                >
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "rgba(12,131,200,0.15)",
                      color: "#0c83c8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      flexShrink: 0,
                      mt: 0.2,
                      mr: 1,
                    }}
                  >
                    {i + 1}
                  </Box>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          color: textMuted,
                          fontFamily: "Inter, sans-serif",
                          lineHeight: 1.6,
                        }}
                      >
                        {ins}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions
            sx={{
              p: 2,
              bgcolor: surfaceBg,
              borderTop: `1px solid ${borderColor}`,
            }}
          >
            <Button
              onClick={() => setInstructionsOpen(false)}
              variant="contained"
              color="primary"
              sx={{ fontFamily: "Inter, sans-serif" }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Run Test Cases result dialog ──────────────────────────── */}
        <Dialog
          open={testCaseDialogOpen}
          onClose={() => !runTestCasesLoading && setTestCaseDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle
            sx={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1,
              pb: 1,
              bgcolor: surfaceBg,
              color: textPrimary,
            }}
          >
            <BugReportIcon sx={{ color: "#0c83c8" }} />
            Test Case Results
            {!runTestCasesLoading && testCaseResults.length > 0 && (
              <Chip
                label={`${testCaseResults.filter((r) => r.passed).length} / ${testCaseResults.length} Passed`}
                size="small"
                sx={{
                  ml: 1,
                  background: testCaseResults.every((r) => r.passed)
                    ? "#22c55e"
                    : "#ef4444",
                  color: "#fff",
                  fontWeight: 700,
                }}
              />
            )}
          </DialogTitle>
          <DialogContent
            sx={{
              p: 0,
              maxHeight: "65vh",
              overflowY: "auto",
              bgcolor: surfaceBg,
            }}
          >
            {runTestCasesLoading ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 4,
                  justifyContent: "center",
                }}
              >
                <CircularProgress size={26} sx={{ color: "#0c83c8" }} />
                <Typography
                  variant="body1"
                  sx={{ fontFamily: "Inter, sans-serif", color: textPrimary }}
                >
                  Running all test cases...
                </Typography>
              </Box>
            ) : testCaseResults.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: textMuted }}>
                  No results available.
                </Typography>
              </Box>
            ) : (
              <TableContainer
                component={Paper}
                sx={{ boxShadow: "none", borderRadius: 0, bgcolor: surfaceBg }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "#f1f5f9" }}>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          fontFamily: "Inter, sans-serif",
                          width: 130,
                          color: textPrimary,
                        }}
                      >
                        Test Case
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          fontFamily: "Inter, sans-serif",
                          width: 150,
                          color: textPrimary,
                        }}
                      >
                        Status
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          fontFamily: "Inter, sans-serif",
                          color: textPrimary,
                        }}
                      >
                        Details
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {testCaseResults.map((result) => {
                      const sc = statusColour(result.status);
                      return (
                        <TableRow
                          key={result.index}
                          sx={{
                            bgcolor: surfaceBg,
                            "&:hover": { background: "rgba(0,0,0,0.02)" },
                          }}
                        >
                          <TableCell
                            sx={{
                              fontFamily: "Inter, sans-serif",
                              fontWeight: 600,
                              verticalAlign: "top",
                              pt: 1.5,
                              color: textPrimary,
                            }}
                          >
                            {result.isHidden ? (
                              <span style={{ color: textMuted }}>
                                Hidden #{result.index}
                              </span>
                            ) : (
                              `Test Case #${result.index}`
                            )}
                          </TableCell>
                          <TableCell sx={{ verticalAlign: "top", pt: 1.5 }}>
                            <Box
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 0.5,
                                px: 1.2,
                                py: 0.4,
                                borderRadius: 1.5,
                                background: sc.bg,
                                color: sc.color,
                                fontWeight: 700,
                                fontSize: "0.78rem",
                                fontFamily: "Inter, sans-serif",
                              }}
                            >
                              {result.passed ? (
                                <CheckCircleOutlineIcon sx={{ fontSize: 15 }} />
                              ) : (
                                <CancelOutlinedIcon sx={{ fontSize: 15 }} />
                              )}
                              {result.statusLabel}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ verticalAlign: "top", pt: 1.5 }}>
                            {result.isHidden ? (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: "'Fira Code', monospace",
                                  fontStyle: "italic",
                                  color: textMuted,
                                }}
                              >
                                Details hidden for this test case
                              </Typography>
                            ) : result.status === "compile_error" ||
                              result.status === "runtime_error" ? (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: "'Fira Code', monospace",
                                  color: sc.color,
                                  whiteSpace: "pre-wrap",
                                  display: "block",
                                }}
                              >
                                {result.actualOutput}
                              </Typography>
                            ) : (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 0.4,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: "'Fira Code', monospace",
                                    color: textMuted,
                                  }}
                                >
                                  <strong style={{ color: textPrimary }}>
                                    Input:
                                  </strong>{" "}
                                  {result.input || "(none)"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: "'Fira Code', monospace",
                                    color: textMuted,
                                  }}
                                >
                                  <strong style={{ color: textPrimary }}>
                                    Expected:
                                  </strong>{" "}
                                  {result.expectedOutput}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontFamily: "'Fira Code', monospace",
                                    color: result.passed
                                      ? "#4ade80"
                                      : "#f87171",
                                  }}
                                >
                                  <strong style={{ color: textPrimary }}>
                                    Got:
                                  </strong>{" "}
                                  {result.actualOutput || "(no output)"}
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
          <DialogActions
            sx={{
              p: 2,
              bgcolor: surfaceBg,
              borderTop: `1px solid ${borderColor}`,
            }}
          >
            <Button
              onClick={() => setTestCaseDialogOpen(false)}
              disabled={runTestCasesLoading}
              variant="contained"
              color="primary"
              sx={{ fontFamily: "Inter, sans-serif" }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbars ─────────────────────────────────────────────── */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            variant="filled"
            sx={{ fontFamily: "Inter, sans-serif" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
        <Snackbar
          open={resetDialogOpen}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="warning"
            variant="filled"
            sx={{ fontFamily: "Inter, sans-serif" }}
            action={
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  color="inherit"
                  size="small"
                  onClick={confirmResetEditor}
                >
                  Reset
                </Button>
                <Button
                  color="inherit"
                  size="small"
                  onClick={cancelResetEditor}
                >
                  Cancel
                </Button>
              </Box>
            }
          >
            Reset editor to template? This will clear your current code.
          </Alert>
        </Snackbar>

        {/* ════════════════════════════════════════════════════════════
          PAGE ROOT  —  data-mode attribute drives CSS dark overrides
          ════════════════════════════════════════════════════════════ */}
        <div
          className="cp-root"
          data-mode={mode}
          style={{ backgroundColor: pageBg }}
        >
          {/* ── Toolbar ─────────────────────────────────────────────── */}
          {/*
          KEY FIX: We add data-mode={mode} to the toolbar div AND override
          background/color entirely with inline styles so the CSS var()
          can never produce a stale light colour in dark mode.
        */}
          <div
            className="cp-toolbar"
            data-mode={mode}
            style={{
              backgroundColor: surfaceBg,
              borderBottomColor: borderColor,
            }}
          >
            {/* ── LEFT: logo + test title ── */}
            <div className="cp-toolbar__left">
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "8px",
                  background: "linear-gradient(135deg,#0c83c8,#0ea5e9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  mr: 1.5,
                  boxShadow: "0 2px 8px rgba(12,131,200,0.35)",
                }}
              >
                <CodeIcon sx={{ color: "#fff", fontSize: 20 }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  color: textPrimary, // explicit — never "inherit" in toolbar
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: { xs: 160, sm: 320, md: 480 },
                }}
              >
                {testResult.testName || "Coding Test"} &nbsp;—&nbsp; Program{" "}
                {testResult.currentCodingIndex + 1} of{" "}
                {effectiveCodingIds.length || 1}
              </Typography>
              <Tooltip title="View Instructions">
                <IconButton
                  size="small"
                  onClick={() => setInstructionsOpen(true)}
                  sx={{
                    ml: 0.5,
                    color: "#6b7280",
                    "&:hover": { color: "#0c83c8" },
                  }}
                >
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>

            {/* ── RIGHT: badges + controls ── */}
            <div className="cp-toolbar__right">
              {/* Fullscreen warning chip */}
              {fullScreenExitCount > 0 && (
                <Tooltip
                  title={`Fullscreen exits: ${fullScreenExitCount}/${MAX_FULLSCREEN_WARNINGS}`}
                >
                  <Chip
                    icon={<WarningAmberIcon fontSize="small" />}
                    label={`FS: ${fullScreenExitCount}/${MAX_FULLSCREEN_WARNINGS}`}
                    size="small"
                    sx={{
                      background:
                        fullScreenExitCount >= 4 ? "#ef4444" : "#f59e0b",
                      color: "#fff",
                      fontWeight: 700,
                      mr: 0.5,
                    }}
                  />
                </Tooltip>
              )}

              {/* Window-switch warning chip */}
              {windowSwitchCount > 0 && (
                <Tooltip
                  title={`Window switches: ${windowSwitchCount}/${MAX_WINDOW_SWITCH_WARNINGS}`}
                >
                  <Chip
                    icon={<WarningAmberIcon fontSize="small" />}
                    label={`WS: ${windowSwitchCount}/${MAX_WINDOW_SWITCH_WARNINGS}`}
                    size="small"
                    sx={{
                      background:
                        windowSwitchCount >= 4 ? "#ef4444" : "#f59e0b",
                      color: "#fff",
                      fontWeight: 700,
                      mr: 0.5,
                    }}
                  />
                </Tooltip>
              )}

              {/* ── Timer badge ── */}
              <Box
                className="cp-toolbar-badge"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  bgcolor: "rgba(0,0,0,0.05)",
                  border: `1px solid rgba(0,0,0,0.1)`,
                  px: 1.2,
                  py: 0.5,
                  borderRadius: "8px",
                  mr: 0.75,
                }}
              >
                <TimerIcon sx={{ fontSize: 15, color: timerColor }} />
                <Typography
                  sx={{
                    fontFamily: "'Fira Code', monospace",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: timerColor, // explicit colour, never white-on-white
                    letterSpacing: "0.04em",
                  }}
                >
                  {formatTime(timer)}
                </Typography>
              </Box>

              {/* ── Student name badge ── */}
              <Box
                className="cp-toolbar-badge"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  bgcolor: "rgba(0,0,0,0.05)",
                  border: `1px solid rgba(0,0,0,0.1)`,
                  px: 1.2,
                  py: 0.5,
                  borderRadius: "8px",
                  mr: 0.75,
                }}
              >
                <PersonIcon sx={{ fontSize: 15, color: "#6b7280" }} />
                <Typography
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: textPrimary, // explicit colour
                    maxWidth: 120,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {studentName || "User"}
                </Typography>
              </Box>

              {/* ── Language selector ── */}
              <FormControl size="small" sx={{ minWidth: 130, mr: 0.75 }}>
                <Select
                  value={language}
                  onChange={handleLanguageChange}
                  sx={{
                    color: textPrimary,
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.82rem",
                    bgcolor: "rgba(0,0,0,0.04)",
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0,0,0,0.15)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#0c83c8",
                    },
                    "& .MuiSvgIcon-root": { color: textMuted },
                  }}
                  renderValue={(sel) => (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                    >
                      <Box
                        sx={{
                          color: "#0c83c8",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {languageIcons[sel]}
                      </Box>
                      <Typography
                        sx={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "0.82rem",
                          color: textPrimary,
                          fontWeight: 500,
                        }}
                      >
                        {languageNames[sel]}
                      </Typography>
                    </Box>
                  )}
                >
                  <MenuItem value="python">
                    {" "}
                    <PythonIcon
                      sx={{ mr: 1, fontSize: 18, color: "#3b82f6" }}
                    />{" "}
                    Python{" "}
                  </MenuItem>
                  <MenuItem value="java">
                    {" "}
                    <JavaIcon
                      sx={{ mr: 1, fontSize: 18, color: "#f59e0b" }}
                    />{" "}
                    Java{" "}
                  </MenuItem>
                  <MenuItem value="cpp">
                    {" "}
                    <CppIcon
                      sx={{ mr: 1, fontSize: 18, color: "#8b5cf6" }}
                    />{" "}
                    C++{" "}
                  </MenuItem>
                  <MenuItem value="c">
                    {" "}
                    <CIcon
                      sx={{ mr: 1, fontSize: 18, color: "#64748b" }}
                    />{" "}
                    C{" "}
                  </MenuItem>
                  <MenuItem value="javascript">
                    {" "}
                    <JavascriptIcon
                      sx={{ mr: 1, fontSize: 18, color: "#eab308" }}
                    />{" "}
                    JavaScript{" "}
                  </MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>

          {/* ── Body ─────────────────────────────────────────────────── */}
          <div
            className={`cp-body${isMobile ? " cp-body--mobile" : ""}`}
            style={{ backgroundColor: pageBg }}
          >
            {/* Editor column */}
            <div
              className="cp-editor-col"
              style={{
                width: isMobile
                  ? "100%"
                  : testCasesCollapsed
                    ? "97%"
                    : `${editorWidth}%`,
                height: isMobile ? "50%" : "auto",
                backgroundColor: surfaceBg,
              }}
            >
              {/* Editor toolbar */}
              <div
                className="cp-editor-bar"
                style={{
                  backgroundColor: surfaceBg,
                  borderBottomColor: borderColor,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "#ef4444",
                    }}
                  />
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "#f59e0b",
                    }}
                  />
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "#22c55e",
                    }}
                  />
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: textPrimary,
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 600,
                      ml: 0.5,
                      fontSize: "0.85rem",
                    }}
                  >
                    Code Editor
                  </Typography>
                </Box>
                <div className="cp-editor-bar__actions">
                  <Tooltip title="Reset to Template">
                    <IconButton
                      size="small"
                      onClick={resetEditor}
                      sx={{ color: textMuted, "&:hover": { color: "#ef4444" } }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Save Progress (Ctrl+S)">
                    <IconButton
                      size="small"
                      onClick={handleSave}
                      sx={{ color: textMuted, "&:hover": { color: "#22c55e" } }}
                    >
                      <SaveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={handleRun}
                    disabled={runLoading || loading}
                    startIcon={
                      runLoading ? (
                        <CircularProgress size={12} color="inherit" />
                      ) : (
                        <PlayArrowIcon />
                      )
                    }
                    sx={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.8rem",
                      px: 1.5,
                      background: "linear-gradient(135deg,#0c83c8,#0ea5e9)",
                      "&:hover": {
                        background: "linear-gradient(135deg,#095e8f,#0284c7)",
                      },
                    }}
                  >
                    Run
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleRunTestCases}
                    disabled={
                      runTestCasesLoading || loading || testCases.length === 0
                    }
                    startIcon={
                      runTestCasesLoading ? (
                        <CircularProgress size={12} color="inherit" />
                      ) : (
                        <BugReportIcon />
                      )
                    }
                    sx={{
                      borderColor: "#fc7a46",
                      color: "#fc7a46",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.8rem",
                      "&:hover": {
                        borderColor: "#e55e2c",
                        color: "#e55e2c",
                        background: "rgba(252,122,70,0.08)",
                      },
                    }}
                  >
                    Run Test Cases
                  </Button>
                </div>
              </div>

              {/* Monaco editor */}
              <div className="cp-editor-area">
                <Editor
                  className="monaco-editor"
                  height="100%"
                  language={language}
                  value={input}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  theme="custom-light"
                  options={{
                    fontSize: 15,
                    minimap: { enabled: !isMobile },
                    scrollBeyondLastLine: false,
                    lineNumbers: "on",
                    padding: { top: 12 },
                    smoothScrolling: true,
                    automaticLayout: true,
                    tabIndex: 0,
                    wordWrap: "on",
                    fixedOverflowWidgets: true,
                    cursorBlinking: "smooth",
                    renderLineHighlight: "line",
                    ...(isMobile && {
                      fontSize: 14,
                      lineHeight: 22,
                      quickSuggestions: false,
                    }),
                  }}
                />
              </div>

              {/* ── Terminal output ── */}
              <div
                className="cp-output"
                style={{
                  height: outputMinimized ? "auto" : `${outputHeight}%`,
                  backgroundColor: surfaceBg,
                  borderTopColor: borderColor,
                }}
              >
                <div
                  ref={outputDividerRef}
                  className="cp-output-resize-handle"
                  onMouseDown={handleOutputMouseDown}
                />
                <div
                  className="cp-output-bar"
                  style={{
                    borderBottomColor: borderColor,
                    backgroundColor: surfaceBg,
                  }}
                >
                  <div className="cp-output-bar__left">
                    <TerminalIcon
                      sx={{ color: "#0c83c8", mr: 1, fontSize: 18 }}
                    />
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color: textPrimary,
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 600,
                        fontSize: "0.83rem",
                      }}
                    >
                      Terminal
                    </Typography>
                    {terminalLines.length > 0 && (
                      <Chip
                        label={`${terminalLines.length} lines`}
                        size="small"
                        sx={{
                          ml: 1,
                          height: 18,
                          fontSize: "0.65rem",
                          bgcolor: "rgba(0,0,0,0.06)",
                          color: textMuted,
                        }}
                      />
                    )}
                  </div>
                  <Tooltip
                    title={
                      outputMinimized ? "Expand terminal" : "Minimize terminal"
                    }
                  >
                    <IconButton
                      size="small"
                      onClick={toggleOutput}
                      sx={{ color: textMuted }}
                      aria-label={outputMinimized ? "Expand" : "Minimize"}
                    >
                      {outputMinimized ? (
                        <KeyboardArrowDownIcon fontSize="small" />
                      ) : (
                        <KeyboardArrowUpIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </div>
                {!outputMinimized && (
                  <div
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      overflowY: "auto",
                      background: "#0d1117",
                      minHeight: 0,
                    }}
                  >
                    {terminalLines.length === 0 ? (
                      <span
                        style={{
                          color: "#4b5563",
                          fontFamily: "'Fira Code', monospace",
                          fontSize: 13,
                        }}
                      >
                        Press <span style={{ color: "#60a5fa" }}>Run</span> to
                        execute your code, or{" "}
                        <span style={{ color: "#fc7a46" }}>Run Test Cases</span>{" "}
                        to check all test cases.
                      </span>
                    ) : (
                      terminalLines.map((line, i) => (
                        <TerminalLine key={i} line={line} />
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Vertical resize divider */}
            {!isMobile && !testCasesCollapsed && (
              <div
                ref={dividerRef}
                className="cp-col-divider"
                onMouseDown={handleMouseDown}
                style={{ backgroundColor: borderColor }}
              />
            )}

            {/* Problem / test cases column */}
            <div
              className={`cp-problem-col${isMobile ? " cp-problem-col--mobile" : ""}`}
              style={{
                width: isMobile
                  ? "100%"
                  : testCasesCollapsed
                    ? "3%"
                    : `${100 - editorWidth - 1}%`,
                height: isMobile ? "50%" : "auto",
                backgroundColor: surfaceBg,
                borderLeftColor: borderColor,
              }}
            >
              <div
                className="cp-problem-bar"
                style={{
                  backgroundColor: surfaceBg,
                  borderBottomColor: borderColor,
                }}
              >
                <div className="cp-problem-bar__left">
                  <FormatListNumberedIcon
                    sx={{ color: "#fc7a46", mr: 1, fontSize: 18 }}
                  />
                  {!testCasesCollapsed && (
                    <Typography
                      variant="subtitle1"
                      sx={{
                        color: textPrimary,
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 600,
                        fontSize: "0.83rem",
                      }}
                    >
                      Problem & Test Cases
                    </Typography>
                  )}
                  {!testCasesCollapsed && testCases.length > 0 && (
                    <Chip
                      label={testCases.length}
                      size="small"
                      color="secondary"
                      sx={{ ml: 1, height: 18, fontSize: "0.65rem" }}
                    />
                  )}
                </div>
                <div className="cp-problem-bar__right">
                  {isMobile ? (
                    <IconButton
                      size="small"
                      onClick={() => setShowTestCases(!showTestCases)}
                      sx={{ color: textMuted }}
                    >
                      {showTestCases ? (
                        <KeyboardArrowUpIcon fontSize="small" />
                      ) : (
                        <KeyboardArrowDownIcon fontSize="small" />
                      )}
                    </IconButton>
                  ) : (
                    <Tooltip
                      title={
                        testCasesCollapsed ? "Expand panel" : "Collapse panel"
                      }
                    >
                      <IconButton
                        size="small"
                        onClick={toggleTestCases}
                        sx={{
                          color: textMuted,
                          "&:hover": { color: "#0c83c8" },
                        }}
                      >
                        {testCasesCollapsed ? (
                          <KeyboardArrowLeftIcon fontSize="small" />
                        ) : (
                          <KeyboardArrowRightIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  )}
                </div>
              </div>

              {isMobile && !showTestCases && (
                <div
                  style={{
                    padding: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderBottom: `1px solid ${borderColor}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: textMuted, fontFamily: "Inter, sans-serif" }}
                  >
                    {testCases.length} test case
                    {testCases.length !== 1 ? "s" : ""} available
                  </Typography>
                </div>
              )}

              {!testCasesCollapsed && showTestCases && (
                <div
                  className="cp-problem-body"
                  style={{
                    backgroundColor: pageBg,
                    color: textPrimary,
                  }}
                >
                  {loading ? (
                    <div className="cp-loading-center">
                      <CircularProgress sx={{ color: "#0c83c8" }} />
                    </div>
                  ) : selectedCode ? (
                    <>
                      {/* Problem statement card */}
                      <Card
                        sx={{
                          mb: 1.5,
                          bgcolor: surfaceBg,
                          borderLeft: "3px solid #0c83c8",
                        }}
                      >
                        <CardContent sx={{ p: "12px !important" }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{
                                color: textPrimary,
                                fontFamily: "Inter, sans-serif",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                lineHeight: 1.4,
                              }}
                            >
                              {selectedCode.code_title || "Problem"}
                            </Typography>
                            <Chip
                              label="10 Mark"
                              size="small"
                              className={difficultyChipClass(
                                selectedCode.code_difficulty,
                              )}
                              sx={{
                                height: 20,
                                fontSize: "0.72rem",
                                flexShrink: 0,
                                ml: 1,
                              }}
                            />
                          </Box>
                          <Divider sx={{ mb: 1, borderColor: borderColor }} />
                          <Typography
                            variant="body2"
                            sx={{
                              color: textMuted,
                              fontFamily: "Inter, sans-serif",
                              whiteSpace: "pre-wrap",
                              fontSize: "0.83rem",
                              lineHeight: 1.65,
                            }}
                          >
                            {selectedCode.code_problem_statement}
                          </Typography>
                        </CardContent>
                      </Card>

                      {/* Test case cards */}
                      {testCases.length > 0 ? (
                        <Stack spacing={1}>
                          {visibleTestCases.map((tc, i) => (
                            <Card key={i} sx={{ bgcolor: surfaceBg }}>
                              <CardContent sx={{ p: "10px !important" }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mb: 0.75,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: "50%",
                                      background:
                                        "linear-gradient(135deg,#0c83c8,#0ea5e9)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "0.65rem",
                                      fontWeight: 700,
                                      color: "#fff",
                                      mr: 0.75,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {i + 1}
                                  </Box>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{
                                      color: textPrimary,
                                      fontFamily: "Inter, sans-serif",
                                      fontWeight: 600,
                                      fontSize: "0.82rem",
                                    }}
                                  >
                                    Test Case #{i + 1}
                                  </Typography>
                                </Box>
                                <Divider
                                  sx={{ mb: 0.75, borderColor: borderColor }}
                                />
                                {tc.testcase_input && (
                                  <Box
                                    sx={{
                                      mb: 0.75,
                                      p: 1,
                                      bgcolor: codeBg,
                                      borderRadius: "6px",
                                      border: `1px solid ${borderColor}`,
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontFamily: "'Fira Code', monospace",
                                        fontSize: "0.78rem",
                                        color: textMuted,
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      <strong
                                        style={{
                                          color: "#0c83c8",
                                          fontFamily: "Inter, sans-serif",
                                          fontSize: "0.7rem",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.05em",
                                        }}
                                      >
                                        Input
                                      </strong>
                                      {"\n"}
                                      {Array.isArray(tc.testcase_input)
                                        ? tc.testcase_input.join("\n")
                                        : tc.testcase_input ||
                                          "No input provided"}
                                    </Typography>
                                  </Box>
                                )}
                                {tc.testcase_output && (
                                  <Box
                                    sx={{
                                      p: 1,
                                      bgcolor: codeBg,
                                      borderRadius: "6px",
                                      border: `1px solid ${borderColor}`,
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontFamily: "'Fira Code', monospace",
                                        fontSize: "0.78rem",
                                        color: textMuted,
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                      }}
                                    >
                                      <strong
                                        style={{
                                          color: "#22c55e",
                                          fontFamily: "Inter, sans-serif",
                                          fontSize: "0.7rem",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.05em",
                                        }}
                                      >
                                        Expected Output
                                      </strong>
                                      {"\n"}
                                      {Array.isArray(tc.testcase_output)
                                        ? tc.testcase_output.join("\n")
                                        : tc.testcase_output ||
                                          "No output provided"}
                                    </Typography>
                                  </Box>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                          {hiddenTestCasesCount > 0 && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                p: 1,
                                bgcolor: "rgba(0,0,0,0.03)",
                                borderRadius: "8px",
                                border: `1px dashed ${borderColor}`,
                              }}
                            >
                              <InfoIcon
                                sx={{ fontSize: 14, color: textMuted }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  color: textMuted,
                                  fontFamily: "Inter, sans-serif",
                                  fontSize: "0.78rem",
                                }}
                              >
                                + {hiddenTestCasesCount} hidden test case
                                {hiddenTestCasesCount !== 1 ? "s" : ""} (not
                                visible)
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            color: textMuted,
                            fontFamily: "Inter, sans-serif",
                            p: 1,
                          }}
                        >
                          No test cases available for this problem.
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        color: textMuted,
                        fontFamily: "Inter, sans-serif",
                        p: 1,
                      }}
                    >
                      No problem selected or failed to load problem data.
                    </Typography>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <div
            className="cp-footer"
            style={{ backgroundColor: surfaceBg, borderTopColor: borderColor }}
          >
            <div className="cp-footer__nav">
              <Button
                variant="outlined"
                color="primary"
                onClick={handlePrevious}
                disabled={isFirstProgram || loading}
                startIcon={<NavigateBeforeIcon />}
                size="small"
                sx={{ fontFamily: "Inter, sans-serif", borderRadius: "8px" }}
              >
                Previous
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleNext}
                disabled={isLastProgram || loading}
                endIcon={<NavigateNextIcon />}
                size="small"
                sx={{ fontFamily: "Inter, sans-serif", borderRadius: "8px" }}
              >
                Next
              </Button>
            </div>

            {/* Progress indicator */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {effectiveCodingIds.map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: idx === testResult.currentCodingIndex ? 20 : 8,
                    height: 8,
                    borderRadius: "4px",
                    bgcolor:
                      idx === testResult.currentCodingIndex
                        ? "#0c83c8"
                        : testResult.codingResults?.some(
                              (r) => r.codeId === effectiveCodingIds[idx],
                            )
                          ? "#22c55e"
                          : "rgba(0,0,0,0.15)",
                    transition: "all 0.2s ease",
                  }}
                />
              ))}
            </Box>

            <Button
              variant="contained"
              color="error"
              onClick={() => handleFinalSubmit(false)}
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <DoneIcon />
                )
              }
              size="small"
              sx={{
                fontFamily: "Inter, sans-serif",
                borderRadius: "8px",
                background: "linear-gradient(135deg,#ef4444,#dc2626)",
                "&:hover": {
                  background: "linear-gradient(135deg,#dc2626,#b91c1c)",
                },
                fontWeight: 700,
              }}
            >
              Submit Test
            </Button>
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
};

export default CodingPage;