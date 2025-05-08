import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Avatar, Grid, CircularProgress, Alert } from '@mui/material';

function TopUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5001/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(true);
        setLoading(false);
        console.error('Frontend fetch error:', err);
      });
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">Failed to load top users. Please try again later.</Alert>;

  return (
    <div>
      <h2>Top Users</h2>
      <Grid container spacing={2}>
        {users.map((user, idx) => (
          <Grid item xs={12} md={6} lg={4} key={user.userid}>
            <Card>
              <CardContent>
                <Avatar
                  src={`/${(idx % 5) + 1}.jpg`}
                  alt={user.name}
                  sx={{ width: 56, height: 56, mb: 1 }}
                />
                <Typography variant="h6">{user.name}</Typography>
                <Typography color="text.secondary">
                  Comments on posts: {user.commentCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default TopUsers; 