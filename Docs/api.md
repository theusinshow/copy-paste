# API.md

## Base
/api/v1

## Endpoints

POST /analysis
→ cria análise

POST /analysis/{id}/files
→ upload

POST /analysis/{id}/start
→ inicia processamento

GET /analysis/{id}
→ status

GET /analysis/{id}/issues
→ lista issues

GET /issues/{id}
→ detalhe

POST /issues/{id}/review
→ revisão

GET /analysis/{id}/export
→ relatório