# ARCHITECTURE.md

## Tipo
Web app

## Fluxo
Upload → Extração → Normalização → Regras → Resultado → Revisão

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

### Banco
- dados estruturados

---

## Política de dados
- não salvar PDF permanentemente
- salvar apenas:
  - campos extraídos
  - incongruências
  - evidência mínima