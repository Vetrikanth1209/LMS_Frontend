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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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

// ─── Styles ──────────────────────────────────────────────────────────────────
import "../styles/Link_Users_To_POC.css"; // Import the CSS file for styling

// ─── Styled MUI Components ────────────────────────────────────────────────────

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

// ─── Step Icon ────────────────────────────────────────────────────────────────

function ColorlibStepIcon(props) {
  const { active, completed, className, icon } = props;

  const icons = {
    1: <ModuleIcon />,
    2: <PersonIcon />,
    3: <GroupIcon />,
    4: <CheckCircleIcon />,
  };

  return (
    <ColorlibStepIconRoot
      ownerState={{ completed, active }}
      className={className}
    >
      {icons[String(icon)]}
    </ColorlibStepIconRoot>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ["Select POC", "Select Users", "Update POC"];

const COLUMNS_FOR_POCS = [
  { field: "mod_poc_name", headerName: "Name", width: 150 },
  { field: "mod_poc_role", headerName: "Role", width: 100 },
  { field: "mod_poc_email", headerName: "Email", width: 200 },
  { field: "mod_poc_mobile", headerName: "Mobile", width: 150 },
];

const COLUMNS_FOR_USERS = [
  { field: "full_name", headerName: "Full Name", width: 150 },
  { field: "department", headerName: "Department", width: 150 },
  { field: "college", headerName: "College", width: 100 },
  { field: "rollno", headerName: "Roll No", width: 120 },
  { field: "email", headerName: "Email", width: 200 },
];

// ─── DataGrid sx (kept here as it references MUI theme via sx prop) ───────────

const buildDataGridSx = (theme) => ({
  "& .MuiDataGrid-columnHeaders": {
    background: "linear-gradient(90deg, #0c83c8, #fc7a46)",
    color: "#0c83c8",
    fontWeight: "600",
    fontSize: "14px",
    textTransform: "uppercase",
    borderBottom: "2px solid #0c83c8",
  },
  "& .MuiDataGrid-columnHeaderTitle": {
    fontWeight: "600",
  },
  "& .MuiDataGrid-row": {
    "&:nth-of-type(odd)": { backgroundColor: "#f8fafc" },
    "&:hover": {
      backgroundColor: "#e3f2fd",
      transition: "background-color 0.2s ease",
    },
  },
  "& .MuiDataGrid-cell": {
    borderBottom: "1px solid #e5e7eb",
    padding: "8px",
  },
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

// ─── Component ────────────────────────────────────────────────────────────────

const Link_Users_To_POC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dataGridSx = buildDataGridSx(theme);

  // ── State ──────────────────────────────────────────────────────────────────

  const [pocs, setPocs] = useState([]);
  const [modules, setIds] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState({
    pocs: true,
    modules: true,
    users: true,
    pocDetails: false,
  });

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

  // ── Helpers ────────────────────────────────────────────────────────────────

  const showSnackbar = (message, severity = "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const getModuleSelectionModel = () =>
    modules
      .filter((module) => selectedModuleIds.includes(module.mod_id))
      .map((module) => module._id);

  const getUserSelectionModel = () =>
    users
      .filter((user) => selectedUserIds.includes(user.user_id))
      .map((user) => user._id);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Load selections from localStorage on mount
  useEffect(() => {
    try {
      const pocIds = JSON.parse(localStorage.getItem("selectedPocIds")) || [];
      const moduleIds =
        JSON.parse(localStorage.getItem("selectedModuleIds")) || [];
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

  // Fetch POC details if selectedPocIds exists after pocs are loaded
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
        const moduleIds =
          selectedModuleIds.length > 0
            ? selectedModuleIds
            : pocData.mod_id
              ? [pocData.mod_id]
              : [];
        const userIds = Array.isArray(pocData.mod_users) ? pocData.mod_users : [];

        setSelectedModuleIds(moduleIds);
        setSelectedUserIds(userIds);
        localStorage.setItem("selectedModuleIds", JSON.stringify(moduleIds));
        localStorage.setItem("selectedUserIds", JSON.stringify(userIds));
        setPocDetailsFetched(true);
      } catch (error) {
        console.error("Error fetching initial POC details:", error);
        showSnackbar(`Error fetching POC details: ${error.message}`);
        setSelectedPocIds([]);
        localStorage.removeItem("selectedPocIds");
      } finally {
        setLoading((prev) => ({ ...prev, pocDetails: false }));
      }
    };

    fetchInitialPocDetails();
  }, [loading.pocs, selectedPocIds, pocs, pocDetailsFetched, selectedModuleIds]);

  // Clear localStorage on unmount
  useEffect(() => {
    return () => {
      localStorage.removeItem("selectedPocIds");
      localStorage.removeItem("selectedModuleIds");
      localStorage.removeItem("selectedUserIds");
    };
  }, []);

  // Fetch POCs
  useEffect(() => {
    const getPocs = async () => {
      try {
        const response = await fetchAllPocs();
        setPocs(response.data || []);
      } catch (error) {
        console.error("Error fetching POCs:", error);
        showSnackbar(`Error fetching POCs: ${error.message}`);
      } finally {
        setLoading((prev) => ({ ...prev, pocs: false }));
      }
    };
    getPocs();
  }, []);

  // Fetch Modules
  useEffect(() => {
    const getModules = async () => {
      try {
        const modulesArray = await fetchAllModules();
        setIds(Array.isArray(modulesArray) ? modulesArray : []);
      } catch (error) {
        console.error("Error fetching modules:", error);
        showSnackbar(`Error fetching modules: ${error.message || "Unknown error"}`);
        setIds([]);
      } finally {
        setLoading((prev) => ({ ...prev, modules: false }));
      }
    };
    getModules();
  }, []);

  // Fetch Users
  useEffect(() => {
    const getUsers = async () => {
      try {
        const usersArray = await fetchAllUsers();
        setUsers(Array.isArray(usersArray) ? usersArray : []);
      } catch (error) {
        console.error("Error fetching users:", error);
        showSnackbar(`Error fetching users: ${error.message || "Unknown error"}`);
        setUsers([]);
      } finally {
        setLoading((prev) => ({ ...prev, users: false }));
      }
    };
    getUsers();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const fetchPocDetails = async (pocId) => {
    try {
      setLoading((prev) => ({ ...prev, pocDetails: true }));
      const pocData = await fetchPocById(pocId);
      const moduleIds =
        selectedModuleIds.length > 0
          ? selectedModuleIds
          : pocData.mod_id
            ? [pocData.mod_id]
            : [];
      const userIds = Array.isArray(pocData.mod_users) ? pocData.mod_users : [];

      setSelectedModuleIds(moduleIds);
      setSelectedUserIds(userIds);
      localStorage.setItem("selectedModuleIds", JSON.stringify(moduleIds));
      localStorage.setItem("selectedUserIds", JSON.stringify(userIds));
      setPocDetailsFetched(true);
      return true;
    } catch (error) {
      console.error("Error fetching POC details:", error);
      showSnackbar(`Error fetching POC details: ${error.message}`);
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, pocDetails: false }));
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      if (selectedPocIds.length !== 1) {
        showSnackbar("Please select exactly one POC");
        return;
      }
      const selectedPoc = pocs.find((poc) => poc._id === selectedPocIds[0]);
      if (!selectedPoc?.mod_poc_id) {
        showSnackbar("Selected POC has no valid POC ID");
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
    navigator.clipboard
      .writeText(text)
      .then(() => showSnackbar("Copied to clipboard!", "success"))
      .catch((err) => {
        console.error("Failed to copy: ", err);
        showSnackbar("Failed to copy to clipboard");
      });
  };

  const handleViewDetails = (title, items) => {
    setDetailsDialogTitle(title);
    setDetailsDialogContent(Array.isArray(items) ? items : []);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => setDetailsDialogOpen(false);

  const handleOpenPreviewDialog = () => {
    if (selectedPocIds.length !== 1) {
      showSnackbar("Please select exactly one POC to update");
      return;
    }
    setPreviewDialogOpen(true);
  };

  const handleClosePreviewDialog = () => setPreviewDialogOpen(false);

  const handleUpdatePoc = async () => {
    const selectedPoc = pocs.find((poc) => poc._id === selectedPocIds[0]);
    if (!selectedPoc) {
      showSnackbar("Selected POC not found");
      return;
    }

    // Refresh users
    try {
      const response = await fetchAllUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error refreshing users:", error);
      showSnackbar("Error refreshing user data");
      return;
    }

    // Validate users
    const validUserIds = users.map((user) => user.user_id);
    const invalidUserIds = selectedUserIds.filter(
      (id) => !validUserIds.includes(id) || !id
    );

    if (invalidUserIds.length > 0) {
      console.error("Invalid user_ids:", invalidUserIds);
      showSnackbar(`Invalid user selections: ${invalidUserIds.join(", ")}`);
      return;
    }

    const updateData = {
      mod_poc_id: selectedPoc.mod_poc_id,
      mod_users: selectedUserIds,
    };

    console.log("Sending update POC payload:", updateData);

    setUpdateLoading(true);
    setPreviewDialogOpen(false);

    try {
      await updatePoc(updateData);
      showSnackbar("POC updated successfully", "success");

      const updatedPocsResponse = await fetchAllPocs();
      setPocs(updatedPocsResponse.data || []);

      // Reset selections
      setSelectedPocIds([]);
      setSelectedUserIds([]);
      localStorage.removeItem("selectedPocIds");
      localStorage.removeItem("selectedUserIds");
      setPocDetailsFetched(false);
      setActiveStep(0);
    } catch (error) {
      console.error("Error updating POC:", error);
      showSnackbar(
        `Error updating POC: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setUpdateLoading(false);
      setSnackbarOpen(true);
    }
  };

  // ── Sub-renders ────────────────────────────────────────────────────────────

  const renderPocInfo = () => {
    if (selectedPocIds.length !== 1) {
      return (
        <Typography variant="body2" className="poc-text-muted">
          No POC selected
        </Typography>
      );
    }
    const poc = pocs.find((p) => p._id === selectedPocIds[0]);
    if (!poc) {
      return (
        <Typography variant="body2" className="poc-text-error">
          No POC found
        </Typography>
      );
    }
    return (
      <Box sx={{ "& > p": { mb: 0.5 } }}>
        {[
          ["Name", poc.mod_poc_name],
          ["Role", poc.mod_poc_role],
          ["Email", poc.mod_poc_email],
          ["Mobile", poc.mod_poc_mobile],
          ["POC ID", poc.mod_poc_id],
        ].map(([label, value]) => (
          <Typography key={label} variant="body2" className="poc-review-body">
            <strong>{label}:</strong> {value || "N/A"}
          </Typography>
        ))}
      </Box>
    );
  };

  const renderUsersTable = () => {
    if (selectedUserIds.length === 0) {
      return (
        <Typography variant="body2" className="poc-text-muted">
          No Users selected
        </Typography>
      );
    }
    const selectedUsers = users.filter((u) =>
      selectedUserIds.includes(u.user_id)
    );
    return (
      <TableContainer className="poc-review-table-container">
        <Table size="small" className="poc-review-table">
          <TableHead>
            <TableRow>
              {["Full Name", "Department", "College", "Roll No", "Email"].map(
                (h) => (
                  <TableCell key={h}>{h}</TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {selectedUsers.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.full_name || "N/A"}</TableCell>
                <TableCell>{user.department || "N/A"}</TableCell>
                <TableCell>{user.college || "N/A"}</TableCell>
                <TableCell>{user.rollno || "N/A"}</TableCell>
                <TableCell>{user.email || "N/A"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Admin_Dashboard />

      <Box className="poc-page-wrapper">
        {/* ── Header Paper ── */}
        <Paper className="poc-header-paper">
          {/* Gradient Banner */}
          <Paper className="poc-gradient-banner" elevation={0}>
            <Typography variant="h4" className="poc-banner-title">
              Update POC
            </Typography>
            <Typography variant="subtitle2" className="poc-banner-subtitle">
              Manage POC assignments
            </Typography>
          </Paper>

          {/* Stepper */}
          <Stepper
            alternativeLabel
            activeStep={activeStep}
            connector={<ColorlibConnector />}
            className="poc-stepper"
          >
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel StepIconComponent={ColorlibStepIcon}>
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* ── Content Paper ── */}
        <Paper className="poc-content-paper">

          {/* ── Step 0 : Select POC ── */}
          {activeStep === 0 && (
            <Box sx={{ mb: 2 }}>
              <Box className="poc-section-header">
                <Typography variant="h6" className="poc-gradient-text">
                  Select POC
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate("/add_poc")}
                  className="poc-add-button"
                >
                  Add POC
                </Button>
              </Box>

              <Box className="poc-datagrid-container">
                <DataGrid
                  rows={pocs}
                  columns={COLUMNS_FOR_POCS}
                  pageSize={10}
                  rowsPerPageOptions={[10, 20, 50]}
                  loading={loading.pocs}
                  getRowId={(row) => row._id}
                  checkboxSelection
                  rowSelectionModel={selectedPocIds}
                  onRowSelectionModelChange={(newSelection) => {
                    const updated =
                      newSelection.length > 0
                        ? [newSelection[newSelection.length - 1]]
                        : [];
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

              <Box className="poc-nav-buttons">
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  className="poc-btn-secondary"
                >
                  Previous
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={selectedPocIds.length !== 1 || loading.pocDetails}
                  className="poc-btn-primary"
                >
                  {loading.pocDetails ? (
                    <CircularProgress size={20} sx={{ color: "#ffffff", mr: 1 }} />
                  ) : (
                    "Next"
                  )}
                </Button>
              </Box>
            </Box>
          )}

          {/* ── Step 1 : Select Users ── */}
          {activeStep === 1 && (
            <Box sx={{ mb: 2 }}>
              <Box className="poc-section-header">
                <Typography variant="h6" className="poc-gradient-text">
                  Select Users
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate("/add_user")}
                  className="poc-add-button"
                >
                  Add User
                </Button>
              </Box>

              <Box className="poc-datagrid-container">
                <DataGrid
                  rows={users}
                  columns={COLUMNS_FOR_USERS}
                  pageSize={10}
                  rowsPerPageOptions={[10, 20, 50]}
                  loading={loading.users}
                  getRowId={(row) => row._id}
                  checkboxSelection
                  rowSelectionModel={getUserSelectionModel()}
                  onRowSelectionModelChange={(newSelection) => {
                    const updated = newSelection
                      .map((id) => users.find((u) => u._id === id)?.user_id)
                      .filter((id) => id && typeof id === "string");
                    console.log("User selection updated:", updated);
                    setSelectedUserIds(updated);
                    localStorage.setItem("selectedUserIds", JSON.stringify(updated));
                  }}
                  sx={dataGridSx}
                  aria-label="Users DataGrid"
                />
              </Box>

              <Box className="poc-nav-buttons">
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  className="poc-btn-secondary"
                >
                  Previous
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  className="poc-btn-primary"
                >
                  Next
                </Button>
              </Box>
            </Box>
          )}

          {/* ── Step 2 : Review & Confirm ── */}
          {activeStep === 2 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" className="poc-gradient-text" sx={{ mb: 2 }}>
                Review and Confirm
              </Typography>
              <Typography variant="body1" className="poc-text-muted" sx={{ mb: 3 }}>
                Please review your selections below before confirming the update.
              </Typography>

              {/* Selected POC */}
              <Box className="poc-review-box">
                <Typography variant="subtitle1" className="poc-review-subtitle">
                  Selected POC
                </Typography>
                {renderPocInfo()}
              </Box>

              {/* Selected Users */}
              <Box className="poc-review-box">
                <Typography variant="subtitle1" className="poc-review-subtitle">
                  Selected Users
                </Typography>
                {renderUsersTable()}
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 2, gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={handlePrevious}
                  className="poc-btn-secondary"
                >
                  Previous
                </Button>
              </Box>

              {/* FAB */}
              <Fab
                variant="extended"
                onClick={handleOpenPreviewDialog}
                disabled={updateLoading || selectedPocIds.length !== 1}
                className="poc-fab"
                aria-label="Update POC"
              >
                {updateLoading ? (
                  <CircularProgress size={20} sx={{ color: "#ffffff", mr: 1 }} />
                ) : (
                  <SaveIcon sx={{ mr: 1 }} />
                )}
                Update POC
              </Fab>
            </Box>
          )}
        </Paper>

        {/* ── Preview / Confirm Dialog ── */}
        <Dialog
          open={previewDialogOpen}
          onClose={handleClosePreviewDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{ className: "poc-dialog-paper" }}
        >
          <DialogTitle className="poc-dialog-title">
            Confirm POC Update
          </DialogTitle>

          <DialogContent dividers className="poc-dialog-content">
            <DialogContentText className="poc-dialog-content-text">
              Review the changes below for the selected POC:
            </DialogContentText>
            {selectedPocIds.length === 1 && (
              <Typography variant="body2" className="poc-dialog-body-text">
                <strong>POC:</strong>{" "}
                {pocs.find((poc) => poc._id === selectedPocIds[0])?.mod_poc_name ||
                  "Unknown"}
              </Typography>
            )}
            {selectedUserIds.length > 0 && (
              <Typography variant="body2" className="poc-dialog-body-text">
                <strong>Users:</strong> {selectedUserIds.length} selected
              </Typography>
            )}
          </DialogContent>

          <DialogActions className="poc-dialog-actions">
            <Button onClick={handleClosePreviewDialog} className="poc-btn-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePoc}
              variant="contained"
              disabled={updateLoading}
              className="poc-btn-primary"
            >
              {updateLoading ? (
                <CircularProgress size={20} sx={{ color: "#ffffff", mr: 1 }} />
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Details Dialog ── */}
        <Dialog
          open={detailsDialogOpen}
          onClose={handleCloseDetailsDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{ className: "poc-dialog-paper" }}
        >
          <DialogTitle className="poc-dialog-title">
            <Box className="poc-dialog-title-row">
              {detailsDialogTitle}
              <IconButton
                onClick={handleCloseDetailsDialog}
                className="poc-icon-btn"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>

          <DialogContent dividers className="poc-dialog-content">
            <Box className="poc-details-code-box">
              {detailsDialogContent.map((item, index) => (
                <Box key={index} className="poc-details-item">
                  <Typography variant="body2" className="poc-details-item-text">
                    {item}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleCopyToClipboard(item)}
                    className="poc-icon-btn"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </DialogContent>

          <DialogActions className="poc-dialog-actions">
            <Button
              onClick={() => handleCopyToClipboard(detailsDialogContent.join("\n"))}
              startIcon={<ContentCopyIcon />}
              className="poc-btn-copy-all"
            >
              Copy All
            </Button>
            <Button
              onClick={handleCloseDetailsDialog}
              variant="contained"
              className="poc-btn-primary"
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
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          className="poc-snackbar"
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            variant="filled"
            className={
              snackbarSeverity === "success" ? "poc-alert-success" : ""
            }
            sx={{ width: "100%", fontSize: "0.9rem" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default Link_Users_To_POC;