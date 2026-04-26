import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Divider,
  Grid,
  Box,
  Chip,
  CircularProgress,
  Paper,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Language as LanguageIcon,
  EmojiEvents as ScoreIcon,
  ArrowForward as ArrowIcon,
  ArrowBack as ArrowBackIcon,
  Quiz as QuizIcon,
  Code as CodeIcon,
  CheckCircleOutline as CheckIcon,
  LockClock as LockIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { getTestById } from "../axios";
import "../styles/TestDetails.css";

// ── MUI theme (typography + palette only — layout/shape via CSS) ──────────────
const theme = createTheme({
  typography: {
    fontFamily: ["Inter", "Roboto", '"Segoe UI"', "Arial", "sans-serif"].join(","),
    h1:       { fontWeight: 700, letterSpacing: "-0.01em" },
    h4:       { fontWeight: 700, letterSpacing: "-0.01em" },
    h6:       { fontWeight: 600, letterSpacing: "-0.01em" },
    button:   { fontWeight: 600, letterSpacing: "0.02em", textTransform: "none" },
    subtitle1:{ fontWeight: 500 },
    body1:    { lineHeight: 1.6 },
  },
  palette: {
    primary:   { main: "#0c83c8", light: "#3a9bd7", dark: "#096ba3" },
    secondary: { main: "#fc7a46", light: "#fd9469", dark: "#e56a3a" },
    background:{ default: "#f5f7fa" },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8, padding: "10px 24px", boxShadow: "none" } } },
    MuiCard:   { styleOverrides: { root: { borderRadius: 16, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" } } },
    MuiChip:   { styleOverrides: { root: { fontWeight: 500, borderRadius: 6 } } },
    MuiAlert:  { styleOverrides: { root: { fontFamily: "'Inter','Helvetica','Arial',sans-serif !important", borderRadius: 8 } } },
    MuiSnackbar: {
      styleOverrides: {
        root: { "& .MuiAlert-root": { fontFamily: "'Inter','Helvetica','Arial',sans-serif !important" } },
      },
    },
  },
});

// ── Component ─────────────────────────────────────────────────────────────────
const TestDetails = () => {
  const { testId } = useParams();
  const navigate   = useNavigate();
  const [testData,          setTestData]          = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [isFullscreen,      setIsFullscreen]      = useState(false);
  const [snackbarOpen,      setSnackbarOpen]      = useState(false);
  const [snackbarMessage,   setSnackbarMessage]   = useState("");
  const [snackbarSeverity,  setSnackbarSeverity]  = useState("success");

  const isSmallScreen  = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    localStorage.setItem("test_id", testId);

    const fetchTestData = async () => {
      try {
        setLoading(true);
        const data = await getTestById(testId);
        setTestData(data);
      } catch (err) {
        console.error("Failed to fetch test data:", err);
        setSnackbarMessage("Failed to fetch test data.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();

    const handlePopState = () => {
      window.history.pushState(null, null, window.location.pathname);
      setSnackbarMessage("Navigation back is disabled during the test.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [testId]);

  const hasMcq       = testData?.test_mcq_id    && testData.test_mcq_id.length    > 0;
  const hasCoding    = testData?.test_coding_id && testData.test_coding_id.length > 0;
  const isTestActive = testData?.status === "active";

  const getFirstComponentPath = () => {
    if (hasMcq)    return `/mcq/${testId}`;
    if (hasCoding) return `/coding/${testData.test_coding_id[0]}`;
    return null;
  };

  const handleProceed = async () => {
    if (!isTestActive) {
      setSnackbarMessage("This test is currently disabled. Please try again later.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const firstComponentPath = getFirstComponentPath();
    if (!firstComponentPath) {
      setSnackbarMessage("No test components found.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    try {
      const mcqCount    = testData.test_mcq_id?.length    || 0;
      const codingCount = testData.test_coding_id?.length || 0;
      const totalTime   = (mcqCount * 60) + (codingCount * 600);

      if (totalTime > 0) {
        localStorage.setItem("test_timer", totalTime.toString());
      } else {
        setSnackbarMessage("No valid test components to set timer.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }

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
        setSnackbarMessage("Fullscreen mode not supported by your browser. The test requires fullscreen.");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
        return;
      }

      window.history.replaceState(null, null, firstComponentPath);
      window.history.pushState(null, null, firstComponentPath);
      window.history.pushState(null, null, firstComponentPath);
      navigate(firstComponentPath);
    } catch (err) {
      console.error("Fullscreen request failed:", err);
      setIsFullscreen(false);
      setSnackbarMessage("Failed to enter fullscreen mode. Please allow fullscreen and try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleBack         = () => window.history.back();
  const handleSnackbarClose = () => setSnackbarOpen(false);

  const getButtonText = () => {
    if (!isTestActive) return "Test Disabled";
    if (hasMcq)        return "Proceed to MCQ";
    if (hasCoding)     return "Proceed to Coding";
    return "No Components Available";
  };

  const getTestOverviewText = () => {
    let description = `This assessment is designed to evaluate your proficiency in ${testData.test_language}.`;
    if (hasMcq && hasCoding)      description += " The test consists of multiple-choice questions and coding challenges.";
    else if (hasMcq)              description += " The test consists of multiple-choice questions.";
    else if (hasCoding)           description += " The test consists of coding challenges.";
    description += " The test is timed, and your performance will be scored based on accuracy and completion time.";
    return description;
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="td-loading-container">
          <CircularProgress
            size={48}
            thickness={4}
            sx={{ color: theme.palette.primary.main, animationDuration: "1.2s" }}
          />
          <Typography variant="subtitle1" className="td-loading-text">
            Loading test details...
          </Typography>
        </div>
      </ThemeProvider>
    );
  }

  // ── No-data / error state ───────────────────────────────────────────────────
  if (!testData) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className={`td-page-wrapper${isSmallScreen ? " td-page-wrapper--small" : ""}`}>
          <Paper elevation={2} className="td-error-paper">
            <Typography variant="h6" gutterBottom className="td-error-title">
              Unable to load test details
            </Typography>
            <Typography variant="body1" paragraph className="td-error-body">
              We couldn't retrieve the test details. Please check your connection and try again.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => window.location.reload()}
              className="td-btn td-btn--back"
              sx={{ mt: 2 }}
            >
              Retry
            </Button>
          </Paper>
        </div>
      </ThemeProvider>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          className="td-alert"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Page wrapper */}
      <div className={`td-page-wrapper${isSmallScreen ? " td-page-wrapper--small" : ""}`}>

        {/* Main card */}
        <Card className="td-card" sx={{ width: "100%", maxWidth: 800 }}>

          {/* Gradient color bar */}
          <div className="td-color-bar" />

          {/* Card body */}
          <div className={`td-card-body${isSmallScreen ? " td-card-body--small" : ""}`}>

            {/* Header: label chip + test name + status chip */}
            <div className="td-header-row">
              <Box>
                <Chip
                  label="Test Details"
                  size="small"
                  className="td-label-chip"
                  sx={{ mb: 1.5 }}
                />
                <Typography
                  variant={isSmallScreen ? "h5" : "h4"}
                  component="h1"
                  gutterBottom
                  className="td-test-name"
                >
                  {testData.test_name}
                </Typography>
              </Box>
              <Chip
                label={testData.status === "active" ? "Active" : "Disabled"}
                size="small"
                className={
                  testData.status === "active"
                    ? "td-status-chip--active"
                    : "td-status-chip--disabled"
                }
                icon={testData.status === "active" ? <CheckIcon /> : <LockIcon />}
              />
            </div>

            {/* Card content */}
            <CardContent sx={{ p: 0 }}>

              {/* Info row: Language + Total Score */}
              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} className="td-info-card">
                    <div className="td-icon-wrapper">
                      <LanguageIcon />
                    </div>
                    <Box>
                      <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                        Language
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {testData.test_language}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} className="td-info-card">
                    <div className="td-icon-wrapper">
                      <ScoreIcon />
                    </div>
                    <Box>
                      <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                        Total Score
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {testData.test_total_score} points
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* Test Components heading */}
              <Typography variant="h6" gutterBottom className="td-section-heading">
                Test Components
              </Typography>

              {/* MCQ + Coding cards */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} className="td-info-card" sx={{ opacity: hasMcq ? 1 : 0.7 }}>
                    <div className="td-icon-wrapper">
                      <QuizIcon />
                    </div>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                        MCQ Questions
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {testData.test_mcq_id?.length || 0} questions
                        </Typography>
                        {hasMcq ? (
                          <Chip
                            size="small"
                            label="Included"
                            className="td-chip--included"
                            icon={<CheckIcon style={{ fontSize: 16 }} />}
                            sx={{ ml: 1 }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            label="Not Included"
                            className="td-chip--not-included"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={0} className="td-info-card" sx={{ opacity: hasCoding ? 1 : 0.7 }}>
                    <div className="td-icon-wrapper td-icon-wrapper--secondary">
                      <CodeIcon />
                    </div>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ display: "block" }}>
                        Coding Tasks
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {testData.test_coding_id?.length || 0} tasks
                        </Typography>
                        {hasCoding ? (
                          <Chip
                            size="small"
                            label="Included"
                            className="td-chip--included"
                            icon={<CheckIcon style={{ fontSize: 16 }} />}
                            sx={{ ml: 1 }}
                          />
                        ) : (
                          <Chip
                            size="small"
                            label="Not Included"
                            className="td-chip--not-included"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              {/* Test Overview */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom className="td-section-heading" sx={{ mb: 2 }}>
                  Test Overview
                </Typography>
                <Typography variant="body1" color="textSecondary" paragraph className="td-overview-text">
                  {getTestOverviewText()}
                </Typography>

                {!isTestActive && (
                  <div className="td-disabled-banner">
                    <ErrorIcon color="error" fontSize="small" />
                    <Typography variant="body2" className="td-disabled-banner-text">
                      This test is currently disabled and not available for taking. Please check back later or contact the administrator.
                    </Typography>
                  </div>
                )}

                {(hasMcq || hasCoding) ? (
                  <Typography variant="body1" color="textSecondary" className="td-hint-text" sx={{ mb: -3 }}>
                    {isTestActive
                      ? `Click "${getButtonText()}" to begin the assessment. The test will open in fullscreen mode.`
                      : "The test is currently disabled and cannot be started."}
                  </Typography>
                ) : (
                  <Typography variant="body1" className="td-hint-text td-hint-text--error" sx={{ mb: 0.5 }}>
                    No test components found. Please contact the administrator.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </div>

          <Divider />

          {/* Card actions footer */}
          <CardActions
            className={`td-card-actions${isSmallScreen ? " td-card-actions--small" : ""}`}
          >
            {/* Back button */}
            <Button
              variant="outlined"
              color="primary"
              onClick={handleBack}
              startIcon={<ArrowBackIcon className="td-btn-start-icon" />}
              className="td-btn td-btn--back"
            >
              Back
            </Button>

            {/* Proceed button */}
            <Tooltip
              title={!isTestActive ? "This test is currently disabled" : ""}
              placement="top"
              disableHoverListener={isTestActive}
            >
              <span>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleProceed}
                  endIcon={isTestActive ? <ArrowIcon className="td-btn-end-icon" /> : <LockIcon className="td-btn-end-icon" />}
                  disableElevation
                  disabled={!isTestActive || (!hasMcq && !hasCoding)}
                  className="td-btn td-btn--proceed"
                >
                  {getButtonText()}
                </Button>
              </span>
            </Tooltip>
          </CardActions>

        </Card>
      </div>
    </ThemeProvider>
  );
};

export default TestDetails;