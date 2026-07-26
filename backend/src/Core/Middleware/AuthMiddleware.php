<?php
namespace Core\Middleware;

use Core\JWT;
use Core\Response;

class AuthMiddleware {
    public static function authenticate(): array {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (!$authHeader || !preg_match('/Bearer\s(\S+)/i', $authHeader, $matches)) {
            Response::error('Acceso no autorizado. Se requiere token JWT válido.', 401);
        }

        $token = $matches[1];
        $payload = JWT::decode($token);

        if (!$payload) {
            Response::error('Token inválido o expirado. Por favor inicia sesión de nuevo.', 401);
        }

        return $payload;
    }
}
