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
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container,
  useTheme,
  useMediaQuery,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  styled,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { fetchAllPocs, fetchAllTests, fetchPocById, updateTestPoc } from '../axios';
import SaveIcon from '@mui/icons-material/Save';
import ModuleIcon from '@mui/icons-material/Book';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Admin_Dashboard from '../components/AdminDash';
import { stepConnectorClasses } from '@mui/material/StepConnector';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// ─── Styles ───────────────────────────────────────────────────────────────────
import '../styles/Allocate_Test.css';

// ─── Styled MUI Components ────────────────────────────────────────────────────

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 20,
    left: 'calc(-50% + 28px)',
    right: 'calc(50% + 28px)',
  },
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
    height: 4,
    border: 0,
    backgroundColor: theme.palette.grey[300],
    borderRadius: 2,
  },
}));

const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.grey[300],
  zIndex: 1,
  color: '#fff',
  width: 48,
  height: 48,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'all 0.3s ease',
  ...(ownerState.active || ownerState.completed
    ? {
        background: 'linear-gradient(90deg, #0c83c8, #fc7a46)',
        boxShadow: '0 4px 12px rgba(12, 131, 200, 0.3)',
      }
    : {}),
}));

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ['Select POC', 'Select Tests', 'Review'];

const STEP_ICONS = {
  1: <ModuleIcon />,
  2: <AssignmentIcon />,
  3: <CheckCircleIcon />,
};

// ─── DataGrid sx (kept as JS — used in MUI sx prop) ──────────────────────────

const dataGridSx = {
  borderRadius: '12px',
  '& .MuiDataGrid-columnHeaders': {
    background: 'linear-gradient(90deg, #0c83c8, #fc7a46)',
    color: '#0c83c8',
    fontWeight: '600',
  },
  '& .MuiDataGrid-row': {
    '&:nth-of-type(odd)': { backgroundColor: '#f8fafc' },
    '&:hover': { backgroundColor: '#e3f2fd' },
  },
  '& .MuiDataGrid-cell': {
    borderBottom: '1px solid #e5e7eb',
  },
  '& .MuiCheckbox-root': {
    color: '#0c83c8',
    '&.Mui-checked': { color: '#fc7a46' },
  },
  boxShadow: '0 2px 8px rgba(12, 131, 200, 0.05)',
  border: 'none',
};

// DatePicker slotProps sx (static)
const datePickerSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    '&:hover fieldset': { borderColor: '#fc7a46' },
    '&.Mui-focused fieldset': { borderColor: '#0c83c8' },
  },
  '& .MuiInputLabel-root': {
    color: '#0c83c8',
    '&.Mui-focused': { color: '#fc7a46' },
  },
};

// ─── Step Icon ────────────────────────────────────────────────────────────────

function ColorlibStepIcon(props) {
  const { active, completed, className, icon } = props;
  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {STEP_ICONS[String(icon)]}
    </ColorlibStepIconRoot>
  );
}

// ─── POC formatter ───────────────────────────────────────────────────────────

const formatPoc = (poc, index) => ({
  id: poc._id || `temp-id-${index}`,
  mod_poc_id: poc.mod_poc_id || 'N/A',
  mod_poc_name: poc.mod_poc_name || 'N/A',
  mod_poc_role: poc.mod_poc_role || 'N/A',
  mod_poc_email: poc.mod_poc_email || 'N/A',
  mod_poc_mobile: poc.mod_poc_mobile || 'N/A',
  testCount: Array.isArray(poc.mod_tests) ? poc.mod_tests.length : 0,
  tags: Array.isArray(poc.mod_poc_tags) ? poc.mod_poc_tags : [],
});

// ─── Component ────────────────────────────────────────────────────────────────

const Allocate_Test = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ── State ──────────────────────────────────────────────────────────────────

  const [pocs, setPocs] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState({ pocs: true, tests: true, pocDetails: false });

  const [selectedPocIds, setSelectedPocIds] = useState([]);
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [testDates, setTestDates] = useState({});
  const [originalTestDates, setOriginalTestDates] = useState({});

  const [updateLoading, setUpdateLoading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [pocDetailsFetched, setPocDetailsFetched] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // ── Helpers ────────────────────────────────────────────────────────────────

  const showSnackbar = (message, severity = 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const serializeDates = (dates) =>
    Object.keys(dates).reduce((acc, id) => {
      acc[id] = dates[id].toISOString();
      return acc;
    }, {});

  const getTestSelectionModel = () =>
    tests
      .filter((test) => selectedTestIds.includes(test.test_id))
      .map((test) => test.id)
      .filter(Boolean);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Load localStorage on mount
  useEffect(() => {
    try {
      const pocIds = JSON.parse(localStorage.getItem('selectedPocIds')) || [];
      const testIds = JSON.parse(localStorage.getItem('selectedTestIds')) || [];
      const storedDates = JSON.parse(localStorage.getItem('testDates')) || {};

      const parsedDates = Object.keys(storedDates).reduce((acc, id) => {
        const d = dayjs(storedDates[id]);
        if (d.isValid()) acc[id] = d;
        return acc;
      }, {});

      setSelectedPocIds(Array.isArray(pocIds) ? pocIds : []);
      setSelectedTestIds(Array.isArray(testIds) ? testIds : []);
      setTestDates(parsedDates);
    } catch {
      showSnackbar('Failed to load saved selections.');
      localStorage.removeItem('selectedPocIds');
      localStorage.removeItem('selectedTestIds');
      localStorage.removeItem('testDates');
    }
  }, []);

  // Clear localStorage on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem('selectedPocIds');
      localStorage.removeItem('selectedTestIds');
      localStorage.removeItem('testDates');
    };
  }, []);

  // Fetch POCs
  useEffect(() => {
    const getPocs = async () => {
      try {
        const response = await fetchAllPocs();
        setPocs((response.data || []).map(formatPoc));
      } catch (error) {
        showSnackbar(`Error fetching POCs: ${error.message}`);
      } finally {
        setLoading((prev) => ({ ...prev, pocs: false }));
      }
    };
    getPocs();
  }, []);

  // Fetch Tests
  useEffect(() => {
    const getTests = async () => {
      try {
        const testsArray = await fetchAllTests();
        const formatted = Array.isArray(testsArray)
          ? testsArray.map((test, index) => ({
              id: test._id || `temp-id-${index}`,
              test_id: test.test_id || 'N/A',
              test_name: test.test_name || 'N/A',
              test_tech: test.test_tech || 'N/A',
              test_duration: test.test_duration || 'N/A',
              tags: Array.isArray(test.test_tags) ? test.test_tags : [],
            }))
          : [];
        setTests(formatted);
      } catch (error) {
        showSnackbar(`Error fetching tests: ${error.message || 'Unknown error'}`);
        setTests([]);
      } finally {
        setLoading((prev) => ({ ...prev, tests: false }));
      }
    };
    getTests();
  }, []);

  // Fetch POC details when a POC is selected
  useEffect(() => {
    if (loading.pocs || selectedPocIds.length !== 1 || pocDetailsFetched) return;

    const selectedPoc = pocs.find((poc) => poc.id === selectedPocIds[0]);
    if (!selectedPoc?.mod_poc_id) {
      showSnackbar('Selected POC has no valid POC ID');
      setSelectedPocIds([]);
      localStorage.removeItem('selectedPocIds');
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading((prev) => ({ ...prev, pocDetails: true }));
        const pocData = await fetchPocById(selectedPoc.mod_poc_id);

        if (pocData && Array.isArray(pocData.mod_tests)) {
          const validTestIds = pocData.mod_tests
            .map((t) => t.test_id)
            .filter((id) => id && tests.some((t) => t.test_id === id));

          const dates = pocData.mod_tests.reduce((acc, test) => {
            if (test.test_id && test.assigned_date) {
              const parsed = dayjs(test.assigned_date, 'DD/MM/YYYY');
              if (parsed.isValid()) acc[test.test_id] = parsed;
            }
            return acc;
          }, {});

          setSelectedTestIds(validTestIds);
          setTestDates(dates);
          setOriginalTestDates(dates);
          localStorage.setItem('selectedTestIds', JSON.stringify(validTestIds));
          localStorage.setItem('testDates', JSON.stringify(serializeDates(dates)));
        }
        setPocDetailsFetched(true);
      } catch (error) {
        showSnackbar(`Error fetching POC details: ${error.message}`);
        setSelectedPocIds([]);
        localStorage.removeItem('selectedPocIds');
      } finally {
        setLoading((prev) => ({ ...prev, pocDetails: false }));
      }
    };

    fetchDetails();
  }, [loading.pocs, selectedPocIds, pocs, pocDetailsFetched, tests]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (activeStep === 0) {
      if (selectedPocIds.length !== 1) { showSnackbar('Please select exactly one POC'); return; }
      if (!pocDetailsFetched) { showSnackbar('Please wait for POC details to load'); return; }
    } else if (activeStep === 1) {
      if (selectedTestIds.length === 0) { showSnackbar('Please select at least one test'); return; }
      for (const testId of selectedTestIds) {
        if (!testDates[testId] || !dayjs(testDates[testId]).isValid()) {
          showSnackbar(`Please select a valid date for test: ${testId}`);
          return;
        }
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setActiveStep((prev) => prev - 1);
    if (activeStep === 1) setPocDetailsFetched(false);
  };

  const handleOpenPreviewDialog = () => {
    if (selectedPocIds.length !== 1) { showSnackbar('Please select exactly one POC'); return; }
    if (selectedTestIds.length === 0) { showSnackbar('Please select at least one test'); return; }
    for (const testId of selectedTestIds) {
      if (!testDates[testId] || !dayjs(testDates[testId]).isValid()) {
        showSnackbar(`Please select a valid date for test: ${testId}`);
        return;
      }
    }
    setPreviewDialogOpen(true);
  };

  const handleClosePreviewDialog = () => setPreviewDialogOpen(false);

  const handleUpdateTest = async () => {
    const selectedPoc = pocs.find((poc) => poc.id === selectedPocIds[0]);
    if (!selectedPoc) { showSnackbar('Selected POC not found'); return; }

    const uniqueTestIds = [...new Set(selectedTestIds)];

    const invalidIds = uniqueTestIds.filter((id) => !tests.some((t) => t.test_id === id));
    if (invalidIds.length > 0) { showSnackbar(`Invalid test IDs: ${invalidIds.join(', ')}`); return; }

    const invalidDates = uniqueTestIds.filter(
      (id) => !testDates[id] || !dayjs(testDates[id]).isValid()
    );
    if (invalidDates.length > 0) {
      showSnackbar(`Invalid or missing dates for tests: ${invalidDates.join(', ')}`);
      return;
    }

    const data = {
      mod_poc_id: selectedPoc.mod_poc_id,
      test_id: uniqueTestIds.map((id) => ({
        test_id: id,
        assigned_date: dayjs(testDates[id]).format('DD/MM/YYYY'),
      })),
    };

    setUpdateLoading(true);
    setPreviewDialogOpen(false);

    try {
      const response = await updateTestPoc(data);
      showSnackbar(response.message || 'Tests allocated successfully', 'success');

      const updated = await fetchAllPocs();
      setPocs((updated.data || []).map(formatPoc));

      setSelectedPocIds([]);
      setSelectedTestIds([]);
      setTestDates({});
      setOriginalTestDates({});
      localStorage.removeItem('selectedPocIds');
      localStorage.removeItem('selectedTestIds');
      localStorage.removeItem('testDates');
      setPocDetailsFetched(false);
      setActiveStep(0);
    } catch (error) {
      showSnackbar(
        `Error: ${error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to allocate tests'}`
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  // ── Sub-renders ────────────────────────────────────────────────────────────

  const renderTagChips = (tags) => {
    if (!Array.isArray(tags) || tags.length === 0) {
      return (
        <Typography variant="body2" className="alloc-review-body">
          No tags
        </Typography>
      );
    }
    return tags.map((tag, i) => (
      <Chip key={i} label={tag.trim()} size="small" className="alloc-tag-chip" />
    ));
  };

  const renderColHeader = (label) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Typography variant="inherit" fontWeight="bold">{label}</Typography>
    </Box>
  );

  // ── Column Definitions ─────────────────────────────────────────────────────

  const columnsForPocs = [
    { field: 'mod_poc_name', headerName: 'Name', minWidth: 150, flex: 1, renderHeader: () => renderColHeader('Name') },
    { field: 'mod_poc_role', headerName: 'Role', minWidth: 100, flex: 0.8, renderHeader: () => renderColHeader('Role') },
    { field: 'mod_poc_email', headerName: 'Email', minWidth: 200, flex: 1.2, renderHeader: () => renderColHeader('Email') },
    { field: 'mod_poc_mobile', headerName: 'Mobile', minWidth: 150, flex: 1, renderHeader: () => renderColHeader('Mobile') },
    { field: 'testCount', headerName: 'No of Tests', minWidth: 120, flex: 0.8, renderHeader: () => renderColHeader('No of Tests') },
    {
      field: 'tags',
      headerName: 'Tags',
      minWidth: 200,
      flex: 1,
      renderHeader: () => renderColHeader('Tags'),
      renderCell: (params) => (
        <Box className="alloc-tag-wrap" sx={{ py: 1 }}>
          {renderTagChips(params.value)}
        </Box>
      ),
    },
  ];

  const columnsForTests = [
    { field: 'test_name', headerName: 'Test Name', minWidth: 200, flex: 1.2, renderHeader: () => renderColHeader('Test Name') },
    { field: 'test_tech', headerName: 'Technology', minWidth: 150, flex: 1, renderHeader: () => renderColHeader('Technology') },
    { field: 'test_duration', headerName: 'Duration', minWidth: 150, flex: 1, renderHeader: () => renderColHeader('Duration') },
    {
      field: 'tags',
      headerName: 'Tags',
      minWidth: 200,
      flex: 1,
      renderHeader: () => renderColHeader('Tags'),
      renderCell: (params) => (
        <Box className="alloc-tag-wrap" sx={{ py: 1 }}>
          {renderTagChips(params.value)}
        </Box>
      ),
    },
    {
      field: 'assigned_date',
      headerName: 'Assigned Date',
      minWidth: 200,
      flex: 1,
      renderHeader: () => renderColHeader('Assigned Date'),
      renderCell: (params) => {
        const testId = params.row.test_id;
        return (
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{ width: '100%', '& .MuiFormControl-root': { width: '100%' } }}
          >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Select Date"
                value={testDates[testId] || null}
                onChange={(newValue) => {
                  if (newValue && dayjs(newValue).isValid()) {
                    const updated = { ...testDates, [testId]: newValue };
                    setTestDates(updated);
                    localStorage.setItem('testDates', JSON.stringify(serializeDates(updated)));
                  }
                }}
                slotProps={{ textField: { size: 'small', sx: datePickerSx } }}
              />
            </LocalizationProvider>
          </Box>
        );
      },
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Admin_Dashboard />

      <Box className="alloc-page-wrapper">
        <Container maxWidth="lg">

          {/* ── Header + Stepper Paper ── */}
          <Paper className="alloc-header-paper">
            <Paper className="alloc-gradient-banner" elevation={0}>
              <Typography variant="h4" className="alloc-banner-title">
                Allocate Tests to POC
              </Typography>
              <Typography variant="subtitle2" className="alloc-banner-subtitle">
                Seamlessly assign tests to points of contact
              </Typography>
            </Paper>

            <Stepper
              alternativeLabel
              activeStep={activeStep}
              connector={<ColorlibConnector />}
              className="alloc-stepper"
            >
              {STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {/* ── Step Content Paper ── */}
          <Paper className="alloc-content-paper">

            {/* ── Step 0: Select POC ── */}
            {activeStep === 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" className="alloc-section-title">
                  Select POC
                </Typography>
                <Box className="alloc-datagrid-container">
                  {loading.pocs || loading.pocDetails ? (
                    <Box className="alloc-loader-box">
                      <CircularProgress sx={{ color: '#0c83c8' }} />
                    </Box>
                  ) : (
                    <DataGrid
                      rows={pocs}
                      columns={columnsForPocs}
                      initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                      pageSizeOptions={[10, 20, 50]}
                      getRowId={(row) => row.id}
                      checkboxSelection
                      rowSelectionModel={selectedPocIds}
                      onRowSelectionModelChange={(newSelection) => {
                        const updated = newSelection.length > 0 ? [newSelection[newSelection.length - 1]] : [];
                        setSelectedPocIds(updated);
                        setSelectedTestIds([]);
                        setTestDates({});
                        setOriginalTestDates({});
                        localStorage.setItem('selectedPocIds', JSON.stringify(updated));
                        localStorage.removeItem('selectedTestIds');
                        localStorage.removeItem('testDates');
                        setPocDetailsFetched(false);
                      }}
                      sx={dataGridSx}
                    />
                  )}
                </Box>
                <Box className="alloc-nav-end">
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={loading.pocDetails || selectedPocIds.length !== 1}
                    className="alloc-btn-primary"
                  >
                    {loading.pocDetails ? (
                      <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                    ) : (
                      'Next'
                    )}
                  </Button>
                </Box>
              </Box>
            )}

            {/* ── Step 1: Select Tests ── */}
            {activeStep === 1 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" className="alloc-section-title">
                  Select Tests
                </Typography>
                <Box className="alloc-datagrid-container-lg">
                  {loading.tests ? (
                    <Box className="alloc-loader-box">
                      <CircularProgress sx={{ color: '#0c83c8' }} />
                    </Box>
                  ) : (
                    <DataGrid
                      rows={tests}
                      columns={columnsForTests}
                      initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                      pageSizeOptions={[10, 25]}
                      getRowId={(row) => row.id}
                      checkboxSelection
                      rowSelectionModel={getTestSelectionModel()}
                      onRowSelectionModelChange={(newSelection) => {
                        const updated = [...new Set(
                          newSelection
                            .map((id) => tests.find((t) => t.id === id)?.test_id)
                            .filter(Boolean)
                        )];
                        const updatedDates = updated.reduce((acc, testId) => {
                          acc[testId] = testDates[testId] || originalTestDates[testId] || dayjs();
                          return acc;
                        }, {});
                        setSelectedTestIds(updated);
                        setTestDates(updatedDates);
                        localStorage.setItem('selectedTestIds', JSON.stringify(updated));
                        localStorage.setItem('testDates', JSON.stringify(serializeDates(updatedDates)));
                      }}
                      sx={dataGridSx}
                    />
                  )}
                </Box>
                <Box className="alloc-nav-between">
                  <Button variant="outlined" onClick={handlePrevious} className="alloc-btn-secondary">
                    Previous
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={loading.tests}
                    className="alloc-btn-primary"
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            )}

            {/* ── Step 2: Review ── */}
            {activeStep === 2 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" className="alloc-section-title">
                  Review Test Allocations
                </Typography>
                <Typography variant="body1" className="alloc-review-description">
                  Please review your selections below before confirming the allocation.
                </Typography>

                {/* Selected POC */}
                <Box className="alloc-review-box">
                  <Typography variant="subtitle1" className="alloc-review-box-title">
                    Selected POC
                  </Typography>
                  {selectedPocIds.length === 1 ? (
                    (() => {
                      const poc = pocs.find((p) => p.id === selectedPocIds[0]);
                      return poc ? (
                        <Box className="alloc-poc-info-stack">
                          {[
                            ['Name', poc.mod_poc_name],
                            ['Role', poc.mod_poc_role],
                            ['Email', poc.mod_poc_email],
                            ['Mobile', poc.mod_poc_mobile],
                            ['No of Tests', poc.testCount || 0],
                          ].map(([label, value]) => (
                            <Typography key={label} variant="body2" className="alloc-review-body">
                              <strong>{label}:</strong> {value || 'N/A'}
                            </Typography>
                          ))}
                          <Typography variant="body2" className="alloc-review-body">
                            <strong>Tags:</strong>
                          </Typography>
                          <Box className="alloc-tag-wrap">{renderTagChips(poc.tags)}</Box>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="error" className="alloc-review-body">
                          No POC found
                        </Typography>
                      );
                    })()
                  ) : (
                    <Typography variant="body2" color="error" className="alloc-review-body">
                      No POC selected
                    </Typography>
                  )}
                </Box>

                {/* Selected Tests */}
                <Box className="alloc-review-box">
                  <Typography variant="subtitle1" className="alloc-review-box-title">
                    Selected Tests
                  </Typography>
                  {selectedTestIds.length > 0 ? (
                    <TableContainer className="alloc-review-table-container">
                      <Table size="small" className="alloc-review-table">
                        <TableHead>
                          <TableRow>
                            {['Test Name', 'Technology', 'Duration', 'Tags', 'Assigned Date'].map((h) => (
                              <TableCell key={h}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedTestIds.map((testId) => {
                            const test = tests.find((t) => t.test_id === testId);
                            return (
                              <TableRow key={testId}>
                                <TableCell className="alloc-review-body">{test?.test_name || 'N/A'}</TableCell>
                                <TableCell className="alloc-review-body">{test?.test_tech || 'N/A'}</TableCell>
                                <TableCell className="alloc-review-body">{test?.test_duration || 'N/A'}</TableCell>
                                <TableCell>
                                  <Box className="alloc-tag-wrap">{renderTagChips(test?.tags || [])}</Box>
                                </TableCell>
                                <TableCell className="alloc-review-body">
                                  {testDates[testId] ? dayjs(testDates[testId]).format('DD/MM/YYYY') : 'N/A'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="error" className="alloc-review-body">
                      No Tests selected
                    </Typography>
                  )}
                </Box>

                <Box className="alloc-nav-start">
                  <Button variant="outlined" onClick={handlePrevious} className="alloc-btn-secondary">
                    Previous
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>

          {/* ── FAB ── */}
          {activeStep === 2 && (
            <Fab
              variant="extended"
              onClick={handleOpenPreviewDialog}
              disabled={updateLoading || selectedPocIds.length !== 1 || selectedTestIds.length === 0}
              className="alloc-fab"
            >
              <SaveIcon sx={{ mr: 1 }} />
              Confirm Allocation
            </Fab>
          )}

          {/* ── Confirm Dialog ── */}
          <Dialog
            open={previewDialogOpen}
            onClose={handleClosePreviewDialog}
            maxWidth="sm"
            fullWidth
            PaperProps={{ className: 'alloc-dialog-paper' }}
          >
            <DialogTitle className="alloc-dialog-title">
              Confirm Test Allocation
            </DialogTitle>
            <DialogContent dividers className="alloc-dialog-content">
              <DialogContentText className="alloc-dialog-content-text">
                Confirm the test allocations below:
              </DialogContentText>
              {selectedPocIds.length === 1 && (
                <Typography variant="body2" className="alloc-dialog-body-text">
                  <strong>POC:</strong>{' '}
                  {pocs.find((poc) => poc.id === selectedPocIds[0])?.mod_poc_name || 'N/A'}
                </Typography>
              )}
              {selectedTestIds.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" className="alloc-dialog-body-text" sx={{ mt: 0 }}>
                    <strong>Tests:</strong>
                  </Typography>
                  {selectedTestIds.map((testId) => {
                    const test = tests.find((t) => t.test_id === testId);
                    return (
                      <Typography key={testId} variant="body2" className="alloc-dialog-test-item">
                        - {test?.test_name || 'N/A'} (Date:{' '}
                        {testDates[testId] ? dayjs(testDates[testId]).format('DD/MM/YYYY') : 'Not set'})
                      </Typography>
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body2" color="error" className="alloc-dialog-body-text">
                  No tests selected.
                </Typography>
              )}
            </DialogContent>
            <DialogActions className="alloc-dialog-actions">
              <Button onClick={handleClosePreviewDialog} className="alloc-btn-cancel">
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleUpdateTest}
                disabled={updateLoading}
                startIcon={updateLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                className="alloc-btn-primary"
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>

          {/* ── Snackbar ── */}
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
              className={`alloc-alert${snackbarSeverity === 'success' ? ' alloc-alert-success' : ''}`}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </>
  );
};

export default Allocate_Test;