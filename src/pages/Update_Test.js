import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  IconButton,
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
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Switch,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  ClipboardList, Code, HelpCircle, Check, Save, X, Copy,
  Tag, Calendar, List, CheckCircle, Plus, Trophy, ToggleRight,
  Search, FileText,
} from 'lucide-react';
import { fetchAllTests, fetchAllCodes, fetchAllMcqs, updateTest, getTestById } from '../axios';
import Admin_Dashboard from '../components/AdminDash';
import { Stepper, Step, StepLabel, StepConnector, styled } from '@mui/material';
import { stepConnectorClasses } from '@mui/material/StepConnector';
import '../styles/Update_Test.css';

// ── Custom Stepper Connector ──────────────────────────────────────────────────
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 22 },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: { background: 'linear-gradient(90deg, #0c83c8, #fc7a46)' },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: { background: 'linear-gradient(90deg, #0c83c8, #fc7a46)' },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3, border: 0, backgroundColor: '#e0e0e0', borderRadius: 1,
  },
}));

const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: '#e0e0e0',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'all 0.3s ease',
  '&:hover': { transform: 'scale(1.1)' },
  ...(ownerState.active || ownerState.completed
    ? { background: 'linear-gradient(90deg, #0c83c8, #fc7a46)', boxShadow: '0 4px 10px rgba(0,0,0,0.25)' }
    : {}),
}));

function ColorlibStepIcon(props) {
  const { active, completed, className, icon } = props;
  const icons = {
    1: <ClipboardList size={24} />,
    2: <HelpCircle size={24} />,
    3: <Code size={24} />,
    4: <CheckCircle size={24} />,
  };
  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(icon)]}
    </ColorlibStepIconRoot>
  );
}

const steps = ['Select Test', 'Select MCQs', 'Select Coding Problems', 'Review and Confirm'];

// ── DataGrid sx (kept as sx — MUI deep selectors + isMobile runtime) ─────────
const getDataGridSx = (isMobile) => ({
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
  '& .MuiDataGrid-cell': { fontSize: isMobile ? '12px' : '14px' },
});

// ── Component ─────────────────────────────────────────────────────────────────
const UpdateTestModule = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dataGridSx = getDataGridSx(isMobile);

  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [codes, setCodes] = useState([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [mcqs, setMcqs] = useState([]);
  const [filteredMcqs, setFilteredMcqs] = useState([]);
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [mcqSearchQuery, setMcqSearchQuery] = useState('');
  const [loading, setLoading] = useState({ tests: true, codes: true, mcqs: true });
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [selectedCodeIds, setSelectedCodeIds] = useState([]);
  const [selectedMcqIds, setSelectedMcqIds] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogTitle, setDetailsDialogTitle] = useState('');
  const [detailsDialogContent, setDetailsDialogContent] = useState([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusChange, setStatusChange] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [activeStep, setActiveStep] = useState(0);
  const [dataGridKey, setDataGridKey] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);

  const safeStringify = (value) => {
    if (Array.isArray(value)) return value.map((v) => String(v)).join(' ');
    if (value && typeof value === 'object') return Object.values(value).map(safeStringify).join(' ');
    return String(value || '');
  };

  useEffect(() => {
    try {
      const testIds = JSON.parse(localStorage.getItem('selectedTestIds')) || [];
      const codeIds = JSON.parse(localStorage.getItem('selectedCodeIds')) || [];
      const mcqIds = JSON.parse(localStorage.getItem('selectedMcqIds')) || [];
      setSelectedTestIds(Array.isArray(testIds) ? testIds : []);
      setSelectedCodeIds(Array.isArray(codeIds) ? codeIds : []);
      setSelectedMcqIds(Array.isArray(mcqIds) ? mcqIds : []);
    } catch {
      localStorage.removeItem('selectedTestIds');
      localStorage.removeItem('selectedCodeIds');
      localStorage.removeItem('selectedMcqIds');
    }
  }, []);

  useEffect(() => {
    return () => {
      localStorage.removeItem('selectedTestIds');
      localStorage.removeItem('selectedCodeIds');
      localStorage.removeItem('selectedMcqIds');
    };
  }, []);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const testData = await fetchAllTests();
        const arr = Array.isArray(testData) ? testData : [];
        setTests(arr);
        setFilteredTests(arr);
      } catch {
        setSnackbarMessage('Unable to fetch tests. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setTests([]); setFilteredTests([]);
      } finally {
        setLoading(prev => ({ ...prev, tests: false }));
      }
    };
    fetchTests();
  }, []);

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const codeResponse = await fetchAllCodes();
        const codesArray = codeResponse.codes || [];
        if (!Array.isArray(codesArray)) { setCodes([]); setFilteredCodes([]); return; }
        const formattedRows = codesArray.map((item, index) => ({
          id: item._id || `temp-id-${index}`,
          code_id: item.code_id || 'N/A',
          problem: item.code_problem_statement || 'N/A',
          testCasesCount: (Array.isArray(item.code_test_cases_id) ? item.code_test_cases_id.length : Array.isArray(item.code_test_cases) ? item.code_test_cases.length : 0) || 0,
          tags: (Array.isArray(item.code_tags) ? item.code_tags : []).join(', ') || 'None',
          createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A',
          updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'N/A',
        }));
        setCodes(formattedRows);
        setFilteredCodes(formattedRows);
        setDataGridKey(prev => prev + 1);
      } catch {
        setSnackbarMessage('Unable to fetch coding problems. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setCodes([]); setFilteredCodes([]);
      } finally {
        setLoading(prev => ({ ...prev, codes: false }));
      }
    };
    fetchCodes();
  }, []);

  useEffect(() => {
    const fetchMcqs = async () => {
      try {
        const mcqData = await fetchAllMcqs();
        const arr = Array.isArray(mcqData) ? mcqData : [];
        setMcqs(arr); setFilteredMcqs(arr);
      } catch {
        setSnackbarMessage('Unable to fetch MCQs. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setMcqs([]); setFilteredMcqs([]);
      } finally {
        setLoading(prev => ({ ...prev, mcqs: false }));
      }
    };
    fetchMcqs();
  }, []);

  useEffect(() => {
    setFilteredTests(tests.filter(t => safeStringify(t).toLowerCase().includes(testSearchQuery.toLowerCase())));
  }, [testSearchQuery, tests]);

  useEffect(() => {
    setFilteredCodes(codes.filter(c => safeStringify(c).toLowerCase().includes(codeSearchQuery.toLowerCase())));
  }, [codeSearchQuery, codes]);

  useEffect(() => {
    setFilteredMcqs(mcqs.filter(m => safeStringify(m).toLowerCase().includes(mcqSearchQuery.toLowerCase())));
  }, [mcqSearchQuery, mcqs]);

  const fetchTestDetails = useCallback(async () => {
    if (loading.tests || loading.codes || loading.mcqs || !tests.length || !mcqs.length || !codes.length) return;
    if (selectedTestIds.length !== 1) {
      setSelectedCodeIds([]); setSelectedMcqIds([]); setSelectedTest(null);
      localStorage.removeItem('selectedCodeIds'); localStorage.removeItem('selectedMcqIds');
      setDataGridKey(prev => prev + 1);
      return;
    }
    const test = tests.find(t => t._id === selectedTestIds[0]);
    if (!test?.test_id) {
      setSnackbarMessage('Invalid test selected.'); setSnackbarSeverity('error'); setSnackbarOpen(true);
      setSelectedCodeIds([]); setSelectedMcqIds([]); setSelectedTest(null);
      localStorage.removeItem('selectedCodeIds'); localStorage.removeItem('selectedMcqIds');
      setDataGridKey(prev => prev + 1);
      return;
    }
    setSelectedTest(test);
    try {
      const testData = await getTestById(test.test_id);
      const mcqIds = mcqs.filter(m => testData.test_mcq_id?.includes(m.mcq_id)).map(m => m._id);
      const codeIds = codes.filter(c => testData.test_coding_id?.includes(c.code_id)).map(c => c.id);
      setSelectedMcqIds(mcqIds); setSelectedCodeIds(codeIds);
      localStorage.setItem('selectedMcqIds', JSON.stringify(mcqIds));
      localStorage.setItem('selectedCodeIds', JSON.stringify(codeIds));
      setDataGridKey(prev => prev + 1);
    } catch {
      setSnackbarMessage('Unable to fetch test details. Please try again.');
      setSnackbarSeverity('error'); setSnackbarOpen(true);
      setSelectedCodeIds([]); setSelectedMcqIds([]); setSelectedTest(null);
      localStorage.removeItem('selectedCodeIds'); localStorage.removeItem('selectedMcqIds');
      setDataGridKey(prev => prev + 1);
    }
  }, [selectedTestIds, tests, mcqs, codes, loading.tests, loading.codes, loading.mcqs]);

  useEffect(() => { fetchTestDetails(); }, [fetchTestDetails]);

  const calculateTotalScore = () => selectedMcqIds.length * 1 + selectedCodeIds.length * 10;

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => { setSnackbarMessage('Copied to clipboard!'); setSnackbarSeverity('success'); setSnackbarOpen(true); })
      .catch(() => { setSnackbarMessage('Failed to copy to clipboard.'); setSnackbarSeverity('error'); setSnackbarOpen(true); });
  };

  const handleViewDetails = (title, items) => {
    setDetailsDialogTitle(title);
    setDetailsDialogContent(Array.isArray(items) ? items : []);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => { setDetailsDialogOpen(false); setDetailsDialogContent([]); };
  const handleOpenPreviewDialog = () => {
    if (selectedTestIds.length !== 1) { setSnackbarMessage('Please select exactly one test to update.'); setSnackbarSeverity('error'); setSnackbarOpen(true); return; }
    setPreviewDialogOpen(true);
  };
  const handleClosePreviewDialog = () => setPreviewDialogOpen(false);

  const handleOpenStatusDialog = (test, newStatus) => {
    if (!test?._id) { setSnackbarMessage('Please select a test to update its status.'); setSnackbarSeverity('error'); setSnackbarOpen(true); return; }
    setSelectedTest(test); setStatusChange(newStatus); setStatusDialogOpen(true);
  };
  const handleCloseStatusDialog = () => { setStatusDialogOpen(false); setStatusChange(null); };

  const handleToggleStatus = async () => {
    if (!selectedTest?.test_id) { setSnackbarMessage('No valid test selected for status update.'); setSnackbarSeverity('error'); setSnackbarOpen(true); handleCloseStatusDialog(); return; }
    try {
      setUpdateLoading(true);
      await updateTest({ test_id: selectedTest.test_id, status: statusChange });
      setSnackbarMessage(`Test status updated to ${statusChange} successfully!`); setSnackbarSeverity('success');
      const refreshResponse = await fetchAllTests();
      const testData = refreshResponse.data?.tests || refreshResponse.data || [];
      if (Array.isArray(testData)) {
        setTests(testData); setFilteredTests(testData);
        const updatedTest = testData.find(t => t.test_id === selectedTest.test_id);
        if (updatedTest) { setSelectedTest(updatedTest); setSelectedTestIds([updatedTest._id]); localStorage.setItem('selectedTestIds', JSON.stringify([updatedTest._id])); }
      } else { setTests([]); setFilteredTests([]); }
      handleCloseStatusDialog();
    } catch { setSnackbarMessage('Unable to update test status. Please try again.'); setSnackbarSeverity('error'); }
    finally { setUpdateLoading(false); setSnackbarOpen(true); }
  };

  const handleNext = () => {
    if (activeStep === 0 && selectedTestIds.length !== 1) { setSnackbarMessage('Please select exactly one test.'); setSnackbarSeverity('error'); setSnackbarOpen(true); return; }
    setActiveStep(prev => prev + 1);
  };
  const handlePrevious = () => setActiveStep(prev => prev - 1);

  const handleUpdateTest = async () => {
    if (!selectedTest?.test_id) { setSnackbarMessage('No valid test selected for update.'); setSnackbarSeverity('error'); setSnackbarOpen(true); return; }
    const newMcqIds = mcqs.filter(m => selectedMcqIds.includes(m._id) && m.mcq_id).map(m => m.mcq_id);
    const newCodeIds = codes.filter(c => selectedCodeIds.includes(c.id) && c.code_id).map(c => c.code_id);
    if (!newMcqIds.length && !newCodeIds.length) { setSnackbarMessage('Please select at least one MCQ or coding problem.'); setSnackbarSeverity('error'); setSnackbarOpen(true); return; }
    const updateData = { test_id: selectedTest.test_id, test_mcq_id: newMcqIds, test_coding_id: newCodeIds, test_total_score: calculateTotalScore() };
    setUpdateLoading(true); setPreviewDialogOpen(false);
    try {
      await updateTest(updateData);
      setSnackbarMessage('Test updated successfully!'); setSnackbarSeverity('success');
      const refreshResponse = await fetchAllTests();
      const testData = refreshResponse.data?.tests || refreshResponse.data || [];
      if (Array.isArray(testData)) { setTests(testData); setFilteredTests(testData); } else { setTests([]); setFilteredTests([]); }
      setSelectedTestIds([]); setSelectedCodeIds([]); setSelectedMcqIds([]); setSelectedTest(null);
      localStorage.removeItem('selectedTestIds'); localStorage.removeItem('selectedCodeIds'); localStorage.removeItem('selectedMcqIds');
      setActiveStep(0); setDataGridKey(prev => prev + 1);
    } catch { setSnackbarMessage('Unable to update test. Please try again.'); setSnackbarSeverity('error'); }
    finally { setUpdateLoading(false); setSnackbarOpen(true); }
  };

  const handleAddMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleAddMenuClose = () => setAnchorEl(null);
  const handleNavigate = (path) => { navigate(path); handleAddMenuClose(); };

  // ── Columns ───────────────────────────────────────────────────────────────
  const testColumns = [
    { field: 'test_name', headerName: 'Test Name', minWidth: 200, flex: 1,
      renderHeader: () => <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ClipboardList size={16} color="white" /><Typography variant="inherit" fontWeight="bold">Test Name</Typography></Box>,
    },
    { field: 'test_language', headerName: 'Language', minWidth: 150, flex: 0.5,
      renderHeader: () => <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Code size={16} color="white" /><Typography variant="inherit" fontWeight="bold">Language</Typography></Box>,
    },
    { field: 'test_total_score', headerName: 'Total Score', minWidth: 120, flex: 0.4,
      renderHeader: () => <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Trophy size={16} color="white" /><Typography variant="inherit" fontWeight="bold">Total Score</Typography></Box>,
    },
    { field: 'test_mcq_id', headerName: 'MCQ IDs', minWidth: 200, flex: 1,
      renderHeader: () => <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HelpCircle size={16} color="white" /><Typography variant="inherit" fontWeight="bold">MCQ IDs</Typography></Box>,
      renderCell: (params) => {
        if (!params.value?.length) return <Typography variant="body2" color="textSecondary">None</Typography>;
        return <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2">{`${params.value.length} MCQs`}</Typography>
          <IconButton size="small" onClick={() => handleViewDetails(`MCQ IDs for ${params.row.test_name}`, params.value)}><List size={16} color="#0c83c8" /></IconButton>
          <IconButton size="small" onClick={() => handleCopyToClipboard(params.value.join('\n'))}><Copy size={16} color="#0c83c8" /></IconButton>
        </Box>;
      },
    },
    { field: 'test_coding_id', headerName: 'Coding IDs', minWidth: 200, flex: 1,
      renderHeader: () => <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Code size={16} color="white" /><Typography variant="inherit" fontWeight="bold">Coding IDs</Typography></Box>,
      renderCell: (params) => {
        if (!params.value?.length) return <Typography variant="body2" color="textSecondary">None</Typography>;
        return <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="body2">{`${params.value.length} Codes`}</Typography>
          <IconButton size="small" onClick={() => handleViewDetails(`Coding IDs for ${params.row.test_name}`, params.value)}><List size={16} color="#0c83c8" /></IconButton>
          <IconButton size="small" onClick={() => handleCopyToClipboard(params.value.join('\n'))}><Copy size={16} color="#0c83c8" /></IconButton>
        </Box>;
      },
    },
    { field: 'status', headerName: 'Status', minWidth: 150, flex: 0.5,
      renderHeader: () => <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ToggleRight size={16} color="white" /><Typography variant="inherit" fontWeight="bold">Status</Typography></Box>,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">{params.value || 'Unknown'}</Typography>
          <Switch
            checked={params.value === 'active'}
            onChange={(e) => { e.stopPropagation(); handleOpenStatusDialog(params.row, params.value === 'active' ? 'disabled' : 'active'); }}
            disabled={updateLoading}
            className="utm-status-switch"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: '#0c83c8' },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: 'linear-gradient(90deg, #0c83c8, #fc7a46)' },
            }}
          />
        </Box>
      ),
    },
  ];

  const codeColumns = [
    { field: 'problem', headerName: 'Problem Statement', minWidth: 300, flex: 1.5,
      renderHeader: () => <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={16} color="white" /><Typography variant="inherit" fontWeight="bold">Problem Statement</Typography></Box>,
    },
    { field: 'testCasesCount', headerName: 'No of Test Cases', minWidth: 200, flex: 1,
      renderHeader: () => <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="white" /><Typography variant="inherit" fontWeight="bold">No of Test Cases</Typography></Box>,
    },
    { field: 'tags', headerName: 'Tags', minWidth: 200, flex: 1,
      renderHeader: () => <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Tag size={16} color="white" /><Typography variant="inherit" fontWeight="bold">Tags</Typography></Box>,
    },
    { field: 'createdAt', headerName: 'Created At', minWidth: 180, flex: 0.8,
      renderHeader: () => <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} color="white" /><Typography variant="inherit" fontWeight="bold">Created At</Typography></Box>,
    },
    { field: 'updatedAt', headerName: 'Updated At', minWidth: 180, flex: 0.8,
      renderHeader: () => <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} color="white" /><Typography variant="inherit" fontWeight="bold">Updated At</Typography></Box>,
    },
  ];

  const mcqColumns = [
    { field: 'mcq_question', headerName: 'Question', minWidth: 300, flex: 1,
      renderHeader: () => <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HelpCircle size={16} color="white" /><Typography variant="inherit" fontWeight="bold">Question</Typography></Box>,
    },
    { field: 'mcq_options', headerName: 'Options', minWidth: 250, flex: 0.8,
      renderHeader: () => <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><List size={16} color="white" /><Typography variant="inherit" fontWeight="bold">Options</Typography></Box>,
      renderCell: (params) => {
        const options = params.row.mcq_options;
        if (Array.isArray(options) && options.length > 0) {
          return <Box sx={{ py: 1 }}>{options.map((o, i) => <Typography key={i} variant="body2" sx={{ display: 'block', lineHeight: 1.3 }}>{String.fromCharCode(65 + i)}. {o}</Typography>)}</Box>;
        }
        return <Typography variant="body2">No options</Typography>;
      },
    },
    { field: 'mcq_answer', headerName: 'Answer', minWidth: 150, flex: 0.5,
      renderHeader: () => <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={16} color="white" /><Typography variant="inherit" fontWeight="bold">Answer</Typography></Box>,
    },
    { field: 'mcq_tag', headerName: 'Tags', minWidth: 200, flex: 0.6,
      renderHeader: () => <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Tag size={16} color="white" /><Typography variant="inherit" fontWeight="bold">Tags</Typography></Box>,
      renderCell: (params) => {
        const tags = params.row.mcq_tag;
        if (Array.isArray(tags) && tags.length > 0) {
          return <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 1 }}>
            {tags.map((tag, i) => <Typography key={i} variant="caption" className="utm-mcq-tag">{tag}</Typography>)}
          </Box>;
        }
        return <Typography variant="body2">No tags</Typography>;
      },
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Admin_Dashboard />
      <Box className="utm-root">
        <Paper className="utm-outer-card">

          {/* Header */}
          <Paper elevation={4} className="utm-header">
            <Box className="utm-header-row">
              <ClipboardList size={24} />
              <Typography variant="h5" className="utm-header-title">Update Test</Typography>
            </Box>
            <Typography variant="subtitle2" className="utm-header-subtitle">
              Manage test configurations
            </Typography>
          </Paper>

          {/* Stepper */}
          <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />} className="utm-stepper">
            {steps.map(label => (
              <Step key={label}>
                <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* ── Step 0: Select Test ── */}
          {activeStep === 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" className="utm-step-title">Select Test</Typography>
              <Box className="utm-toolbar">
                <TextField fullWidth variant="outlined" placeholder="Search tests..." value={testSearchQuery}
                  onChange={e => setTestSearchQuery(e.target.value)} className="utm-search-field"
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search size={20} color="#0c83c8" /></InputAdornment> }}
                />
              </Box>
              <Box className="utm-grid-wrap">
                <DataGrid
                  key={`test-grid-${dataGridKey}`} rows={filteredTests} columns={testColumns}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  pageSizeOptions={[10, 20, 50]} loading={loading.tests} getRowId={r => r._id}
                  checkboxSelection rowSelectionModel={selectedTestIds}
                  onRowSelectionModelChange={sel => {
                    const updated = sel.length > 0 ? [sel[sel.length - 1]] : [];
                    setSelectedTestIds(updated);
                    localStorage.setItem('selectedTestIds', JSON.stringify(updated));
                  }}
                  sx={dataGridSx}
                />
              </Box>
              <Box className="utm-nav-end">
                <Button variant="contained" onClick={handleNext} className="utm-btn-next" disableElevation>Next</Button>
              </Box>
            </Box>
          )}

          {/* ── Step 1: Select MCQs ── */}
          {activeStep === 1 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" className="utm-step-title">Select MCQs</Typography>
              <Box className="utm-toolbar">
                <TextField fullWidth variant="outlined" placeholder="Search MCQs..." value={mcqSearchQuery}
                  onChange={e => setMcqSearchQuery(e.target.value)} className="utm-search-field"
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search size={20} color="#0c83c8" /></InputAdornment> }}
                />
                <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => navigate('/add-mcq')} className="utm-btn-add" disableElevation>Add MCQ</Button>
              </Box>
              <Box className="utm-grid-wrap">
                {loading.mcqs ? (
                  <Box className="utm-grid-center"><CircularProgress sx={{ color: '#0c83c8' }} /></Box>
                ) : filteredMcqs.length === 0 ? (
                  <Typography variant="body1" color="error" sx={{ textAlign: 'center', mt: 2 }}>No MCQs found. Please add some MCQs.</Typography>
                ) : (
                  <DataGrid key={`mcq-grid-${dataGridKey}`} rows={filteredMcqs} columns={mcqColumns}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    pageSizeOptions={[10, 20, 50]} loading={loading.mcqs} getRowId={r => r._id}
                    checkboxSelection rowHeight={80} rowSelectionModel={selectedMcqIds}
                    onRowSelectionModelChange={sel => { setSelectedMcqIds(sel); localStorage.setItem('selectedMcqIds', JSON.stringify(sel)); }}
                    sx={dataGridSx}
                  />
                )}
              </Box>
              <Box className="utm-nav-between">
                <Button variant="outlined" onClick={handlePrevious} className="utm-btn-prev">Previous</Button>
                <Button variant="contained" onClick={handleNext} className="utm-btn-next" disableElevation>Next</Button>
              </Box>
            </Box>
          )}

          {/* ── Step 2: Select Coding Problems ── */}
          {activeStep === 2 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" className="utm-step-title">Select Coding Problems</Typography>
              <Box className="utm-toolbar">
                <TextField fullWidth variant="outlined" placeholder="Search coding problems..." value={codeSearchQuery}
                  onChange={e => setCodeSearchQuery(e.target.value)} className="utm-search-field"
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search size={20} color="#0c83c8" /></InputAdornment> }}
                />
                <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => navigate('/add-coding')} className="utm-btn-add" disableElevation>Add Coding Problem</Button>
              </Box>
              <Box className="utm-grid-wrap">
                {loading.codes ? (
                  <Box className="utm-grid-center"><CircularProgress sx={{ color: '#0c83c8' }} /></Box>
                ) : filteredCodes.length === 0 ? (
                  <Typography variant="body1" color="error" sx={{ textAlign: 'center', mt: 2 }}>No coding problems found. Please add some coding problems.</Typography>
                ) : (
                  <DataGrid key={`code-grid-${dataGridKey}`} rows={filteredCodes} columns={codeColumns}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    pageSizeOptions={[10, 20, 50]} loading={loading.codes} getRowId={r => r.id}
                    checkboxSelection rowSelectionModel={selectedCodeIds}
                    onRowSelectionModelChange={sel => { setSelectedCodeIds(sel); localStorage.setItem('selectedCodeIds', JSON.stringify(sel)); }}
                    sx={dataGridSx}
                  />
                )}
              </Box>
              <Box className="utm-nav-between">
                <Button variant="outlined" onClick={handlePrevious} className="utm-btn-prev">Previous</Button>
                <Button variant="contained" onClick={handleNext} className="utm-btn-next" disableElevation>Next</Button>
              </Box>
            </Box>
          )}

          {/* ── Step 3: Review ── */}
          {activeStep === 3 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" className="utm-step-title">Review and Confirm</Typography>
              <Typography variant="body1" className="utm-review-intro">
                Please review your selections below before confirming the update.
              </Typography>
              <Typography variant="body1" className="utm-review-score">
                Total Score: {calculateTotalScore()} ({selectedMcqIds.length} MCQs x 1 + {selectedCodeIds.length} Coding x 10)
              </Typography>

              {/* Selected Test */}
              <Box className="utm-review-box">
                <Typography variant="subtitle1" className="utm-review-box-title">Selected Test</Typography>
                {selectedTestIds.length === 1 && selectedTest ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" className="utm-review-body"><strong>Name:</strong> {selectedTest.test_name || 'N/A'}</Typography>
                    <Typography variant="body2" className="utm-review-body"><strong>Language:</strong> {selectedTest.test_language || 'N/A'}</Typography>
                    <Typography variant="body2" className="utm-review-body"><strong>Status:</strong> {selectedTest.status || 'Unknown'}</Typography>
                  </Box>
                ) : <Typography variant="body2" color="error" className="utm-review-error">No Test found</Typography>}
              </Box>

              {/* Selected Coding Problems */}
              <Box className="utm-review-box">
                <Typography variant="subtitle1" className="utm-review-box-title">Selected Coding Problems</Typography>
                {selectedCodeIds.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow className="utm-table-header-row">
                          <TableCell className="utm-table-header-cell"><Box className="utm-table-header-cell-row"><FileText size={16} /> Problem Statement</Box></TableCell>
                          <TableCell className="utm-table-header-cell"><Box className="utm-table-header-cell-row"><Check size={16} /> No of Test Cases</Box></TableCell>
                          <TableCell className="utm-table-header-cell"><Box className="utm-table-header-cell-row"><Tag size={16} /> Tags</Box></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {codes.filter(c => selectedCodeIds.includes(c.id)).map(code => (
                          <TableRow key={code.id}>
                            <TableCell className="utm-table-body-cell">{code.problem || 'N/A'}</TableCell>
                            <TableCell className="utm-table-body-cell">{code.testCasesCount || 0}</TableCell>
                            <TableCell className="utm-table-body-cell">{code.tags || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : <Typography variant="body2" color="error" className="utm-review-error">No Coding Problems selected</Typography>}
              </Box>

              {/* Selected MCQs */}
              <Box className="utm-review-box">
                <Typography variant="subtitle1" className="utm-review-box-title">Selected MCQs</Typography>
                {selectedMcqIds.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow className="utm-table-header-row">
                          <TableCell className="utm-table-header-cell"><Box className="utm-table-header-cell-row"><HelpCircle size={16} /> Question</Box></TableCell>
                          <TableCell className="utm-table-header-cell"><Box className="utm-table-header-cell-row"><List size={16} /> Options</Box></TableCell>
                          <TableCell className="utm-table-header-cell"><Box className="utm-table-header-cell-row"><Check size={16} /> Answer</Box></TableCell>
                          <TableCell className="utm-table-header-cell"><Box className="utm-table-header-cell-row"><Tag size={16} /> Tags</Box></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mcqs.filter(m => selectedMcqIds.includes(m._id)).map(mcq => (
                          <TableRow key={mcq._id}>
                            <TableCell className="utm-table-body-cell">{mcq.mcq_question || 'N/A'}</TableCell>
                            <TableCell className="utm-table-body-cell">
                              {Array.isArray(mcq.mcq_options) && mcq.mcq_options.length > 0
                                ? mcq.mcq_options.map((o, i) => <Typography key={i} variant="body2" sx={{ display: 'block', lineHeight: 1.3 }}>{String.fromCharCode(65 + i)}. {o}</Typography>)
                                : 'None'}
                            </TableCell>
                            <TableCell className="utm-table-body-cell">{mcq.mcq_answer || 'N/A'}</TableCell>
                            <TableCell className="utm-table-body-cell">
                              {Array.isArray(mcq.mcq_tag) && mcq.mcq_tag.length > 0 ? mcq.mcq_tag.join(', ') : 'None'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : <Typography variant="body2" color="error" className="utm-review-error">No MCQs selected</Typography>}
              </Box>

              <Box className="utm-nav-start">
                <Button variant="outlined" onClick={handlePrevious} className="utm-btn-prev">Previous</Button>
              </Box>
            </Box>
          )}
        </Paper>

        {/* FAB */}
        <Fab
          onClick={activeStep === 3 ? handleOpenPreviewDialog : handleAddMenuOpen}
          disabled={activeStep === 3 && (updateLoading || selectedTestIds.length !== 1)}
          className="utm-fab"
        >
          {activeStep === 3
            ? (updateLoading ? <CircularProgress size={24} color="inherit" /> : <Save size={24} color="#fff" />)
            : <Plus size={24} color="#fff" />
          }
        </Fab>

        {/* Add Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleAddMenuClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          className="utm-menu"
          PaperProps={{ sx: { boxShadow: '0 4px 8px rgba(0,0,0,0.2)', borderRadius: '8px' } }}
        >
          <MenuItem onClick={() => handleNavigate('/add-test')} className="utm-menu-item"><ClipboardList size={16} color="#0c83c8" /> Add Test</MenuItem>
          <MenuItem onClick={() => handleNavigate('/add-coding')} className="utm-menu-item"><Code size={16} color="#0c83c8" /> Add Coding Problem</MenuItem>
          <MenuItem onClick={() => handleNavigate('/add-mcq')} className="utm-menu-item"><HelpCircle size={16} color="#0c83c8" /> Add MCQ</MenuItem>
        </Menu>

        {/* Confirm Update Dialog */}
        <Dialog open={previewDialogOpen} onClose={handleClosePreviewDialog} maxWidth="sm" fullWidth className="utm-dialog" PaperProps={{ sx: { borderRadius: '12px' } }}>
          <DialogTitle className="utm-dialog-title">Confirm Test Update</DialogTitle>
          <DialogContent dividers className="utm-dialog-content">
            <DialogContentText className="utm-dialog-text">Review the changes below:</DialogContentText>
            {selectedTest && <Typography variant="body2" className="utm-dialog-detail"><strong>Test:</strong> {selectedTest.test_name || 'Unknown'}</Typography>}
            {selectedMcqIds.length > 0 && <Typography variant="body2" className="utm-dialog-detail"><strong>MCQs:</strong> {selectedMcqIds.length} selected</Typography>}
            {selectedCodeIds.length > 0 && <Typography variant="body2" className="utm-dialog-detail"><strong>Coding Problems:</strong> {selectedCodeIds.length} selected</Typography>}
            <Typography variant="body2" className="utm-dialog-score">
              <strong>Total Score:</strong> {calculateTotalScore()} ({selectedMcqIds.length} MCQs x 1 + {selectedCodeIds.length} Coding x 10)
            </Typography>
          </DialogContent>
          <DialogActions className="utm-dialog-actions">
            <Button onClick={handleClosePreviewDialog} className="utm-dialog-btn-cancel">Cancel</Button>
            <Button variant="contained" onClick={handleUpdateTest} disabled={updateLoading}
              startIcon={updateLoading ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
              className="utm-dialog-btn-confirm" disableElevation>Confirm</Button>
          </DialogActions>
        </Dialog>

        {/* Status Change Dialog */}
        <Dialog open={statusDialogOpen} onClose={handleCloseStatusDialog} maxWidth="sm" fullWidth className="utm-dialog" PaperProps={{ sx: { borderRadius: '12px' } }}>
          <DialogTitle className="utm-dialog-title">Confirm Status Change</DialogTitle>
          <DialogContent dividers className="utm-dialog-content">
            <DialogContentText className="utm-dialog-text">
              {statusChange === 'active'
                ? `Are you sure you want to activate this test? It will become available to users. Ensure it has sufficient questions (currently ${selectedMcqIds.length} MCQs, ${selectedCodeIds.length} coding problems).`
                : `Are you sure you want to disable this test? It will no longer be available to users.`}
            </DialogContentText>
            {selectedTest && <Typography variant="body2" className="utm-dialog-detail"><strong>Test:</strong> {selectedTest.test_name || 'Unknown'}</Typography>}
          </DialogContent>
          <DialogActions className="utm-dialog-actions">
            <Button onClick={handleCloseStatusDialog} className="utm-dialog-btn-cancel">Cancel</Button>
            <Button variant="contained" onClick={handleToggleStatus} disabled={updateLoading}
              startIcon={updateLoading ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
              className="utm-dialog-btn-confirm" disableElevation>Confirm</Button>
          </DialogActions>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onClose={handleCloseDetailsDialog} maxWidth="sm" fullWidth className="utm-dialog" PaperProps={{ sx: { borderRadius: '12px' } }}>
          <DialogTitle className="utm-dialog-title">
            <Box className="utm-dialog-title-row">
              {detailsDialogTitle}
              <IconButton onClick={handleCloseDetailsDialog}><X size={20} color="white" /></IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers className="utm-dialog-content">
            <Box className="utm-details-list">
              {detailsDialogContent.length ? detailsDialogContent.map((item, i) => (
                <Box key={`${item}-${i}`} className="utm-details-item">
                  <Typography variant="body2" className="utm-details-item-text">{item}</Typography>
                  <IconButton size="small" onClick={() => handleCopyToClipboard(item)}><Copy size={16} color="#0c83c8" /></IconButton>
                </Box>
              )) : <Typography variant="body2" className="utm-details-item-text">No items to display</Typography>}
            </Box>
          </DialogContent>
          <DialogActions className="utm-dialog-actions">
            <Button onClick={() => handleCopyToClipboard(detailsDialogContent.join('\n'))} startIcon={<Copy size={16} />} className="utm-dialog-btn-copy-all">Copy All</Button>
            <Button variant="contained" onClick={handleCloseDetailsDialog} startIcon={<X size={16} />} className="utm-dialog-btn-close" disableElevation>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} variant="filled"
            className={`utm-snackbar-alert ${snackbarSeverity === 'success' ? 'utm-snackbar-alert--success' : ''}`}>
            {snackbarMessage}
          </Alert>
        </Snackbar>

      </Box>
    </>
  );
};

export default UpdateTestModule;