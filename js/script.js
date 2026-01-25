/* global WaveSurfer */

document.addEventListener("DOMContentLoaded", () => {

  // Config and theme colors
  const FADE_MS = 250;
  const MIN_GAIN = 0.0001;

  const DARK_WAVE = '#00ff9f';
  const DARK_PROGRESS = '#ffffff';
  const LIGHT_WAVE = '#f5c542';
  const LIGHT_PROGRESS = '#ffffff';

  // Menu Navigation
  function setupMenu() {
    document.querySelectorAll('.nav-menu a').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = link.getAttribute('data-section');
        if (!target) return;

        // Update hash in URL
        window.location.hash = target;

        // Hide all sections
        document.querySelectorAll('.page-section').forEach(section => section.classList.add('hidden'));

        // Show the selected section
        const el = document.getElementById(target);
        if (el) el.classList.remove('hidden');

        // Update active link
        document.querySelectorAll('.nav-menu a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }

  // Terminal Typewriter
  const terminalText = "kraken-503";
  const typedNameEl = document.getElementById("typed-name");
  let idx = 0;
  let deleting = false;

  function typeWriterLoop() {
    if (!typedNameEl) return;
    if (!deleting && idx < terminalText.length) {
      typedNameEl.textContent += terminalText.charAt(idx);
      idx++;
      setTimeout(typeWriterLoop, 120);
    } else if (deleting && idx > 0) {
      typedNameEl.textContent = terminalText.substring(0, idx - 1);
      idx--;
      setTimeout(typeWriterLoop, 80);
    } else {
      if (!deleting) {
        deleting = true;
        setTimeout(typeWriterLoop, 3000);
      } else {
        deleting = false;
        setTimeout(typeWriterLoop, 2000);
      }
    }
  }

  // Writeups loader
  const writeups = [
    { title: "neovim", date: "Jan 2026", link: "./writeups/neovim.html" },
    { title: "iusearchbtw", date: "Dec 2025", link: "./writeups/archlinux.html" }
  ];

  function loadWriteups() {
    const container = document.getElementById("writeups-container");
    if (!container) return;
    container.innerHTML = '';
    writeups.forEach(w => {
      const heading = document.createElement("a");
      heading.className = "writeup-heading";
      heading.href = w.link;
      heading.innerHTML = `<h3>$ cat ${w.title.replace(/\s+/g, "_")}.txt</h3><small>${w.date}</small>`;
      container.appendChild(heading);
    });
  }

  // Wavesurfer Visualizer
  // Determine initial theme
  const savedTheme = localStorage.getItem('theme');
  const isLightInit = savedTheme === 'light';

  // Create wavesurfer with initial colors based on theme
  let wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: isLightInit ? LIGHT_WAVE : DARK_WAVE,
    progressColor: isLightInit ? LIGHT_PROGRESS : DARK_PROGRESS,
    height: 115,
    responsive: true
  });

  wavesurfer.load('audio/gotye.mp3');
  wavesurfer.setVolume(1);

  wavesurfer.isReady = false;
  wavesurfer.on('ready', () => { wavesurfer.isReady = true; });

  function updateWaveColors(waveColor, progressColor) {
    if (!wavesurfer) return;
    if (typeof wavesurfer.setOptions === 'function') {
      wavesurfer.setOptions({ waveColor, progressColor });
      if (wavesurfer.isReady) {
        if (typeof wavesurfer.drawBuffer === 'function') {
          wavesurfer.drawBuffer();
        } else if (wavesurfer.drawer && typeof wavesurfer.drawer.drawPeaks === 'function') {
          try {
            const peaks = wavesurfer.backend.getPeaks(1024);
            wavesurfer.drawer.drawPeaks(peaks, wavesurfer.getDuration());
          } catch (e) {
            // ignore and fallback
          }
        }
      }
      return;
    }

    // fallback: destroy & recreate
    const currentTime = wavesurfer.getCurrentTime ? wavesurfer.getCurrentTime() : 0;
    const wasPlaying = wavesurfer.isPlaying && wavesurfer.isPlaying();
    wavesurfer.destroy();

    wavesurfer = WaveSurfer.create({
      container: '#waveform',
      waveColor,
      progressColor,
      height: 115,
      responsive: true
    });
    wavesurfer.load('audio/gotye.mp3');
    wavesurfer.on('ready', () => {
      wavesurfer.seekTo(currentTime / wavesurfer.getDuration());
      if (wasPlaying) wavesurfer.play();
      wavesurfer.isReady = true;
    });
    window.wavesurfer = wavesurfer;
  }

  // ---------- Fade helpers----------
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
  function rampVolumeJS(target, duration = FADE_MS) {
    return new Promise(resolve => {
      const startTime = performance.now();
      const startVol = wavesurfer.getVolume();
      const delta = target - startVol;
      function step(now) {
        const p = Math.min(1, (now - startTime) / duration);
        const eased = easeInOut(p);
        wavesurfer.setVolume(startVol + delta * eased);
        if (p < 1) requestAnimationFrame(step);
        else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  // Minimal getGainNode/getAudioContext/ensureAudioContext helpers (used by fade)
  function getGainNode(ws) {
    try {
      if (!ws || !ws.backend) return null;
      if (ws.backend.gainNode) return ws.backend.gainNode;
      if (typeof ws.backend.getGainNode === 'function') return ws.backend.getGainNode();
      if (ws.backend.masterGain) return ws.backend.masterGain;
      return null;
    } catch (e) { return null; }
  }
  function getAudioContext(ws) {
    try {
      if (!ws || !ws.backend) return null;
      if (typeof ws.backend.getAudioContext === 'function') return ws.backend.getAudioContext();
      if (ws.backend.ac) return ws.backend.ac;
      return null;
    } catch (e) { return null; }
  }
  async function ensureAudioContext(ws) {
    const ac = getAudioContext(ws);
    if (ac && ac.state === 'suspended') {
      try { await ac.resume(); } catch (e) { /* ignore */ }
    }
  }

  // WebAudio fade automation (best-effort)
  async function fadeOutAndPause(duration = FADE_MS) {
    const gainNode = getGainNode(wavesurfer);
    const audioCtx = getAudioContext(wavesurfer);
    if (gainNode && audioCtx) {
      try {
        const g = gainNode.gain || gainNode;
        const now = audioCtx.currentTime;
        g.cancelScheduledValues(now);
        g.linearRampToValueAtTime(MIN_GAIN, now + Math.max(0.01, duration / 1000));
        await new Promise(r => setTimeout(r, duration + 10));
        wavesurfer.pause();
        g.cancelScheduledValues(audioCtx.currentTime);
        g.setValueAtTime(1, audioCtx.currentTime);
        return;
      } catch (e) { /* fallback */ }
    }
    await rampVolumeJS(0, duration);
    wavesurfer.pause();
    wavesurfer.setVolume(1);
  }

  async function fadeInAndPlay(duration = FADE_MS) {
    const gainNode = getGainNode(wavesurfer);
    const audioCtx = getAudioContext(wavesurfer);
    await ensureAudioContext(wavesurfer);
    if (gainNode && audioCtx) {
      try {
        const g = gainNode.gain || gainNode;
        const now = audioCtx.currentTime;
        g.cancelScheduledValues(now);
        g.setValueAtTime(MIN_GAIN, now);
        wavesurfer.play();
        g.linearRampToValueAtTime(1.0, now + Math.max(0.01, duration / 1000));
        await new Promise(r => setTimeout(r, duration + 10));
        return;
      } catch (e) { /* fallback */ }
    }
    wavesurfer.setVolume(0);
    wavesurfer.play();
    await rampVolumeJS(1, duration);
  }

  // ---------- Play/pause wiring ----------
  const playBtn = document.getElementById('playPause');
  if (playBtn) {
    playBtn.addEventListener('click', async () => {
      await ensureAudioContext(wavesurfer);
      if (wavesurfer.isPlaying()) {
        await fadeOutAndPause();
        playBtn.textContent = '$ play';
      } else {
        await fadeInAndPlay();
        playBtn.textContent = '$ pause';
      }
    });
  }

  // Theme toggle wiring
  const toggleBtn = document.getElementById('theme-toggle');
  const iconSun = document.getElementById('icon-sun');
  const iconMoon = document.getElementById('icon-moon');

  function applyTheme(isLight) {
    document.body.classList.toggle('light-mode', isLight);
    if (iconSun && iconMoon) {
      iconSun.style.display = isLight ? 'inline' : 'none';
      iconMoon.style.display = isLight ? 'none' : 'inline';
    }
    // update waveform colors
    if (isLight) updateWaveColors(LIGHT_WAVE, LIGHT_PROGRESS);
    else updateWaveColors(DARK_WAVE, DARK_PROGRESS);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  }

  toggleBtn && toggleBtn.addEventListener('click', async () => {
    await ensureAudioContext(wavesurfer);
    const isLight = !document.body.classList.contains('light-mode');
    applyTheme(isLight);
  });

  // initialize theme and UI
  applyTheme(isLightInit);

  // Init UI features
  if (typedNameEl) {
    typedNameEl.textContent = "";
    typeWriterLoop();
  }
  setupMenu();
  loadWriteups();

  // Restore section from hash
  const section = window.location.hash.replace('#','') || 'home';
  document.querySelectorAll('.page-section').forEach(sec => sec.classList.add('hidden'));
  const target = document.getElementById(section);
  if (target) target.classList.remove('hidden');
  document.querySelectorAll('.nav-menu a').forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('data-section') === section) a.classList.add('active');
  });

  // expose for debugging
  window.wavesurfer = wavesurfer;
});

// Rendering project cards into #projects-grid
function renderProjectCards(projects, containerId = 'projects-grid') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  projects.forEach(p => {
    const a = document.createElement('a');
    a.className = 'project-card';
    a.href = p.html_url;
    a.target = '_blank';
    a.rel = 'noopener';

    a.innerHTML = `
      <div class="project-card-body">
        <h3 class="project-title">${escapeHtml(p.name)}</h3>
        <p class="project-desc">${escapeHtml(p.description || 'No description')}</p>
        <div class="project-meta">
          <span class="lang">${escapeHtml(p.language || '')}</span>
          <span class="stars">★ ${p.stargazers_count || 0}</span>
        </div>
      </div>
    `;
    container.appendChild(a);
  });
}

// HTML escape helper
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Fetching repos 
async function fetchGitHubProjects(username, {limit = 8, sort = 'updated'} = {}) {
  try {
    const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=${sort}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('GitHub API error');
    const repos = await res.json();
    // filter and sort client-side: exclude forks, take top by stars or recent
    const filtered = repos
      .filter(r => !r.fork)
      .sort((a,b) => (b.stargazers_count - a.stargazers_count) || (new Date(b.updated_at) - new Date(a.updated_at)))
      .slice(0, limit);
    return filtered;
  } catch (err) {
    console.warn('Failed to fetch GitHub repos', err);
    return null;
  }
}

(async () => {
  const username = 'kraken-503'; 
  const projects = await fetchGitHubProjects(username, {limit: 8});
  if (projects && projects.length) renderProjectCards(projects);
  else {
    // fallback
    const container = document.getElementById('projects-grid');
    if (container) container.innerHTML = '<p class="muted">Unable to load projects. Try again later.</p>';
  }
})();

const el = document.querySelector('script[src="https://giscus.app/client.js"]');
if (el && window.giscus) {
  window.giscus.setConfig({ theme: document.body.classList.contains('light-mode') ? 'light' : 'dark' });
}

