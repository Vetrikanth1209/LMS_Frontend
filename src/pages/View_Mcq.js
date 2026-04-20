import React, { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Paper, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, IconButton, Tooltip,
  InputAdornment, Chip, Avatar, CircularProgress,
} from "@mui/material";
import { fetchAllMcqs, updateMcq, deleteMcq } from "../axios";
import Admin_Dashboard from "../components/AdminDash";
import {
  Book, Tag, CheckCircle, Hash, Copy,
  Pencil, Trash2, Search, X, RefreshCw, Plus, Minus,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import "../styles/View_Mcq.css";

/* ─── design tokens (kept for dynamic inline use) ────────────── */
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
  tagBg:        "#e3f2fd",
  green:        "#2e7d32",
};

/* ─── highlight matched text ─────────────────────────────────── */
const HL = ({ text = "", q = "" }) => {
  if (!q) return <>{text}</>;
  const safe  = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${safe})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === q.toLowerCase()
          ? <mark key={i} className="mp-highlight">{p}</mark>
          : p
      )}
    </>
  );
};

/* ─── sort icon ──────────────────────────────────────────────── */
const SortIcon = ({ field, sort }) => {
  if (sort.field !== field) return <ChevronsUpDown size={13} style={{ opacity: 0.4 }} />;
  return sort.dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
};

/* ─── safe stringifier ───────────────────────────────────────── */
const safeStr = (v) => {
  if (Array.isArray(v)) return v.map(String).join(" ");
  if (v && typeof v === "object") return Object.values(v).map(safeStr).join(" ");
  return String(v ?? "");
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
const McqAdminPage = () => {
  const [mcqs,    setMcqs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [sort,    setSort]    = useState({ field: "mcq_question", dir: "asc" });
  const [page,    setPage]    = useState(0);
  const PER_PAGE = 10;

  const [sb, setSb] = useState({ open: false, msg: "", sev: "success" });
  const toast = (msg, sev = "success") => setSb({ open: true, msg, sev });

  const [editOpen,    setEditOpen]    = useState(false);
  const [editRow,     setEditRow]     = useState(null);
  const [editData,    setEditData]    = useState({ mcq_question: "", mcq_options: ["", "", "", ""], mcq_answer: "", mcq_tag: [] });
  const [editLoading, setEditLoading] = useState(false);

  const [delOpen,    setDelOpen]    = useState(false);
  const [delRow,     setDelRow]     = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const [tagInput, setTagInput] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllMcqs();
      setMcqs(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message, "error");
      setMcqs([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = q
      ? mcqs.filter((m) => safeStr(m).toLowerCase().includes(q))
      : [...mcqs];
    rows.sort((a, b) => {
      const av = String(a[sort.field] ?? "").toLowerCase();
      const bv = String(b[sort.field] ?? "").toLowerCase();
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return rows;
  }, [mcqs, search, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageRows   = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const toggleSort = (field) =>
    setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => toast("Copied to clipboard!"))
      .catch(() => toast("Failed to copy", "error"));
  };

  const openEdit = (row) => {
    setEditRow(row);
    setEditData({
      mcq_question: row.mcq_question || "",
      mcq_options: Array.isArray(row.mcq_options) && row.mcq_options.length ? [...row.mcq_options] : ["", "", "", ""],
      mcq_answer: row.mcq_answer || "",
      mcq_tag: Array.isArray(row.mcq_tag) ? [...row.mcq_tag] : [],
    });
    setEditOpen(true);
  };
  const closeEdit = () => { setEditOpen(false); setEditRow(null); };

  const setOption    = (i, val) => setEditData((p) => { const o = [...p.mcq_options]; o[i] = val; return { ...p, mcq_options: o }; });
  const addOption    = ()       => setEditData((p) => ({ ...p, mcq_options: [...p.mcq_options, ""] }));
  const removeOption = (i)      => setEditData((p) => ({ ...p, mcq_options: p.mcq_options.filter((_, idx) => idx !== i) }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !editData.mcq_tag.includes(t)) setEditData((p) => ({ ...p, mcq_tag: [...p.mcq_tag, t] }));
    setTagInput("");
  };
  const removeTag = (t) => setEditData((p) => ({ ...p, mcq_tag: p.mcq_tag.filter((x) => x !== t) }));

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      await updateMcq({ mcq_id: editRow.mcq_id, ...editData });
      setMcqs((prev) => prev.map((m) => (m._id === editRow._id ? { ...m, ...editData } : m)));
      toast("MCQ updated successfully!");
      closeEdit();
    } catch (e) {
      toast(`Update failed: ${e.message}`, "error");
    } finally {
      setEditLoading(false);
    }
  };

  const openDel  = (row) => { setDelRow(row); setDelOpen(true); };
  const closeDel = ()    => { setDelOpen(false); setDelRow(null); };

  const confirmDel = async () => {
    setDelLoading(true);
    try {
      await deleteMcq(delRow.mcq_id);
      setMcqs((prev) => prev.filter((m) => m._id !== delRow._id));
      toast("MCQ deleted successfully!");
      closeDel();
    } catch (e) {
      toast(`Delete failed: ${e.message}`, "error");
    } finally {
      setDelLoading(false);
    }
  };

  const cols = [
    { key: "mcq_question", label: "Question", w: "28%", sortable: true  },
    { key: "mcq_options",  label: "Options",  w: "22%", sortable: false },
    { key: "mcq_answer",   label: "Answer",   w: "12%", sortable: true  },
    { key: "mcq_tag",      label: "Tags",     w: "16%", sortable: false },
    { key: "mcq_id",       label: "MCQ ID",   w: "14%", sortable: false },
    { key: "_actions",     label: "Actions",  w: "8%",  sortable: false },
  ];

  const gridTemplate = cols.map((c) => c.w).join(" ");

  const cellContent = (col, row) => {
    const q = search.trim();
    switch (col.key) {

      case "mcq_question":
        return (
          <Box className="mp-cell-question">
            <Avatar className="mp-cell-question-avatar"><Book size={13} /></Avatar>
            <Typography className="mp-cell-question-text"><HL text={row.mcq_question} q={q} /></Typography>
          </Box>
        );

      case "mcq_options": {
        const opts = Array.isArray(row.mcq_options) ? row.mcq_options : [];
        return (
          <Box className="mp-cell-options">
            {opts.length ? opts.map((opt, i) => (
              <Typography key={i} className="mp-cell-option-text">
                <span className="mp-cell-option-letter">{String.fromCharCode(65 + i)}.</span>{" "}
                <HL text={opt} q={q} />
              </Typography>
            )) : <Typography className="mp-cell-no-options">No options</Typography>}
          </Box>
        );
      }

      case "mcq_answer":
        return (
          <Box className="mp-cell-answer">
            <CheckCircle size={14} color={C.green} style={{ flexShrink: 0 }} />
            <Chip className="mp-cell-answer-chip" size="small" label={<HL text={row.mcq_answer} q={q} />} />
          </Box>
        );

      case "mcq_tag": {
        const tags = Array.isArray(row.mcq_tag) ? row.mcq_tag : [];
        return (
          <Box className="mp-cell-tags">
            {tags.length ? tags.map((tag, i) => (
              <Chip key={i} className="mp-cell-tag-chip" size="small"
                icon={<Tag size={10} />}
                label={<HL text={tag} q={q} />}
              />
            )) : <Typography className="mp-cell-no-tags">No tags</Typography>}
          </Box>
        );
      }

      case "mcq_id":
        return (
          <Box className="mp-cell-id">
            <Hash size={13} color={C.primary} style={{ flexShrink: 0 }} />
            <Typography className="mp-cell-id-text">{row.mcq_id}</Typography>
            <Tooltip title="Copy ID" arrow>
              <IconButton size="small" className="mp-cell-id-copy-btn" onClick={() => copyToClipboard(row.mcq_id)}>
                <Copy size={12} />
              </IconButton>
            </Tooltip>
          </Box>
        );

      case "_actions":
        return (
          <Box className="mp-cell-actions">
            <Tooltip title="Edit MCQ" arrow>
              <IconButton size="small" className="mp-action-btn-edit" onClick={() => openEdit(row)}>
                <Pencil size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete MCQ" arrow>
              <IconButton size="small" className="mp-action-btn-delete" onClick={() => openDel(row)}>
                <Trash2 size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        );

      default: return null;
    }
  };

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <>
      <Admin_Dashboard />
      <Box className="mp-root">

        {/* ── Header ─────────────────────────────────────── */}
        <Box className="mp-header">
          <Box>
            <Typography className="mp-header-title">MCQ Management</Typography>
            <Typography variant="body2" className="mp-header-subtitle">
              View and manage multiple-choice questions
            </Typography>
          </Box>
          <Box className="mp-stat-chips">
            {[
              { label: "Total",    value: mcqs.length,     color: C.primary, icon: <Book   size={18} /> },
              { label: "Filtered", value: filtered.length, color: C.accent,  icon: <Search size={18} /> },
            ].map(({ label, value, color, icon }) => (
              <Box key={label} className="mp-stat-chip">
                <Box sx={{ color }}>{icon}</Box>
                <Box>
                  <Typography className="mp-stat-chip-value" sx={{ color }}>{value}</Typography>
                  <Typography variant="caption" className="mp-stat-chip-label">{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Toolbar ────────────────────────────────────── */}
        <Paper elevation={0} className="mp-toolbar">
          <TextField
            placeholder="Search questions, options, tags, answers…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            size="small"
            className="mp-search-field"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search size={16} color={C.primary} /></InputAdornment>,
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}><X size={14} /></IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Refresh" arrow>
            <IconButton onClick={load} className="mp-refresh-btn"><RefreshCw size={17} /></IconButton>
          </Tooltip>
          {search && (
            <Chip className="mp-result-chip" size="small"
              label={`${filtered.length} result${filtered.length !== 1 ? "s" : ""}`} />
          )}
        </Paper>

        {/* ── Custom Table ────────────────────────────────── */}
        <Paper elevation={0} className="mp-table-card">

          {/* thead */}
          <Box className="mp-thead" style={{ gridTemplateColumns: gridTemplate }}>
            {cols.map((col) => (
              <Box
                key={col.key}
                className={`mp-th ${col.sortable ? "mp-th--sortable" : ""}`}
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                <Typography className="mp-th-label">{col.label}</Typography>
                {col.sortable && <SortIcon field={col.key} sort={sort} />}
              </Box>
            ))}
          </Box>

          {/* tbody */}
          {loading ? (
            <Box className="mp-tbody-loading">
              <CircularProgress size={36} sx={{ color: C.primary }} />
            </Box>
          ) : pageRows.length === 0 ? (
            <Box className="mp-tbody-empty">
              <Book size={40} color={C.border} style={{ margin: "0 auto 12px" }} />
              <Typography className="mp-tbody-empty-label">No MCQs found</Typography>
            </Box>
          ) : (
            pageRows.map((row, i) => (
              <Box
                key={row._id}
                className="mp-tr"
                style={{
                  gridTemplateColumns: gridTemplate,
                  backgroundColor: i % 2 === 0 ? C.surface : C.stripe,
                }}
              >
                {cols.map((col) => (
                  <Box key={col.key} className="mp-td">{cellContent(col, row)}</Box>
                ))}
              </Box>
            ))
          )}

          {/* pagination */}
          {!loading && filtered.length > PER_PAGE && (
            <Box className="mp-pagination">
              <Typography variant="body2" className="mp-pagination-info">
                Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
              </Typography>
              <Box className="mp-pagination-btns">
                {[
                  { label: "← Prev", disabled: page === 0,             action: () => setPage((p) => p - 1) },
                  { label: "Next →", disabled: page >= totalPages - 1, action: () => setPage((p) => p + 1) },
                ].map(({ label, disabled, action }) => (
                  <Button key={label} size="small" disabled={disabled} onClick={action}
                    variant="outlined" className="mp-pagination-btn">
                    {label}
                  </Button>
                ))}
              </Box>
            </Box>
          )}
        </Paper>

        {/* ── Edit Dialog ─────────────────────────────────── */}
        <Dialog open={editOpen} onClose={closeEdit} maxWidth="sm" fullWidth className="mp-edit-dialog"
          PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden" } }}>
          <DialogTitle className="mp-edit-dialog-title">
            <Pencil size={18} /> Edit MCQ
          </DialogTitle>

          <DialogContent className="mp-edit-dialog-content">

            {/* Question */}
            <TextField label="Question" fullWidth size="small" multiline rows={3}
              value={editData.mcq_question}
              onChange={(e) => setEditData((p) => ({ ...p, mcq_question: e.target.value }))}
              className="mp-question-field"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.2 }}>
                    <Box sx={{ color: C.primary }}><Book size={15} /></Box>
                  </InputAdornment>
                ),
              }}
            />

            {/* Options */}
            <Box>
              <Typography className="mp-options-label">Options</Typography>
              {editData.mcq_options.map((opt, i) => (
                <Box key={i} className="mp-option-row">
                  <Box className="mp-option-letter-badge">{String.fromCharCode(65 + i)}</Box>
                  <TextField fullWidth size="small" placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    value={opt} onChange={(e) => setOption(i, e.target.value)}
                    className="mp-option-field"
                  />
                  {editData.mcq_options.length > 2 && (
                    <IconButton size="small" className="mp-option-remove-btn" onClick={() => removeOption(i)}>
                      <Minus size={13} />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button size="small" startIcon={<Plus size={13} />} onClick={addOption} className="mp-btn-add-option">
                Add Option
              </Button>
            </Box>

            {/* Answer */}
            <TextField label="Correct Answer" fullWidth size="small"
              value={editData.mcq_answer}
              onChange={(e) => setEditData((p) => ({ ...p, mcq_answer: e.target.value }))}
              helperText="Enter the exact text of the correct option"
              className="mp-answer-field"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ color: C.green }}><CheckCircle size={15} /></Box>
                  </InputAdornment>
                ),
              }}
            />

            {/* Tags */}
            <Box>
              <Typography className="mp-tags-label">Tags</Typography>
              <Box className="mp-tag-input-row">
                <TextField size="small" placeholder="Add a tag…" value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  className="mp-tag-input-field"
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Tag size={14} color={C.primary} /></InputAdornment>,
                  }}
                />
                <Button variant="outlined" size="small" onClick={addTag} className="mp-btn-add-tag">Add</Button>
              </Box>
              <Box className="mp-tags-list">
                {editData.mcq_tag.map((tag, i) => (
                  <Chip key={i} label={tag} size="small"
                    onDelete={() => removeTag(tag)}
                    className="mp-edit-tag-chip"
                  />
                ))}
                {editData.mcq_tag.length === 0 && (
                  <Typography className="mp-no-tags-yet">No tags added yet</Typography>
                )}
              </Box>
            </Box>

          </DialogContent>

          <DialogActions className="mp-edit-dialog-actions">
            <Button onClick={closeEdit} variant="outlined" className="mp-btn-cancel">Cancel</Button>
            <Button onClick={saveEdit} variant="contained" disabled={editLoading}
              className="mp-btn-save" disableElevation>
              {editLoading ? <><CircularProgress size={14} sx={{ color: "#fff", mr: 1 }} />Saving…</> : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete Dialog ───────────────────────────────── */}
        <Dialog open={delOpen} onClose={closeDel} maxWidth="xs" fullWidth className="mp-del-dialog"
          PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden" } }}>
          <DialogTitle className="mp-del-dialog-title">
            <Trash2 size={18} /> Delete MCQ
          </DialogTitle>
          <DialogContent className="mp-del-dialog-content">
            <Typography className="mp-del-desc">You are about to permanently delete this question:</Typography>
            <Box className="mp-del-question-box">
              <Typography className="mp-del-question-text">{delRow?.mcq_question}</Typography>
              {Array.isArray(delRow?.mcq_tag) && delRow.mcq_tag.length > 0 && (
                <Box className="mp-del-tag-row">
                  {delRow.mcq_tag.map((t, i) => (
                    <Chip key={i} label={t} size="small" className="mp-del-tag-chip" />
                  ))}
                </Box>
              )}
            </Box>
            <Typography variant="body2" className="mp-del-warning">This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions className="mp-del-dialog-actions">
            <Button onClick={closeDel} variant="outlined" className="mp-btn-cancel">Cancel</Button>
            <Button onClick={confirmDel} variant="contained" disabled={delLoading}
              className="mp-btn-delete" disableElevation>
              {delLoading ? <><CircularProgress size={14} sx={{ color: "#fff", mr: 1 }} />Deleting…</> : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ────────────────────────────────────── */}
        <Snackbar open={sb.open} autoHideDuration={4000}
          onClose={() => setSb((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={sb.sev} variant="filled"
            onClose={() => setSb((s) => ({ ...s, open: false }))}
            className="mp-snackbar-alert">
            {sb.msg}
          </Alert>
        </Snackbar>

      </Box>
    </>
  );
};

export default McqAdminPage;