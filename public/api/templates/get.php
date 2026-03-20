<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: http://localhost:9000');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header(
    'Access-Control-Allow-Headers: ' .
    'Content-Type, Authorization, X-API-Key, ' .
    'X-User-Token, X-Second-Token, X-Request-Id'
);
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'error' => 'Method not allowed',
    ]);
    exit;
}

$lang = $_GET['lang'] ?? '';
$template = $_GET['template'] ?? '';

$lang = trim($lang);
$template = trim($template);

if ($lang === '' || $template === '') {
    http_response_code(400);
    echo json_encode([
        'error' => 'Missing lang or template parameter',
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

if (!preg_match('/^[a-zA-Z0-9_-]+$/', $template)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid template parameter',
    ]);
    exit;
}

$baseDir = dirname(__DIR__, 2) . '/templates';
$filePath = $baseDir . '/' . $lang . '/' . $template . '.json';

if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode([
        'error' => 'Template not found',
    ]);
    exit;
}

$json = file_get_contents($filePath);

if ($json === false) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Could not read template file',
    ]);
    exit;
}

$data = json_decode($json, true);

if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Template file contains invalid JSON',
    ]);
    exit;
}

echo json_encode([
    'language' => $lang,
    'template' => $template,
    'content' => $data,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);