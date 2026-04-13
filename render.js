document.addEventListener('DOMContentLoaded', () => {

  // --- 0. Loading Screen ---
  const loaderWrapper = document.getElementById('loader-wrapper');
  const loaderPercentage = document.getElementById('loader-percentage');
  const loaderProgress = document.getElementById('loader-progress');
  
  if (loaderWrapper && loaderPercentage && loaderProgress) {
    let progress = 0;
    const targetTime = 3600; // 3.6 seconds loading
    const interval = 30;
    const increment = 100 / (targetTime / interval);
    
    // Check if body has star-mode from local storage
    if (localStorage.getItem('theme') === 'star') {
        document.body.classList.add('star-mode');
        document.body.classList.remove('ocean-mode');
    }
    
    // Prevent scrolling while loading
    document.body.style.overflow = 'hidden'; 
    
    const loadingInterval = setInterval(() => {
      progress += increment;
      if (progress >= 100) {
        progress = 100;
        clearInterval(loadingInterval);
        setTimeout(() => {
          loaderWrapper.classList.add('hidden');
          document.body.style.overflow = ''; // restore scrolling
        }, 300);
      }
      loaderPercentage.innerText = Math.floor(progress);
      loaderProgress.style.width = progress + '%';
    }, interval);
  }

  // --- 1. My Project (Layout 3) ---
  const renderProjectCard = (p) => {
    return `
      <a aria-label="${p.ariaLabel}" class="proj3-card project-open" data-base="${p.base}" data-max="${p.max || ''}" data-title="${p.title}" ${p.proposal ? `data-proposal="${p.proposal}"` : ''} ${p.proposalText ? `data-proposal-text="${p.proposalText.replace(/"/g, '&quot;')}"` : ''} href="#">
        <img alt="${p.title} — cover" draggable="false" loading="lazy" src="${p.imagePath}"/>
      </a>
    `;
  };

  const groupProjectContainer = document.getElementById('project-group-container');
  if (groupProjectContainer && portfolioData.projects.group) {
    groupProjectContainer.innerHTML = portfolioData.projects.group.map(renderProjectCard).join('');
  }

  const individualProjectContainer = document.getElementById('project-individual-container');
  if (individualProjectContainer && portfolioData.projects.individual) {
    individualProjectContainer.innerHTML = portfolioData.projects.individual.map(renderProjectCard).join('');
  }

  // --- 2. Social Media (Layout 3) ---
  const renderSocialCard = (s) => {
    return `
      <a aria-label="${s.ariaLabel}" class="proj3-card ${s.fitContain ? 'fit-contain' : ''}" href="${s.url}" rel="noopener" target="_blank">
        <img alt="${s.ariaLabel}" draggable="false" loading="lazy" src="${s.imagePath}"/>
      </a>
    `;
  };

  const fbContainer = document.getElementById('social-fb-container');
  if (fbContainer && portfolioData.socialMedia.facebook) {
    fbContainer.innerHTML = portfolioData.socialMedia.facebook.map(renderSocialCard).join('');
  }

  const tiktokContainer = document.getElementById('social-tiktok-container');
  if (tiktokContainer && portfolioData.socialMedia.tiktok) {
    tiktokContainer.innerHTML = portfolioData.socialMedia.tiktok.map(renderSocialCard).join('');
  }

  const youtubeContainer = document.getElementById('social-youtube-container');
  if (youtubeContainer && portfolioData.socialMedia.youtube) {
    youtubeContainer.innerHTML = portfolioData.socialMedia.youtube.map(renderSocialCard).join('');
  }

  // --- 3. Business Analysis & Websites (Layout 3) ---
  const renderLinkCard = (l) => {
    if (l.isImage) {
      return `
        <a aria-label="${l.title || 'Placeholder'}" class="proj3-card" href="${l.url}">
          <img alt="${l.title || 'Placeholder'}" draggable="false" loading="lazy" src="${l.imagePath}"/>
        </a>
      `;
    }
    return `
      <a aria-label="Open ${l.title}" class="proj3-card proj3-link-card" href="${l.url}" rel="noopener" target="_blank">
        <div>
          <div class="proj3-link-top">
            <span class="proj3-link-badge">${l.badge}</span>
            <div class="proj3-link-title">${l.title}</div>
            ${l.pill ? `<span class="proj3-pill">${l.pill}</span>` : ''}
          </div>
          <div class="proj3-link-desc">${l.desc}</div>
        </div>
        <div class="proj3-link-url">${l.linkText}</div>
      </a>
    `;
  };

  const baContainer = document.getElementById('ba-container');
  if (baContainer && portfolioData.businessAnalysis) {
    baContainer.innerHTML = portfolioData.businessAnalysis.map(renderLinkCard).join('');
  }

  const websitesContainer = document.getElementById('websites-container');
  if (websitesContainer && portfolioData.websites) {
    websitesContainer.innerHTML = portfolioData.websites.map(renderLinkCard).join('');
  }

  // --- 4. My Work (Layout 4) ---
  const renderEvoCard = (e) => {
    return `
      <a class="w4m-subcard" href="${e.url}">
        <img alt="${e.phase}" src="${e.imagePath}"/>
        <span class="w4m-phase">${e.phase}</span>
      </a>
    `;
  };

  const evoContainer = document.getElementById('work-evo-container');
  if (evoContainer && portfolioData.myWork.evolution) {
    const evoHtml = portfolioData.myWork.evolution.map(renderEvoCard).join('<div aria-hidden="true" class="w4m-arrow">→</div>');
    evoContainer.innerHTML = evoHtml;
  }

  const workItemsContainer = document.getElementById('work-items-container');
  if (workItemsContainer && portfolioData.myWork.items) {
    const itemsHtml = portfolioData.myWork.items.map(item => `
      <a class="w4m-item" href="${item.url}">
        <img alt="${item.category}" src="${item.imagePath}"/>
        <div class="w4m-item-foot">
          <span class="w4m-category">${item.category}</span>
          <span class="w4m-more">Xem chi tiết →</span>
        </div>
      </a>
    `).join('');
    workItemsContainer.innerHTML = itemsHtml;
  }

  // --- 5. My Certificate (Layout 6) ---
  const renderCert = (c) => {
    if (c.type === 'duo') {
      return `
        <div aria-label="MOS results" class="c6-card c6-duo-card">
          ${c.images.map(img => `<a class="c6-duo-cell" href="${img.url}" rel="noopener" target="_blank"><img alt="${img.alt}" draggable="false" loading="lazy" src="${img.imagePath}"/></a>`).join('')}
        </div>
      `;
    }
    return `
      <a class="c6-card c6-${c.type}" href="${c.url}" rel="noopener" target="_blank">
        <img alt="${c.alt}" draggable="false" loading="lazy" src="${c.imagePath}"/>
      </a>
    `;
  };

  const certContainer1 = document.getElementById('cert-marquee-1');
  const certContainer2 = document.getElementById('cert-marquee-2');
  if (certContainer1 && certContainer2 && portfolioData.certificates) {
    const certHtml = portfolioData.certificates.map(renderCert).join('');
    certContainer1.innerHTML = certHtml;
    certContainer2.innerHTML = certHtml;
  }

  // --- 6. Contact / Sites (Layout 7) ---
  const renderSiteBtn = (s) => {
    const innerText = s.pill 
      ? `<span class="ct7-site-copy"><span class="ct7-site-text">${s.l7ShortText}</span><span class="ct7-site-note">${s.pill}</span></span>`
      : `<span class="ct7-site-text">${s.l7ShortText}</span>`;
      
    return `
      <a class="ct7-site-btn ${s.l7Wide ? 'ct7-site-wide' : ''}" href="${s.l7Url || s.url}" rel="noopener" target="_blank">
        <span class="ct7-site-ico ${s.l7ColorClass}">${s.l7Icon}</span>
        ${innerText}
        <span class="ct7-site-arrow">→</span>
      </a>
    `;
  };

  const l7SitesContainer = document.getElementById('l7-sites-container');
  if (l7SitesContainer && portfolioData.websites) {
    l7SitesContainer.innerHTML = portfolioData.websites.map(renderSiteBtn).join('');
  }

});
