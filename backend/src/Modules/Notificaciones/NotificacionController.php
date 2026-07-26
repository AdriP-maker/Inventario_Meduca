<?php
namespace Modules\Notificaciones;

use Core\Database;
use Core\Response;
use Core\Middleware\AuthMiddleware;

class NotificacionController {
    public function index(): void {
        AuthMiddleware::authenticate();

        $notificaciones = [];

        // 1. Alert: Loans overdue or due in <= 3 days
        $prestamosCriticos = Database::query("
            SELECT p.id, p.codigo_prestamo, p.fecha_devolucion_estimada, f.nombre, f.apellido, p.escuela_proyecto
            FROM prestamos p
            JOIN funcionarios f ON p.funcionario_id = f.id
            WHERE p.estado = 'Prestado' AND p.fecha_devolucion_estimada <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
            ORDER BY p.fecha_devolucion_estimada ASC
        ");

        foreach ($prestamosCriticos as $p) {
            $esVencido = strtotime($p['fecha_devolucion_estimada']) < strtotime(date('Y-m-d'));
            $notificaciones[] = [
                'id' => 'p_' . $p['id'],
                'tipo' => $esVencido ? 'danger' : 'warning',
                'titulo' => $esVencido ? 'Préstamo Vencido' : 'Préstamo Próximo a Vencer',
                'mensaje' => "El préstamo {$p['codigo_prestamo']} ({$p['nombre']} {$p['apellido']} - {$p['escuela_proyecto']}) " . ($esVencido ? "está vencido." : "vence el {$p['fecha_devolucion_estimada']}."),
                'fecha' => $p['fecha_devolucion_estimada'],
                'link' => '/devoluciones'
            ];
        }

        // 2. Alert: Tools in Maintenance or Damaged
        $herramientasMantenimiento = Database::query("
            SELECT id, codigo, nombre, estado, ubicacion
            FROM herramientas
            WHERE estado IN ('Mantenimiento', 'Dañado')
        ");

        foreach ($herramientasMantenimiento as $h) {
            $notificaciones[] = [
                'id' => 'h_' . $h['id'],
                'tipo' => $h['estado'] === 'Dañado' ? 'danger' : 'warning',
                'titulo' => "Herramienta {$h['estado']}",
                'mensaje' => "{$h['codigo']} - {$h['nombre']} se encuentra registrada como {$h['estado']} ({$h['ubicacion']}).",
                'fecha' => date('Y-m-d H:i'),
                'link' => '/herramientas'
            ];
        }

        // 3. System Info: Total active count
        $totalActivos = count($notificaciones);

        Response::success([
            'total_no_leidas' => $totalActivos,
            'notificaciones' => $notificaciones
        ], 'Notificaciones del sistema');
    }
}
