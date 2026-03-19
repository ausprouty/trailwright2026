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
$lang = trim($lang);

if ($lang === '') {
    http_response_code(400);
    echo json_encode([
        'error' => 'Missing lang parameter',
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

$baseDir = dirname(__DIR__, 2) . '/content';
$langDir = $baseDir . '/' . $lang;

if (!is_dir($langDir)) {
    http_response_code(404);
    echo json_encode([
        'error' => 'Language folder not found',
    ]);
    exit;
}

$files = glob($langDir . '/*.json');

if ($files === false) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Could not read content folder',
    ]);
    exit;
}

$items = [];

foreach ($files as $filePath) {
    $fileName = basename($filePath, '.json');

    $items[] = [
        'fileName' => $fileName,
        'label' => ucwords(str_replace(['-', '_'], ' ', $fileName)),
    ];
}

usort(
    $items,
    static function (array $a, array $b): int {
        return strcmp($a['label'], $b['label']);
    }
);

echo json_encode([
    'language' => $lang,
    'items' => $items,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);