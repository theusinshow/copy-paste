# CHANGELOG.md

## [Unreleased]

### Added
- Arquivo `render.yaml` para provisionar o backend FastAPI e o PostgreSQL no Render via Blueprint.
- Guia `Docs/DEPLOYMENT.md` com o fluxo de deploy do frontend na Vercel e do backend no Render.
- Endpoint `GET /api/v1/analysis/{id}/signoff` para consultar o encerramento formal humano da analise.
- Endpoint `POST /api/v1/analysis/{id}/signoff` para registrar responsavel, comentario e status final assinado da analise.
- Entidade `AnalysisSignoff` para persistir o encerramento formal por analise sem substituir o fechamento calculado.
- Endpoint `GET /api/v1/analysis/{id}/mode-output` para expor a saida operacional dos modos dirigidos com evidencias e contadores.
- Painel `Sign-off` na tela de resultado para registrar a conclusao humana final do pacote.
- Painel `Modo dirigido` na tela de resultado para revisar busca textual, sugestao de substituicao e verificacoes pontuais sem alterar PDF.
- Exportacao HTML em `GET /api/v1/analysis/{id}/export?format=html` para gerar relatorio printavel do pacote.
- Endpoint `GET /api/v1/analysis/{id}/audit-summary` para consolidar status final, métricas executivas e sinais por camada da auditoria.
- Painel `Fechamento` na tela de resultado para resumir conflitos, pontos de revisão, issues pendentes e pranchas sem LD.
- Endpoint `GET /api/v1/issues/{id}` para retornar a issue com evidências e revisão humana registrada.
- Endpoint `POST /api/v1/issues/{id}/review` para criar ou atualizar a decisão humana associada a uma issue.
- Formulário de revisão humana embutido em cada issue da tela de resultado.
- Endpoint `GET /api/v1/analysis/{id}/export` para baixar um relatorio Markdown com fechamento executivo e grupos de issues por status.
- Filtros visuais na lista de issues para separar pendentes, ativas, resolvidas, descartadas e sem evidencia.
- Badge de status de revisao por issue para explicitar fila humana e impacto no fechamento.
- Endpoint `POST /api/v1/analysis/{id}/issues/review-batch` para aplicar a mesma decisao humana a varias issues da mesma analise.
- Central de revisao em lote na tela de resultado com selecao multipla, selecao dos itens visiveis e aplicacao rapida de decisao.
- Endpoint `GET /api/v1/analysis/{id}/page-map` para classificar paginas por tipo, confianca, sinais e evidencia textual.
- Painel `Mapa de paginas` na tela de resultado para revisar capa, LD, separatriz, prancha, memorial, sumario e paginas nao classificadas.
- Endpoint `GET /api/v1/analysis/{id}/ai-review` para preparar contextos de leitura inteligente e sugestoes estruturais auditaveis.
- Painel `Leitura inteligente` na tela de resultado, com status do provedor, contextos preparados e pontos sugeridos para revisao.
- Painel `Rodapes` na tela de resultado para listar conflitos e ocorrencias de numeros de projeto lidos em rodapes.
- Endpoint `GET /api/v1/analysis/{id}/footer-audit` para auditar numeros de projeto detectados em rodapes.
- Classificacao inicial de secoes no `Mapa do pacote`, como fundacao, concreto, arquitetura, drenagem e eletrica.
- Painel `Mapa do pacote` na tela de resultado para revisar secoes internas, LDs e pranchas por contexto documental.
- Endpoint `GET /api/v1/analysis/{id}/package-map` para expor o mapa estrutural de documentos e secoes internas do pacote.
- Endpoint `POST /api/v1/analysis/{id}/cancel` para solicitar cancelamento de analises criadas ou em processamento.
- Tela `/analysis/{id}/processing` para acompanhar o processamento da analise, iniciar o `start` e liberar o resultado ao concluir.
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
- Configuracao de API do frontend agora exige `NEXT_PUBLIC_API_URL` em producao e mantem fallback local apenas no desenvolvimento.
- Backend agora aceita CORS configuravel por ambiente para liberar dominios da Vercel e previews sem alterar a camada de API.
- `DATABASE_URL` do backend agora normaliza URLs `postgres://` e `postgresql://` para compatibilidade com o driver `psycopg` no Render.
- Pagina inicial agora abre a criacao de analise a partir de um hero com CTA, revela o upload so depois do inicio e organiza o formulario em etapas mais claras para revisao principal, busca textual, verificacao pontual e tipo de arquivo.
- Tela de resultado reorganizada para usuario leigo, com navegacao renomeada, secoes decisorias no topo e paineis tecnicos reescritos com linguagem mais clara sobre pacote, listas, pranchas, memoriais e trechos separados.
- Relatorio de exportacao agora aceita `md` e `html`, incorpora sign-off humano quando existir e inclui a saida dos modos dirigidos.
- Tela de resultado agora ganhou secao de encerramento formal e navegacao dedicada para modo dirigido quando a analise usa configuracao dirigida.
- Lista de issues agora prioriza pendencias e conflitos na navegacao de revisao operacional, com foco sequencial entre cards.
- `GET /api/v1/analysis/{id}/issues` agora retorna tambem a `review` registrada para cada issue.
- Revisao humana das issues agora aceita apenas decisoes padronizadas e devolve status derivado por issue para fila operacional.
- `audit-summary` agora usa as decisoes humanas para separar issues ativas, pendentes, resolvidas, descartadas e sem evidencia antes de fechar o pacote.
- Painel `Fechamento`, cabecalho da analise e resumo executivo agora mostram contadores reais da fila de revisao humana.
- Formulario de revisao das issues agora usa selecao guiada de decisoes, em vez de texto livre.
- Lista de issues agora permite selecao por card e organiza a fila para revisao operacional em lote sem perder a revisao individual.
- `LD x Pranchas` agora faz leitura reversa para apontar pranchas sem LD correspondente e pranchas declaradas apenas em outra secao ou outro documento.
- Cabecalho e resumo executivo da tela de resultado agora usam o consolidado do fechamento para refletir o status real da auditoria.
- `Mapa de paginas` agora detecta siglas de disciplina como `EST`, `FND`, `HIS`, `DRE` e usa essas siglas para classificar pranchas e separatrizes.
- `Mapa do pacote` agora prioriza siglas de disciplina dos codigos de LD e pranchas para classificar secoes internas.
- Cruzamento `LD x Pranchas` agora usa o contexto do mapa do pacote para diferenciar prancha ausente, prancha em outra secao e prancha em outro documento.
- Tela de acompanhamento agora exibe botao para parar o processamento e reconhece o status `cancelled`.
- Fluxo de nova analise agora envia os PDFs e abre a tela de acompanhamento antes de executar o processamento.
- Layout inicial e tela de resultado refinados com hierarquia executiva, navegacao por secoes e paineis mais compactos.
- Painel de memoriais reorganizado para agrupar conflitos, pontos de revisao e valores extraidos sem repeticao excessiva.
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
- Leitura do selo das pranchas agora remove metadados administrativos como data, disciplina e arquivo, recupera melhor titulos proximos ao marcador de disciplina e reduz falso positivo no cruzamento entre lista e prancha quando o carimbo nao traz descricao util.
- Backend voltou a iniciar com a rota de exportacao habilitada, desativando o `response_model` implicito de um retorno `PlainTextResponse | HTMLResponse` que quebrava o startup do FastAPI.
- Fechamento executivo agora nao trata issue relevante sem revisao como conflito ativo confirmado; ela permanece pendente ate decisao humana.
- Decisao `sem_evidencia` agora move a issue para estado inconclusivo e alimenta corretamente o status `analise incompleta por falta de evidencia`.
- Tela de resultado agora carrega os paineis de forma independente para evitar falha total quando um endpoint isolado nao responde.
- Auditoria de memoriais agora ignora bairros invalidos formados por conectivos ou valores de uma letra, como `E`.
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
