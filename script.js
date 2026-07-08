// 🚨 นำ URL ที่ได้จากการ Deploy Web App ใน GAS มาวางที่นี่
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzhMmH-DhjfhrHJn5mV2JTIpwAM-nJFUlsrE0EAOI2yq17Vl9SExmzvQgIsLMUKD0UD/exec";

let allAppsData = [];
let isAdmin = false;

let currentSearchQuery = "";
let currentCategory = "ทั้งหมด";

document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker();
  fetchApps();
  
  document.getElementById('searchInput').addEventListener('input', handleSearch);
  document.getElementById('adminToggleBtn').addEventListener('click', toggleAdminLogin);
  document.getElementById('addAppForm').addEventListener('submit', submitApp);
});

async function fetchApps() {
  try {
    const response = await fetch(GAS_API_URL);
    const result = await response.json();
    
    if (result.status === "success") {
      allAppsData = result.data;
      document.getElementById('loadingIndicator').style.display = 'none';
      document.getElementById('appContainer').style.display = 'block';
      renderFilteredApps();
    }
  } catch (error) {
    Swal.fire({ title: 'ข้อผิดพลาด!', text: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', icon: 'error', confirmButtonColor: '#0d9488' });
  }
}

function renderFilteredApps() {
  let filtered = allAppsData;

  if (currentCategory !== "ทั้งหมด") {
    filtered = filtered.filter(app => app.category === currentCategory);
  }

  if (currentSearchQuery !== "") {
    filtered = filtered.filter(app => app.name.toLowerCase().includes(currentSearchQuery));
  }

  renderApps(filtered);
}

function handleSearch(e) {
  currentSearchQuery = e.target.value.toLowerCase();
  renderFilteredApps();
}

function filterCategory(categoryName) {
  currentCategory = categoryName;

  const buttons = document.querySelectorAll('.cat-btn');
  buttons.forEach(btn => {
    if (btn.innerText.trim() === categoryName) {
      btn.className = "cat-btn bg-teal-600 text-white px-5 py-2 rounded-full text-sm md:text-base font-medium whitespace-nowrap shadow-sm transition";
    } else {
      btn.className = "cat-btn bg-white text-teal-700 border border-teal-200 px-5 py-2 rounded-full text-sm md:text-base font-medium whitespace-nowrap hover:bg-teal-50 transition";
    }
  });

  renderFilteredApps();
}

function renderApps(apps) {
  document.getElementById('grid-cat-1').innerHTML = '';
  document.getElementById('grid-cat-2').innerHTML = '';
  document.getElementById('grid-cat-3').innerHTML = '';
  document.getElementById('grid-cat-4').innerHTML = '';

  apps.forEach(app => {
    let adminBtn = '';
    if (isAdmin) {
      adminBtn = `<button onclick="confirmDelete(${app.row}, event)" class="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-md hover:bg-red-600 hover:scale-110 transition z-10" title="ลบแอป">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>`;
    }

    const cardHTML = `
      <div class="relative app-card bg-white rounded-[1.5rem] p-5 md:p-6 shadow-sm flex flex-col items-center text-center border-2 border-teal-100/50 cursor-pointer" onclick="window.open('${app.link}', '_blank')">
        ${adminBtn}
        <div class="w-20 h-20 md:w-28 md:h-28 mb-4 flex items-center justify-center overflow-hidden rounded-[1.2rem] bg-gray-50 drop-shadow-sm border border-gray-100">
          <img src="${app.icon}" alt="${app.name}" class="w-full h-full object-cover" onerror="this.src='./icon.png'">
        </div>
        <span class="text-sm md:text-lg font-medium text-gray-800 truncate-2-lines w-full">${app.name}</span>
      </div>
    `;

    if (app.category === "ตรวจสอบความพร้อมใช้") document.getElementById('grid-cat-1').insertAdjacentHTML('beforeend', cardHTML);
    else if (app.category === "งานพยาบาล") document.getElementById('grid-cat-2').insertAdjacentHTML('beforeend', cardHTML);
    else if (app.category === "ผู้ช่วยเหลือคนไข้") document.getElementById('grid-cat-3').insertAdjacentHTML('beforeend', cardHTML);
    else document.getElementById('grid-cat-4').insertAdjacentHTML('beforeend', cardHTML);
  });

  document.querySelectorAll('.category-section').forEach(section => {
    const grid = section.querySelector('.app-grid');
    section.style.display = grid.children.length === 0 ? 'none' : 'block';
  });
}

function toggleAdminLogin() {
  if (isAdmin) {
    isAdmin = false;
    document.getElementById('adminPanel').classList.add('hidden');
    renderFilteredApps(); 
    Swal.fire({ title: 'ออกจากระบบสำเร็จ', icon: 'success', timer: 1000, showConfirmButton: false });
  } else {
    Swal.fire({
      title: 'เข้าสู่ระบบ Admin',
      input: 'password',
      inputPlaceholder: 'กรอกรหัสผ่าน',
      showCancelButton: true,
      confirmButtonText: 'เข้าสู่ระบบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#0d9488'
    }).then((result) => {
      if (result.isConfirmed) {
        if (result.value === "4029") {
          isAdmin = true;
          document.getElementById('adminPanel').classList.remove('hidden');
          renderFilteredApps();
          Swal.fire({ title: 'เข้าสู่ระบบสำเร็จ', icon: 'success', timer: 1000, showConfirmButton: false });
        } else {
          Swal.fire({title: 'รหัสผ่านไม่ถูกต้อง', icon: 'error', confirmButtonColor: '#0d9488'});
        }
      }
    });
  }
}

async function submitApp(event) {
  event.preventDefault();
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.innerHTML = 'กำลังบันทึก...';

  const newApp = {
    name: document.getElementById('appName').value,
    category: document.getElementById('appCategory').value,
    icon: document.getElementById('appIcon').value,
    link: document.getElementById('appLink').value
  };

  const payload = { action: 'add', data: newApp };

  try {
    const response = await fetch(GAS_API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
    
    const result = await response.json();
    if (result.status === "success") {
      allAppsData = result.data;
      renderFilteredApps();
      document.getElementById('addAppForm').reset();
      Swal.fire({ title: 'เพิ่มแอปสำเร็จ!', icon: 'success', timer: 1500, showConfirmButton: false });
    }
  } catch (error) {
    Swal.fire({title:'ผิดพลาด', text:'ไม่สามารถบันทึกข้อมูลได้', icon:'error', confirmButtonColor: '#0d9488'});
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'บันทึกข้อมูล';
  }
}

function confirmDelete(rowNumber, event) {
  event.stopPropagation();
  Swal.fire({
    title: 'ยืนยันการลบ?',
    text: "คุณต้องการลบแอปนี้ใช่หรือไม่?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#d1d5db',
    confirmButtonText: 'ใช่, ลบเลย!',
    cancelButtonText: 'ยกเลิก'
  }).then(async (result) => {
    if (result.isConfirmed) {
      Swal.fire({ title: 'กำลังลบ...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
      
      const payload = { action: 'delete', row: rowNumber };
      
      try {
        const response = await fetch(GAS_API_URL, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "text/plain;charset=utf-8" }
        });
        const result = await response.json();
        
        if (result.status === "success") {
          allAppsData = result.data;
          renderFilteredApps();
          Swal.fire({ title: 'ลบสำเร็จ!', icon: 'success', timer: 1500, showConfirmButton: false });
        }
      } catch (error) {
        Swal.fire({title:'ผิดพลาด', text:'ไม่สามารถลบข้อมูลได้', icon:'error', confirmButtonColor: '#0d9488'});
      }
    }
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker ลงทะเบียนสำเร็จ'))
      .catch(err => console.error('Service Worker Error:', err));
  }
}
