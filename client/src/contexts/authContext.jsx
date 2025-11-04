// context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const AuthContext = createContext();
const serverURL = import.meta.env.VITE_API_URL



export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios
        .get(`${serverURL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUser(res.data.user))
        .catch(() => {
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
        });
    }
  }, [token]);

  const signup = async (formData) => {
    try {
      const res = await axios.post(`${serverURL}/api/user/signup` , formData);
      
      // ✅ Handle alert and navigation directly here
      alert(res.data.message); 
      navigate('/login'); // Redirect to login after successful signup

    } catch (err) {
      // ✅ Handle error alert here
      alert(err.response?.data?.message || 'Signup failed');
    }
  };

  const login = async (formData) => {
    try {
      const res = await axios.post(`${serverURL}/api/user/login`, formData);
      const { token, user, message } = res.data;

      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);

      // ✅ Handle alert and navigation directly here
      alert(message);
      navigate('/home'); // Navigate to a protected route after login

    } catch (err) {
      // ✅ Handle error alert here
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    navigate('/');
  };

  const getHistoryOfUser = async () => {
    try {
      let request = await axios.get(`${serverURL}/api/user/get_all_activity`, {
        params: {
          token: localStorage.getItem("token")
        }
      })
      return request.data
    } catch (error) {
      throw error
    }
  }

  const addToUserHistory = async (meetingCode) => {
    try {
      let request = await axios.post(`${serverURL}/api/user/add_to_activity`, {
          token: localStorage.getItem("token"),
          meetingCode: meetingCode,
      })
      return request
    } catch (error) {
      throw error
    }
  }

  

  return (
    <AuthContext.Provider value={{ user, token, signup, login, logout , getHistoryOfUser , addToUserHistory }}>
      {children}
    </AuthContext.Provider>
  );
};