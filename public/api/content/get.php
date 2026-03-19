<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'error' => 'Method not allowed',
    ]);
    exit;
}

$lang = $_GET['lang'] ?? '';
$fileName = $_GET['fileName'] ?? '';

$lang = trim($lang);
$fileName = trim($fileName);

if ($lang === '' || $fileName === '') {
    http_response_code(400);
    echo json_encode([
        'error' => 'Missing lang or fileName parameter',
    ]);
    exit;
}

if (!preg_match('/^[a-zA-Z0-9_-]+$/', $lang)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid lang parameter',
    ]);
    exit;
}

if (!preg_match('/^[a-zA-Z0-9_-]+$/', $fileName)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid fileName parameter',
    ]);
    exit;
}

$baseDir = dirname(__DIR__, 2) . '/content';
$filePath = $baseDir . '/' . $lang . '/' . $fileName . '.json';

if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode([
        'error' => 'Content file not found',
    ]);
    exit;
}

$json = file_get_contents($filePath);

if ($json === false) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Could not read content file',
    ]);
    exit;
}

$data = json_decode($json, true);

if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Content file contains invalid JSON',
    ]);
    exit;
}

echo json_encode([
    'language' => $lang,
    'fileName' => $fileName,
    'content' => $data,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);