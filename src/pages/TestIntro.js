"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
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
  Tooltip,
  IconButton,
} from "@mui/material"
import {
  Language as LanguageIcon,
  EmojiEvents as ScoreIcon,
  ArrowForward as ArrowIcon,
  Info as InfoIcon,
  CheckCircleOutline as CheckIcon,
  ArrowBack as PreviousIcon,
  ArrowForward as NextIcon,
} from "@mui/icons-material"
import { getTestById, fetchTestsToday, checkIfTestTaken } from "../axios"
import { useSwipeable } from "react-swipeable"
import "../styles/TestIntro.css"

// ── MUI Theme (typography, palette, shape, component shape overrides only) ──
const theme = createTheme({
  typography: {
    fontFamily: ["Inter", "Roboto", '"Segoe UI"', "Arial", "sans-serif"].join(","),
    h1: { fontWeight: 700, letterSpacing: "-0.01em" },
    h4: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 600, letterSpacing: "-0.01em" },
    button: { fontWeight: 600, letterSpacing: "0.02em", textTransform: "none" },
    subtitle1: { fontWeight: 500 },
    body1: { lineHeight: 1.6 },
  },
  palette: {
    primary: { main: "#0c83c8", light: "#3a9bd7", dark: "#096ba3" },
    secondary: { main: "#fc7a46", light: "#fd9469", dark: "#e56a3a" },
    background: { default: "#f5f7fa" },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8, padding: "10px 24px", boxShadow: "none" } } },
    MuiCard:   { styleOverrides: { root: { borderRadius: 16, boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)" } } },
    MuiChip:   { styleOverrides: { root: { fontWeight: 500, borderRadius: 6 } } },
  },
  responsiveFontSizes: {
    h4:    { xs: "1.5rem",   sm: "1.75rem", md: "2rem" },
    h5:    { xs: "1.25rem",  sm: "1.4rem",  md: "1.5rem" },
    h6:    { xs: "1.1rem",   sm: "1.15rem", md: "1.25rem" },
    body1: { xs: "0.875rem", sm: "0.9rem",  md: "1rem" },
    body2: { xs: "0.8rem",   sm: "0.825rem",md: "0.875rem" },
  },
})

// ── Responsive font size hook ────────────────────────────────────────────────
const useResponsiveFont = (variant) => {
  const isXs = useMediaQuery(theme.breakpoints.only("xs"))
  const isSm = useMediaQuery(theme.breakpoints.only("sm"))

  if (!theme.responsiveFontSizes || !theme.responsiveFontSizes[variant]) return {}
  if (isXs) return { fontSize: theme.responsiveFontSizes[variant].xs }
  if (isSm) return { fontSize: theme.responsiveFontSizes[variant].sm }
  return { fontSize: theme.responsiveFontSizes[variant].md }
}

// ── Component ────────────────────────────────────────────────────────────────
const TestIntro = () => {
  const { testId } = useParams()
  const navigate = useNavigate()
  const [testsData, setTestsData] = useState([])
  const [selectedTestId, setSelectedTestId] = useState(testId || "")
  const [selectedTestData, setSelectedTestData] = useState(null)
  const [hasTakenTest, setHasTakenTest] = useState(false)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [error, setError] = useState(null)

  const [swipeDirection, setSwipeDirection] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [touchStartX, setTouchStartX] = useState(0)
  const [currentSwipeOffset, setCurrentSwipeOffset] = useState(0)

  const swipeConfig = {
    delta: 10,
    preventDefaultTouchmoveEvent: false,
    trackTouch: true,
    trackMouse: true,
    rotationAngle: 0,
  }

  const isXsScreen    = useMediaQuery(theme.breakpoints.down("xs"))
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"))
  const isMediumScreen= useMediaQuery(theme.breakpoints.down("md"))
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("lg"))
  const isLandscape   = useMediaQuery("(orientation: landscape) and (max-height: 500px)")

  const h4FontStyles   = useResponsiveFont("h4")
  const h5FontStyles   = useResponsiveFont("h5")
  const h6FontStyles   = useResponsiveFont("h6")
  const body1FontStyles= useResponsiveFont("body1")

  // ── Helpers ────────────────────────────────────────────────────────────────
  const withTimeout = (promise, ms = 10000) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), ms)
      ),
    ])

  const CACHE_KEY = "tests_today_cache"
  const CACHE_TTL = 5 * 60 * 1000

  const getCachedData = () => {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_TTL && Array.isArray(data)) {
          console.log("Using cached test data:", data)
          return data
        }
      } catch (error) {
        console.error("Invalid cache data, clearing cache:", error)
        localStorage.removeItem(CACHE_KEY)
      }
    }
    return null
  }

  const setCachedData = (data) => {
    if (Array.isArray(data)) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
      console.log("Cached test data:", data)
    }
  }

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchUserData = () => {
      const storedUser = localStorage.getItem("true")
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          const pocId = userData?.user?.mod_poc_id?.mod_poc_id || null
          const userId = userData?.user?.user_id || null
          if (!pocId || !userId) {
            console.error("No valid POC ID or User ID found in user data:", userData)
            setError("Invalid user session: Missing POC ID or User ID")
            setLoading(false)
            return null
          }
          console.log("Fetched POC ID:", pocId, "User ID:", userId)
          setUserId(userId)
          return pocId
        } catch (error) {
          console.error("Error parsing user data:", error)
          setError("Failed to parse user data")
          setLoading(false)
          return null
        }
      }
      console.error("No user session found in localStorage")
      setError("No user session found")
      setLoading(false)
      return null
    }

    const fetchTests = async () => {
      const pocId = fetchUserData()
      if (!pocId) return

      try {
        let activeTests = getCachedData()
        if (!activeTests) {
          console.log("Fetching tests for POC ID:", pocId)
          const testsData = await withTimeout(fetchTestsToday(pocId))
          console.log("Today's tests data:", testsData)

          if (testsData && typeof testsData === "object" && Array.isArray(testsData.test_ids)) {
            activeTests = []
            const testDetailsPromises = testsData.test_ids.map(async (testId) => {
              try {
                const testDetails = await withTimeout(getTestById(testId))
                console.log(`Test details for ${testId}:`, testDetails)
                if (testDetails?.status === "active") return testDetails
                console.warn(`Test ${testId} is not active or invalid:`, testDetails)
                return null
              } catch (err) {
                console.error(`Failed to fetch details for test ${testId}:`, err.message)
                return null
              }
            })

            const testDetails = await Promise.all(testDetailsPromises)
            activeTests = testDetails.filter((test) => test !== null)

            if (testId && !testsData.test_ids.includes(testId)) {
              try {
                const testDetails = await withTimeout(getTestById(testId))
                console.log(`Fallback test data for ${testId}:`, testDetails)
                if (testDetails?.status === "active") {
                  activeTests.push(testDetails)
                } else {
                  console.warn(`Fallback test ${testId} is not active or invalid:`, testDetails)
                }
              } catch (err) {
                console.error(`Failed to fetch fallback test ${testId}:`, err.message)
              }
            }

            setCachedData(activeTests)
          } else {
            console.error("Expected test_ids array in response:", testsData)
            setError("Invalid server response: Expected test_ids array")
            activeTests = []
          }
        }

        setTestsData(activeTests)

        if (activeTests.length > 0) {
          const selected = activeTests.find((test) => test.test_id === testId) || activeTests[0]
          setSelectedTestId(selected.test_id)
          setSelectedTestData(selected)
          navigate(`/test-intro/${selected.test_id}`, { replace: true })
        } else {
          setError("No active tests available for today")
        }
      } catch (error) {
        console.error("Error fetching tests:", error.message)
        setError("Failed to fetch tests: " + error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTests()

    const timeoutId = setTimeout(() => {
      setLoadingTimeout(true)
    }, 15000)

    return () => clearTimeout(timeoutId)
  }, [testId, navigate])

  useEffect(() => {
    const checkTestStatus = async () => {
      if (userId && selectedTestId) {
        try {
          const result = await withTimeout(checkIfTestTaken(userId, selectedTestId))
          console.log(`Check Test Response for ${selectedTestId}:`, result)
          setHasTakenTest(result.length > 0)
        } catch (error) {
          console.error(`Error checking test status for ${selectedTestId}:`, error)
          setHasTakenTest(false)
        }
      }
    }
    checkTestStatus()
  }, [userId, selectedTestId])

  // ── Swipe handlers ─────────────────────────────────────────────────────────
  const handleSwipeStart = (eventData) => {
    if (testsData.length <= 1) return
    setTouchStartX(eventData.initial[0])
  }

  const handleSwipeMove = (eventData) => {
    if (testsData.length <= 1 || isTransitioning) return
    const currentX = eventData.event.touches
      ? eventData.event.touches[0].clientX
      : eventData.event.clientX
    const diff = currentX - touchStartX
    const maxOffset = 100
    setCurrentSwipeOffset(Math.max(-maxOffset, Math.min(maxOffset, diff * 0.5)))
    if (Math.abs(diff) > 50) {
      setSwipeDirection(diff > 0 ? "prev" : "next")
    } else {
      setSwipeDirection(null)
    }
  }

  const handleSwipeEnd = () => {
    setCurrentSwipeOffset(0)
    setSwipeDirection(null)
  }

  const handleSwipedLeft = () => {
    if (testsData.length <= 1 || isTransitioning) return
    handleTestNavigation("next")
  }

  const handleSwipedRight = () => {
    if (testsData.length <= 1 || isTransitioning) return
    handleTestNavigation("previous")
  }

  const swipeHandlers = useSwipeable({
    onSwipeStart: handleSwipeStart,
    onSwiping: handleSwipeMove,
    onSwipedLeft: handleSwipedLeft,
    onSwipedRight: handleSwipedRight,
    onSwipedUp: () => {},
    onSwipedDown: () => {},
    onTouchEndOrOnMouseUp: handleSwipeEnd,
    ...swipeConfig,
  })

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleTestNavigation = (direction) => {
    if (isTransitioning) return
    const currentIndex = testsData.findIndex((test) => test.test_id === selectedTestId)
    const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1

    if (newIndex >= 0 && newIndex < testsData.length) {
      setIsTransitioning(true)
      const newTest = testsData[newIndex]
      setTimeout(() => {
        setSelectedTestId(newTest.test_id)
        setSelectedTestData(newTest)
        navigate(`/test-intro/${newTest.test_id}`)
        setTimeout(() => setIsTransitioning(false), 300)
      }, 150)
    }
  }

  const handleDotNavigation = (index) => {
    if (isTransitioning || index === currentIndex) return
    const newTest = testsData[index]
    setIsTransitioning(true)
    setTimeout(() => {
      setSelectedTestId(newTest.test_id)
      setSelectedTestData(newTest)
      navigate(`/test-intro/${newTest.test_id}`)
      setTimeout(() => setIsTransitioning(false), 300)
    }, 150)
  }

  const handleStart = () => {
    if (!hasTakenTest) navigate(`/test-details/${selectedTestId}`)
  }

  const handleBack = () => navigate("/landing")

  // ── Responsive helper ──────────────────────────────────────────────────────
  const getResponsiveValue = (breakpoints) => {
    if (isXsScreen    && "xs"  in breakpoints) return breakpoints.xs
    if (isSmallScreen && "sm"  in breakpoints) return breakpoints.sm
    if (isMediumScreen&& "md"  in breakpoints) return breakpoints.md
    if (isLargeScreen && "lg"  in breakpoints) return breakpoints.lg
    return breakpoints.default
  }

  // ── Instructions ───────────────────────────────────────────────────────────
  const mcqInstructions = [
    "Read each question carefully before answering.",
    "Select one option for each multiple-choice question.",
    "Use the 'Mark for Review' button to revisit questions later.",
    "Click 'Next' to move to the next question or 'Previous' to go back.",
    "Do not refresh the page or navigate away, as this will submit the test.",
    "Ensure you remain in fullscreen mode throughout the test.",
    "Any attempt to copy, paste, open developer tools, or switch tabs will result in immediate test submission.",
    "Submit the test when you are ready, or proceed to the coding section if applicable.",
  ]

  const codingInstructions = [
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
  ]

  const getInstructions = () => {
    if (!selectedTestData) return []
    const hasMcq    = selectedTestData.test_mcq_id    && selectedTestData.test_mcq_id.length > 0
    const hasCoding = selectedTestData.test_coding_id && selectedTestData.test_coding_id.length > 0
    if (hasMcq && hasCoding) return [...mcqInstructions, ...codingInstructions]
    if (hasMcq)    return mcqInstructions
    if (hasCoding) return codingInstructions
    return []
  }

  // ── Render: Loading ────────────────────────────────────────────────────────
  const renderLoading = () => (
    <Box className="ti-loading-container">
      <CircularProgress
        size={48}
        thickness={4}
        className="ti-loading-spinner"
        sx={{ color: theme.palette.primary.main, animationDuration: "1.2s" }}
      />
      <Typography variant="subtitle1" color="textSecondary" className="ti-loading-text">
        Loading test information...
      </Typography>
      {loadingTimeout && (
        <Typography
          variant="body2"
          sx={{ color: theme.palette.warning.main, mt: 1, textAlign: "center", maxWidth: 300 }}
        >
          Taking longer than expected? Contact support at support@example.com.
        </Typography>
      )}
    </Box>
  )

  // ── Render: Error ──────────────────────────────────────────────────────────
  const renderError = () => (
    <Box
      className="ti-error-wrapper"
      p={isSmallScreen ? 2 : 4}
    >
      <Paper elevation={2} className="ti-error-paper">
        <Box sx={{ mb: 2, display: "flex", justifyContent: "center" }}>
          <Box className="ti-error-icon-box">
            <InfoIcon color="error" sx={{ fontSize: 32 }} />
          </Box>
        </Box>
        <Typography variant="h6" gutterBottom>
          Unable to load test information
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          {error || "We couldn't retrieve the test details. Please check your connection and try again."}
        </Typography>
        <Box className="ti-error-actions">
          <Button
            variant="outlined"
            color="primary"
            className="ti-animated-btn ti-animated-btn--primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            className="ti-animated-btn"
            onClick={() => navigate("/student-dashboard")}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Box>
  )

  // ── Early returns ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {renderLoading()}
      </ThemeProvider>
    )
  }

  if (error || !testsData.length || !selectedTestData) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {renderError()}
      </ThemeProvider>
    )
  }

  const currentIndex = testsData.findIndex((test) => test.test_id === selectedTestId)
  const isFirstTest  = currentIndex === 0
  const isLastTest   = currentIndex === testsData.length - 1

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Page wrapper */}
      <Box
        className={[
          "ti-page-wrapper",
          isSmallScreen  ? "ti-page-wrapper--small"     : "",
          isLandscape    ? "ti-page-wrapper--landscape"  : "",
        ].join(" ")}
      >
        {/* Carousel container (swipeable) */}
        <Box
          {...swipeHandlers}
          className="ti-carousel-container"
        >
          {/* Left swipe indicator */}
          <Box
            className={[
              "ti-swipe-indicator",
              "ti-swipe-indicator--left",
              swipeDirection === "prev" && !isFirstTest ? "ti-swipe-indicator--visible" : "",
            ].join(" ")}
          >
            <PreviousIcon />
          </Box>

          {/* Right swipe indicator */}
          <Box
            className={[
              "ti-swipe-indicator",
              "ti-swipe-indicator--right",
              swipeDirection === "next" && !isLastTest ? "ti-swipe-indicator--visible" : "",
            ].join(" ")}
          >
            <NextIcon />
          </Box>

          {/* Animated card (slides on swipe) */}
          <Card
            className="ti-animated-card"
            style={{
              transform: `translateX(${currentSwipeOffset}px)`,
              transition: currentSwipeOffset === 0 ? "transform 0.3s ease" : "none",
            }}
          >
            {/* Top color bar */}
            <Box className="ti-color-bar" />

            {/* Card body */}
            <Box className={isSmallScreen ? "ti-card-body ti-card-body--small" : "ti-card-body"}>

              {/* Top row: chip + title + nav buttons */}
              <Box className="ti-card-top-row">
                <Box>
                  <Chip
                    label={`Assessment ${currentIndex + 1} of ${testsData.length}`}
                    size="small"
                    className="ti-assessment-chip"
                  />
                  <Typography
                    variant={isSmallScreen ? "h5" : "h4"}
                    component="h1"
                    gutterBottom
                    className="ti-test-title"
                    style={isSmallScreen ? h5FontStyles : h4FontStyles}
                  >
                    {selectedTestData.test_name}
                  </Typography>
                </Box>

                {testsData.length > 1 && (
                  <Box className="ti-nav-buttons">
                    <Tooltip title="Previous Test">
                      <span>
                        <IconButton
                          className="ti-icon-button"
                          onClick={() => handleTestNavigation("previous")}
                          disabled={isFirstTest || isTransitioning}
                        >
                          <PreviousIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Next Test">
                      <span>
                        <IconButton
                          className="ti-icon-button"
                          onClick={() => handleTestNavigation("next")}
                          disabled={isLastTest || isTransitioning}
                        >
                          <NextIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                )}
              </Box>

              {/* Card content: info cards + instructions */}
              <CardContent sx={{ p: 0, mb: 3 }}>
                {/* Info cards grid */}
                <Grid container spacing={isSmallScreen ? 1 : 2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      className={[
                        "ti-info-card",
                        isXsScreen ? "ti-info-card--xs" : "",
                      ].join(" ")}
                    >
                      <Box
                        className={[
                          "ti-icon-wrapper",
                          isXsScreen ? "ti-icon-wrapper--mb" : "",
                        ].join(" ")}
                      >
                        <LanguageIcon />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Language
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {selectedTestData.test_language || "Unknown"}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={0}
                      className={[
                        "ti-info-card",
                        isXsScreen ? "ti-info-card--xs" : "",
                      ].join(" ")}
                    >
                      <Box
                        className={[
                          "ti-icon-wrapper",
                          isXsScreen ? "ti-icon-wrapper--mb" : "",
                        ].join(" ")}
                      >
                        <ScoreIcon />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Total Score
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {selectedTestData.test_total_score || 0} points
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Instructions */}
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" className="ti-instructions-heading">
                    Instructions
                  </Typography>

                  <Box className="ti-scrollable-list">
                    <List disablePadding>
                      {getInstructions().map((instruction, index) => (
                        <ListItem key={index} disableGutters className="ti-instruction-item">
                          <Box className="ti-instruction-number">{index + 1}</Box>
                          <ListItemText
                            primary={instruction}
                            primaryTypographyProps={{ variant: "body1", sx: { fontWeight: 400 } }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Box>
              </CardContent>
            </Box>

            <Divider />

            {/* Card actions footer */}
            <CardActions
              className={[
                "ti-card-actions",
                isSmallScreen ? "ti-card-actions--small" : "",
              ].join(" ")}
            >
              {/* Left: Back button */}
              <Box
                className={[
                  "ti-actions-left",
                  isSmallScreen ? "ti-actions-left--full" : "",
                ].join(" ")}
              >
                <Button
                  variant="outlined"
                  color="primary"
                  className={[
                    "ti-animated-btn",
                    "ti-animated-btn--primary",
                    "ti-back-btn",
                    isSmallScreen ? "ti-back-btn--full" : "",
                  ].join(" ")}
                  onClick={handleBack}
                >
                  Back to Dashboard
                </Button>
              </Box>

              {/* Right: status + start button */}
              <Box
                className={[
                  "ti-actions-right",
                  isSmallScreen ? "ti-actions-right--space-between" : "",
                ].join(" ")}
              >
                <Box className="ti-status-label">
                  <CheckIcon fontSize="small" className="ti-status-icon" />
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                    {hasTakenTest ? "Test completed" : "Ready to begin"}
                  </Typography>
                </Box>

                <Tooltip title={hasTakenTest ? "You have already taken this test" : ""}>
                  <span>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleStart}
                      endIcon={<ArrowIcon />}
                      disableElevation
                      disabled={hasTakenTest}
                      className={[
                        "ti-animated-btn",
                        "ti-animated-btn--primary",
                        "ti-start-btn",
                        isSmallScreen ? "ti-start-btn--small" : "",
                      ].join(" ")}
                    >
                      Start Test
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </CardActions>

            {/* Progress dots */}
            <Box className="ti-progress-dots">
              {testsData.map((_, index) => (
                <Box
                  key={index}
                  className={[
                    "ti-progress-dot",
                    index === currentIndex ? "ti-progress-dot--active" : "",
                  ].join(" ")}
                  onClick={() => handleDotNavigation(index)}
                />
              ))}
            </Box>
          </Card>
        </Box>
      </Box>
    </ThemeProvider>
  )
}

export default TestIntro