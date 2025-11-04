import React, { useState, useContext } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/authContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ✅ CORRECTED THIS FUNCTION
  const handleLogin = () => { // No longer needs to be async
    const newErrors = {};
    if (!form.username.trim()) newErrors.username = 'Username is required';
    if (!form.password.trim()) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Just call the login function from the context.
    // It will handle alerts and navigation internally.
    login(form);
  };

  return (
    <Box
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ background: 'linear-gradient(135deg, #f0f8ff, #ffffff)' }}
    >
      <Paper elevation={3} sx={{ p: 4, width: 400, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ color: '#003366' }}>
          Login
        </Typography>

        <TextField
          fullWidth
          required
          label="Username"
          name="username"
          margin="normal"
          onChange={handleChange}
          error={!!errors.username}
          helperText={errors.username}
        />
        <TextField
          fullWidth
          required
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          margin="normal"
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((prev) => !prev)}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 3, backgroundColor: '#007BFF' }}
          onClick={handleLogin}
        >
          Login
        </Button>

        <Typography
          align="center"
          sx={{ mt: 2, fontSize: '0.9rem', cursor: 'pointer', color: '#007BFF' }}
          onClick={() => navigate('/register')}
        >
          Don’t have an account? Register
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;
