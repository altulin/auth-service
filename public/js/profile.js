'use strict';

const logoutButton = $('#logout');

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(String(value).replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

async function loadProfile() {
  const { ok, data } = await api('/api/me');

  if (!ok) {
    window.location.href = '/login';
    return;
  }

  const { user } = data;
  $('#greeting').textContent = `Добро пожаловать, ${user.username}!`;
  $('#email').textContent = user.email;
  $('#created-at').textContent = formatDate(user.createdAt);
  $('#role').textContent = user.role;
  $('#profile').hidden = false;
}

logoutButton.addEventListener('click', async () => {
  setLoading(logoutButton, true, 'Выходим…');
  await api('/api/logout', { method: 'POST' });
  window.location.href = '/login';
});

loadProfile();
