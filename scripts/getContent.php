<?php

declare(strict_types=1);

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$mysqli = new mysqli(
    'localhost',
    'trailwright',
    'Tony2026+',
    'trailwright'
);
$mysqli->set_charset('utf8mb4');

$exportRoot = __DIR__ . DIRECTORY_SEPARATOR . 'export';

if (
    !is_dir($exportRoot) && !mkdir($exportRoot, 0777, true)
    && !is_dir($exportRoot)
) {
    throw new RuntimeException(
        'Could not create export root: ' . $exportRoot
    );
}

$sql = <<<SQL
SELECT c.recnum,
       c.country_code,
       c.language_iso,
       c.folder_name,
       c.filename,
       c.text,
       c.filetype
FROM content c
INNER JOIN (
    SELECT country_code,
           language_iso,
           folder_name,
           filename,
           MAX(recnum) AS max_recnum
    FROM content
    WHERE filetype = 'html'
      AND country_code IS NOT NULL
      AND TRIM(country_code) <> ''
      AND language_iso IS NOT NULL
      AND TRIM(language_iso) <> ''
      AND folder_name IS NOT NULL
      AND TRIM(folder_name) <> ''
      AND filename IS NOT NULL
      AND TRIM(filename) <> ''
    GROUP BY country_code,
             language_iso,
             folder_name,
             filename
) latest
    ON latest.country_code = c.country_code
   AND latest.language_iso = c.language_iso
   AND latest.folder_name = c.folder_name
   AND latest.filename = c.filename
   AND latest.max_recnum = c.recnum
ORDER BY c.country_code,
         c.language_iso,
         c.folder_name,
         c.filename
SQL;

$result = $mysqli->query($sql);

while ($row = $result->fetch_assoc()) {
    $countryCode = cleanPathPart($row['country_code']);
    $languageIso = cleanPathPart($row['language_iso']);
    $folderName = cleanPathPart($row['folder_name']);
    $filename = cleanFilename($row['filename']);
    $html = (string) $row['text'];
    $recnum = (int) $row['recnum'];

    if (
        $countryCode === ''
        || $languageIso === ''
        || $folderName === ''
        || $filename === ''
    ) {
        echo "Skipped bad row recnum {$recnum}\n";
        continue;
    }

    $dir = $exportRoot
        . DIRECTORY_SEPARATOR . $countryCode
        . DIRECTORY_SEPARATOR . $languageIso
        . DIRECTORY_SEPARATOR . $folderName;

    ensureDirectoryExists($dir);

    $filePath = $dir
        . DIRECTORY_SEPARATOR
        . ensureHtmlExtension($filename);

    if (is_dir($filePath)) {
        throw new RuntimeException(
            'Cannot write file because a directory exists there: '
                . $filePath
        );
    }

    $bytes = file_put_contents($filePath, $html);

    if ($bytes === false) {
        throw new RuntimeException(
            'Could not write file: ' . $filePath
        );
    }

    echo "Wrote: {$filePath} (recnum {$recnum})\n";
}

echo "Done.\n";

function cleanPathPart(string $value): string
{
    $value = trim($value);
    $value = str_replace(
        ['\\', '/', ':', '*', '?', '"', '<', '>', '|'],
        '-',
        $value
    );
    $value = preg_replace('/\s+/', ' ', $value);
    return trim((string) $value, ". \t\n\r\0\x0B");
}

function cleanFilename(string $value): string
{
    $value = trim($value);

    if (str_ends_with(strtolower($value), '.html')) {
        $value = substr($value, 0, -5);
    }

    $value = cleanPathPart($value);

    return $value;
}

function ensureHtmlExtension(string $filename): string
{
    return $filename . '.html';
}

function ensureDirectoryExists(string $dir): void
{
    if (file_exists($dir) && !is_dir($dir)) {
        throw new RuntimeException(
            'Path exists as a file, not a directory: ' . $dir
        );
    }

    if (
        !is_dir($dir) && !mkdir($dir, 0777, true)
        && !is_dir($dir)
    ) {
        throw new RuntimeException(
            'Could not create directory: ' . $dir
        );
    }
}
