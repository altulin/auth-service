'use strict';

const registerForm = $('#register-form');
const registerButton = $('#submit');

captcha.init();

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors(registerForm);

  const values = {
    username: registerForm.username.value.trim(),
    email: registerForm.email.value.trim(),
    password: registerForm.password.value,
    confirmPassword: registerForm.confirmPassword.value,
    captcha: registerForm.captcha.value.trim(),
  };

  const clientErrors = {};

  const usernameError = validators.username(values.username);
  if (usernameError) clientErrors.username = usernameError;

  const emailError = validators.email(values.email);
  if (emailError) clientErrors.email = emailError;

  const passwordError = validators.password(values.password);
  if (passwordError) clientErrors.password = passwordError;
  else if (values.password !== values.confirmPassword) {
    clientErrors.confirmPassword = 'Пароли не совпадают';
  }

  const captchaError = validators.captcha(values.captcha);
  if (captchaError) clientErrors.captcha = captchaError;

  if (Object.keys(clientErrors).length > 0) {
    applyServerErrors(clientErrors);
    return;
  }

  setLoading(registerButton, true);
  const { ok, data } = await api('/api/register', { method: 'POST', body: values });
  setLoading(registerButton, false);

  if (ok) {
    flash.set(data.message || 'Регистрация успешна! Войдите в систему.');
    window.location.href = '/login';
    return;
  }

  captcha.render(data.captcha);
  applyServerErrors(data.errors || { form: 'Не удалось зарегистрироваться' });
});
