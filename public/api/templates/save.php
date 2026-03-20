<?php

header('Access-Control-Allow-Origin: http://localhost:9000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid JSON body',
    ]);
    exit;
}

$lang = isset($data['lang']) ? trim((string) $data['lang']) : '';
$template = isset($data['template']) ? trim((string) $data['template']) : '';
$content = $data['content'] ?? null;

if ($lang === '' || $template === '' || !is_array($content)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Missing lang, template, or content',
    ]);
    exit;
}

if (!preg_match('/^[a-z0-9_-]+$/i', $lang)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid language code',
    ]);
    exit;
}

if (!preg_match('/^[a-z0-9_-]+$/i', $template)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid template name',
    ]);
    exit;
}

$baseDir = realpath(__DIR__ . '/../../templates');

if ($baseDir === false) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Templates base directory not found',
    ]);
    exit;
}

$langDir = $baseDir . DIRECTORY_SEPARATOR . $lang;

if (!is_dir($langDir) && !mkdir($langDir, 0777, true)) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Could not create language directory',
    ]);
    exit;
}

$filePath = $langDir . DIRECTORY_SEPARATOR . $template . '.json';
$json = json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

if ($json === false) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Could not encode JSON',
    ]);
    exit;
}

if (file_put_contents($filePath, $json) === false) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Could not write file',
    ]);
    exit;
}

echo json_encode([
    'ok' => true,
    'file' => $template . '.json',
    'lang' => $lang,
]);