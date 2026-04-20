import React, { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Snackbar,
  Alert,
  InputAdornment,
} from '@mui/material';
import dayjs from 'dayjs';
import Admin_Dashboard from '../components/AdminDash';
import { addModule } from '../axios';
import { Book, Code, Calendar, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import '../styles/Add_Module.css'; // Import the CSS file for styling

const Add_Module = () => {
  const [modName, setModName] = useState('');
  const [modTech, setModTech] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const validate = () => {
    const newErrors = {};
    if (!modName.trim()) newErrors.modName = 'Module Name is required';
    if (!modTech.trim()) newErrors.modTech = 'Technologies are required';
    if (!startDate) newErrors.startDate = 'Start Date is required';
    if (!endDate) newErrors.endDate = 'End Date is required';
    else if (dayjs(endDate).isBefore(dayjs(startDate))) {
      newErrors.endDate = 'End Date must be after Start Date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setSnackbarMessage('Please correct the errors in the form');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const formattedStartDate = dayjs(startDate).format('DD/MM/YYYY');
    const formattedEndDate = dayjs(endDate).format('DD/MM/YYYY');
    const mod_duration = `${formattedStartDate} - ${formattedEndDate}`;

    const payload = {
      mod_name: modName.trim(),
      mod_tech: modTech.trim(),
      mod_duration,
    };

    try {
      await addModule(payload);
      setSnackbarMessage('Module successfully created!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleClear();
    } catch (error) {
      console.error('Error adding module:', error);
      setSnackbarMessage(`Error adding module: ${error.response?.data?.error || error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleClear = () => {
    setModName('');
    setModTech('');
    setStartDate('');
    setEndDate('');
    setErrors({});
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Admin_Dashboard />

      <Box className="add-module-root">
        <Paper className="add-module-paper">

          {/* Header */}
          <Box className="add-module-header">
            <Typography variant="h5" className="add-module-title">
              Create New Module
            </Typography>
            <Typography variant="subtitle2" className="add-module-subtitle">
              Add a new module with duration and technology
            </Typography>
          </Box>

          {/* Form */}
          <Box className="add-module-form">

            <TextField
              label="Module Name"
              fullWidth
              value={modName}
              onChange={(e) => setModName(e.target.value)}
              className="add-module-textfield"
              error={!!errors.modName}
              helperText={errors.modName}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Book size={20} color="#0c83c8" />
                  </InputAdornment>
                ),
              }}
              aria-label="Module Name"
            />

            <TextField
              label="Module Technologies"
              fullWidth
              value={modTech}
              onChange={(e) => setModTech(e.target.value)}
              placeholder="e.g., MERN, React, Node.js"
              className="add-module-textfield"
              error={!!errors.modTech}
              helperText={errors.modTech}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Code size={20} color="#0c83c8" />
                  </InputAdornment>
                ),
              }}
              aria-label="Module Technologies"
            />

            <Box className="add-module-date-row">
              <TextField
                label="From Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                className={`add-module-textfield add-module-date-field`}
                error={!!errors.startDate}
                helperText={errors.startDate}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Calendar size={20} color="#0c83c8" />
                    </InputAdornment>
                  ),
                }}
                aria-label="Start Date"
              />
              <TextField
                label="To Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Calendar size={20} color="#0c83c8" />
                    </InputAdornment>
                  ),
                  inputProps: { min: startDate },
                }}
                className={`add-module-textfield add-module-date-field`}
                error={!!errors.endDate}
                helperText={errors.endDate}
                aria-label="End Date"
              />
            </Box>

            {/* Buttons */}
            <Box className="add-module-actions">
              <Button
                variant="outlined"
                onClick={handleClear}
                className="add-module-btn-clear"
                aria-label="Clear Form"
              >
                <X size={20} />
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                className="add-module-btn-submit"
                aria-label="Submit Module"
              >
                <Save size={20} />
                Submit
              </Button>
            </Box>

          </Box>
        </Paper>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            severity={snackbarSeverity}
            icon={snackbarSeverity === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
            onClose={handleCloseSnackbar}
            className={
              snackbarSeverity === 'success'
                ? 'snackbar-alert-success'
                : 'snackbar-alert-error'
            }
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

      </Box>
    </>
  );
};

export default Add_Module;