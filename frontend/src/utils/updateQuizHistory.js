import { API_URL } from '../config';

export const updateQuizHistory = async (updatedHistory) => {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    await fetch(`${API_URL}/api/save-quiz-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include',
      body: JSON.stringify({ attempt: { id: 'UPDATE_ALL', quizHistory: updatedHistory } })
    });
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to update:', e);
    }
  }
};
