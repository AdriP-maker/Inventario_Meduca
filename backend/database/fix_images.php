<?php
$config = require __DIR__ . '/../config/database.php';
$mysql = $config['mysql'];

try {
    $dsn = "mysql:host={$mysql['host']};port={$mysql['port']};dbname={$mysql['dbname']};charset={$mysql['charset']}";
    $pdo = new PDO($dsn, $mysql['username'], $mysql['password']);

    $images = [
        1 => 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop', // Taladro DeWalt
        2 => 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&auto=format&fit=crop', // Esmeril Makita
        3 => 'https://images.unsplash.com/photo-1590402494587-44b71d7772f6?w=500&auto=format&fit=crop', // Escalera Cuprum
        4 => 'https://images.unsplash.com/photo-1601058268499-e52658b8bb88?w=500&auto=format&fit=crop', // Pinza Fluke
        5 => 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop', // Manifold Refrigeracion
        6 => 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=500&auto=format&fit=crop', // Destornilladores Stanley
        7 => 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&auto=format&fit=crop', // Sierra Circular
        8 => 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop', // Compresor Truper
        9 => 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop', // Pulidora Makita
        10 => 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=500&auto=format&fit=crop'  // Martillo Hilti
    ];

    $stmt = $pdo->prepare("UPDATE herramientas SET foto_url = :url WHERE id = :id");

    foreach ($images as $id => $url) {
        $stmt->execute(['url' => $url, 'id' => $id]);
    }

    echo "HERRAMIENTAS FOTO_URL UPDATED SUCCESSFULLY IN MYSQL!\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
