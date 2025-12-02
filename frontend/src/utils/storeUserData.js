export default function storeUserData(token, id, name, email, xp, level) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify({
    id,
    name,
    email,
    xp,
    level
  }));
}
