import React from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Snackbar,
  Alert,
} from '@mui/material';
import { Mail, Phone, CalendarCheck, Building2, MapPin } from 'lucide-react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Admin_Dashboard from '../components/AdminDash';
import { createOrg } from '../axios';
import '../styles/Add_Organisation.css'; // Import the CSS file for styling

const Add_Organisation = () => {
  const [orgName, setOrgName] = React.useState('');
  const [orgAddress, setOrgAddress] = React.useState('');
  const [orgEmail, setOrgEmail] = React.useState('');
  const [orgContact, setOrgContact] = React.useState('');
  const [orgDate, setOrgDate] = React.useState('');
  const [openSuccess, setOpenSuccess] = React.useState(false);
  const [openError, setOpenError] = React.useState(false);

  const handleSubmit = async () => {
    if (!orgName || !orgAddress || !orgEmail || !orgContact || !orgDate) {
      setOpenError(true);
      return;
    }

    const payload = {
      org_name: orgName,
      org_address: orgAddress,
      org_email: orgEmail,
      org_contact: orgContact,
      org_associated_date: orgDate,
    };

    try {
      await createOrg(payload);
      setOpenSuccess(true);
      handleClear();
    } catch (err) {
      console.error('Error creating organization:', err);
      setOpenError(true);
    }
  };

  const handleClear = () => {
    setOrgName('');
    setOrgAddress('');
    setOrgEmail('');
    setOrgContact('');
    setOrgDate('');
  };

  const handleCloseSnackbar = () => {
    setOpenSuccess(false);
    setOpenError(false);
  };

  return (
    <>
      <Admin_Dashboard />
      <Container maxWidth="sm" sx={{ py: 5 }}>
        <Paper elevation={8} sx={{ borderRadius: 4, overflow: 'hidden' }}>

          {/* Header */}
          <Box className="org-form-header">
            <Typography className="org-form-header-title" variant="h5">
              Add Organisation
            </Typography>
            <Typography className="org-form-header-subtitle" variant="subtitle2">
              Fill the details of the organisation
            </Typography>
          </Box>

          {/* Form Fields */}
          <Box className="org-form-body">

            <Box className="org-form-field-row">
              <Building2 size={20} color="#0c83c8" className="org-form-field-icon" />
              <TextField
                fullWidth
                label="Organization Name"
                variant="outlined"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </Box>

            <Box className="org-form-field-row">
              <MapPin size={20} color="#0c83c8" className="org-form-field-icon" />
              <TextField
                fullWidth
                label="Organization Address"
                variant="outlined"
                value={orgAddress}
                onChange={(e) => setOrgAddress(e.target.value)}
              />
            </Box>

            <Box className="org-form-field-row">
              <Mail size={20} color="#0c83c8" className="org-form-field-icon" />
              <TextField
                fullWidth
                label="Organization Email"
                variant="outlined"
                value={orgEmail}
                onChange={(e) => setOrgEmail(e.target.value)}
              />
            </Box>

            <Box className="org-form-field-row">
              <Phone size={20} color="#0c83c8" className="org-form-field-icon" />
              <TextField
                fullWidth
                label="Contact Number"
                variant="outlined"
                value={orgContact}
                onChange={(e) => setOrgContact(e.target.value)}
              />
            </Box>

            <Box className="org-form-field-row">
              <CalendarCheck size={20} color="#0c83c8" className="org-form-field-icon" />
              <TextField
                fullWidth
                label="Associated Date"
                type="date"
                variant="outlined"
                value={orgDate}
                onChange={(e) => setOrgDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* Buttons */}
            <Box className="org-form-actions">
              <Button
                variant="outlined"
                onClick={handleClear}
                className="org-btn-clear"
              >
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                className="org-btn-submit"
                disableElevation
              >
                Submit
              </Button>
            </Box>

          </Box>
        </Paper>

        {/* Success Snackbar */}
        <Snackbar
          open={openSuccess}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            severity="success"
            icon={<CheckCircleOutlineIcon />}
            onClose={handleCloseSnackbar}
            sx={{ width: '100%' }}
          >
            Organization successfully created!
          </Alert>
        </Snackbar>

        {/* Error Snackbar */}
        <Snackbar
          open={openError}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            severity="error"
            icon={<ErrorOutlineIcon />}
            onClose={handleCloseSnackbar}
            sx={{ width: '100%' }}
          >
            Please fill all required fields!
          </Alert>
        </Snackbar>

      </Container>
    </>
  );
};

export default Add_Organisation;