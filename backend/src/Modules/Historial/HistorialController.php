<?php
namespace Modules\Historial;

use Core\Database;
use Core\Response;
use Core\Middleware\AuthMiddleware;

class HistorialController {
    public function index(): void {
        AuthMiddleware::authenticate();
        $search = trim($_GET['search'] ?? '');

        if ($search) {
            $sql = "SELECT * FROM historial_actividades WHERE (usuario_nombre LIKE :s OR accion LIKE :s OR entidad LIKE :s OR detalle LIKE :s) ORDER BY id DESC LIMIT 100";
            $historial = Database::query($sql, ['s' => "%$search%"]);
        } else {
            $historial = Database::query("SELECT * FROM historial_actividades ORDER BY id DESC LIMIT 100");
        }

        Response::success($historial, 'Historial de auditoría de actividades');
    }
}
