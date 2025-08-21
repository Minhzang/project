const users = JSON.parse(localStorage.getItem('users') || '[]');
let currentUser = sessionStorage.getItem('currentUser');
if(!currentUser){
  window.location.href = 'index.html';
}
const user = users.find(u=>u.email===currentUser);
function hash(p){return btoa(p);}

document.getElementById('account-name').textContent = 'Họ tên: ' + (user.name||'');
document.getElementById('account-email').textContent = 'Email: ' + user.email;

document.getElementById('toggle-theme').onclick = () => {
  document.body.classList.toggle('dark');
};

document.getElementById('account-forgot').onclick = () => {
  const newPass = prompt('Nhập mật khẩu mới');
  if(newPass){
    user.password = hash(newPass);
    localStorage.setItem('users', JSON.stringify(users));
    alert('Đã cập nhật mật khẩu');
  }
};

document.getElementById('logout').onclick = () => {
  sessionStorage.removeItem('currentUser');
  currentUser = null;
  if(window.google&&google.accounts&&google.accounts.id){google.accounts.id.disableAutoSelect();}
  window.location.href = 'index.html';
};
