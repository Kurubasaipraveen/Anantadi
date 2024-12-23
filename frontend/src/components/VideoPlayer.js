import React from 'react';
import ReactPlayer from 'react-player';

function VideoPlayer({ url }) {
  return (
    <div className="video-player">
      <ReactPlayer url={url} controls width="100%" height="100%" />
    </div>
  );
}

export default VideoPlayer;
