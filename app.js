// Simple Student Expense Manager
const users = JSON.parse(localStorage.getItem('users') || '[]');
let currentUser = sessionStorage.getItem('currentUser');
const defaultCategories=['Ăn uống','Đi lại','Học tập','Giải trí','Sức khỏe','Mua sắm'];
let expenseChart;

function saveUsers(){localStorage.setItem('users', JSON.stringify(users));}
function hash(p){return btoa(p);}
function formatVND(amount){return amount.toLocaleString('vi-VN',{style:'currency',currency:'VND'});}

// UI helpers
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app');
const budgetWarning = document.getElementById('budget-warning');
function showApp(){authSection.classList.add('hidden');appSection.classList.remove('hidden');render();renderExpenseChart();}
function showAuth(){authSection.classList.remove('hidden');appSection.classList.add('hidden');}

// Registration
 document.getElementById('register-form').addEventListener('submit',e=>{
  e.preventDefault();
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = hash(document.getElementById('register-password').value);
  if(users.find(u=>u.email===email)){alert('Tài khoản đã tồn tại');return;}
  users.push({name,email,password,budget:0,transactions:[],categories:[...defaultCategories]});
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
// Account link handled via separate page

// Theme
document.getElementById('toggle-theme').onclick=()=>{document.body.classList.toggle('dark');};

function populateCategories(user){
 if(!user){return;}
 if(!user.categories){user.categories=[...defaultCategories];}
 user.transactions.forEach(t=>{if(!user.categories.includes(t.category)) user.categories.push(t.category);});
 saveUsers();
 const cat=document.getElementById('category');
 const filter=document.getElementById('filter-category');
 const del=document.getElementById('delete-category');
 cat.innerHTML=user.categories.map(c=>`<option>${c}</option>`).join('');
 filter.innerHTML=`<option value="">Tất cả danh mục</option>`+user.categories.map(c=>`<option>${c}</option>`).join('');
 if(del) del.innerHTML=user.categories.map(c=>`<option>${c}</option>`).join('');
}

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

document.getElementById('add-category-btn').onclick=()=>{
 const input=document.getElementById('new-category');
 const catName=input.value.trim();
 if(!catName)return;
 const user=users.find(u=>u.email===currentUser);
 if(!user) return;
 if(!user.categories) user.categories=[...defaultCategories];
 if(!user.categories.includes(catName)){
  user.categories.push(catName);
  saveUsers();
 }
 populateCategories(user);
 document.getElementById('category').value=catName;
 input.value='';
};

document.getElementById('delete-category-btn').onclick=()=>{
 const select=document.getElementById('delete-category');
 const catName=select.value;
 if(!catName) return;
 const user=users.find(u=>u.email===currentUser);
 if(!user) return;
 if(!confirm(`Xóa danh mục "${catName}" và các giao dịch liên quan?`)) return;
 user.categories=user.categories.filter(c=>c!==catName);
 user.transactions=user.transactions.filter(t=>t.category!==catName);
 saveUsers();
 render();
};

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
 populateCategories(user);
 document.getElementById('budget-display').textContent=formatVND(user.budget);
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
  tr.innerHTML=`<td>${t.date}</td><td>${t.description}</td><td>${t.category}</td><td>${t.type==='income'?'+':'-'}${formatVND(t.amount)}</td><td><button data-id="${t.id}" class="edit">Sửa</button><button data-id="${t.id}" class="del">Xóa</button></td>`;
   tbody.appendChild(tr);
  });
 document.getElementById('balance').textContent=formatVND(balance);
 if(user.budget && expenses>user.budget){
  budgetWarning.textContent='Cảnh báo: đã vượt quá ngân sách!';
  budgetWarning.classList.remove('hidden');
 }else{
  budgetWarning.classList.add('hidden');
  budgetWarning.textContent='';
 }

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
}

function renderExpenseChart(){
 const ctx=document.getElementById('expense-chart');
 if(!ctx) return;
 if(expenseChart) expenseChart.destroy();
 expenseChart=new Chart(ctx,{
  type:'pie',
  data:{
   labels:['Ăn uống','Đi lại','Học tập','Giải trí'],
   datasets:[{
    data:[1500000,500000,800000,300000],
    backgroundColor:['#FF6384','#36A2EB','#FFCE56','#4BC0C0']
   }]
  },
  options:{
   responsive:true,
   plugins:{
    legend:{position:'bottom'},
    tooltip:{callbacks:{label:c=>`${c.label}: ${formatVND(c.parsed)}`}}
   }
  }
 });
}

// Auto login
if(currentUser){showApp();}
else{showAuth();}
