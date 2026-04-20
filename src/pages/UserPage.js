import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, IconButton, Tooltip, Snackbar, Alert,
  CircularProgress, Chip, Avatar,
} from '@mui/material';
import {
  Users, User, Briefcase, School, Hash, Mail, Fingerprint,
  Search, Pencil, Trash2, X, RefreshCw,
  ChevronUp, ChevronDown, ChevronsUpDown, KeyRound,
} from 'lucide-react';
import { fetchAllUsers, updateUser, deleteUser } from '../axios';
import Admin_Dashboard from '../components/AdminDash';
import '../styles/UserPage.css';

/* ─── design tokens (kept for dynamic inline use) ────────────── */
const C = {
  primary:      '#0c83c8',
  primaryDark:  '#0a6faa',
  primaryLight: '#e8f4fd',
  accent:       '#fc7a46',
  accentLight:  '#fff3ee',
  danger:       '#e53935',
  dangerLight:  '#ffebee',
  bg:           '#f0f6ff',
  surface:      '#ffffff',
  border:       '#e2eaf4',
  text:         '#1a2640',
  muted:        '#7a8fa6',
  stripe:       '#f5f9ff',
};

/* ─── highlight matched text ─────────────────────────────────── */
const HL = ({ text = '', q = '' }) => {
  if (!q) return <>{text}</>;
  const safe  = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${safe})`, 'gi'));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === q.toLowerCase()
          ? <mark key={i} className="up-highlight">{p}</mark>
          : p
      )}
    </>
  );
};

/* ─── sort icon ──────────────────────────────────────────────── */
const SortIcon = ({ field, sort }) => {
  if (sort.field !== field) return <ChevronsUpDown size={13} style={{ opacity: 0.4 }} />;
  return sort.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />;
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
const UserPage = () => {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [sort,    setSort]    = useState({ field: 'full_name', dir: 'asc' });
  const [page,    setPage]    = useState(0);
  const PER_PAGE = 10;

  const [sb, setSb] = useState({ open: false, msg: '', sev: 'success' });
  const toast = (msg, sev = 'success') => setSb({ open: true, msg, sev });

  const [editOpen,    setEditOpen]    = useState(false);
  const [editRow,     setEditRow]     = useState(null);
  const [editData,    setEditData]    = useState({});
  const [editLoading, setEditLoading] = useState(false);

  const [delOpen,    setDelOpen]    = useState(false);
  const [delRow,     setDelRow]     = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      toast(e.message, 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = q
      ? users.filter((u) =>
          [u.full_name, u.department, u.college, u.rollno, u.email, u.user_id]
            .some((v) => String(v ?? '').toLowerCase().includes(q))
        )
      : [...users];
    rows.sort((a, b) => {
      const av = String(a[sort.field] ?? '').toLowerCase();
      const bv = String(b[sort.field] ?? '').toLowerCase();
      return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return rows;
  }, [users, search, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageRows   = filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const toggleSort = (field) =>
    setSort((s) => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));

  const openEdit = (row) => {
    setEditRow(row);
    setEditData({ full_name: row.full_name || '', department: row.department || '', college: row.college || '', rollno: row.rollno || '', email: row.email || '', password: '' });
    setEditOpen(true);
  };
  const closeEdit = () => { setEditOpen(false); setEditRow(null); setEditData({}); };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      const payload = { ...editData };
      if (!payload.password) delete payload.password;
      const updated = await updateUser(editRow.user_id, payload);
      setUsers((prev) => prev.map((u) => (u._id === editRow._id ? { ...u, ...updated } : u)));
      toast('User updated successfully!');
      closeEdit();
    } catch (e) {
      toast(e.message || 'Failed to update user.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const openDel  = (row) => { setDelRow(row); setDelOpen(true); };
  const closeDel = ()    => { setDelOpen(false); setDelRow(null); };

  const confirmDel = async () => {
    setDelLoading(true);
    try {
      await deleteUser(delRow.user_id);
      setUsers((prev) => prev.filter((u) => u._id !== delRow._id));
      toast('User deleted successfully!');
      closeDel();
    } catch (e) {
      toast(e.message || 'Failed to delete user.', 'error');
    } finally {
      setDelLoading(false);
    }
  };

  const cols = [
    { key: 'full_name',  label: 'Full Name',  w: '180px', sortable: true  },
    { key: 'department', label: 'Department', w: '200px', sortable: true  },
    { key: 'college',    label: 'College',    w: '200px', sortable: true  },
    { key: 'rollno',     label: 'Roll No',    w: '110px', sortable: true  },
    { key: 'email',      label: 'Email',      w: '220px', sortable: true  },
    { key: 'user_id',    label: 'User ID',    w: '200px', sortable: false },
    { key: '_actions',   label: 'Actions',    w: '90px',  sortable: false },
  ];

  const gridTemplate = cols.map((c) => c.w).join(' ');

  const cellContent = (col, row) => {
    const q = search.trim();
    switch (col.key) {

      case 'full_name':
        return (
          <Box className="up-cell-name">
            <Avatar className="up-cell-name-avatar"><User size={14} /></Avatar>
            <Typography className="up-cell-name-text"><HL text={row.full_name} q={q} /></Typography>
          </Box>
        );

      case 'department':
        return (
          <Box className="up-cell-dept">
            <Briefcase size={14} color={C.accent} style={{ flexShrink: 0 }} />
            <Chip className="up-cell-dept-chip" size="small" label={<HL text={row.department} q={q} />} />
          </Box>
        );

      case 'college':
        return (
          <Box className="up-cell-icon-row">
            <School size={14} color={C.primary} style={{ flexShrink: 0 }} />
            <Typography className="up-cell-text"><HL text={row.college} q={q} /></Typography>
          </Box>
        );

      case 'rollno':
        return (
          <Box className="up-cell-icon-row">
            <Hash size={14} color={C.primary} style={{ flexShrink: 0 }} />
            <Typography className="up-cell-text--bold"><HL text={row.rollno} q={q} /></Typography>
          </Box>
        );

      case 'email':
        return (
          <Box className="up-cell-icon-row">
            <Mail size={14} color={C.primary} style={{ flexShrink: 0 }} />
            <Typography className="up-cell-text"><HL text={row.email} q={q} /></Typography>
          </Box>
        );

      case 'user_id':
        return (
          <Box className="up-cell-icon-row">
            <Fingerprint size={14} color={C.primary} style={{ flexShrink: 0 }} />
            <Typography className="up-cell-text--mono"><HL text={row.user_id} q={q} /></Typography>
          </Box>
        );

      case '_actions':
        return (
          <Box className="up-cell-actions">
            <Tooltip title="Edit User" arrow>
              <IconButton size="small" className="up-action-btn-edit" onClick={() => openEdit(row)}>
                <Pencil size={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete User" arrow>
              <IconButton size="small" className="up-action-btn-delete" onClick={() => openDel(row)}>
                <Trash2 size={14} />
              </IconButton>
            </Tooltip>
          </Box>
        );

      default: return null;
    }
  };

  const editFields = [
    { label: 'Full Name',               key: 'full_name',  icon: <User      size={15} />, type: 'text'     },
    { label: 'Department',              key: 'department', icon: <Briefcase size={15} />, type: 'text'     },
    { label: 'College',                 key: 'college',    icon: <School    size={15} />, type: 'text'     },
    { label: 'Roll No',                 key: 'rollno',     icon: <Hash      size={15} />, type: 'text'     },
    { label: 'Email',                   key: 'email',      icon: <Mail      size={15} />, type: 'email'    },
    { label: 'New Password (optional)', key: 'password',   icon: <KeyRound  size={15} />, type: 'password' },
  ];

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <>
      <Admin_Dashboard />
      <Box className="up-root">

        {/* ── Header ─────────────────────────────────────── */}
        <Box className="up-header">
          <Box>
            <Typography className="up-header-title">User Management</Typography>
            <Typography variant="body2" className="up-header-subtitle">
              View and manage all registered users
            </Typography>
          </Box>

          {/* Stat chips */}
          <Box className="up-stat-chips">
            {[
              { label: 'Total',    value: users.length,    color: C.primary, icon: <Users  size={18} /> },
              { label: 'Filtered', value: filtered.length, color: C.accent,  icon: <Search size={18} /> },
            ].map(({ label, value, color, icon }) => (
              <Box key={label} className="up-stat-chip">
                <Box sx={{ color }}>{icon}</Box>
                <Box>
                  <Typography className="up-stat-chip-value" sx={{ color }}>{value}</Typography>
                  <Typography variant="caption" className="up-stat-chip-label">{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Toolbar ────────────────────────────────────── */}
        <Paper elevation={0} className="up-toolbar">
          <TextField
            placeholder="Search by name, department, college, email, ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            size="small"
            fullWidth
            className="up-search-field"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><Search size={16} color={C.primary} /></InputAdornment>
              ),
              endAdornment: search && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}><X size={14} /></IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Refresh" arrow>
            <IconButton onClick={load} className="up-refresh-btn">
              <RefreshCw size={17} />
            </IconButton>
          </Tooltip>
          {search && (
            <Chip
              className="up-result-chip"
              size="small"
              label={`${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
            />
          )}
        </Paper>

        {/* ── Custom Table ────────────────────────────────── */}
        <Paper elevation={0} className="up-table-card">
          <Box className="up-table-min-width">

            {/* thead */}
            <Box className="up-thead" style={{ gridTemplateColumns: gridTemplate }}>
              {cols.map((col) => (
                <Box
                  key={col.key}
                  className={`up-th ${col.sortable ? 'up-th--sortable' : ''}`}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <Typography className="up-th-label">{col.label}</Typography>
                  {col.sortable && <SortIcon field={col.key} sort={sort} />}
                </Box>
              ))}
            </Box>

            {/* tbody */}
            {loading ? (
              <Box className="up-tbody-loading">
                <CircularProgress size={36} sx={{ color: C.primary }} />
              </Box>
            ) : pageRows.length === 0 ? (
              <Box className="up-tbody-empty">
                <Users size={40} color={C.border} style={{ margin: '0 auto 12px' }} />
                <Typography className="up-tbody-empty-label">No users found</Typography>
              </Box>
            ) : (
              pageRows.map((row, i) => (
                <Box
                  key={row._id}
                  className="up-tr"
                  style={{
                    gridTemplateColumns: gridTemplate,
                    backgroundColor: i % 2 === 0 ? C.surface : C.stripe,
                  }}
                >
                  {cols.map((col) => (
                    <Box key={col.key} className="up-td">
                      {cellContent(col, row)}
                    </Box>
                  ))}
                </Box>
              ))
            )}

            {/* pagination */}
            {!loading && filtered.length > PER_PAGE && (
              <Box className="up-pagination">
                <Typography variant="body2" className="up-pagination-info">
                  Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
                </Typography>
                <Box className="up-pagination-btns">
                  {[
                    { label: '← Prev', disabled: page === 0,             action: () => setPage((p) => p - 1) },
                    { label: 'Next →', disabled: page >= totalPages - 1, action: () => setPage((p) => p + 1) },
                  ].map(({ label, disabled, action }) => (
                    <Button
                      key={label} size="small" disabled={disabled} onClick={action}
                      variant="outlined" className="up-pagination-btn"
                    >
                      {label}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}

          </Box>
        </Paper>

        {/* ── Edit Dialog ─────────────────────────────────── */}
        <Dialog open={editOpen} onClose={closeEdit} maxWidth="sm" fullWidth className="up-edit-dialog"
          PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}>
          <DialogTitle className="up-edit-dialog-title">
            <Box className="up-edit-dialog-title-row">
              <Pencil size={18} /> Edit User
            </Box>
            <IconButton className="up-edit-dialog-close" onClick={closeEdit}>
              <X size={18} />
            </IconButton>
          </DialogTitle>
          <DialogContent className="up-edit-dialog-content">
            {editFields.map(({ label, key, icon, type }) => (
              <TextField
                key={key} label={label} fullWidth size="small" type={type}
                value={editData[key] || ''}
                onChange={(e) => setEditData((p) => ({ ...p, [key]: e.target.value }))}
                className="up-edit-field"
                InputProps={{
                  startAdornment: icon && (
                    <InputAdornment position="start">
                      <Box sx={{ color: C.primary }}>{icon}</Box>
                    </InputAdornment>
                  ),
                }}
              />
            ))}
          </DialogContent>
          <DialogActions className="up-edit-dialog-actions">
            <Button onClick={closeEdit} variant="outlined" className="up-btn-cancel">Cancel</Button>
            <Button onClick={saveEdit} variant="contained" disabled={editLoading} className="up-btn-save" disableElevation>
              {editLoading
                ? <><CircularProgress size={14} sx={{ color: '#fff', mr: 1 }} />Saving…</>
                : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Delete Dialog ───────────────────────────────── */}
        <Dialog open={delOpen} onClose={closeDel} maxWidth="xs" fullWidth className="up-del-dialog"
          PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}>
          <DialogTitle className="up-del-dialog-title">
            <Box className="up-del-dialog-title-row">
              <Trash2 size={18} /> Delete User
            </Box>
            <IconButton className="up-del-dialog-close" onClick={closeDel}>
              <X size={18} />
            </IconButton>
          </DialogTitle>
          <DialogContent className="up-del-dialog-content">
            <Typography className="up-del-desc">You are about to permanently delete:</Typography>
            <Box className="up-del-user-box">
              <Typography className="up-del-user-name">{delRow?.full_name}</Typography>
              <Typography variant="caption" className="up-del-user-meta">
                {delRow?.department} · {delRow?.email}
              </Typography>
            </Box>
            <Typography variant="body2" className="up-del-warning">This action cannot be undone.</Typography>
          </DialogContent>
          <DialogActions className="up-del-dialog-actions">
            <Button onClick={closeDel} variant="outlined" className="up-btn-cancel">Cancel</Button>
            <Button onClick={confirmDel} variant="contained" disabled={delLoading} className="up-btn-delete" disableElevation>
              {delLoading
                ? <><CircularProgress size={14} sx={{ color: '#fff', mr: 1 }} />Deleting…</>
                : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ────────────────────────────────────── */}
        <Snackbar
          open={sb.open} autoHideDuration={4000}
          onClose={() => setSb((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={sb.sev} variant="filled"
            onClose={() => setSb((s) => ({ ...s, open: false }))}
            className="up-snackbar-alert"
          >
            {sb.msg}
          </Alert>
        </Snackbar>

      </Box>
    </>
  );
};

export default UserPage;