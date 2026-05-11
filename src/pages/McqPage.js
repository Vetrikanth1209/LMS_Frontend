import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Radio,
  Checkbox,
  FormControlLabel,
  Button,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText,
  LinearProgress,
  IconButton,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Chip,
} from "@mui/material";
import {
  Flag as FlagIcon,
  ArrowForward as ArrowIcon,
  Info as InfoIcon,
  Timer as TimerIcon,
  WarningAmber as WarningAmberIcon,
} from "@mui/icons-material";
import { getTestById, getMcqById, submitTestResult } from "../axios";
import "../styles/McqStyle.css";
import useAssessmentBackup from "../hooks/assessmentBackup";

// ── MUI theme ─────────────────────────────────────────────────────────────────
const theme = createTheme({
  typography: {
    fontFamily: ["Inter", "Roboto", '"Segoe UI"', "Arial", "sans-serif"].join(
      ",",
    ),
    h6: { fontWeight: 600 },
    body1: { lineHeight: 1.6 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  palette: {
    primary: { main: "#0c83c8" },
    secondary: { main: "#fc7a46" },
    success: { main: "#2e7d32" },
    warning: { main: "#f57c00" },
    background: { default: "#f8fafc" },
  },
  shape: { borderRadius: 8 },
});

// ── Pie Chart ─────────────────────────────────────────────────────────────────
const PieChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  let cumulativePercentage = 0;

  const createPath = (percentage, cumulativePercentage) => {
    const startAngle = cumulativePercentage * 3.6;
    const endAngle = (cumulativePercentage + percentage) * 3.6;
    const largeArcFlag = percentage > 50 ? 1 : 0;
    const x1 = 50 + 35 * Math.cos(((startAngle - 90) * Math.PI) / 180);
    const y1 = 50 + 35 * Math.sin(((startAngle - 90) * Math.PI) / 180);
    const x2 = 50 + 35 * Math.cos(((endAngle - 90) * Math.PI) / 180);
    const y2 = 50 + 35 * Math.sin(((endAngle - 90) * Math.PI) / 180);
    return `M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className={`pie-chart-container ${total === 100 ? "stable" : ""}`}>
      <svg viewBox="0 0 100 100" className="pie-chart">
        {data.map((item, index) => {
          if (item.value === 0) return null;
          const rawPercent = (item.value / total) * 100;
          const percentage = Math.min(rawPercent, 99.999);
          const path = createPath(percentage, cumulativePercentage);
          cumulativePercentage += percentage;
          return (
            <path
              key={index}
              d={path}
              fill={item.color}
              className={`pie-slice ${total === 100 ? "stable" : ""}`}
            />
          );
        })}
      </svg>
    </div>
  );
};

// ── Circular Timer ────────────────────────────────────────────────────────────
const CircularTimer = ({ timeLeft, totalTime }) => {
  const percentage = (timeLeft / totalTime) * 100;
  const circumference = 2 * Math.PI * 35;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getTimerColor = () => {
    if (percentage > 50) return "#22c55e";
    if (percentage > 20) return "#f97316";
    return "#ef4444";
  };

  return (
    <div className="circular-timer">
      <svg className="timer-svg" viewBox="0 0 100 100">
        <circle
          className="timer-background"
          cx="50"
          cy="50"
          r="35"
          fill="#e2e8f0"
          stroke="none"
        />
        <circle
          className="timer-progress"
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke={getTimerColor()}
          strokeWidth="6"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
        />
        <circle
          className="timer-fill"
          cx="50"
          cy="50"
          r="30"
          fill={getTimerColor()}
          opacity="0.2"
        />
      </svg>
    </div>
  );
};

// ── Question Navigator ────────────────────────────────────────────────────────
const QuestionNavigator = ({ progress, currentQuestion, onQuestionSelect }) => (
  <div className="question-navigator">
    <Typography variant="subtitle2" className="navigator-title">
      Question Navigator
    </Typography>
    <div className="question-grid">
      {progress.map((item, index) => {
        const hasAnswer = item.selected_options?.length > 0;
        let status = "not-visited";
        if (hasAnswer && item.marked) status = "answered-and-marked";
        else if (hasAnswer) status = "answered";
        else if (item.marked) status = "marked";
        else if (item.visited) status = "not-answered";

        return (
          <div
            key={index}
            className={`question-bubble ${status} ${index === currentQuestion ? "current" : ""}`}
            onClick={() => onQuestionSelect(index)}
          >
            {index + 1}
          </div>
        );
      })}
    </div>
  </div>
);

// ── McqPage ───────────────────────────────────────────────────────────────────
const McqPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [testData, setTestData] = useState(null);
  const [mcqData, setMcqData] = useState([]);
  const [codingIds, setCodingIds] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [progress, setProgress] = useState([]);
  const [testResult, setTestResult] = useState({});
  const [timer, setTimer] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({
    open: false,
    type: "",
    message: "",
    onConfirm: null,
  });
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [userId, setUserId] = useState("");
  const [pocId, setPocId] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { saveBackup, loadBackup, clearBackup, addSecurityLog } =
    useAssessmentBackup({
      testId,
      userId,
      pocId,
    });

  // ── Fullscreen warning state ──────────────────────────────────────────────
  const MAX_FULLSCREEN_WARNINGS = 5;
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [fullscreenWarningOpen, setFullscreenWarningOpen] = useState(false);
  const fullscreenExitCountRef = useRef(0);

  // ── Window-switch (Alt+Tab) warning state ────────────────────────────────
  const MAX_WINDOW_SWITCH_WARNINGS = 5;
  const [windowSwitchCount, setWindowSwitchCount] = useState(0);
  const [windowSwitchWarningOpen, setWindowSwitchWarningOpen] = useState(false);
  const windowSwitchCountRef = useRef(0);

  // ── Snackbar for non-fatal warnings (copy/paste blocked) ─────────────────
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const timerRef = useRef(null);
  const isSubmitting = useRef(false);
  // Keep a live ref to testResult so handleSubmitTest always has fresh data
  const testResultRef = useRef({});
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const defaultInstructions = [
    "Read each question carefully before answering.",
    "Select one option for each multiple-choice question.",
    "Use the 'Mark for Review' button to revisit questions later.",
    "Click 'Next' to move to the next question or 'Previous' to go back.",
    "Do not refresh the page or navigate away, as this will submit the test.",
    "Ensure you remain in fullscreen mode throughout the test.",
    "Any attempt to copy, paste, open developer tools, or switch windows will result in immediate test submission after 5 warnings.",
    "Submit the test when you are ready, or proceed to the coding section if applicable.",
  ];

  const shuffleArray = (array) => {
    if (!array || !Array.isArray(array)) return [];
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // ── Keep testResultRef in sync with state ─────────────────────────────────
  useEffect(() => {
    testResultRef.current = testResult;
  }, [testResult]);

  // ── Initialize test data ──────────────────────────────────────────────────
  useEffect(() => {
    const initializeTest = async () => {
      try {
        setLoading(true);

        const storedUser = localStorage.getItem("true");
        let userData = {};
        if (storedUser) {
          try {
            userData = JSON.parse(storedUser);
            setStudentName(userData.user?.full_name || "Student");
            setUserId(userData.user?.user_id || "");
            setPocId(userData.user?.mod_poc_id?.mod_poc_id || "");
          } catch (error) {
            console.error("Failed to parse user data:", error);
          }
        }

        const test = await getTestById(testId);
        if (!test) throw new Error("Test data not found");
        setTestData(test);

        let ids = test.test_coding_id?.length ? test.test_coding_id : [];
        const savedCodingIds = JSON.parse(
          localStorage.getItem("coding_ids") || "[]",
        );
        if (savedCodingIds.length > 0) {
          ids = savedCodingIds;
        } else {
          localStorage.setItem("coding_ids", JSON.stringify(ids));
        }
        setCodingIds(ids);

        const mcqPromises = (test.test_mcq_id || []).map((id) =>
          getMcqById(id),
        );
        const mcqResults = await Promise.all(mcqPromises);
        const shuffledMcq = shuffleArray(
          mcqResults.map((mcq) => ({
            ...mcq,
            mcq_options: shuffleArray(mcq.mcq_options || []),
          })),
        );
        setMcqData(shuffledMcq);

        const backup = await loadBackup();

        const savedFsCount = backup?.security?.fullscreenExitCount || 0;
        setFullscreenExitCount(savedFsCount);
        fullscreenExitCountRef.current = savedFsCount;

        const savedWsCount = backup?.security?.windowSwitchCount || 0;
        setWindowSwitchCount(savedWsCount);
        windowSwitchCountRef.current = savedWsCount;

        const savedProgress = backup?.mcq?.progress || [];
        const initialProgress = shuffledMcq.map((mcq) => ({
          mcq_id: mcq.mcq_id,
          selected_options: [],
          marked: false,
          visited: false,
        }));
        const mergedProgress = initialProgress.map((init) => {
          const saved = savedProgress.find((p) => p.mcq_id === init.mcq_id);
          return saved || init;
        });
        setProgress(mergedProgress);

        const savedTimer =
          backup?.timer?.remainingTime || test?.test_duration * 60 || 3600;
        const timerValue = Number.parseInt(savedTimer, 10);
        if (isNaN(timerValue) || timerValue <= 0) {
          throw new Error("Invalid test timer value");
        }
        setTimer(timerValue);
        setTotalTime(timerValue);

        const savedResult = backup?.result || {};
        const navigationResult = state || {};
        const updatedResult = {
          result_user_id:
            userData.user?.user_id ||
            savedResult.result_user_id ||
            navigationResult.result_user_id ||
            "",
          result_test_id: testId,
          result_score:
            savedResult.result_score || navigationResult.result_score || 0,
          result_total_score:
            savedResult.result_total_score ||
            navigationResult.result_total_score ||
            (test.test_mcq_id?.length || 0) +
              (test.test_coding_id?.length || 0) * 10,
          result_poc_id:
            userData.user?.mod_poc_id?.mod_poc_id ||
            savedResult.result_poc_id ||
            navigationResult.result_poc_id ||
            "",
          studentName:
            userData.user?.full_name ||
            savedResult.studentName ||
            navigationResult.studentName ||
            "",
          testName:
            test.test_name ||
            savedResult.testName ||
            navigationResult.testName ||
            "",
          testLanguage:
            test.test_language ||
            savedResult.testLanguage ||
            navigationResult.testLanguage ||
            "",
          codingIds: savedResult.codingIds || navigationResult.codingIds || ids,
          codingAnswered:
            savedResult.codingAnswered || navigationResult.codingAnswered || 0,
          codingNotAnswered:
            savedResult.codingNotAnswered ||
            navigationResult.codingNotAnswered ||
            test.test_coding_id?.length ||
            0,
          codingNotVisited:
            savedResult.codingNotVisited ||
            navigationResult.codingNotVisited ||
            test.test_coding_id?.length ||
            0,
          codingCorrect:
            savedResult.codingCorrect || navigationResult.codingCorrect || 0,
          codingWrong:
            savedResult.codingWrong || navigationResult.codingWrong || 0,
          codingResults:
            savedResult.codingResults || navigationResult.codingResults || [],
          mcqAnswered:
            savedResult.mcqAnswered || navigationResult.mcqAnswered || 0,
          mcqCorrect:
            savedResult.mcqCorrect || navigationResult.mcqCorrect || 0,
          mcqWrong: savedResult.mcqWrong || navigationResult.mcqWrong || 0,
          mcqNotAnswered:
            savedResult.mcqNotAnswered || navigationResult.mcqNotAnswered || 0,
          mcqNotVisited:
            savedResult.mcqNotVisited ||
            navigationResult.mcqNotVisited ||
            test.test_mcq_id?.length ||
            0,
          marked: savedResult.marked || navigationResult.marked || 0,
          currentCodingIndex:
            savedResult.currentCodingIndex ||
            navigationResult.currentCodingIndex ||
            0,
        };
        setTestResult(updatedResult);
        testResultRef.current = updatedResult;

        window.history.replaceState(null, null, `/mcq/${testId}`);
        window.history.pushState(null, null, `/mcq/${testId}`);
        window.history.pushState(null, null, `/mcq/${testId}`);

        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
          } else if (document.documentElement.mozRequestFullScreen) {
            await document.documentElement.mozRequestFullScreen();
            setIsFullscreen(true);
          } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
            setIsFullscreen(true);
          } else if (document.documentElement.msRequestFullscreen) {
            await document.documentElement.msRequestFullscreen();
            setIsFullscreen(true);
          } else {
            console.warn("Fullscreen API not supported");
            setDialog({
              open: true,
              type: "warning",
              message:
                "Fullscreen mode is not supported by your browser. The test requires fullscreen.",
              onConfirm: () => setDialog({ open: false }),
            });
          }
        } catch (error) {
          console.error("Fullscreen request failed:", error);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error("Initialization error:", error);
        setDialog({
          open: true,
          type: "error",
          message: error.message || "Failed to load test data",
          onConfirm: () => {
            window.history.replaceState(null, null, "/test-result");
            navigate("/test-result");
          },
        });
      } finally {
        setLoading(false);
      }
    };

    initializeTest();
  }, [testId, navigate, state]);

  // ── Timer countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized || timer <= 0) {
      if (timer <= 0 && isInitialized && !isSubmitting.current) {
        handleSubmitTest();
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timer, isInitialized]);

  // ── Periodic backup of timer ──────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      saveBackup({
        timer: {
          remainingTime: timer,
          totalTime,
        },
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [timer, totalTime, isInitialized, saveBackup]);

  // ── Malpractice prevention + fullscreen + window-switch handling ──────────
  useEffect(() => {
    if (!isInitialized) return;

    // ─────────────────────────────────────────────────────────────────────────
    // FIX 1: handleMalpractice no longer auto-submits on every call.
    // It is only called when the threshold is already reached (see callers).
    // It shows a dialog and then triggers submission.
    // ─────────────────────────────────────────────────────────────────────────
    const handleMalpractice = (message) => {
      if (isSubmitting.current) return;
      addSecurityLog("MALPRACTICE", message);
      setDialog({
        open: true,
        type: "malpractice",
        message: `Malpractice detected: ${message}. Your test is being submitted automatically.`,
        onConfirm: null,
      });
      // Delay submit slightly so the dialog renders first
      setTimeout(() => handleSubmitTest(), 500);
    };

    const requestFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen)
          await document.documentElement.requestFullscreen();
        else if (document.documentElement.mozRequestFullScreen)
          await document.documentElement.mozRequestFullScreen();
        else if (document.documentElement.webkitRequestFullscreen)
          await document.documentElement.webkitRequestFullscreen();
        else if (document.documentElement.msRequestFullscreen)
          await document.documentElement.msRequestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error("Fullscreen request failed:", error);
      }
    };

    const handlePopState = () => {
      window.history.pushState(null, null, `/mcq/${testId}`);
      handleMalpractice("Attempted to navigate back using browser controls");
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue =
        "Leaving the test will submit it automatically. Are you sure?";
    };

    // ─────────────────────────────────────────────────────────────────────────
    // FIX 2: Fullscreen exit — show warning for counts 1–4, submit on count 5
    // ─────────────────────────────────────────────────────────────────────────
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen =
        !!document.fullscreenElement ||
        !!document.mozFullScreenElement ||
        !!document.webkitFullscreenElement ||
        !!document.msFullscreenElement;

      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && isInitialized && !isSubmitting.current) {
        const newCount = fullscreenExitCountRef.current + 1;
        fullscreenExitCountRef.current = newCount;
        setFullscreenExitCount(newCount);
        saveBackup({ security: { fullscreenExitCount: newCount } });

        if (newCount >= MAX_FULLSCREEN_WARNINGS) {
          // Threshold reached — auto-submit
          handleMalpractice(
            `Exited fullscreen mode ${MAX_FULLSCREEN_WARNINGS} times`,
          );
        } else {
          // Still within warning budget — just show the warning dialog
          setFullscreenWarningOpen(true);
        }
      } else if (isCurrentlyFullscreen) {
        setFullscreenWarningOpen(false);
      }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // FIX 3: Window switch — show warning for counts 1–4, submit on count 5
    // ─────────────────────────────────────────────────────────────────────────
    const handleWindowBlur = () => {
      if (isSubmitting.current) return;

      const newCount = windowSwitchCountRef.current + 1;
      windowSwitchCountRef.current = newCount;
      setWindowSwitchCount(newCount);
      saveBackup({ security: { windowSwitchCount: newCount } });

      if (newCount >= MAX_WINDOW_SWITCH_WARNINGS) {
        // Threshold reached — auto-submit
        handleMalpractice(
          `Switched away from test window ${MAX_WINDOW_SWITCH_WARNINGS} times`,
        );
      } else {
        // Still within warning budget — just show warning dialog
        setWindowSwitchWarningOpen(true);
      }
    };

    const handleWindowFocus = () => {
      setWindowSwitchWarningOpen(false);
    };

    const handleVisibilityChange = () => {
      // Tab switching handled by blur; visibilitychange kept for completeness
    };

    // ─────────────────────────────────────────────────────────────────────────
    // FIX 4: Copy/paste shows a snackbar warning — does NOT submit the test
    // ─────────────────────────────────────────────────────────────────────────
    const preventCopyPaste = (e) => {
      e.preventDefault();
      setSnackbarMessage("Copy/paste is disabled during the test.");
      setSnackbarOpen(true);
    };

    const preventDevTools = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        handleMalpractice("Attempted to open developer tools");
      }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // FIX 5: Mouse-leave no longer triggers malpractice.
    // Tiny cursor drifts constantly cause false positives and instant submission.
    // Window-blur already catches intentional tab/app switches.
    // ─────────────────────────────────────────────────────────────────────────
    // (handleMouseLeave removed intentionally)

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", preventCopyPaste);
    document.addEventListener("paste", preventCopyPaste);
    document.addEventListener("keydown", preventDevTools);

    const fullscreenCheckInterval = setInterval(() => {
      if (!isFullscreen && isInitialized && !fullscreenWarningOpen)
        requestFullscreen();
    }, 5000);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", preventCopyPaste);
      document.removeEventListener("paste", preventCopyPaste);
      document.removeEventListener("keydown", preventDevTools);
      clearInterval(fullscreenCheckInterval);
    };
  }, [isInitialized, testId, isFullscreen, fullscreenWarningOpen]);

  // ── Save progress ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized || !testData || !mcqData) return;

    const answeredCount = progress.filter(
      (p) => p.selected_options?.length > 0,
    ).length;
    const markedCount = progress.filter((p) => p.marked).length;
    const notAnsweredCount = progress.filter(
      (p) => !p.selected_options?.length && p.visited && !p.marked,
    ).length;
    const notVisitedCount = progress.filter(
      (p) => !p.visited && !p.marked && !p.selected_options?.length,
    ).length;

    let mcqScore = 0;
    let wrongAnswersCount = 0;
    progress.forEach((p) => {
      const question = mcqData.find((q) => q.mcq_id === p.mcq_id);
      if (!question || !p.selected_options?.length) return;

      const correctAnswers = Array.isArray(question.mcq_answer)
        ? question.mcq_answer
        : [question.mcq_answer];

      const selectedSorted = [...p.selected_options].sort();
      const correctSorted = [...correctAnswers].sort();
      const isCorrect =
        selectedSorted.length === correctSorted.length &&
        selectedSorted.every((ans, i) => ans === correctSorted[i]);

      if (isCorrect) mcqScore += 1;
      else wrongAnswersCount += 1;
    });

    setTestResult((prev) => {
      const updatedResult = {
        ...prev,
        result_user_id: userId || prev.result_user_id || "",
        result_test_id: testId,
        result_score:
          mcqScore +
          (prev.codingResults?.reduce((sum, res) => sum + res.score, 0) || 0),
        result_total_score:
          (testData.test_mcq_id?.length || 0) +
          (testData.test_coding_id?.length || 0) * 10,
        result_poc_id: pocId || prev.result_poc_id || "",
        studentName: studentName || prev.studentName || "",
        testName: testData.test_name || prev.testName || "",
        testLanguage: testData.test_language || prev.testLanguage || "",
        codingIds: prev.codingIds || codingIds,
        codingAnswered: prev.codingAnswered || 0,
        codingNotAnswered:
          prev.codingNotAnswered || testData.test_coding_id?.length || 0,
        codingNotVisited:
          prev.codingNotVisited || testData.test_coding_id?.length || 0,
        codingCorrect: prev.codingCorrect || 0,
        codingWrong: prev.codingWrong || 0,
        codingResults: prev.codingResults || [],
        mcqAnswered: answeredCount,
        mcqCorrect: mcqScore,
        mcqWrong: wrongAnswersCount,
        mcqNotAnswered: notAnsweredCount,
        mcqNotVisited: notVisitedCount,
        marked: markedCount,
        currentCodingIndex: prev.currentCodingIndex || 0,
      };

      // Keep the ref in sync so handleSubmitTest always has fresh data
      testResultRef.current = updatedResult;

      saveBackup({
        mcq: {
          progress,
          currentQuestionIndex: currentQuestion,
        },
        timer: {
          remainingTime: timer,
          totalTime,
        },
        result: updatedResult,
      });

      return updatedResult;
    });
  }, [
    progress,
    testData,
    userId,
    pocId,
    studentName,
    testId,
    mcqData,
    isInitialized,
    codingIds,
    currentQuestion,
    timer,
    totalTime,
    saveBackup,
  ]);

  // ── Event handlers ────────────────────────────────────────────────────────
  const handleOptionClick = (option) => {
    const currentMcq = mcqData[currentQuestion];
    const isMulti = currentMcq?.mcq_type === "multi";

    setProgress((prev) =>
      prev.map((item, idx) => {
        if (idx !== currentQuestion) return item;
        const current = item.selected_options || [];
        if (isMulti) {
          const updated = current.includes(option)
            ? current.filter((o) => o !== option)
            : [...current, option];
          return { ...item, selected_options: updated, visited: true };
        } else {
          const updated = current.includes(option) ? [] : [option];
          return { ...item, selected_options: updated, visited: true };
        }
      }),
    );
  };

  const handleMarkQuestion = () => {
    setProgress((prev) =>
      prev.map((item, idx) =>
        idx === currentQuestion
          ? { ...item, marked: !item.marked, visited: true }
          : item,
      ),
    );
  };

  const handleQuestionNavigation = (index) => {
    if (index >= 0 && index < mcqData.length) {
      setProgress((prev) =>
        prev.map((item, idx) =>
          idx === index ? { ...item, visited: true } : item,
        ),
      );
      setCurrentQuestion(index);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FIX 6: handleSubmitTest — reads from testResultRef (always fresh) and
  // passes the full resultData to navigate() so TestResultPage can render it.
  // ─────────────────────────────────────────────────────────────────────────
  const handleSubmitTest = useCallback(async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    try {
      console.log("Submitting test...");

      // Always prefer the live ref; fall back to IndexedDB
      let resultData = testResultRef.current;
      if (!resultData || !resultData.result_test_id) {
        const backup = await loadBackup();
        resultData = backup?.result || testResultRef.current || {};
      }

      // Map frontend fields → backend-expected fields
      const codingResults = resultData.codingResults || [];
      const totalCodingScore = codingResults.reduce(
        (sum, r) => sum + (r.score || 0),
        0,
      );
      const totalTestcasesPassed = codingResults.reduce(
        (sum, r) => sum + (r.testcasesPassed ?? r.testcases_passed ?? 0),
        0,
      );

      const payload = {
        result_user_id: resultData.result_user_id || userId,
        result_test_id: resultData.result_test_id || testId,
        result_score: resultData.result_score ?? 0,
        result_total_score: resultData.result_total_score ?? 0,
        result_poc_id: resultData.result_poc_id || pocId,
        result_mcq_score: resultData.mcqCorrect ?? 0,
        result_coding_score: {
          score: totalCodingScore,
          testcases_passed: totalTestcasesPassed,
        },
      };

      await submitTestResult(payload);
      console.log("Test submitted successfully");

      if (document.exitFullscreen)
        await document.exitFullscreen().catch((e) => console.error(e));
      else if (document.mozCancelFullScreen)
        await document.mozCancelFullScreen().catch((e) => console.error(e));
      else if (document.webkitExitFullscreen)
        await document.webkitExitFullscreen().catch((e) => console.error(e));
      else if (document.msExitFullscreen)
        await document.msExitFullscreen().catch((e) => console.error(e));

      await clearBackup();

      // Build the complete resultData object that TestResultPage expects
      const navigationResultData = {
        result_score: resultData.result_score ?? 0,
        result_total_score: resultData.result_total_score ?? 0,
        result_coding_score: {
          score: totalCodingScore,
          testcases_passed: totalTestcasesPassed,
        },
        mcqAnswered: resultData.mcqAnswered ?? 0,
        mcqCorrect: resultData.mcqCorrect ?? 0,
        mcqWrong: resultData.mcqWrong ?? 0,
        mcqNotAnswered: resultData.mcqNotAnswered ?? 0,
        mcqNotVisited: resultData.mcqNotVisited ?? 0,
        codingAnswered: resultData.codingAnswered ?? 0,
        codingCorrect: resultData.codingCorrect ?? 0,
        codingWrong: resultData.codingWrong ?? 0,
        codingNotAnswered: resultData.codingNotAnswered ?? 0,
        codingNotVisited: resultData.codingNotVisited ?? 0,
        codingIds: resultData.codingIds || [],
        codingResults,
        marked: resultData.marked ?? 0,
        studentName: resultData.studentName || studentName || "",
        testName: resultData.testName || "",
        testLanguage: resultData.testLanguage || "",
      };

      window.history.replaceState(null, null, "/test-result");
      // Pass resultData via navigation state so TestResultPage can render it
      navigate("/test-result", { state: { resultData: navigationResultData } });
    } catch (error) {
      console.error("Submission error:", error);
      setDialog({
        open: true,
        type: "error",
        message:
          "Failed to submit test. You will be redirected to the results page.",
        onConfirm: () => {
          window.history.replaceState(null, null, "/test-result");
          navigate("/test-result");
        },
      });
    } finally {
      isSubmitting.current = false;
    }
  }, [navigate, userId, pocId, testId, studentName, loadBackup, clearBackup]);

  // ── Re-enter fullscreen handler ───────────────────────────────────────────
  const handleReEnterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else if (document.documentElement.mozRequestFullScreen)
        await document.documentElement.mozRequestFullScreen();
      else if (document.documentElement.webkitRequestFullscreen)
        await document.documentElement.webkitRequestFullscreen();
      else if (document.documentElement.msRequestFullscreen)
        await document.documentElement.msRequestFullscreen();
      setFullscreenWarningOpen(false);
      setIsFullscreen(true);
    } catch (err) {
      console.error("Failed to re-enter fullscreen:", err);
    }
  };

  const handleProceedToCoding = () => {
    if (codingIds.length === 0) {
      setDialog({
        open: true,
        type: "error",
        message: "No coding problems available for this test.",
        onConfirm: () => setDialog({ open: false }),
      });
      return;
    }
    setDialog({
      open: true,
      type: "proceed",
      message:
        "Once you proceed to the coding section, you cannot return to the MCQ section. Do you want to continue?",
      onConfirm: () => {
        navigate(`/coding/${codingIds[0]}`, {
          state: { ...testResultRef.current, currentCodingIndex: 0, codingIds },
        });
        setDialog({ open: false });
      },
    });
  };

  const handleSubmitTestWithWarning = () => {
    setDialog({
      open: true,
      type: "submit",
      message:
        "Submitting the test is final. You cannot make further changes. Do you want to submit?",
      onConfirm: handleSubmitTest,
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const instructions = testData?.test_instructions
    ? Array.isArray(testData.test_instructions)
      ? testData.test_instructions
      : testData.test_instructions.split("\n").filter((line) => line.trim())
    : defaultInstructions;

  const fsWarningsRemaining = MAX_FULLSCREEN_WARNINGS - fullscreenExitCount;
  const wsWarningsRemaining = MAX_WINDOW_SWITCH_WARNINGS - windowSwitchCount;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (!testData || mcqData.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        p={2}
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Error Loading Test
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Unable to load test data. Please try again later.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              window.history.replaceState(null, null, "/test-result");
              navigate("/test-result");
            }}
          >
            Go to Results
          </Button>
        </Paper>
      </Box>
    );
  }

  // ── Derive progress counts ────────────────────────────────────────────────
  let answeredCount = 0,
    markedCount = 0,
    answeredAndMarkedCount = 0,
    notAnsweredCount = 0,
    notVisitedCount = 0;

  progress.forEach((p) => {
    const hasAnswer = p.selected_options?.length > 0;
    if (hasAnswer && p.marked) answeredAndMarkedCount += 1;
    else if (hasAnswer) answeredCount += 1;
    else if (p.marked) markedCount += 1;
    else if (p.visited) notAnsweredCount += 1;
    else notVisitedCount += 1;
  });

  const pieChartData = [
    {
      label: "Answered & Marked",
      value: answeredAndMarkedCount,
      color: "#0c83c8",
    },
    { label: "Answered", value: answeredCount, color: "#22c55e" },
    { label: "Marked", value: markedCount, color: "#fc7a46" },
    { label: "Not Answered", value: notAnsweredCount, color: "#ef4444" },
    { label: "Not Visited", value: notVisitedCount, color: "#9ca3af" },
  ];

  const isLastQuestionAnswered =
    currentQuestion === mcqData.length - 1 &&
    progress[currentQuestion]?.selected_options?.length > 0;

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* ── Copy/paste blocked snackbar ────────────────────────────── */}
      {snackbarOpen && (
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            bgcolor: "#1f2937",
            color: "#fff",
            px: 3,
            py: 1.5,
            borderRadius: 2,
            fontSize: "0.875rem",
            fontFamily: "Inter, sans-serif",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <WarningAmberIcon sx={{ fontSize: 18, color: "#f59e0b" }} />
          {snackbarMessage}
          <Box
            component="button"
            onClick={() => setSnackbarOpen(false)}
            sx={{
              ml: 2,
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            ✕
          </Box>
        </Box>
      )}

      {/* ── Fullscreen warning dialog ──────────────────────────────── */}
      <Dialog
        open={fullscreenWarningOpen}
        disableEscapeKeyDown
        aria-labelledby="fs-warning-title"
        className="clean-dialog"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="fs-warning-title">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WarningAmberIcon sx={{ color: "#f57c00" }} />
            Fullscreen Exited — Warning {fullscreenExitCount} of{" "}
            {MAX_FULLSCREEN_WARNINGS}
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have exited fullscreen mode. This is warning{" "}
            <strong>{fullscreenExitCount}</strong> of{" "}
            <strong>{MAX_FULLSCREEN_WARNINGS}</strong>.
          </DialogContentText>
          <DialogContentText sx={{ color: "#d32f2f", mt: 1, fontWeight: 600 }}>
            {fsWarningsRemaining > 0
              ? `You have ${fsWarningsRemaining} warning${fsWarningsRemaining !== 1 ? "s" : ""} remaining before the test is automatically submitted.`
              : "This is your final warning. The test will be submitted on next fullscreen exit."}
          </DialogContentText>
          <DialogContentText sx={{ mt: 1 }}>
            Please return to fullscreen mode immediately to continue your test.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleReEnterFullscreen}
            color="warning"
            variant="contained"
            autoFocus
            className="clean-button"
            sx={{ background: "#f57c00", "&:hover": { background: "#e65100" } }}
          >
            Return to Fullscreen
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Window-switch (Alt+Tab) warning dialog ─────────────────── */}
      <Dialog
        open={windowSwitchWarningOpen}
        disableEscapeKeyDown
        aria-labelledby="ws-warning-title"
        className="clean-dialog"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="ws-warning-title">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WarningAmberIcon sx={{ color: "#f57c00" }} />
            Window Switch Detected — Warning {windowSwitchCount} of{" "}
            {MAX_WINDOW_SWITCH_WARNINGS}
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            You switched away from the test window. This is warning{" "}
            <strong>{windowSwitchCount}</strong> of{" "}
            <strong>{MAX_WINDOW_SWITCH_WARNINGS}</strong>.
          </DialogContentText>
          <DialogContentText sx={{ color: "#d32f2f", mt: 1, fontWeight: 600 }}>
            {wsWarningsRemaining > 0
              ? `You have ${wsWarningsRemaining} warning${wsWarningsRemaining !== 1 ? "s" : ""} remaining before the test is automatically submitted.`
              : "This is your final warning. The test will be submitted on the next window switch."}
          </DialogContentText>
          <DialogContentText sx={{ mt: 1 }}>
            Please stay on the test window and do not switch to other
            applications.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setWindowSwitchWarningOpen(false)}
            color="warning"
            variant="contained"
            autoFocus
            className="clean-button"
            sx={{ background: "#f57c00", "&:hover": { background: "#e65100" } }}
          >
            I Understand, Continue Test
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Malpractice / confirm dialog ──────────────────────────── */}
      <Dialog
        open={dialog.open}
        onClose={() => {}}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        className="clean-dialog"
        disableEscapeKeyDown={
          dialog.type === "malpractice" || dialog.type === "warning"
        }
      >
        <DialogTitle id="alert-dialog-title">
          {dialog.type === "malpractice"
            ? "Malpractice Detected"
            : dialog.type === "error"
              ? "Error"
              : "Warning"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {dialog.message}
          </DialogContentText>
          {dialog.type === "malpractice" && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {dialog.type === "proceed" || dialog.type === "submit" ? (
            <>
              <Button
                onClick={() => setDialog({ open: false })}
                color="primary"
                className="clean-button"
              >
                Stay in MCQ
              </Button>
              <Button
                onClick={dialog.onConfirm}
                color="secondary"
                autoFocus
                className="clean-button"
              >
                {dialog.type === "proceed"
                  ? "Proceed to Coding"
                  : "Submit Test"}
              </Button>
            </>
          ) : dialog.type === "error" ? (
            <Button
              onClick={dialog.onConfirm}
              color="primary"
              autoFocus
              className="clean-button"
            >
              OK
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      {/* ── Instructions dialog ───────────────────────────────────── */}
      <Dialog
        open={instructionsDialogOpen}
        onClose={() => setInstructionsDialogOpen(false)}
        aria-labelledby="instructions-dialog-title"
        maxWidth="sm"
        fullWidth
        className="clean-dialog"
      >
        <DialogTitle id="instructions-title">Test Instructions</DialogTitle>
        <DialogContent>
          <Box component="ol" sx={{ pl: 3, mb: 0 }}>
            {instructions.map((instruction, index) => (
              <Typography
                key={index}
                component="li"
                variant="body1"
                sx={{ mb: 1 }}
              >
                {instruction}
              </Typography>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setInstructionsDialogOpen(false)}
            color="primary"
            autoFocus
            className="clean-button"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="header">
        <div className="header-content">
          <div className="header-left">
            <Typography variant="h6" className="test-title">
              {testData.test_name || "Test"}
            </Typography>
            <IconButton
              onClick={() => setInstructionsDialogOpen(true)}
              aria-label="View test instructions"
              className="info-button"
            >
              <InfoIcon />
            </IconButton>

            {/* Fullscreen warning badge */}
            {fullscreenExitCount > 0 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  ml: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  background: fullscreenExitCount >= 4 ? "#d32f2f" : "#f57c00",
                  color: "#fff",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                <WarningAmberIcon sx={{ fontSize: 16 }} />
                FS: {fullscreenExitCount}/{MAX_FULLSCREEN_WARNINGS}
              </Box>
            )}

            {/* Window-switch warning badge */}
            {windowSwitchCount > 0 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  ml: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  background: windowSwitchCount >= 4 ? "#d32f2f" : "#f57c00",
                  color: "#fff",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                }}
              >
                <WarningAmberIcon sx={{ fontSize: 16 }} />
                WS: {windowSwitchCount}/{MAX_WINDOW_SWITCH_WARNINGS}
              </Box>
            )}
          </div>

          <div className="header-right">
            <div className="timer-display">
              <TimerIcon className="timer-icon" />
              <span className="timer-text">{formatTime(timer)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="main-content">
        {/* Question card */}
        <div className="question-card">
          <div className="question-header">
            <Typography variant="h6" className="question-number">
              Question {currentQuestion + 1} of {mcqData.length}
            </Typography>
          </div>

          <div className="question-content">
            <Typography variant="body1" className="question-text">
              {mcqData[currentQuestion]?.mcq_question || "Loading question..."}
            </Typography>

            <Box
              sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}
            >
              <Chip
                label={
                  mcqData[currentQuestion]?.mcq_type === "multi"
                    ? "Multi Select"
                    : "Single Select"
                }
                size="small"
                sx={{
                  background:
                    mcqData[currentQuestion]?.mcq_type === "multi"
                      ? "#fc7a46"
                      : "#0c83c8",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.72rem",
                }}
              />
              {mcqData[currentQuestion]?.mcq_type === "multi" && (
                <Typography variant="caption" color="text.secondary">
                  Select all that apply
                </Typography>
              )}
            </Box>

            <div className="options-group">
              {(mcqData[currentQuestion]?.mcq_options || []).map(
                (option, index) => {
                  const isMulti =
                    mcqData[currentQuestion]?.mcq_type === "multi";
                  const isSelected =
                    progress[currentQuestion]?.selected_options?.includes(
                      option,
                    ) || false;

                  return (
                    <div
                      key={index}
                      className={`option-item ${isSelected ? "selected" : ""}`}
                      onClick={() => handleOptionClick(option)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleOptionClick(option);
                        }
                      }}
                    >
                      <FormControlLabel
                        value={option}
                        control={
                          isMulti ? (
                            <Checkbox
                              className="custom-checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              onClick={(e) => e.stopPropagation()}
                              tabIndex={-1}
                              sx={{
                                color: "#0c83c8",
                                "&.Mui-checked": { color: "#0c83c8" },
                              }}
                            />
                          ) : (
                            <Radio
                              className="custom-radio"
                              checked={isSelected}
                              onChange={() => {}}
                              onClick={(e) => e.stopPropagation()}
                              tabIndex={-1}
                            />
                          )
                        }
                        label={option}
                        className="option-label"
                      />
                    </div>
                  );
                },
              )}
            </div>
          </div>

          <div className="question-actions">
            <Button
              variant="outlined"
              onClick={handleMarkQuestion}
              startIcon={<FlagIcon />}
              className="clean-button mark-button"
            >
              {progress[currentQuestion]?.marked ? "Unmark" : "Mark for Review"}
            </Button>

            <div className="navigation-buttons">
              {currentQuestion > 0 && (
                <Button
                  variant="outlined"
                  onClick={() => handleQuestionNavigation(currentQuestion - 1)}
                  className="clean-button nav-button"
                >
                  Previous
                </Button>
              )}
              {currentQuestion < mcqData.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={() => handleQuestionNavigation(currentQuestion + 1)}
                  endIcon={<ArrowIcon />}
                  className="clean-button nav-button primary"
                >
                  Next
                </Button>
              ) : (
                isLastQuestionAnswered && (
                  <Button
                    variant="contained"
                    onClick={
                      testData.test_coding_id?.length > 0
                        ? handleProceedToCoding
                        : handleSubmitTestWithWarning
                    }
                    endIcon={<ArrowIcon />}
                    className="clean-button proceed-button"
                  >
                    Proceed
                  </Button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Info / sidebar card */}
        <div className="info-card">
          <div className="student-info">
            <Typography variant="h6" className="student-name">
              {studentName}
            </Typography>
          </div>

          <div className="charts-container">
            <div className="chart-item">
              <Typography variant="subtitle2" className="chart-label">
                Progress
              </Typography>
              <PieChart data={pieChartData} />
            </div>
            <div className="chart-item">
              <Typography variant="subtitle2" className="chart-label">
                Time
              </Typography>
              <CircularTimer timeLeft={timer} totalTime={totalTime} />
            </div>
          </div>

          <Divider className="section-divider" />

          <QuestionNavigator
            progress={progress}
            currentQuestion={currentQuestion}
            onQuestionSelect={handleQuestionNavigation}
          />

          <div className="final-actions">
            <Button
              variant="contained"
              onClick={handleSubmitTestWithWarning}
              fullWidth
              className="clean-button submit-button"
            >
              Submit Test
            </Button>
            {testData.test_coding_id?.length > 0 && (
              <Button
                variant="contained"
                onClick={handleProceedToCoding}
                endIcon={<ArrowIcon />}
                fullWidth
                className="clean-button coding-button"
              >
                Proceed to Coding
              </Button>
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default McqPage;