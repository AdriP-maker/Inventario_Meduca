<?php
namespace Core;

use PDO;
use PDOException;

class Database {
    private static ?PDO $instance = null;

    public static function getInstance(): PDO {
        if (self::$instance === null) {
            $config = require __DIR__ . '/../../config/database.php';
            $driver = $config['driver'];

            try {
                if ($driver === 'supabase' || $driver === 'pgsql') {
                    $supabase = $config['supabase'];
                    $dsn = "pgsql:host={$supabase['host']};port={$supabase['port']};dbname={$supabase['dbname']}";
                    self::$instance = new PDO($dsn, $supabase['username'], $supabase['password'], [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                    ]);
                } else {
                    $mysql = $config['mysql'];
                    $dsn = "mysql:host={$mysql['host']};port={$mysql['port']};dbname={$mysql['dbname']};charset={$mysql['charset']}";
                    self::$instance = new PDO($dsn, $mysql['username'], $mysql['password'], [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                    ]);
                }
            } catch (PDOException $e) {
                // If connection fails, return JSON error
                header('Content-Type: application/json');
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Error de conexión a la base de datos: ' . $e->getMessage()
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
        return self::$instance;
    }

    public static function query(string $sql, array $params = []): array {
        $stmt = self::getInstance()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public static function fetch(string $sql, array $params = []): ?array {
        $stmt = self::getInstance()->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return $result ?: null;
    }

    public static function execute(string $sql, array $params = []): bool {
        $stmt = self::getInstance()->prepare($sql);
        return $stmt->execute($params);
    }

    public static function lastInsertId(): string {
        return self::getInstance()->lastInsertId();
    }
}
