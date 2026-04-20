import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Slide } from '@mui/material';
import { User, Phone, Briefcase, FileText, Save } from 'lucide-react';
import Admin_Dashboard from '../components/AdminDash';
import { addExpert } from '../axios';
import '../styles/Add_Expert.css';

const Add_Expert = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [expertName, setExpertName] = useState('');
  const [expertMobile, setExpertMobile] = useState('');
  const [expertRole, setExpertRole] = useState('');
  const [expertProfile, setExpertProfile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const validateMobile = (value) => {
    const mobileRegex = /^\d{10}$/;
    if (!value) return 'Mobile number is required';
    if (!mobileRegex.test(value)) return 'Enter a valid 10-digit mobile number';
    return '';
  };

  const validateProfile = (value) => {
    const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/;
    if (!value) return 'Profile URL is required';
    if (!urlRegex.test(value)) return 'Enter a valid URL';
    return '';
  };

  const handleMobileChange = (e) => {
    const value = e.target.value;
    setExpertMobile(value);
    setMobileError(validateMobile(value));
  };

  const handleProfileChange = (e) => {
    const value = e.target.value;
    setExpertProfile(value);
    setProfileError(validateProfile(value));
  };

  const handleSubmit = async () => {
    if (!expertName || !expertMobile || !expertRole || !expertProfile) {
      setSnackbarMessage('Please fill in all required fields.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    if (mobileError || profileError) {
      setSnackbarMessage('Please correct the errors in the form.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const payload = {
      mod_expert_name: expertName,
      mod_expert_mobile: expertMobile,
      mod_expert_role: expertRole,
      mod_expert_profile: expertProfile,
    };

    setLoading(true);

    try {
      await addExpert(payload);
      setSnackbarMessage('Expert added successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleClear();
    } catch (err) {
      setSnackbarMessage(err.response?.data?.error || 'Failed to add expert.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setExpertName('');
    setExpertMobile('');
    setExpertRole('');
    setExpertProfile('');
    setMobileError('');
    setProfileError('');
  };

  const TransitionSlide = (props) => <Slide {...props} direction="down" />;

  return (
    <>
      <Admin_Dashboard />
      <Container
        maxWidth={isMobile ? 'xs' : 'sm'}
        sx={{ py: { xs: 2, sm: 4 }, minHeight: '100vh' }}
      >
        <Paper elevation={5} className="add-expert-paper">

          {/* Header */}
          <Box className="add-expert-header">
            <Box className="add-expert-header-row">
              <User size={isMobile ? 20 : 24} />
              <Typography variant={isMobile ? 'h6' : 'h5'} className="add-expert-title">
                Add Expert
              </Typography>
            </Box>
            <Typography variant="subtitle2" className="add-expert-subtitle">
              Enter expert information
            </Typography>
          </Box>

          {/* Form */}
          <Box className="add-expert-form">
            <TextField
              fullWidth
              label="Expert Name"
              value={expertName}
              onChange={(e) => setExpertName(e.target.value)}
              sx={{ mb: 2 }}
              required
              className="add-expert-textfield"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <User size={20} color="#0c83c8" />
                  </InputAdornment>
                ),
              }}
              error={expertName === '' && snackbarOpen}
              helperText={expertName === '' && snackbarOpen ? 'Name is required' : ''}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Expert Mobile"
              value={expertMobile}
              onChange={handleMobileChange}
              sx={{ mb: 2 }}
              required
              className="add-expert-textfield"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone size={20} color="#0c83c8" />
                  </InputAdornment>
                ),
              }}
              error={!!mobileError}
              helperText={mobileError}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Expert Role"
              value={expertRole}
              onChange={(e) => setExpertRole(e.target.value)}
              sx={{ mb: 2 }}
              required
              className="add-expert-textfield"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Briefcase size={20} color="#0c83c8" />
                  </InputAdornment>
                ),
              }}
              error={expertRole === '' && snackbarOpen}
              helperText={expertRole === '' && snackbarOpen ? 'Role is required' : ''}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Expert Profile URL"
              value={expertProfile}
              onChange={handleProfileChange}
              sx={{ mb: 2 }}
              required
              className="add-expert-textfield"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FileText size={20} color="#0c83c8" />
                  </InputAdornment>
                ),
              }}
              error={!!profileError}
              helperText={profileError}
              variant="outlined"
            />

            {/* Buttons */}
            <Box className="add-expert-actions">
              <Button
                variant="outlined"
                onClick={handleClear}
                disabled={loading}
                className="add-expert-btn-clear"
              >
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                endIcon={loading ? null : <Save size={16} />}
                className="add-expert-btn-submit"
                disableElevation
              >
                {loading
                  ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                  : 'Submit'
                }
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Snackbar */}
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
            className={`add-expert-snackbar-alert ${
              snackbarSeverity === 'success' ? 'add-expert-snackbar-alert--success' : ''
            }`}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

      </Container>
    </>
  );
};

export default Add_Expert;