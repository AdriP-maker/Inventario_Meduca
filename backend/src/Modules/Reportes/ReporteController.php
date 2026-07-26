<?php
namespace Modules\Reportes;

use Core\Database;
use Core\Response;
use Core\Middleware\AuthMiddleware;

class ReporteController {
    public function generar(): void {
        AuthMiddleware::authenticate();

        $tipo = trim($_GET['tipo'] ?? 'prestamos'); // prestamos, herramientas, devoluciones, funcionarios
        $fecha_desde = trim($_GET['fecha_desde'] ?? '');
        $fecha_hasta = trim($_GET['fecha_hasta'] ?? '');

        $data = [];

        switch ($tipo) {
            case 'herramientas':
                $data = Database::query("SELECT * FROM herramientas ORDER BY nombre ASC");
                break;

            case 'funcionarios':
                $data = Database::query("SELECT * FROM funcionarios ORDER BY nombre ASC");
                break;

            case 'devoluciones':
                $sql = "
                    SELECT d.*, p.codigo_prestamo, p.escuela_proyecto, f.nombre AS funcionario_nombre, f.apellido AS funcionario_apellido
                    FROM devoluciones d
                    JOIN prestamos p ON d.prestamo_id = p.id
                    JOIN funcionarios f ON p.funcionario_id = f.id
                    WHERE 1=1
                ";
                $params = [];
                if ($fecha_desde) {
                    $sql .= " AND DATE(d.fecha_devolucion) >= :fd";
                    $params['fd'] = $fecha_desde;
                }
                if ($fecha_hasta) {
                    $sql .= " AND DATE(d.fecha_devolucion) <= :fh";
                    $params['fh'] = $fecha_hasta;
                }
                $sql .= " ORDER BY d.id DESC";
                $data = Database::query($sql, $params);
                break;

            case 'prestamos':
            default:
                $sql = "
                    SELECT p.*, f.nombre AS funcionario_nombre, f.apellido AS funcionario_apellido, f.cedula AS funcionario_cedula,
                           u.nombre AS registrado_por
                    FROM prestamos p
                    JOIN funcionarios f ON p.funcionario_id = f.id
                    JOIN usuarios u ON p.usuario_registro_id = u.id
                    WHERE 1=1
                ";
                $params = [];
                if ($fecha_desde) {
                    $sql .= " AND DATE(p.fecha_prestamo) >= :fd";
                    $params['fd'] = $fecha_desde;
                }
                if ($fecha_hasta) {
                    $sql .= " AND DATE(p.fecha_prestamo) <= :fh";
                    $params['fh'] = $fecha_hasta;
                }
                $sql .= " ORDER BY p.id DESC";
                $data = Database::query($sql, $params);

                // Add tools to loans report
                foreach ($data as &$p) {
                    $p['herramientas'] = Database::query("
                        SELECT h.codigo, h.nombre, h.marca, pd.estado_entrega, pd.estado_devolucion
                        FROM prestamo_detalles pd
                        JOIN herramientas h ON pd.herramienta_id = h.id
                        WHERE pd.prestamo_id = :pid
                    ", ['pid' => $p['id']]);
                }
                break;
        }

        Response::success([
            'tipo' => $tipo,
            'fecha_desde' => $fecha_desde,
            'fecha_hasta' => $fecha_hasta,
            'registros' => $data
        ], 'Reporte generado con éxito');
    }
}
