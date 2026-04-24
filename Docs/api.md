# API.md

## Base
/api/v1

## Endpoints

GET /analysis
→ lista análises

POST /analysis
→ cria análise

POST /analysis/{id}/files
→ upload multipart/form-data
- tipo: string aplicado aos arquivos enviados na requisição
- files: múltiplos PDFs

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
