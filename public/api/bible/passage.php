<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    
    header(
        'Access-Control-Allow-Headers: ' .
        'Content-Type, Authorization, X-API-Key, ' .
        'X-User-Token, X-Second-Token, X-Request-Id'
    );
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'error' => 'Method not allowed',
    ]);
    exit;
}

$raw = file_get_contents('php://input');

if ($raw === false || $raw === '') {
    http_response_code(400);
    echo json_encode([
        'error' => 'Missing request body',
    ]);
    exit;
}

$payload = json_decode($raw, true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid JSON body',
    ]);
    exit;
}

$entry = isset($payload['entry']) ? trim((string) $payload['entry']) : '';
$languageCodeGoogle = isset($payload['languageCodeGoogle'])
    ? trim((string) $payload['languageCodeGoogle'])
    : '';

if ($entry === '') {
    http_response_code(400);
    echo json_encode([
        'error' => 'Missing entry',
    ]);
    exit;
}

if ($languageCodeGoogle === '') {
    $languageCodeGoogle = 'eng00';
}

$remoteUrl = 'https://api2.mylanguage.net.au/api/v2/bible/passage';

$ch = curl_init($remoteUrl);

if ($ch === false) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Could not initialize cURL',
    ]);
    exit;
}

error_log('Bible proxy hit: method=' . $_SERVER['REQUEST_METHOD']);
error_log('Bible proxy raw body: ' . (string) $raw);

$requestBody = json_encode([
    'entry' => $entry,
    'languageCodeGoogle' => $languageCodeGoogle,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json',
    ],
    CURLOPT_POSTFIELDS => $requestBody,
    CURLOPT_TIMEOUT => 20,
]);

$response = curl_exec($ch);
$httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);

curl_close($ch);

error_log('Bible proxy httpCode: ' . (string) $httpCode);
error_log('Bible proxy curlError: ' . (string) $curlError);
error_log('Bible proxy response: ' . (string) $response);

if ($response === false) {
    http_response_code(502);
    echo json_encode([
        'error' => 'Bible API request failed',
        'details' => $curlError,
    ]);
    exit;
}

http_response_code($httpCode > 0 ? $httpCode : 200);
echo $response;