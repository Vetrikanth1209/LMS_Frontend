import React, { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Paper, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, IconButton, Tooltip,
  InputAdornment, Chip, Avatar, CircularProgress,
} from "@mui/material";
import { fetchAllCodes, updateCode, deleteCode } from "../axios";
import Admin_Dashboard from "../components/AdminDash";
import {
  Code2, Tag, FlaskConical,
  Pencil, Trash2, Search, X, RefreshCw,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import "../styles/Coding.css";

/* ─── highlight matched text ────────────────────────────────── */
const HL = ({ text = "", q = "" }) => {
  if (!q) return <>{text}</>;
  const safe  = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${safe})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === q.toLowerCase()
          ? <mark key={i} className="cp-highlight">{p}</mark>
          : p
      )}
    </>
  );
};

/* ─── sort icon ─────────────────────────────────────────────── */
const SortIcon = ({ field, sort }) => {
  if (sort.field !== field) return <ChevronsUpDown size={13} className="cp-sort-icon cp-sort-icon--inactive" />;
  return sort.dir === "asc"
    ? <ChevronUp size={13} className="cp-sort-icon" />
    : <ChevronDown size={13} className="cp-sort-icon" />;
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
const Codingpage = () => {
  const [codes,   setCodes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [sort,    setSort]    = useState({ field: "code_problem_statement", dir: "asc" });
  const [page,    setPage]    = useState(0);
  const PER_PAGE = 10;

  const [sb, setSb] = useState({ open: false, msg: "", sev: "success" });
  const toast = (msg, sev = "success") => setSb({ open: true, msg, sev });

  const [editOpen,    setEditOpen]    = useState(false);
  const [editRow,     setEditRow]     = useState(null);
  const [editData,    setEditData]    = useState({ code_problem_statement: "", code_tags: [] });
  const [editLoading, setEditLoading] = useState(false);
  const [tagInput,    setTagInput]    = useState("");

  const [delOpen,    setDelOpen]    = useState(false);
  const [delRow,     setDelRow]     = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  /* ── load ───────────────────────────────────────────────── */
  const load = async () => {
    setLoading(true);
    try {
      const response = await fetchAllCodes();
      const arr = response.codes || response || [];
      setCodes(Array.isArray(arr) ? arr : []);
    } catch (e) {
      toast(e.message, "error");
      setCodes([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  /* ── derived rows ───────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = q
      ? codes.filter((c) =>
          [c.code_problem_statement, ...(Array.isArray(c.code_tags) ? c.code_tags : [])]
            .some((v) => String(v ?? "").toLowerCase().includes(q))
        )
      : [...codes];

    rows.sort((a, b) => {
      const av = String(a[sort.field] ?? "").toLowerCase();
      const bv = String(b[sort.field] ?? "").toLowerCase();
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return rows;
  }, [codes, search, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageRows   = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const toggleSort = (field) =>
    setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  /* ── edit ───────────────────────────────────────────────── */
  const openEdit = (row) => {
    setEditRow(row);
    setEditData({
      code_problem_statement: row.code_problem_statement || "",
      code_tags: Array.isArray(row.code_tags) ? [...row.code_tags] : [],
    });
    setTagInput("");
    setEditOpen(true);
  };
  const closeEdit = () => { setEditOpen(false); setEditRow(null); };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !editData.code_tags.includes(t))
      setEditData((p) => ({ ...p, code_tags: [...p.code_tags, t] }));
    setTagInput("");
  };
  const removeTag = (t) =>
    setEditData((p) => ({ ...p, code_tags: p.code_tags.filter((x) => x !== t) }));

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      await updateCode({
        code_id: editRow.code_id,
        code_problem_statement: editData.code_problem_statement,
        code_tags: editData.code_tags,
      });
      setCodes((prev) =>
        prev.map((c) =>
          c._id === editRow._id
            ? { ...c, code_problem_statement: editData.code_problem_statement, code_tags: editData.code_tags }
            : c
        )
      );
      toast("Coding problem updated successfully!");
      closeEdit();
    } catch (e) {
      toast(`Update failed: ${e.message}`, "error");
    } finally {
      setEditLoading(false);
    }
  };

  /* ── delete ─────────────────────────────────────────────── */
  const openDel  = (row) => { setDelRow(row); setDelOpen(true); };
  const closeDel = ()    => { setDelOpen(false); setDelRow(null); };

  const confirmDel = async () => {
    setDelLoading(true);
    try {
      await deleteCode(delRow.code_id);
      setCodes((prev) => prev.filter((c) => c._id !== delRow._id));
      toast("Coding problem deleted successfully!");
      closeDel();
    } catch (e) {
      toast(`Delete failed: ${e.message}`, "error");
    } finally {
      setDelLoading(false);
    }
  };

  /* ── columns ─────────────────────────────────────────────── */
  const cols = [
    { key: "code_problem_statement", label: "Problem Statement", w: "42%", sortable: true  },
    { key: "code_test_cases_count",  label: "Test Cases",        w: "14%", sortable: false },
    { key: "code_tags",              label: "Tags",              w: "28%", sortable: false },
    { key: "_actions",               label: "Actions",           w: "16%", sortable: false },
  ];

  const cellContent = (col, row) => {
    const q = search.trim();
    const testCount = Array.isArray(row.code_test_cases_id)
      ? row.code_test_cases_id.length
      : Array.isArray(row.code_test_cases)
      ? row.code_test_cases.length
      : 0;

    switch (col.key) {
      case "code_problem_statement":
        return (
          <Box className="cp-cell-problem">
            <Avatar className="cp-cell-avatar">
              <Code2 size={13} />
            </Avatar>
            <Typography className="cp-cell-problem-text">
              <HL text={row.code_problem_statement} q={q} />
            </Typography>
          </Box>
        );

      case "code_test_cases_count":
        return (
          <Box className="cp-cell-testcount">
            <FlaskConical size={14} className="cp-cell-testcount-icon" />
            <Chip label={testCount} size="small" className="cp-chip-accent" />
          </Box>
        );

      case "code_tags": {
        const tags = Array.isArray(row.code_tags) ? row.code_tags : [];
        return (
          <Box className="cp-cell-tags">
            {tags.length ? tags.map((tag, i) => (
              <Chip
                key={i}
                label={<HL text={tag} q={q} />}
                size="small"
                icon={<Tag size={10} />}
                className="cp-chip-tag"
              />
            )) : (
              <Typography className="cp-cell-muted">No tags</Typography>
            )}
          </Box>
        );
      }

      case "_actions":
        return (
          <Box className="cp-cell-actions">
            <Tooltip title="Edit Problem" arrow>
              <IconButton size="small" onClick={() => openEdit(row)} className="cp-btn-edit">
                <Pencil size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Problem" arrow>
              <IconButton size="small" onClick={() => openDel(row)} className="cp-btn-delete">
                <Trash2 size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        );

      default: return null;
    }
  };

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <>
      <Admin_Dashboard />
      <Box className="cp-page-wrapper">

        {/* ── Header ─────────────────────────────────────── */}
        <Box className="cp-header">
          <Box>
            <Typography className="cp-title">Coding Management</Typography>
            <Typography variant="body2" className="cp-subtitle">
              Manage and review all coding problems in one place
            </Typography>
          </Box>

          <Box className="cp-stat-chips">
            {[
              { label: "Total",    value: codes.length,    cls: "cp-stat-chip cp-stat-chip--primary", iconCls: "cp-stat-icon--primary" },
              { label: "Filtered", value: filtered.length, cls: "cp-stat-chip cp-stat-chip--accent",  iconCls: "cp-stat-icon--accent"  },
            ].map(({ label, value, cls, iconCls }) => (
              <Box key={label} className={cls}>
                <Box className={iconCls}>
                  {label === "Total" ? <Code2 size={18} /> : <Search size={18} />}
                </Box>
                <Box>
                  <Typography className="cp-stat-value">{value}</Typography>
                  <Typography variant="caption" className="cp-stat-label">{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Toolbar ────────────────────────────────────── */}
        <Paper elevation={0} className="cp-toolbar">
          <TextField
            placeholder="Search by problem statement or tags…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            size="small"
            className="cp-search-field"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} className="cp-search-icon" />
                </InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")}><X size={14} /></IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Refresh" arrow>
            <IconButton onClick={load} className="cp-btn-refresh">
              <RefreshCw size={17} />
            </IconButton>
          </Tooltip>
          {search && (
            <Chip
              label={`${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
              size="small"
              className="cp-results-chip"
            />
          )}
        </Paper>

        {/* ── Table ──────────────────────────────────────── */}
        <Paper elevation={0} className="cp-table-paper">

          {/* thead */}
          <Box
            className="cp-table-head"
            style={{ gridTemplateColumns: cols.map((c) => c.w).join(" ") }}
          >
            {cols.map((col) => (
              <Box
                key={col.key}
                onClick={() => col.sortable && toggleSort(col.key)}
                className={`cp-table-head-cell ${col.sortable ? "sortable" : ""}`}
              >
                <Typography className="cp-table-head-label">{col.label}</Typography>
                {col.sortable && <SortIcon field={col.key} sort={sort} />}
              </Box>
            ))}
          </Box>

          {/* tbody */}
          {loading ? (
            <Box className="cp-loader-box">
              <CircularProgress size={36} className="cp-loader" />
            </Box>
          ) : pageRows.length === 0 ? (
            <Box className="cp-empty-box">
              <Code2 size={40} className="cp-empty-icon" />
              <Typography className="cp-empty-label">No coding problems found</Typography>
            </Box>
          ) : (
            pageRows.map((row, i) => (
              <Box
                key={row._id}
                className={`cp-table-row ${i % 2 === 0 ? "even" : "odd"}`}
                style={{ gridTemplateColumns: cols.map((c) => c.w).join(" ") }}
              >
                {cols.map((col) => (
                  <Box key={col.key} className="cp-table-cell">
                    {cellContent(col, row)}
                  </Box>
                ))}
              </Box>
            ))
          )}

          {/* pagination */}
          {!loading && filtered.length > PER_PAGE && (
            <Box className="cp-pagination">
              <Typography variant="body2" className="cp-pagination-info">
                Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
              </Typography>
              <Box className="cp-pagination-buttons">
                {[
                  { label: "← Prev", disabled: page === 0,             action: () => setPage((p) => p - 1) },
                  { label: "Next →", disabled: page >= totalPages - 1, action: () => setPage((p) => p + 1) },
                ].map(({ label, disabled, action }) => (
                  <Button key={label} size="small" disabled={disabled} onClick={action} variant="outlined" className="cp-btn-page">
                    {label}
                  </Button>
                ))}
              </Box>
            </Box>
          )}
        </Paper>

        {/* ── EDIT DIALOG ─────────────────────────────────── */}
        <Dialog open={editOpen} onClose={closeEdit} maxWidth="sm" fullWidth
          PaperProps={{ className: "cp-dialog-paper" }}>
          <DialogTitle className="cp-dialog-title-primary">
            <Pencil size={18} /> Edit Coding Problem
          </DialogTitle>

          <DialogContent className="cp-dialog-content">
            <TextField
              label="Problem Statement" fullWidth size="small" multiline rows={4}
              value={editData.code_problem_statement}
              onChange={(e) => setEditData((p) => ({ ...p, code_problem_statement: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1.2 }}>
                    <Code2 size={15} className="cp-field-icon" />
                  </InputAdornment>
                ),
              }}
              className="cp-edit-field"
            />

            <Box>
              <Typography className="cp-tag-section-label">Tags</Typography>
              <Box className="cp-tag-input-row">
                <TextField
                  size="small" placeholder="Add a tag…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Tag size={14} className="cp-field-icon" />
                      </InputAdornment>
                    ),
                  }}
                  className="cp-tag-input"
                />
                <Button variant="outlined" size="small" onClick={addTag} className="cp-btn-tag-add">
                  Add
                </Button>
              </Box>
              <Box className="cp-tag-list">
                {editData.code_tags.map((tag, i) => (
                  <Chip key={i} label={tag} size="small" onDelete={() => removeTag(tag)} className="cp-chip-edit-tag" />
                ))}
                {editData.code_tags.length === 0 && (
                  <Typography className="cp-cell-muted">No tags added yet</Typography>
                )}
              </Box>
            </Box>
          </DialogContent>

          <DialogActions className="cp-dialog-actions">
            <Button onClick={closeEdit} variant="outlined" className="cp-btn-dialog-cancel">Cancel</Button>
            <Button onClick={saveEdit} variant="contained" disabled={editLoading} className="cp-btn-dialog-confirm">
              {editLoading
                ? <><CircularProgress size={14} className="cp-btn-spinner" />Saving…</>
                : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── DELETE DIALOG ───────────────────────────────── */}
        <Dialog open={delOpen} onClose={closeDel} maxWidth="xs" fullWidth
          PaperProps={{ className: "cp-dialog-paper" }}>
          <DialogTitle className="cp-dialog-title-danger">
            <Trash2 size={18} /> Delete Coding Problem
          </DialogTitle>
          <DialogContent className="cp-dialog-content-simple">
            <Typography className="cp-delete-prompt">
              You are about to permanently delete:
            </Typography>
            <Box className="cp-delete-info-box">
              <Typography className="cp-delete-info-name">
                {delRow?.code_problem_statement}
              </Typography>
              {Array.isArray(delRow?.code_tags) && delRow.code_tags.length > 0 && (
                <Box className="cp-delete-tags">
                  {delRow.code_tags.map((t, i) => (
                    <Chip key={i} label={t} size="small" className="cp-chip-tag" />
                  ))}
                </Box>
              )}
            </Box>
            <Typography variant="body2" className="cp-delete-warning">
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions className="cp-dialog-actions">
            <Button onClick={closeDel} variant="outlined" className="cp-btn-dialog-cancel">Cancel</Button>
            <Button onClick={confirmDel} variant="contained" disabled={delLoading} className="cp-btn-dialog-danger">
              {delLoading
                ? <><CircularProgress size={14} className="cp-btn-spinner" />Deleting…</>
                : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ────────────────────────────────────── */}
        <Snackbar
          open={sb.open} autoHideDuration={4000}
          onClose={() => setSb((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={sb.sev} variant="filled"
            onClose={() => setSb((s) => ({ ...s, open: false }))}
            className="cp-snackbar-alert"
          >
            {sb.msg}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default Codingpage;