<?php
namespace Core;

class Router {
    private array $routes = [];

    public function add(string $method, string $path, callable|array $handler): void {
        $regexPath = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[a-zA-Z0-9_]+)', $path);
        $this->routes[] = [
            'method' => strtoupper($method),
            'path' => $path,
            'pattern' => "#^" . $regexPath . "$#",
            'handler' => $handler
        ];
    }

    public function get(string $path, callable|array $handler): void {
        $this->add('GET', $path, $handler);
    }

    public function post(string $path, callable|array $handler): void {
        $this->add('POST', $path, $handler);
    }

    public function put(string $path, callable|array $handler): void {
        $this->add('PUT', $path, $handler);
    }

    public function delete(string $path, callable|array $handler): void {
        $this->add('DELETE', $path, $handler);
    }

    public function dispatch(): void {
        $requestMethod = $_SERVER['REQUEST_METHOD'];
        $requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        // Extract /api/... part from request URI regardless of host subdirectories
        $pos = strpos($requestUri, '/api');
        if ($pos !== false) {
            $requestUri = substr($requestUri, $pos);
        }

        if (empty($requestUri)) {
            $requestUri = '/';
        }

        foreach ($this->routes as $route) {
            if ($route['method'] === $requestMethod && preg_match($route['pattern'], $requestUri, $matches)) {
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);

                $handler = $route['handler'];

                if (is_array($handler)) {
                    list($class, $method) = $handler;
                    $controller = new $class();
                    call_user_func_array([$controller, $method], [$params]);
                } else {
                    call_user_func_array($handler, [$params]);
                }
                return;
            }
        }

        Response::error("Ruta no encontrada ($requestMethod $requestUri)", 404);
    }
}
