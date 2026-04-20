import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Fab,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  styled,
  Menu,
  MenuItem,
  Switch,
  FormControlLabel,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  FileText,
  Code,
  HelpCircle,
  CheckCircle,
  Plus,
  Save,
  X,
  Copy,
  Users,
} from "lucide-react";
import { createTest } from "../axios";
import Admin_Dashboard from "../components/AdminDash";
import { stepConnectorClasses } from "@mui/material/StepConnector";

// ─── Styles ───────────────────────────────────────────────────────────────────
import "../styles/Add_Test.css"; // Import the CSS file for styling

// ─── Styled MUI Components ────────────────────────────────────────────────────

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 22 },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: "linear-gradient(90deg, #0c83c8, #fc7a46)",
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      background: "linear-gradient(90deg, #0c83c8, #fc7a46)",
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: "#e0e0e0",
    borderRadius: 1,
  },
}));

const ColorlibStepIconRoot = styled("div")(({ theme, ownerState }) => ({
  backgroundColor: "#e0e0e0",
  zIndex: 1,
  color: "#fff",
  width: 50,
  height: 50,
  display: "flex",
  borderRadius: "50%",
  justifyContent: "center",
  alignItems: "center",
  transition: "all 0.3s ease",
  "&:hover": { transform: "scale(1.1)" },
  ...(ownerState.active || ownerState.completed
    ? {
        background: "linear-gradient(90deg, #0c83c8, #fc7a46)",
        boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
      }
    : {}),
}));

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ["Enter Test Details"];

const STEP_ICONS = {
  1: <FileText size={24} />,
  2: <Code size={24} />,
  3: <HelpCircle size={24} />,
  4: <CheckCircle size={24} />,
};

// ─── Shared sx for text fields (kept as JS — used in MUI sx prop) ─────────────

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    "& fieldset": { borderColor: "#0c83c8" },
    "&:hover fieldset": { borderColor: "#fc7a46" },
    "&.Mui-focused fieldset": { borderColor: "#0c83c8" },
  },
};

const switchSx = {
  "& .MuiSwitch-switchBase.Mui-checked": { color: "#0c83c8" },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    background: "linear-gradient(90deg, #0c83c8, #fc7a46)",
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

// ─── Component ────────────────────────────────────────────────────────────────

const AddTestModule = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // ── State ──────────────────────────────────────────────────────────────────

  const [testDetails, setTestDetails] = useState({
    test_name: "",
    test_language: "",
    status: "active",
  });
  const [formErrors, setFormErrors] = useState({});
  const [createLoading, setCreateLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [dataGridKey, setDataGridKey] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogTitle, setDetailsDialogTitle] = useState("");
  const [detailsDialogContent, setDetailsDialogContent] = useState([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // ── Helpers ────────────────────────────────────────────────────────────────

  const showSnackbar = (message, severity = "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!testDetails.test_name.trim()) errors.test_name = "Test name is required";
    if (!testDetails.test_language.trim()) errors.test_language = "Test language is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTestDetails((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleStatusToggle = () => {
    setTestDetails((prev) => ({
      ...prev,
      status: prev.status === "active" ? "disabled" : "active",
    }));
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => showSnackbar("Copied to clipboard!", "success"))
      .catch(() => showSnackbar("Failed to copy to clipboard"));
  };

  const handleOpenPreviewDialog = () => {
    if (!validateForm()) {
      showSnackbar("Please fill in all required fields");
      return;
    }
    setPreviewDialogOpen(true);
  };

  const handleClosePreviewDialog = () => setPreviewDialogOpen(false);
  const handleCloseDetailsDialog = () => setDetailsDialogOpen(false);

  const handleNext = () => {
    if (activeStep === 0 && !validateForm()) {
      showSnackbar("Please fill in all required fields");
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handlePrevious = () => setActiveStep((prev) => prev - 1);

  const handleCreateTest = async () => {
    if (!validateForm()) {
      showSnackbar("Please fill in all required fields");
      return;
    }

    setCreateLoading(true);
    setPreviewDialogOpen(false);

    try {
      await createTest({
        test_name: testDetails.test_name,
        test_language: testDetails.test_language,
        status: testDetails.status,
      });
      showSnackbar("Test created successfully!", "success");
      setTestDetails({ test_name: "", test_language: "", status: "active" });
      setActiveStep(0);
      setDataGridKey((prev) => prev + 1);
    } catch (error) {
      showSnackbar(`Failed to create test: ${error.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleAddMenuClose = () => setAnchorEl(null);

  const handleNavigate = (path) => {
    navigate(path);
    handleAddMenuClose();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Admin_Dashboard />

      <Box className="test-page-wrapper">
        <Paper className="test-content-paper">

          {/* ── Gradient Header ── */}
          <Paper elevation={4} className="test-header-banner">
            <Box className="test-header-icon-row">
              <Users size={24} />
              <Typography variant="h5" className="test-header-title">
                <span style={{ color: "#fff" }}>Add </span>
                <span style={{ padding: "4px 8px", borderRadius: "6px" }}>Test</span>
              </Typography>
            </Box>
            <Typography variant="subtitle2" className="test-header-subtitle">
              Create a new test with coding problems and MCQs
            </Typography>
          </Paper>

          {/* ── Stepper ── */}
          <Stepper
            alternativeLabel
            activeStep={activeStep}
            connector={<ColorlibConnector />}
            className="test-stepper"
          >
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel StepIconComponent={ColorlibStepIcon}>
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* ── Step 0: Enter Test Details ── */}
          {activeStep === 0 && (
            <Box sx={{ mb: 2 }}>
              <Box className="test-section-title-row">
                <Typography variant="h6" className="test-section-title">
                  Enter Test Details
                </Typography>
              </Box>

              <Box className="test-form-container">
                <TextField
                  label="Test Name"
                  name="test_name"
                  value={testDetails.test_name}
                  onChange={handleInputChange}
                  error={!!formErrors.test_name}
                  helperText={formErrors.test_name}
                  fullWidth
                  required
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FileText size={16} color="#0c83c8" />
                      </InputAdornment>
                    ),
                  }}
                  sx={textFieldSx}
                />

                <TextField
                  label="Test Language"
                  name="test_language"
                  value={testDetails.test_language}
                  onChange={handleInputChange}
                  error={!!formErrors.test_language}
                  helperText={formErrors.test_language}
                  fullWidth
                  required
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Code size={16} color="#0c83c8" />
                      </InputAdornment>
                    ),
                  }}
                  sx={textFieldSx}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={testDetails.status === "active"}
                      onChange={handleStatusToggle}
                      sx={switchSx}
                    />
                  }
                  label={`Status: ${testDetails.status === "active" ? "Active" : "Disabled"}`}
                  className="test-status-label"
                />
              </Box>

              {/* FAB */}
              <Fab
                onClick={activeStep === 0 ? handleOpenPreviewDialog : handleAddMenuOpen}
                disabled={activeStep === 0 && createLoading}
                className="test-fab"
              >
                {activeStep === 0 ? (
                  createLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <Save size={24} color="#fff" />
                  )
                ) : (
                  <Plus size={24} color="#fff" />
                )}
              </Fab>
            </Box>
          )}
        </Paper>

        {/* ── Add Menu ── */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleAddMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "bottom", horizontal: "right" }}
          PaperProps={{ className: "test-menu-paper" }}
        >
          <MenuItem onClick={() => handleNavigate("/add_test")} className="test-menu-item">
            <FileText size={16} color="#0c83c8" style={{ marginRight: 8 }} />
            Add Test
          </MenuItem>
          <MenuItem onClick={() => handleNavigate("/add_coding")} className="test-menu-item">
            <Code size={16} color="#0c83c8" style={{ marginRight: 8 }} />
            Add Coding Problem
          </MenuItem>
          <MenuItem onClick={() => handleNavigate("/add_mcq")} className="test-menu-item">
            <HelpCircle size={16} color="#0c83c8" style={{ marginRight: 8 }} />
            Add MCQ
          </MenuItem>
        </Menu>

        {/* ── Preview / Confirm Dialog ── */}
        <Dialog
          open={previewDialogOpen}
          onClose={handleClosePreviewDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{ className: "test-dialog-paper" }}
        >
          <DialogTitle className="test-dialog-title">
            Confirm Test Creation
          </DialogTitle>
          <DialogContent dividers>
            <DialogContentText className="test-dialog-content-text">
              Review the test details below:
            </DialogContentText>
            <Typography variant="body2" className="test-dialog-body-text">
              <strong>Test Name:</strong> {testDetails.test_name}
            </Typography>
            <Typography variant="body2" className="test-dialog-body-text">
              <strong>Test Language:</strong> {testDetails.test_language}
            </Typography>
            <Typography variant="body2" className="test-dialog-body-text">
              <strong>Status:</strong> {testDetails.status}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePreviewDialog} className="test-btn-cancel">
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateTest}
              disabled={createLoading}
              startIcon={
                createLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Save size={16} />
                )
              }
              className="test-btn-primary"
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Details Dialog ── */}
        <Dialog
          open={detailsDialogOpen}
          onClose={handleCloseDetailsDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{ className: "test-dialog-paper" }}
        >
          <DialogTitle className="test-dialog-title">
            <Box className="test-dialog-title-row">
              {detailsDialogTitle}
              <IconButton onClick={handleCloseDetailsDialog}>
                <X size={20} color="white" />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Box className="test-details-code-box">
              {detailsDialogContent.map((item, index) => (
                <Box key={`${item}-${index}`} className="test-details-item">
                  <Typography variant="body2" className="test-details-item-text">
                    {item}
                  </Typography>
                  <IconButton size="small" onClick={() => handleCopyToClipboard(item)}>
                    <Copy size={16} color="#0c83c8" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => handleCopyToClipboard(detailsDialogContent.join("\n"))}
              startIcon={<Copy size={16} />}
              className="test-btn-cancel"
            >
              Copy All
            </Button>
            <Button
              onClick={handleCloseDetailsDialog}
              variant="contained"
              startIcon={<X size={16} />}
              className="test-btn-primary"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Snackbar ── */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            variant="filled"
            className={`test-alert${snackbarSeverity === "success" ? " test-alert-success" : ""}`}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default AddTestModule;