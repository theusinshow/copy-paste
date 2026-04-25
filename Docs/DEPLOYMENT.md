# DEPLOYMENT.md

## Objetivo
Hospedar o `frontend` na Vercel e o `backend` no Render, mantendo a separacao de camadas definida na arquitetura.

## Estrategia
- `frontend/` como projeto Next.js na Vercel
- `backend/` como web service Python no Render
- banco PostgreSQL no Render
- comunicacao entre camadas via `NEXT_PUBLIC_API_URL`

## Frontend na Vercel
1. Importar o mesmo repositorio na Vercel.
2. Se a Vercel detectar o repositorio como `Services`, manter esse preset e usar o `vercel.json` da raiz para publicar apenas o servico `frontend` em `/`.
3. Caso a Vercel permita a configuracao tradicional de framework unico, configurar `Root Directory` como `frontend`.
4. Confirmar o framework `Next.js` para o servico de frontend.
5. Adicionar a variavel `NEXT_PUBLIC_API_URL` apontando para a URL publica do backend no Render, por exemplo `https://copy-paste-backend.onrender.com`.
6. Fazer o deploy.

## Backend no Render
1. Criar o backend via Blueprint usando o arquivo `render.yaml` na raiz do repositorio.
2. Confirmar o `Root Directory` como `backend`.
3. Validar que o banco PostgreSQL `copy-paste-db` sera criado junto com o web service.
4. Preencher os env vars secretos solicitados pelo Blueprint:
   `CORS_ALLOWED_ORIGINS`: dominio de producao da Vercel, como `https://seu-site.vercel.app` ou dominio customizado.
   `CORS_ALLOWED_ORIGIN_REGEX`: regex para previews da Vercel, como `^https://.*\.vercel\.app$`.
5. Fazer o deploy do serviço.

## Variaveis importantes
### Vercel
- `NEXT_PUBLIC_API_URL`: URL publica do backend Render sem barra final

### Render
- `APP_NAME=Copy&Paste Backend`
- `API_V1_PREFIX=/api/v1`
- `DATABASE_URL`: fornecida pelo banco Render e normalizada automaticamente pela aplicacao
- `UPLOAD_DIR=/tmp/copy-paste-uploads`
- `CORS_ALLOWED_ORIGINS`: lista separada por virgula com dominios permitidos
- `CORS_ALLOWED_ORIGIN_REGEX`: regex opcional para previews da Vercel

## Observacoes
- Em desenvolvimento local, o `frontend` continua usando `http://127.0.0.1:8000` quando `NEXT_PUBLIC_API_URL` nao estiver definido.
- Em producao, o `frontend` falha cedo sem `NEXT_PUBLIC_API_URL` para evitar deploy apontando para `localhost`.
- A aplicacao aceita `postgres://` e `postgresql://` do Render e converte para `postgresql+psycopg://` internamente.
- O `healthCheckPath` do Render usa `/docs`, evitando adicionar endpoint novo fora do contrato atual.
- O arquivo `vercel.json` da raiz declara apenas o servico `frontend` na Vercel para evitar roteamento ambiguo quando o repositorio for detectado como multi-servico.
