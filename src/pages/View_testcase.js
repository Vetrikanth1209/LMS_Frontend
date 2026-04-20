import React, { useEffect, useState, useMemo } from "react";
import {
  Box, Typography, Paper, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, IconButton, Tooltip,
  InputAdornment, Chip, Avatar, CircularProgress,
} from "@mui/material";
import { fetchAllTestCases, updateTestCase, deleteTestCase } from "../axios";
import Admin_Dashboard from "../components/AdminDash";
import {
  FileText, Tag, ArrowRightLeft, ArrowRight, ArrowLeft,
  Pencil, Trash2, Search, X, RefreshCw,
  ChevronUp, ChevronDown, ChevronsUpDown, Plus, Minus,
} from "lucide-react";
import "../styles/View_testcase.css";

/* ─── highlight matched text ────────────────────────────────── */
const HL = ({ text = "", q = "" }) => {
  if (!q) return <>{text}</>;
  const safe  = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${safe})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === q.toLowerCase()
          ? <mark key={i} className="tc-highlight">{p}</mark>
          : p
      )}
    </>
  );
};

/* ─── sort icon ─────────────────────────────────────────────── */
const SortIcon = ({ field, sort }) => {
  if (sort.field !== field) return <ChevronsUpDown size={13} className="tc-sort-icon tc-sort-icon--inactive" />;
  return sort.dir === "asc"
    ? <ChevronUp size={13} className="tc-sort-icon" />
    : <ChevronDown size={13} className="tc-sort-icon" />;
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
const TestcaseGrid = () => {
  const [testcases, setTestcases] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [sort,      setSort]      = useState({ field: "testcase_id", dir: "asc" });
  const [page,      setPage]      = useState(0);
  const PER_PAGE = 10;

  const [sb, setSb] = useState({ open: false, msg: "", sev: "success" });
  const toast = (msg, sev = "success") => setSb({ open: true, msg, sev });

  const [editOpen,    setEditOpen]    = useState(false);
  const [editRow,     setEditRow]     = useState(null);
  const [editInputs,  setEditInputs]  = useState([""]);
  const [editOutputs, setEditOutputs] = useState([""]);
  const [editTags,    setEditTags]    = useState([""]);
  const [editLoading, setEditLoading] = useState(false);

  const [delOpen,    setDelOpen]    = useState(false);
  const [delRow,     setDelRow]     = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  /* ── load ───────────────────────────────────────────────── */
  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllTestCases();
      const rows = (Array.isArray(data) ? data : []).map((item, i) => ({
        ...item,
        _rowId:    item._id || `temp-${i}`,
        inputArr:  Array.isArray(item.testcase_input)  ? item.testcase_input  : [item.testcase_input  || ""],
        outputArr: Array.isArray(item.testcase_output) ? item.testcase_output : [item.testcase_output || ""],
        tagsArr:   Array.isArray(item.testcase_tags)   ? [...new Set(item.testcase_tags)] : [],
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : "N/A",
        updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "N/A",
      }));
      setTestcases(rows);
    } catch (e) {
      toast(e.response?.data?.error || e.message, "error");
      setTestcases([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  /* ── derived rows ───────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = q
      ? testcases.filter((t) =>
          [t.testcase_id, t.inputArr.join(" "), t.outputArr.join(" "), t.tagsArr.join(" ")]
            .some((v) => String(v ?? "").toLowerCase().includes(q))
        )
      : [...testcases];

    rows.sort((a, b) => {
      const av = String(a[sort.field] ?? "").toLowerCase();
      const bv = String(b[sort.field] ?? "").toLowerCase();
      return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return rows;
  }, [testcases, search, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageRows   = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const toggleSort = (field) =>
    setSort((s) => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  /* ── edit ───────────────────────────────────────────────── */
  const openEdit = (row) => {
    setEditRow(row);
    setEditInputs(row.inputArr.length   ? [...row.inputArr]  : [""]);
    setEditOutputs(row.outputArr.length ? [...row.outputArr] : [""]);
    setEditTags(row.tagsArr.length      ? [...row.tagsArr]   : [""]);
    setEditOpen(true);
  };
  const closeEdit = () => { setEditOpen(false); setEditRow(null); };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      const payload = {
        testcase_id:     editRow.testcase_id,
        testcase_input:  editInputs.filter(Boolean),
        testcase_output: editOutputs.filter(Boolean),
        testcase_tags:   editTags.filter(Boolean),
      };
      await updateTestCase(payload);
      setTestcases((prev) =>
        prev.map((t) =>
          t._rowId === editRow._rowId
            ? { ...t, inputArr: payload.testcase_input, outputArr: payload.testcase_output, tagsArr: payload.testcase_tags,
                testcase_input: payload.testcase_input, testcase_output: payload.testcase_output, testcase_tags: payload.testcase_tags }
            : t
        )
      );
      toast("Test case updated successfully!");
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
      await deleteTestCase(delRow.testcase_id);
      setTestcases((prev) => prev.filter((t) => t._rowId !== delRow._rowId));
      toast("Test case deleted successfully!");
      closeDel();
    } catch (e) {
      toast(`Delete failed: ${e.message}`, "error");
    } finally {
      setDelLoading(false);
    }
  };

  /* ── array field editor helpers ─────────────────────────── */
  const arrayEditor = (arr, setArr) => ({
    add:    ()       => setArr((p) => [...p, ""]),
    remove: (i)      => setArr((p) => p.filter((_, idx) => idx !== i)),
    change: (i, val) => setArr((p) => p.map((v, idx) => idx === i ? val : v)),
  });

  const inputsEd  = arrayEditor(editInputs,  setEditInputs);
  const outputsEd = arrayEditor(editOutputs, setEditOutputs);
  const tagsEd    = arrayEditor(editTags,    setEditTags);

  /* ── columns ─────────────────────────────────────────────── */
  const cols = [
    { key: "testcase_id", label: "Testcase ID", w: "200px", sortable: true  },
    { key: "inputArr",    label: "Input",        w: "220px", sortable: false },
    { key: "outputArr",   label: "Output",       w: "220px", sortable: false },
    { key: "tagsArr",     label: "Tags",         w: "280px", sortable: false },
    { key: "createdAt",   label: "Created At",   w: "170px", sortable: false },
    { key: "_actions",    label: "Actions",      w: "90px",  sortable: false },
  ];

  const cellContent = (col, row) => {
    const q = search.trim();
    switch (col.key) {

      case "testcase_id":
        return (
          <Box className="tc-cell-id">
            <Avatar className="tc-cell-avatar">
              <FileText size={14} />
            </Avatar>
            <Typography className="tc-cell-id-text">
              <HL text={row.testcase_id} q={q} />
            </Typography>
          </Box>
        );

      case "inputArr":
        return (
          <Box className="tc-cell-io">
            <ArrowRight size={14} className="tc-icon-input" />
            <Box>
              {row.inputArr.map((val, i) => (
                <Typography key={i} className="tc-cell-io-text">
                  <HL text={val} q={q} />
                </Typography>
              ))}
            </Box>
          </Box>
        );

      case "outputArr":
        return (
          <Box className="tc-cell-io">
            <ArrowLeft size={14} className="tc-icon-output" />
            <Box>
              {row.outputArr.map((val, i) => (
                <Typography key={i} className="tc-cell-io-text">
                  <HL text={val} q={q} />
                </Typography>
              ))}
            </Box>
          </Box>
        );

      case "tagsArr":
        return (
          <Box className="tc-cell-tags">
            {row.tagsArr.length === 0
              ? <Typography className="tc-cell-muted">No tags</Typography>
              : row.tagsArr.map((tag, i) => (
                  <Chip key={i} label={tag} size="small" className="tc-chip-tag" />
                ))}
          </Box>
        );

      case "createdAt":
        return <Typography className="tc-cell-muted">{row.createdAt}</Typography>;

      case "_actions":
        return (
          <Box className="tc-cell-actions">
            <Tooltip title="Edit Test Case" arrow>
              <IconButton size="small" onClick={() => openEdit(row)} className="tc-btn-edit">
                <Pencil size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Test Case" arrow>
              <IconButton size="small" onClick={() => openDel(row)} className="tc-btn-delete">
                <Trash2 size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        );

      default: return null;
    }
  };

  /* ── reusable array field section ───────────────────────── */
  const ArrayFieldSection = ({ label, icon, values, ed, colorClass }) => (
    <Box>
      <Box className="tc-arr-header">
        <Box className={`tc-arr-label-row ${colorClass}`}>
          {icon}
          <Typography className={`tc-arr-label ${colorClass}`}>{label}</Typography>
        </Box>
        <Tooltip title={`Add ${label}`} arrow>
          <IconButton size="small" onClick={ed.add} className="tc-btn-arr-add">
            <Plus size={13} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box className="tc-arr-fields">
        {values.map((val, i) => (
          <Box key={i} className="tc-arr-field-row">
            <TextField
              fullWidth size="small" value={val}
              onChange={(e) => ed.change(i, e.target.value)}
              placeholder={`${label} ${i + 1}`}
              className={`tc-arr-textfield tc-arr-textfield--${colorClass}`}
            />
            {values.length > 1 && (
              <Tooltip title="Remove" arrow>
                <IconButton size="small" onClick={() => ed.remove(i)} className="tc-btn-arr-remove">
                  <Minus size={13} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <>
      <Admin_Dashboard />
      <Box className="tc-page-wrapper">

        {/* ── Header ─────────────────────────────────────── */}
        <Box className="tc-header">
          <Box>
            <Typography className="tc-title">Test Case Management</Typography>
            <Typography variant="body2" className="tc-subtitle">
              View and manage all test cases
            </Typography>
          </Box>

          <Box className="tc-stat-chips">
            {[
              { label: "Total",    value: testcases.length, cls: "tc-stat-chip tc-stat-chip--primary" },
              { label: "Filtered", value: filtered.length,  cls: "tc-stat-chip tc-stat-chip--accent"  },
            ].map(({ label, value, cls }) => (
              <Box key={label} className={cls}>
                <Box className={label === "Total" ? "tc-stat-icon--primary" : "tc-stat-icon--accent"}>
                  {label === "Total" ? <FileText size={18} /> : <ArrowRightLeft size={18} />}
                </Box>
                <Box>
                  <Typography className="tc-stat-value">{value}</Typography>
                  <Typography variant="caption" className="tc-stat-label">{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Toolbar ────────────────────────────────────── */}
        <Paper elevation={0} className="tc-toolbar">
          <TextField
            placeholder="Search by ID, input, output, tags…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            size="small"
            className="tc-search-field"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} className="tc-search-icon" />
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
            <IconButton onClick={load} className="tc-btn-refresh">
              <RefreshCw size={17} />
            </IconButton>
          </Tooltip>
          {search && (
            <Chip
              label={`${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
              size="small"
              className="tc-results-chip"
            />
          )}
        </Paper>

        {/* ── Table ──────────────────────────────────────── */}
        <Paper elevation={0} className="tc-table-paper">
          <Box className="tc-table-min-width">

            {/* thead */}
            <Box
              className="tc-table-head"
              style={{ gridTemplateColumns: cols.map((c) => c.w).join(" ") }}
            >
              {cols.map((col) => (
                <Box
                  key={col.key}
                  onClick={() => col.sortable && toggleSort(col.key)}
                  className={`tc-table-head-cell ${col.sortable ? "sortable" : ""}`}
                >
                  <Typography className="tc-table-head-label">{col.label}</Typography>
                  {col.sortable && <SortIcon field={col.key} sort={sort} />}
                </Box>
              ))}
            </Box>

            {/* tbody */}
            {loading ? (
              <Box className="tc-loader-box">
                <CircularProgress size={36} className="tc-loader" />
              </Box>
            ) : pageRows.length === 0 ? (
              <Box className="tc-empty-box">
                <FileText size={40} className="tc-empty-icon" />
                <Typography className="tc-empty-label">No test cases found</Typography>
              </Box>
            ) : (
              pageRows.map((row, i) => (
                <Box
                  key={row._rowId}
                  className={`tc-table-row ${i % 2 === 0 ? "even" : "odd"}`}
                  style={{ gridTemplateColumns: cols.map((c) => c.w).join(" ") }}
                >
                  {cols.map((col) => (
                    <Box key={col.key} className="tc-table-cell">
                      {cellContent(col, row)}
                    </Box>
                  ))}
                </Box>
              ))
            )}

            {/* pagination */}
            {!loading && filtered.length > PER_PAGE && (
              <Box className="tc-pagination">
                <Typography variant="body2" className="tc-pagination-info">
                  Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
                </Typography>
                <Box className="tc-pagination-buttons">
                  {[
                    { label: "← Prev", disabled: page === 0,             action: () => setPage((p) => p - 1) },
                    { label: "Next →", disabled: page >= totalPages - 1, action: () => setPage((p) => p + 1) },
                  ].map(({ label, disabled, action }) => (
                    <Button key={label} size="small" disabled={disabled} onClick={action} variant="outlined" className="tc-btn-page">
                      {label}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}

          </Box>
        </Paper>

        {/* ── EDIT DIALOG ─────────────────────────────────── */}
        <Dialog open={editOpen} onClose={closeEdit} maxWidth="sm" fullWidth
          PaperProps={{ className: "tc-dialog-paper" }}>
          <DialogTitle className="tc-dialog-title-primary">
            <Pencil size={18} /> Edit Test Case
          </DialogTitle>
          <DialogContent className="tc-dialog-content">

            <ArrayFieldSection
              label="Inputs"
              icon={<ArrowRight size={15} />}
              values={editInputs}
              ed={inputsEd}
              colorClass="primary"
            />

            <Box className="tc-dialog-section-divider">
              <ArrayFieldSection
                label="Outputs"
                icon={<ArrowLeft size={15} />}
                values={editOutputs}
                ed={outputsEd}
                colorClass="accent"
              />
            </Box>

            <Box className="tc-dialog-section-divider">
              <ArrayFieldSection
                label="Tags"
                icon={<Tag size={15} />}
                values={editTags}
                ed={tagsEd}
                colorClass="purple"
              />
            </Box>

          </DialogContent>
          <DialogActions className="tc-dialog-actions">
            <Button onClick={closeEdit} variant="outlined" className="tc-btn-dialog-cancel">Cancel</Button>
            <Button onClick={saveEdit} variant="contained" disabled={editLoading} className="tc-btn-dialog-confirm">
              {editLoading
                ? <><CircularProgress size={14} className="tc-btn-spinner" />Saving…</>
                : "Save Changes"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── DELETE DIALOG ───────────────────────────────── */}
        <Dialog open={delOpen} onClose={closeDel} maxWidth="xs" fullWidth
          PaperProps={{ className: "tc-dialog-paper" }}>
          <DialogTitle className="tc-dialog-title-danger">
            <Trash2 size={18} /> Delete Test Case
          </DialogTitle>
          <DialogContent className="tc-dialog-content-simple">
            <Typography className="tc-delete-prompt">
              You are about to permanently delete:
            </Typography>
            <Box className="tc-delete-info-box">
              <Typography className="tc-delete-info-id">{delRow?.testcase_id}</Typography>
              <Typography variant="caption" className="tc-cell-muted">
                {delRow?.inputArr?.[0]} → {delRow?.outputArr?.[0]}
              </Typography>
            </Box>
            <Typography variant="body2" className="tc-delete-warning">
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions className="tc-dialog-actions">
            <Button onClick={closeDel} variant="outlined" className="tc-btn-dialog-cancel">Cancel</Button>
            <Button onClick={confirmDel} variant="contained" disabled={delLoading} className="tc-btn-dialog-danger">
              {delLoading
                ? <><CircularProgress size={14} className="tc-btn-spinner" />Deleting…</>
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
          <Alert severity={sb.sev} variant="filled"
            onClose={() => setSb((s) => ({ ...s, open: false }))}
            className="tc-snackbar-alert">
            {sb.msg}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default TestcaseGrid;