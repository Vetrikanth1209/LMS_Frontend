import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Grid,
  Alert,
} from "@mui/material";
import { Clock, Award } from "lucide-react";
import { fetchModuleAndPoc, getTestById } from "../axios";
import "../styles/TestModules.css";

const TestModule = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchTests = useCallback(async (userId) => {
    setLoading(true);
    try {
      const response = await fetchModuleAndPoc(userId);
      console.log("Fetched tests:", response.test_ids);

      if (response?.mod_id) {
        localStorage.setItem("mod_id", response.mod_id);
      }

      if (response?.test_ids?.length) {
        const testDetails = await Promise.all(
          response.test_ids.map((testId) => getTestById(testId))
        );
        setTests(testDetails);
      } else {
        setTests([]);
        setError("No tests available.");
      }
    } catch (err) {
      console.error("Error fetching tests:", err);
      setError("Failed to load tests.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("true");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user?.user?.user_id) {
          fetchTests(user.user.user_id);
        }
      } catch (error) {
        console.error("Error parsing user:", error);
      }
    }
  }, [fetchTests]);

  return (
    <Container maxWidth="md" sx={{ py: 5 }}>

      <Typography variant="h4" gutterBottom className="tm-title">
        Test Modules
      </Typography>

      {loading ? (

        <Box className="tm-loading">
          <CircularProgress />
        </Box>

      ) : error ? (

        <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>

      ) : (

        <Grid container spacing={3} justifyContent="center">
          {tests.map((test) => {
            const hasMCQs =
              Array.isArray(test.test_mcq_id) && test.test_mcq_id.length > 0;

            return (
              <Grid item xs={12} sm={6} md={4} key={test.test_id}>
                <Card className="tm-card">
                  <CardContent>

                    <Typography variant="h6" className="tm-card-name">
                      {test.test_name}
                    </Typography>

                    <Box className="tm-card-info-row">
                      <Clock size={18} className="tm-icon-clock" />
                      <Typography variant="body2" className="tm-card-info-text">
                        {test.duration || "60 mins"}
                      </Typography>
                    </Box>

                    <Box className="tm-card-info-row">
                      <Award size={18} className="tm-icon-award" />
                      <Typography variant="body2" className="tm-card-info-text">
                        {test.difficulty || "Medium"}
                      </Typography>
                    </Box>

                  </CardContent>

                  <Button
                    variant="contained"
                    className="tm-btn-start"
                    onClick={() => {
                      if (hasMCQs) {
                        navigate(`/mcq-test/${test.test_id}`, {
                          state: {
                            testMcqIds: test.test_mcq_id,
                            testTotalScore: test.test_total_score,
                          },
                        });
                      } else {
                        console.error("No MCQs for this test");
                      }
                    }}
                    disabled={!hasMCQs}
                  >
                    Start Test
                  </Button>
                </Card>
              </Grid>
            );
          })}
        </Grid>

      )}
    </Container>
  );
};

export default TestModule;