const API_BASE = '/api';

const token = localStorage.getItem('bf_token');
if (!token) {
  window.location.href = '/#signup';
}

async function apiFetch(url) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

function getCategoryColor(id) {
  const colors = {
    strength: '#FF5722', cardio: '#E91E63', yoga: '#9C27B0',
    nutrition: '#8BC34A', beginner: '#00BCD4', recovery: '#3F51B5',
  };
  return colors[id] || '#6b7280';
}
function getCategoryName(id) {
  const names = {
    strength: 'Strength Training', cardio: 'Cardio & HIIT', yoga: 'Yoga & Flexibility',
    nutrition: 'Nutrition', beginner: 'Beginner', recovery: 'Recovery',
  };
  return names[id] || id;
}

function createRelatedCard(video) {
  const card = document.createElement('div');
  card.className = 'video-card';
  card.style.cursor = 'pointer';
  card.innerHTML = `
    <div class="video-thumb">
      <img src="${video.thumbnail}" alt="${video.title}" loading="lazy" onerror="this.src='https://placehold.co/480x270/e5e7eb/9ca3af?text=BodyFuel+TV'" />
      <span class="video-duration">${video.duration}</span>
    </div>
    <div class="video-info">
      <span class="video-category-tag" style="background:${getCategoryColor(video.category)};padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:600;color:white;">${getCategoryName(video.category)}</span>
      <h3 style="font-size:0.9rem;margin:8px 0 4px;">${video.title}</h3>
      <div class="video-meta" style="font-size:0.8rem;color:#9ca3af;">
        <span>${video.instructor}</span>
      </div>
    </div>
  `;
  card.addEventListener('click', () => {
    window.location.href = `/watch.html?id=${video.id}`;
  });
  return card;
}

async function loadVideo() {
  const params = new URLSearchParams(window.location.search);
  const videoId = params.get('id');

  if (!videoId) {
    document.getElementById('watch-loading').style.display = 'none';
    document.getElementById('watch-error').style.display = 'block';
    return;
  }

  try {
    const data = await apiFetch(`/videos/${videoId}`);
    const video = data.video;
    const related = data.related || [];

    // Player
    document.getElementById('video-iframe').src = video.videoUrl;
    document.title = `${video.title} — BodyFuel TV`;

    // Info
    document.getElementById('video-title').textContent = video.title;
    document.getElementById('video-instructor').textContent = video.instructor;
    document.getElementById('video-level').textContent = `• ${video.level}`;
    document.getElementById('video-duration').textContent = `• ${video.duration}`;
    document.getElementById('video-description').textContent = video.description;
    document.getElementById('video-calories').textContent = video.calories;
    document.getElementById('video-equipment').textContent = video.equipment;
    document.getElementById('video-level-detail').textContent = video.level;

    // Related
    const grid = document.getElementById('related-grid');
    if (related.length === 0) {
      grid.innerHTML = '<p style="color:#6b7280;grid-column:1/-1;">No related videos found.</p>';
    } else {
      related.forEach(v => grid.appendChild(createRelatedCard(v)));
    }

    document.getElementById('watch-loading').style.display = 'none';
    document.getElementById('watch-content').style.display = 'block';
  } catch (err) {
    console.error('Watch error:', err);
    document.getElementById('watch-loading').style.display = 'none';
    document.getElementById('watch-error').style.display = 'block';
  }
}

// Logout
document.getElementById('nav-logout')?.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('bf_token');
  localStorage.removeItem('bf_user');
  window.location.href = '/';
});

loadVideo();