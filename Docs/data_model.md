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
- decision aceita apenas:
  - `confirmada`
  - `falso_positivo`
  - `corrigido`
  - `nao_aplicavel`
  - `sem_evidencia`
- comment
- persistida por issue e reaproveitada na listagem de issues e no fechamento executivo
- pode ser criada individualmente ou em lote, mas continua armazenada por issue

### IssueReviewStatus
- entidade derivada, não persistida nesta fase
- calculada a partir de `ReviewDecision`
- estados:
  - `pending_review`
  - `active`
  - `resolved`
  - `dismissed`
  - `inconclusive`

### AnalysisSignoff
- persistida por análise
- registra:
  - `analysis_run_id`
  - `final_status_code`
  - `reviewer_name`
  - `comment`
  - `created_at`
  - `updated_at`
- representa o encerramento formal humano do pacote
- não substitui o `AuditSummary`; complementa o fechamento calculado

### DirectedModeOutput
- entidade derivada, não persistida nesta fase
- usada apenas quando `analysis_mode` for dirigido
- consolida:
  - `mode`
  - `summary`
  - `stats`
  - `entries`
  - `query`, `replace` ou `expected`, conforme o modo
- reaproveita `TextSpan` e `ExtractedField` como evidência, sem alterar PDF

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

### AuditSummary
- entidade derivada, não persistida nesta fase
- consolida o status final da auditoria a partir de:
  - `Issue` + `ReviewDecision`
  - `DrawingLists`
  - `LdSheetCrosscheck`
  - `MemorialAudit`
  - `FooterAudit`
- retorna:
  - status final
  - contadores executivos
  - contadores de fila das issues: ativas, pendentes, resolvidas, descartadas e sem evidencia
  - destaques
  - resumo por camada de auditoria
  - base calculada para o `AnalysisSignoff`

### LdSheetCrosscheck
- entidade derivada, não persistida nesta fase
- mantém `results` no sentido LD → prancha
- adiciona `reverse_results` no sentido prancha detectada → LD correspondente
- cada `reverse_result` informa:
  - prancha detectada
  - linha de LD associada, quando existir
  - contexto de seção
  - motivo técnico do desvio
  - severidade

---

## Regra
não armazenar dados sensíveis desnecessários
