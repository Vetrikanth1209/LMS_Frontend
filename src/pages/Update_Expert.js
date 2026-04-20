import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  Divider,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  Collapse,
  ListItemButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import { Slide } from '@mui/material';
import {
  User,
  Users,
  Book,
  Save,
  Search,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  fetchAllExperts,
  fetchAllPocs,
  fetchAllModules,
  fetchPocNameById,
  fetchModuleName,
  updateExpert,
} from '../axios';
import Admin_Dashboard from '../components/AdminDash';

// ─── Styles ───────────────────────────────────────────────────────────────────
import '../styles/Update_Expert.css'; // Import the CSS file for styling

// ─── Styled MUI Components ────────────────────────────────────────────────────

const CustomConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: '#0c83c8' },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: '#fc7a46' },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.grey[300],
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

const CustomStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  display: 'flex',
  height: 36,
  width: 36,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background:
    ownerState.active || ownerState.completed
      ? 'linear-gradient(90deg, #0c83c8, #fc7a46)'
      : theme.palette.grey[300],
  color: 'white',
  fontWeight: 'bold',
  border: ownerState.active ? '2px solid #0c83c8' : 'none',
  boxShadow: ownerState.active ? '0 0 8px rgba(12, 131, 200, 0.5)' : 'none',
  '& svg': { fontSize: 20 },
}));

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Select Expert', icon: User },
  { label: 'Select POCs', icon: Users },
  { label: 'Select Modules', icon: Book },
  { label: 'Review & Submit', icon: Save },
];

// ─── DataGrid sx (kept as JS — uses isMobile runtime value) ──────────────────

const buildDataGridSx = (isMobile) => ({
  borderRadius: '8px',
  '& .MuiDataGrid-columnHeaders': {
    background: 'linear-gradient(90deg, #0c83c8, #fc7a46)',
    color: '#0c83c8',
    fontWeight: 'bold',
    fontSize: isMobile ? '14px' : '15px',
  },
  '& .MuiDataGrid-row': {
    '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },
    '&:hover': { backgroundColor: '#e3f2fd' },
  },
  '& .MuiDataGrid-cell': {
    fontSize: isMobile ? '12px' : '14px',
  },
});

// ─── Search Field sx (kept as JS — simple reusable object) ───────────────────

const searchFieldSx = {
  maxWidth: 400,
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    '& fieldset': { borderColor: '#0c83c8' },
    '&:hover fieldset': { borderColor: '#fc7a46' },
    '&.Mui-focused fieldset': { borderColor: '#0c83c8' },
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const safeStringify = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v)).join(' ');
  if (value && typeof value === 'object')
    return Object.values(value).map(safeStringify).join(' ');
  return String(value || '');
};

const TransitionSlide = (props) => <Slide {...props} direction="down" />;

// ─── Component ────────────────────────────────────────────────────────────────

const Update_Expert = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dataGridSx = buildDataGridSx(isMobile);

  // ── State ──────────────────────────────────────────────────────────────────

  const [activeStep, setActiveStep] = useState(0);

  const [experts, setExperts] = useState([]);
  const [filteredExperts, setFilteredExperts] = useState([]);
  const [pocs, setPocs] = useState([]);
  const [filteredPocs, setFilteredPocs] = useState([]);
  const [modules, setModules] = useState([]);
  const [filteredModules, setFilteredModules] = useState([]);
  const [pocNames, setPocNames] = useState({});
  const [moduleNames, setModuleNames] = useState({});

  const [expertSearchQuery, setExpertSearchQuery] = useState('');
  const [pocSearchQuery, setPocSearchQuery] = useState('');
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');

  const [loading, setLoading] = useState({ experts: true, pocs: true, modules: true });

  const [selectedExpertIds, setSelectedExpertIds] = useState([]);
  const [selectedPocIds, setSelectedPocIds] = useState([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState([]);

  const [updateLoading, setUpdateLoading] = useState(false);
  const [dataGridKey, setDataGridKey] = useState(0);

  const [expertSectionOpen, setExpertSectionOpen] = useState(true);
  const [pocSectionOpen, setPocSectionOpen] = useState(true);
  const [moduleSectionOpen, setModuleSectionOpen] = useState(true);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // ── Helpers ────────────────────────────────────────────────────────────────

  const showSnackbar = (message, severity = 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // ── Effects ────────────────────────────────────────────────────────────────

  // Load selections from localStorage on mount
  useEffect(() => {
    try {
      const expertIds = JSON.parse(localStorage.getItem('selectedExpertIds')) || [];
      const pocIds = JSON.parse(localStorage.getItem('selectedPocIds')) || [];
      const moduleIds = JSON.parse(localStorage.getItem('selectedModuleIds')) || [];
      setSelectedExpertIds(Array.isArray(expertIds) ? expertIds : []);
      setSelectedPocIds(Array.isArray(pocIds) ? pocIds : []);
      setSelectedModuleIds(Array.isArray(moduleIds) ? moduleIds : []);
    } catch {
      showSnackbar('Failed to load saved selections. Please try again.');
      localStorage.removeItem('selectedExpertIds');
      localStorage.removeItem('selectedPocIds');
      localStorage.removeItem('selectedModuleIds');
    }
  }, []);

  // Clear localStorage on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem('selectedExpertIds');
      localStorage.removeItem('selectedPocIds');
      localStorage.removeItem('selectedModuleIds');
    };
  }, []);

  // Fetch experts
  useEffect(() => {
    const getExperts = async () => {
      try {
        const expertData = await fetchAllExperts();
        const data = Array.isArray(expertData) ? expertData : [];
        setExperts(data);
        setFilteredExperts(data);
      } catch (error) {
        console.error('Error fetching experts:', error);
        setExperts([]);
        setFilteredExperts([]);
      } finally {
        setLoading((prev) => ({ ...prev, experts: false }));
      }
    };
    getExperts();
  }, []);

  // Fetch POCs
  useEffect(() => {
    const getPocs = async () => {
      try {
        const response = await fetchAllPocs();
        const pocData = response.data || [];
        setPocs(pocData);
        setFilteredPocs(pocData);
      } catch {
        showSnackbar('Unable to fetch POCs. Please try again.');
      } finally {
        setLoading((prev) => ({ ...prev, pocs: false }));
      }
    };
    getPocs();
  }, []);

  // Fetch modules
  useEffect(() => {
    const getModules = async () => {
      try {
        const moduleData = await fetchAllModules();
        const data = Array.isArray(moduleData) ? moduleData : [];
        setModules(data);
        setFilteredModules(data);
      } catch {
        showSnackbar('Unable to fetch modules. Please try again.');
        setModules([]);
        setFilteredModules([]);
      } finally {
        setLoading((prev) => ({ ...prev, modules: false }));
      }
    };
    getModules();
  }, []);

  // Filter experts
  useEffect(() => {
    setFilteredExperts(
      experts.filter((e) =>
        safeStringify(e).toLowerCase().includes(expertSearchQuery.toLowerCase())
      )
    );
  }, [expertSearchQuery, experts]);

  // Filter POCs
  useEffect(() => {
    setFilteredPocs(
      pocs.filter((p) =>
        safeStringify(p).toLowerCase().includes(pocSearchQuery.toLowerCase())
      )
    );
  }, [pocSearchQuery, pocs]);

  // Filter modules
  useEffect(() => {
    setFilteredModules(
      modules.filter((m) =>
        safeStringify(m).toLowerCase().includes(moduleSearchQuery.toLowerCase())
      )
    );
  }, [moduleSearchQuery, modules]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (activeStep === 0 && selectedExpertIds.length !== 1) {
      showSnackbar('Please select exactly one expert to proceed.');
      return;
    }
    if (activeStep === STEPS.length - 1) {
      handleUpdateExpert();
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleUpdateExpert = async () => {
    const selectedExpert = experts.find((e) => e._id === selectedExpertIds[0]);
    if (!selectedExpert?.mod_expert_id) {
      showSnackbar('Selected expert not found or invalid.');
      return;
    }

    const updateData = { mod_expert_id: selectedExpert.mod_expert_id };

    // Validate POCs
    if (selectedPocIds.length > 0) {
      const validPocIds = pocs
        .filter((poc) => selectedPocIds.includes(poc._id) && poc.mod_poc_id)
        .map((poc) => poc.mod_poc_id);
      if (validPocIds.length !== selectedPocIds.length) {
        showSnackbar('One or more selected POCs are invalid.');
        return;
      }
      updateData.poc_id = validPocIds;
    } else {
      updateData.poc_id = [];
    }

    // Validate modules
    if (selectedModuleIds.length > 0) {
      const validModuleIds = modules
        .filter((mod) => selectedModuleIds.includes(mod._id) && mod.mod_id)
        .map((mod) => mod.mod_id);
      if (validModuleIds.length !== selectedModuleIds.length) {
        showSnackbar('One or more selected modules are invalid.');
        return;
      }
      updateData.mod_id = validModuleIds;
    } else {
      updateData.mod_id = [];
    }

    setUpdateLoading(true);

    try {
      await updateExpert(updateData);

      // Refresh experts data
      const updatedExpertsResponse = await fetchAllExperts();
      const expertData = updatedExpertsResponse.data || [];

      // Re-fetch POC and Module names
      const pocNamePromises = [];
      const moduleNamePromises = [];
      expertData.forEach((expert) => {
        if (Array.isArray(expert.poc_id)) {
          expert.poc_id.forEach((id) => {
            pocNamePromises.push(
              fetchPocNameById(id)
                .then((res) => ({ id, name: res.data.mod_poc_name }))
                .catch(() => ({ id, name: 'Unknown POC' }))
            );
          });
        }
        if (Array.isArray(expert.mod_id)) {
          expert.mod_id.forEach((id) => {
            moduleNamePromises.push(
              fetchModuleName(id)
                .then((res) => ({ id, name: res.data.mod_name }))
                .catch(() => ({ id, name: 'Unknown Module' }))
            );
          });
        }
      });

      const pocResults = await Promise.all(pocNamePromises);
      const moduleResults = await Promise.all(moduleNamePromises);

      setPocNames(pocResults.reduce((acc, { id, name }) => ({ ...acc, [id]: name }), {}));
      setModuleNames(moduleResults.reduce((acc, { id, name }) => ({ ...acc, [id]: name }), {}));
      setExperts(expertData);
      setFilteredExperts(expertData);

      // Reset state
      setSelectedExpertIds([]);
      setSelectedPocIds([]);
      setSelectedModuleIds([]);
      localStorage.removeItem('selectedExpertIds');
      localStorage.removeItem('selectedPocIds');
      localStorage.removeItem('selectedModuleIds');
      setDataGridKey((prev) => prev + 1);
      setActiveStep(0);

      showSnackbar('Expert updated successfully!', 'success');
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || 'Unable to update expert. Please try again.'
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  // ── Column Definitions ─────────────────────────────────────────────────────

  const renderHeader = (IconComponent, label) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <IconComponent size={16} color="white" />
      <Typography variant="inherit" fontWeight="bold">
        {label}
      </Typography>
    </Box>
  );

  const columnsForExperts = [
    {
      field: 'mod_expert_name',
      headerName: 'Name',
      minWidth: isMobile ? 120 : 150,
      flex: 1,
      renderHeader: () => renderHeader(User, 'Name'),
    },
    {
      field: 'mod_expert_role',
      headerName: 'Role',
      minWidth: isMobile ? 100 : 120,
      flex: 0.8,
      renderHeader: () => renderHeader(Users, 'Role'),
    },
    {
      field: 'mod_expert_mobile',
      headerName: 'Mobile',
      minWidth: isMobile ? 120 : 150,
      flex: 0.8,
      renderHeader: () => renderHeader(Users, 'Mobile'),
    },
    {
      field: 'poc_id',
      headerName: 'POC Names',
      minWidth: isMobile ? 150 : 250,
      flex: 1,
      renderHeader: () => renderHeader(Users, 'POC Names'),
      renderCell: (params) => (
        <Box>
          {params.value?.length > 0 ? (
            params.value.map((id, i) => (
              <Typography key={i} variant="body2" sx={{ fontSize: isMobile ? '12px' : '14px' }}>
                {pocNames[id] || 'Loading...'}
              </Typography>
            ))
          ) : (
            <Typography variant="body2" sx={{ fontSize: isMobile ? '12px' : '14px' }}>
              No POCs
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'mod_id',
      headerName: 'Module Names',
      minWidth: isMobile ? 150 : 250,
      flex: 1,
      renderHeader: () => renderHeader(Book, 'Module Names'),
      renderCell: (params) => (
        <Box>
          {params.value?.length > 0 ? (
            params.value.map((id, i) => (
              <Typography key={i} variant="body2" sx={{ fontSize: isMobile ? '12px' : '14px' }}>
                {moduleNames[id] || 'Loading...'}
              </Typography>
            ))
          ) : (
            <Typography variant="body2" sx={{ fontSize: isMobile ? '12px' : '14px' }}>
              No modules
            </Typography>
          )}
        </Box>
      ),
    },
  ];

  const columnsForPocs = [
    {
      field: 'mod_poc_name',
      headerName: 'POC Name',
      minWidth: isMobile ? 120 : 150,
      flex: 1,
      renderHeader: () => renderHeader(User, 'POC Name'),
    },
    {
      field: 'mod_poc_role',
      headerName: 'Role',
      minWidth: isMobile ? 100 : 120,
      flex: 0.8,
      renderHeader: () => renderHeader(Users, 'Role'),
    },
    {
      field: 'mod_poc_email',
      headerName: 'Email',
      minWidth: isMobile ? 150 : 200,
      flex: 1,
      renderHeader: () => renderHeader(Users, 'Email'),
    },
    {
      field: 'mod_poc_mobile',
      headerName: 'Mobile',
      minWidth: isMobile ? 120 : 150,
      flex: 0.8,
      renderHeader: () => renderHeader(Users, 'Mobile'),
    },
  ];

  const columnsForModules = [
    {
      field: 'mod_name',
      headerName: 'Module Name',
      minWidth: isMobile ? 150 : 200,
      flex: 1,
      renderHeader: () => renderHeader(Book, 'Module Name'),
    },
    {
      field: 'mod_tech',
      headerName: 'Technology',
      minWidth: isMobile ? 100 : 150,
      flex: 0.8,
      renderHeader: () => renderHeader(Book, 'Technology'),
    },
    {
      field: 'mod_duration',
      headerName: 'Duration',
      minWidth: isMobile ? 120 : 200,
      flex: 1,
      renderHeader: () => renderHeader(Book, 'Duration'),
    },
  ];

  // ── Sub-renders ────────────────────────────────────────────────────────────

  const renderSearchField = (value, onChange, placeholder) => (
    <Box className="expert-search-wrapper">
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search size={20} color="#0c83c8" />
            </InputAdornment>
          ),
        }}
        sx={searchFieldSx}
      />
    </Box>
  );

  const renderCollapsibleSection = (title, isOpen, setIsOpen, children) => (
    <>
      <ListItemButton
        onClick={() => setIsOpen(!isOpen)}
        className="expert-section-btn"
      >
        <Typography variant="h6" className="expert-section-btn-label">
          {title}
        </Typography>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </ListItemButton>
      <Collapse in={isOpen}>{children}</Collapse>
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Admin_Dashboard />

      <Box className="expert-page-wrapper">
        {/* ── Gradient Header ── */}
        <Paper elevation={5} className="expert-header-banner">
          <Box className="expert-header-icon-row">
            <User size={isMobile ? 20 : 24} />
            <Typography variant={isMobile ? 'h6' : 'h5'} className="expert-header-title">
              Expert Management
            </Typography>
          </Box>
          <Typography variant="subtitle2" className="expert-header-subtitle">
            Manage expert assignments
          </Typography>
        </Paper>

        {/* ── Stepper + Step Content ── */}
        <Paper className="expert-stepper-paper">
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            connector={<CustomConnector />}
            className="expert-stepper"
          >
            {STEPS.map(({ label, icon: Icon }, index) => (
              <Step key={label}>
                <StepLabel
                  StepIconComponent={(props) => (
                    <CustomStepIconRoot ownerState={props}>
                      <Icon size={20} />
                    </CustomStepIconRoot>
                  )}
                >
                  <Typography
                    className={`expert-step-label${activeStep === index ? ' active' : ''}`}
                  >
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* ── Step 0: Select Expert ── */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" className="expert-section-title">
                Expert Management
              </Typography>
              {renderSearchField(expertSearchQuery, setExpertSearchQuery, 'Search experts...')}
              <Box className="expert-datagrid-container">
                <DataGrid
                  key={`expert-grid-${dataGridKey}`}
                  rows={filteredExperts}
                  columns={columnsForExperts}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  pageSizeOptions={[10, 20, 50]}
                  loading={loading.experts}
                  getRowId={(row) => row._id}
                  checkboxSelection
                  rowSelectionModel={selectedExpertIds}
                  onRowSelectionModelChange={(newId) => {
                    const updated = newId.length > 0 ? [newId[newId.length - 1]] : [];
                    setSelectedExpertIds(updated);
                    localStorage.setItem('selectedExpertIds', JSON.stringify(updated));
                    setDataGridKey((prev) => prev + 1);
                  }}
                  sx={dataGridSx}
                />
              </Box>
            </Box>
          )}

          {/* ── Step 1: Select POCs ── */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" className="expert-section-title">
                POC Selection
              </Typography>
              {renderSearchField(pocSearchQuery, setPocSearchQuery, 'Search POCs...')}
              <Box className="expert-datagrid-container">
                <DataGrid
                  key={`poc-grid-${dataGridKey}`}
                  rows={filteredPocs}
                  columns={columnsForPocs}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  pageSizeOptions={[10, 20, 50]}
                  loading={loading.pocs}
                  getRowId={(row) => row._id}
                  checkboxSelection
                  rowSelectionModel={selectedPocIds}
                  onRowSelectionModelChange={(newSelection) => {
                    setSelectedPocIds(newSelection);
                    localStorage.setItem('selectedPocIds', JSON.stringify(newSelection));
                    setDataGridKey((prev) => prev + 1);
                  }}
                  sx={dataGridSx}
                />
              </Box>
            </Box>
          )}

          {/* ── Step 2: Select Modules ── */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" className="expert-section-title">
                Module Selection
              </Typography>
              {renderSearchField(moduleSearchQuery, setModuleSearchQuery, 'Search modules...')}
              <Box className="expert-datagrid-container">
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
                    setDataGridKey((prev) => prev + 1);
                  }}
                  sx={dataGridSx}
                />
              </Box>
            </Box>
          )}

          {/* ── Step 3: Review & Submit ── */}
          {activeStep === 3 && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" className="expert-section-title">
                Review and Submit
              </Typography>
              <Typography variant="body1" className="expert-review-description">
                Please review the following selections before submitting the update:
              </Typography>

              {/* Selected Expert */}
              {renderCollapsibleSection(
                'Selected Expert',
                expertSectionOpen,
                setExpertSectionOpen,
                selectedExpertIds.length === 1 ? (
                  <List dense>
                    {experts
                      .filter((e) => e._id === selectedExpertIds[0])
                      .map((expert) => (
                        <ListItem key={expert._id} className="expert-review-list-item">
                          <ListItemText
                            primary={expert.mod_expert_name || 'N/A'}
                            secondary={`ID: ${expert.mod_expert_id || 'N/A'} | Role: ${expert.mod_expert_role || 'N/A'} | Mobile: ${expert.mod_expert_mobile || 'N/A'}`}
                            primaryTypographyProps={{ className: 'expert-review-list-primary' }}
                            secondaryTypographyProps={{ className: 'expert-review-list-secondary' }}
                          />
                        </ListItem>
                      ))}
                  </List>
                ) : (
                  <Alert severity="warning" className="expert-review-alert">
                    No expert selected
                  </Alert>
                )
              )}

              <Divider sx={{ my: 2 }} />

              {/* Selected POCs */}
              {renderCollapsibleSection(
                `Selected POCs (${selectedPocIds.length})`,
                pocSectionOpen,
                setPocSectionOpen,
                selectedPocIds.length > 0 ? (
                  <List dense>
                    {pocs
                      .filter((poc) => selectedPocIds.includes(poc._id))
                      .map((poc) => (
                        <ListItem key={poc._id} className="expert-review-list-item">
                          <ListItemText
                            primary={poc.mod_poc_name || 'N/A'}
                            secondary={`ID: ${poc.mod_poc_id || 'N/A'} | Role: ${poc.mod_poc_role || 'N/A'} | Email: ${poc.mod_poc_email || 'N/A'} | Mobile: ${poc.mod_poc_mobile || 'N/A'}`}
                            primaryTypographyProps={{ className: 'expert-review-list-primary' }}
                            secondaryTypographyProps={{ className: 'expert-review-list-secondary' }}
                          />
                        </ListItem>
                      ))}
                  </List>
                ) : (
                  <Alert severity="info" className="expert-review-alert">
                    No POCs selected
                  </Alert>
                )
              )}

              <Divider sx={{ my: 2 }} />

              {/* Selected Modules */}
              {renderCollapsibleSection(
                `Selected Modules (${selectedModuleIds.length})`,
                moduleSectionOpen,
                setModuleSectionOpen,
                selectedModuleIds.length > 0 ? (
                  <List dense>
                    {modules
                      .filter((mod) => selectedModuleIds.includes(mod._id))
                      .map((mod) => (
                        <ListItem key={mod._id} className="expert-review-list-item">
                          <ListItemText
                            primary={mod.mod_name || 'N/A'}
                            secondary={`ID: ${mod.mod_id || 'N/A'} | Technology: ${mod.mod_tech || 'N/A'} | Duration: ${mod.mod_duration || 'N/A'}`}
                            primaryTypographyProps={{ className: 'expert-review-list-primary' }}
                            secondaryTypographyProps={{ className: 'expert-review-list-secondary' }}
                          />
                        </ListItem>
                      ))}
                  </List>
                ) : (
                  <Alert severity="info" className="expert-review-alert">
                    No modules selected
                  </Alert>
                )
              )}
            </Box>
          )}

          {/* ── Navigation Buttons ── */}
          <Box className="expert-nav-buttons">
            <Button
              disabled={activeStep === 0 || updateLoading}
              onClick={handleBack}
              startIcon={<ArrowLeft size={16} />}
              className="expert-btn-back"
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                updateLoading || (activeStep === 0 && selectedExpertIds.length !== 1)
              }
              endIcon={
                activeStep === STEPS.length - 1 ? (
                  <Save size={16} />
                ) : (
                  <ArrowRight size={16} />
                )
              }
              className="expert-btn-next"
            >
              {activeStep === STEPS.length - 1 ? (
                updateLoading ? (
                  <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                ) : (
                  'Submit'
                )
              ) : (
                'Next'
              )}
            </Button>
          </Box>
        </Paper>

        {/* ── Snackbar ── */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          TransitionComponent={TransitionSlide}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            variant="filled"
            className={`expert-alert${snackbarSeverity === 'success' ? ' expert-alert-success' : ''}`}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default Update_Expert;