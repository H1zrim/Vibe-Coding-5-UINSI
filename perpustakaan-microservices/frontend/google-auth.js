const GOOGLE_USER_STORAGE_KEY = 'siperpu_google_user';

function getGoogleClientId() {
  return window.API_CONFIG?.GOOGLE_CLIENT_ID || '';
}

function decodeJwtPayload(credential) {
  const parts = String(credential || '').split('.');
  if (parts.length !== 3) throw new Error('Credential Google tidak valid.');

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  const payload = new TextDecoder().decode(bytes);

  return JSON.parse(payload);
}

function handleGoogleCredential(response) {
  try {
    const payload = decodeJwtPayload(response.credential);
    if (!payload.sub || !payload.email) throw new Error('Profil Google tidak lengkap.');

    const user = {
      id: payload.sub,
      name: payload.name || payload.email,
      email: payload.email,
      picture: payload.picture || '',
      givenName: payload.given_name || '',
      familyName: payload.family_name || '',
      locale: payload.locale || '',
      loggedInAt: new Date().toISOString()
    };

    sessionStorage.setItem(GOOGLE_USER_STORAGE_KEY, JSON.stringify(user));
    window.location.href = 'dashboard.html';
  } catch (error) {
    const errorElement = document.getElementById('google-login-error');
    if (errorElement) errorElement.textContent = error.message || 'Login Google gagal.';
    console.error('[google-auth]', error);
  }
}

function initializeGoogleLogin() {
  const button = document.getElementById('google-login-button');
  const errorElement = document.getElementById('google-login-error');
  const clientId = getGoogleClientId();

  if (!button) return;
  if (!clientId || clientId.startsWith('YOUR_')) {
    if (errorElement) errorElement.textContent = 'Isi GOOGLE_CLIENT_ID di frontend/config.js terlebih dahulu.';
    return;
  }
  if (!window.google?.accounts?.id) {
    if (errorElement) errorElement.textContent = 'Google Identity Services belum siap. Muat ulang halaman.';
    return;
  }

  google.accounts.id.initialize({
    client_id: clientId,
    callback: handleGoogleCredential,
    auto_select: false,
    cancel_on_tap_outside: true
  });
  google.accounts.id.renderButton(button, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    width: 320
  });
}

function getStoredGoogleUser() {
  try {
    return JSON.parse(sessionStorage.getItem(GOOGLE_USER_STORAGE_KEY)) || null;
  } catch (_) {
    return null;
  }
}

function protectGoogleDashboard() {
  const user = getStoredGoogleUser();
  if (!user) {
    window.location.replace('login.html');
    return null;
  }
  return user;
}

function logoutGoogle() {
  if (window.google?.accounts?.id) google.accounts.id.disableAutoSelect();
  sessionStorage.removeItem(GOOGLE_USER_STORAGE_KEY);
  window.location.replace('login.html');
}

window.initializeGoogleLogin = initializeGoogleLogin;
window.handleGoogleCredential = handleGoogleCredential;
window.decodeJwtPayload = decodeJwtPayload;
window.getStoredGoogleUser = getStoredGoogleUser;
window.protectGoogleDashboard = protectGoogleDashboard;
window.logoutGoogle = logoutGoogle;