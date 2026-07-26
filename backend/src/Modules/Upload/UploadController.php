<?php
namespace Modules\Upload;

use Core\Response;
use Core\Middleware\AuthMiddleware;

class UploadController {
    public function upload(): void {
        AuthMiddleware::authenticate();

        if (empty($_FILES['file'])) {
            // Also check for base64 image payload in JSON body
            $body = json_decode(file_get_contents('php://input'), true) ?? [];
            if (!empty($body['image_base64'])) {
                $this->handleBase64Upload($body['image_base64']);
                return;
            }
            Response::error('No se ha subido ningún archivo de imagen.', 400);
        }

        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error('Error al subir el archivo al servidor.', 400);
        }

        // Validate image mime type & extension
        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime, $allowedMimes)) {
            Response::error('Formato de imagen no permitido. Utilice JPG, PNG, WEBP o GIF.', 400);
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) ?: 'jpg';
        $filename = 'tool_' . time() . '_' . uniqid() . '.' . $ext;

        $targetDir = __DIR__ . '/../../../public/uploads/';
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $targetPath = $targetDir . $filename;
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $baseUrl = "$protocol://$host/SASS_Meduca_Inventory/backend/public/uploads/";
            
            Response::success([
                'url' => $baseUrl . $filename,
                'filename' => $filename
            ], 'Imagen subida exitosamente');
        } else {
            Response::error('No se pudo guardar la imagen en el servidor.', 500);
        }
    }

    private function handleBase64Upload(string $base64String): void {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64String, $type)) {
            $data = substr($base64String, strpos($base64String, ',') + 1);
            $type = strtolower($type[1]); // jpg, png, gif, webp

            if (!in_array($type, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                Response::error('Formato de imagen no permitido.', 400);
            }

            $data = base64_decode($data);
            if ($data === false) {
                Response::error('Decodificación de imagen base64 fallida.', 400);
            }
        } else {
            Response::error('Datos de imagen base64 inválidos.', 400);
        }

        $filename = 'tool_' . time() . '_' . uniqid() . '.' . $type;
        $targetDir = __DIR__ . '/../../../public/uploads/';
        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        if (file_put_contents($targetDir . $filename, $data)) {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $baseUrl = "$protocol://$host/SASS_Meduca_Inventory/backend/public/uploads/";

            Response::success([
                'url' => $baseUrl . $filename,
                'filename' => $filename
            ], 'Imagen subida exitosamente');
        } else {
            Response::error('Error al guardar la imagen en el servidor.', 500);
        }
    }
}
