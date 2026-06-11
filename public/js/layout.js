const usersPanelOverlay = document.createElement('button');
usersPanelOverlay.type = 'button';
usersPanelOverlay.className = 'users-overlay';
usersPanelOverlay.setAttribute('aria-label', 'Close users');
document.body.appendChild(usersPanelOverlay);

function closeUsersPanel() {
  document.querySelector('.users-panel')?.classList.remove('open');
  usersPanelOverlay.classList.remove('open');
}

document.getElementById('toggleUsers')?.addEventListener('click', () => {
  usersPanelOverlay.classList.toggle('open');
});

usersPanelOverlay.addEventListener('click', closeUsersPanel);
