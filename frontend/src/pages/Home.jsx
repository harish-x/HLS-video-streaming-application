import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex items-cener justify-center p-10 h-[100vh]">
      <div className='flex gap-10 items-center'>
        <Link to="/upload"><h1 className='text-3xl underline hover:text-sky-500'>Upload</h1></Link>
        <Link to="/videos"><h1 className='text-3xl underline hover:text-sky-500'>Videos</h1></Link>
      </div>
    </div>
  );
}

export default Home