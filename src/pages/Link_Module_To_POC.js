import React, { useEffect, useState } from "react";
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
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  styled,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  fetchAllPocs,
  fetchPocById,
  fetchAllUsers,
  fetchAllModules,
  updatePoc,
} from "../axios";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import PersonIcon from "@mui/icons-material/Person";
import ModuleIcon from "@mui/icons-material/Book";
import GroupIcon from "@mui/icons-material/Group";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import Admin_Dashboard from "../components/AdminDash";
import { useTheme } from "@mui/material/styles";
import { stepConnectorClasses } from "@mui/material/StepConnector";
import { useNavigate } from "react-router-dom";
import "../styles/Link_Module_To_POC.css";

// ── Custom Stepper Connector ──────────────────────────────────────────────────
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
  ...(ownerState.active || ownerState.completed
    ? {
        background: "linear-gradient(90deg, #0c83c8, #fc7a46)",
        boxShadow: "0 4px 12px rgba(12, 131, 200, 0.3)",
      }
    : {}),
}));

function ColorlibStepIcon(props) {
  const { active, completed, className, icon } = props;
  const icons = {
    1: <ModuleIcon />,
    2: <PersonIcon />,
    3: <GroupIcon />,
    4: <CheckCircleIcon />,
  };
  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(icon)]}
    </ColorlibStepIconRoot>
  );
}

const steps = ["Select Module", "Select POC"];

// ── DataGrid sx (MUI deep selectors kept as sx) ───────────────────────────────
const getDataGridSx = (theme) => ({
  "& .MuiDataGrid-columnHeaders": {
    background: "linear-gradient(90deg, #0c83c8, #fc7a46)",
    color: "#0c83c8",
    fontWeight: "600",
    fontSize: "14px",
    textTransform: "uppercase",
    borderBottom: "2px solid #0c83c8",
  },
  "& .MuiDataGrid-columnHeaderTitle": { fontWeight: "600" },
  "& .MuiDataGrid-row": {
    "&:nth-of-type(odd)": { backgroundColor: "#f8fafc" },
    "&:hover": { backgroundColor: "#e3f2fd", transition: "background-color 0.2s ease" },
  },
  "& .MuiDataGrid-cell": { borderBottom: "1px solid #e5e7eb", padding: "8px" },
  boxShadow: "0 2px 8px rgba(12, 131, 200, 0.05)",
  borderRadius: "12px",
  border: "none",
  overflow: "hidden",
  [theme.breakpoints.down("sm")]: {
    "& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell": {
      minWidth: "100px !important",
    },
  },
});

// ── Component ─────────────────────────────────────────────────────────────────
const Link_Module_To_POC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dataGridSx = getDataGridSx(theme);

  const [pocs, setPocs] = useState([]);
  const [modules, setIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState({ pocs: true, modules: true, users: true, pocDetails: false });
  const [selectedPocIds, setSelectedPocIds] = useState([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsDialogTitle, setDetailsDialogTitle] = useState("");
  const [detailsDialogContent, setDetailsDialogContent] = useState([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [activeStep, setActiveStep] = useState(0);
  const [pocDetailsFetched, setPocDetailsFetched] = useState(false);

  // Load selections from localStorage on mount
  useEffect(() => {
    try {
      const pocIds = JSON.parse(localStorage.getItem("selectedPocIds")) || [];
      const moduleIds = JSON.parse(localStorage.getItem("selectedModuleIds")) || [];
      const userIds = JSON.parse(localStorage.getItem("selectedUserIds")) || [];
      setSelectedPocIds(Array.isArray(pocIds) ? pocIds : []);
      setSelectedModuleIds(Array.isArray(moduleIds) ? moduleIds : []);
      setSelectedUserIds(Array.isArray(userIds) ? userIds : []);
    } catch (error) {
      console.error("Error parsing localStorage:", error);
      localStorage.removeItem("selectedPocIds");
      localStorage.removeItem("selectedModuleIds");
      localStorage.removeItem("selectedUserIds");
    }
  }, []);

  useEffect(() => {
    if (loading.pocs || pocDetailsFetched || selectedPocIds.length !== 1) return;
    const selectedPoc = pocs.find((poc) => poc._id === selectedPocIds[0]);
    if (!selectedPoc?.mod_poc_id) {
      console.error("Selected POC has no valid POC ID");
      setSelectedPocIds([]);
      localStorage.removeItem("selectedPocIds");
      return;
    }
    const fetchInitialPocDetails = async () => {
      try {
        setLoading((prev) => ({ ...prev, pocDetails: true }));
        const pocData = await fetchPocById(selectedPoc.mod_poc_id);
        const moduleIds = selectedModuleIds.length > 0 ? selectedModuleIds : pocData.mod_id ? [pocData.mod_id] : [];
        const userIds = Array.isArray(pocData.mod_users) ? pocData.mod_users : [];
        setSelectedModuleIds(moduleIds);
        setSelectedUserIds(userIds);
        localStorage.setItem("selectedModuleIds", JSON.stringify(moduleIds));
        localStorage.setItem("selectedUserIds", JSON.stringify(userIds));
        setPocDetailsFetched(true);
      } catch (error) {
        console.error("Error fetching initial POC details:", error);
        setSnackbarMessage(`Error fetching POC details: ${error.message}`);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setSelectedPocIds([]);
        localStorage.removeItem("selectedPocIds");
      } finally {
        setLoading((prev) => ({ ...prev, pocDetails: false }));
      }
    };
    fetchInitialPocDetails();
  }, [loading.pocs, selectedPocIds, pocs, pocDetailsFetched, selectedModuleIds]);

  useEffect(() => {
    return () => {
      localStorage.removeItem("selectedPocIds");
      localStorage.removeItem("selectedModuleIds");
      localStorage.removeItem("selectedUserIds");
    };
  }, []);

  useEffect(() => {
    const getPocs = async () => {
      try {
        const response = await fetchAllPocs();
        setPocs(response.data || []);
        setLoading((prev) => ({ ...prev, pocs: false }));
      } catch (error) {
        console.error("Error fetching POCs:", error);
        setSnackbarMessage(`Error fetching POCs: ${error.message}`);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setLoading((prev) => ({ ...prev, pocs: false }));
      }
    };
    getPocs();
  }, []);

  useEffect(() => {
    const getModules = async () => {
      try {
        const modulesArray = await fetchAllModules();
        setIds(Array.isArray(modulesArray) ? modulesArray : []);
        setLoading((prev) => ({ ...prev, modules: false }));
      } catch (error) {
        console.error("Error fetching modules:", error);
        setSnackbarMessage(`Error fetching modules: ${error.message || "Unknown error"}`);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setIds([]);
        setLoading((prev) => ({ ...prev, modules: false }));
      }
    };
    getModules();
  }, []);

  useEffect(() => {
    const getUsers = async () => {
      try {
        const usersArray = await fetchAllUsers();
        setUsers(Array.isArray(usersArray) ? usersArray : []);
        setLoading((prev) => ({ ...prev, users: false }));
      } catch (error) {
        console.error("Error fetching users:", error);
        setSnackbarMessage(`Error fetching users: ${error.message || "Unknown error"}`);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setUsers([]);
        setLoading((prev) => ({ ...prev, users: false }));
      }
    };
    getUsers();
  }, []);

  const fetchPocDetails = async (pocId) => {
    try {
      setLoading((prev) => ({ ...prev, pocDetails: true }));
      const pocData = await fetchPocById(pocId);
      const moduleIds = selectedModuleIds.length > 0 ? selectedModuleIds : pocData.mod_id ? [pocData.mod_id] : [];
      const userIds = Array.isArray(pocData.mod_users) ? pocData.mod_users : [];
      setSelectedModuleIds(moduleIds);
      setSelectedUserIds(userIds);
      localStorage.setItem("selectedModuleIds", JSON.stringify(moduleIds));
      localStorage.setItem("selectedUserIds", JSON.stringify(userIds));
      setPocDetailsFetched(true);
      setLoading((prev) => ({ ...prev, pocDetails: false }));
      return true;
    } catch (error) {
      console.error("Error fetching POC details:", error);
      setSnackbarMessage(`Error fetching POC details: ${error.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setLoading((prev) => ({ ...prev, pocDetails: false }));
      return false;
    }
  };

  const getModuleSelectionModel = () =>
    modules.filter((m) => selectedModuleIds.includes(m.mod_id)).map((m) => m._id);

  const getUserSelectionModel = () =>
    users.filter((u) => selectedUserIds.includes(u.user_id)).map((u) => u._id);

  const handleNext = async () => {
    if (activeStep === 0 && selectedModuleIds.length !== 1) {
      setSnackbarMessage("Please select exactly one Module");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    if (activeStep === 1) {
      if (selectedPocIds.length !== 1) {
        setSnackbarMessage("Please select exactly one POC");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }
      const selectedPoc = pocs.find((poc) => poc._id === selectedPocIds[0]);
      if (!selectedPoc?.mod_poc_id) {
        setSnackbarMessage("Selected POC has no valid POC ID");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }
      if (!pocDetailsFetched) {
        const success = await fetchPocDetails(selectedPoc.mod_poc_id);
        if (!success) return;
      }
    }
    setActiveStep((prev) => prev + 1);
  };

  const handlePrevious = () => setActiveStep((prev) => prev - 1);

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => { setSnackbarMessage("Copied to clipboard!"); setSnackbarSeverity("success"); setSnackbarOpen(true); })
      .catch(() => { setSnackbarMessage("Failed to copy to clipboard"); setSnackbarSeverity("error"); setSnackbarOpen(true); });
  };

  const handleViewDetails = (title, items) => {
    setDetailsDialogTitle(title);
    setDetailsDialogContent(Array.isArray(items) ? items : []);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => setDetailsDialogOpen(false);

  const handleOpenPreviewDialog = () => {
    if (selectedPocIds.length !== 1) {
      setSnackbarMessage("Please select exactly one POC to update");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    setPreviewDialogOpen(true);
  };

  const handleClosePreviewDialog = () => setPreviewDialogOpen(false);

  const handleUpdatePoc = async () => {
    const selectedPoc = pocs.find((poc) => poc._id === selectedPocIds[0]);
    if (!selectedPoc) {
      setSnackbarMessage("Selected POC not found");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const updateData = { mod_poc_id: selectedPoc.mod_poc_id };
    if (selectedModuleIds.length > 0) {
      const selectedModule = modules.find((m) => m.mod_id === selectedModuleIds[0]);
      if (selectedModule?.mod_id) updateData.mod_id = selectedModule.mod_id;
    }

    setUpdateLoading(true);
    setPreviewDialogOpen(false);

    try {
      await updatePoc(updateData);
      setSnackbarMessage("POC updated successfully");
      setSnackbarSeverity("success");
      const updatedPocsResponse = await fetchAllPocs();
      setPocs(updatedPocsResponse.data || []);
      setSelectedPocIds([]);
      setSelectedModuleIds([]);
      localStorage.removeItem("selectedPocIds");
      localStorage.removeItem("selectedModuleIds");
      setPocDetailsFetched(false);
      setActiveStep(0);
    } catch (error) {
      console.error("Error updating POC:", error);
      setSnackbarMessage(`Error updating POC: ${error.response?.data?.message || error.message}`);
      setSnackbarSeverity("error");
    } finally {
      setUpdateLoading(false);
      setSnackbarOpen(true);
    }
  };

  const columnsForPocs = [
    { field: "mod_poc_name", headerName: "Name", width: 150 },
    { field: "mod_poc_role", headerName: "Role", width: 100 },
    { field: "mod_poc_email", headerName: "Email", width: 200 },
    { field: "mod_poc_mobile", headerName: "Mobile", width: 150 },
  ];

  const columnsForModules = [
    { field: "mod_name", headerName: "Module Name", width: 200 },
    { field: "mod_tech", headerName: "Technology", width: 150 },
    { field: "mod_duration", headerName: "Duration", width: 200 },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Admin_Dashboard />
      <Box className="lmtp-root">

        {/* Stepper Card */}
        <Paper className="lmtp-stepper-card">
          <Paper className="lmtp-header">
            <Typography variant="subtitle2" className="lmtp-header-subtitle">
              Manage POC assignments
            </Typography>
          </Paper>
          <Stepper
            alternativeLabel
            activeStep={activeStep}
            connector={<ColorlibConnector />}
            className="lmtp-stepper"
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Step Content Card */}
        <Paper className="lmtp-content-card">

          {/* ── Step 0: Select Module ── */}
          {activeStep === 0 && (
            <Box sx={{ mb: 2 }}>
              <Box className="lmtp-step-header">
                <Typography variant="h6" className="lmtp-step-title">
                  Select Module
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate("/add_module")}
                  className="lmtp-btn-add"
                  disableElevation
                >
                  Add Module
                </Button>
              </Box>
              <Box className="lmtp-grid-wrap">
                <DataGrid
                  rows={modules}
                  columns={columnsForModules}
                  pageSize={10}
                  rowsPerPageOptions={[10, 20, 50]}
                  loading={loading.modules}
                  getRowId={(row) => row._id}
                  checkboxSelection
                  rowSelectionModel={getModuleSelectionModel()}
                  onRowSelectionModelChange={(newSelection) => {
                    const updated = newSelection
                      .map((id) => modules.find((m) => m._id === id)?.mod_id)
                      .filter(Boolean);
                    setSelectedModuleIds(updated.length > 0 ? [updated[updated.length - 1]] : []);
                    localStorage.setItem("selectedModuleIds", JSON.stringify(updated));
                  }}
                  sx={dataGridSx}
                  aria-label="Modules DataGrid"
                />
              </Box>
              <Box className="lmtp-nav-end">
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={selectedModuleIds.length !== 1}
                  className="lmtp-btn-next"
                  disableElevation
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}

          {/* ── Step 1: Select POC ── */}
          {activeStep === 1 && (
            <Box sx={{ mb: 2 }}>
              <Box className="lmtp-step-header">
                <Typography variant="h6" className="lmtp-step-title">
                  Select POC
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate("/add_poc")}
                  className="lmtp-btn-add"
                  disableElevation
                >
                  Add POC
                </Button>
              </Box>
              <Box className="lmtp-grid-wrap">
                <DataGrid
                  rows={pocs}
                  columns={columnsForPocs}
                  pageSize={10}
                  rowsPerPageOptions={[10, 20, 50]}
                  loading={loading.pocs}
                  getRowId={(row) => row._id}
                  checkboxSelection
                  rowSelectionModel={selectedPocIds}
                  onRowSelectionModelChange={(newSelection) => {
                    const updated = newSelection.length > 0 ? [newSelection[newSelection.length - 1]] : [];
                    setSelectedPocIds(updated);
                    localStorage.setItem("selectedPocIds", JSON.stringify(updated));
                    setSelectedUserIds([]);
                    localStorage.removeItem("selectedUserIds");
                    setPocDetailsFetched(false);
                  }}
                  sx={dataGridSx}
                  aria-label="POCs DataGrid"
                />
              </Box>
              <Box className="lmtp-nav-between">
                <Button variant="outlined" onClick={handlePrevious} className="lmtp-btn-prev">
                  Previous
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={selectedPocIds.length !== 1 || loading.pocDetails}
                  className="lmtp-btn-next"
                  disableElevation
                >
                  {loading.pocDetails
                    ? <CircularProgress size={20} sx={{ color: "#ffffff", mr: 1 }} />
                    : "Next"
                  }
                </Button>
              </Box>
            </Box>
          )}

          {/* ── Step 2: Review ── */}
          {activeStep === 2 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" className="lmtp-step-title" sx={{ mb: 2 }}>
                Review and Confirm
              </Typography>
              <Typography variant="body1" className="lmtp-review-desc">
                Please review your selections below before confirming the update.
              </Typography>

              {/* Selected Module */}
              <Box className="lmtp-review-box">
                <Typography variant="subtitle1" className="lmtp-review-subtitle">
                  Selected Module
                </Typography>
                {selectedModuleIds.length === 1 ? (() => {
                  const module = modules.find((mod) => mod.mod_id === selectedModuleIds[0]);
                  return module ? (
                    <Box>
                      <Typography variant="body2" className="lmtp-review-body"><strong>Name:</strong> {module.mod_name || "N/A"}</Typography>
                      <Typography variant="body2" className="lmtp-review-body"><strong>Technology:</strong> {module.mod_tech || "N/A"}</Typography>
                      <Typography variant="body2" className="lmtp-review-body"><strong>Duration:</strong> {module.mod_duration || "N/A"}</Typography>
                      <Typography variant="body2" className="lmtp-review-body"><strong>Module ID:</strong> {module.mod_id || "N/A"}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" className="lmtp-review-error">No Module found</Typography>
                  );
                })() : (
                  <Typography variant="body2" className="lmtp-review-empty">No Module selected</Typography>
                )}
              </Box>

              {/* Selected POC */}
              <Box className="lmtp-review-box">
                <Typography variant="subtitle1" className="lmtp-review-subtitle">
                  Selected POC
                </Typography>
                {selectedPocIds.length === 1 ? (() => {
                  const poc = pocs.find((p) => p._id === selectedPocIds[0]);
                  return poc ? (
                    <Box>
                      <Typography variant="body2" className="lmtp-review-body"><strong>Name:</strong> {poc.mod_poc_name || "N/A"}</Typography>
                      <Typography variant="body2" className="lmtp-review-body"><strong>Role:</strong> {poc.mod_poc_role || "N/A"}</Typography>
                      <Typography variant="body2" className="lmtp-review-body"><strong>Email:</strong> {poc.mod_poc_email || "N/A"}</Typography>
                      <Typography variant="body2" className="lmtp-review-body"><strong>Mobile:</strong> {poc.mod_poc_mobile || "N/A"}</Typography>
                      <Typography variant="body2" className="lmtp-review-body"><strong>POC ID:</strong> {poc.mod_poc_id || "N/A"}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" className="lmtp-review-error">No POC found</Typography>
                  );
                })() : (
                  <Typography variant="body2" className="lmtp-review-empty">No POC selected</Typography>
                )}
              </Box>

              <Box className="lmtp-nav-start">
                <Button variant="outlined" onClick={handlePrevious} className="lmtp-btn-prev">
                  Previous
                </Button>
              </Box>
            </Box>
          )}
        </Paper>

        {/* FAB */}
        {activeStep === 2 && (
          <Fab
            variant="extended"
            onClick={handleOpenPreviewDialog}
            disabled={updateLoading || selectedPocIds.length !== 1}
            className="lmtp-fab"
            aria-label="Update POC"
          >
            {updateLoading
              ? <CircularProgress size={20} sx={{ color: "#ffffff", mr: 1 }} />
              : <SaveIcon sx={{ mr: 1 }} />
            }
            Update POC
          </Fab>
        )}

        {/* Confirm Dialog */}
        <Dialog
          open={previewDialogOpen}
          onClose={handleClosePreviewDialog}
          maxWidth="sm"
          fullWidth
          className="lmtp-dialog"
          PaperProps={{ sx: { borderRadius: "12px", boxShadow: "0 8px 24px rgba(12, 131, 200, 0.1)" } }}
        >
          <DialogTitle className="lmtp-dialog-title">
            Confirm POC Update
          </DialogTitle>
          <DialogContent dividers className="lmtp-dialog-content">
            <DialogContentText className="lmtp-dialog-text">
              Review the changes below for the selected POC:
            </DialogContentText>
            {selectedPocIds.length === 1 && (
              <Typography variant="body2" className="lmtp-dialog-detail">
                <strong>POC:</strong>{" "}
                {pocs.find((poc) => poc._id === selectedPocIds[0])?.mod_poc_name || "Unknown"}
              </Typography>
            )}
            {selectedModuleIds.length === 1 && (
              <Typography variant="body2" className="lmtp-dialog-detail">
                <strong>Module:</strong>{" "}
                {modules.find((mod) => mod.mod_id === selectedModuleIds[0])?.mod_name || "Unknown"}
              </Typography>
            )}
            {selectedUserIds.length > 0 && (
              <Typography variant="body2" className="lmtp-dialog-detail">
                <strong>Users:</strong> {selectedUserIds.length} selected
              </Typography>
            )}
          </DialogContent>
          <DialogActions className="lmtp-dialog-actions">
            <Button onClick={handleClosePreviewDialog} className="lmtp-dialog-btn-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePoc}
              variant="contained"
              disabled={updateLoading}
              className="lmtp-dialog-btn-confirm"
              disableElevation
            >
              {updateLoading
                ? <CircularProgress size={20} sx={{ color: "#ffffff", mr: 1 }} />
                : "Confirm"
              }
            </Button>
          </DialogActions>
        </Dialog>

        {/* Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={handleCloseDetailsDialog}
          maxWidth="sm"
          fullWidth
          className="lmtp-dialog"
          PaperProps={{ sx: { borderRadius: "12px", boxShadow: "0 8px 24px rgba(12, 131, 200, 0.1)" } }}
        >
          <DialogTitle className="lmtp-dialog-title">
            <Box className="lmtp-dialog-title-row">
              {detailsDialogTitle}
              <IconButton
                onClick={handleCloseDetailsDialog}
                className="lmtp-dialog-close-btn"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers className="lmtp-dialog-content">
            <Box className="lmtp-details-list">
              {detailsDialogContent.map((item, index) => (
                <Box key={index} className="lmtp-details-item">
                  <Typography variant="body2" className="lmtp-details-item-text">
                    {item}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleCopyToClipboard(item)}
                    className="lmtp-details-copy-btn"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions className="lmtp-dialog-actions">
            <Button
              onClick={() => handleCopyToClipboard(detailsDialogContent.join("\n"))}
              startIcon={<ContentCopyIcon />}
              className="lmtp-dialog-btn-copy-all"
            >
              Copy All
            </Button>
            <Button
              onClick={handleCloseDetailsDialog}
              variant="contained"
              className="lmtp-dialog-btn-close"
              disableElevation
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={{ mb: { xs: 6, sm: 2 }, mr: 2 }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            variant="filled"
            className={`lmtp-snackbar-alert ${
              snackbarSeverity === "success" ? "lmtp-snackbar-alert--success" : ""
            }`}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

      </Box>
    </>
  );
};

export default Link_Module_To_POC;