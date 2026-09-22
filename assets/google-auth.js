function initializeGoogleLogin() {
    const button = document.getElementById('google-login-button');
    const clientId = window.SIPERPU_GOOGLE_CLIENT_ID || '';
    if (!button) return;
    if (!clientId) {
        button.innerHTML = '<button type="button" class="google-fallback-button">Masuk dengan Google</button>';
        button.querySelector('button').addEventListener('click', function () {
            const error = document.getElementById('google-login-error');
            if (error) error.textContent = 'Login Google belum dikonfigurasi. Isi GOOGLE_CLIENT_ID terlebih dahulu.';
        });
        return;
    }
    if (!window.google?.accounts?.id) return;

    google.accounts.id.initialize({
        client_id: clientId,
        callback: function (response) {
            document.getElementById('google-credential').value = response.credential;
            document.getElementById('google-login-form').submit();
        },
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