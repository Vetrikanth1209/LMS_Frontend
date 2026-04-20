import React, { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Paper, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, IconButton, Tooltip,
  InputAdornment, Chip, Avatar, CircularProgress,
} from "@mui/material";
import { fetchAllModules, updateModule, deleteModule } from "../axios";
import Admin_Dashboard from "../components/AdminDash";
import {
  Book, Code, Clock, Layers,
  Pencil, Trash2, Search, X, RefreshCw,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";

// ─── Styles ───────────────────────────────────────────────────────────────────
import "../styles/View_Module.css";

// ─── Design Tokens (kept in JS — used in icon color props) ───────────────────
const C = {
  primary:      "#0c83c8",
  primaryDark:  "#0a6faa",
  primaryLight: "#e8f4fd",
  accent:       "#38bdf8",
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

const EMPTY_FORM = { mod_name: "", mod_tech: "", mod_duration: "" };

const COLS = [
  { key: "mod_name",     label: "Module Name", w: "28%", sortable: true  },
  { key: "mod_tech",     label: "Technology",  w: "28%", sortable: true  },
  { key: "mod_duration", label: "Duration",    w: "22%", sortable: true  },
  { key: "_actions",     label: "Actions",     w: "22%", sortable: false },
];

const EDIT_FIELDS = [
  { label: "Module Name", key: "mod_name",     icon: <Book  size={15} /> },
  { label: "Technology",  key: "mod_tech",     icon: <Code  size={15} /> },
  { label: "Duration",    key: "mod_duration", icon: <Clock size={15} /> },
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
          ? <mark key={i} className="mod-highlight">{p}</mark>
          : p
      )}
    </>
  );
};

const SortIcon = ({ field, sort }) => {
  if (sort.field !== field) return <ChevronsUpDown size={13} style={{ opacity: 0.4 }} />;
  return sort.dir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
};

// ─── Component ────────────────────────────────────────────────────────────────

const ModulePage = () => {

  // ── State ──────────────────────────────────────────────────────────────────

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [sort,    setSort]    = useState({ field: "mod_name", dir: "asc" });
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

  // ── Data loading ───────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllModules();
      setModules(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message, "error");
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived rows ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = q
      ? modules.filter((m) =>
          [m.mod_name, m.mod_tech, m.mod_duration]
            .some((v) => String(v ?? "").toLowerCase().includes(q))
        )
      : [...modules];

    rows.sort((a, b) => {
      const av = String(a[sort.field] ?? "").toLowerCase();
      const bv = String(b[sort.field] ?? "").toLowerCase();
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return rows;
  }, [modules, search, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageRows   = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const toggleSort = (field) =>
    setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  // ── Edit handlers ──────────────────────────────────────────────────────────

  const openEdit = (row) => {
    setEditRow(row);
    setEditData({
      mod_name:     row.mod_name     || "",
      mod_tech:     row.mod_tech     || "",
      mod_duration: row.mod_duration || "",
    });
    setEditOpen(true);
  };
  const closeEdit = () => { setEditOpen(false); setEditRow(null); setEditData(EMPTY_FORM); };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      await updateModule({ mod_id: editRow.mod_id, ...editData });
      setModules((prev) =>
        prev.map((m) => (m._id === editRow._id ? { ...m, ...editData } : m))
      );
      toast("Module updated successfully!");
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
      await deleteModule(delRow.mod_id);
      setModules((prev) => prev.filter((m) => m._id !== delRow._id));
      toast("Module deleted successfully!");
      closeDel();
    } catch (e) {
      toast(`Delete failed: ${e.message}`, "error");
    } finally {
      setDelLoading(false);
    }
  };

  // ── Cell renderer ──────────────────────────────────────────────────────────

  const cellContent = (col, row) => {
    const q = search.trim();
    switch (col.key) {

      case "mod_name":
        return (
          <Box className="mod-cell-name-box">
            <Avatar className="mod-cell-name-avatar"><Book size={14} /></Avatar>
            <Typography className="mod-cell-name-text">
              <HL text={row.mod_name} q={q} />
            </Typography>
          </Box>
        );

      case "mod_tech":
        return (
          <Box className="mod-cell-icon-row">
            <Code size={15} color={C.primary} style={{ flexShrink: 0 }} />
            <Chip label={<HL text={row.mod_tech} q={q} />} size="small" className="mod-tech-chip" />
          </Box>
        );

      case "mod_duration":
        return (
          <Box className="mod-cell-icon-row">
            <Clock size={15} color={C.primary} style={{ flexShrink: 0 }} />
            <Chip label={<HL text={row.mod_duration} q={q} />} size="small" className="mod-duration-chip" />
          </Box>
        );

      case "_actions":
        return (
          <Box className="mod-action-box">
            <Tooltip title="Edit Module" arrow>
              <IconButton size="small" onClick={() => openEdit(row)} className="mod-btn-edit">
                <Pencil size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Module" arrow>
              <IconButton size="small" onClick={() => openDel(row)} className="mod-btn-delete">
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

  return (
    <>
      <Admin_Dashboard />

      <Box className="mod-page-wrapper">

        {/* ── Header ── */}
        <Box className="mod-header">
          <Box>
            <Typography className="mod-header-title">Module Management</Typography>
            <Typography variant="body2" className="mod-header-subtitle">
              View all available training modules
            </Typography>
          </Box>

          {/* Stat chips */}
          <Box className="mod-stat-chips">
            {[
              { label: "Total",    value: modules.length,  color: C.primary, icon: <Layers size={18} /> },
              { label: "Filtered", value: filtered.length, color: C.accent,  icon: <Search size={18} /> },
            ].map(({ label, value, color, icon }) => (
              <Box key={label} className="mod-stat-chip">
                <Box sx={{ color }}>{icon}</Box>
                <Box>
                  <Typography className="mod-stat-chip-value" sx={{ color }}>{value}</Typography>
                  <Typography variant="caption" className="mod-stat-chip-label">{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Toolbar ── */}
        <Paper elevation={0} className="mod-toolbar">
          <TextField
            placeholder="Search by name, technology, duration…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            size="small"
            className="mod-search-field"
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
            <IconButton onClick={load} className="mod-btn-refresh">
              <RefreshCw size={17} />
            </IconButton>
          </Tooltip>

          {search && (
            <Chip
              label={`${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
              size="small"
              className="mod-results-chip"
            />
          )}
        </Paper>

        {/* ── Table ── */}
        <Paper elevation={0} className="mod-table-paper">

          {/* thead */}
          <Box className="mod-table-head" sx={{ gridTemplateColumns: gridTemplate }}>
            {COLS.map((col) => (
              <Box
                key={col.key}
                className={`mod-table-head-cell${col.sortable ? " sortable" : ""}`}
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                <Typography className="mod-table-head-label">{col.label}</Typography>
                {col.sortable && <SortIcon field={col.key} sort={sort} />}
              </Box>
            ))}
          </Box>

          {/* tbody */}
          {loading ? (
            <Box className="mod-loader-box">
              <CircularProgress size={36} sx={{ color: C.primary }} />
            </Box>
          ) : pageRows.length === 0 ? (
            <Box className="mod-empty-box">
              <Book size={40} color={C.border} style={{ margin: "0 auto 12px" }} />
              <Typography className="mod-empty-label">No modules found</Typography>
            </Box>
          ) : (
            pageRows.map((row, i) => (
              <Box
                key={row._id}
                className={`mod-table-row ${i % 2 === 0 ? "even" : "odd"}`}
                sx={{ gridTemplateColumns: gridTemplate }}
              >
                {COLS.map((col) => (
                  <Box key={col.key} className="mod-table-cell">
                    {cellContent(col, row)}
                  </Box>
                ))}
              </Box>
            ))
          )}

          {/* Pagination */}
          {!loading && filtered.length > PER_PAGE && (
            <Box className="mod-pagination">
              <Typography variant="body2" className="mod-pagination-info">
                Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
              </Typography>
              <Box className="mod-pagination-buttons">
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
                    className="mod-btn-page"
                  >
                    {label}
                  </Button>
                ))}
              </Box>
            </Box>
          )}
        </Paper>

        {/* ── Edit Dialog ── */}
        <Dialog open={editOpen} onClose={closeEdit} maxWidth="sm" fullWidth
          PaperProps={{ className: "mod-dialog-paper" }}>
          <DialogTitle className="mod-dialog-title-primary">
            <Pencil size={18} /> Edit Module
          </DialogTitle>
          <DialogContent className="mod-dialog-content">
            {EDIT_FIELDS.map(({ label, key, icon }) => (
              <TextField
                key={key}
                label={label}
                fullWidth
                size="small"
                value={editData[key]}
                onChange={(e) => setEditData((p) => ({ ...p, [key]: e.target.value }))}
                className="mod-edit-field"
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
          <DialogActions className="mod-dialog-actions">
            <Button onClick={closeEdit} variant="outlined" className="mod-btn-dialog-cancel">
              Cancel
            </Button>
            <Button onClick={saveEdit} variant="contained" disabled={editLoading} className="mod-btn-dialog-confirm">
              {editLoading
                ? <><CircularProgress size={14} sx={{ color: "#fff", mr: 1 }} />Saving…</>
                : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete Dialog ── */}
        <Dialog open={delOpen} onClose={closeDel} maxWidth="xs" fullWidth
          PaperProps={{ className: "mod-dialog-paper" }}>
          <DialogTitle className="mod-dialog-title-danger">
            <Trash2 size={18} /> Delete Module
          </DialogTitle>
          <DialogContent className="mod-dialog-content-simple">
            <Typography sx={{ color: C.text, mb: 1.5 }}>
              You are about to permanently delete:
            </Typography>
            <Box className="mod-delete-info-box">
              <Typography className="mod-delete-info-name">{delRow?.mod_name}</Typography>
              <Typography variant="caption" className="mod-delete-info-sub">
                {delRow?.mod_tech} · {delRow?.mod_duration}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: C.muted, mt: 2 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions className="mod-dialog-actions">
            <Button onClick={closeDel} variant="outlined" className="mod-btn-dialog-cancel">
              Cancel
            </Button>
            <Button onClick={confirmDel} variant="contained" disabled={delLoading} className="mod-btn-dialog-danger">
              {delLoading
                ? <><CircularProgress size={14} sx={{ color: "#fff", mr: 1 }} />Deleting…</>
                : "Delete"}
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
            className="mod-snackbar-alert"
          >
            {sb.msg}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default ModulePage;