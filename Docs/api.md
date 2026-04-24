# API.md

## Base
/api/v1

## Endpoints

GET /analysis
→ lista análises

POST /analysis
→ cria análise
- body opcional
- default: `analysis_mode = full_check`
- default: `config = {}`
- modos aceitos:
  - `full_check`
  - `memorial_only`
  - `sheets_only`
  - `ld_only`
  - `find_text`
  - `find_replace`
  - `check_address`
  - `check_project_number`
  - `check_work_name`
- exemplos de config:
  - `find_text`: `{ "query": "concreto" }`
  - `find_replace`: `{ "find": "Rua antiga", "replace": "Avenida nova" }`
  - `check_address`: `{ "expected": "Rua das Flores, 120" }`
  - `check_project_number`: `{ "expected": "24-1087" }`
  - `check_work_name`: `{ "expected": "Estacao Central" }`
- payload:
```json
{
  "analysis_mode": "find_text",
  "config": {
    "query": "concreto"
  }
}
```

POST /analysis/{id}/files
→ upload multipart/form-data
- tipo: string aplicado aos arquivos enviados na requisição
- files: múltiplos PDFs

POST /analysis/{id}/start
→ inicia processamento

GET /analysis/{id}
→ status
- retorna `id`, `status`, `analysis_mode`, `config`, `created_at`

GET /analysis/{id}/issues
→ lista issues
- retorna `Issue` com `evidences`
- `evidences` mantem `issue_id`, `field_id`, `page`, `bbox`
- `evidences.text` e derivado de `ExtractedField.raw_value` apenas para leitura

GET /issues/{id}
→ detalhe

POST /issues/{id}/review
→ revisão

GET /analysis/{id}/export
→ relatório
