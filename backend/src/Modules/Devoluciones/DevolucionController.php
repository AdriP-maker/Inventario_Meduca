<?php
namespace Modules\Devoluciones;

use Core\Database;
use Core\Response;
use Core\Middleware\AuthMiddleware;

class DevolucionController {
    public function index(): void {
        AuthMiddleware::authenticate();

        $devoluciones = Database::query("
            SELECT d.*, p.codigo_prestamo, p.escuela_proyecto,
                   f.nombre AS funcionario_nombre, f.apellido AS funcionario_apellido,
                   u.nombre AS registrado_por
            FROM devoluciones d
            JOIN prestamos p ON d.prestamo_id = p.id
            JOIN funcionarios f ON p.funcionario_id = f.id
            JOIN usuarios u ON d.usuario_registro_id = u.id
            ORDER BY d.id DESC
        ");

        Response::success($devoluciones, 'Historial de devoluciones');
    }

    public function registrar(): void {
        $user = AuthMiddleware::authenticate();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $prestamo_id = (int)($body['prestamo_id'] ?? 0);
        $observaciones = trim($body['observaciones'] ?? '');
        $estado_herramienta_devolucion = trim($body['estado_devolucion'] ?? 'Bueno');
        $cantidad_danada = max(0, (int)($body['cantidad_danada'] ?? ($estado_herramienta_devolucion === 'Con Daño' ? 1 : 0)));
        $descripcion_dano = trim($body['descripcion_dano'] ?? $observaciones ?: 'Daño reportado durante la recepción del préstamo');

        if (!$prestamo_id) {
            Response::error('Debe proporcionar el ID del préstamo a devolver.', 400);
        }

        $prestamo = Database::fetch("SELECT * FROM prestamos WHERE id = :id AND estado = 'Prestado'", ['id' => $prestamo_id]);
        if (!$prestamo) {
            Response::error('Préstamo no encontrado o ya ha sido devuelto.', 404);
        }

        $pdo = Database::getInstance();
        try {
            $pdo->beginTransaction();

            // Mark loan as returned
            $stmt = $pdo->prepare("
                UPDATE prestamos 
                SET estado = 'Devuelto', fecha_devolucion_real = NOW(), observaciones = CONCAT(IFNULL(observaciones, ''), '\nDevolución: ', :obs)
                WHERE id = :id
            ");
            $stmt->execute(['id' => $prestamo_id, 'obs' => $observaciones]);

            // Register return record
            $stmtDev = $pdo->prepare("
                INSERT INTO devoluciones (prestamo_id, usuario_registro_id, fecha_devolucion, observaciones)
                VALUES (:pid, :uid, NOW(), :obs)
            ");
            $stmtDev->execute(['pid' => $prestamo_id, 'uid' => $user['id'], 'obs' => $observaciones]);
            $devolucion_id = $pdo->lastInsertId();

            // Get tool details associated with this loan
            $detalles = Database::query("SELECT * FROM prestamo_detalles WHERE prestamo_id = :pid", ['pid' => $prestamo_id]);

            $stmtUpdateHerramienta = $pdo->prepare("
                UPDATE herramientas 
                SET stock_prestado = GREATEST(0, stock_prestado - :cant),
                    stock_danado = stock_danado + :danado,
                    stock_disponible = stock_disponible + (:cant - :danado),
                    estado = CASE 
                        WHEN stock_disponible + (:cant - :danado) > 0 THEN 'Disponible'
                        WHEN :danado > 0 THEN 'Dañado'
                        ELSE estado 
                    END
                WHERE id = :hid
            ");

            $stmtNotaDano = $pdo->prepare("
                INSERT INTO notas_dano (codigo_nota, prestamo_id, funcionario_id, herramienta_id, cantidad, descripcion_dano, usuario_registro_id)
                VALUES (:codigo, :pid, :fid, :hid, :cant, :desc, :uid)
            ");

            foreach ($detalles as $d) {
                $hid = (int)$d['herramienta_id'];
                $cantPrestada = max(1, (int)($d['cantidad'] ?? 1));
                $cantDanadaDetalle = ($estado_herramienta_devolucion === 'Con Daño') ? min($cantPrestada, max(1, $cantidad_danada)) : 0;

                $stmtUpdateHerramienta->execute([
                    'cant' => $cantPrestada,
                    'danado' => $cantDanadaDetalle,
                    'hid' => $hid
                ]);

                // Create official MEDUCA Damage Note if damaged
                if ($cantDanadaDetalle > 0) {
                    $codigoNota = 'NOT-DAN-' . date('Ymd') . '-' . rand(100, 999);
                    $stmtNotaDano->execute([
                        'codigo' => $codigoNota,
                        'pid' => $prestamo_id,
                        'fid' => $prestamo['funcionario_id'],
                        'hid' => $hid,
                        'cant' => $cantDanadaDetalle,
                        'desc' => $descripcion_dano,
                        'uid' => $user['id']
                    ]);
                }
            }

            // Update details return state
            $pdo->prepare("UPDATE prestamo_detalles SET estado_devolucion = :edev WHERE prestamo_id = :pid")->execute([
                'edev' => $estado_herramienta_devolucion,
                'pid' => $prestamo_id
            ]);

            $pdo->commit();

            // Audit log
            Database::execute(
                "INSERT INTO historial_actividades (usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle) VALUES (:uid, :unombre, 'Devolución', 'Devoluciones', :eid, :detalle)",
                [
                    'uid' => $user['id'],
                    'unombre' => $user['nombre'],
                    'eid' => $devolucion_id,
                    'detalle' => "Devolución efectuada para el préstamo " . $prestamo['codigo_prestamo'] . ($estado_herramienta_devolucion === 'Con Daño' ? " (Con reporte de daño)" : "")
                ]
            );

            Response::success(['id' => $devolucion_id], 'Devolución registrada con éxito');
        } catch (\Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            Response::error('Error al registrar devolución: ' . $e->getMessage(), 500);
        }
    }
}
