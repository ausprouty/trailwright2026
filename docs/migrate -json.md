SELECT t.\*
FROM content t
INNER JOIN (
SELECT
language_iso,
country_code,
folder_name,
filename,
MAX(recnum) AS max_recnum
FROM content
WHERE filetype = 'json'
GROUP BY
language_iso,
country_code,
folder_name,
filename
) latest
ON t.language_iso <=> latest.language_iso
AND t.country_code <=> latest.country_code
AND t.folder_name <=> latest.folder_name
AND t.filename = latest.filename
AND t.recnum = latest.max_recnum
WHERE t.filetype = 'json';
