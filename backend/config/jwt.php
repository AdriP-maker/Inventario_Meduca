<?php
// JWT Secret Key Configuration
return [
    'secret' => getenv('JWT_SECRET') ?: 'MEDUCA_COCLE_SECRET_KEY_2025_INVENTORY_SYSTEM_SECURE_TOKEN',
    'expiration' => 86400 * 7, // 7 days in seconds
    'algorithm' => 'HS256'
];
