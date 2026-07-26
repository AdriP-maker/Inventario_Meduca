<?php
namespace Modules\Prestamos;

use Core\Database;
use Core\Response;
use Core\Middleware\AuthMiddleware;
use PDO;

class PrestamoController {
    public function index(): void {
        AuthMiddleware::authenticate();

        $prestamos = Database::query("
            SELECT p.*, f.nombre AS funcionario_nombre, f.apellido AS funcionario_apellido, f.cargo AS funcionario_cargo,
                   u.nombre AS usuario_nombre,
                   COUNT(pd.herramienta_id) AS total_herramientas
            FROM prestamos p
            JOIN funcionarios f ON p.funcionario_id = f.id
            JOIN usuarios u ON p.usuario_registro_id = u.id
            LEFT JOIN prestamo_detalles pd ON p.id = pd.prestamo_id
            GROUP BY p.id
            ORDER BY p.id DESC
        ");

        // Attach items list for each loan
        foreach ($prestamos as &$p) {
            $p['herramientas'] = Database::query("
                SELECT h.*, pd.estado_entrega, pd.estado_devolucion
                FROM prestamo_detalles pd
                JOIN herramientas h ON pd.herramienta_id = h.id
                WHERE pd.prestamo_id = :pid
            ", ['pid' => $p['id']]);
        }

        Response::success($prestamos, 'Listado de préstamos');
    }

    public function create(): void {
        $user = AuthMiddleware::authenticate();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $funcionario_id = (int)($body['funcionario_id'] ?? 0);
        $escuela_proyecto = trim($body['escuela_proyecto'] ?? '');
        $fecha_devolucion_estimada = trim($body['fecha_devolucion_estimada'] ?? '');
        $observaciones = trim($body['observaciones'] ?? '');
        $herramientas_ids = $body['herramientas_ids'] ?? [];

        if (!$funcionario_id || !$escuela_proyecto || empty($herramientas_ids)) {
            Response::error('Debe seleccionar el funcionario, indicar el proyecto/escuela y al menos 1 herramienta.', 400);
        }

        $pdo = Database::getInstance();
        try {
            $pdo->beginTransaction();

            $codigo = 'PRE-' . date('Y') . '-' . str_pad((string)rand(100, 999), 3, '0', STR_PAD_LEFT);

            $stmt = $pdo->prepare("
                INSERT INTO prestamos (codigo_prestamo, funcionario_id, usuario_registro_id, escuela_proyecto, fecha_prestamo, fecha_devolucion_estimada, estado, observaciones)
                VALUES (:codigo, :fid, :uid, :escuela, NOW(), :fdev, 'Prestado', :obs)
            ");
            $stmt->execute([
                'codigo' => $codigo,
                'fid' => $funcionario_id,
                'uid' => $user['id'],
                'escuela' => $escuela_proyecto,
                'fdev' => $fecha_devolucion_estimada ?: date('Y-m-d', strtotime('+7 days')),
                'obs' => $observaciones
            ]);
            $prestamo_id = $pdo->lastInsertId();

            $stmtDetalle = $pdo->prepare("
                INSERT INTO prestamo_detalles (prestamo_id, herramienta_id, estado_entrega)
                VALUES (:pid, :hid, 'Bueno')
            ");

            $stmtUpdateHerramienta = $pdo->prepare("
                UPDATE herramientas SET estado = 'Prestado' WHERE id = :hid
            ");

            foreach ($herramientas_ids as $hid) {
                $stmtDetalle->execute(['pid' => $prestamo_id, 'hid' => (int)$hid]);
                $stmtUpdateHerramienta->execute(['hid' => (int)$hid]);
            }

            $pdo->commit();

            // Audit log
            Database::execute(
                "INSERT INTO historial_actividades (usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle) VALUES (:uid, :unombre, 'Nuevo Préstamo', 'Prestamos', :eid, :detalle)",
                [
                    'uid' => $user['id'],
                    'unombre' => $user['nombre'],
                    'eid' => $prestamo_id,
                    'detalle' => "Préstamo $codigo registrado con " . count($herramientas_ids) . " herramientas"
                ]
            );

            Response::success(['id' => $prestamo_id, 'codigo' => $codigo], 'Préstamo registrado exitosamente', 201);
        } catch (\Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            Response::error('Error al registrar el préstamo: ' . $e->getMessage(), 500);
        }
    }
}
