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

        if ($estado && in_array($estado, ['Disponible', 'Prestado', 'Mantenimiento', 'Dañado'])) {
            $sql .= " AND estado = :estado";
            $params['estado'] = $estado;
        }

        $sql .= " ORDER BY id DESC";
        $herramientas = Database::query($sql, $params);

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

        Database::execute("
            INSERT INTO herramientas (codigo, nombre, marca, modelo, numero_serie, estado, ubicacion, foto_url, observaciones)
            VALUES (:codigo, :nombre, :marca, :modelo, :numero_serie, :estado, :ubicacion, :foto_url, :observaciones)
        ", [
            'codigo' => $codigo,
            'nombre' => $nombre,
            'marca' => $marca,
            'modelo' => $modelo,
            'numero_serie' => $numero_serie,
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
                'detalle' => "Herramienta $nombre ($codigo) registrada en inventario"
            ]
        );

        Response::success(['id' => $id], 'Herramienta agregada con éxito', 201);
    }

    public function update(array $params): void {
        $user = AuthMiddleware::authenticate();
        $id = (int)($params['id'] ?? 0);
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $herramienta = Database::fetch("SELECT id FROM herramientas WHERE id = :id", ['id' => $id]);
        if (!$herramienta) {
            Response::error('Herramienta no encontrada.', 404);
        }

        Database::execute("
            UPDATE herramientas 
            SET codigo = :codigo, nombre = :nombre, marca = :marca, modelo = :modelo, 
                numero_serie = :numero_serie, estado = :estado, ubicacion = :ubicacion, 
                foto_url = :foto_url, observaciones = :observaciones
            WHERE id = :id
        ", [
            'id' => $id,
            'codigo' => trim($body['codigo'] ?? ''),
            'nombre' => trim($body['nombre'] ?? ''),
            'marca' => trim($body['marca'] ?? ''),
            'modelo' => trim($body['modelo'] ?? ''),
            'numero_serie' => trim($body['numero_serie'] ?? ''),
            'estado' => trim($body['estado'] ?? 'Disponible'),
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
                'detalle' => "Herramienta ID $id actualizada"
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
}
