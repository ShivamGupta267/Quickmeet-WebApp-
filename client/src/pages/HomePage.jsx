import React, { useState, useEffect, useContext } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import NavbarComponent from './Navbar';
import styled from 'styled-components';
import { TextField, Button } from '@mui/material';
import { AuthContext } from '../contexts/authContext';

const HomePage = () => {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');
  const { addToUserHistory  } = useContext(AuthContext);

  let handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) {
      alert('Please enter a valid meeting code.');
      return;
    }
    await addToUserHistory(meetingCode);
    console.log(addToUserHistory);
    navigate(`/${meetingCode}`);
  };

  return (
    <OuterDiv>
      <NavbarComponent />
      <InnerDiv>
        <div className="text-side">
          <h1>Ready to connect? Enter your meeting code and join instantly.</h1>
          <TextField
            onChange={(e) => setMeetingCode(e.target.value)}
            required
            label="Meeting Code"
            name="meetingcode"
            id="outline-required"
          />
          <Button
            variant="contained"
            color="secondary"
            sx={{ width: 'fit-content' }}
            onClick={handleJoinVideoCall}
          >
            JOIN
          </Button>
        </div>
        <div className="image-side">
          <img src="/homepagelogo.png" alt="Video Meeting" />
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

    button {
      margin-left: 12px;
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

  /* ✅ Responsive layout with wrap-reverse */
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
    }

    .text-side {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;

      h1 {
        font-size: 2rem;
        margin-bottom: 1rem;
      }

      button {
        margin-top: 12px;
        margin-left: 0;
      }
    }

    .image-side img {
      width: 100%;
      height: auto;
      display: block;
    }
  }
`;

export default withAuth(HomePage);
