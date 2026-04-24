# ARCHITECTURE.md

## Tipo
Web app

## Fluxo
Upload → Acompanhamento → Extração → Normalização → Regras → Contextos assistidos → Resultado → Revisão

## Camadas

### Frontend
- upload
- visualização
- revisão

### Backend
- API
- controle de análise

### Worker
- leitura de PDF
- extração
- regras
- classificação de páginas e seções
- preparação de contextos para leitura assistida

### Banco
- dados estruturados

---

## Política de dados
- não salvar PDF permanentemente
- salvar apenas:
  - campos extraídos
  - incongruências
  - evidência mínima
