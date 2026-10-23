## Create Tree Index first ##
This  will give you a list of all the countries, languages and studies
* result is in public/migration_preview/mc2/index.json 

npx tsx scripts/migration/utilities/build-migration-preview-tree-index.ts mc2


## Collect Legacy Index Files ##
You need the index of which files you should expect in each series and library

scripts/migration/json/write-json-exports.ts

* put data in data/sql_exports/mc2/json_content.js

## Check to see they are valid ##
Review directories in 
  npx tsx scripts/migration/json/inspect-json-export.ts
Write them:
  npx tsx  scripts/migration/json/write-json-export.ts


## migrate ##

npm run dev

npx tsx scripts/migration/mc2/multiply/migrate-multiply-series.ts multiply1