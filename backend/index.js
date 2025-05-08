import express from 'express'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

const AUTH_TOKEN = process.env.AUTH_TOKEN
const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`
};

app.get('/', (req, res) => {
  res.send('Server is working!');
});

app.get('/users', async (req, res) => {
  try {
    const usersRes = await axios.get('http://20.244.56.144/evaluation-service/users', { headers });
    res.json(usersRes.data);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/posts', async (req, res) => {
  
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});