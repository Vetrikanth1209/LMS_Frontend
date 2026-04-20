import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  Radio,
  RadioGroup,
  FormControlLabel,
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
import {
  Edit,
  Tag,
  CheckCircle,
  AlertCircle,
  Upload,
  Plus,
  Save,
} from 'lucide-react';
import Admin_Dashboard from '../components/AdminDash';
import Papa from 'papaparse';
import { addMcq } from '../axios';

// ─── Styles ───────────────────────────────────────────────────────────────────
import '../styles/Add_Mcq.css'; // Import the CSS file for styling

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_OPTIONS = ['', '', '', ''];
const INITIAL_OPTIONS_ERRORS = ['', '', '', ''];
const EXPECTED_CSV_HEADERS = [
  'question', 'option 1', 'option 2', 'option 3', 'option 4', 'answer', 'mcq tags',
];

// ─── Shared sx (kept as JS — used in MUI sx prop) ─────────────────────────────

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    '& fieldset': { borderColor: '#0c83c8' },
    '&:hover fieldset': { borderColor: '#fc7a46' },
    '&.Mui-focused fieldset': { borderColor: '#0c83c8' },
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const TransitionSlide = (props) => <Slide {...props} direction="down" />;

// ─── Component ────────────────────────────────────────────────────────────────

const Add_Mcq = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ── State ──────────────────────────────────────────────────────────────────

  const [question, setQuestion] = useState('');
  const [tags, setTags] = useState('');
  const [options, setOptions] = useState([...INITIAL_OPTIONS]);
  const [selectedValue, setSelectedValue] = useState('');

  const [questionError, setQuestionError] = useState('');
  const [optionsError, setOptionsError] = useState([...INITIAL_OPTIONS_ERRORS]);
  const [answerError, setAnswerError] = useState('');

  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // ── Helpers ────────────────────────────────────────────────────────────────

  const showSnackbar = (message, severity = 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const validateQuestion = (value) => (!value.trim() ? 'Question is required' : '');
  const validateOption = (value) => (!value.trim() ? 'Option is required' : '');

  const validateForm = () => {
    const qError = validateQuestion(question);
    const optErrors = options.map((opt) => validateOption(opt));
    const ansError = selectedValue ? '' : 'Please select the correct answer';
    setQuestionError(qError);
    setOptionsError(optErrors);
    setAnswerError(ansError);
    return !qError && !optErrors.some(Boolean) && !ansError;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleQuestionChange = (e) => {
    const value = e.target.value;
    setQuestion(value);
    setQuestionError(validateQuestion(value));
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);

    const updatedErrors = [...optionsError];
    updatedErrors[index] = validateOption(value);
    setOptionsError(updatedErrors);

    if (selectedValue === options[index]) setSelectedValue(value);
  };

  const handleAnswerChange = (e) => {
    const value = e.target.value;
    setSelectedValue(value);
    setAnswerError(value ? '' : 'Please select the correct answer');
  };

  const handleClear = () => {
    setQuestion('');
    setTags('');
    setOptions([...INITIAL_OPTIONS]);
    setSelectedValue('');
    setQuestionError('');
    setOptionsError([...INITIAL_OPTIONS_ERRORS]);
    setAnswerError('');
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showSnackbar('Please fill all required fields and select the correct answer.');
      return;
    }
    if (options.filter((opt) => opt.trim()).length < 2) {
      showSnackbar('Please provide at least two non-empty options.');
      return;
    }

    const payload = {
      mcq_question: question.trim(),
      mcq_options: options.map((opt) => opt.trim()).filter(Boolean),
      mcq_answer: selectedValue.trim(),
      mcq_tag: tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    setLoading(true);
    try {
      const response = await addMcq(payload);
      showSnackbar(response.data.message || 'Question successfully submitted!', 'success');
      handleClear();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Failed to submit MCQ.');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (result) => {
        const headers = Object.keys(result.data[0] || {}).map((h) => h.trim().toLowerCase());
        const isValid = EXPECTED_CSV_HEADERS.every((h) => headers.includes(h));

        if (!isValid) {
          showSnackbar(`Invalid CSV format. Expected headers: ${EXPECTED_CSV_HEADERS.join(', ')}`);
          setCsvLoading(false);
          return;
        }

        const formattedData = result.data.map((row, index) => {
          const opts = [
            row['option 1'] || '',
            row['option 2'] || '',
            row['option 3'] || '',
            row['option 4'] || '',
          ].filter((opt) => opt.trim());
          return {
            id: index,
            mcq_question: row.question || '',
            option1: row['option 1'] || '',
            option2: row['option 2'] || '',
            option3: row['option 3'] || '',
            option4: row['option 4'] || '',
            mcq_options: opts,
            mcq_answer: row.answer || '',
            mcq_tag: row['mcq tags']
              ? row['mcq tags'].split(',').map((t) => t.trim()).filter(Boolean)
              : [],
          };
        });

        setCsvData(formattedData);
        setSelectedRows([]);
        showSnackbar('CSV loaded successfully!', 'success');
        setCsvLoading(false);
      },
      error: () => {
        showSnackbar('Failed to parse CSV file');
        setCsvLoading(false);
      },
    });
  };

  const handleBulkCreate = async (selectedOnly = false) => {
    if (csvData.length === 0) {
      showSnackbar('No CSV data to process');
      return;
    }

    const mcqsToCreate = selectedOnly
      ? csvData.filter((row) => selectedRows.includes(row.id))
      : csvData;

    if (mcqsToCreate.length === 0) {
      showSnackbar('No MCQs selected');
      return;
    }

    setLoading(true);
    try {
      const payload = mcqsToCreate.map((mcq) => ({
        mcq_question: mcq.mcq_question,
        mcq_options: mcq.mcq_options,
        mcq_answer: mcq.mcq_answer,
        mcq_tag: mcq.mcq_tag,
      }));

      const response = await addMcq(payload);
      showSnackbar(
        response.data.message || `${mcqsToCreate.length} MCQ(s) added successfully`,
        'success'
      );
      setCsvData([]);
      setSelectedRows([]);
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Failed to create MCQs: Server error');
    } finally {
      setLoading(false);
    }
  };

  // ── Column Definitions ─────────────────────────────────────────────────────

  const renderColHeader = (IconComponent, label) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {IconComponent && <IconComponent size={16} color="#0c83c8" />}
      <Typography variant="inherit" fontWeight="bold" color="#0c83c8">
        {label}
      </Typography>
    </Box>
  );

  const columns = [
    {
      field: 'mcq_question',
      headerName: 'Question',
      width: isMobile ? 150 : 250,
      renderHeader: () => renderColHeader(Edit, 'Question'),
    },
    {
      field: 'option1',
      headerName: 'Option 1',
      width: isMobile ? 100 : 150,
      renderHeader: () => renderColHeader(null, 'Option 1'),
    },
    {
      field: 'option2',
      headerName: 'Option 2',
      width: isMobile ? 100 : 150,
      renderHeader: () => renderColHeader(null, 'Option 2'),
    },
    {
      field: 'option3',
      headerName: 'Option 3',
      width: isMobile ? 100 : 150,
      renderHeader: () => renderColHeader(null, 'Option 3'),
    },
    {
      field: 'option4',
      headerName: 'Option 4',
      width: isMobile ? 100 : 150,
      renderHeader: () => renderColHeader(null, 'Option 4'),
    },
    {
      field: 'mcq_answer',
      headerName: 'Answer',
      width: isMobile ? 100 : 150,
      renderHeader: () => renderColHeader(CheckCircle, 'Answer'),
    },
    {
      field: 'mcq_tag',
      headerName: 'Tags',
      width: isMobile ? 100 : 150,
      renderCell: (params) => params.value.join(', '),
      renderHeader: () => renderColHeader(Tag, 'Tags'),
    },
  ];

  // ── DataGrid sx (kept as JS — depends on isMobile runtime value) ──────────

  const dataGridSx = {
    borderRadius: '8px',
    '& .MuiDataGrid-columnHeaders': {
      background: 'linear-gradient(90deg, #0c83c8, #fc7a46)',
      color: 'white',
      fontWeight: 'bold',
      fontSize: isMobile ? '0.75rem' : '0.875rem',
    },
    '& .MuiDataGrid-row': {
      '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },
      '&:hover': { backgroundColor: '#e3f2fd' },
    },
    '& .MuiDataGrid-cell': {
      fontSize: isMobile ? '0.7rem' : '0.8rem',
    },
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Admin_Dashboard />

      <Container
        maxWidth={isMobile ? 'sm' : 'lg'}
        className="mcq-container"
      >
        {/* ── Single MCQ Form ── */}
        <Paper elevation={5} className="mcq-form-paper">

          {/* Gradient Header */}
          <Box className="mcq-header">
            <Box className="mcq-header-icon-row">
              <Edit size={isMobile ? 20 : 24} />
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                className="mcq-header-title"
              >
                Create Multiple Choice Question
              </Typography>
            </Box>
            <Typography variant="subtitle2" className="mcq-header-subtitle">
              Design a new question for your quiz or assessment
            </Typography>
          </Box>

          {/* Form Body */}
          <Box className="mcq-form-body">

            {/* Question */}
            <Box className="mcq-field-block">
              <Typography variant="subtitle1" className="mcq-field-label">
                Question Text
              </Typography>
              <TextField
                multiline
                rows={4}
                fullWidth
                placeholder="Enter your question here..."
                value={question}
                onChange={handleQuestionChange}
                error={!!questionError}
                helperText={questionError}
                className="mcq-text-field"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Edit size={20} color="#0c83c8" />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Box>

            {/* Tags */}
            <Box className="mcq-field-block">
              <Typography variant="subtitle1" className="mcq-field-label">
                Tags
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter tags separated by commas (e.g., math, algebra, equations)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="mcq-text-field"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Tag size={20} color="#0c83c8" />
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />
            </Box>

            {/* Options */}
            <FormControl fullWidth className="mcq-field-block">
              <Typography variant="subtitle1" className="mcq-options-label">
                Answer Options
              </Typography>
              <RadioGroup
                name="mcq-options"
                value={selectedValue}
                onChange={handleAnswerChange}
                className={answerError ? 'mcq-radio-group-error' : ''}
              >
                {options.map((opt, index) => (
                  <Box key={index} className="mcq-option-row">
                    <FormControlLabel
                      value={opt}
                      control={<Radio className="mcq-radio" sx={{ color: '#0c83c8', '&.Mui-checked': { color: '#0c83c8' } }} />}
                      label=""
                    />
                    <TextField
                      fullWidth
                      placeholder={`Option ${index + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      variant="outlined"
                      size="small"
                      error={!!optionsError[index]}
                      helperText={optionsError[index]}
                      className="mcq-option-field"
                      sx={textFieldSx}
                    />
                    <Box className="mcq-option-badge">
                      {String.fromCharCode(65 + index)}
                    </Box>
                  </Box>
                ))}
              </RadioGroup>
              {answerError && (
                <Typography className="mcq-answer-error">{answerError}</Typography>
              )}
            </FormControl>

            {/* Correct Answer Preview */}
            <Box className="mcq-answer-preview">
              <Typography variant="subtitle1" className="mcq-answer-preview-label">
                Correct Answer:
              </Typography>
              <Box className="mcq-answer-preview-value">
                {selectedValue || 'No answer selected'}
              </Box>
            </Box>

            {/* Form Actions */}
            <Box className="mcq-form-actions">
              <Button
                variant="outlined"
                size="large"
                onClick={handleClear}
                disabled={loading}
                className="mcq-btn-clear"
              >
                Clear Form
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={loading}
                endIcon={loading ? null : <Save size={16} />}
                className="mcq-btn-submit"
              >
                {loading ? (
                  <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                ) : (
                  'Submit Question'
                )}
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* ── CSV Upload & Bulk Creation ── */}
        <Paper elevation={5} className="mcq-csv-paper">
          <Typography
            variant={isMobile ? 'h6' : 'h5'}
            className="mcq-csv-title"
          >
            Bulk Add MCQs via CSV
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                disabled={csvLoading}
                style={{ display: 'none' }}
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button
                  variant="outlined"
                  component="span"
                  disabled={csvLoading}
                  startIcon={
                    csvLoading ? <CircularProgress size={16} /> : <Upload size={16} />
                  }
                  className="mcq-btn-upload"
                >
                  {csvLoading ? 'Uploading...' : 'Upload CSV'}
                </Button>
              </label>
              <Typography
                variant="body2"
                color="text.secondary"
                className="mcq-csv-help-text"
              >
                Upload a CSV with headers: question, option 1, option 2, option 3, option 4,
                answer, mcq tags (tags separated by commas)
              </Typography>
            </Grid>
          </Grid>

          {csvData.length > 0 && (
            <>
              <Box className="mcq-datagrid-container">
                <DataGrid
                  rows={csvData}
                  columns={columns}
                  pageSizeOptions={[5, 10, 20]}
                  checkboxSelection
                  onRowSelectionModelChange={(newSelection) => setSelectedRows(newSelection)}
                  rowSelectionModel={selectedRows}
                  loading={csvLoading}
                  sx={dataGridSx}
                />
              </Box>

              <Box className="mcq-bulk-actions">
                <Button
                  variant="contained"
                  onClick={() => handleBulkCreate(false)}
                  disabled={loading || csvData.length === 0}
                  startIcon={
                    loading ? <CircularProgress size={16} color="inherit" /> : <Plus size={16} />
                  }
                  className="mcq-btn-create-all"
                >
                  {loading ? 'Creating...' : 'Create All'}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleBulkCreate(true)}
                  disabled={loading || selectedRows.length === 0}
                  startIcon={
                    loading ? <CircularProgress size={16} color="inherit" /> : <Plus size={16} />
                  }
                  className="mcq-btn-create-selected"
                >
                  {loading ? 'Creating...' : `Create Selected (${selectedRows.length})`}
                </Button>
              </Box>
            </>
          )}
        </Paper>

        {/* ── Snackbar ── */}
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
            icon={
              snackbarSeverity === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )
            }
            className={`mcq-alert${snackbarSeverity === 'success' ? ' mcq-alert-success' : ''}`}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
};

export default Add_Mcq;