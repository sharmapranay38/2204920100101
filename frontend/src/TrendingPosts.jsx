import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Avatar, Grid, CircularProgress, Alert } from '@mui/material';

function TrendingPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5001/posts?type=popular')
      .then(res => res.json())
      .then(data => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(true);
        setLoading(false);
        console.error('Frontend fetch error:', err);
      });
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">Failed to load trending posts. Please try again later.</Alert>;

  return (
    <div>
      <h2>Trending Posts</h2>
      <Grid container spacing={2}>
        {posts.map((post, idx) => (
          <Grid item xs={12} md={6} lg={4} key={post.id}>
            <Card>
              <CardContent>
                <Avatar
                  src={`/${(idx % 5) + 1}.jpg`}
                  alt={post.content}
                  sx={{ width: 56, height: 56, mb: 1 }}
                />
                <Typography variant="h6">Post ID: {post.id}</Typography>
                <Typography>{post.content}</Typography>
                {post.commentCount !== undefined && (
                  <Typography color="text.secondary">
                    Comments: {post.commentCount}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
}

export default TrendingPosts; 