import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import VideoCameraFrontRoundedIcon from '@mui/icons-material/VideoCameraFrontRounded';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/authContext';

const NavbarComponent = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Navbar>
      <div className='left-container'>
        <h1>
          <VideoCameraFrontRoundedIcon sx={{ fontSize: 40, color: '#007BFF' }} />
          QuickMeet
        </h1>
      </div>

      <div className='right-container'>
        {user ? (
          <>
            <Button variant="contained" color="secondary" onClick={() => navigate("/history")}>History</Button>
            <Button variant="contained" color="secondary" onClick={logout}>Logout</Button>
          </>
        ) : (
          <>
            <Button variant="contained" onClick={() => navigate('/guest')}>Join as Guest</Button>
            <Button variant="contained" onClick={() => navigate('/register')}>Register</Button>
            <Button variant="contained" onClick={() => navigate('/login')}>Login</Button>
          </>
        )}
      </div>

      <HamburgerButton onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <CloseIcon /> : <MenuIcon />}
      </HamburgerButton>

      {menuOpen && (
        <DropdownMenu>
          {user ? (
            <>
              <Button variant="text" onClick={() => { navigate("/history"); setMenuOpen(false); }}>History</Button>
              <Button variant="text" onClick={() => { logout(); setMenuOpen(false); }}>Logout</Button>
            </>
          ) : (
            <>
              <Button variant="text" onClick={() => { navigate('/guest'); setMenuOpen(false); }}>Join as Guest</Button>
              <Button variant="text" onClick={() => { navigate('/register'); setMenuOpen(false); }}>Register</Button>
              <Button variant="text" onClick={() => { navigate('/login'); setMenuOpen(false); }}>Login</Button>
            </>
          )}
        </DropdownMenu>
      )}
    </Navbar>
  );
};

const Navbar = styled.nav`
  position: relative;
  height: 12%;
  width: 100%;
  background-color: #f8fbff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .left-container {
    h1 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 2rem;
      color: #003366;
    }
  }

  .right-container {
    display: flex;
    gap: 2rem;
  }

  @media (max-width: 768px) {
    .right-container {
      display: none; /* Hide buttons on mobile */
    }
  }
`;

const HamburgerButton = styled(IconButton)`
  display: none !important;
  @media (max-width: 768px) {
    display: flex !important;
    color: #003366;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 2rem;
  background-color: #f8fbff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 0.5rem;
  z-index: 1000;

  button {
    text-align: left;
    justify-content: flex-start;
    color: #003366;
    font-weight: 600;
    text-transform: none;
  }

  @media (min-width: 769px) {
    display: none;
  }
`;

export default NavbarComponent;
