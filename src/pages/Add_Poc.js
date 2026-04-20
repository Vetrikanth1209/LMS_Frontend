import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { User, Mail, Phone, BadgeCheck, ShieldCheck } from "lucide-react";
import Admin_Dashboard from "../components/AdminDash";
import { addPOC } from "../axios";
import "../styles/Add_Poc.css"; // Import the CSS file for styling

const Add_POC = () => {
  const [pocName, setPocName] = useState("");
  const [pocRole, setPocRole] = useState("");
  const [pocEmail, setPocEmail] = useState("");
  const [pocMobile, setPocMobile] = useState("");
  const [certId, setCertId] = useState("");
  const [certStatus, setCertStatus] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Please fill all fields correctly.");

  const handleSubmit = async () => {
    if (!pocName || !pocRole || !pocEmail || !pocMobile) {
      setErrorMessage("Please fill all required fields.");
      setOpenError(true);
      return;
    }

    const payload = {
      mod_poc_name: pocName,
      mod_poc_role: pocRole,
      mod_poc_email: pocEmail,
      mod_poc_mobile: pocMobile,
      mod_images: [],
      mod_tests: [],
      mod_users: [],
      attendance: [],
      poc_certificate: certId
        ? { cert_id: certId, cert_status: certStatus }
        : null,
      certificates: {},
    };

    try {
      const data = await addPOC(payload);
      console.log("POC added:", data);
      setOpenSuccess(true);
      handleClear();
    } catch (err) {
      console.error("Error adding POC:", err.message || err);
      setErrorMessage(err.message || "Failed to add POC. Please try again.");
      setOpenError(true);
    }
  };

  const handleClear = () => {
    setPocName("");
    setPocRole("");
    setPocEmail("");
    setPocMobile("");
    setCertId("");
    setCertStatus(false);
  };

  return (
    <>
      <Admin_Dashboard />
      <Container maxWidth="sm" sx={{ py: 5 }}>
        <Paper elevation={8} sx={{ borderRadius: 4, overflow: "hidden" }}>

          {/* Header */}
          <Box className="poc-form-header">
            <Typography variant="h4" className="poc-form-title">
              Add POC
            </Typography>
            <Typography variant="subtitle2" className="poc-form-subtitle">
              Fill the details of your Point of Contact
            </Typography>
          </Box>

          {/* Form */}
          <Box className="poc-form-body">

            <Box className="poc-form-field-row">
              <User size={20} color="#0c83c8" className="poc-form-field-icon" />
              <TextField
                fullWidth
                label="POC Name"
                variant="outlined"
                value={pocName}
                onChange={(e) => setPocName(e.target.value)}
                required
              />
            </Box>

            <Box className="poc-form-field-row">
              <BadgeCheck size={20} color="#0c83c8" className="poc-form-field-icon" />
              <TextField
                fullWidth
                label="POC Role"
                variant="outlined"
                value={pocRole}
                onChange={(e) => setPocRole(e.target.value)}
                required
              />
            </Box>

            <Box className="poc-form-field-row">
              <Mail size={20} color="#0c83c8" className="poc-form-field-icon" />
              <TextField
                fullWidth
                label="POC Email"
                type="email"
                variant="outlined"
                value={pocEmail}
                onChange={(e) => setPocEmail(e.target.value)}
                required
              />
            </Box>

            <Box className="poc-form-field-row">
              <Phone size={20} color="#0c83c8" className="poc-form-field-icon" />
              <TextField
                fullWidth
                label="POC Mobile"
                variant="outlined"
                value={pocMobile}
                onChange={(e) => setPocMobile(e.target.value)}
                required
              />
            </Box>

            <Box className="poc-form-field-row">
              <ShieldCheck size={20} color="#0c83c8" className="poc-form-field-icon" />
              <TextField
                fullWidth
                label="Certificate ID"
                variant="outlined"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                placeholder="e.g., CET/DEMO/"
                helperText="Leave empty if no certificate"
              />
            </Box>

            <FormControlLabel
              className="poc-cert-switch"
              control={
                <Switch
                  checked={certStatus}
                  onChange={(e) => setCertStatus(e.target.checked)}
                  color="primary"
                />
              }
              label="Certificate Status (Active/Inactive)"
            />

            {/* Action Buttons */}
            <Box className="poc-form-actions">
              <Button
                variant="outlined"
                onClick={handleClear}
                className="poc-btn-clear"
              >
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                className="poc-btn-submit"
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
          onClose={() => setOpenSuccess(false)}
        >
          <Alert severity="success" className="poc-snackbar-alert">
            POC added successfully!
          </Alert>
        </Snackbar>

        {/* Error Snackbar */}
        <Snackbar
          open={openError}
          autoHideDuration={3000}
          onClose={() => setOpenError(false)}
        >
          <Alert severity="error" className="poc-snackbar-alert">
            {errorMessage}
          </Alert>
        </Snackbar>

      </Container>
    </>
  );
};

export default Add_POC;