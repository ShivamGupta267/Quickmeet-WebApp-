import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/authContext';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Card,
  IconButton,
  CardContent,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import styled from 'styled-components';

const HistoryPage = () => {

  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const routeTo = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch (error) {
        console.log(error);
      }
    };
    fetchHistory();
  }, [getHistoryOfUser]);

  return (
  <PageContainer>
    <ReturnButton onClick={() => routeTo("/home")}>
      <HomeIcon/>
    </ReturnButton>
    <PageTitle>Meeting History</PageTitle>
    {meetings.length === 0 ? (
      <Typography variant="h6" sx={{ textAlign: 'center', marginTop: '20px' }}>
        No meetings to display.
      </Typography>
    ) : (
      <HistoryList>
        {meetings.map((e, idx) => (
          <StyledCard variant="outlined" key={`${e.meetingCode}-${idx}`}>
            <CardContent>
              <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
                Code : {e.meetingCode}
              </Typography>
              <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
                Date : {formatDate(e.date)}
              </Typography>
            </CardContent>
          </StyledCard>
        ))}
      </HistoryList>
    )}
  </PageContainer>
);
};

// Styled Components
const PageContainer = styled.div`
  background: #f7f9fb;
  min-height: 100vh;
  padding: 32px 0;
`;

const HistoryList = styled.div`
  max-width: 600px;
  margin: 40px auto 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const StyledCard = styled(Card)`
  && {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(60, 113, 255, 0.07);
    transition: box-shadow 0.2s;
    &:hover {
      box-shadow: 0 4px 16px rgba(60, 113, 255, 0.15);
    }
  }
`;

const ReturnButton = styled(IconButton)`
  && {
    position: absolute;
    top: 24px;
    left: 24px;
    background: #f0f1f6;
  }
`;

const PageTitle = styled.h2`
  text-align: center;
  color: #3558a2;
  font-weight: 600;
  font-size: 2rem;
  margin-bottom: 15px;
`;

export default HistoryPage;