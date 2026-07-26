<?php
// Configuration for CORS Headers in REST API

function handleCors() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';

    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400"); // 24 hours cache

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        }
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
        } else {
            header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        }
        http_response_code(200);
        exit;
    }
}
