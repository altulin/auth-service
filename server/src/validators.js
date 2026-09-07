const USERNAME_RE = /^[A-Za-z0-9]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@.]+\.[A-Za-z]{2,}$/;

export function validateUsername(username) {
  if (!username) return 'Введите имя пользователя';
  if (!USERNAME_RE.test(username)) {
    return 'Имя пользователя: только латиница и цифры, от 3 до 20 символов';
  }
  return null;
}

export function validateEmail(email) {
  if (!email) return 'Введите email';
  if (email.length > 100 || !EMAIL_RE.test(email)) return 'Введите корректный email';
  return null;
}

export function validatePassword(password) {
  if (!password) return 'Введите пароль';
  if (password.length < 6) return 'Пароль должен содержать минимум 6 символов';
  if (!/[A-Za-zА-Яа-я]/.test(password) || !/\d/.test(password)) {
    return 'Пароль должен содержать буквы и цифры';
  }
  if (password.length > 128) return 'Пароль слишком длинный';
  return null;
}

export function validateRegistration({ username, email, password, confirmPassword }) {
  const errors = {};

  const usernameError = validateUsername(username);
  if (usernameError) errors.username = usernameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  if (!passwordError && password !== confirmPassword) {
    errors.confirmPassword = 'Пароли не совпадают';
  }

  return errors;
}
