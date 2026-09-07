'use strict';

const loginForm = $('#login-form');
const loginButton = $('#submit');

const flashMessage = flash.pop();
if (flashMessage) showAlert('success', flashMessage);

captcha.init();

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(loginForm);
  if (flashMessage) hideAlert();

  const values = {
    login: loginForm.login.value.trim(),
    password: loginForm.password.value,
    captcha: loginForm.captcha.value.trim(),
  };

  const clientErrors = {};
  if (!values.login) clientErrors.login = 'Введите логин или email';
  if (!values.password) clientErrors.password = 'Введите пароль';

  const captchaError = validators.captcha(values.captcha);
  if (captchaError) clientErrors.captcha = captchaError;

  if (Object.keys(clientErrors).length > 0) {
    applyServerErrors(clientErrors);
    return;
  }

  setLoading(loginButton, true);
  const { ok, data } = await api('/api/login', { method: 'POST', body: values });
  setLoading(loginButton, false);

  if (ok) {
    window.location.href = '/profile';
    return;
  }

  captcha.render(data.captcha);
  applyServerErrors(data.errors || { form: 'Неверный логин или пароль' });
});
