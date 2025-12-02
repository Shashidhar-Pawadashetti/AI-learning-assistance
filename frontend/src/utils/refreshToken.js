export const refreshToken = async () => {
  let token = localStorage.getItem('token');
  
  try {
    const { auth } = await import('../firebase');
    const currentUser = auth.currentUser;
    if (currentUser) {
      token = await currentUser.getIdToken(true);
      localStorage.setItem('token', token);
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.error('Token refresh error:', e);
  }
  
  return token;
};
