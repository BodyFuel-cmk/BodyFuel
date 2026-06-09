const API_BASE = '/api';
let allVideos = [];
let allCategories = [];

// ===== Auth Check =====
const token = localStorage.getItem('bf_token');
if (!token) {
  window.location.href = '/#signup';
}

// ===== API Helper =====
async function apiFetch(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ===== Tab Switching =====
document.querySelectorAll('.dash-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
  });
});

// ===== Video Card Render =====
function createVideoCard(video) {
  const card = document.createElement('div');
  card.className = 'video-card';
  card.innerHTML = `
    <div class="video-thumb">
      <img src="${video.thumbnail}" alt="${video.title}" loading="lazy" onerror="this.src='https://placehold.co/480x270/e5e7eb/9ca3af?text=BodyFuel+TV'" />
      <span class="video-duration">${video.duration}</span>
      <div class="video-play-overlay"></div>
    </div>
    <div class="video-info">
      <span class="video-category-tag" style="background:${getCategoryColor(video.category)}">${getCategoryName(video.category)}</span>
      <h3>${video.title}</h3>
      <div class="video-meta">
        <span>${video.instructor}</span>
        <span>•</span>
        <span>${video.level}</span>
      </div>
    </div>
  `;
  card.addEventListener('click', () => {
    window.location.href = `/watch.html?id=${video.id}`;
  });
  return card;
}

function getCategoryName(id) {
  const cat = allCategories.find(c => c.id === id);
  return cat ? cat.name : id;
}
function getCategoryColor(id) {
  const cat = allCategories.find(c => c.id === id);
  return cat ? cat.color : '#6b7280';
}

// ===== Load Videos =====
async function loadVideos(category = 'all') {
  const grid = document.getElementById('video-grid');
  grid.innerHTML = '';

  const videos = category === 'all'
    ? allVideos
    : allVideos.filter(v => v.category === category);

  if (videos.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:#9ca3af;">No videos in this category yet.</p>';
    return;
  }

  videos.forEach(v => grid.appendChild(createVideoCard(v)));
}

// ===== Load Categories =====
function renderCategoryFilters(categories) {
  const container = document.getElementById('category-filters');
  container.innerHTML = '<button class="cat-filter active" data-cat="all">All</button>';

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-filter';
    btn.dataset.cat = cat.id;
    btn.textContent = `${cat.icon} ${cat.name}`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadVideos(cat.id);
    });
    container.appendChild(btn);
  });

  // "All" filter
  container.querySelector('[data-cat="all"]').addEventListener('click', function() {
    document.querySelectorAll('.cat-filter').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    loadVideos('all');
  });
}

// ===== Load Profile =====
async function loadProfile() {
  try {
    const data = await apiFetch('/auth/me');
    const user = data.user;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-joined').textContent = user.created_at ? new Date(user.created_at).toLocaleDateString() : '—';

    const subStatus = user.subscription_status || 'none';
    const statusMap = { 'active': '✅ Active', 'trialing': '🔷 Free Trial', 'none': '— No subscription' };
    document.getElementById('profile-sub').textContent = statusMap[subStatus] || subStatus;
    document.getElementById('profile-plan').textContent = user.subscription_plan || '—';

    // Greeting
    const name = user.name || user.email.split('@')[0];
    document.getElementById('dash-greeting').textContent = `Welcome back, ${name}!`;

    // Sub status text
    const subEl = document.getElementById('dash-sub-status');
    if (subStatus === 'active') {
      subEl.textContent = '✅ Premium Member — Full access';
    } else if (subStatus === 'trialing') {
      subEl.textContent = '🔷 Free Trial — Explore everything!';
    } else {
      subEl.innerHTML = '⬜ No subscription — <a href="/#pricing" style="color:var(--primary);font-weight:600;">View plans</a>';
    }
  } catch (err) {
    console.error('Profile error:', err);
  }
}

// ===== Init =====
async function init() {
  try {
    const data = await apiFetch('/videos');
    allVideos = data.videos;
    allCategories = data.categories || [];

    // Stats
    document.getElementById('stat-videos').textContent = allVideos.length;
    document.getElementById('stat-categories').textContent = allCategories.length;
    document.getElementById('stat-streak').textContent = `🔥 ${Math.floor(Math.random() * 5) + 1}`;

    renderCategoryFilters(allCategories);
    loadVideos('all');

    document.getElementById('videos-loading').style.display = 'none';

    await loadProfile();
  } catch (err) {
    console.error('Init error:', err);
    document.getElementById('videos-loading').style.display = 'none';
    document.getElementById('videos-error').style.display = 'block';
  }
}

// ===== Logout =====
document.getElementById('nav-logout')?.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('bf_token');
  localStorage.removeItem('bf_user');
  window.location.href = '/';
});

// ===== Go! =====
init();