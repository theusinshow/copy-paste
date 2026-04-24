# DATA_MODEL.md

## Entidades

### AnalysisRun
- id
- status
- status pode ser `created`, `processing`, `completed`, `failed` ou `cancelled`
- analysis_mode
- config
- config e um objeto json flexivel
- created_at

### InputDocument
- id
- analysis_run_id
- tipo
- original_filename
- file_path
- file_hash

### DocumentPage
- id
- document_id
- page_number

### TextSpan
- id
- document_page_id
- text
- bbox
- bbox pode ser null

### ExtractedField
- id
- input_document_id
- document_page_id
- field_name
- raw_value
- normalized_value
- bbox
- bbox pode ser null

### Issue
- id
- analysis_run_id
- type
- severity
- description

### IssueEvidence
- issue_id
- field_id
- page
- bbox
- bbox pode ser null

### ReviewDecision
- issue_id
- decision
- comment

### PackageMap
- entidade derivada, não persistida nesta fase
- agrupa documentos em secoes internas com:
  - intervalo de paginas
  - pagina da LD
  - codigos declarados na LD
  - pranchas detectadas no mesmo contexto
  - tipo inferido da secao

### PageMap
- entidade derivada, não persistida nesta fase
- classifica cada página por sinais textuais fortes
- retorna tipo, confiança, seção interna, disciplina detectada e evidência curta
- usada para orientar regras, revisão humana e futura leitura assistida

### FooterAudit
- entidade derivada, não persistida nesta fase
- usa `TextSpan.bbox` para montar texto provável de rodapé por página
- gera ocorrências e achados com evidência textual mínima

### AiReview
- entidade derivada, não persistida nesta fase
- prepara contextos textuais por documento e seção para leitura assistida
- registra `provider_status` para diferenciar modo estrutural de IA externa configurada
- gera sugestões rastreáveis, sem transformar IA em decisão final

---

## Regra
não armazenar dados sensíveis desnecessários
