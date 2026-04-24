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

### Changed
- `docs/API.md` atualizado para incluir `GET /analysis` para a tela de lista de analises
- `InputDocument` documentado e modelado com `original_filename` e `file_path`, mantendo `file_hash`

### Fixed
- Tipagem de `DATABASE_URL` em `backend/app/core/config.py` para compatibilidade com `pydantic-settings` no Pydantic v2
- Inicializacao do schema em ambiente dev para evitar erro 500 nas rotas de `analysis` quando o banco SQLite ainda nao possui tabelas

---

## [0.1.0] - 2026-04-23

### Added
- Estrutura inicial do projeto
- Documentação base (PRODUCT, ARCHITECTURE, etc)

### Changed
-

### Fixed
-
