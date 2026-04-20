import React, { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Paper, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, IconButton, Tooltip,
  InputAdornment, Chip, Avatar, CircularProgress, Switch,
} from "@mui/material";
import { fetchAllTests, updateTest, deleteTest } from "../axios";
import Admin_Dashboard from "../components/AdminDash";
import {
  FileText, Code, Globe, Star, Clock, ToggleLeft,
  Pencil, Trash2, Search, X, RefreshCw,
  ChevronUp, ChevronDown, ChevronsUpDown, Copy, Check,
} from "lucide-react";

// ─── Styles ───────────────────────────────────────────────────────────────────
import "../styles/View_Test.css";

// ─── Design Tokens (kept in JS — used in icon color props) ───────────────────
const C = {
  primary:      "#0c83c8",
  primaryDark:  "#0a6faa",
  primaryLight: "#e8f4fd",
  accent:       "#fc7a46",
  accentLight:  "#fff3ee",
  danger:       "#e53935",
  dangerLight:  "#ffebee",
  bg:           "#f0f6ff",
  surface:      "#ffffff",
  border:       "#e2eaf4",
  text:         "#1a2640",
  muted:        "#7a8fa6",
  stripe:       "#f5f9ff",
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PER_PAGE = 10;

const EMPTY_FORM = {
  test_name:        "",
  test_language:    "",
  test_total_score: "",
};

const COLS = [
  { key: "test_name",        label: "Test Name",   w: "170px", sortable: true  },
  { key: "test_language",    label: "Language",    w: "120px", sortable: true  },
  { key: "test_total_score", label: "Total Score", w: "110px", sortable: true  },
  { key: "test_mcq_ids",     label: "MCQ IDs",     w: "160px", sortable: false },
  { key: "test_coding_ids",  label: "Coding IDs",  w: "160px", sortable: false },
  { key: "status",           label: "Status",      w: "150px", sortable: false },
  { key: "activeAt",         label: "Active At",   w: "170px", sortable: false },
  { key: "test_id",          label: "Test ID",     w: "110px", sortable: false },
  { key: "_actions",         label: "Actions",     w: "90px",  sortable: false },
];

const EDIT_FIELDS = [
  { label: "Test Name",   key: "test_name",        icon: <FileText size={15} />, type: "text"   },
  { label: "Language",    key: "test_language",    icon: <Globe    size={15} />, type: "text"   },
  { label: "Total Score", key: "test_total_score", icon: <Star     size={15} />, type: "number" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const HL = ({ text = "", q = "" }) => {
  if (!q) return <>{text}</>;
  const safe  = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${safe})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === q.toLowerCase()
          ? <mark key={i} className="test-highlight">{p}</mark>
          : p
      )}
    </>
  );
};

const SortIcon = ({ field, sort }) => {
  if (sort.field !== field) return <ChevronsUpDown size={13} style={{ opacity: 0.4 }} />;
  return sort.dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
};

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <Tooltip title={copied ? "Copied!" : "Copy"} arrow>
      <IconButton
        size="small"
        onClick={handleCopy}
        className={`test-copy-btn ${copied ? "copied" : "idle"}`}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </IconButton>
    </Tooltip>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const TestGrid = () => {

  // ── State ──────────────────────────────────────────────────────────────────

  const [tests,   setTests]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [sort,    setSort]    = useState({ field: "test_name", dir: "asc" });
  const [page,    setPage]    = useState(0);

  const [sb, setSb] = useState({ open: false, msg: "", sev: "success" });
  const toast = (msg, sev = "success") => setSb({ open: true, msg, sev });

  // Edit dialog
  const [editOpen,    setEditOpen]    = useState(false);
  const [editRow,     setEditRow]     = useState(null);
  const [editData,    setEditData]    = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog
  const [delOpen,    setDelOpen]    = useState(false);
  const [delRow,     setDelRow]     = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  // Status dialog
  const [statusOpen,    setStatusOpen]    = useState(false);
  const [statusRow,     setStatusRow]     = useState(null);
  const [statusPending, setStatusPending] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // ── Data loading ───────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllTests();
      const rows = (Array.isArray(data) ? data : []).map((item, i) => ({
        ...item,
        _rowId:          item._id || `temp-${i}`,
        test_mcq_ids:    Array.isArray(item.test_mcq_id)    ? item.test_mcq_id    : [],
        test_coding_ids: Array.isArray(item.test_coding_id) ? item.test_coding_id : [],
        activeAt:        item.activeAt && !isNaN(new Date(item.activeAt))
                           ? new Date(item.activeAt).toLocaleString()
                           : "N/A",
      }));
      setTests(rows);
    } catch (e) {
      toast(e.response?.data?.error || e.message, "error");
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived rows ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = q
      ? tests.filter((t) =>
          [t.test_id, t.test_name, t.test_language, t.status]
            .some((v) => String(v ?? "").toLowerCase().includes(q))
        )
      : [...tests];

    rows.sort((a, b) => {
      const av = String(a[sort.field] ?? "").toLowerCase();
      const bv = String(b[sort.field] ?? "").toLowerCase();
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return rows;
  }, [tests, search, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageRows   = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const toggleSort = (field) =>
    setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  // ── Edit handlers ──────────────────────────────────────────────────────────

  const openEdit = (row) => {
    setEditRow(row);
    setEditData({
      test_name:        row.test_name        || "",
      test_language:    row.test_language    || "",
      test_total_score: row.test_total_score ?? "",
    });
    setEditOpen(true);
  };
  const closeEdit = () => { setEditOpen(false); setEditRow(null); setEditData(EMPTY_FORM); };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      await updateTest({ test_id: editRow.test_id, ...editData });
      setTests((prev) =>
        prev.map((t) => (t._rowId === editRow._rowId ? { ...t, ...editData } : t))
      );
      toast("Test updated successfully!");
      closeEdit();
    } catch (e) {
      toast(`Update failed: ${e.message}`, "error");
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete handlers ────────────────────────────────────────────────────────

  const openDel  = (row) => { setDelRow(row); setDelOpen(true); };
  const closeDel = ()    => { setDelOpen(false); setDelRow(null); };

  const confirmDel = async () => {
    setDelLoading(true);
    try {
      await deleteTest(delRow.test_id);
      setTests((prev) => prev.filter((t) => t._rowId !== delRow._rowId));
      toast("Test deleted successfully!");
      closeDel();
    } catch (e) {
      toast(`Delete failed: ${e.message}`, "error");
    } finally {
      setDelLoading(false);
    }
  };

  // ── Status handlers ────────────────────────────────────────────────────────

  const openStatus  = (row, newStatus) => { setStatusRow(row); setStatusPending(newStatus); setStatusOpen(true); };
  const closeStatus = ()               => { setStatusOpen(false); setStatusRow(null); setStatusPending(null); };

  const confirmStatus = async () => {
    setStatusLoading(true);
    try {
      await updateTest({ test_id: statusRow.test_id, status: statusPending });
      setTests((prev) =>
        prev.map((t) =>
          t._rowId === statusRow._rowId
            ? {
                ...t,
                status:   statusPending,
                activeAt: statusPending === "active" ? new Date().toLocaleString() : "N/A",
              }
            : t
        )
      );
      toast(`Test set to "${statusPending}" successfully!`);
      closeStatus();
    } catch (e) {
      toast(`Status update failed: ${e.message}`, "error");
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Cell renderer ──────────────────────────────────────────────────────────

  const cellContent = (col, row) => {
    const q = search.trim();
    switch (col.key) {

      case "test_name":
        return (
          <Box className="test-cell-name-box">
            <Avatar className="test-cell-name-avatar"><FileText size={14} /></Avatar>
            <Typography className="test-cell-name-text"><HL text={row.test_name} q={q} /></Typography>
          </Box>
        );

      case "test_language":
        return (
          <Box className="test-cell-icon-row">
            <Globe size={14} color={C.accent} style={{ flexShrink: 0 }} />
            <Chip label={<HL text={row.test_language} q={q} />} size="small" className="test-lang-chip" />
          </Box>
        );

      case "test_total_score":
        return (
          <Box className="test-cell-icon-row">
            <Star size={14} color={C.primary} style={{ flexShrink: 0 }} />
            <Typography className="test-score-text">{row.test_total_score ?? "N/A"}</Typography>
          </Box>
        );

      case "test_mcq_ids": {
        const ids = row.test_mcq_ids;
        return (
          <Box className="test-cell-icon-row">
            <Chip label={`${ids.length} MCQ${ids.length !== 1 ? "s" : ""}`} size="small" className="test-mcq-chip" />
            {ids.length > 0 && <CopyBtn text={ids.join(", ")} />}
          </Box>
        );
      }

      case "test_coding_ids": {
        const ids = row.test_coding_ids;
        return (
          <Box className="test-cell-icon-row">
            <Chip label={`${ids.length} Code${ids.length !== 1 ? "s" : ""}`} size="small" className="test-coding-chip" />
            {ids.length > 0 && <CopyBtn text={ids.join(", ")} />}
          </Box>
        );
      }

      case "status": {
        const active = row.status === "active";
        return (
          <Box className="test-cell-icon-row">
            <Chip
              label={active ? "Active" : "Disabled"}
              size="small"
              className={active ? "test-status-chip-active" : "test-status-chip-disabled"}
            />
            <Switch
              checked={active}
              onChange={() => openStatus(row, active ? "disabled" : "active")}
              size="small"
              className="test-status-switch"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "#2e7d32" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#2e7d32" },
              }}
            />
          </Box>
        );
      }

      case "activeAt":
        return (
          <Box className="test-cell-icon-row">
            <Clock size={14} color={C.primary} style={{ flexShrink: 0 }} />
            <Typography className="test-activeat-text">{row.activeAt}</Typography>
          </Box>
        );

      case "test_id":
        return (
          <Box className="test-cell-icon-row">
            <Typography className="test-id-text"><HL text={row.test_id} q={q} /></Typography>
            <CopyBtn text={row.test_id} />
          </Box>
        );

      case "_actions":
        return (
          <Box className="test-action-box">
            <Tooltip title="Edit Test" arrow>
              <IconButton size="small" onClick={() => openEdit(row)} className="test-btn-edit">
                <Pencil size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Test" arrow>
              <IconButton size="small" onClick={() => openDel(row)} className="test-btn-delete">
                <Trash2 size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        );

      default: return null;
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const gridTemplate = COLS.map((c) => c.w).join(" ");
  const isActivating = statusPending === "active";

  return (
    <>
      <Admin_Dashboard />

      <Box className="test-grid-wrapper">

        {/* ── Header ── */}
        <Box className="test-grid-header">
          <Box>
            <Typography className="test-grid-title">Test Management</Typography>
            <Typography variant="body2" className="test-grid-subtitle">
              View and manage all registered tests
            </Typography>
          </Box>

          {/* Stat chips */}
          <Box className="test-grid-stat-chips">
            {[
              { label: "Total",    value: tests.length,                                    color: C.primary,  icon: <FileText    size={18} /> },
              { label: "Active",   value: tests.filter((t) => t.status === "active").length, color: "#2e7d32", icon: <ToggleLeft  size={18} /> },
              { label: "Filtered", value: filtered.length,                                  color: C.accent,   icon: <Search      size={18} /> },
            ].map(({ label, value, color, icon }) => (
              <Box key={label} className="test-grid-stat-chip">
                <Box sx={{ color }}>{icon}</Box>
                <Box>
                  <Typography className="test-grid-stat-value" sx={{ color }}>{value}</Typography>
                  <Typography variant="caption" className="test-grid-stat-label">{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Toolbar ── */}
        <Paper elevation={0} className="test-grid-toolbar">
          <TextField
            placeholder="Search by name, language, status, ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            size="small"
            className="test-grid-search-field"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><Search size={16} color={C.primary} /></InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}><X size={14} /></IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Tooltip title="Refresh" arrow>
            <IconButton onClick={load} className="test-grid-btn-refresh">
              <RefreshCw size={17} />
            </IconButton>
          </Tooltip>

          {search && (
            <Chip
              label={`${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
              size="small"
              className="test-grid-results-chip"
            />
          )}
        </Paper>

        {/* ── Table ── */}
        <Paper elevation={0} className="test-grid-table-paper">
          <Box className="test-grid-table-min-width">

            {/* thead */}
            <Box className="test-grid-table-head" sx={{ gridTemplateColumns: gridTemplate }}>
              {COLS.map((col) => (
                <Box
                  key={col.key}
                  className={`test-grid-head-cell${col.sortable ? " sortable" : ""}`}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <Typography className="test-grid-head-label">{col.label}</Typography>
                  {col.sortable && <SortIcon field={col.key} sort={sort} />}
                </Box>
              ))}
            </Box>

            {/* tbody */}
            {loading ? (
              <Box className="test-grid-loader-box">
                <CircularProgress size={36} sx={{ color: C.primary }} />
              </Box>
            ) : pageRows.length === 0 ? (
              <Box className="test-grid-empty-box">
                <FileText size={40} color={C.border} style={{ margin: "0 auto 12px" }} />
                <Typography className="test-grid-empty-label">No tests found</Typography>
              </Box>
            ) : (
              pageRows.map((row, i) => (
                <Box
                  key={row._rowId}
                  className={`test-grid-table-row ${i % 2 === 0 ? "even" : "odd"}`}
                  sx={{ gridTemplateColumns: gridTemplate }}
                >
                  {COLS.map((col) => (
                    <Box key={col.key} className="test-grid-table-cell">
                      {cellContent(col, row)}
                    </Box>
                  ))}
                </Box>
              ))
            )}

            {/* Pagination */}
            {!loading && filtered.length > PER_PAGE && (
              <Box className="test-grid-pagination">
                <Typography variant="body2" className="test-grid-pagination-info">
                  Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
                </Typography>
                <Box className="test-grid-pagination-buttons">
                  {[
                    { label: "← Prev", disabled: page === 0,             action: () => setPage((p) => p - 1) },
                    { label: "Next →", disabled: page >= totalPages - 1, action: () => setPage((p) => p + 1) },
                  ].map(({ label, disabled, action }) => (
                    <Button
                      key={label}
                      size="small"
                      disabled={disabled}
                      onClick={action}
                      variant="outlined"
                      className="test-grid-btn-page"
                    >
                      {label}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>

        {/* ── Edit Dialog ── */}
        <Dialog open={editOpen} onClose={closeEdit} maxWidth="sm" fullWidth
          PaperProps={{ className: "test-dialog-paper" }}>
          <DialogTitle className="test-dialog-title-primary">
            <Pencil size={18} /> Edit Test
          </DialogTitle>
          <DialogContent className="test-dialog-content">
            {EDIT_FIELDS.map(({ label, key, icon, type }) => (
              <TextField
                key={key}
                label={label}
                fullWidth
                size="small"
                type={type}
                value={editData[key]}
                onChange={(e) => setEditData((p) => ({ ...p, [key]: e.target.value }))}
                className="test-edit-field"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ color: C.primary }}>{icon}</Box>
                    </InputAdornment>
                  ),
                }}
              />
            ))}
          </DialogContent>
          <DialogActions className="test-dialog-actions">
            <Button onClick={closeEdit} variant="outlined" className="test-btn-dialog-cancel">
              Cancel
            </Button>
            <Button onClick={saveEdit} variant="contained" disabled={editLoading} className="test-btn-dialog-confirm">
              {editLoading
                ? <><CircularProgress size={14} sx={{ color: "#fff", mr: 1 }} />Saving…</>
                : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete Dialog ── */}
        <Dialog open={delOpen} onClose={closeDel} maxWidth="xs" fullWidth
          PaperProps={{ className: "test-dialog-paper" }}>
          <DialogTitle className="test-dialog-title-danger">
            <Trash2 size={18} /> Delete Test
          </DialogTitle>
          <DialogContent className="test-dialog-content-simple">
            <Typography sx={{ color: C.text, mb: 1.5 }}>
              You are about to permanently delete:
            </Typography>
            <Box className="test-delete-info-box">
              <Typography className="test-delete-info-name">{delRow?.test_name}</Typography>
              <Typography variant="caption" className="test-delete-info-sub">
                {delRow?.test_language} · Score: {delRow?.test_total_score}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: C.muted, mt: 2 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions className="test-dialog-actions">
            <Button onClick={closeDel} variant="outlined" className="test-btn-dialog-cancel">
              Cancel
            </Button>
            <Button onClick={confirmDel} variant="contained" disabled={delLoading} className="test-btn-dialog-danger">
              {delLoading
                ? <><CircularProgress size={14} sx={{ color: "#fff", mr: 1 }} />Deleting…</>
                : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Status Toggle Dialog ── */}
        <Dialog open={statusOpen} onClose={closeStatus} maxWidth="xs" fullWidth
          PaperProps={{ className: "test-dialog-paper" }}>
          <DialogTitle className={isActivating ? "test-dialog-title-activate" : "test-dialog-title-disable"}>
            <ToggleLeft size={18} /> Confirm Status Change
          </DialogTitle>
          <DialogContent className="test-dialog-content-simple">
            <Typography sx={{ color: C.text, mb: 1.5 }}>
              {isActivating ? "Activate the following test?" : "Disable the following test?"}
            </Typography>
            <Box className={isActivating ? "test-status-info-box-activate" : "test-status-info-box-disable"}>
              <FileText size={16} color={isActivating ? "#2e7d32" : C.danger} />
              <Typography className={isActivating ? "test-status-info-name-activate" : "test-status-info-name-disable"}>
                {statusRow?.test_name}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: C.muted, mt: 2 }}>
              {isActivating
                ? "This will activate the test and set the activeAt timestamp."
                : "This will disable the test and clear the activeAt timestamp."}
            </Typography>
          </DialogContent>
          <DialogActions className="test-dialog-actions">
            <Button onClick={closeStatus} variant="outlined" className="test-btn-dialog-cancel">
              Cancel
            </Button>
            <Button
              onClick={confirmStatus}
              variant="contained"
              disabled={statusLoading}
              className={isActivating ? "test-btn-dialog-activate" : "test-btn-dialog-disable"}
            >
              {statusLoading
                ? <><CircularProgress size={14} sx={{ color: "#fff", mr: 1 }} />Updating…</>
                : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ── */}
        <Snackbar
          open={sb.open}
          autoHideDuration={4000}
          onClose={() => setSb((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={sb.sev}
            variant="filled"
            onClose={() => setSb((s) => ({ ...s, open: false }))}
            className="test-snackbar-alert"
          >
            {sb.msg}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default TestGrid;