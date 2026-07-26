<?php
// Configuration for Database connection (MySQL local PDO & Supabase Cloud PostgreSQL)

return [
    'driver' => getenv('DB_DRIVER') ?: 'mysql', // Options: 'mysql' or 'supabase' / 'pgsql'
    
    // MySQL Local (XAMPP Default)
    'mysql' => [
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'port' => getenv('DB_PORT') ?: '3306',
        'dbname' => getenv('DB_NAME') ?: 'meduca_inventory',
        'username' => getenv('DB_USER') ?: 'root',
        'password' => getenv('DB_PASS') !== false ? getenv('DB_PASS') : '',
        'charset' => 'utf8mb4'
    ],

    // Supabase Cloud Configuration (PostgreSQL / REST API)
    'supabase' => [
        'url' => getenv('SUPABASE_URL') ?: 'https://your-supabase-project.supabase.co',
        'key' => getenv('SUPABASE_ANON_KEY') ?: 'your-supabase-anon-key',
        'host' => getenv('SUPABASE_DB_HOST') ?: 'db.your-supabase-project.supabase.co',
        'port' => getenv('SUPABASE_DB_PORT') ?: '5432',
        'dbname' => getenv('SUPABASE_DB_NAME') ?: 'postgres',
        'username' => getenv('SUPABASE_DB_USER') ?: 'postgres',
        'password' => getenv('SUPABASE_DB_PASS') ?: ''
    ]
];
