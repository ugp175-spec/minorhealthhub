// Simple SPA router
const routes = {
  home:   () => renderHome(),
  post:   () => renderPostForm(),
  search: () => renderSearch()
};

document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', e => {
    if (e.target.matches('nav a')) {
      e.preventDefault();
      const page = e.target.dataset.page;
      history.pushState({page}, '', `#${page}`);
      routes[page]();
    }
  });

  window.addEventListener('popstate', () => {
    const page = location.hash.slice(1) || 'home';
    routes[page] ? routes[page]() : routes.home();
  });

  // initial load
  const initPage = location.hash.slice(1) || 'home';
  history.replaceState({page: initPage}, '', `#${initPage}`);
  routes[initPage]();
});

/* ---------- UI ---------- */
function renderHome() {
  document.getElementById('app').innerHTML = `
    <h2>Welcome!</h2>
    <p>Search or share anonymous tips for colds, allergies, minor burns, etc.</p>
    <form id="quick-search">
      <input type="text" placeholder="e.g. cold, allergy, burn" required />
      <button>Search</button>
    </form>
    <div id="quick-results"></div>
  `;

  document.getElementById('quick-search').onsubmit = async e => {
    e.preventDefault();
    const q = e.target.querySelector('input').value.trim();
    const posts = await apiGet(`/api/posts?search=${encodeURIComponent(q)}`);
    renderPosts(posts, 'quick-results');
  };
}

function renderPostForm() {
  document.getElementById('app').innerHTML = `
    <h2>Share Your Experience (anonymous)</h2>
    <form id="post-form">
      <input type="text" placeholder="Title (e.g. My Cold Remedy)" required />
      <textarea placeholder="Describe what you did and how it helped…" required></textarea>
      <input type="text" placeholder="Tags – comma separated (cold, cough, remedy)" required />
      <button>Submit</button>
    </form>
  `;

  document.getElementById('post-form').onsubmit = async e => {
    e.preventDefault();
    const [title, desc, tags] = Array.from(e.target.querySelectorAll('input, textarea'))
                                   .map(el => el.value.trim());
    await apiPost('/api/posts', {title, description: desc, tags});
    alert('Thank you! Your experience is live.');
    history.pushState({page:'home'}, '', '#home');
    renderHome();
  };
}

function renderSearch() {
  const urlParams = new URLSearchParams(location.search);
  const q = urlParams.get('q') || '';
  document.getElementById('app').innerHTML = `
    <h2>Search Results${q?` for “${q}”`:''}</h2>
    <form id="search-form">
      <input type="text" placeholder="Search…" value="${q}" required />
      <button>Search</button>
    </form>
    <div id="search-results"></div>
  `;

  document.getElementById('search-form').onsubmit = async e => {
    e.preventDefault();
    const newQ = e.target.querySelector('input').value.trim();
    history.pushState(null, '', `?q=${encodeURIComponent(newQ)}`);
    const posts = await apiGet(`/api/posts?search=${encodeURIComponent(newQ)}`);
    renderPosts(posts, 'search-results');
  };

  if (q) {
    (async () => {
      const posts = await apiGet(`/api/posts?search=${encodeURIComponent(q)}`);
      renderPosts(posts, 'search-results');
    })();
  }
}

/* ---------- Helpers ---------- */
function renderPosts(posts, containerId) {
  const el = document.getElementById(containerId);
  if (!posts.length) return el.innerHTML = '<p>No experiences found.</p>';

  el.innerHTML = posts.map(p => `
    <div class="post">
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.description)}</p>
      <small>Tags: ${escapeHtml(p.tags)}</small>
    </div>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- API ---------- */
async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  return res.json();
}
async function apiPost(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed');
  }
}