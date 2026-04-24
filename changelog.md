# CHANGELOG.md

## [Unreleased]

### Added
- Endpoint `GET /api/v1/analysis/{id}/memorial-audit` para auditar enderecos e campos de identidade em memoriais com evidencia textual.
- Painel `LD x Pranchas` na tela de resultado com status por item da LD e evidencias comparadas.
- Endpoint `GET /api/v1/analysis/{id}/ld-sheet-crosscheck` para cruzar itens da LD com pranchas detectadas por codigo, folha e descricao.
- Painel `Pranchas detectadas` na tela de resultado para revisar codigos encontrados fora das paginas de LD.
- Endpoint `GET /api/v1/analysis/{id}/detected-sheets` para listar codigos de pranchas detectados fora das paginas de LD.
- Alertas iniciais no painel de LD para codigo de projeto divergente e item sem correspondencia textual clara no pacote.
- Painel `Listas de documentos` na tela de resultado para revisar codigos, itens, descricoes e paginas extraidos das LDs.
- Endpoint `GET /api/v1/analysis/{id}/drawing-lists` para expor linhas detectadas em Listas de Documentos com trecho de evidencia.
- Endpoint `GET /api/v1/analysis/{id}/package-summary` para resumir identidade, documentos, LDs e alertas iniciais do pacote analisado.
- Painel `Resumo do pacote` na tela de resultado com identidade detectada, contadores, classificacao dos PDFs e pontos de atencao.
- Documento `docs/PRODUCT_ROADMAP.md` com plano completo para evoluir o sistema ate auditoria documental de pacotes tecnicos.
- Fixture `tests/fixtures/pdfs/ALL_IN_ONE_TEST.md` com cenario unico maior para validar multiplas divergencias em um PDF.
- Guia `tests/fixtures/pdfs/TEST_CASES.md` com conteudos controlados para gerar PDFs de teste do rules engine.
- Endpoint `GET /api/v1/analysis/{id}/fields` para listar campos extraidos com pagina e contexto do documento.
- Secao de campos extraidos na tela de resultado para mostrar evidencias mesmo quando nenhuma issue e gerada.
- Base do backend FastAPI em `backend/app`
- Estrutura modular inicial para API, core, db, models e schemas
- Settings por ambiente com `.env.example`
- Preparacao de conexao com PostgreSQL
- Preparacao de migrations com Alembic
- Models `AnalysisRun`, `InputDocument`, `DocumentPage`, `ExtractedField`, `Issue`, `IssueEvidence` e `ReviewDecision`
- Endpoints base de `/api/v1` preparados como stubs sem logica de negocio
- Rotas iniciais de analise implementadas: `POST /api/v1/analysis`, `GET /api/v1/analysis` e `GET /api/v1/analysis/{id}`
- Upload inicial de PDFs em `POST /api/v1/analysis/{id}/files` com suporte a multiplos arquivos, `file_hash`, `file_path` e `original_filename`
- Base do frontend Next.js em `frontend/` com App Router, TypeScript e Tailwind
- Tela de lista de analises e tela de nova analise com upload inicial integradas ao backend atual
- Estrutura inicial de worker em `backend/app/worker` para processamento sincrono das analises
- Pipeline inicial de `POST /api/v1/analysis/{id}/start` para ler PDFs enviados e criar `DocumentPage` por pagina
- Entidade `TextSpan` associada a `DocumentPage` para armazenar texto bruto com `bbox` opcional
- Modulo inicial de extracao de campos MVP a partir de `TextSpan` com labels simples e texto proximo
- Motor inicial de regras em modulo separado para gerar `Issue` e `IssueEvidence` a partir de `ExtractedField`
- Endpoint `GET /api/v1/analysis/{id}/issues` para expor issues com evidencias textuais derivadas para leitura no frontend
- Fluxo do frontend para criar analise, enviar PDFs, iniciar o processamento e liberar o link de resultado quando o status final for `completed`
- Central de Analise no frontend com selecao visual de `analysis_mode`, configuracao dinamica por modo e area de upload com drag and drop
- Contrato inicial de `analysis_mode` e `config` em `AnalysisRun`, com suporte a `full_check`, modos por documento, busca textual e verificacoes pontuais

### Changed
- Cruzamento `LD x Pranchas` agora separa resultados em `compatible`, `needs_review`, `probable_issue` e `extraction_limit`, com `reason` tecnico por item.
- Pagina de entrada reorganizada para iniciar direto pelo fluxo de nova analise, com anexo de PDFs como primeira acao.
- Formulario de nova analise reordenado para exibir as opcoes de verificacao abaixo do anexo e manter `full_check` como modo padrao.
- Historico de analises movido para uma area discreta ao final da pagina de entrada, mantendo consulta pelo endpoint atual.
- Tela `/analysis/new` simplificada para reutilizar o mesmo layout operacional da pagina de entrada.
- Componentes de upload, selecao de modo, configuracao e acoes ajustados para uma interface mais discreta e menos promocional.
- Fundo global do frontend reduzido para um gradiente simples, sem elementos visuais chamativos.
- `docs/API.md` atualizado para incluir `GET /analysis` para a tela de lista de analises
- `InputDocument` documentado e modelado com `original_filename` e `file_path`, mantendo `file_hash`
- Frontend configurado com tokens CSS derivados de `docs/DESIGN.md` e base da API centralizada via `NEXT_PUBLIC_API_URL`
- `AnalysisRun` agora percorre os status `processing`, `completed` e `failed` durante o pipeline inicial de leitura de PDFs
- `docs/DATA_MODEL.md` atualizado para incluir a camada bruta `TextSpan` ligada a `DocumentPage`
- `ExtractedField` agora associa `InputDocument` e `DocumentPage`, preservando `raw_value`, `normalized_value` minimo e `bbox` opcional
- `Issue` agora associa explicitamente a analise por `analysis_run_id`, e `docs/DATA_MODEL.md` passou a refletir a persistencia de evidencias com `bbox` opcional
- `docs/API.md` agora descreve que `GET /analysis/{id}/issues` retorna `Issue` com `IssueEvidence` e `text` derivado de `ExtractedField.raw_value`
- Tela `/analysis/new` agora orquestra criacao, upload e `POST /analysis/{id}/start` usando a camada `lib/api`, exibindo `created`, `processing`, `completed` e `failed`
- `POST /api/v1/analysis` agora aceita body opcional com `analysis_mode` e `config`, mantendo compatibilidade com `full_check` como default
- `docs/PRODUCT.md`, `docs/UI_FLOWS.md`, `docs/API.md` e `docs/DATA_MODEL.md` agora descrevem a Central de Analise e o novo contrato de modos
- Pipeline inicial agora usa um dispatcher simples por `analysis_mode` para decidir recorte de documentos e execucao do rules engine sem reescrever o worker

### Fixed
- Cruzamento `LD x Pranchas` agora respeita secoes internas quando um PDF contem mais de uma LD, reduzindo mistura entre volumes dentro do mesmo arquivo.
- Auditoria de memoriais agora filtra frases genericas de bairro/obra e detecta proprietario ou cliente apontando municipio divergente.
- Auditoria de memoriais ajustada para nao confundir codigos tecnicos como `DADOS-01-27` com numero de projeto.
- Selecao de memoriais restringida para evitar incluir pranchas que apenas citam memorial em notas de desenho.
- Auditoria de memoriais agora sinaliza multiplos municipios e numeros de projeto distintos mesmo quando a identidade principal nao traz valor esperado confiavel.
- Extração de descrição do selo calibrada para priorizar o campo `CONTEUDO: PRANCHA` e títulos próximos de marcadores como `ARQ 03/` ou `DRE 01/`.
- Detector de pranchas agora reconstrói codigos completos quando o selo exibe arquivo base separado da folha, como `117_25_urb_a` + `01/07`.
- Limpeza de descricoes da LD ajustada para remover rodapes e caminhos de arquivo anexados ao ultimo item da lista.
- Extracao agora guarda multiplas ocorrencias confiaveis por campo para permitir comparacao dentro do mesmo PDF.
- Aliases genericos de `OBRA` e `PROJETO` removidos para evitar falsos positivos em frases comuns do documento.
- Normalizacao de bairro ajustada para nao tratar sufixos entre parenteses como divergencia real.
- Extracao de campos flexibilizada para reconhecer labels com separadores na mesma linha, acentos e variacoes como `Nº Projeto`.
- Regra de divergencia ajustada para comparar tambem `bairro`, conforme regras MVP documentadas.
- Comparacao de valores normalizada para reduzir falsos negativos por maiusculas, acentos e pontuacao.
- Modos `check_address`, `check_project_number` e `check_work_name` agora geram incongruencia quando o valor extraido diverge do valor esperado configurado.
- Tipagem de `DATABASE_URL` em `backend/app/core/config.py` para compatibilidade com `pydantic-settings` no Pydantic v2
- Inicializacao do schema em ambiente dev para evitar erro 500 nas rotas de `analysis` quando o banco SQLite ainda nao possui tabelas
- Assinatura do upload em `POST /api/v1/analysis/{id}/files` ajustada para o Swagger expor `files` como upload de arquivo multipart
- Estado inicial do formulario de nova analise movido para modulo compartilhado para evitar erro de prerender no build do Next.js
- Reprocessamento inicial de paginas agora substitui `DocumentPage` anteriores da analise para manter o pipeline deterministico
- Worker de PDF ajustado para extrair texto nativo por pagina com coordenadas quando disponiveis, sem OCR e sem interpretacao semantica
- Extração de campos agora usa heuristicas deterministicas por label e linha para salvar `ExtractedField` sem gerar comparacao, `Issue` ou rules engine
- `.gitignore` corrigido para bloquear bancos locais, uploads e artefatos de build antes do commit
- Pipeline de processamento agora executa apenas as tres regras MVP aprovadas apos a extracao de campos, sem gerar issue para campo ausente em todos os documentos
- Startup do backend ajustado para evitar import circular entre `db.issues`, `rules` e `worker` ao subir a API real
- `POST /api/v1/analysis/{id}/start` agora responde `400` quando um modo recortado nao encontra documentos compatíveis com o `tipo` enviado, mantendo a analise em `failed`
- Backend FastAPI agora libera CORS para `localhost` e `127.0.0.1` em ambiente local, corrigindo o `NetworkError` do frontend ao criar e iniciar analises

---

## [0.1.0] - 2026-04-23

### Added
- Estrutura inicial do projeto
- Documentação base (PRODUCT, ARCHITECTURE, etc)

### Changed
-

### Fixed
-
