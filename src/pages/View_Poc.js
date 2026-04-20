import React, { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Paper, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, IconButton, Tooltip,
  InputAdornment, Chip, Avatar, CircularProgress, Switch,
} from "@mui/material";
import { fetchAllPocs, getModuleById, updatePoc, deletePoc } from "../axios";
import Admin_Dashboard from "../components/AdminDash";
import {
  User, Mail, Phone, Calendar, Award, Users, FileText,
  Pencil, Trash2, Search, X, RefreshCw,
  ChevronUp, ChevronDown, ChevronsUpDown, Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── Styles ───────────────────────────────────────────────────────────────────
import "../styles/View_Poc.css";

// ─── Design Tokens (JS — used in sx props and inline styles) ─────────────────
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
  mod_poc_name:   "",
  mod_poc_role:   "",
  mod_poc_email:  "",
  mod_poc_mobile: "",
};

const COLS = [
  { key: "mod_poc_name",    label: "POC Name",    w: "160px", sortable: true  },
  { key: "mod_poc_role",    label: "Role",         w: "120px", sortable: true  },
  { key: "mod_poc_email",   label: "Email",        w: "200px", sortable: true  },
  { key: "mod_poc_mobile",  label: "Mobile",       w: "130px", sortable: true  },
  { key: "poc_certificate", label: "Certificate",  w: "160px", sortable: false },
  { key: "module_name",     label: "Module",       w: "160px", sortable: false },
  { key: "module_duration", label: "Duration",     w: "170px", sortable: false },
  { key: "liveStatus",      label: "Status",       w: "100px", sortable: false },
  { key: "_actions",        label: "Actions",      w: "90px",  sortable: false },
];

const EDIT_FIELDS = [
  { label: "POC Name", key: "mod_poc_name",   icon: <User  size={15} /> },
  { label: "Role",     key: "mod_poc_role",   icon: <Award size={15} /> },
  { label: "Email",    key: "mod_poc_email",  icon: <Mail  size={15} /> },
  { label: "Mobile",   key: "mod_poc_mobile", icon: <Phone size={15} /> },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

const formatPoc = async (poc) => {
  try {
    const module = await getModuleById(poc.mod_id);
    const [startDateStr, endDateStr] = module.mod_duration.split(" - ");
    const parse   = (s) => new Date(s.split("/").reverse().join("-"));
    const strip   = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today   = strip(new Date());
    const start   = strip(parse(startDateStr));
    const end     = strip(parse(endDateStr));
    const isLive  = today >= start && today <= end;
    return {
      ...poc,
      module_name:     module.mod_name,
      module_duration: module.mod_duration,
      liveStatus:      isLive ? "Live" : "Not Live",
    };
  } catch {
    return { ...poc, module_name: "N/A", module_duration: "N/A", liveStatus: "Unknown" };
  }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const HL = ({ text = "", q = "" }) => {
  if (!q) return <>{text}</>;
  const safe  = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${safe})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === q.toLowerCase()
          ? <mark key={i} className="poc-highlight">{p}</mark>
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

const View_Poc = () => {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────

  const [pocs,    setPocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [sort,    setSort]    = useState({ field: "mod_poc_name", dir: "asc" });
  const [page,    setPage]    = useState(0);
  const [showLiveOnly, setShowLiveOnly] = useState(false);

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

  // Cert dialog
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [certRow,        setCertRow]        = useState(null);
  const [certPending,    setCertPending]    = useState(null);
  const [certLoading,    setCertLoading]    = useState(false);

  // ── Data loading ───────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetchAllPocs();
      const raw      = Array.isArray(response.data) ? response.data : [];
      const enriched = await Promise.all(raw.map(formatPoc));
      setPocs(enriched);
    } catch (e) {
      toast(e.message, "error");
      setPocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Derived rows ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = q
      ? pocs.filter((p) =>
          [p.mod_poc_name, p.mod_poc_role, p.mod_poc_email, p.mod_poc_mobile, p.mod_poc_id, p.module_name]
            .some((v) => String(v ?? "").toLowerCase().includes(q))
        )
      : [...pocs];

    if (showLiveOnly) rows = rows.filter((p) => p.liveStatus === "Live");

    rows.sort((a, b) => {
      const av = String(a[sort.field] ?? "").toLowerCase();
      const bv = String(b[sort.field] ?? "").toLowerCase();
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return rows;
  }, [pocs, search, sort, showLiveOnly]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageRows   = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const toggleSort = (field) =>
    setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  // ── Edit handlers ──────────────────────────────────────────────────────────

  const openEdit = (row) => {
    setEditRow(row);
    setEditData({
      mod_poc_name:   row.mod_poc_name   || "",
      mod_poc_role:   row.mod_poc_role   || "",
      mod_poc_email:  row.mod_poc_email  || "",
      mod_poc_mobile: row.mod_poc_mobile || "",
    });
    setEditOpen(true);
  };
  const closeEdit = () => { setEditOpen(false); setEditRow(null); setEditData(EMPTY_FORM); };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      await updatePoc({ mod_poc_id: editRow.mod_poc_id, ...editData });
      setPocs((prev) => prev.map((p) => (p._id === editRow._id ? { ...p, ...editData } : p)));
      toast("POC updated successfully!");
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
      await deletePoc(delRow.mod_poc_id);
      setPocs((prev) => prev.filter((p) => p._id !== delRow._id));
      toast("POC deleted successfully!");
      closeDel();
    } catch (e) {
      toast(`Delete failed: ${e.message}`, "error");
    } finally {
      setDelLoading(false);
    }
  };

  // ── Cert handlers ──────────────────────────────────────────────────────────

  const openCert  = (row, newStatus) => { setCertRow(row); setCertPending(newStatus); setCertDialogOpen(true); };
  const closeCert = () => { setCertDialogOpen(false); setCertRow(null); setCertPending(null); };

  const confirmCert = async () => {
    setCertLoading(true);
    try {
      await updatePoc({ mod_poc_id: certRow.mod_poc_id, poc_certificate: { cert_status: certPending } });
      setPocs((prev) =>
        prev.map((p) =>
          p._id === certRow._id
            ? { ...p, poc_certificate: { ...p.poc_certificate, cert_status: certPending } }
            : p
        )
      );
      toast(`Certificate status ${certPending ? "activated" : "deactivated"} successfully!`);
      closeCert();
    } catch (e) {
      toast(`Failed to update certificate: ${e.message}`, "error");
    } finally {
      setCertLoading(false);
    }
  };

  // ── Cell renderer ──────────────────────────────────────────────────────────

  const cellContent = (col, row) => {
    const q = search.trim();
    switch (col.key) {

      case "mod_poc_name":
        return (
          <Box className="poc-cell-name-box">
            <Avatar className="poc-cell-name-avatar"><User size={14} /></Avatar>
            <Typography className="poc-cell-name-text"><HL text={row.mod_poc_name} q={q} /></Typography>
          </Box>
        );

      case "mod_poc_role":
        return (
          <Chip
            label={<HL text={row.mod_poc_role} q={q} />}
            size="small"
            className="poc-role-chip"
          />
        );

      case "mod_poc_email":
        return (
          <Box className="poc-cell-icon-row">
            <Mail size={14} color={C.primary} style={{ flexShrink: 0 }} />
            <Typography className="poc-cell-text"><HL text={row.mod_poc_email} q={q} /></Typography>
          </Box>
        );

      case "mod_poc_mobile":
        return (
          <Box className="poc-cell-icon-row">
            <Phone size={14} color={C.primary} style={{ flexShrink: 0 }} />
            <Typography className="poc-cell-text"><HL text={row.mod_poc_mobile} q={q} /></Typography>
          </Box>
        );

      case "poc_certificate": {
        const issued = row.poc_certificate?.cert_status || false;
        return (
          <Box className="poc-cell-icon-row">
            <Chip
              icon={<Award size={13} color={issued ? "#2e7d32" : C.primary} />}
              label={issued ? "Issued" : "Not Issued"}
              size="small"
              className={issued ? "poc-cert-chip-issued" : "poc-cert-chip-not-issued"}
            />
            <Switch
              checked={issued}
              onChange={() => openCert(row, !issued)}
              size="small"
              className="poc-cert-switch"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: C.accent },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: C.primary },
              }}
            />
          </Box>
        );
      }

      case "module_name":
        return <Typography className="poc-cell-text-bold"><HL text={row.module_name} q={q} /></Typography>;

      case "module_duration":
        return (
          <Box className="poc-cell-icon-row">
            <Calendar size={14} color={C.primary} style={{ flexShrink: 0 }} />
            <Typography className="poc-cell-text-muted">{row.module_duration}</Typography>
          </Box>
        );

      case "liveStatus": {
        const live = row.liveStatus === "Live";
        return (
          <Box className="poc-cell-icon-row">
            <Box className={`poc-status-dot ${live ? "live" : "not-live"}`} />
            <Typography className={live ? "poc-status-text-live" : "poc-status-text-not-live"}>
              {row.liveStatus}
            </Typography>
          </Box>
        );
      }

      case "_actions":
        return (
          <Box className="poc-action-box">
            <Tooltip title="Edit POC" arrow>
              <IconButton size="small" onClick={() => openEdit(row)} className="poc-btn-edit">
                <Pencil size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete POC" arrow>
              <IconButton size="small" onClick={() => openDel(row)} className="poc-btn-delete">
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

      <Box className="poc-view-wrapper">

        {/* ── Header ── */}
        <Box className="poc-view-header">
          <Box>
            <Typography className="poc-view-title">POC Management</Typography>
            <Typography variant="body2" className="poc-view-subtitle">
              View and manage all registered Points of Contact
            </Typography>
          </Box>

          {/* Stat chips */}
          <Box className="poc-stat-chips">
            {[
              { label: "Total",    value: pocs.length,                                     color: C.primary,  icon: <Users   size={18} /> },
              { label: "Live",     value: pocs.filter((p) => p.liveStatus === "Live").length, color: "#2e7d32", icon: <FileText size={18} /> },
              { label: "Filtered", value: filtered.length,                                  color: C.accent,   icon: <Search  size={18} /> },
            ].map(({ label, value, color, icon }) => (
              <Box key={label} className="poc-stat-chip">
                <Box sx={{ color }}>{icon}</Box>
                <Box>
                  <Typography className="poc-stat-chip-value" sx={{ color }}>{value}</Typography>
                  <Typography variant="caption" className="poc-stat-chip-label">{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Toolbar ── */}
        <Paper elevation={0} className="poc-toolbar">
          <TextField
            placeholder="Search by name, role, email, mobile…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            size="small"
            className="poc-search-field"
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

          <Box className="poc-live-filter">
            <Switch
              checked={showLiveOnly}
              onChange={(e) => { setShowLiveOnly(e.target.checked); setPage(0); }}
              size="small"
              className="poc-live-switch"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "#2e7d32" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#2e7d32" },
              }}
            />
            <Typography variant="body2" className="poc-live-filter-label">Live Only</Typography>
          </Box>

          <Tooltip title="Refresh" arrow>
            <IconButton onClick={load} className="poc-btn-refresh"><RefreshCw size={17} /></IconButton>
          </Tooltip>

          <Tooltip title="Add POC" arrow>
            <IconButton onClick={() => navigate("/add_poc")} className="poc-btn-add"><Plus size={17} /></IconButton>
          </Tooltip>

          {search && (
            <Chip
              label={`${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
              size="small"
              className="poc-results-chip"
            />
          )}
        </Paper>

        {/* ── Table ── */}
        <Paper elevation={0} className="poc-table-paper">
          <Box className="poc-table-min-width">

            {/* thead */}
            <Box className="poc-table-head" sx={{ gridTemplateColumns: gridTemplate }}>
              {COLS.map((col) => (
                <Box
                  key={col.key}
                  className={`poc-table-head-cell${col.sortable ? " sortable" : ""}`}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <Typography className="poc-table-head-label">{col.label}</Typography>
                  {col.sortable && <SortIcon field={col.key} sort={sort} />}
                </Box>
              ))}
            </Box>

            {/* tbody */}
            {loading ? (
              <Box className="poc-loader-box">
                <CircularProgress size={36} sx={{ color: C.primary }} />
              </Box>
            ) : pageRows.length === 0 ? (
              <Box className="poc-empty-box">
                <Users size={40} color={C.border} style={{ margin: "0 auto 12px" }} />
                <Typography className="poc-empty-label">No POCs found</Typography>
              </Box>
            ) : (
              pageRows.map((row, i) => (
                <Box
                  key={row._id}
                  className={`poc-table-row ${i % 2 === 0 ? "even" : "odd"}`}
                  sx={{ gridTemplateColumns: gridTemplate }}
                >
                  {COLS.map((col) => (
                    <Box key={col.key} className="poc-table-cell">
                      {cellContent(col, row)}
                    </Box>
                  ))}
                </Box>
              ))
            )}
          </Box>

          {/* Pagination */}
          {!loading && filtered.length > PER_PAGE && (
            <Box className="poc-pagination">
              <Typography variant="body2" className="poc-pagination-info">
                Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
              </Typography>
              <Box className="poc-pagination-buttons">
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
                    className="poc-btn-page"
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
          PaperProps={{ className: "poc-dialog-paper" }}>
          <DialogTitle className="poc-dialog-title-primary">
            <Pencil size={18} /> Edit POC
          </DialogTitle>
          <DialogContent className="poc-dialog-content">
            {EDIT_FIELDS.map(({ label, key, icon }) => (
              <TextField
                key={key}
                label={label}
                fullWidth
                size="small"
                value={editData[key]}
                onChange={(e) => setEditData((p) => ({ ...p, [key]: e.target.value }))}
                className="poc-edit-field"
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
          <DialogActions className="poc-dialog-actions">
            <Button onClick={closeEdit} variant="outlined" className="poc-btn-dialog-cancel">
              Cancel
            </Button>
            <Button onClick={saveEdit} variant="contained" disabled={editLoading} className="poc-btn-dialog-confirm">
              {editLoading
                ? <><CircularProgress size={14} sx={{ color: "#fff", mr: 1 }} />Saving…</>
                : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete Dialog ── */}
        <Dialog open={delOpen} onClose={closeDel} maxWidth="xs" fullWidth
          PaperProps={{ className: "poc-dialog-paper" }}>
          <DialogTitle className="poc-dialog-title-danger">
            <Trash2 size={18} /> Delete POC
          </DialogTitle>
          <DialogContent className="poc-dialog-content-simple">
            <Typography sx={{ color: C.text, mb: 1.5 }}>
              You are about to permanently delete:
            </Typography>
            <Box className="poc-delete-info-box">
              <Typography className="poc-delete-info-name">{delRow?.mod_poc_name}</Typography>
              <Typography variant="caption" className="poc-delete-info-sub">
                {delRow?.mod_poc_role} · {delRow?.mod_poc_email}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: C.muted, mt: 2 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions className="poc-dialog-actions">
            <Button onClick={closeDel} variant="outlined" className="poc-btn-dialog-cancel">
              Cancel
            </Button>
            <Button onClick={confirmDel} variant="contained" disabled={delLoading} className="poc-btn-dialog-danger">
              {delLoading
                ? <><CircularProgress size={14} sx={{ color: "#fff", mr: 1 }} />Deleting…</>
                : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Cert Status Dialog ── */}
        <Dialog open={certDialogOpen} onClose={closeCert} maxWidth="xs" fullWidth
          PaperProps={{ className: "poc-dialog-paper" }}>
          <DialogTitle className="poc-dialog-title-primary">
            <Award size={18} /> Confirm Certificate Change
          </DialogTitle>
          <DialogContent className="poc-dialog-content-simple">
            <Typography sx={{ color: C.text, mb: 1.5 }}>
              {certPending ? "Activate certificate issuance for:" : "Deactivate certificate issuance for:"}
            </Typography>
            <Box className="poc-cert-info-box">
              <User size={16} color={C.primary} />
              <Typography className="poc-cert-info-name">{certRow?.mod_poc_name}</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: C.muted, mt: 2 }}>
              This will update the certificate status immediately.
            </Typography>
          </DialogContent>
          <DialogActions className="poc-dialog-actions">
            <Button onClick={closeCert} variant="outlined" className="poc-btn-dialog-cancel">
              Cancel
            </Button>
            <Button onClick={confirmCert} variant="contained" disabled={certLoading} className="poc-btn-dialog-confirm">
              {certLoading
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
            className="poc-snackbar-alert"
          >
            {sb.msg}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default View_Poc;