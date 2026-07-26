<?php
namespace Modules\Dashboard;

use Core\Database;
use Core\Response;
use Core\Middleware\AuthMiddleware;

class DashboardController {
    public function stats(): void {
        AuthMiddleware::authenticate();

        $totalHerramientas = Database::fetch("SELECT COUNT(*) as count FROM herramientas")['count'] ?? 0;
        $disponibles = Database::fetch("SELECT COUNT(*) as count FROM herramientas WHERE estado = 'Disponible'")['count'] ?? 0;
        $prestamosActivos = Database::fetch("SELECT COUNT(*) as count FROM prestamos WHERE estado = 'Prestado'")['count'] ?? 0;
        $herramientasDevueltas = Database::fetch("SELECT COUNT(*) as count FROM prestamos WHERE estado = 'Devuelto'")['count'] ?? 0;
        $funcionariosRegistrados = Database::fetch("SELECT COUNT(*) as count FROM funcionarios WHERE estado = 'Activo'")['count'] ?? 0;
        $enMantenimiento = Database::fetch("SELECT COUNT(*) as count FROM herramientas WHERE estado = 'Mantenimiento'")['count'] ?? 0;
        $danadas = Database::fetch("SELECT COUNT(*) as count FROM herramientas WHERE estado = 'Dañado'")['count'] ?? 0;

        // Active Loans table details
        $prestamosLista = Database::query("
            SELECT p.id, p.codigo_prestamo, p.fecha_prestamo, p.fecha_devolucion_estimada, p.escuela_proyecto, p.estado,
                   f.nombre AS funcionario_nombre, f.apellido AS funcionario_apellido, f.cargo AS funcionario_cargo,
                   u.nombre AS registrado_por,
                   h.nombre AS herramienta_nombre, h.foto_url AS herramienta_foto
            FROM prestamos p
            JOIN funcionarios f ON p.funcionario_id = f.id
            JOIN usuarios u ON p.usuario_registro_id = u.id
            LEFT JOIN prestamo_detalles pd ON p.id = pd.prestamo_id
            LEFT JOIN herramientas h ON pd.herramienta_id = h.id
            WHERE p.estado = 'Prestado'
            ORDER BY p.fecha_prestamo DESC
            LIMIT 10
        ");

        // Recently returned loans
        $devueltosRecientemente = Database::query("
            SELECT p.id, p.codigo_prestamo, p.fecha_prestamo, p.fecha_devolucion_real, p.escuela_proyecto, p.estado,
                   f.nombre AS funcionario_nombre, f.apellido AS funcionario_apellido, f.cargo AS funcionario_cargo,
                   u.nombre AS registrado_por,
                   h.nombre AS herramienta_nombre, h.foto_url AS herramienta_foto
            FROM prestamos p
            JOIN funcionarios f ON p.funcionario_id = f.id
            JOIN usuarios u ON p.usuario_registro_id = u.id
            LEFT JOIN prestamo_detalles pd ON p.id = pd.prestamo_id
            LEFT JOIN herramientas h ON pd.herramienta_id = h.id
            WHERE p.estado = 'Devuelto'
            ORDER BY p.fecha_devolucion_real DESC
            LIMIT 5
        ");

        Response::success([
            'kpis' => [
                'total_herramientas' => (int)$totalHerramientas,
                'disponibles' => (int)$disponibles,
                'prestamos_activos' => (int)$prestamosActivos,
                'herramientas_devueltas' => (int)$herramientasDevueltas,
                'funcionarios_registrados' => (int)$funcionariosRegistrados,
                'en_mantenimiento' => (int)$enMantenimiento,
                'danadas' => (int)$danadas
            ],
            'prestamos_activos' => $prestamosLista,
            'devueltos_recientemente' => $devueltosRecientemente
        ], 'Métricas del Dashboard obtenidas con éxito');
    }
}
