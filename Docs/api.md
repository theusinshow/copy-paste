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

GET /analysis/{id}/fields
→ lista campos extraídos
- retorna `ExtractedField` com contexto de `page`, `document_filename` e `document_tipo`
- usado para revisar evidências mesmo quando nenhuma issue é gerada

GET /analysis/{id}/package-summary
→ resume o pacote documental analisado
- retorna identidade principal detectada, documentos, contadores, paginas com LD e alertas iniciais
- derivado de `InputDocument`, `DocumentPage` e `TextSpan`, sem reler PDFs permanentes

GET /analysis/{id}/drawing-lists
→ lista as linhas detectadas nas Listas de Documentos
- retorna documentos com LD, codigo do documento, item, descricao, pagina e trecho de evidencia
- retorna alertas iniciais para codigo de projeto divergente na LD e linha sem correspondencia textual clara no pacote
- derivado de `InputDocument`, `DocumentPage` e `TextSpan`, sem reler PDFs permanentes
- usado pela tela de resultado para revisar o que cada LD declara antes do cruzamento com pranchas

GET /analysis/{id}/detected-sheets
→ lista pranchas detectadas nas paginas que nao sao LD
- retorna documento, pagina, codigo da prancha, folha quando detectada, descricao proxima e trecho de evidencia
- derivado de `InputDocument`, `DocumentPage` e `TextSpan`, sem reler PDFs permanentes
- quando o selo traz apenas arquivo base e folha separada, reconstrói o codigo completo da prancha para cruzamento com a LD

GET /analysis/{id}/ld-sheet-crosscheck
→ cruza linhas de LD com pranchas detectadas
- retorna cada item da LD com status `ok`, `atencao` ou `relevante`
- compara codigo, folha e descricao normalizada com evidencias da LD e da prancha

GET /issues/{id}
→ detalhe

POST /issues/{id}/review
→ revisão

GET /analysis/{id}/export
→ relatório
