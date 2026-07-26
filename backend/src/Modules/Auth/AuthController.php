<?php
namespace Modules\Auth;

use Core\Database;
use Core\Response;
use Core\JWT;
use Core\Middleware\AuthMiddleware;

class AuthController {
    public function login(): void {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $usuario = trim($body['usuario'] ?? '');
        $password = trim($body['password'] ?? '');

        if (!$usuario || !$password) {
            Response::error('Debe ingresar el usuario y la contraseña.', 400);
        }

        $user = Database::fetch("SELECT * FROM usuarios WHERE usuario = :usuario AND estado = 'Activo'", [
            'usuario' => $usuario
        ]);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            Response::error('Usuario o contraseña incorrectos.', 401);
        }

        // Generate JWT Token
        $payload = [
            'id' => $user['id'],
            'nombre' => $user['nombre'],
            'usuario' => $user['usuario'],
            'email' => $user['email'],
            'rol' => $user['rol']
        ];
        $token = JWT::generate($payload);

        // Audit Log
        Database::execute(
            "INSERT INTO historial_actividades (usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle) VALUES (:uid, :unombre, 'Inicio de Sesión', 'Auth', :eid, 'Usuario inició sesión exitosamente')",
            [
                'uid' => $user['id'],
                'unombre' => $user['nombre'],
                'eid' => $user['id']
            ]
        );

        Response::success([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'nombre' => $user['nombre'],
                'usuario' => $user['usuario'],
                'email' => $user['email'],
                'rol' => $user['rol']
            ]
        ], 'Inicio de sesión exitoso');
    }

    public function me(): void {
        $user = AuthMiddleware::authenticate();
        Response::success($user, 'Datos del usuario autenticado');
    }
}
