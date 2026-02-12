// ============================================
// CONFIGURATION
// ============================================
const SHEET_ID = '1qlfTrLD3DAdEODruqUuf2SctaQZE71viz8Nq8nXPyQI';
const SHEET_NAME = 'Posts';

// ============================================
// STATE
// ============================================
let posts = [];
let series = [];
let activeFilter = null;
let searchQuery = '';
let currentView = 'main';

// ============================================
// GOOGLE SHEETS INTEGRATION
// ============================================
async function fetchPosts() {
  if (!SHEET_ID || SHEET_ID === 'YOUR_SHEET_ID_HERE') {
    posts = getSamplePosts();
    init();
    return;
  }

  try {
    const notice = document.getElementById('configNotice');
    if (notice) notice.style.display = 'none';

    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;
    const response = await fetch(url);
    const text = await response.text();
    const json = JSON.parse(text.substring(47).slice(0, -2));
    
    posts = json.table.rows.map((row, index) => {
      const cells = row.c;
      return {
        id: index + 1,
        title: cells[0]?.v || '',
        date: cells[1]?.v || '',
        readTime: cells[2]?.v || '',
        excerpt: cells[3]?.v || '',
        content: cells[4]?.v || '',
        tags: cells[5]?.v ? cells[5].v.split(',').map(t => t.trim()) : [],
        series: cells[6]?.v || null,
        seriesDescription: cells[7]?.v || null
        imageUrl: cells[8]?.v || null
      };
    }).filter(post => post.title);
    
    init();
  } catch (error) {
    console.error('Error fetching posts:', error);
    posts = getSamplePosts();
    init();
  }
}

function getSamplePosts() {
  return [
    {
      id: 1,
      title: "Tokyo at 3am",
      date: "Feb 8, 2026",
      readTime: "3 min read",
      excerpt: "Convenience store fluorescence. A salaryman buying instant ramen. Me, jet-lagged and euphoric.",
      content: `<p>Convenience store fluorescence. A salaryman buying instant ramen and a beer. Two teenagers laughing over their phones. Me, jet-lagged and euphoric, pretending to read the labels on drinks I can't understand.</p>

<p>There's something about being in a foreign place at an hour when you should be sleeping that makes everything feel significant.</p>

<h2>What I'm Noticing</h2>

<p>How quiet people are here, even in crowds. How the subway platforms feel more orderly than a library back home. How lost feels different when you can't read the signs—not scary, but <em>sharpening</em>.</p>`,
      tags: ["travel", "observation"],
      series: "Field Notes",
      seriesDescription: "Observations from different cities and states of mind"
    },
    {
      id: 2,
      title: "Berlin in Winter",
      date: "Feb 1, 2026",
      readTime: "4 min read",
      excerpt: "Grey skies, cold wind, and the best coffee I've ever had from a window the size of a shoebox.",
      content: `<p>Grey skies, cold wind, and the best coffee I've ever had from a window the size of a shoebox. Berlin in February feels like the city is daring you to find beauty in the bleakness.</p>

<p>And you do. In the graffiti that covers everything. In the way people bike in the rain like it's nothing. In the <em>späti</em> on every corner, open until whenever.</p>

<h2>The Pace</h2>

<p>Nobody rushes here. Or maybe they do, but differently. There's an efficiency that doesn't feel frantic.</p>`,
      tags: ["travel", "observation"],
      series: "Field Notes",
      seriesDescription: "Observations from different cities and states of mind"
    },
    {
      id: 3,
      title: "On Slow Mornings",
      date: "Jan 28, 2026",
      readTime: "3 min read",
      excerpt: "There's something sacred about the first hour of the day, before the world rushes in.",
      content: `<p>There's something sacred about the first hour of the day, before the world rushes in with its demands and notifications. I've been experimenting with a different relationship to morning.</p>

<p>For the past month, I've been waking up without an alarm and spending that first hour doing exactly nothing productive. Coffee, yes. Staring out the window, absolutely.</p>

<h2>What Changed</h2>

<p>The interesting thing isn't what I'm doing differently—it's what's happening to the rest of my day. There's this quality of <em>spaciousness</em> that carries through.</p>`,
      tags: ["reflection", "slow living"],
      series: null,
      seriesDescription: null
    },
    {
      id: 4,
      title: "The Books That Broke Me Open",
      date: "Jan 20, 2026",
      readTime: "5 min read",
      excerpt: "Every few years, a book comes along that fundamentally shifts how I see the world.",
      content: `<p>Every few years, a book comes along that fundamentally shifts how I see the world. Not in a dramatic, overnight way—more like a slow rewiring.</p>

<h2>1. The Rings of Saturn by W.G. Sebald</h2>

<p>This book taught me that narrative doesn't have to be linear, that digression can be the entire point.</p>

<h2>2. Bluets by Maggie Nelson</h2>

<p>A meditation on the color blue and on heartbreak, structured as numbered fragments. It's formally <em>strange</em> and emotionally devastating.</p>`,
      tags: ["books", "reflection"],
      series: null,
      seriesDescription: null
    }
  ];
}

// ============================================
// INITIALIZATION
// ============================================
function init() {
  processSeries();
  renderFilters();
  renderSeries();
  renderPosts();
  setupSearch();
}

// ============================================
// PROCESS SERIES
// ============================================
function processSeries() {
  const seriesMap = new Map();
  
  posts.forEach(post => {
    if (post.series) {
      if (!seriesMap.has(post.series)) {
        seriesMap.set(post.series, {
          name: post.series,
          description: post.seriesDescription || '',
          posts: []
        });
      }
      seriesMap.get(post.series).posts.push(post);
    }
  });
  
  series = Array.from(seriesMap.values());
}

// ============================================
// FILTERS
// ============================================
function renderFilters() {
  const allTags = [...new Set(posts.flatMap(post => post.tags))];
  const filtersContainer = document.getElementById('filters');
  
  if (allTags.length === 0) {
    filtersContainer.innerHTML = '';
    return;
  }
  
  filtersContainer.innerHTML = allTags.map(tag => 
    `<div class="filter-tag" onclick="toggleFilter('${tag}')">${tag}</div>`
  ).join('');
}

function toggleFilter(tag) {
  if (activeFilter === tag) {
    activeFilter = null;
  } else {
    activeFilter = tag;
  }
  
  document.querySelectorAll('.filter-tag').forEach(el => {
    if (el.textContent === tag) {
      el.classList.toggle('active');
    } else {
      el.classList.remove('active');
    }
  });
  
  renderPosts();
}

// ============================================
// SEARCH
// ============================================
function setupSearch() {
  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderPosts();
    renderSeries();
  });
}

// ============================================
// FILTERING
// ============================================
function getFilteredPosts(showAll = false) {
  let filtered = posts.filter(post => !post.series);
  
  if (activeFilter) {
    filtered = filtered.filter(post => post.tags.includes(activeFilter));
  }
  
  if (searchQuery) {
    filtered = filtered.filter(post => 
      post.title.toLowerCase().includes(searchQuery) ||
      post.excerpt.toLowerCase().includes(searchQuery) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery))
    );
  }
  
  // Limit to 6 unless showAll is true or there's an active filter/search
  if (!showAll && !activeFilter && !searchQuery) {
    filtered = filtered.slice(0, 6);
  }
  
  return filtered;
}
  
  if (activeFilter) {
    filtered = filtered.filter(post => post.tags.includes(activeFilter));
  }
  
  if (searchQuery) {
    filtered = filtered.filter(post => 
      post.title.toLowerCase().includes(searchQuery) ||
      post.excerpt.toLowerCase().includes(searchQuery) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery))
    );
  }
  
  return filtered;
}

function getFilteredSeries() {
  let filtered = series;
  
  if (searchQuery) {
    filtered = filtered.filter(s => 
      s.name.toLowerCase().includes(searchQuery) ||
      s.description.toLowerCase().includes(searchQuery) ||
      s.posts.some(p => 
        p.title.toLowerCase().includes(searchQuery) ||
        p.excerpt.toLowerCase().includes(searchQuery)
      )
    );
  }
  
  return filtered;
}

// ============================================
// RENDER SERIES
// ============================================
function renderSeries() {
  const container = document.getElementById('seriesContainer');
  const section = document.getElementById('seriesSection');
  const filtered = getFilteredSeries();
  
  if (filtered.length === 0) {
    section.classList.add('no-series');
    return;
  }
  
  section.classList.remove('no-series');
  
  container.innerHTML = `
    <div class="series-grid">
      ${filtered.map(s => `
        <div class="series-card" onclick="showSeries('${s.name}')">
          <div>
            <div class="series-meta">Essay Series</div>
            <h2 class="series-title">${s.name}</h2>
            <p class="series-description">${s.description}</p>
          </div>
          <div>
            <div class="series-count"><span>${s.posts.length}</span> ${s.posts.length === 1 ? 'essay' : 'essays'}</div>
            <div class="read-more">View Series</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ============================================
// RENDER POSTS
// ============================================
function renderPosts(showAll = false) {
  const container = document.getElementById('postsContainer');
  const filtered = getFilteredPosts(showAll);
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <div class="no-results-title">No essays found</div>
        <div class="no-results-text">Try adjusting your search or filters</div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
  <div class="posts-grid">
    ${filtered.map(post => `
      <div class="post-card" onclick="showArticle(${post.id})">
        ${post.imageUrl ? `
          <div class="post-image-container">
            <img class="post-image" src="${post.imageUrl}" alt="${post.title}">
            <div class="post-image-overlay"></div>
          </div>
        ` : ''}
        <div class="post-content">
          <div class="post-meta">${post.date} · ${post.readTime}</div>
          <h2 class="post-title">${post.title}</h2>
          <p class="post-excerpt">${post.excerpt}</p>
          <div class="post-tags">
            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <div class="read-more">Read Essay</div>
        </div>
      </div>
    `).join('')}
  </div>
`;// Show/hide "View All" button
const allPosts = posts.filter(post => !post.series);
const viewAllBtn = document.getElementById('viewAllContainer');
if (!showAll && !activeFilter && !searchQuery && allPosts.length > 6) {
  viewAllBtn.style.display = 'block';
} else {
  viewAllBtn.style.display = 'none';
}
          <h2 class="post-title">${post.title}</h2>
          <p class="post-excerpt">${post.excerpt}</p>
          <div class="post-tags">
            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <div class="read-more">Read Essay</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ============================================
// SERIES ONLY VIEW
// ============================================
function showSeriesOnly() {
  currentView = 'seriesOnly';
  
  document.getElementById('standaloneSection').style.display = 'none';
  
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  document.getElementById('navSeries').classList.add('active');
  
  document.getElementById('postsList').classList.remove('hidden');
  document.getElementById('articleView').classList.remove('active');
  document.getElementById('seriesView').classList.remove('active');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// SHOW SERIES
// ============================================
function showSeries(seriesName) {
  const seriesData = series.find(s => s.name === seriesName);
  if (!seriesData) return;
  
  currentView = 'series';
  
  document.getElementById('seriesViewTitle').textContent = seriesData.name;
  document.getElementById('seriesViewDescription').textContent = seriesData.description;
  
  const grid = document.getElementById('seriesPostsGrid');
  grid.innerHTML = seriesData.posts.map(post => `
    <div class="post-card" onclick="showArticle(${post.id})">
      <div class="post-meta">${post.date} · ${post.readTime}</div>
      <h2 class="post-title">${post.title}</h2>
      <p class="post-excerpt">${post.excerpt}</p>
      <div class="post-tags">
        ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
      <div class="read-more">Read Essay</div>
    </div>
  `).join('');
  
  document.getElementById('postsList').classList.add('hidden');
  document.getElementById('articleView').classList.remove('active');
  document.getElementById('seriesView').classList.add('active');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// SHOW ARTICLE
// ============================================
function showArticle(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  
  currentView = 'article';
  
  const seriesBadge = document.getElementById('articleSeriesBadge');
  if (post.series) {
    seriesBadge.textContent = post.series;
    seriesBadge.style.display = 'inline-block';
  } else {
    seriesBadge.style.display = 'none';
  }
  
  document.getElementById('articleMeta').textContent = `${post.date} · ${post.readTime}`;
  document.getElementById('articleTitle').textContent = post.title;
  document.getElementById('articleTags').innerHTML = post.tags.map(tag => 
    `<span class="tag">${tag}</span>`
  ).join('');
  document.getElementById('articleContent').innerHTML = post.content;
  
  document.getElementById('postsList').classList.add('hidden');
  document.getElementById('seriesView').classList.remove('active');
  document.getElementById('articleView').classList.add('active');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// NAVIGATION
// ============================================
function backToMain() {
  currentView = 'main';
  
  document.getElementById('standaloneSection').style.display = 'block';
  
  document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
  
  document.getElementById('postsList').classList.remove('hidden');
  document.getElementById('articleView').classList.remove('active');
  document.getElementById('seriesView').classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// SUBSCRIBE MODAL
// ============================================
function openSubscribeModal() {
  document.getElementById('subscribeModal').classList.add('active');
}

function closeSubscribeModal() {
  document.getElementById('subscribeModal').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('subscribeModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeSubscribeModal();
      }
    });
  }
});

// ============================================
// START
// ============================================
function viewAllEssays() {
  renderPosts(true);
  document.getElementById('viewAllContainer').style.display = 'none';
}
fetchPosts();
