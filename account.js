const users = JSON.parse(localStorage.getItem('users') || '[]');
const currentUser = sessionStorage.getItem('currentUser');
if (!currentUser) {
  window.location.href = 'index.html';
}
const user = users.find(u => u.email === currentUser);
function saveUsers() { localStorage.setItem('users', JSON.stringify(users)); }
if (user) {
  document.getElementById('account-name').textContent = user.name;
  document.getElementById('account-email').textContent = user.email;
}
// Toggle theme
const themeBtn = document.getElementById('toggle-theme');
if (themeBtn) themeBtn.onclick = () => { document.body.classList.toggle('dark'); };
// Reset password
const forgot = document.getElementById('account-forgot');
if (forgot) {
  forgot.onclick = e => {
    e.preventDefault();
    const newPass = prompt('Nhập mật khẩu mới');
    if (newPass) {
      user.password = btoa(newPass);
      saveUsers();
      alert('Đã cập nhật mật khẩu');
    }
  };
}
// Logout
const logoutBtn = document.getElementById('logout');
if (logoutBtn) logoutBtn.onclick = () => {
  sessionStorage.removeItem('currentUser');
  window.location.href = 'index.html';
};
