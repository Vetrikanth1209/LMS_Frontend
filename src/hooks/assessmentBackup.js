// src/hooks/useAssessmentBackup.js

import { useEffect, useCallback } from "react";

import {
  initializeAssessmentBackup,
  loadAssessmentBackup,
  saveAssessmentBackup,
  clearAssessmentBackup,
  updateNetworkStatus,
  addMalpracticeLog,
} from "./assessmentBackupService";

const useAssessmentBackup = ({
  testId,
  userId,
  pocId,
}) => {
  // ─────────────────────────────────────────────
  // INITIALIZE
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (!testId || !userId) return;

    initializeAssessmentBackup({
      testId,
      userId,
      pocId,
    });
  }, [testId, userId, pocId]);

  // ─────────────────────────────────────────────
  // NETWORK TRACKING
  // ─────────────────────────────────────────────

  useEffect(() => {
    const onlineHandler = () => {
      updateNetworkStatus(testId, false);
    };

    const offlineHandler = () => {
      updateNetworkStatus(testId, true);
    };

    window.addEventListener("online", onlineHandler);

    window.addEventListener("offline", offlineHandler);

    return () => {
      window.removeEventListener(
        "online",
        onlineHandler
      );

      window.removeEventListener(
        "offline",
        offlineHandler
      );
    };
  }, [testId]);

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  const saveBackup = useCallback(
    async (data) => {
      return await saveAssessmentBackup(
        testId,
        data
      );
    },
    [testId]
  );

  const loadBackup = useCallback(async () => {
    return await loadAssessmentBackup(testId);
  }, [testId]);

  const clearBackup = useCallback(async () => {
    return await clearAssessmentBackup(testId);
  }, [testId]);

  const addSecurityLog = useCallback(
    async (type, message) => {
      return await addMalpracticeLog(
        testId,
        type,
        message
      );
    },
    [testId]
  );

  return {
    saveBackup,
    loadBackup,
    clearBackup,
    addSecurityLog,
  };
};

export default useAssessmentBackup;