import express from 'express'
import axios from 'axios'
import dotenv from 'dotenv'
import cors from 'cors'

// ------------------------------------------------


const app = express()
app.use(cors())

// dotenv.config()
// const AUTH_TOKEN = process.env.AUTH_TOKEN

// auth token is getting expired again and again, so i am using a static token

const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ2NjkxNjIzLCJpYXQiOjE3NDY2OTEzMjMsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImJiZWRlOTZiLWRiM2UtNGE4MC05YmJmLTQ2MTAzZTg1NjlmMSIsInN1YiI6InNoYXJtYXByYW5heTM4QGdtYWlsLmNvbSJ9LCJlbWFpbCI6InNoYXJtYXByYW5heTM4QGdtYWlsLmNvbSIsIm5hbWUiOiJwcmFuYXkgc2hhcm1hIiwicm9sbE5vIjoiMjIwNDkyMDEwMDEwMSIsImFjY2Vzc0NvZGUiOiJiYXFoV2MiLCJjbGllbnRJRCI6ImJiZWRlOTZiLWRiM2UtNGE4MC05YmJmLTQ2MTAzZTg1NjlmMSIsImNsaWVudFNlY3JldCI6ImpLd0VRUlJDWGJ3ZHNzQlIifQ.Tv_EYmwOt1CNcZsh7DVSvCyiTd1ip42w7CalNqhMHis"
const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`
};
//main page
app.get('/', (req, res) => {
  res.send('home page');
});

//users page
app.get('/test-users', async (req, res) => {
  try {
    const usersRes = await axios.get('http://20.244.56.144/evaluation-service/users', { headers });
    res.json(usersRes.data);
  } catch (error) {
    console.error(error.message, error.response?.data);
    res.status(500).json({ error: "Proxy failed" });
  }
});

// cache to prebvent rate limit
let topUsersCache = null;
let topUsersCacheTime = 0;
let popularPostsCache = null;
let popularPostsCacheTime = 0;

app.get('/users', async (req, res) => {
  const now = Date.now();
  if (topUsersCache && now - topUsersCacheTime < 60000) {
    return res.json({ users: topUsersCache });
  }
  try {
    const usersRes = await axios.get('http://20.244.56.144/evaluation-service/users', { headers });
    const usersObj = usersRes.data.users || {};
    const userIds = Object.keys(usersObj).slice(0, 5); // Up to 5 users
    const userPostsMap = {};
    for (const userid of userIds) {
      const postsRes = await axios.get(`http://20.244.56.144/evaluation-service/users/${userid}/posts`, { headers });
      userPostsMap[userid] = (postsRes.data.posts || []).slice(0, 5); // Limit to 5 posts per user
    }
    const userCommentCounts = {};
    let commentRequestCount = 0;
    for (const userid of userIds) {
      let totalComments = 0;
      for (const post of userPostsMap[userid]) {
        try {
          commentRequestCount++;
          const commentsRes = await axios.get(
            `http://20.244.56.144/evaluation-service/posts/${post.id}/comments`,
            { headers }
          );
          const comments = commentsRes.data.comments || [];
          totalComments += comments.length;
        } catch (err) {}
      }
      userCommentCounts[userid] = totalComments;
    }
    console.log('Total comment requests:', commentRequestCount);
    const sortedUserIds = userIds.sort((a, b) => userCommentCounts[b] - userCommentCounts[a]);
    const topUserIds = sortedUserIds.slice(0, 5);
    const topUsers = topUserIds.map(userid => ({
      userid,
      name: usersObj[userid],
      commentCount: userCommentCounts[userid]
    }));
    topUsersCache = topUsers;
    topUsersCacheTime = now;
    res.json({ users: topUsers });
  } catch (error) {
    console.error('Error:', error.message, error.response?.data);
    res.status(500).json({ error: "Internal server error" });
  }
});

//posts page
app.get('/posts', async (req, res) => {
  const { type } = req.query;
  if (type !== 'latest' && type !== 'popular') {
    return res.status(400).json({ error: 'Accepted values for type are latest or popular.' });
  }
  try {
    const usersRes = await axios.get('http://20.244.56.144/evaluation-service/users', { headers });
    const users = usersRes.data.users || {};
    const postUserIds = Object.keys(users).slice(0, 5); // Up to 5 users
    let allPosts = [];
    for (const userid of postUserIds) {
      const postsRes = await axios.get(`http://20.244.56.144/evaluation-service/users/${userid}/posts`, { headers });
      allPosts = allPosts.concat((postsRes.data.posts || []).slice(0, 5)); // Limit to 5 posts per user
    }
    if (type === 'latest') {
      if (allPosts.length > 0 && allPosts[0].timestamp) {
        allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      const latestPosts = allPosts.slice(0, 5);
      return res.json({ posts: latestPosts });
    }
    // Caching for popular posts
    const now = Date.now();
    if (popularPostsCache && now - popularPostsCacheTime < 60000) {
      return res.json({ posts: popularPostsCache });
    }
    const commentCounts = [];
    for (const post of allPosts) {
      try {
        const commentsRes = await axios.get(
          `http://20.244.56.144/evaluation-service/posts/${post.id}/comments`,
          { headers }
        );
        const comments = commentsRes.data.comments || [];
        commentCounts.push({ post, count: comments.length });
      } catch (err) {
        commentCounts.push({ post, count: 0 });
      }
    }
    const maxCount = Math.max(...commentCounts.map(pc => pc.count));
    const popularPosts = commentCounts.filter(pc => pc.count === maxCount).map(pc => pc.post);
    popularPostsCache = popularPosts;
    popularPostsCacheTime = now;
    res.json({ posts: popularPosts });
  } catch (error) {
    console.error('Error fetching posts:', error.message, error.response?.data);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/ping', (req, res) => res.send('pong'));

app.listen(5001, () => {
  console.log('Server is running on port 5001');
});

// ------------------------------------------------



