// Simple Student Expense Manager
const users = JSON.parse(localStorage.getItem('users') || '[]');
let currentUser = sessionStorage.getItem('currentUser');

function saveUsers(){localStorage.setItem('users', JSON.stringify(users));}
function hash(p){return btoa(p);}

// UI helpers
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app');

function showApp(){authSection.classList.add('hidden');appSection.classList.remove('hidden');render();}
function showAuth(){authSection.classList.remove('hidden');appSection.classList.add('hidden');}

// Registration
 document.getElementById('register-form').addEventListener('submit',e=>{
  e.preventDefault();
  const email = document.getElementById('register-email').value;
  const password = hash(document.getElementById('register-password').value);
  if(users.find(u=>u.email===email)){alert('Tài khoản đã tồn tại');return;}
  users.push({email,password,budget:0,transactions:[]});
  saveUsers();
  alert('Đăng ký thành công, vui lòng đăng nhập');
  document.getElementById('register').classList.add('hidden');
});

document.getElementById('show-register').onclick=()=>document.getElementById('register').classList.toggle('hidden');

document.getElementById('show-reset').onclick=()=>document.getElementById('reset').classList.toggle('hidden');

// Login
 document.getElementById('login-form').addEventListener('submit',e=>{
  e.preventDefault();
  const email=document.getElementById('login-email').value;
  const password=hash(document.getElementById('login-password').value);
  const user=users.find(u=>u.email===email && u.password===password);
  if(!user){alert('Sai thông tin đăng nhập');return;}
  currentUser=email;sessionStorage.setItem('currentUser',email);
  showApp();
});

// Password reset (simple)
document.getElementById('reset-form').addEventListener('submit',e=>{
 e.preventDefault();
 const email=document.getElementById('reset-email').value;
 const user=users.find(u=>u.email===email);
 if(!user){alert('Không tìm thấy tài khoản');return;}
 const newPass=prompt('Nhập mật khẩu mới');
 user.password=hash(newPass);
 saveUsers();
 alert('Đã cập nhật mật khẩu');
 document.getElementById('reset').classList.add('hidden');
});

// Logout
 document.getElementById('logout').onclick=()=>{sessionStorage.removeItem('currentUser');currentUser=null;showAuth();};

// Theme
document.getElementById('toggle-theme').onclick=()=>{document.body.classList.toggle('dark');};

// Add transaction
let editId=null;
 document.getElementById('add-transaction-form').addEventListener('submit',e=>{
 e.preventDefault();
 const user=users.find(u=>u.email===currentUser);
 const data={
  id: editId || Date.now(),
  type: document.getElementById('type').value,
  amount: parseFloat(document.getElementById('amount').value),
  description: document.getElementById('description').value,
  date: document.getElementById('date').value,
  category: document.getElementById('category').value
 };
 if(editId){
  const idx=user.transactions.findIndex(t=>t.id===editId);user.transactions[idx]=data;editId=null;
 }else{
  user.transactions.push(data);
 }
 saveUsers();
 render();
 e.target.reset();
});

// Filters
['search','filter-date','filter-category'].forEach(id=>document.getElementById(id).addEventListener('input',render));

// Set budget
 document.getElementById('set-budget-btn').onclick=()=>{
 const user=users.find(u=>u.email===currentUser);
 const b=prompt('Ngân sách?', user.budget||0);
 user.budget=parseFloat(b)||0;saveUsers();render();};

// Export/Import
 document.getElementById('export-data').onclick=()=>{
 const user=users.find(u=>u.email===currentUser);
 const dataStr=JSON.stringify(user);
 const blob=new Blob([dataStr],{type:'application/json'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='sao_luu.json';a.click();
 };

document.getElementById('import-file').addEventListener('change',e=>{
 const file=e.target.files[0];if(!file)return;
 const reader=new FileReader();
 reader.onload=ev=>{
  try{
   const data=JSON.parse(ev.target.result);
   const idx=users.findIndex(u=>u.email===currentUser);
   users[idx]=data;saveUsers();render();
  }catch(err){alert('Tệp không hợp lệ');}
 };
 reader.readAsText(file);
});

// Render
function render(){
 if(!currentUser)return;
 const user=users.find(u=>u.email===currentUser);
 document.getElementById('budget-display').textContent=user.budget;
 const tbody=document.getElementById('transaction-table');
 tbody.innerHTML='';
 const search=document.getElementById('search').value.toLowerCase();
 const fDate=document.getElementById('filter-date').value;
 const fCat=document.getElementById('filter-category').value;
 let balance=0;let expenses=0;
 user.transactions
  .filter(t=>t.description.toLowerCase().includes(search))
  .filter(t=>!fDate || t.date===fDate)
  .filter(t=>!fCat || t.category===fCat)
  .sort((a,b)=>new Date(b.date)-new Date(a.date))
  .forEach(t=>{
   if(t.type==='income') balance+=t.amount; else {balance-=t.amount;expenses+=t.amount;}
   const tr=document.createElement('tr');
  tr.innerHTML=`<td>${t.date}</td><td>${t.description}</td><td>${t.category}</td><td>${t.type==='income'?'+':'-'}${t.amount}</td><td><button data-id="${t.id}" class="edit">Sửa</button><button data-id="${t.id}" class="del">Xóa</button></td>`;
   tbody.appendChild(tr);
  });
 document.getElementById('balance').textContent=balance.toFixed(2);
 if(user.budget && expenses>user.budget) alert('Vượt quá ngân sách!');

 tbody.querySelectorAll('.del').forEach(btn=>btn.onclick=e=>{
  const id=Number(e.target.dataset.id);
  user.transactions=user.transactions.filter(t=>t.id!==id);saveUsers();render();
 });
 tbody.querySelectorAll('.edit').forEach(btn=>btn.onclick=e=>{
  const id=Number(e.target.dataset.id);
  const t=user.transactions.find(t=>t.id===id);
  editId=id;
  document.getElementById('type').value=t.type;
  document.getElementById('amount').value=t.amount;
  document.getElementById('description').value=t.description;
  document.getElementById('date').value=t.date;
  document.getElementById('category').value=t.category;
  window.scrollTo(0,0);
 });
 updateCharts(user.transactions);
}

let categoryChart,timeChart;
function updateCharts(data){
 const ctx1=document.getElementById('category-chart');
 const ctx2=document.getElementById('time-chart');
 const byCat={}; const byTime={};
 data.forEach(t=>{
  if(t.type==='expense'){byCat[t.category]=(byCat[t.category]||0)+t.amount;}
  const month=t.date.slice(0,7); // YYYY-MM
  byTime[month]=(byTime[month]||0)+(t.type==='income'?t.amount:-t.amount);
 });
 const catLabels=Object.keys(byCat); const catValues=Object.values(byCat);
 const timeLabels=Object.keys(byTime).sort();
 const timeValues=timeLabels.map(l=>byTime[l]);
 if(categoryChart) categoryChart.destroy();
 if(timeChart) timeChart.destroy();
 categoryChart=new Chart(ctx1,{type:'pie',data:{labels:catLabels,datasets:[{data:catValues,backgroundColor:['#667eea','#764ba2','#ffc107','#28a745','#dc3545','#17a2b8']} ]}});
 timeChart=new Chart(ctx2,{type:'bar',data:{labels:timeLabels,datasets:[{label:'Số dư',data:timeValues,backgroundColor:'#667eea'}]}});
}

// Auto login
if(currentUser){showApp();}
else{showAuth();}
