<?php
declare(strict_types=1);

final class AuthController
{
    public function __construct(private User $users) {}
    public function login(): void
    {
        $user = $this->users->findByLogin(trim($_POST['username'] ?? ''), $_POST['password'] ?? '');
        if (!$user) { flash('Username atau password salah.', 'danger'); redirect('index.php?page=login'); }
        session_regenerate_id(true); $_SESSION['user'] = $user; flash('Selamat datang, ' . $user['name'] . '!', 'success'); redirect();
    }
    public function googleLogin(): void
    {
        $credential = trim($_POST['credential'] ?? '');
        if (GOOGLE_CLIENT_ID === '' || $credential === '') {
            flash('Login Google belum dikonfigurasi.', 'danger');
            redirect('index.php?page=login');
        }

        try {
            $context = stream_context_create(['http' => ['ignore_errors' => true, 'timeout' => 5]]);
            $response = file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode($credential), false, $context);
            $profile = json_decode($response ?: '', true);
            if (!is_array($profile) || ($profile['aud'] ?? '') !== GOOGLE_CLIENT_ID || ($profile['email_verified'] ?? '') !== 'true' || empty($profile['email'])) {
                throw new RuntimeException('Token Google tidak valid.');
            }

            $user = $this->users->findOrCreateGoogle($profile);
            session_regenerate_id(true);
            $_SESSION['user'] = $user;
            flash('Selamat datang, ' . $user['name'] . '!', 'success');
            redirect();
        } catch (Throwable $error) {
            flash('Login Google gagal. Silakan coba lagi.', 'danger');
            redirect('index.php?page=login');
        }
    }
    public function register(): void
    {
        if (trim($_POST['name'] ?? '') === '' || trim($_POST['username'] ?? '') === '' || strlen($_POST['password'] ?? '') < 5) { flash('Nama, username, dan password minimal 5 karakter wajib diisi.', 'danger'); redirect('index.php?page=register'); }
        try { $_SESSION['user'] = $this->users->register($_POST); flash('Registrasi berhasil.', 'success'); redirect(); } catch (Throwable $error) { flash($error->getMessage(), 'danger'); redirect('index.php?page=register'); }
    }
    public function logout(): void { $_SESSION = []; session_destroy(); redirect('index.php?page=login'); }
}
