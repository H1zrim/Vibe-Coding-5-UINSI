<?php
declare(strict_types=1);

final class User
{
    public function __construct(private DatabaseInterface $db) {}

    public function findByLogin(string $login, string $password): ?array
    {
        foreach ($this->db->read()['users'] as $user) {
            $matches = strcasecmp($user['username'], $login) === 0 || strcasecmp($user['email'] ?? '', $login) === 0;
            if ($matches && password_verify($password, $user['password'])) {
                unset($user['password']);
                return $user;
            }
        }
        return null;
    }

    public function find(string $id): ?array
    {
        foreach ($this->db->read()['users'] as $user) {
            if ($user['id'] === $id) { unset($user['password']); return $user; }
        }
        return null;
    }

    public function all(): array
    {
        return array_map(function (array $user): array { unset($user['password']); return $user; }, $this->db->read()['users']);
    }

    public function register(array $input): array
    {
        return $this->db->transaction(function (array &$data) use ($input): array {
            $username = strtolower(trim($input['username']));
            foreach ($data['users'] as $user) {
                if (strcasecmp($user['username'], $username) === 0) throw new DomainException('Username sudah digunakan.');
            }
            $user = [
                'id' => 'u-' . preg_replace('/[^a-z0-9]/i', '', $username) . '-' . time(),
                'username' => $username, 'password' => password_hash($input['password'], PASSWORD_DEFAULT),
                'name' => trim($input['name']), 'nim' => trim($input['nim'] ?? ''), 'role' => 'mahasiswa'
            ];
            $data['users'][] = $user;
            unset($user['password']);
            return $user;
        });
    }

    public function findOrCreateGoogle(array $profile): array
    {
        $email = strtolower(trim((string) $profile['email']));
        foreach ($this->db->read()['users'] as $user) {
            if (strcasecmp($user['username'], $email) === 0) {
                unset($user['password']);
                return $user;
            }
        }

        return $this->db->transaction(function (array &$data) use ($email, $profile): array {
            foreach ($data['users'] as $user) {
                if (strcasecmp($user['username'], $email) === 0) {
                    unset($user['password']);
                    return $user;
                }
            }
            $user = [
                'id' => 'google-' . preg_replace('/[^a-z0-9]/i', '', (string) ($profile['sub'] ?? $email)),
                'username' => $email,
                'password' => password_hash(bin2hex(random_bytes(24)), PASSWORD_DEFAULT),
                'name' => trim((string) ($profile['name'] ?? $email)),
                'role' => 'mahasiswa',
                'nim' => null,
            ];
            $data['users'][] = $user;
            unset($user['password']);
            return $user;
        });
    }
}
