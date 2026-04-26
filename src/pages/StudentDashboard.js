/**
 * StudentDashboard.js
 * Styles are now in StudentDashboard.css using CSS token variables.
 * Only the conic-gradient (which needs the JS courseProgress value)
 * remains as a partial inline style — everything else uses className.
 */

import React, { useState, useEffect, useRef } from "react";
import { BookOpen, FileText } from "lucide-react";
import AssessmentScores from "../components/StudentDashboard/AssessmentScores";
import UpcomingDeadlines from "../components/StudentDashboard/UpcomingDeadlines";
import {
  fetchAggregateScores,
  fetchModuleAndPoc,
  fetchExpertName,
  fetchModuleName,
  fetchOrgName,
  checkIfTestTaken,
  fetchTestsToday,
  fetchPocCertStatus,
} from "../axios";
import CourseInfoCards from "../components/StudentDashboard/CourseInfoCards";
import Dash from "../components/StudentDashboard/dash";
import { useNavigate } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import CertificateGenerator from "../components/certificate";
import "../styles/StudentDashboard.css";

/* ─── Helper: read a CSS token value for JS-only usage ─────────────────────
   Only needed for values that must live in JS (e.g. conic-gradient color). */
const token = (name, fallback = "") =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
  fallback;

export default function StudentDashboard() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [studentName, setStudentName] = useState("Loading...");
  const [coordinatorName, setCoordinatorName] = useState("Loading...");
  const [modId, setModId] = useState(null);
  const [pocId, setPocId] = useState(null);
  const [expertName, setExpertName] = useState("Loading...");
  const [moduleName, setModuleName] = useState("Loading...");
  const [orgName, setOrgName] = useState("Loading...");
  const [testIds, setTestIds] = useState([]);
  const [testStatuses, setTestStatuses] = useState({});
  const [userId, setUserId] = useState(null);
  const [courseProgress, setCourseProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canDownloadCertificate, setCanDownloadCertificate] = useState(false);
  const certificateRef = useRef(null);

  const navigate = useNavigate();

  /* ─── Data fetching ─────────────────────────────────────────────────── */
  useEffect(() => {
    const preserveKeys = ["true", "isLoggedIn"];
    Object.keys(localStorage).forEach((key) => {
      if (!preserveKeys.includes(key)) localStorage.removeItem(key);
    });

    window.history.replaceState(null, null, window.location.href);

    const storedUser = localStorage.getItem("true");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setStudentName(userData.user.full_name || "Student");
        setUserId(userData.user.user_id);
        setModId(userData.user.mod_poc_id.mod_id);
        setPocId(userData.user.mod_poc_id.mod_poc_id);

        if (userData?.user?.user_id && userData?.user?.mod_poc_id?.mod_poc_id) {
          fetchDashboardData(
            userData.user.user_id,
            userData.user.mod_poc_id.mod_id,
            userData.user.mod_poc_id.mod_poc_id
          );
        } else {
          setError("User session invalid");
          setIsLoading(false);
        }
      } catch {
        setError("Failed to load user data");
        setIsLoading(false);
      }
    } else {
      setError("Please log in");
      setIsLoading(false);
    }
  }, []);

  const fetchDashboardData = async (userId, modId, modPocId) => {
    try {
      setIsLoading(true);
      const modulePocData = await fetchModuleAndPoc(userId);
      setModId(modulePocData.mod_id || null);
      setPocId(modulePocData.mod_poc_id || null);
      setCoordinatorName(modulePocData.mod_poc_name || "Not assigned");

      const certStatus = await fetchPocCertStatus(modPocId);
      setCanDownloadCertificate(certStatus === true);

      if (modulePocData.mod_id) {
        const [expertData, moduleData, orgData] = await Promise.all([
          fetchExpertName(modulePocData.mod_id),
          fetchModuleName(modulePocData.mod_id),
          fetchOrgName(modulePocData.mod_id),
        ]);
        setExpertName(expertData.mod_expert_name || "Not assigned");
        setModuleName(moduleData.mod_name || "Unknown module");
        setOrgName(orgData.org_name || "Unknown organization");
      }

      if (userId && modulePocData.mod_poc_id) {
        await fetchCourseProgress(userId, modulePocData.mod_poc_id);
      }
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTodayTests = async (pocId, userId) => {
    try {
      const testsData = await fetchTestsToday(pocId);
      const tests = testsData.test_ids || [];
      if (tests.length > 0) {
        setTestIds(tests);
        const statusPromises = tests.map(async (testId) => {
          try {
            const result = await checkIfTestTaken(userId, testId);
            return { testId, hasTaken: result.length > 0 };
          } catch {
            return { testId, hasTaken: false };
          }
        });
        const statuses = await Promise.all(statusPromises);
        const statusMap = statuses.reduce((acc, { testId, hasTaken }) => {
          acc[testId] = hasTaken;
          return acc;
        }, {});
        setTestStatuses(statusMap);
      } else {
        setTestIds([]);
        setTestStatuses({});
      }
    } catch {
      setError("Failed to load today's tests");
      setTestIds([]);
      setTestStatuses({});
    }
  };

  const fetchCourseProgress = async (userId, modPocId) => {
    try {
      const response = await fetchAggregateScores(modPocId, userId);
      if (response.response?.average_percentage) {
        setCourseProgress(Math.floor(response.response.average_percentage));
      } else {
        setCourseProgress(0);
      }
    } catch {
      setCourseProgress(0);
    }
  };

  useEffect(() => {
    if (pocId && userId) fetchTodayTests(pocId, userId);
  }, [pocId, userId]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ─── Styles passed down to CourseInfoCards ─────────────────────────────
     CourseInfoCards receives a styles prop — keep these as objects so the
     child component works without changes. Tokens are still used here.   */
  const cardStyles = {
    statCard: { },         /* picks up .sd-stat-card via className in child  */
    iconWrapper: { },      /* picks up .sd-icon-wrapper                       */
    statTitle: { },        /* picks up .sd-stat-title                         */
    statValue: { },        /* picks up .sd-stat-value                         */
  };

  /* ─── Handlers ──────────────────────────────────────────────────────── */
  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  const handleTestModuleClick = () => {
    if (testIds.length === 0) {
      alert("No tests are scheduled for today. Please check back tomorrow or contact your coordinator.");
      return;
    }
    const allDone = testIds.every((id) => testStatuses[id] === true);
    if (allDone) {
      alert("You have completed all tests scheduled for today.");
      return;
    }
    const firstUncompleted = testIds.find((id) => !testStatuses[id]);
    navigate(`/test-intro/${firstUncompleted}`);
  };

  const handleDownloadCertificate = async () => {
    try {
      if (certificateRef.current) {
        await certificateRef.current.handleDownloadCertificate();
      } else {
        throw new Error("Certificate generator not initialized");
      }
    } catch {
      alert("Failed to generate certificate.");
    }
  };

  /* ─── Loading ───────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="sd-container">
        <Box className="sd-loading-container">
          <CircularProgress
            size={isMobile ? "60px" : "80px"}
            sx={{ color: "var(--brand-primary, #38b6ff)" }}
          />
        </Box>
      </div>
    );
  }

  /* ─── Error ─────────────────────────────────────────────────────────── */
  if (error) {
    return (
      <div className="sd-container">
        <Box className="sd-loading-container">
          <p className="sd-error-text">{error}</p>
        </Box>
      </div>
    );
  }

  const allTestsTaken =
    testIds.length > 0 && testIds.every((id) => testStatuses[id] === true);
  const testBtnDisabled = testIds.length === 0 || allTestsTaken;

  /* ─── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="sd-container">
      <Dash certificateRef={certificateRef} />
      <CertificateGenerator ref={certificateRef} />

      <div className="sd-main-content">

        {/* ── Header banner ── */}
        <div className="sd-header">
          <div className={`sd-header-grid ${isMobile ? "sd-header-grid--mobile" : ""}`}>

            {/* Left: greeting + buttons */}
            <div>
              <h1 className="sd-header-title">
                Welcome back, {studentName}!
              </h1>
              <p className="sd-header-subtitle">
                Continue your learning journey with {moduleName}
              </p>

              <div className="sd-button-container">
                {/* Take Tests */}
                <button
                  className="sd-btn-test"
                  onClick={handleTestModuleClick}
                  disabled={testBtnDisabled}
                >
                  <FileText size={18} />
                  Take Tests
                </button>

                {/* Download Certificate */}
                {canDownloadCertificate && (
                  <button
                    className="sd-btn-certificate"
                    onClick={handleDownloadCertificate}
                  >
                    <BookOpen size={18} />
                    Download Certificate
                  </button>
                )}
              </div>
            </div>

            {/* Right: circular progress */}
            <div className={`sd-progress-wrapper ${isMobile ? "sd-progress-wrapper--mobile" : ""}`}>
              <div
                className="sd-progress-circle"
                style={{
                  /* Only the dynamic JS value stays inline.
                     Color token is read at render time via token(). */
                  background: `conic-gradient(
                    ${token("--brand-accent", "#ff66c4")} ${courseProgress}%,
                    rgba(255,255,255,0.2) 0
                  )`,
                }}
              >
                <div className="sd-progress-inner" />
                <div className="sd-progress-text">
                  <div className="sd-progress-percentage">{courseProgress}%</div>
                  <div className="sd-progress-label">Course Progress</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Course info stat cards ── */}
        <CourseInfoCards
          orgName={orgName}
          moduleName={moduleName}
          expertName={expertName}
          coordinatorName={coordinatorName}
          styles={cardStyles}
        />

        {/* ── Assessment scores + upcoming deadlines ── */}
        <div className={`sd-bottom-grid ${isMobile ? "sd-bottom-grid--mobile" : ""}`}>
          <AssessmentScores />
          <UpcomingDeadlines />
        </div>

      </div>
    </div>
  );
}