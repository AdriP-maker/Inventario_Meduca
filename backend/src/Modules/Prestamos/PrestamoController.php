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
        $rawItems = $body['herramientas_ids'] ?? $body['herramientas'] ?? [];

        if (!$funcionario_id || !$escuela_proyecto || empty($rawItems)) {
            Response::error('Debe seleccionar el funcionario, indicar el proyecto/escuela y al menos 1 herramienta.', 400);
        }

        // Normalize items array
        $itemsToLoan = [];
        foreach ($rawItems as $item) {
            if (is_array($item)) {
                $hid = (int)($item['id'] ?? 0);
                $cant = max(1, (int)($item['cantidad'] ?? 1));
            } else {
                $hid = (int)$item;
                $cant = 1;
            }
            if ($hid > 0) {
                $itemsToLoan[] = ['id' => $hid, 'cantidad' => $cant];
            }
        }

        if (empty($itemsToLoan)) {
            Response::error('Lista de herramientas no válida.', 400);
        }

        $pdo = Database::getInstance();
        try {
            $pdo->beginTransaction();

            // Validate stock for all requested items
            foreach ($itemsToLoan as $it) {
                $stmtCheck = $pdo->prepare("SELECT * FROM herramientas WHERE id = :hid FOR UPDATE");
                $stmtCheck->execute(['hid' => $it['id']]);
                $tool = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if (!$tool) {
                    throw new \Exception("La herramienta ID {$it['id']} no existe en catálogo.");
                }

                $disponible = (int)($tool['stock_disponible'] ?? ($tool['estado'] === 'Disponible' ? 1 : 0));
                if ($disponible < $it['cantidad']) {
                    throw new \Exception("Stock insuficiente para \"{$tool['nombre']}\". Disponibles: {$disponible}, Solicitados: {$it['cantidad']}.");
                }
            }

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
                INSERT INTO prestamo_detalles (prestamo_id, herramienta_id, cantidad, estado_entrega)
                VALUES (:pid, :hid, :cant, 'Bueno')
            ");

            $stmtUpdateHerramienta = $pdo->prepare("
                UPDATE herramientas 
                SET stock_disponible = GREATEST(0, stock_disponible - :cant),
                    stock_prestado = stock_prestado + :cant,
                    estado = CASE WHEN (stock_disponible - :cant) <= 0 THEN 'Prestado' ELSE estado END
                WHERE id = :hid
            ");

            foreach ($itemsToLoan as $it) {
                $stmtDetalle->execute([
                    'pid' => $prestamo_id,
                    'hid' => $it['id'],
                    'cant' => $it['cantidad']
                ]);
                $stmtUpdateHerramienta->execute([
                    'hid' => $it['id'],
                    'cant' => $it['cantidad']
                ]);
            }

            $pdo->commit();

            // Audit log
            Database::execute(
                "INSERT INTO historial_actividades (usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle) VALUES (:uid, :unombre, 'Nuevo Préstamo', 'Prestamos', :eid, :detalle)",
                [
                    'uid' => $user['id'],
                    'unombre' => $user['nombre'],
                    'eid' => $prestamo_id,
                    'detalle' => "Préstamo $codigo registrado con " . count($itemsToLoan) . " tipo(s) de herramienta"
                ]
            );

            Response::success(['id' => $prestamo_id, 'codigo' => $codigo], 'Préstamo registrado exitosamente', 201);
        } catch (\Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            Response::error($e->getMessage(), 400);
        }
    }
}
