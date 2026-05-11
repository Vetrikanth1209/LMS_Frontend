// src/services/assessmentBackupService.js

import assessmentDB from "./assessmentDB";

// ─────────────────────────────────────────────────────────────
// CREATE EMPTY STRUCTURE
// ─────────────────────────────────────────────────────────────

export const createEmptyAssessmentBackup = ({
  testId,
  userId,
  pocId = "",
}) => {
  return {
    // ─────────────────────────────
    // CORE
    // ─────────────────────────────

    testId,
    userId,
    pocId,

    createdAt: Date.now(),
    updatedAt: Date.now(),

    lastSyncedAt: null,

    pendingSync: false,

    submissionPending: false,

    // ─────────────────────────────
    // NETWORK
    // ─────────────────────────────

    network: {
      isOffline: !navigator.onLine,
      offlineStartedAt: null,
      totalOfflineDuration: 0,
    },

    // ─────────────────────────────
    // TIMER
    // ─────────────────────────────

    timer: {
      totalTime: 0,
      remainingTime: 0,
      startedAt: null,
      lastUpdatedAt: Date.now(),
    },

    // ─────────────────────────────
    // TEST RESULT
    // ─────────────────────────────

    result: {
      result_score: 0,
      result_total_score: 0,

      mcqAnswered: 0,
      mcqCorrect: 0,
      mcqWrong: 0,
      mcqNotAnswered: 0,
      mcqNotVisited: 0,

      codingAnswered: 0,
      codingCorrect: 0,
      codingWrong: 0,
      codingNotAnswered: 0,
      codingNotVisited: 0,

      marked: 0,
    },

    // ─────────────────────────────
    // MCQ SECTION
    // ─────────────────────────────

    mcq: {
      currentQuestionIndex: 0,

      progress: [],

      visitedQuestions: [],

      markedQuestions: [],
    },

    // ─────────────────────────────
    // CODING SECTION
    // ─────────────────────────────

    coding: {
      currentCodingIndex: 0,

      answers: {
        /*
          [codeId]: {
            code: "",
            language: "",
            lastRunAt: null,
            lastSavedAt: null,
          }
        */
      },

      codingResults: [],
    },

    // ─────────────────────────────
    // SECURITY / MALPRACTICE
    // ─────────────────────────────

    security: {
      fullscreenExitCount: 0,

      windowSwitchCount: 0,

      devtoolsWarnings: 0,

      malpracticeLogs: [],
    },

    // ─────────────────────────────
    // SESSION
    // ─────────────────────────────

    session: {
      activeSessionId: crypto.randomUUID(),

      lastHeartbeat: Date.now(),

      resumed: false,
    },
  };
};

// ─────────────────────────────────────────────────────────────
// LOAD BACKUP
// ─────────────────────────────────────────────────────────────

export const loadAssessmentBackup = async (testId) => {
  try {
    const backup = await assessmentDB.assessments.get(testId);

    return backup || null;
  } catch (error) {
    console.error("Failed to load assessment backup:", error);

    return null;
  }
};

// ─────────────────────────────────────────────────────────────
// SAVE BACKUP
// ─────────────────────────────────────────────────────────────

export const saveAssessmentBackup = async (
  testId,
  partialData = {}
) => {
  try {
    const existing = await loadAssessmentBackup(testId);

    if (!existing) {
      console.error("Backup not initialized");

      return false;
    }

    const updatedBackup = deepMerge(existing, {
      ...partialData,

      updatedAt: Date.now(),

      pendingSync: true,
    });

    await assessmentDB.assessments.put(updatedBackup);

    return true;
  } catch (error) {
    console.error("Failed to save assessment backup:", error);

    return false;
  }
};

// ─────────────────────────────────────────────────────────────
// INITIALIZE BACKUP
// ─────────────────────────────────────────────────────────────

export const initializeAssessmentBackup = async ({
  testId,
  userId,
  pocId,
}) => {
  try {
    const existing = await loadAssessmentBackup(testId);

    if (existing) {
      return existing;
    }

    const newBackup = createEmptyAssessmentBackup({
      testId,
      userId,
      pocId,
    });

    await assessmentDB.assessments.put(newBackup);

    return newBackup;
  } catch (error) {
    console.error("Failed to initialize backup:", error);

    return null;
  }
};

// ─────────────────────────────────────────────────────────────
// CLEAR BACKUP
// ─────────────────────────────────────────────────────────────

export const clearAssessmentBackup = async (testId) => {
  try {
    await assessmentDB.assessments.delete(testId);

    return true;
  } catch (error) {
    console.error("Failed to clear backup:", error);

    return false;
  }
};

// ─────────────────────────────────────────────────────────────
// UPDATE NETWORK STATUS
// ─────────────────────────────────────────────────────────────

export const updateNetworkStatus = async (
  testId,
  isOffline
) => {
  try {
    const existing = await loadAssessmentBackup(testId);

    if (!existing) return;

    const updated = {
      ...existing,

      network: {
        ...existing.network,

        isOffline,

        offlineStartedAt: isOffline
          ? Date.now()
          : null,
      },

      updatedAt: Date.now(),
    };

    await assessmentDB.assessments.put(updated);
  } catch (error) {
    console.error(error);
  }
};

// ─────────────────────────────────────────────────────────────
// ADD MALPRACTICE LOG
// ─────────────────────────────────────────────────────────────

export const addMalpracticeLog = async (
  testId,
  type,
  message
) => {
  try {
    const existing = await loadAssessmentBackup(testId);

    if (!existing) return;

    existing.security.malpracticeLogs.push({
      type,
      message,
      timestamp: Date.now(),
    });

    existing.updatedAt = Date.now();

    await assessmentDB.assessments.put(existing);
  } catch (error) {
    console.error(error);
  }
};

// ─────────────────────────────────────────────────────────────
// DEEP MERGE
// ─────────────────────────────────────────────────────────────

const deepMerge = (target, source) => {
  const output = { ...target };

  Object.keys(source).forEach((key) => {
    if (
      typeof source[key] === "object" &&
      source[key] !== null &&
      !Array.isArray(source[key])
    ) {
      output[key] = deepMerge(
        target[key] || {},
        source[key]
      );
    } else {
      output[key] = source[key];
    }
  });

  return output;
};