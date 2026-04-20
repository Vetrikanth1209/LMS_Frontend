import React, { useState } from "react";
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  CircularProgress,
  DialogActions,
  Chip,
  Tooltip,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CodeIcon from "@mui/icons-material/Code";
import BugReportIcon from "@mui/icons-material/BugReport";
import SaveIcon from "@mui/icons-material/Save";
import { stepConnectorClasses } from "@mui/material/StepConnector";
import Admin_Dashboard from "../components/AdminDash";
import { createCodeProblem } from "../axios";
import { useNavigate } from "react-router-dom";
import "../styles/Add_Coding.css"; // Import the CSS file for styling

// UUID validation regex
const isValidUUID = (id) => {
  if (!id || typeof id !== "string") return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 20,
    left: "calc(-50% + 28px)",
    right: "calc(50% + 28px)",
  },
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
    height: 4,
    border: 0,
    backgroundColor: theme.palette.grey[300],
    borderRadius: 2,
  },
}));

const ColorlibStepIconRoot = styled("div")(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.grey[300],
  zIndex: 1,
  color: "#fff",
  width: 48,
  height: 48,
  display: "flex",
  borderRadius: "50%",
  justifyContent: "center",
  alignItems: "center",
  transition: "all 0.3s ease",
  ...(ownerState?.active || ownerState?.completed
    ? {
        background: "linear-gradient(90deg, #0c83c8, #fc7a46)",
        boxShadow: "0 4px 12px rgba(12, 131, 200, 0.3)",
      }
    : {}),
}));

function ColorlibStepIcon(props) {
  const { active = false, completed = false, className, icon } = props;
  const icons = {
    1: <CodeIcon />,
    2: <BugReportIcon />,
    3: <SaveIcon />,
  };
  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(icon)]}
    </ColorlibStepIconRoot>
  );
}

const steps = ["Add Coding Problem"];

const Add_Coding = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [problemStatement, setProblemStatement] = useState("");
  const [tags, setTags] = useState("");
  const [selectedTestcaseIds, setSelectedTestcaseIds] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState({ testcases: false, submit: false });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const handleNext = () => {
    if (activeStep === 0) {
      if (!problemStatement.trim()) {
        setSnackbar({ open: true, message: "Problem statement is required.", severity: "error" });
        return;
      }
      if (!tags.trim()) {
        setSnackbar({ open: true, message: "At least one tag is required.", severity: "error" });
        return;
      }
    }
    if (activeStep === 1 && selectedTestcaseIds.length === 0) {
      setSnackbar({ open: true, message: "Please select at least one testcase or click Next to continue.", severity: "info" });
    }
    if (activeStep === steps.length - 1) {
      setPreviewDialogOpen(true);
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handlePrevious = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (!problemStatement.trim()) {
      setSnackbar({ open: true, message: "Problem statement is required.", severity: "error" });
      setPreviewDialogOpen(false);
      return;
    }
    const tagsArray = tags.split(",").map((t) => t.trim()).filter((t) => t);
    if (tagsArray.length === 0) {
      setSnackbar({ open: true, message: "At least one tag is required.", severity: "error" });
      setPreviewDialogOpen(false);
      return;
    }

    setLoading((prev) => ({ ...prev, submit: true }));
    const payload = {
      code_problem_statement: problemStatement,
      code_tags: tagsArray,
      code_test_cases_id: selectedTestcaseIds.filter((id) => isValidUUID(id)),
    };

    try {
      const response = await createCodeProblem(payload);
      setSnackbar({ open: true, message: response.msg || "Code problem successfully submitted!", severity: "success" });
      handleClear();
      setSelectedTestcaseIds([]);
      setPreviewDialogOpen(false);
      setActiveStep(0);
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message || "Submission failed";
      setSnackbar({ open: true, message: `Error: ${errorMsg}`, severity: "error" });
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  const handleClear = () => {
    setProblemStatement("");
    setTags("");
    setSelectedTestcaseIds([]);
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });
  const handleClosePreviewDialog = () => setPreviewDialogOpen(false);

  const renderTagChips = (tags) => {
    if (!Array.isArray(tags) || tags.length === 0) {
      return <Typography className="no-tags-text">No tags</Typography>;
    }
    return tags.map((tag, index) => (
      <Tooltip title={tag} key={index}>
        <Chip label={tag.trim()} size="small" className="tag-chip" />
      </Tooltip>
    ));
  };

  return (
    <>
      <Admin_Dashboard />
      <Box className="page-wrapper">
        <Container maxWidth="lg" className="page-container">

          {/* Header Card */}
          <Paper className="header-paper">
            <Box className="header-banner">
              <Box className="header-title-row">
                <CodeIcon className="header-icon" />
                <Typography variant={isMobile ? "h6" : "h5"} className="header-title">
                  Add Code Problem
                </Typography>
              </Box>
              <Typography variant="subtitle2" className="header-subtitle">
                Add a new coding question for assessment
              </Typography>
            </Box>
            <Stepper
              alternativeLabel
              activeStep={activeStep}
              connector={<ColorlibConnector />}
              className="stepper"
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>

          {/* Form Card */}
          <Paper className="form-paper">
            {activeStep === 0 && (
              <Box className="form-section">
                <Typography variant="h6" className="gradient-text section-title">
                  Add Coding Problem
                </Typography>

                <Typography variant="subtitle1" className="gradient-text field-label">
                  Problem Statement
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  placeholder="Write a function to check if a number is prime."
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  className="text-field"
                  aria-label="Problem statement input"
                />

                <Typography variant="subtitle1" className="gradient-text field-label">
                  Tags (Required)
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter tags separated by commas (e.g., maths, loops, prime)"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  helperText="At least one tag is required."
                  className="text-field tags-field"
                  aria-label="Tags input"
                />

                <Box className="form-actions">
                  <Tooltip title="Clear all input fields">
                    <Button variant="outlined" onClick={handleClear} className="btn-clear">
                      Clear
                    </Button>
                  </Tooltip>
                  <Tooltip title="Confirm and submit code problem">
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      startIcon={<SaveIcon />}
                      className="btn-submit"
                    >
                      Add
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
            )}
          </Paper>

          {/* Preview Dialog */}
          <Dialog
            open={previewDialogOpen}
            onClose={handleClosePreviewDialog}
            maxWidth="sm"
            fullWidth
            PaperProps={{ className: "dialog-paper" }}
          >
            <DialogTitle className="dialog-title">
              Confirm Code Problem Submission
            </DialogTitle>
            <DialogContent dividers className="dialog-content">
              <DialogContentText className="dialog-content-text">
                Review the details below:
              </DialogContentText>
              <Typography variant="body2" className="dialog-detail">
                <strong>Problem Statement:</strong> {problemStatement || "N/A"}
              </Typography>
              <Typography variant="body2" className="dialog-detail">
                <strong>Tags:</strong> {tags || "None"}
              </Typography>
            </DialogContent>
            <DialogActions className="dialog-actions">
              <Tooltip title="Cancel and return to review">
                <Button onClick={handleClosePreviewDialog} className="btn-dialog-cancel">
                  Cancel
                </Button>
              </Tooltip>
              <Tooltip title="Confirm and save changes">
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading.submit}
                  startIcon={
                    loading.submit
                      ? <CircularProgress size={16} color="inherit" />
                      : <SaveIcon />
                  }
                  className="btn-submit"
                >
                  Confirm
                </Button>
              </Tooltip>
            </DialogActions>
          </Dialog>

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            className="snackbar"
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={snackbar.severity}
              variant="filled"
              className={`alert ${snackbar.severity === "success" ? "alert--success" : ""}`}
              icon={
                snackbar.severity === "success"
                  ? <CheckCircleOutlineIcon />
                  : <ErrorOutlineIcon />
              }
            >
              {snackbar.message}
            </Alert>
          </Snackbar>

        </Container>
      </Box>
    </>
  );
};

export default Add_Coding;