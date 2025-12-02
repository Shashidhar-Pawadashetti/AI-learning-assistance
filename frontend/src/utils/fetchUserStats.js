import { API_URL } from '../config';

export const fetchUserStats = async (navigate) => {
  let token = localStorage.getItem('token');
  
  try {
    const { auth } = await import('../firebase');
    const currentUser = auth.currentUser;
    if (currentUser) {
      token = await currentUser.getIdToken(true);
      localStorage.setItem('token', token);
    } else {
      navigate('/login');
      return null;
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Token refresh error:', err);
    }
    navigate('/login');
    return null;
  }
  
  const res = await fetch(`${API_URL}/api/user-stats`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest'
    },
    credentials: 'include'
  });
  
  if (res.ok) {
    return await res.json();
  }
  
  throw new Error('Failed to fetch stats');
};
