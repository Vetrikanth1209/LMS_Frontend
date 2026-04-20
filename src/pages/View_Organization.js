import React, { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Paper, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, IconButton, Tooltip,
  InputAdornment, Chip, Avatar, CircularProgress,
} from "@mui/material";
import { fetchAllOrganizations, updateOrganization, deleteOrganization } from "../axios";
import Admin_Dashboard from "../components/AdminDash";
import {
  MapPin, Mail, Phone, Calendar, Building2,
  Pencil, Trash2, Search, X, RefreshCw,
  ChevronUp, ChevronDown, ChevronsUpDown,
} from "lucide-react";

// ─── Styles ───────────────────────────────────────────────────────────────────
import "../styles/View_Organization.css";

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

const EMPTY_FORM = {
  org_name: "", org_address: "", org_email: "",
  org_contact: "", org_associated_date: "",
};

const COLS = [
  { key: "org_name",            label: "Organization", w: "22%", sortable: true  },
  { key: "org_address",         label: "Address",      w: "22%", sortable: true  },
  { key: "org_email",           label: "Email",        w: "20%", sortable: true  },
  { key: "org_contact",         label: "Contact",      w: "13%", sortable: true  },
  { key: "org_associated_date", label: "Joined",       w: "13%", sortable: true  },
  { key: "_actions",            label: "Actions",      w: "10%", sortable: false },
];

const EDIT_FIELDS = [
  { label: "Organization Name", key: "org_name",            type: "text",  icon: <Building2 size={15} /> },
  { label: "Address",           key: "org_address",         type: "text",  icon: <MapPin    size={15} /> },
  { label: "Email",             key: "org_email",           type: "email", icon: <Mail      size={15} /> },
  { label: "Contact",           key: "org_contact",         type: "text",  icon: <Phone     size={15} /> },
  { label: "Associated Date",   key: "org_associated_date", type: "date",  icon: <Calendar  size={15} /> },
];

const STAT_CHIPS = (orgs, filtered) => [
  { label: "Total",    color: C.primary  , getValue: () => orgs.length     },
  { label: "Filtered", color: C.accent   , getValue: () => filtered.length },
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
          ? <mark key={i} className="org-highlight">{p}</mark>
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

const OrganizationPage = () => {

  // ── State ──────────────────────────────────────────────────────────────────

  const [orgs,    setOrgs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [sort,    setSort]    = useState({ field: "org_name", dir: "asc" });
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
      const data = await fetchAllOrganizations();
      setOrgs(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message, "error");
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived rows ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = q
      ? orgs.filter((o) =>
          [o.org_name, o.org_email, o.org_address, o.org_contact]
            .some((v) => String(v ?? "").toLowerCase().includes(q))
        )
      : [...orgs];

    rows.sort((a, b) => {
      const av = String(a[sort.field] ?? "").toLowerCase();
      const bv = String(b[sort.field] ?? "").toLowerCase();
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return rows;
  }, [orgs, search, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageRows   = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const toggleSort = (field) =>
    setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  // ── Edit handlers ──────────────────────────────────────────────────────────

  const openEdit = (row) => {
    setEditRow(row);
    setEditData({
      org_id:               row.org_id || "",
      org_name:             row.org_name || "",
      org_address:          row.org_address || "",
      org_email:            row.org_email || "",
      org_contact:          row.org_contact || "",
      org_associated_date:  row.org_associated_date
        ? new Date(row.org_associated_date).toISOString().split("T")[0]
        : "",
    });
    setEditOpen(true);
  };
  const closeEdit = () => { setEditOpen(false); setEditRow(null); setEditData(EMPTY_FORM); };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      const { org_id, ...cleanData } = editData;
      await updateOrganization(editRow.org_id, cleanData);
      setOrgs((prev) => prev.map((o) => (o._id === editRow._id ? { ...o, ...cleanData } : o)));
      toast("Organization updated successfully!");
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
      await deleteOrganization(delRow.mod_id);
      setOrgs((prev) => prev.filter((o) => o._id !== delRow._id));
      toast("Organization deleted successfully!");
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

      case "org_name":
        return (
          <Box className="org-cell-name-box">
            <Avatar className="org-cell-name-avatar"><Building2 size={14} /></Avatar>
            <Typography className="org-cell-name-text"><HL text={row.org_name} q={q} /></Typography>
          </Box>
        );

      case "org_address":
        return (
          <Box className="org-cell-address-box">
            <MapPin size={14} color={C.primary} style={{ marginTop: 2, flexShrink: 0 }} />
            <Typography className="org-cell-address-text"><HL text={row.org_address} q={q} /></Typography>
          </Box>
        );

      case "org_email":
        return (
          <Box className="org-cell-icon-row">
            <Mail size={14} color={C.primary} style={{ flexShrink: 0 }} />
            <Typography className="org-cell-text"><HL text={row.org_email} q={q} /></Typography>
          </Box>
        );

      case "org_contact":
        return (
          <Box className="org-cell-icon-row">
            <Phone size={14} color={C.primary} />
            <Typography className="org-cell-text"><HL text={row.org_contact} q={q} /></Typography>
          </Box>
        );

      case "org_associated_date":
        return (
          <Chip
            icon={<Calendar size={12} color={C.primary} />}
            label={row.org_associated_date ? new Date(row.org_associated_date).toLocaleDateString() : "N/A"}
            size="small"
            className="org-date-chip"
          />
        );

      case "_actions":
        return (
          <Box className="org-action-box">
            <Tooltip title="Edit" arrow>
              <IconButton size="small" onClick={() => openEdit(row)} className="org-btn-edit">
                <Pencil size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete" arrow>
              <IconButton size="small" onClick={() => openDel(row)} className="org-btn-delete">
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

      <Box className="org-page-wrapper">

        {/* ── Header ── */}
        <Box className="org-header">
          <Box>
            <Typography className="org-header-title">Organization Management</Typography>
            <Typography variant="body2" className="org-header-subtitle">
              View, edit and manage all registered organizations
            </Typography>
          </Box>

          {/* Stat chips */}
          <Box className="org-stat-chips">
            {[
              { label: "Total",    value: orgs.length,     color: C.primary },
              { label: "Filtered", value: filtered.length, color: C.accent  },
            ].map(({ label, value, color }) => (
              <Box key={label} className="org-stat-chip">
                <Building2 size={18} color={color} />
                <Box>
                  <Typography className="org-stat-chip-value" sx={{ color }}>{value}</Typography>
                  <Typography variant="caption" className="org-stat-chip-label">{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Toolbar ── */}
        <Paper elevation={0} className="org-toolbar">
          <TextField
            placeholder="Search name, email, address, contact…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            size="small"
            className="org-search-field"
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
            <IconButton onClick={load} className="org-btn-refresh">
              <RefreshCw size={17} />
            </IconButton>
          </Tooltip>

          {search && (
            <Chip
              label={`${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
              size="small"
              className="org-results-chip"
            />
          )}
        </Paper>

        {/* ── Table ── */}
        <Paper elevation={0} className="org-table-paper">

          {/* thead */}
          <Box className="org-table-head" sx={{ gridTemplateColumns: gridTemplate }}>
            {COLS.map((col) => (
              <Box
                key={col.key}
                className={`org-table-head-cell${col.sortable ? " sortable" : ""}`}
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                <Typography className="org-table-head-label">{col.label}</Typography>
                {col.sortable && <SortIcon field={col.key} sort={sort} />}
              </Box>
            ))}
          </Box>

          {/* tbody */}
          {loading ? (
            <Box className="org-loader-box">
              <CircularProgress size={36} sx={{ color: C.primary }} />
            </Box>
          ) : pageRows.length === 0 ? (
            <Box className="org-empty-box">
              <Building2 size={40} color={C.border} style={{ margin: "0 auto 12px" }} />
              <Typography className="org-empty-label">No organizations found</Typography>
            </Box>
          ) : (
            pageRows.map((row, i) => (
              <Box
                key={row._id}
                className={`org-table-row ${i % 2 === 0 ? "even" : "odd"}`}
                sx={{ gridTemplateColumns: gridTemplate }}
              >
                {COLS.map((col) => (
                  <Box key={col.key} className="org-table-cell">
                    {cellContent(col, row)}
                  </Box>
                ))}
              </Box>
            ))
          )}

          {/* Pagination */}
          {!loading && filtered.length > PER_PAGE && (
            <Box className="org-pagination">
              <Typography variant="body2" className="org-pagination-info">
                Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
              </Typography>
              <Box className="org-pagination-buttons">
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
                    className="org-btn-page"
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
          PaperProps={{ className: "org-dialog-paper" }}>
          <DialogTitle className="org-dialog-title-primary">
            <Pencil size={18} /> Edit Organization
          </DialogTitle>
          <DialogContent className="org-dialog-content">
            {EDIT_FIELDS.map(({ label, key, type, icon }) => (
              <TextField
                key={key}
                label={label}
                type={type}
                fullWidth
                size="small"
                value={editData[key]}
                onChange={(e) => setEditData((p) => ({ ...p, [key]: e.target.value }))}
                className="org-edit-field"
                InputLabelProps={type === "date" ? { shrink: true } : undefined}
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
          <DialogActions className="org-dialog-actions">
            <Button onClick={closeEdit} variant="outlined" className="org-btn-dialog-cancel">
              Cancel
            </Button>
            <Button onClick={saveEdit} variant="contained" disabled={editLoading} className="org-btn-dialog-confirm">
              {editLoading
                ? <><CircularProgress size={14} sx={{ color: "#fff", mr: 1 }} />Saving…</>
                : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete Dialog ── */}
        <Dialog open={delOpen} onClose={closeDel} maxWidth="xs" fullWidth
          PaperProps={{ className: "org-dialog-paper" }}>
          <DialogTitle className="org-dialog-title-danger">
            <Trash2 size={18} /> Confirm Delete
          </DialogTitle>
          <DialogContent className="org-dialog-content-simple">
            <Typography sx={{ color: C.text, mb: 1.5 }}>
              You are about to permanently delete:
            </Typography>
            <Box className="org-delete-info-box">
              <Typography className="org-delete-info-name">{delRow?.org_name}</Typography>
              <Typography variant="caption" className="org-delete-info-sub">{delRow?.org_email}</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: C.muted, mt: 2 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions className="org-dialog-actions">
            <Button onClick={closeDel} variant="outlined" className="org-btn-dialog-cancel">
              Cancel
            </Button>
            <Button onClick={confirmDel} variant="contained" disabled={delLoading} className="org-btn-dialog-danger">
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
            className="org-snackbar-alert"
          >
            {sb.msg}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default OrganizationPage;