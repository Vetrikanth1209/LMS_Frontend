import React, { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Paper, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, IconButton, Tooltip,
  InputAdornment, Chip, Avatar, CircularProgress,
} from "@mui/material";
import { fetchAllExperts, updateExpert, deleteExpert } from "../axios";
import Admin_Dashboard from "../components/AdminDash";
import {
  User, Briefcase, Phone, Fingerprint, List, Contact, Users,
  Pencil, Trash2, Search, X, RefreshCw,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";
import "../styles/ExpertPage.css";

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
};

const EMPTY_FORM = {
  mod_expert_name:   "",
  mod_expert_role:   "",
  mod_expert_mobile: "",
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
          ? <mark key={i} className="ep-highlight">{p}</mark>
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

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
const ExpertPage = () => {
  const [experts,  setExperts]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [sort,     setSort]     = useState({ field: "mod_expert_name", dir: "asc" });
  const [page,     setPage]     = useState(0);
  const PER_PAGE = 10;

  const [sb, setSb] = useState({ open: false, msg: "", sev: "success" });
  const toast = (msg, sev = "success") => setSb({ open: true, msg, sev });

  const [editOpen,    setEditOpen]    = useState(false);
  const [editRow,     setEditRow]     = useState(null);
  const [editData,    setEditData]    = useState(EMPTY_FORM);
  const [editLoading, setEditLoading] = useState(false);

  const [delOpen,    setDelOpen]    = useState(false);
  const [delRow,     setDelRow]     = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllExperts();
      setExperts(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message, "error");
      setExperts([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = q
      ? experts.filter((e) =>
          [e.mod_expert_name, e.mod_expert_role, e.mod_expert_mobile, e.mod_expert_id, e.poc_id]
            .concat(Array.isArray(e.mod_id) ? e.mod_id : [e.mod_id])
            .some((v) => String(v ?? "").toLowerCase().includes(q))
        )
      : [...experts];

    rows.sort((a, b) => {
      const av = String(a[sort.field] ?? "").toLowerCase();
      const bv = String(b[sort.field] ?? "").toLowerCase();
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return rows;
  }, [experts, search, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageRows   = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const toggleSort = (field) =>
    setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  const openEdit = (row) => {
    setEditRow(row);
    setEditData({
      mod_expert_name:   row.mod_expert_name   || "",
      mod_expert_role:   row.mod_expert_role   || "",
      mod_expert_mobile: row.mod_expert_mobile || "",
    });
    setEditOpen(true);
  };
  const closeEdit = () => { setEditOpen(false); setEditRow(null); setEditData(EMPTY_FORM); };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      await updateExpert({ mod_expert_id: editRow.mod_expert_id, ...editData });
      setExperts((prev) =>
        prev.map((e) => (e._id === editRow._id ? { ...e, ...editData } : e))
      );
      toast("Expert updated successfully!");
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
      await deleteExpert(delRow.mod_expert_id);
      setExperts((prev) => prev.filter((e) => e._id !== delRow._id));
      toast("Expert deleted successfully!");
      closeDel();
    } catch (e) {
      toast(`Delete failed: ${e.message}`, "error");
    } finally {
      setDelLoading(false);
    }
  };

  const cols = [
    { key: "mod_expert_name",   label: "Expert Name", w: "18%", sortable: true  },
    { key: "mod_expert_role",   label: "Role",        w: "15%", sortable: true  },
    { key: "mod_expert_mobile", label: "Mobile",      w: "13%", sortable: true  },
    { key: "mod_expert_id",     label: "Expert ID",   w: "18%", sortable: false },
    { key: "mod_id",            label: "Module IDs",  w: "18%", sortable: false },
    { key: "poc_id",            label: "POC ID",      w: "10%", sortable: false },
    { key: "_actions",          label: "Actions",     w: "8%",  sortable: false },
  ];

  const gridTemplate = cols.map((c) => c.w).join(" ");

  const cellContent = (col, row) => {
    const q = search.trim();
    switch (col.key) {

      case "mod_expert_name":
        return (
          <Box className="ep-cell-name">
            <Avatar className="ep-cell-name-avatar"><User size={14} /></Avatar>
            <Typography className="ep-cell-name-text"><HL text={row.mod_expert_name} q={q} /></Typography>
          </Box>
        );

      case "mod_expert_role":
        return (
          <Box className="ep-cell-role">
            <Briefcase size={14} color={C.accent} style={{ flexShrink: 0 }} />
            <Chip className="ep-cell-role-chip" size="small" label={<HL text={row.mod_expert_role} q={q} />} />
          </Box>
        );

      case "mod_expert_mobile":
        return (
          <Box className="ep-cell-icon-row">
            <Phone size={14} color={C.primary} style={{ flexShrink: 0 }} />
            <Typography className="ep-cell-text"><HL text={row.mod_expert_mobile} q={q} /></Typography>
          </Box>
        );

      case "mod_expert_id":
        return (
          <Box className="ep-cell-icon-row">
            <Fingerprint size={14} color={C.primary} style={{ flexShrink: 0 }} />
            <Typography className="ep-cell-text--mono"><HL text={row.mod_expert_id} q={q} /></Typography>
          </Box>
        );

      case "mod_id": {
        const ids = Array.isArray(row.mod_id) ? row.mod_id : [row.mod_id];
        return (
          <Box className="ep-cell-icon-row">
            <List size={14} color={C.primary} style={{ flexShrink: 0 }} />
            <Typography className="ep-cell-text--mono-wrap">{ids.join(", ")}</Typography>
          </Box>
        );
      }

      case "poc_id":
        return (
          <Box className="ep-cell-icon-row">
            <Contact size={14} color={C.primary} style={{ flexShrink: 0 }} />
            <Typography className="ep-cell-text--mono"><HL text={row.poc_id} q={q} /></Typography>
          </Box>
        );

      case "_actions":
        return (
          <Box className="ep-cell-actions">
            <Tooltip title="Edit Expert" arrow>
              <IconButton size="small" className="ep-action-btn-edit" onClick={() => openEdit(row)}>
                <Pencil size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Expert" arrow>
              <IconButton size="small" className="ep-action-btn-delete" onClick={() => openDel(row)}>
                <Trash2 size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        );

      default: return null;
    }
  };

  const fields = [
    { label: "Expert Name", key: "mod_expert_name",   icon: <User      size={15} /> },
    { label: "Role",        key: "mod_expert_role",   icon: <Briefcase size={15} /> },
    { label: "Mobile",      key: "mod_expert_mobile", icon: <Phone     size={15} /> },
  ];

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <>
      <Admin_Dashboard />
      <Box className="ep-root">

        {/* ── Header ─────────────────────────────────────── */}
        <Box className="ep-header">
          <Box>
            <Typography className="ep-header-title">Expert Management</Typography>
            <Typography variant="body2" className="ep-header-subtitle">
              View and manage all registered experts
            </Typography>
          </Box>

          {/* Stat chips */}
          <Box className="ep-stat-chips">
            {[
              { label: "Total",    value: experts.length,  color: C.primary, icon: <Users  size={18} /> },
              { label: "Filtered", value: filtered.length, color: C.accent,  icon: <Search size={18} /> },
            ].map(({ label, value, color, icon }) => (
              <Box key={label} className="ep-stat-chip">
                <Box sx={{ color }}>{icon}</Box>
                <Box>
                  <Typography className="ep-stat-chip-value" sx={{ color }}>{value}</Typography>
                  <Typography variant="caption" className="ep-stat-chip-label">{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Toolbar ────────────────────────────────────── */}
        <Paper elevation={0} className="ep-toolbar">
          <TextField
            placeholder="Search by name, role, mobile, ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            size="small"
            className="ep-search-field"
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
            <IconButton onClick={load} className="ep-refresh-btn">
              <RefreshCw size={17} />
            </IconButton>
          </Tooltip>
          {search && (
            <Chip
              className="ep-result-chip"
              size="small"
              label={`${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
            />
          )}
        </Paper>

        {/* ── Custom Table ────────────────────────────────── */}
        <Paper elevation={0} className="ep-table-card">

          {/* thead */}
          <Box className="ep-thead" style={{ gridTemplateColumns: gridTemplate }}>
            {cols.map((col) => (
              <Box
                key={col.key}
                className={`ep-th ${col.sortable ? "ep-th--sortable" : ""}`}
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                <Typography className="ep-th-label">{col.label}</Typography>
                {col.sortable && <SortIcon field={col.key} sort={sort} />}
              </Box>
            ))}
          </Box>

          {/* tbody */}
          {loading ? (
            <Box className="ep-tbody-loading">
              <CircularProgress size={36} sx={{ color: C.primary }} />
            </Box>
          ) : pageRows.length === 0 ? (
            <Box className="ep-tbody-empty">
              <Users size={40} color={C.border} style={{ margin: "0 auto 12px" }} />
              <Typography className="ep-tbody-empty-label">No experts found</Typography>
            </Box>
          ) : (
            pageRows.map((row, i) => (
              <Box
                key={row._id}
                className="ep-tr"
                style={{
                  gridTemplateColumns: gridTemplate,
                  backgroundColor: i % 2 === 0 ? C.surface : C.stripe,
                }}
              >
                {cols.map((col) => (
                  <Box key={col.key} className="ep-td">
                    {cellContent(col, row)}
                  </Box>
                ))}
              </Box>
            ))
          )}

          {/* pagination */}
          {!loading && filtered.length > PER_PAGE && (
            <Box className="ep-pagination">
              <Typography variant="body2" className="ep-pagination-info">
                Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
              </Typography>
              <Box className="ep-pagination-btns">
                {[
                  { label: "← Prev", disabled: page === 0,             action: () => setPage((p) => p - 1) },
                  { label: "Next →", disabled: page >= totalPages - 1, action: () => setPage((p) => p + 1) },
                ].map(({ label, disabled, action }) => (
                  <Button
                    key={label} size="small" disabled={disabled}
                    onClick={action} variant="outlined" className="ep-pagination-btn"
                  >
                    {label}
                  </Button>
                ))}
              </Box>
            </Box>
          )}

        </Paper>

        {/* ── Edit Dialog ─────────────────────────────────── */}
        <Dialog open={editOpen} onClose={closeEdit} maxWidth="sm" fullWidth className="ep-edit-dialog"
          PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden" } }}>
          <DialogTitle className="ep-edit-dialog-title">
            <Pencil size={18} /> Edit Expert
          </DialogTitle>
          <DialogContent className="ep-edit-dialog-content">
            {fields.map(({ label, key, icon }) => (
              <TextField
                key={key} label={label} fullWidth size="small"
                value={editData[key]}
                onChange={(e) => setEditData((p) => ({ ...p, [key]: e.target.value }))}
                className="ep-edit-field"
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
          <DialogActions className="ep-edit-dialog-actions">
            <Button onClick={closeEdit} variant="outlined" className="ep-btn-cancel">Cancel</Button>
            <Button onClick={saveEdit} variant="contained" disabled={editLoading} className="ep-btn-save" disableElevation>
              {editLoading
                ? <><CircularProgress size={14} sx={{ color: "#fff", mr: 1 }} />Saving…</>
                : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete Dialog ───────────────────────────────── */}
        <Dialog open={delOpen} onClose={closeDel} maxWidth="xs" fullWidth className="ep-del-dialog"
          PaperProps={{ sx: { borderRadius: "20px", overflow: "hidden" } }}>
          <DialogTitle className="ep-del-dialog-title">
            <Trash2 size={18} /> Delete Expert
          </DialogTitle>
          <DialogContent className="ep-del-dialog-content">
            <Typography className="ep-del-desc">You are about to permanently delete:</Typography>
            <Box className="ep-del-user-box">
              <Typography className="ep-del-user-name">{delRow?.mod_expert_name}</Typography>
              <Typography variant="caption" className="ep-del-user-meta">
                {delRow?.mod_expert_role} · {delRow?.mod_expert_mobile}
              </Typography>
            </Box>
            <Typography variant="body2" className="ep-del-warning">This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions className="ep-del-dialog-actions">
            <Button onClick={closeDel} variant="outlined" className="ep-btn-cancel">Cancel</Button>
            <Button onClick={confirmDel} variant="contained" disabled={delLoading} className="ep-btn-delete" disableElevation>
              {delLoading
                ? <><CircularProgress size={14} sx={{ color: "#fff", mr: 1 }} />Deleting…</>
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
            className="ep-snackbar-alert"
          >
            {sb.msg}
          </Alert>
        </Snackbar>

      </Box>
    </>
  );
};

export default ExpertPage;