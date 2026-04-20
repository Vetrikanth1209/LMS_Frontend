import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  styled,
  Fab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { fetchAllOrganizations, fetchAllModules, updateOrganization } from '../axios';
import { Save, X, User, Mail, Phone, MapPin, List, Building, Search, CheckCircle } from 'lucide-react';
import Admin_Dashboard from '../components/AdminDash';
import { stepConnectorClasses } from '@mui/material/StepConnector';
import '../styles/Update_Organization.css'; // Import the CSS file for styling

// ── Custom Stepper Connector ──────────────────────────────────────────────────
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 18 },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: 'linear-gradient(90deg, #0c83c8, #fc7a46)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: 'linear-gradient(90deg, #0c83c8, #fc7a46)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: '#e0e0e0',
    borderRadius: 1,
  },
}));

const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: '#e0e0e0',
  zIndex: 1,
  color: '#fff',
  width: 40,
  height: 40,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active || ownerState.completed
    ? {
        background: 'linear-gradient(90deg, #0c83c8, #fc7a46)',
        boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
      }
    : {}),
}));

function ColorlibStepIcon(props) {
  const { active, completed, className, icon } = props;
  const icons = {
    1: <Building size={20} />,
    2: <List size={20} />,
    3: <CheckCircle size={20} />,
  };
  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(icon)]}
    </ColorlibStepIconRoot>
  );
}

const steps = ['Select Organization', 'Select Modules', 'Review and Update'];

// ── DataGrid shared sx (MUI deep selectors — kept as sx object) ───────────────
const dataGridSx = {
  borderRadius: '8px',
  border: 'none',
  '& .MuiDataGrid-columnHeaders': {
    background: 'linear-gradient(90deg, #0c83c8, #fc7a46)',
    color: '#0c83c8',
    fontWeight: 'bold',
  },
  '& .MuiDataGrid-row': {
    '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },
    '&:hover': { backgroundColor: '#e3f2fd' },
  },
  '& .MuiDataGrid-cell': {
    padding: '12px',
    borderBottom: '1px solid #e0e0e0',
  },
  '& .MuiDataGrid-footerContainer': {
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e0e0e0',
    color: '#0c83c8',
    fontWeight: 600,
  },
  '& .MuiDataGrid-overlay': {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
};

// ── Component ─────────────────────────────────────────────────────────────────
const Update_Organization = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [organizations, setOrganizations] = useState([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState([]);
  const [modules, setModules] = useState([]);
  const [filteredModules, setFilteredModules] = useState([]);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [loading, setLoading] = useState({ organizations: true, modules: true });
  const [selectedOrganizationIds, setSelectedOrganizationIds] = useState([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [activeStep, setActiveStep] = useState(0);
  const [dataGridKey, setDataGridKey] = useState(0);

  const safeStringify = (value) => {
    if (Array.isArray(value)) return value.map(v => String(v)).join(' ');
    if (value && typeof value === 'object') return Object.values(value).map(safeStringify).join(' ');
    return String(value || '');
  };

  useEffect(() => {
    const getOrganizations = async () => {
      try {
        const orgs = await fetchAllOrganizations();
        setOrganizations(Array.isArray(orgs) ? orgs : []);
        setLoading(prev => ({ ...prev, organizations: false }));
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setSnackbarMessage(`Error fetching organizations: ${error.message || 'Unknown error'}`);
        setSnackbarOpen(true);
        setOrganizations([]);
        setLoading(prev => ({ ...prev, organizations: false }));
      }
    };
    getOrganizations();
  }, []);

  useEffect(() => {
    const getModules = async () => {
      try {
        const moduleData = await fetchAllModules();
        if (Array.isArray(moduleData)) {
          setModules(moduleData);
        } else {
          setSnackbarMessage('Invalid data format received from server');
          setSnackbarOpen(true);
          setModules([]);
        }
      } catch (error) {
        setSnackbarMessage(`Failed to fetch modules: ${error.message || 'Unknown error'}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setModules([]);
      } finally {
        setLoading(prev => ({ ...prev, modules: false }));
      }
    };
    getModules();
  }, []);

  useEffect(() => {
    setFilteredOrganizations(
      organizations.filter(org =>
        safeStringify(org).toLowerCase().includes(orgSearchQuery.toLowerCase())
      )
    );
  }, [orgSearchQuery, organizations]);

  useEffect(() => {
    setFilteredModules(
      modules.filter(mod =>
        safeStringify(mod).toLowerCase().includes(moduleSearchQuery.toLowerCase())
      )
    );
  }, [moduleSearchQuery, modules]);

  useEffect(() => {
    if (selectedOrganizationIds.length === 1) {
      const selectedOrg = organizations.find(org => org._id === selectedOrganizationIds[0]);
      if (selectedOrg?.mod_id) {
        const preSelected = modules
          .filter(mod => selectedOrg.mod_id.includes(mod.mod_id))
          .map(mod => mod._id);
        setSelectedModuleIds(preSelected);
        localStorage.setItem('selectedModuleIds', JSON.stringify(preSelected));
      } else {
        setSelectedModuleIds([]);
        localStorage.setItem('selectedModuleIds', JSON.stringify([]));
      }
    } else {
      setSelectedModuleIds([]);
      localStorage.setItem('selectedModuleIds', JSON.stringify([]));
    }
    setDataGridKey(prev => prev + 1);
  }, [selectedOrganizationIds, organizations, modules]);

  const handleNext = () => {
    if (activeStep === 0 && selectedOrganizationIds.length !== 1) {
      setSnackbarMessage('Please select exactly one organization to proceed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setActiveStep(prev => Math.min(prev + 1, 2));
  };

  const handlePrevious = () => {
    if (activeStep === 1) {
      setSelectedModuleIds([]);
      localStorage.removeItem('selectedModuleIds');
      setDataGridKey(prev => prev + 1);
    }
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const handleOpenPreviewDialog = () => {
    if (selectedOrganizationIds.length !== 1) {
      setSnackbarMessage('Please select exactly one organization to update');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setPreviewDialogOpen(true);
  };

  const handleClosePreviewDialog = () => setPreviewDialogOpen(false);

  const handleUpdateOrganization = async () => {
    const selectedOrg = organizations.find(org => org._id === selectedOrganizationIds[0]);
    if (!selectedOrg) {
      setSnackbarMessage('Selected organization not found');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const updateData = { org_id: selectedOrg.org_id };
    if (selectedModuleIds.length > 0) {
      updateData.mod_id = modules
        .filter(mod => selectedModuleIds.includes(mod._id))
        .map(mod => mod.mod_id);
    }

    setUpdateLoading(true);
    setPreviewDialogOpen(false);

    try {
      await updateOrganization(updateData);
      setSnackbarMessage('Organization updated successfully');
      setSnackbarSeverity('success');

      const updatedOrgsResponse = await fetchAllOrganizations();
      const orgData = updatedOrgsResponse.data || [];
      setOrganizations(orgData);
      setFilteredOrganizations(orgData);

      setSelectedOrganizationIds([]);
      setSelectedModuleIds([]);
      localStorage.removeItem('selectedOrganizationIds');
      localStorage.removeItem('selectedModuleIds');
      setActiveStep(0);
      setDataGridKey(prev => prev + 1);
    } catch (error) {
      console.error('Error updating organization:', error);
      setSnackbarMessage(`Error updating organization: ${error.response?.data?.error || error.message}`);
      setSnackbarSeverity('error');
    } finally {
      setUpdateLoading(false);
      setSnackbarOpen(true);
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setSnackbarMessage('Copied to clipboard!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        setSnackbarMessage('Failed to copy to clipboard');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      });
  };

  // ── Column definitions ──────────────────────────────────────────────────────
  const columnsForOrganizations = [
    {
      field: 'org_name', headerName: 'Name', minWidth: 300, flex: 1,
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={16} color="white" />
          <Typography variant="inherit" fontWeight="bold">Name</Typography>
        </Box>
      ),
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
          <User size={20} color="#0c83c8" />
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#333' }}>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'org_email', headerName: 'Email', minWidth: 200, flex: 1,
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={16} color="white" />
          <Typography variant="inherit" fontWeight="bold">Email</Typography>
        </Box>
      ),
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
          <Mail size={20} color="#0c83c8" />
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#333' }}>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'org_contact', headerName: 'Contact', minWidth: 150, flex: 0.8,
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Phone size={16} color="white" />
          <Typography variant="inherit" fontWeight="bold">Contact</Typography>
        </Box>
      ),
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
          <Phone size={20} color="#0c83c8" />
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#333' }}>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'org_address', headerName: 'Address', minWidth: 300, flex: 1,
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={16} color="white" />
          <Typography variant="inherit" fontWeight="bold">Address</Typography>
        </Box>
      ),
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 0.1, whiteSpace: 'normal', wordBreak: 'break-word' }}>
          <MapPin size={20} color="#0c83c8" style={{ marginTop: 4 }} />
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#333', lineHeight: 1.4 }}>{params.value}</Typography>
        </Box>
      ),
    },
  ];

  const columnsForModules = [
    {
      field: 'mod_name', headerName: 'Module Name', minWidth: 200, flex: 1,
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <List size={16} color="white" />
          <Typography variant="inherit" fontWeight="bold">Module Name</Typography>
        </Box>
      ),
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
          <List size={20} color="#0c83c8" />
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#333' }}>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'mod_duration', headerName: 'Duration', minWidth: 200, flex: 1,
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <List size={16} color="white" />
          <Typography variant="inherit" fontWeight="bold">Duration</Typography>
        </Box>
      ),
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
          <List size={20} color="#0c83c8" />
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#333' }}>{params.value || 'N/A'}</Typography>
        </Box>
      ),
    },
    {
      field: 'mod_tech', headerName: 'Technology', minWidth: 150, flex: 0.8,
      renderHeader: () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <List size={16} color="white" />
          <Typography variant="inherit" fontWeight="bold">Technology</Typography>
        </Box>
      ),
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
          <List size={20} color="#0c83c8" />
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#333' }}>{params.value || 'N/A'}</Typography>
        </Box>
      ),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Admin_Dashboard />
      <Box className="update-org-root">

        {/* Stepper Card */}
        <Paper className="update-org-stepper-card">
          <Paper elevation={4} className="update-org-header">
            <Box className="update-org-header-row">
              <Building size={24} />
              <Typography variant="h5" className="update-org-title">
                Update Organization
              </Typography>
            </Box>
            <Typography variant="subtitle2" className="update-org-subtitle">
              Manage organization configurations
            </Typography>
          </Paper>

          <Stepper
            alternativeLabel
            activeStep={activeStep}
            connector={<ColorlibConnector />}
            className="update-org-stepper"
          >
            {steps.map(label => (
              <Step key={label}>
                <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Step Content Card */}
        <Paper className="update-org-content-card">

          {/* ── Step 0: Select Organization ── */}
          {activeStep === 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" className="update-org-step-title">
                Select Organization
              </Typography>
              <Box className="update-org-search-wrap">
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search organizations..."
                  value={orgSearchQuery}
                  onChange={(e) => setOrgSearchQuery(e.target.value)}
                  className="update-org-search-field"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} color="#0c83c8" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box className="update-org-grid-wrap">
                <DataGrid
                  key={`org-grid-${dataGridKey}`}
                  rows={filteredOrganizations}
                  columns={columnsForOrganizations}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  pageSizeOptions={[10, 20, 50]}
                  loading={loading.organizations}
                  getRowId={(row) => row._id}
                  checkboxSelection
                  rowSelectionModel={selectedOrganizationIds}
                  onRowSelectionModelChange={(newSelection) => {
                    const updated = newSelection.length > 0
                      ? [newSelection[newSelection.length - 1]]
                      : [];
                    setSelectedOrganizationIds(updated);
                    localStorage.setItem('selectedOrganizationIds', JSON.stringify(updated));
                    setDataGridKey(prev => prev + 1);
                  }}
                  sx={dataGridSx}
                  aria-label="Organizations Data Grid"
                />
              </Box>
              <Box className="update-org-nav-end">
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={selectedOrganizationIds.length !== 1}
                  className="update-org-btn-next"
                  disableElevation
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}

          {/* ── Step 1: Select Modules ── */}
          {activeStep === 1 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" className="update-org-step-title">
                Select Modules
              </Typography>
              <Box className="update-org-search-wrap">
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search modules..."
                  value={moduleSearchQuery}
                  onChange={(e) => setModuleSearchQuery(e.target.value)}
                  className="update-org-search-field"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} color="#0c83c8" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box className="update-org-grid-wrap">
                <DataGrid
                  key={`module-grid-${dataGridKey}`}
                  rows={filteredModules}
                  columns={columnsForModules}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  pageSizeOptions={[10, 20, 50]}
                  loading={loading.modules}
                  getRowId={(row) => row._id}
                  checkboxSelection
                  rowSelectionModel={selectedModuleIds}
                  onRowSelectionModelChange={(newSelection) => {
                    setSelectedModuleIds(newSelection);
                    localStorage.setItem('selectedModuleIds', JSON.stringify(newSelection));
                    setDataGridKey(prev => prev + 1);
                  }}
                  sx={dataGridSx}
                  aria-label="Modules Data Grid"
                />
              </Box>
              <Box className="update-org-nav-between">
                <Button variant="outlined" onClick={handlePrevious} className="update-org-btn-prev">
                  Previous
                </Button>
                <Button variant="contained" onClick={handleNext} className="update-org-btn-next" disableElevation>
                  Next
                </Button>
              </Box>
            </Box>
          )}

          {/* ── Step 2: Review ── */}
          {activeStep === 2 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" className="update-org-step-title">
                Review and Update
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Please review your selections below before confirming the update.
              </Typography>

              {/* Selected Org */}
              <Box className="update-org-review-box">
                <Typography variant="subtitle1" className="update-org-review-subtitle">
                  Selected Organization
                </Typography>
                {selectedOrganizationIds.length === 1 ? (() => {
                  const org = organizations.find(o => o._id === selectedOrganizationIds[0]);
                  return org ? (
                    <Box>
                      <Typography variant="body2"><strong>Name:</strong> {org.org_name || 'N/A'}</Typography>
                      <Typography variant="body2"><strong>Email:</strong> {org.org_email || 'N/A'}</Typography>
                      <Typography variant="body2"><strong>Contact:</strong> {org.org_contact || 'N/A'}</Typography>
                      <Typography variant="body2"><strong>Address:</strong> {org.org_address || 'N/A'}</Typography>
                    </Box>
                  ) : (
                    <Alert severity="warning" className="update-org-review-alert">No organization found</Alert>
                  );
                })() : (
                  <Alert severity="warning" className="update-org-review-alert">No organization selected</Alert>
                )}
              </Box>

              {/* Selected Modules */}
              <Box className="update-org-review-box">
                <Typography variant="subtitle1" className="update-org-review-subtitle">
                  Selected Modules ({selectedModuleIds.length})
                </Typography>
                {selectedModuleIds.length > 0 ? (
                  modules
                    .filter(mod => selectedModuleIds.includes(mod._id))
                    .map(mod => (
                      <Box key={mod._id} sx={{ mb: 1 }}>
                        <Typography variant="body2"><strong>Name:</strong> {mod.mod_name || 'N/A'}</Typography>
                      </Box>
                    ))
                ) : (
                  <Alert severity="info" className="update-org-review-alert">No modules selected</Alert>
                )}
              </Box>

              <Box className="update-org-nav-start">
                <Button variant="outlined" onClick={handlePrevious} className="update-org-btn-prev">
                  Previous
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        {/* FAB */}
        {activeStep === 2 && (
          <Fab
            onClick={handleOpenPreviewDialog}
            disabled={updateLoading || selectedOrganizationIds.length !== 1}
            className="update-org-fab"
            aria-label="Update Organization"
          >
            {updateLoading ? <CircularProgress size={20} color="inherit" /> : <Save size={20} />}
          </Fab>
        )}

        {/* Confirm Dialog */}
        <Dialog
          open={previewDialogOpen}
          onClose={handleClosePreviewDialog}
          maxWidth="sm"
          fullWidth
          className="update-org-dialog"
          PaperProps={{ sx: { borderRadius: '12px' } }}
        >
          <DialogTitle className="update-org-dialog-title">
            Confirm Organization Update
            <IconButton
              onClick={handleClosePreviewDialog}
              className="update-org-dialog-close-btn"
              aria-label="Close preview dialog"
            >
              <X size={20} />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers className="update-org-dialog-content">
            <DialogContentText className="update-org-dialog-text">
              Review the changes below:
            </DialogContentText>
            {selectedOrganizationIds.length === 1 && (() => {
              const org = organizations.find(o => o._id === selectedOrganizationIds[0]);
              return org ? (
                <Box className="update-org-dialog-detail">
                  <Typography variant="body2"><strong>Organization:</strong> {org.org_name || 'Unknown'}</Typography>
                  <Typography variant="body2"><strong>Organization ID:</strong> {org.org_id || 'Unknown'}</Typography>
                </Box>
              ) : null;
            })()}
            {selectedModuleIds.length > 0 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Modules:</strong> {selectedModuleIds.length} selected
              </Typography>
            )}
          </DialogContent>

          <DialogActions className="update-org-dialog-actions">
            <Button onClick={handleClosePreviewDialog} className="update-org-dialog-btn-cancel">
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateOrganization}
              disabled={updateLoading}
              className="update-org-dialog-btn-confirm"
              disableElevation
            >
              {updateLoading ? <CircularProgress size={16} color="inherit" /> : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            variant="filled"
            className={`update-org-snackbar-alert ${
              snackbarSeverity === 'success' ? 'update-org-snackbar-alert--success' : ''
            }`}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

      </Box>
    </>
  );
};

export default Update_Organization;