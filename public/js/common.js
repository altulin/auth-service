'use strict';

const $ = (selector, root = document) => root.querySelector(selector);

async function api(path, { method = 'GET', body } = {}) {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await response.json();
  } catch {

  }

  return { ok: response.ok, status: response.status, data };
}

function showAlert(type, message) {
  const box = $('#alert');
  if (!box) return;
  box.textContent = message;
  box.className = `alert alert--${type} alert--visible`;
}

function hideAlert() {
  const box = $('#alert');
  if (box) box.className = 'alert';
}

function setFieldError(name, message) {
  const input = $(`[name="${name}"]`);
  const error = $(`#error-${name}`);

  if (input) input.classList.add('field__input--invalid');
  if (error) {
    error.textContent = message;
    error.classList.add('field__error--visible');
  }
}

function clearErrors(form) {
  hideAlert();
  form.querySelectorAll('.field__input--invalid').forEach((el) => {
    el.classList.remove('field__input--invalid');
  });
  form.querySelectorAll('.field__error--visible').forEach((el) => {
    el.classList.remove('field__error--visible');
    el.textContent = '';
  });
}

function applyServerErrors(errors = {}) {
  let firstFieldError = null;

  for (const [field, message] of Object.entries(errors)) {
    if (field === 'form') {
      showAlert('error', message);
    } else {
      setFieldError(field, message);
      if (!firstFieldError) firstFieldError = field;
    }
  }

  if (firstFieldError) $(`[name="${firstFieldError}"]`)?.focus();
}

const validators = {
  username(value) {
    if (!value) return 'Введите имя пользователя';
    if (!/^[A-Za-z0-9]{3,20}$/.test(value)) {
      return 'Только латиница и цифры, от 3 до 20 символов';
    }
    return null;
  },

  email(value) {
    if (!value) return 'Введите email';
    if (!value.includes('@') || !/^[^\s@]+@[^\s@.]+\.[A-Za-z]{2,}$/.test(value)) {
      return 'Введите корректный email';
    }
    return null;
  },

  password(value) {
    if (!value) return 'Введите пароль';
    if (value.length < 6) return 'Минимум 6 символов';
    if (!/[A-Za-zА-Яа-я]/.test(value) || !/\d/.test(value)) {
      return 'Пароль должен содержать буквы и цифры';
    }
    return null;
  },

  captcha(value) {
    if (!value) return 'Введите ответ на капчу';
    if (!/^-?\d{1,4}$/.test(value.trim())) return 'Ответ должен быть числом';
    return null;
  },
};

const captcha = {
  input: () => $('[name="captcha"]'),

  render(data) {
    const box = $('#captcha-question');
    if (box && data?.question) box.textContent = data.question;
    const input = captcha.input();
    if (input) input.value = '';
  },

  async refresh() {
    const { ok, data } = await api('/api/captcha');
    if (ok) captcha.render(data);
  },

  init() {
    $('#captcha-refresh')?.addEventListener('click', () => captcha.refresh());
    captcha.refresh();
  },
};

const flash = {
  set(message) {
    sessionStorage.setItem('flash', message);
  },
  pop() {
    const message = sessionStorage.getItem('flash');
    sessionStorage.removeItem('flash');
    return message;
  },
};

function setLoading(button, isLoading, loadingText = 'Подождите…') {
  if (!button) return;
  if (isLoading) {
    button.dataset.label = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.label || button.textContent;
    button.disabled = false;
  }
}
