<?php
namespace Modules\Devoluciones;

use Core\Database;
use Core\Response;
use Core\Middleware\AuthMiddleware;

class NotaDanoController {
    public function index(): void {
        AuthMiddleware::authenticate();

        $notas = Database::query("
            SELECT nd.*, 
                   f.nombre AS funcionario_nombre, f.apellido AS funcionario_apellido, f.cedula AS funcionario_cedula, f.cargo AS funcionario_cargo,
                   h.nombre AS herramienta_nombre, h.codigo AS herramienta_codigo, h.marca AS herramienta_marca,
                   p.codigo_prestamo, p.escuela_proyecto,
                   u.nombre AS registrado_por
            FROM notas_dano nd
            JOIN funcionarios f ON nd.funcionario_id = f.id
            JOIN herramientas h ON nd.herramienta_id = h.id
            JOIN prestamos p ON nd.prestamo_id = p.id
            LEFT JOIN usuarios u ON nd.usuario_registro_id = u.id
            ORDER BY nd.id DESC
        ");

        Response::success($notas, 'Notas de daño registradas');
    }

    public function show(array $params): void {
        AuthMiddleware::authenticate();
        $id = (int)($params['id'] ?? 0);

        $nota = Database::fetch("
            SELECT nd.*, 
                   f.nombre AS funcionario_nombre, f.apellido AS funcionario_apellido, f.cedula AS funcionario_cedula, f.cargo AS funcionario_cargo, f.departamento AS funcionario_depto,
                   h.nombre AS herramienta_nombre, h.codigo AS herramienta_codigo, h.marca AS herramienta_marca, h.modelo AS herramienta_modelo,
                   p.codigo_prestamo, p.escuela_proyecto, p.fecha_prestamo,
                   u.nombre AS registrado_por
            FROM notas_dano nd
            JOIN funcionarios f ON nd.funcionario_id = f.id
            JOIN herramientas h ON nd.herramienta_id = h.id
            JOIN prestamos p ON nd.prestamo_id = p.id
            LEFT JOIN usuarios u ON nd.usuario_registro_id = u.id
            WHERE nd.id = :id
        ", ['id' => $id]);

        if (!$nota) {
            Response::error('Nota de daño no encontrada.', 404);
        }

        Response::success($nota, 'Detalle de Nota de Daño MEDUCA');
    }

    public function updateEstado(array $params): void {
        $user = AuthMiddleware::authenticate();
        $id = (int)($params['id'] ?? 0);
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $estado_evaluacion = trim($body['estado_evaluacion'] ?? 'Pendiente Evaluación');

        Database::execute("UPDATE notas_dano SET estado_evaluacion = :estado WHERE id = :id", [
            'estado' => $estado_evaluacion,
            'id' => $id
        ]);

        Database::execute(
            "INSERT INTO historial_actividades (usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle) VALUES (:uid, :unombre, 'Actualización Nota de Daño', 'NotasDano', :eid, :detalle)",
            [
                'uid' => $user['id'],
                'unombre' => $user['nombre'],
                'eid' => $id,
                'detalle' => "Estado de evaluación actualizado a: $estado_evaluacion"
            ]
        );

        Response::success(null, 'Estado de evaluación actualizado');
    }
}
