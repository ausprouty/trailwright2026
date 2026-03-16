<?php

declare(strict_types=1);


header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}


if (
    !isset($_FILES['image']) ||
    !is_uploaded_file($_FILES['image']['tmp_name'])
) {
    http_response_code(400);
    echo json_encode([
        'success' => 0,
        'message' => 'No image uploaded.',
    ]);
    exit;
}

$tmpName = $_FILES['image']['tmp_name'];
$originalName = $_FILES['image']['name'];
$fileSize = (int) $_FILES['image']['size'];

if ($fileSize <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => 0,
        'message' => 'Uploaded file is empty.',
    ]);
    exit;
}

$maxSize = 10 * 1024 * 1024; // 10 MB
if ($fileSize > $maxSize) {
    http_response_code(400);
    echo json_encode([
        'success' => 0,
        'message' => 'File is too large.',
    ]);
    exit;
}

$uploadDir = dirname(__DIR__) . '/images/editor/';

if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
    http_response_code(500);
    echo json_encode([
        'success' => 0,
        'message' => 'Could not create upload folder.',
    ]);
    exit;
}

$imageInfo = getimagesize($tmpName);
if ($imageInfo === false) {
    http_response_code(400);
    echo json_encode([
        'success' => 0,
        'message' => 'File is not a valid image.',
    ]);
    exit;
}

$mimeType = $imageInfo['mime'] ?? '';

switch ($mimeType) {
    case 'image/jpeg':
        $sourceImage = imagecreatefromjpeg($tmpName);
        break;

    case 'image/png':
        $sourceImage = imagecreatefrompng($tmpName);
        break;

    case 'image/gif':
        $sourceImage = imagecreatefromgif($tmpName);
        break;

    case 'image/webp':
        $sourceImage = imagecreatefromwebp($tmpName);
        break;

    default:
        http_response_code(400);
        echo json_encode([
            'success' => 0,
            'message' => 'Unsupported image type.',
        ]);
        exit;
}

if (!$sourceImage) {
    http_response_code(500);
    echo json_encode([
        'success' => 0,
        'message' => 'Could not read uploaded image.',
    ]);
    exit;
}

$baseName = pathinfo($originalName, PATHINFO_FILENAME);
$safeBaseName = preg_replace('/[^a-zA-Z0-9_-]/', '-', $baseName);
$safeBaseName = trim((string) $safeBaseName, '-');

if ($safeBaseName === '') {
    $safeBaseName = 'image';
}

$filename = $safeBaseName . '-' . bin2hex(random_bytes(6)) . '.webp';
$targetPath = $uploadDir . $filename;

/*
 * Preserve transparency for PNG/GIF where possible.
 */
imagepalettetotruecolor($sourceImage);
imagealphablending($sourceImage, true);
imagesavealpha($sourceImage, true);

/*
 * Quality range is 0–100.
 * 80 is usually a good balance.
 */
$success = imagewebp($sourceImage, $targetPath, 80);

imagedestroy($sourceImage);

if (!$success) {
    http_response_code(500);
    echo json_encode([
        'success' => 0,
        'message' => 'Could not save WebP image.',
    ]);
    exit;
}

echo json_encode([
    'success' => 1,
    'file' => [
        'url' => '/images/editor/' . $filename,
    ],
]);