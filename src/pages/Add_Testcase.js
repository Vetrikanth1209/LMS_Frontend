import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Grid,
} from '@mui/material';
import { Slide } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Terminal, Tag, CheckCircle, AlertCircle, Upload, Plus } from 'lucide-react';
import Admin_Dashboard from '../components/AdminDash';
import Papa from 'papaparse';
import { createTestCase } from '../axios';
import '../styles/Add_Testcase.css'; // Import the CSS file for styling

const AddTestcase = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [tags, setTags] = useState('');
  const [inputError, setInputError] = useState('');
  const [outputError, setOutputError] = useState('');
  const [tagsError, setTagsError] = useState('');
  const [loading, setLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [csvData, setCsvData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  const validateInput = (value) => (!value.trim() ? 'Input is required' : '');
  const validateOutput = (value) => (!value.trim() ? 'Output is required' : '');
  const validateTags = (value) => {
    const tagArray = value.split(',').map((t) => t.trim()).filter((t) => t);
    if (tagArray.length === 0 && value.trim()) return 'Enter valid tags separated by commas';
    return '';
  };

  const handleInputChange = (e) => { setInput(e.target.value); setInputError(validateInput(e.target.value)); };
  const handleOutputChange = (e) => { setOutput(e.target.value); setOutputError(validateOutput(e.target.value)); };
  const handleTagsChange = (e) => { setTags(e.target.value); setTagsError(validateTags(e.target.value)); };

  const handleSubmit = async () => {
    const iError = validateInput(input);
    const oError = validateOutput(output);
    const tError = validateTags(tags);
    setInputError(iError);
    setOutputError(oError);
    setTagsError(tError);

    if (iError || oError || tError) {
      setSnackbarMessage('Please correct the errors in the form.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const payload = {
      testcase_input: [input.trim()],
      testcase_output: [output.trim()],
      testcase_tags: tags.split(',').map((t) => t.trim()).filter((t) => t),
    };

    setLoading(true);
    try {
      await createTestCase(payload);
      setSnackbarMessage('Test case successfully submitted!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleClear();
    } catch (err) {
      setSnackbarMessage(err.response?.data?.error || 'Failed to submit test case.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput(''); setOutput(''); setTags('');
    setInputError(''); setOutputError(''); setTagsError('');
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvLoading(true);
    const expectedHeaders = ['input', 'output', 'tags'];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (result) => {
        const headers = Object.keys(result.data[0] || {}).map((h) => h.trim().toLowerCase());
        const isValid = expectedHeaders.every((h) => headers.includes(h));
        if (!isValid) {
          setSnackbarMessage(`Invalid CSV format. Expected headers: ${expectedHeaders.join(', ')}`);
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          setCsvLoading(false);
          return;
        }
        const formattedData = result.data.map((row, index) => ({
          id: index,
          testcase_input: row.input || '',
          testcase_output: row.output || '',
          testcase_tags: row.tags
            ? String(row.tags).split(',').map((t) => t.trim()).filter((t) => t)
            : [],
        }));
        setCsvData(formattedData);
        setSelectedRows([]);
        setSnackbarMessage('CSV loaded successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setCsvLoading(false);
      },
      error: () => {
        setSnackbarMessage('Failed to parse CSV file');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setCsvLoading(false);
      },
    });
  };

  const handleBulkCreate = async (selectedOnly = false) => {
    if (csvData.length === 0) {
      setSnackbarMessage('No CSV data to process');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setLoading(true);
    try {
      const testCasesToCreate = selectedOnly
        ? csvData.filter((row) => selectedRows.includes(row.id))
        : csvData;

      if (testCasesToCreate.length === 0) {
        setSnackbarMessage('No test cases selected');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
        return;
      }

      const payload = testCasesToCreate.map((tc) => ({
        testcase_input: [tc.testcase_input.trim()],
        testcase_output: [tc.testcase_output.trim()],
        testcase_tags: tc.testcase_tags,
      }));

      const response = await createTestCase(payload);
      setSnackbarMessage(response.message || `${testCasesToCreate.length} test case(s) added successfully`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setCsvData([]);
      setSelectedRows([]);
    } catch (error) {
      setSnackbarMessage(error.response?.data?.error || 'Failed to create test cases: Server error');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: 'testcase_input',
      headerName: 'Input',
      width: isMobile ? 150 : 250,
      renderHeader: () => (
        <Box className="col-header">
          <Terminal size={16} color="#0c83c8" />
          <Typography variant="inherit" className="col-header-text">Input</Typography>
        </Box>
      ),
    },
    {
      field: 'testcase_output',
      headerName: 'Output',
      width: isMobile ? 150 : 250,
      renderHeader: () => (
        <Box className="col-header">
          <Terminal size={16} color="#0c83c8" />
          <Typography variant="inherit" className="col-header-text">Output</Typography>
        </Box>
      ),
    },
    {
      field: 'testcase_tags',
      headerName: 'Tags',
      width: isMobile ? 150 : 250,
      renderCell: (params) => params.value.join(', '),
      renderHeader: () => (
        <Box className="col-header">
          <Tag size={16} color="#0c83c8" />
          <Typography variant="inherit" className="col-header-text">Tags</Typography>
        </Box>
      ),
    },
  ];

  const TransitionSlide = (props) => <Slide {...props} direction="down" />;

  return (
    <>
      <Admin_Dashboard />
      <Container maxWidth={isMobile ? 'sm' : 'lg'} className="page-container">

        {/* Single Test Case Form */}
        <Paper elevation={5} className="form-paper">
          <Box className="header-banner">
            <Box className="header-title-row">
              <Terminal size={isMobile ? 20 : 24} />
              <Typography variant={isMobile ? 'h6' : 'h5'} className="header-title">
                Create Test Case
              </Typography>
            </Box>
            <Typography variant="subtitle2" className="header-subtitle">
              Design a new test case for your coding assessment
            </Typography>
          </Box>

          <Box className="form-body">
            <Box className="field-group">
              <Typography variant="subtitle1" className="field-label">Testcase Input</Typography>
              <TextField
                fullWidth multiline rows={4}
                placeholder="Enter input (e.g., radar)"
                value={input} onChange={handleInputChange}
                error={!!inputError} helperText={inputError}
                InputProps={{ startAdornment: <InputAdornment position="start"><Terminal size={20} color="#0c83c8" /></InputAdornment> }}
                className="styled-textfield"
              />
            </Box>

            <Box className="field-group">
              <Typography variant="subtitle1" className="field-label">Testcase Output</Typography>
              <TextField
                fullWidth multiline rows={4}
                placeholder="Enter output (e.g., 1)"
                value={output} onChange={handleOutputChange}
                error={!!outputError} helperText={outputError}
                InputProps={{ startAdornment: <InputAdornment position="start"><Terminal size={20} color="#0c83c8" /></InputAdornment> }}
                className="styled-textfield"
              />
            </Box>

            <Box className="field-group">
              <Typography variant="subtitle1" className="field-label">Tags</Typography>
              <TextField
                fullWidth
                placeholder="Enter tags separated by commas (e.g., C, palindrome, string)"
                value={tags} onChange={handleTagsChange}
                error={!!tagsError} helperText={tagsError}
                InputProps={{ startAdornment: <InputAdornment position="start"><Tag size={20} color="#0c83c8" /></InputAdornment> }}
                className="styled-textfield"
              />
            </Box>

            <Box className="form-actions">
              <Button variant="outlined" size="large" onClick={handleClear} disabled={loading} className="btn-clear">
                Clear Form
              </Button>
              <Button variant="contained" size="large" onClick={handleSubmit} disabled={loading} endIcon={loading ? null : <CheckCircle size={16} />} className="btn-submit">
                {loading ? <CircularProgress size={16} color="inherit" className="btn-spinner" /> : 'Submit Test Case'}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* CSV Bulk Upload */}
        <Paper elevation={5} className="csv-paper">
          <Typography variant={isMobile ? 'h6' : 'h5'} align="center" className="csv-title gradient-text">
            Bulk Add Test Cases via CSV
          </Typography>

          <Grid container spacing={2} className="csv-upload-row">
            <Grid item xs={12}>
              <input type="file" accept=".csv" onChange={handleCsvUpload} disabled={csvLoading} style={{ display: 'none' }} id="csv-upload" />
              <label htmlFor="csv-upload">
                <Button
                  variant="outlined" component="span" disabled={csvLoading}
                  startIcon={csvLoading ? <CircularProgress size={16} /> : <Upload size={16} />}
                  className="btn-upload"
                >
                  {csvLoading ? 'Uploading...' : 'Upload CSV'}
                </Button>
              </label>
              <Typography variant="body2" color="text.secondary" className="csv-hint">
                Upload a CSV with headers: input, output, tags (tags separated by commas)
              </Typography>
            </Grid>
          </Grid>

          {csvData.length > 0 && (
            <>
              <Box className="datagrid-wrapper">
                <DataGrid
                  rows={csvData}
                  columns={columns}
                  pageSizeOptions={[5, 10, 20]}
                  checkboxSelection
                  onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
                  rowSelectionModel={selectedRows}
                  loading={csvLoading}
                  className="csv-datagrid"
                />
              </Box>
              <Grid container spacing={2} justifyContent="center">
                <Grid item>
                  <Button
                    variant="contained"
                    onClick={() => handleBulkCreate(false)}
                    disabled={loading || csvData.length === 0}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Plus size={16} />}
                    className="btn-submit"
                  >
                    {loading ? 'Creating...' : 'Create All'}
                  </Button>
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    onClick={() => handleBulkCreate(true)}
                    disabled={loading || selectedRows.length === 0}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Plus size={16} />}
                    className="btn-create-selected"
                  >
                    {loading ? 'Creating...' : `Create Selected (${selectedRows.length})`}
                  </Button>
                </Grid>
              </Grid>
            </>
          )}
        </Paper>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          TransitionComponent={TransitionSlide}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            variant="filled"
            icon={snackbarSeverity === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            className={`alert ${snackbarSeverity === 'success' ? 'alert--success' : ''}`}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

      </Container>
    </>
  );
};

export default AddTestcase;