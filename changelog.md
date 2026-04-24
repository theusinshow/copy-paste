# CHANGELOG.md

## [Unreleased]

### Added
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

### Changed
- `docs/API.md` atualizado para incluir `GET /analysis` para a tela de lista de analises
- `InputDocument` documentado e modelado com `original_filename` e `file_path`, mantendo `file_hash`
- Frontend configurado com tokens CSS derivados de `docs/DESIGN.md` e base da API centralizada via `NEXT_PUBLIC_API_URL`
- `AnalysisRun` agora percorre os status `processing`, `completed` e `failed` durante o pipeline inicial de leitura de PDFs

### Fixed
- Tipagem de `DATABASE_URL` em `backend/app/core/config.py` para compatibilidade com `pydantic-settings` no Pydantic v2
- Inicializacao do schema em ambiente dev para evitar erro 500 nas rotas de `analysis` quando o banco SQLite ainda nao possui tabelas
- Assinatura do upload em `POST /api/v1/analysis/{id}/files` ajustada para o Swagger expor `files` como upload de arquivo multipart
- Estado inicial do formulario de nova analise movido para modulo compartilhado para evitar erro de prerender no build do Next.js
- Reprocessamento inicial de paginas agora substitui `DocumentPage` anteriores da analise para manter o pipeline deterministico
- `.gitignore` corrigido para bloquear bancos locais, uploads e artefatos de build antes do commit

---

## [0.1.0] - 2026-04-23

### Added
- Estrutura inicial do projeto
- Documentação base (PRODUCT, ARCHITECTURE, etc)

### Changed
-

### Fixed
-
