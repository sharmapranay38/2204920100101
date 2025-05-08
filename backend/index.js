import express from 'express'
import axios from 'axios'
import dotenv from 'dotenv'

// ------------------------------------------------


const app = express()

// dotenv.config()
// const AUTH_TOKEN = process.env.AUTH_TOKEN

// auth token is getting expired again and again, so i am using a static token

const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ2Njg4MDUxLCJpYXQiOjE3NDY2ODc3NTEsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImJiZWRlOTZiLWRiM2UtNGE4MC05YmJmLTQ2MTAzZTg1NjlmMSIsInN1YiI6InNoYXJtYXByYW5heTM4QGdtYWlsLmNvbSJ9LCJlbWFpbCI6InNoYXJtYXByYW5heTM4QGdtYWlsLmNvbSIsIm5hbWUiOiJwcmFuYXkgc2hhcm1hIiwicm9sbE5vIjoiMjIwNDkyMDEwMDEwMSIsImFjY2Vzc0NvZGUiOiJiYXFoV2MiLCJjbGllbnRJRCI6ImJiZWRlOTZiLWRiM2UtNGE4MC05YmJmLTQ2MTAzZTg1NjlmMSIsImNsaWVudFNlY3JldCI6ImpLd0VRUlJDWGJ3ZHNzQlIifQ.bIlwLZdl2NVc7_1flrerU9a8E084XD2TQZmLGqhIkQo"

const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`
};
//main page
app.get('/', (req, res) => {
  res.send('home page');
});

//users page
app.get('/users', async (req, res) => {
  try {
    const usersRes = await axios.get('http://20.244.56.144/evaluation-service/users', { headers });
    const usersObj = usersRes.data.users || {};
    const userIds = Object.keys(usersObj);
    const postsResults = await Promise.all(
      userIds.map(userid =>
        axios.get(`http://20.244.56.144/evaluation-service/users/${userid}/posts`, { headers })
      )
    );
    const userPostsMap = {};
    userIds.forEach((userid, idx) => {
      userPostsMap[userid] = postsResults[idx].data.posts || [];
    });
    const userCommentCounts = {};
    await Promise.all(userIds.map(async userid => {
      let totalComments = 0;
      await Promise.all(userPostsMap[userid].map(async post => {
        try {
          const commentsRes = await axios.get(
            `http://20.244.56.144/evaluation-service/posts/${post.id}/comments`,
            { headers }
          );
          const comments = commentsRes.data.comments || [];
          totalComments += comments.length;
        } catch (err) {
        }
      }));
      userCommentCounts[userid] = totalComments;
    }));
    const sortedUserIds = userIds.sort((a, b) => userCommentCounts[b] - userCommentCounts[a]);
    const topUserIds = sortedUserIds.slice(0, 5);
    const topUsers = topUserIds.map(userid => ({
      userid,
      name: usersObj[userid],
      commentCount: userCommentCounts[userid]
    }));
    res.json({ users: topUsers });
  } catch (error) {
    console.error('Error fetching top users:', error.message);
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
    const userIds = Object.keys(users);
    const postsPromises = userIds.map(userid =>
      axios.get(`http://20.244.56.144/evaluation-service/users/${userid}/posts`, { headers })
    );
    const postsResults = await Promise.all(postsPromises);
    let allPosts = [];
    postsResults.forEach(result => {
      if (result.data && Array.isArray(result.data.posts)) {
        allPosts = allPosts.concat(result.data.posts);
      }
    });

    if (type === 'latest') {
      if (allPosts.length > 0 && allPosts[0].timestamp) {
        allPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      const latestPosts = allPosts.slice(0, 5);
      return res.json({ posts: latestPosts });
    }
    const commentCounts = await Promise.all(
      allPosts.map(async post => {
        try {
          const commentsRes = await axios.get(
            `http://20.244.56.144/evaluation-service/posts/${post.id}/comments`,
            { headers }
          );
          const comments = commentsRes.data.comments || [];
          return { post, count: comments.length };
        } catch (err) {
          return { post, count: 0 };
        }
      })
    );
    const maxCount = Math.max(...commentCounts.map(pc => pc.count));
    const popularPosts = commentCounts.filter(pc => pc.count === maxCount).map(pc => pc.post);
    res.json({ posts: popularPosts });
  } catch (error) {
    console.error('Error fetching posts:', error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

// ------------------------------------------------



