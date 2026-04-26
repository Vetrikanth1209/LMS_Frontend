import React, { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  CircularProgress,
  Container,
  Snackbar,
  Alert,
} from "@mui/material"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import Logo from "../assests/Crescent.png"
import { signIn } from "../axios"
import { useNavigate } from "react-router-dom"
import "../styles/ZealousSignIn.css"

export default function ZealousSignIn() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail]               = useState("")
  const [password, setPassword]         = useState("")
  const [isLoading, setIsLoading]       = useState(false)
  const [mounted, setMounted]           = useState(false)
  const [errors, setErrors]             = useState({ email: "", password: "" })
  const [snackbar, setSnackbar]         = useState({ open: false, message: "", severity: "error" })

  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleTogglePassword = () => setShowPassword((prev) => !prev)

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const newErrors = {
      email:    email.trim() === ""   ? "Email is required"    : !emailRegex.test(email) ? "Invalid email format" : "",
      password: password === ""       ? "Password is required" : "",
    }
    setErrors(newErrors)
    return { isValid: !newErrors.email && !newErrors.password, newErrors }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: errors.email || errors.password,
        severity: "error",
      })
      return
    }

    setIsLoading(true)
    const userData = {
      email,
      password,
    }

    try {
      const data = await signIn(userData)
      if (data) {
        setSnackbar({
          open: true,
          message: "Login successful",
          severity: "success",
        })
        localStorage.setItem("isLoggedIn", "true")
        localStorage.setItem("true", JSON.stringify(data))
        setTimeout(() => {
          window.location.assign("/landing")
        }, 1500) // Delay navigation to show success message
      }
    } catch (error) {
      console.error("Login error:", error)
      let errorMessage = "An unexpected error occurred"
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = "User not found"
        } else if (error.response.status === 400) {
          errorMessage = "Invalid password"
        } else if (error.response.status === 500) {
          errorMessage = error.response.data.msg || "Server error"
        }
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSnackbarClose = (_e, reason) => {
    if (reason === "clickaway") return
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  const m = mounted ? "mounted" : ""

  return (
    <div className="signin-page">
      {/* Decorative z-shapes */}
      <div className="z-shape z-shape--1" />
      <div className="z-shape z-shape--2" />
      <div className="z-shape z-shape--3" />
      <div className="z-shape z-shape--4" />

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Card className={`signin-card ${m}`}>
          {/* Dot pattern overlay */}
          <div className="signin-card__dots" />

          {/* Logo header */}
          <div className="signin-header">
            <div className={`signin-header__logo-wrapper ${m}`}>
              <img
                src={Logo}
                alt="Zealous logo"
                className="signin-header__logo"
                data-testid="brand-logo"
              />
            </div>
            <Typography
              variant="h6"
              component="h1"
              className={`signin-header__heading ${m}`}
              data-testid="page-heading"
            >
              Sign in to your account
            </Typography>
          </div>

          {/* Form */}
          <CardContent className="signin-content">
            <form onSubmit={handleSubmit} noValidate>

              <TextField
                fullWidth
                label="Email Address"
                variant="outlined"
                type="email"
                inputMode="email"
                autoComplete="email"
                inputProps={{ "data-testid": "email-input" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                className={`signin-field signin-field--email ${m}`}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={20} color="#38b6ff" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                inputProps={{ "data-testid": "password-input" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
                helperText={errors.password}
                className={`signin-field signin-field--password ${m}`}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={20} color="#38b6ff" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={handleTogglePassword}
                        edge="end"
                        data-testid="toggle-password"
                        className="toggle-password-btn"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                data-testid="submit-button"
                className={`signin-submit ${m}`}
              >
                {isLoading
                  ? <CircularProgress size={24} color="inherit" data-testid="loading-spinner" />
                  : "Sign In"
                }
              </Button>

              <div className={`signin-tagline-wrapper ${m}`}>
                <Typography className="signin-tagline">
                  Learn, Practice, Implement, Career
                </Typography>
              </div>

            </form>
          </CardContent>
        </Card>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          data-testid="snackbar"
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
            data-testid="snackbar-alert"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  )
}