import React from 'react';
import styled from 'styled-components';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import NavbarComponent from './Navbar';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <OuterDiv>
      <NavbarComponent />
      <InnerDiv>
        <div className="text-side">
          <h1>Connect. Collaborate. Communicate.</h1>
          <h2>Welcome to QuickMeet — your seamless video meeting solution.</h2>
          <Button
            variant="contained"
            sx={{ width: 'fit-content' }}
            onClick={() => navigate('/home')}
          >
            Get Started
          </Button>
        </div>
        <div className="image-side">
          <img src="/img1.png" alt="Video Meeting" />
        </div>
      </InnerDiv>
    </OuterDiv>
  );
};

const OuterDiv = styled.div`
  height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #e6f0ff, #ffffff);
  overflow: hidden;
`;

const InnerDiv = styled.div`
  display: flex;
  flex-wrap: nowrap;
  height: 88%;
  width: 100%;
  align-items: center;
  justify-content: space-evenly;
  padding: 2rem;

  .text-side {
    width: 50%;
    color: #002244;

    h1 {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    h2 {
      font-size: 1.4rem;
      color: #555;
      margin-bottom: 2rem;
    }

    button {
      font-size: medium;
    }
  }

  .image-side {
    width: 40%;

    img {
      width: 100%;
      height: auto;
    }
  }

  /* ✅ Mobile responsiveness with wrap-reverse */
  @media (max-width: 768px) {
    flex-wrap: wrap-reverse;
    justify-content: center;
    align-items: center;
    padding: 1rem;

    .text-side,
    .image-side {
      width: 90%;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .text-side{
      margin-bottom: 8rem;
    }

    .text-side h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .text-side h2 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }

    .text-side button {
      margin-top: 12px;
      margin-left: 0;
    }

    .image-side img {
      width: 100%;
      height: auto;
      display: block;
    }
  }
`;

export default LandingPage;
