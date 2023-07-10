import React from 'react';
import './App.css';
import { Terra } from './components/terra';

function App() {

  // Get cookies username and password
  
  const cookies = document.cookie.split(';');
  let username : string | null = null;
  let password : string | null = null;

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith("username=")) {
      username = cookie.substring("username=".length, cookie.length);
    } else if (cookie.startsWith("password=")) {
      password = cookie.substring("password=".length, cookie.length);
    }
  }

  // Prompt for username and password if not found in cookies
  if (username === null || password === null) {
    username = prompt("Username");
    password = prompt("Password");
    document.cookie = "username=" + username;
    document.cookie = "password=" + password;
  }
  
  return (
    <div className="App">
      <Terra username={username as string} password={password as string} />
    </div>
  );

}

export default App;
