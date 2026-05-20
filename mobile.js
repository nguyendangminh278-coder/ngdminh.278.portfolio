web application/stitch/projects/10061089089173512892/screens/2d077564e4164deaa59cc6f913ad0886

/* MOBILE PORTFOLIO LOGIC */
(function() {
  if (window.innerWidth > 768) return;

  document.addEventListener('DOMContentLoaded', () => {
    initMobilePortfolio();
  });

  function initMobilePortfolio() {
    // 1. PROJECT PANEL LOGIC
    const star = document.querySelector('.four-point-star');
    const panel = document.querySelector('.project-panel-mobile');
    const closeBtn = document.querySelector('.close-panel');

    if (star && panel) {
      star.addEventListener('click', () => {
        panel.classList.add('open');
        document.body.style.overflow = 'hidden';
      });

      const closePanel = () => {
        panel.classList.remove('open');
        document.body.style.overflow = 'auto';
      };

      closeBtn.addEventListener('click', closePanel);
      
      // Close on outside click (backdrop)
      panel.addEventListener('click', (e) => {
        if (e.target === panel) closePanel();
      });
    }

    // 2. SKILLS TABS LOGIC
    const skillBtns = document.querySelectorAll('.skill-tab-btn');
    const skillContents = document.querySelectorAll('.skill-tab-content');

    skillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const content = document.getElementById(targetId);

        if (btn.classList.contains('active')) {
          btn.classList.remove('active');
          content.classList.remove('active');
        } else {
          skillBtns.forEach(b => b.classList.remove('active'));
          skillContents.forEach(c => c.classList.remove('active'));
          btn.classList.add('active');
          content.classList.add('active');
        }
      });
    });
  }
})();
