'use client'
import { useState, useEffect } from 'react';

export default function Page() {
  const [emails, setEmails] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  console.log('emails:', emails)
  console.log('cookies:', document.cookie)

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const response = await fetch('/api/auth2callback', { 'mode': 'no-cors', 'method': 'GET' });
        const data = await response.json();
        if (data && data.length > 0) {
          setEmails(data);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error checking logged in status:', error);
      }
    };

    checkLoggedIn();
  }, []);

 
  const fetchEmail = async () => {
    var response = await fetch('/api/auth2callback', { 'mode': 'no-cors', 'method': 'GET' })
    response = await response.json()
    window.location.href = response.url
  };

  return (
    <div>
      {!isLoggedIn && (
        <div className="flex items-center justify-center mx-auto h-screen">
          <button
            onClick={() => fetchEmail()}
            className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
          >
            Sign in with Google
          </button>
        </div>
      )}

      <div className='flex flex-col m-5 gap-2'>
      <button
            className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
          >
            Logout
          </button>
        <ul className='list-none mb-0 border-blue-500 border-2'>
          {emails.map((email, index) => (
            <li key={index} className='px-4 py-2 border-b border-gray-200 hover:bg-gray-100'>
              <span className='inline-block w-1/3'>{email.sender}</span>
              <span className='inline-block w-1/3'>{email.subject.value}</span>
              <span className='inline-block w-1/3'>spam</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}