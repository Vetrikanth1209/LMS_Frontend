// src/services/assessmentDB.js

import Dexie from "dexie";

// ─────────────────────────────────────────────────────────────
// DATABASE
// ─────────────────────────────────────────────────────────────

const assessmentDB = new Dexie("AssessmentPlatformDB");

// ─────────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────────

assessmentDB.version(1).stores({
  assessments: "testId, userId, updatedAt",
});

// ─────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────

export default assessmentDB;