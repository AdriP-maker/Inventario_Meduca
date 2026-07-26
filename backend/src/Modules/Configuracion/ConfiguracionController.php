<?php
namespace Modules\Configuracion;

use Core\Database;
use Core\Response;
use Core\Middleware\AuthMiddleware;

class ConfiguracionController {
    public function index(): void {
        AuthMiddleware::authenticate();
        $configs = Database::query("SELECT clave, valor, descripcion FROM configuracion");
        
        $response = [];
        foreach ($configs as $c) {
            $response[$c['clave']] = [
                'valor' => $c['valor'],
                'descripcion' => $c['descripcion']
            ];
        }

        Response::success($response, 'Configuraciones del sistema');
    }

    public function update(): void {
        $user = AuthMiddleware::authenticate();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        foreach ($body as $clave => $valor) {
            if (is_string($clave)) {
                Database::execute("
                    INSERT INTO configuracion (clave, valor) VALUES (:c, :v)
                    ON DUPLICATE KEY UPDATE valor = :v
                ", ['c' => $clave, 'v' => is_array($valor) ? json_encode($valor) : (string)$valor]);
            }
        }

        // Audit log
        Database::execute(
            "INSERT INTO historial_actividades (usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle) VALUES (:uid, :unombre, 'Configuración', 'Sistema', 1, 'Configuración general actualizada')",
            [
                'uid' => $user['id'],
                'unombre' => $user['nombre']
            ]
        );

        Response::success(null, 'Configuración del sistema guardada con éxito');
    }

    public function cambiarPassword(): void {
        $user = AuthMiddleware::authenticate();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $nueva = trim($body['nueva_password'] ?? '');
        $confirmar = trim($body['confirmar_password'] ?? '');

        if (!$nueva || strlen($nueva) < 6) {
            Response::error('La nueva contraseña debe tener al menos 6 caracteres.', 400);
        }

        if ($nueva !== $confirmar) {
            Response::error('La confirmación de la contraseña no coincide.', 400);
        }

        $hash = password_hash($nueva, PASSWORD_BCRYPT);

        Database::execute("UPDATE usuarios SET password_hash = :hash WHERE id = :id", [
            'hash' => $hash,
            'id' => $user['id']
        ]);

        Database::execute(
            "INSERT INTO historial_actividades (usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle) VALUES (:uid, :unombre, 'Seguridad', 'Usuarios', :uid, 'Contraseña actualizada')",
            [
                'uid' => $user['id'],
                'unombre' => $user['nombre']
            ]
        );

        Response::success(null, 'Contraseña actualizada con éxito');
    }
}
