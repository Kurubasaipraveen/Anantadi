import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VideoPlayer from './VideoPlayer';

function VideoList() {
  const [videos, setVideos] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchVideos = async () => {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`/videos?page=${page}&title=${query}`, {
        headers: { Authorization: token },
      });
      setVideos(data);
    };
    fetchVideos();
  }, [query, page]);

  return (
    <div className="video-list-container">
      <h2>Your Videos</h2>
      <input
        type="text"
        placeholder="Search by title"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul>
        {videos.map((video) => (
          <li key={video._id}>
            <h3>{video.title}</h3>
            <p>{video.description}</p>
            <VideoPlayer url={`https://your-video-storage-url/${video._id}`} />
          </li>
        ))}
      </ul>
      <button onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>Previous</button>
      <button onClick={() => setPage((prev) => prev + 1)}>Next</button>
    </div>
  );
}

export default VideoList;
