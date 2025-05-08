import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TopUsers from './TopUsers';
import TrendingPosts from './TrendingPosts';
import Feed from './Feed';
import './App.css';

function App() {
  return (
    <Router>
      <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#f5f5f5' }}>
        <Link to="/users">Top Users</Link>
        <Link to="/trending">Trending Posts</Link>
        <Link to="/feed">Feed</Link>
      </nav>
      <Routes>
        <Route path="/users" element={<TopUsers />} />
        <Route path="/trending" element={<TrendingPosts />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="*" element={<TopUsers />} />
      </Routes>
    </Router>
  );
}

export default App;
