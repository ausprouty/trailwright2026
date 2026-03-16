<?php

declare(strict_types=1);

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

$baseDir = dirname(__DIR__, 2) . '/templates';
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
        'error' => 'Could not read template folder',
    ]);
    exit;
}

$templates = [];

foreach ($files as $filePath) {
    $filename = basename($filePath, '.json');

    $templates[] = [
        'key' => $filename,
        'label' => ucwords(str_replace(['-', '_'], ' ', $filename)),
    ];
}

usort(
    $templates,
    static function (array $a, array $b): int {
        return strcmp($a['label'], $b['label']);
    }
);

echo json_encode([
    'language' => $lang,
    'templates' => $templates,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);