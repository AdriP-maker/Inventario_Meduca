<?php
// Entry Point for PHP REST API

require_once __DIR__ . '/../config/cors.php';
handleCors();

// PSR-4 Autoloader
spl_autoload_register(function ($class) {
    $prefix = '';
    $baseDir = __DIR__ . '/../src/';

    $file = $baseDir . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require_once $file;
    }
});

use Core\Router;

$router = new Router();

// 1. Auth Endpoints
$router->post('/api/auth/login', [Modules\Auth\AuthController::class, 'login']);
$router->get('/api/auth/me', [Modules\Auth\AuthController::class, 'me']);

// 2. Dashboard Endpoints
$router->get('/api/dashboard/stats', [Modules\Dashboard\DashboardController::class, 'stats']);

// 3. Funcionarios Endpoints
$router->get('/api/funcionarios', [Modules\Funcionarios\FuncionarioController::class, 'index']);
$router->post('/api/funcionarios', [Modules\Funcionarios\FuncionarioController::class, 'create']);
$router->put('/api/funcionarios/{id}', [Modules\Funcionarios\FuncionarioController::class, 'update']);
$router->delete('/api/funcionarios/{id}', [Modules\Funcionarios\FuncionarioController::class, 'delete']);

// 4. Herramientas & Upload Endpoints
$router->get('/api/herramientas', [Modules\Herramientas\HerramientaController::class, 'index']);
$router->post('/api/herramientas', [Modules\Herramientas\HerramientaController::class, 'create']);
$router->put('/api/herramientas/{id}', [Modules\Herramientas\HerramientaController::class, 'update']);
$router->delete('/api/herramientas/{id}', [Modules\Herramientas\HerramientaController::class, 'delete']);
$router->post('/api/upload', [Modules\Upload\UploadController::class, 'upload']);

// 5. Préstamos Endpoints
$router->get('/api/prestamos', [Modules\Prestamos\PrestamoController::class, 'index']);
$router->post('/api/prestamos', [Modules\Prestamos\PrestamoController::class, 'create']);

// 6. Devoluciones Endpoints
$router->get('/api/devoluciones', [Modules\Devoluciones\DevolucionController::class, 'index']);
$router->post('/api/devoluciones/registrar', [Modules\Devoluciones\DevolucionController::class, 'registrar']);

// 7. Reportes Endpoints
$router->get('/api/reportes/generar', [Modules\Reportes\ReporteController::class, 'generar']);

// 8. Historial Endpoints
$router->get('/api/historial', [Modules\Historial\HistorialController::class, 'index']);

// 9. Configuración y Notificaciones Endpoints
$router->get('/api/configuracion', [Modules\Configuracion\ConfiguracionController::class, 'index']);
$router->post('/api/configuracion', [Modules\Configuracion\ConfiguracionController::class, 'update']);
$router->post('/api/configuracion/cambiar-password', [Modules\Configuracion\ConfiguracionController::class, 'cambiarPassword']);
$router->get('/api/notificaciones', [Modules\Notificaciones\NotificacionController::class, 'index']);

// Dispatch incoming request
$router->dispatch();
