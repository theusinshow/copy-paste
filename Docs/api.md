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

POST /analysis/{id}/cancel
→ solicita cancelamento da análise
- retorna a análise com `status = cancelled` quando ainda não está finalizada
- se a análise já estiver `completed` ou `failed`, retorna o status atual

GET /analysis/{id}
→ status
- retorna `id`, `status`, `analysis_mode`, `config`, `created_at`

GET /analysis/{id}/issues
→ lista pontos técnicos
- retorna `Issue` com `evidences` (nome técnico do contrato)
- retorna `review` quando o ponto já possui decisão humana registrada
- retorna `review_status` e `review_status_label` para classificar a fila em `pending_review`, `active`, `resolved`, `dismissed` ou `inconclusive`
- `evidences` mantem `issue_id`, `field_id`, `page`, `bbox`
- `evidences.text` e derivado de `ExtractedField.raw_value` apenas para leitura

GET /analysis/{id}/fields
→ lista campos extraídos
- retorna `ExtractedField` com contexto de `page`, `document_filename` e `document_tipo`
- usado para revisar evidências mesmo quando nenhuma issue é gerada

GET /analysis/{id}/audit-summary
→ consolida o fechamento executivo da analise
- retorna status final da auditoria: `sem incongruencia relevante`, `com pontos de atencao`, `com incongruencia relevante` ou `analise incompleta por falta de evidencia`
- agrega contadores de conflitos ativos, revisoes pendentes, resolvidas, descartadas, sem evidencia, pranchas sem LD e limites de extracao
- aplica as decisões humanas dos pontos antes de fechar o rules engine no consolidado
- resume as camadas `rules_engine`, `drawing_lists`, `ld_sheet_crosscheck`, `memorial_audit` e `footer_audit`

GET /analysis/{id}/signoff
→ consulta o encerramento formal humano da analise
- retorna `null` quando a analise ainda nao recebeu sign-off
- quando existe, retorna `final_status_code`, `final_status_label`, `reviewer_name`, `comment`, `created_at` e `updated_at`

POST /analysis/{id}/signoff
→ registra ou atualiza o encerramento formal humano da analise
- permitido apenas para analises com `status = completed`
- body:
```json
{
  "final_status_code": "needs_review",
  "reviewer_name": "Matheus",
  "comment": "Pacote encerrado com pendencias formais."
}
```
- `final_status_code` aceita apenas:
  - `clean`
  - `needs_review`
  - `relevant_issue`
  - `incomplete`
- nao substitui o fechamento calculado; apenas registra a decisao final humana

GET /analysis/{id}/package-summary
→ resume o pacote documental analisado
- retorna identidade principal detectada, documentos, contadores, paginas com LD e alertas iniciais
- derivado de `InputDocument`, `DocumentPage` e `TextSpan`, sem reler PDFs permanentes

GET /analysis/{id}/package-map
→ monta o mapa estrutural do pacote
- retorna documentos e secoes internas por intervalo de paginas, LD, linhas da LD e pranchas detectadas
- usado para reduzir comparacoes fora de contexto entre volumes ou subvolumes
- derivado de `InputDocument`, `DocumentPage` e `TextSpan`, sem reler PDFs permanentes

GET /analysis/{id}/page-map
→ classifica as páginas do pacote
- retorna tipo provável da página: capa, LD, separatriz, prancha, memorial, sumário ou não classificada
- retorna confiança, sinais encontrados, seção interna, disciplina detectada e trecho de evidência
- usado para melhorar o contexto das regras e preparar leitura assistida futura

GET /analysis/{id}/footer-audit
→ audita rodapés das páginas com base nos spans posicionados
- retorna ocorrências de número de projeto detectadas em rodapés
- compara o número de projeto do rodapé com a identidade principal do pacote
- usado para detectar reaproveitamento ou rodapé de outro projeto

GET /analysis/{id}/ai-review
→ prepara leitura inteligente da análise
- retorna contextos textuais por abertura de documento e seção interna
- retorna sugestões estruturais rastreáveis para revisão humana
- retorna `provider_status` para indicar se há IA externa configurada
- nesta fase não substitui regras determinísticas nem decide pontos automaticamente

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
- retorna `category` para separar `compatible`, `needs_review`, `probable_issue` e `extraction_limit`
- retorna tambem `reverse_results` para listar pranchas detectadas que ficaram sem LD coerente
- retorna `reason` técnico para explicar a classificação sem depender de interpretação subjetiva
- compara codigo, folha e descricao normalizada com evidencias da LD e da prancha
- quando um mesmo PDF possui mais de uma LD, o cruzamento respeita a seção interna da LD antes de buscar correspondências fora dela
- quando um codigo aparece fora da seção correta, retorna motivo específico para contexto errado
- quando uma prancha e detectada sem linha correspondente na LD, retorna achado especifico para `detected_sheet_missing_from_ld`
- quando a prancha so encontra LD em outra secao ou outro documento, retorna motivo especifico para esse contexto

GET /analysis/{id}/memorial-audit
→ audita campos de identidade encontrados em memoriais
- retorna ocorrencias de endereco, bairro, municipio, proprietario/cliente, obra e numero de projeto com pagina e trecho de evidencia
- retorna achados por `category`, separando ponto para verificar, revisão necessária e limite de extração
- ausência de campo no memorial não é tratada como erro

GET /analysis/{id}/mode-output
→ retorna a saida operacional dos modos dirigidos
- retorna `null` quando a analise nao esta em modo dirigido
- em `find_text`, devolve ocorrencias agrupadas por linha com `query`, `summary`, `stats` e `entries`
- em `find_replace`, devolve ocorrencias agrupadas por linha com `query`, `replace`, `summary`, `stats` e `entries`
- em `check_address`, `check_project_number` e `check_work_name`, devolve conferencias por campo com `expected`, `field_label`, `summary`, `stats` e `entries`
- cada `entry` preserva evidencia textual ou de campo; nao altera o PDF original

GET /issues/{id}
→ detalhe
- retorna o ponto técnico com `evidences`, `review` atual e status derivado da fila de revisão

POST /issues/{id}/review
→ revisão
- body: `{ "decision": "confirmada|falso_positivo|corrigido|nao_aplicavel|sem_evidencia", "comment": "texto opcional" }`
- cria ou atualiza a `ReviewDecision` associada ao ponto
- retorna o ponto atualizado com a revisão registrada

POST /analysis/{id}/issues/review-batch
→ revisão em lote
- body: `{ "issue_ids": [1, 2, 3], "decision": "confirmada|falso_positivo|corrigido|nao_aplicavel|sem_evidencia", "comment": "texto opcional" }`
- valida que todos os `issue_ids` existem e pertencem à análise informada
- cria ou atualiza a `ReviewDecision` de todos os pontos selecionados
- retorna contagem atualizada e label humana da decisão aplicada

GET /analysis/{id}/export
→ relatório
- `format=md` retorna relatorio Markdown baixavel
- `format=html` retorna relatorio HTML printavel
- formatos aceitos:
  - `md`
  - `html`
- inclui fechamento executivo, sign-off humano quando existir, grupos de pontos por status, pranchas sem LD correspondente e saída de modo dirigido quando aplicável
