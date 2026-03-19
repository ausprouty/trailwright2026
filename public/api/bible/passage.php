<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-User-Token, X-Second-Token');
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
$languageCodeIso = isset($payload['languageCodeIso'])
    ? trim((string) $payload['languageCodeIso'])
    : '';

if ($entry === '') {
    http_response_code(400);
    echo json_encode([
        'error' => 'Missing entry',
    ]);
    exit;
}

if ($languageCodeIso === '') {
    $languageCodeIso = 'eng00';
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

$requestBody = json_encode([
    'entry' => $entry,
    'languageCodeIso' => $languageCodeIso,
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