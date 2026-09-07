(() => {
  document.querySelectorAll('[data-work-detail]').forEach(button => {
    const dialog = document.getElementById(button.dataset.workDetail);
    if (!dialog) return;
    button.addEventListener('click', () => {
      dialog.showModal();
    });
    dialog.addEventListener('click', event => {
      const box = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => button.focus({preventScroll:true}));
  });
})();