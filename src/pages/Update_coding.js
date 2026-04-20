import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Button, CircularProgress, Alert, Snackbar,
  Stepper, Step, StepLabel, StepConnector, styled, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, useTheme, useMediaQuery, Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import CodeIcon from "@mui/icons-material/Code";
import BugReportIcon from "@mui/icons-material/BugReport";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import { stepConnectorClasses } from "@mui/material/StepConnector";
import Admin_Dashboard from "../components/AdminDash";
import { fetchAllCodes, fetchAllTestCases, updateCode } from "../axios";
import { useNavigate } from "react-router-dom";
import "../styles/Update_Coding.css";

const isValidUUID = (id) => {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 20, left: "calc(-50% + 28px)", right: "calc(50% + 28px)" },
  [`&.${stepConnectorClasses.active}`]: { [`& .${stepConnectorClasses.line}`]: { background: "linear-gradient(90deg, #0c83c8, #fc7a46)" } },
  [`&.${stepConnectorClasses.completed}`]: { [`& .${stepConnectorClasses.line}`]: { background: "linear-gradient(90deg, #0c83c8, #fc7a46)" } },
  [`& .${stepConnectorClasses.line}`]: { height: 4, border: 0, backgroundColor: theme.palette.grey[300], borderRadius: 2 },
}));

const ColorlibStepIconRoot = styled("div")(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.grey[300],
  zIndex: 1, color: "#fff", width: 48, height: 48,
  display: "flex", borderRadius: "50%", justifyContent: "center", alignItems: "center",
  transition: "all 0.3s ease",
  ...(ownerState?.active || ownerState?.completed
    ? { background: "linear-gradient(90deg, #0c83c8, #fc7a46)", boxShadow: "0 4px 12px rgba(12, 131, 200, 0.3)" }
    : {}),
}));

function ColorlibStepIcon({ active = false, completed = false, className, icon }) {
  const icons = { 1: <CodeIcon />, 2: <BugReportIcon />, 3: <SaveIcon /> };
  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {icons[String(icon)]}
    </ColorlibStepIconRoot>
  );
}

const steps = ["Select Code", "Select Test Cases", "Review and Confirm"];

const buildCodeRows = (arr) =>
  arr.filter((i) => isValidUUID(i.code_id)).map((i) => ({
    id: i.code_id,
    code_id: i.code_id || "N/A",
    problem: i.code_problem_statement || "N/A",
    testCasesCount: Array.isArray(i.code_test_cases_id) ? i.code_test_cases_id.length
      : Array.isArray(i.code_test_cases) ? i.code_test_cases.length : 0,
    tags: Array.isArray(i.code_tags) ? [...new Set(i.code_tags)] : [],
    createdAt: i.createdAt && !isNaN(new Date(i.createdAt)) ? new Date(i.createdAt).toLocaleString() : "N/A",
    updatedAt: i.updatedAt && !isNaN(new Date(i.updatedAt)) ? new Date(i.updatedAt).toLocaleString() : "N/A",
  }));

const extractArray = (res) =>
  Array.isArray(res.data) ? res.data
    : Array.isArray(res.data?.codes) ? res.data.codes
    : Array.isArray(res.codes) ? res.codes : [];

const Update_coding = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [codeRows, setCodeRows] = useState([]);
  const [testcaseRows, setTestcaseRows] = useState([]);
  const [selectedCodeId, setSelectedCodeId] = useState(null);
  const [selectedTestcaseIds, setSelectedTestcaseIds] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState({ codes: true, testcases: true, update: false });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const showSnackbar = (message, severity = "error") => setSnackbar({ open: true, message, severity });

  useEffect(() => {
    try {
      const codeId = JSON.parse(localStorage.getItem("selectedCodeId"));
      const testcaseIds = JSON.parse(localStorage.getItem("selectedTestcaseIds")) || [];
      if (codeId && isValidUUID(codeId)) setSelectedCodeId(codeId);
      else if (codeId) localStorage.removeItem("selectedCodeId");
      setSelectedTestcaseIds(Array.isArray(testcaseIds) ? testcaseIds.filter(isValidUUID) : []);
    } catch {
      showSnackbar("Failed to load saved selections.");
      localStorage.removeItem("selectedCodeId");
      localStorage.removeItem("selectedTestcaseIds");
    }
  }, []);

  useEffect(() => () => {
    localStorage.removeItem("selectedCodeId");
    localStorage.removeItem("selectedTestcaseIds");
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAllCodes();
        const rows = buildCodeRows(extractArray(res));
        setCodeRows(rows);
        if (!rows.length) showSnackbar("No valid codes found.", "warning");
      } catch (e) {
        showSnackbar(`Failed to fetch code data: ${e.message || "Unknown error"}`);
      } finally {
        setLoading((p) => ({ ...p, codes: false }));
      }
      try {
        const res = await fetchAllTestCases();
        const arr = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
        const rows = arr.filter((i) => isValidUUID(i.testcase_id)).map((i) => ({
          id: i.testcase_id,
          testcase_id: i.testcase_id || "N/A",
          input: Array.isArray(i.testcase_input) ? i.testcase_input.join(", ") : i.testcase_input || "N/A",
          output: Array.isArray(i.testcase_output) ? i.testcase_output.join(", ") : i.testcase_output || "N/A",
          tags: Array.isArray(i.testcase_tags) ? [...new Set(i.testcase_tags)] : [],
        }));
        setTestcaseRows(rows);
        if (!rows.length) showSnackbar("No valid test cases found.", "warning");
      } catch (e) {
        showSnackbar(`Failed to fetch test cases: ${e.message || "Unknown error"}`);
      } finally {
        setLoading((p) => ({ ...p, testcases: false }));
      }
    })();
  }, []);

  const handleNext = () => {
    if (activeStep === 0 && !selectedCodeId) return showSnackbar("Please select exactly one code.");
    if (activeStep === 0 && !isValidUUID(selectedCodeId)) {
      setSelectedCodeId(null); localStorage.removeItem("selectedCodeId");
      return showSnackbar("Selected code ID is not a valid UUID.");
    }
    if (activeStep === 1 && !selectedTestcaseIds.length) return showSnackbar("Please select at least one test case.");
    if (activeStep === 1) {
      const bad = selectedTestcaseIds.filter((id) => !isValidUUID(id));
      if (bad.length) {
        const valid = selectedTestcaseIds.filter(isValidUUID);
        setSelectedTestcaseIds(valid); localStorage.setItem("selectedTestcaseIds", JSON.stringify(valid));
        return showSnackbar(`Invalid test case ID(s): ${bad.join(", ")}`);
      }
    }
    if (activeStep === steps.length - 1) { setPreviewDialogOpen(true); return; }
    setActiveStep((p) => p + 1);
  };

  const handlePrevious = () => setActiveStep((p) => p - 1);
  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const handleConfirmAssociation = async () => {
    if (!selectedCodeId || !selectedTestcaseIds.length) return showSnackbar("Missing required selections.");
    setLoading((p) => ({ ...p, update: true }));
    try {
      const code = codeRows.find((r) => r.id === selectedCodeId);
      if (!code) throw new Error("Selected code not found");
      await updateCode({ code_id: code.id, code_test_cases_id: selectedTestcaseIds.filter(isValidUUID) });
      showSnackbar("Code association updated successfully!", "success");
      const res = await fetchAllCodes();
      setCodeRows(buildCodeRows(extractArray(res)));
      setPreviewDialogOpen(false); setSelectedCodeId(null); setSelectedTestcaseIds([]);
      localStorage.removeItem("selectedCodeId"); localStorage.removeItem("selectedTestcaseIds");
      setActiveStep(0);
    } catch (e) {
      showSnackbar(`Error: ${e.response?.data?.msg || e.message || "Failed to update"}`);
    } finally {
      setLoading((p) => ({ ...p, update: false }));
    }
  };

  const renderTagChips = (tags) => {
    if (!Array.isArray(tags) || !tags.length)
      return <Typography className="no-tags-text">No tags</Typography>;
    return tags.map((tag, i) => (
      <Tooltip title={tag} key={i}>
        <Chip label={tag.trim()} size="small" className="tag-chip" />
      </Tooltip>
    ));
  };

  const colHeader = (label) => (
    <Box className="col-header">
      <Typography variant="inherit" className="col-header-text">{label}</Typography>
    </Box>
  );

  const codeColumns = [
    { field: "problem", headerName: "Problem Statement", minWidth: 300, flex: 2, renderHeader: () => colHeader("Problem Statement") },
    { field: "testCasesCount", headerName: "No of Test Cases", minWidth: 150, flex: 1, renderHeader: () => colHeader("No of Test Cases") },
    { field: "tags", headerName: "Tags", minWidth: 200, flex: 1, renderHeader: () => colHeader("Tags"), renderCell: (p) => <Box className="tag-cell">{renderTagChips(p.value)}</Box> },
  ];

  const testcaseColumns = [
    { field: "input", headerName: "Input", minWidth: 200, flex: 1, renderHeader: () => colHeader("Input") },
    { field: "output", headerName: "Output", minWidth: 200, flex: 1, renderHeader: () => colHeader("Output") },
    { field: "tags", headerName: "Tags", minWidth: 200, flex: 1, renderHeader: () => colHeader("Tags"), renderCell: (p) => <Box className="tag-cell">{renderTagChips(p.value)}</Box> },
  ];

  const selectedCode = codeRows.find((r) => r.id === selectedCodeId);
  const selectedTestcases = testcaseRows.filter((r) => selectedTestcaseIds.includes(r.id));

  return (
    <>
      <Admin_Dashboard />
      <Box className="page-wrapper">

        <Paper className="header-paper">
          <Paper className="header-banner">
            <Box className="header-title-row">
              <CodeIcon className="header-icon" />
              <Typography variant={isMobile ? "h6" : "h5"} className="header-title">
                Update Code Associations
              </Typography>
            </Box>
            <Typography variant="subtitle2" className="header-subtitle">
              Manage code and test case assignments
            </Typography>
          </Paper>
          <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />} className="stepper">
            {steps.map((label) => (
              <Step key={label}><StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel></Step>
            ))}
          </Stepper>
        </Paper>

        <Paper className="content-paper">

          {activeStep === 0 && (
            <Box className="step-box">
              <Box className="step-title-row">
                <Typography variant="h6" className="gradient-text step-title">Select Code</Typography>
                <Tooltip title="Add a new code">
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/add_coding")} className="btn-submit">Add Code</Button>
                </Tooltip>
              </Box>
              <Box className="datagrid-wrapper">
                {loading.codes ? <Box className="loader-box"><CircularProgress className="loader" /></Box>
                  : !codeRows.length ? <Typography className="empty-text">No valid codes available.</Typography>
                  : (
                    <DataGrid rows={codeRows} columns={codeColumns}
                      initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                      pageSizeOptions={[10, 20, 50]} getRowId={(r) => r.id}
                      checkboxSelection disableMultipleRowSelection
                      rowSelectionModel={selectedCodeId ? [selectedCodeId] : []}
                      onRowSelectionModelChange={(sel) => {
                        const id = sel.length ? sel[0] : null;
                        if (id && !isValidUUID(id)) return showSnackbar("Code ID is not a valid UUID.");
                        setSelectedCodeId(id); localStorage.setItem("selectedCodeId", JSON.stringify(id));
                      }}
                      className="styled-datagrid" isRowSelectable={(p) => isValidUUID(p.row.id)}
                    />
                  )}
              </Box>
              <Box className="step-actions step-actions--end">
                <Button variant="contained" onClick={handleNext} disabled={!selectedCodeId || loading.codes} className="btn-submit">Next</Button>
              </Box>
            </Box>
          )}

          {activeStep === 1 && (
            <Box className="step-box">
              <Box className="step-title-row">
                <Typography variant="h6" className="gradient-text step-title">Select Test Cases</Typography>
                <Tooltip title="Add a new test case">
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/add_testcase")} className="btn-submit">Add Test Case</Button>
                </Tooltip>
              </Box>
              <Box className="datagrid-wrapper">
                {loading.testcases ? <Box className="loader-box"><CircularProgress className="loader" /></Box>
                  : !testcaseRows.length ? <Typography className="empty-text">No valid test cases available.</Typography>
                  : (
                    <DataGrid rows={testcaseRows} columns={testcaseColumns}
                      initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                      pageSizeOptions={[10, 20, 50]} getRowId={(r) => r.id}
                      checkboxSelection rowSelectionModel={selectedTestcaseIds}
                      onRowSelectionModelChange={(sel) => {
                        const bad = sel.filter((id) => !isValidUUID(id));
                        if (bad.length) return showSnackbar(`Invalid test case ID(s): ${bad.join(", ")}`);
                        setSelectedTestcaseIds(sel); localStorage.setItem("selectedTestcaseIds", JSON.stringify(sel));
                      }}
                      className="styled-datagrid" isRowSelectable={(p) => isValidUUID(p.row.id)}
                    />
                  )}
              </Box>
              <Box className="step-actions step-actions--between">
                <Button variant="outlined" onClick={handlePrevious} className="btn-outlined">Previous</Button>
                <Button variant="contained" onClick={handleNext} disabled={!selectedTestcaseIds.length || loading.testcases} className="btn-submit">Next</Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box className="step-box">
              <Typography variant="h6" className="gradient-text step-title">Review and Confirm</Typography>
              <Typography variant="body1" className="review-subtitle">
                Please review your selections below before confirming the update.
              </Typography>

              <Box className="review-card">
                <Typography variant="subtitle1" className="review-card__heading">Selected Code</Typography>
                {selectedCode ? (
                  <Box className="review-card__body">
                    <Typography variant="body2" className="review-detail"><strong>Code ID:</strong> {selectedCode.code_id || "N/A"}</Typography>
                    <Typography variant="body2" className="review-detail"><strong>Problem:</strong> {selectedCode.problem || "N/A"}</Typography>
                    <Typography variant="body2" className="review-detail"><strong>No of Test Cases:</strong> {selectedCode.testCasesCount || 0}</Typography>
                    <Typography variant="body2" className="review-detail"><strong>Tags:</strong></Typography>
                    <Box className="tag-cell">{renderTagChips(selectedCode.tags)}</Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="error" className="review-detail">No Code selected</Typography>
                )}
              </Box>

              <Box className="review-card">
                <Typography variant="subtitle1" className="review-card__heading">
                  Selected Test Cases ({selectedTestcases.length})
                </Typography>
                {selectedTestcases.length ? (
                  <TableContainer className="review-table-container">
                    <Table size="small">
                      <TableHead>
                        <TableRow className="review-table-head-row">
                          {["Test Case ID", "Input", "Output", "Tags"].map((h) => (
                            <TableCell key={h} className="review-table-head-cell">{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedTestcases.map((tc) => (
                          <TableRow key={tc.id}>
                            <TableCell className="review-table-cell">
                              <Tooltip title={isValidUUID(tc.testcase_id) ? "Valid UUID" : "Invalid UUID"}>
                                <Typography variant="body2" className={isValidUUID(tc.testcase_id) ? "" : "invalid-uuid"}>
                                  {tc.testcase_id || "N/A"}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="review-table-cell">{tc.input || "N/A"}</TableCell>
                            <TableCell className="review-table-cell">{tc.output || "N/A"}</TableCell>
                            <TableCell><Box className="tag-cell">{renderTagChips(tc.tags)}</Box></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="error" className="review-detail">No Test Cases selected</Typography>
                )}
              </Box>

              <Box className="step-actions step-actions--between">
                <Button variant="outlined" onClick={handlePrevious} className="btn-outlined">Previous</Button>
                <Button variant="contained" onClick={handleNext} className="btn-submit">Confirm</Button>
              </Box>
            </Box>
          )}
        </Paper>

        <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ className: "dialog-paper" }}>
          <DialogTitle className="dialog-title">Confirm Code Association</DialogTitle>
          <DialogContent dividers className="dialog-content">
            <DialogContentText className="dialog-content-text">Review the changes below:</DialogContentText>
            {selectedCode && (
              <Box className="dialog-detail-box">
                <Typography variant="body2" className="review-detail"><strong>Code ID:</strong> {selectedCode.code_id || "Unknown"}</Typography>
                <Typography variant="body2" className="review-detail"><strong>Problem:</strong> {selectedCode.problem || "Unknown"}</Typography>
              </Box>
            )}
            {selectedTestcases.length > 0 && (
              <Box className="dialog-detail-box">
                <Typography variant="body2" className="review-detail"><strong>Test Cases:</strong> {selectedTestcases.length} selected</Typography>
                {selectedTestcases.map((tc) => (
                  <Typography key={tc.id} variant="body2" className="dialog-tc-item">
                    - {tc.testcase_id} {isValidUUID(tc.testcase_id) ? "" : "(Invalid UUID)"}
                  </Typography>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions className="dialog-actions">
            <Button onClick={() => setPreviewDialogOpen(false)} className="btn-dialog-cancel">Cancel</Button>
            <Button variant="contained" onClick={handleConfirmAssociation} disabled={loading.update}
              startIcon={loading.update ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              className="btn-submit">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled"
            className={`alert ${snackbar.severity === "success" ? "alert--success" : ""}`}>
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Box>
    </>
  );
};

export default Update_coding;