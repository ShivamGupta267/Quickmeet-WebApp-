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
import { AuthContext } from '../contexts/authContext';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const { signup } = useContext(AuthContext);
  const [form, setForm] = useState({ name: '', username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate()

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSignup = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.username.trim()) newErrors.username = 'Username is required';
    if (!form.password.trim()) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    signup(form); // 🔥 Use context logic
  };

  return (
    <Box
      
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ background: 'linear-gradient(135deg, #e6f0ff, #ffffff)' }}
    >
      <Paper elevation={3} sx={{ p: 4, width: 400, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ color: '#003366' }}>
          Create Account
        </Typography>

        <TextField
          required
          fullWidth
          label="Full Name"
          name="name"
          margin="normal"
          onChange={handleChange}
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          required
          fullWidth
          label="Username"
          name="username"
          margin="normal"
          onChange={handleChange}
          error={!!errors.username}
          helperText={errors.username}
        />
        <TextField
          required
          fullWidth
          label="Password"
          name="password"
          margin="normal"
          type={showPassword ? 'text' : 'password'}
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
          color="primary"
          sx={{ mt: 3 }}
          onClick={handleSignup}
        >
          Sign Up
        </Button>
        <Typography
                  align="center"
                  sx={{ mt: 2, fontSize: '0.9rem', cursor: 'pointer', color: '#007BFF' }}
                  onClick={() => navigate('/login')}
                >
                  Already have an Accout ! Login .
                </Typography>
      </Paper>
    </Box>
  );
};

export default Signup;
