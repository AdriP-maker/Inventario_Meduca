<?php
namespace Modules\Herramientas;

use Core\Database;
use Core\Response;
use Core\Middleware\AuthMiddleware;

class HerramientaController {
    public function index(): void {
        AuthMiddleware::authenticate();
        $search = trim($_GET['search'] ?? '');
        $estado = trim($_GET['estado'] ?? '');

        $sql = "SELECT * FROM herramientas WHERE 1=1";
        $params = [];

        if ($search) {
            $sql .= " AND (nombre LIKE :s OR codigo LIKE :s OR marca LIKE :s OR modelo LIKE :s)";
            $params['s'] = "%$search%";
        }

        if ($estado && in_array($estado, ['Disponible', 'Prestado', 'Mantenimiento', 'Dañado', 'Agotado'])) {
            if ($estado === 'Agotado') {
                $sql .= " AND (COALESCE(stock_disponible, GREATEST(0, COALESCE(stock_total, 1) - COALESCE(stock_prestado, 0) - COALESCE(stock_danado, 0))) = 0 OR estado = 'Agotado')";
            } elseif ($estado === 'Disponible') {
                $sql .= " AND (COALESCE(NULLIF(stock_disponible, 0), GREATEST(0, COALESCE(stock_total, 1) - COALESCE(stock_prestado, 0) - COALESCE(stock_danado, 0))) > 0 OR estado = 'Disponible') AND estado NOT IN ('Mantenimiento', 'Dañado')";
            } else {
                $sql .= " AND estado = :estado";
                $params['estado'] = $estado;
            }
        }

        $sql .= " ORDER BY id DESC";
        $herramientas = Database::query($sql, $params);

        // Calculate dynamic state if column missing or out-of-sync
        foreach ($herramientas as &$h) {
            $stotal = max(1, (int)($h['stock_total'] ?? 1));
            $sprest = (int)($h['stock_prestado'] ?? ($h['estado'] === 'Prestado' ? 1 : 0));
            $sdan = (int)($h['stock_danado'] ?? ($h['estado'] === 'Dañado' ? 1 : 0));
            $calcDisp = max(0, $stotal - $sprest - $sdan);
            
            // If DB column stock_disponible is 0 but item is marked Disponible with 0 loans and 0 damage, recalculate
            if (isset($h['stock_disponible']) && $h['stock_disponible'] !== null) {
                $dbDisp = (int)$h['stock_disponible'];
                $sdisp = ($dbDisp === 0 && $h['estado'] === 'Disponible' && $sprest === 0 && $sdan === 0) ? $calcDisp : $dbDisp;
            } else {
                $sdisp = $calcDisp;
            }

            $h['stock_total'] = $stotal;
            $h['stock_disponible'] = $sdisp;
            $h['stock_prestado'] = $sprest;
            $h['stock_danado'] = $sdan;

            if ($h['stock_disponible'] <= 0 && $h['stock_prestado'] > 0) {
                $h['estado_display'] = 'Agotado';
            } else {
                $h['estado_display'] = $h['estado'];
            }
        }

        Response::success($herramientas, 'Catálogo de herramientas');
    }

    public function create(): void {
        $user = AuthMiddleware::authenticate();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $codigo = trim($body['codigo'] ?? '');
        $nombre = trim($body['nombre'] ?? '');
        $marca = trim($body['marca'] ?? '');
        $modelo = trim($body['modelo'] ?? '');
        $numero_serie = trim($body['numero_serie'] ?? '');
        $stock_total = max(1, (int)($body['stock_total'] ?? $body['cantidad_stock'] ?? 1));
        $estado = trim($body['estado'] ?? 'Disponible');
        $ubicacion = trim($body['ubicacion'] ?? 'Bodega Mantenimiento');
        $foto_url = trim($body['foto_url'] ?? '');
        $observaciones = trim($body['observaciones'] ?? '');

        if (!$codigo || !$nombre || !$marca) {
            Response::error('Código, nombre y marca son obligatorios.', 400);
        }

        $exists = Database::fetch("SELECT id FROM herramientas WHERE codigo = :codigo", ['codigo' => $codigo]);
        if ($exists) {
            Response::error('El código de herramienta ya existe en inventario.', 400);
        }

        $stock_disponible = $stock_total;
        $stock_prestado = 0;
        $stock_danado = 0;

        Database::execute("
            INSERT INTO herramientas (codigo, nombre, marca, modelo, numero_serie, stock_total, stock_disponible, stock_prestado, stock_danado, estado, ubicacion, foto_url, observaciones)
            VALUES (:codigo, :nombre, :marca, :modelo, :numero_serie, :stotal, :sdisp, :sprest, :sdan, :estado, :ubicacion, :foto_url, :observaciones)
        ", [
            'codigo' => $codigo,
            'nombre' => $nombre,
            'marca' => $marca,
            'modelo' => $modelo,
            'numero_serie' => $numero_serie,
            'stotal' => $stock_total,
            'sdisp' => $stock_disponible,
            'sprest' => $stock_prestado,
            'sdan' => $stock_danado,
            'estado' => $estado,
            'ubicacion' => $ubicacion,
            'foto_url' => $foto_url ?: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
            'observaciones' => $observaciones
        ]);

        $id = Database::lastInsertId();

        Database::execute(
            "INSERT INTO historial_actividades (usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle) VALUES (:uid, :unombre, 'Nueva Herramienta', 'Herramientas', :eid, :detalle)",
            [
                'uid' => $user['id'],
                'unombre' => $user['nombre'],
                'eid' => $id,
                'detalle' => "Herramienta $nombre ($codigo) con stock $stock_total registrada en inventario"
            ]
        );

        Response::success(['id' => $id], 'Herramienta agregada con éxito', 201);
    }

    public function update(array $params): void {
        $user = AuthMiddleware::authenticate();
        $id = (int)($params['id'] ?? 0);
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $herramienta = Database::fetch("SELECT * FROM herramientas WHERE id = :id", ['id' => $id]);
        if (!$herramienta) {
            Response::error('Herramienta no encontrada.', 404);
        }

        $stock_total = max(1, (int)($body['stock_total'] ?? $body['cantidad_stock'] ?? $herramienta['stock_total'] ?? 1));
        $stock_prestado = (int)($herramienta['stock_prestado'] ?? 0);
        $stock_danado = (int)($herramienta['stock_danado'] ?? 0);
        $stock_disponible = max(0, $stock_total - $stock_prestado - $stock_danado);
        $estado = trim($body['estado'] ?? 'Disponible');

        if ($stock_disponible == 0 && $stock_prestado > 0) {
            $estado = 'Prestado';
        }

        Database::execute("
            UPDATE herramientas 
            SET codigo = :codigo, nombre = :nombre, marca = :marca, modelo = :modelo, 
                numero_serie = :numero_serie, stock_total = :stotal, stock_disponible = :sdisp,
                estado = :estado, ubicacion = :ubicacion, 
                foto_url = :foto_url, observaciones = :observaciones
            WHERE id = :id
        ", [
            'id' => $id,
            'codigo' => trim($body['codigo'] ?? ''),
            'nombre' => trim($body['nombre'] ?? ''),
            'marca' => trim($body['marca'] ?? ''),
            'modelo' => trim($body['modelo'] ?? ''),
            'numero_serie' => trim($body['numero_serie'] ?? ''),
            'stotal' => $stock_total,
            'sdisp' => $stock_disponible,
            'estado' => $estado,
            'ubicacion' => trim($body['ubicacion'] ?? 'Bodega Mantenimiento'),
            'foto_url' => trim($body['foto_url'] ?? ''),
            'observaciones' => trim($body['observaciones'] ?? '')
        ]);

        Database::execute(
            "INSERT INTO historial_actividades (usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle) VALUES (:uid, :unombre, 'Edición Herramienta', 'Herramientas', :eid, :detalle)",
            [
                'uid' => $user['id'],
                'unombre' => $user['nombre'],
                'eid' => $id,
                'detalle' => "Herramienta ID $id actualizada (Stock: $stock_total)"
            ]
        );

        Response::success(null, 'Herramienta actualizada con éxito');
    }

    public function delete(array $params): void {
        $user = AuthMiddleware::authenticate();
        $id = (int)($params['id'] ?? 0);

        Database::execute("DELETE FROM herramientas WHERE id = :id", ['id' => $id]);

        Database::execute(
            "INSERT INTO historial_actividades (usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle) VALUES (:uid, :unombre, 'Eliminación Herramienta', 'Herramientas', :eid, :detalle)",
            [
                'uid' => $user['id'],
                'unombre' => $user['nombre'],
                'eid' => $id,
                'detalle' => "Herramienta ID $id eliminada"
            ]
        );

        Response::success(null, 'Herramienta eliminada correctamente');
    }

    public function getDisponibilidad(array $params): void {
        AuthMiddleware::authenticate();
        $id = (int)($params['id'] ?? 0);

        $herramienta = Database::fetch("SELECT * FROM herramientas WHERE id = :id", ['id' => $id]);
        if (!$herramienta) {
            Response::error('Herramienta no encontrada.', 404);
        }

        // Active loans for this tool
        $prestamosActivos = Database::query("
            SELECT p.codigo_prestamo, p.fecha_prestamo, p.fecha_devolucion_estimada, p.escuela_proyecto,
                   f.nombre AS funcionario_nombre, f.apellido AS funcionario_apellido, f.cargo AS funcionario_cargo, f.cedula AS funcionario_cedula,
                   IFNULL(pd.cantidad, 1) AS cantidad
            FROM prestamo_detalles pd
            JOIN prestamos p ON pd.prestamo_id = p.id
            JOIN funcionarios f ON p.funcionario_id = f.id
            WHERE pd.herramienta_id = :hid AND p.estado = 'Prestado'
            ORDER BY p.fecha_devolucion_estimada ASC
        ", ['hid' => $id]);

        // Damage notes for this tool
        $notasDano = Database::query("
            SELECT nd.*, f.nombre AS funcionario_nombre, f.apellido AS funcionario_apellido
            FROM notas_dano nd
            JOIN funcionarios f ON nd.funcionario_id = f.id
            WHERE nd.herramienta_id = :hid
            ORDER BY nd.id DESC
        ", ['hid' => $id]);

        $cantPrestadaCalc = 0;
        foreach ($prestamosActivos as $pa) {
            $cantPrestadaCalc += (int)($pa['cantidad'] ?? 1);
        }

        $cantDanadaCalc = 0;
        foreach ($notasDano as $nd) {
            $cantDanadaCalc += (int)($nd['cantidad'] ?? 1);
        }

        $stotal = max(1, (int)($herramienta['stock_total'] ?? 1));
        $sprest = isset($herramienta['stock_prestado']) && $herramienta['stock_prestado'] !== null 
            ? (int)$herramienta['stock_prestado'] 
            : max($cantPrestadaCalc, ($herramienta['estado'] === 'Prestado' ? 1 : 0));
            
        $sdan = isset($herramienta['stock_danado']) && $herramienta['stock_danado'] !== null 
            ? (int)$herramienta['stock_danado'] 
            : max($cantDanadaCalc, ($herramienta['estado'] === 'Dañado' ? 1 : 0));

        $sdisp = isset($herramienta['stock_disponible']) && $herramienta['stock_disponible'] !== null 
            ? (int)$herramienta['stock_disponible'] 
            : max(0, $stotal - $sprest - $sdan);

        $herramienta['stock_total'] = $stotal;
        $herramienta['stock_prestado'] = $sprest;
        $herramienta['stock_danado'] = $sdan;
        $herramienta['stock_disponible'] = $sdisp;

        Response::success([
            'herramienta' => $herramienta,
            'prestamos_activos' => $prestamosActivos,
            'notas_dano' => $notasDano
        ], 'Detalle explicativo de disponibilidad');
    }
}
