<?php
namespace Core;

class JWT {
    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
    }

    public static function generate(array $payload): string {
        $config = require __DIR__ . '/../../config/jwt.php';
        $secret = $config['secret'];

        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256'
        ];

        $now = time();
        $payload['iat'] = $now;
        $payload['exp'] = $now + $config['expiration'];

        $encodedHeader = self::base64UrlEncode(json_encode($header));
        $encodedPayload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', "$encodedHeader.$encodedPayload", $secret, true);
        $encodedSignature = self::base64UrlEncode($signature);

        return "$encodedHeader.$encodedPayload.$encodedSignature";
    }

    public static function decode(string $token): ?array {
        $config = require __DIR__ . '/../../config/jwt.php';
        $secret = $config['secret'];

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        list($encodedHeader, $encodedPayload, $encodedSignature) = $parts;

        $signature = hash_hmac('sha256', "$encodedHeader.$encodedPayload", $secret, true);
        $expectedSignature = self::base64UrlEncode($signature);

        if (!hash_equals($expectedSignature, $encodedSignature)) {
            return null; // Signature invalid
        }

        $payload = json_decode(self::base64UrlDecode($encodedPayload), true);

        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null; // Token expired
        }

        return $payload;
    }
}
