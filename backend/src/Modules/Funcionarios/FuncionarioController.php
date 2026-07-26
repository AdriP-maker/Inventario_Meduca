<?php
namespace Modules\Funcionarios;

use Core\Database;
use Core\Response;
use Core\Middleware\AuthMiddleware;

class FuncionarioController {
    public function index(): void {
        AuthMiddleware::authenticate();
        $search = trim($_GET['search'] ?? '');

        if ($search) {
            $sql = "SELECT * FROM funcionarios WHERE (nombre LIKE :s OR apellido LIKE :s OR cedula LIKE :s OR cargo LIKE :s) ORDER BY id DESC";
            $funcionarios = Database::query($sql, ['s' => "%$search%"]);
        } else {
            $funcionarios = Database::query("SELECT * FROM funcionarios ORDER BY id DESC");
        }

        Response::success($funcionarios, 'Listado de funcionarios');
    }

    public function create(): void {
        $user = AuthMiddleware::authenticate();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $cedula = trim($body['cedula'] ?? '');
        $nombre = trim($body['nombre'] ?? '');
        $apellido = trim($body['apellido'] ?? '');
        $cargo = trim($body['cargo'] ?? '');
        $departamento = trim($body['departamento'] ?? 'Mantenimiento');
        $telefono = trim($body['telefono'] ?? '');
        $email = trim($body['email'] ?? '');

        if (!$cedula || !$nombre || !$apellido || !$cargo) {
            Response::error('La cédula, nombre, apellido y cargo son obligatorios.', 400);
        }

        if (strlen($cedula) < 5 || strlen($cedula) > 15) {
            Response::error('La cédula debe tener entre 5 y 15 caracteres.', 400);
        }

        if (strlen($nombre) < 2 || strlen($nombre) > 40 || strlen($apellido) < 2 || strlen($apellido) > 40) {
            Response::error('El nombre y apellido deben tener entre 2 y 40 caracteres.', 400);
        }

        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('El correo electrónico no tiene un formato válido.', 400);
        }

        // Check if cedula already exists
        $exists = Database::fetch("SELECT id FROM funcionarios WHERE cedula = :cedula", ['cedula' => $cedula]);
        if ($exists) {
            Response::error('Ya existe un funcionario registrado con esa cédula.', 400);
        }

        Database::execute("
            INSERT INTO funcionarios (cedula, nombre, apellido, cargo, departamento, telefono, email, estado)
            VALUES (:cedula, :nombre, :apellido, :cargo, :departamento, :telefono, :email, 'Activo')
        ", [
            'cedula' => $cedula,
            'nombre' => $nombre,
            'apellido' => $apellido,
            'cargo' => $cargo,
            'departamento' => $departamento,
            'telefono' => $telefono,
            'email' => $email
        ]);

        $id = Database::lastInsertId();

        Database::execute(
            "INSERT INTO historial_actividades (usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle) VALUES (:uid, :unombre, 'Nuevo Funcionario', 'Funcionarios', :eid, :detalle)",
            [
                'uid' => $user['id'],
                'unombre' => $user['nombre'],
                'eid' => $id,
                'detalle' => "Funcionario $nombre $apellido ($cedula) registrado"
            ]
        );

        Response::success(['id' => $id], 'Funcionario registrado con éxito', 201);
    }

    public function update(array $params): void {
        $user = AuthMiddleware::authenticate();
        $id = (int)($params['id'] ?? 0);
        $body = json_decode(file_get_contents('php://input'), true) ?? [];

        $funcionario = Database::fetch("SELECT id FROM funcionarios WHERE id = :id", ['id' => $id]);
        if (!$funcionario) {
            Response::error('Funcionario no encontrado.', 404);
        }

        Database::execute("
            UPDATE funcionarios 
            SET cedula = :cedula, nombre = :nombre, apellido = :apellido, cargo = :cargo, 
                departamento = :departamento, telefono = :telefono, email = :email, estado = :estado
            WHERE id = :id
        ", [
            'id' => $id,
            'cedula' => trim($body['cedula'] ?? ''),
            'nombre' => trim($body['nombre'] ?? ''),
            'apellido' => trim($body['apellido'] ?? ''),
            'cargo' => trim($body['cargo'] ?? ''),
            'departamento' => trim($body['departamento'] ?? 'Mantenimiento'),
            'telefono' => trim($body['telefono'] ?? ''),
            'email' => trim($body['email'] ?? ''),
            'estado' => trim($body['estado'] ?? 'Activo')
        ]);

        Database::execute(
            "INSERT INTO historial_actividades (usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle) VALUES (:uid, :unombre, 'Edición Funcionario', 'Funcionarios', :eid, :detalle)",
            [
                'uid' => $user['id'],
                'unombre' => $user['nombre'],
                'eid' => $id,
                'detalle' => "Información de funcionario ID $id actualizada"
            ]
        );

        Response::success(null, 'Funcionario actualizado con éxito');
    }

    public function delete(array $params): void {
        $user = AuthMiddleware::authenticate();
        $id = (int)($params['id'] ?? 0);

        Database::execute("DELETE FROM funcionarios WHERE id = :id", ['id' => $id]);

        Database::execute(
            "INSERT INTO historial_actividades (usuario_id, usuario_nombre, accion, entidad, entidad_id, detalle) VALUES (:uid, :unombre, 'Eliminación Funcionario', 'Funcionarios', :eid, :detalle)",
            [
                'uid' => $user['id'],
                'unombre' => $user['nombre'],
                'eid' => $id,
                'detalle' => "Funcionario ID $id eliminado"
            ]
        );

        Response::success(null, 'Funcionario eliminado correctamente');
    }
}
