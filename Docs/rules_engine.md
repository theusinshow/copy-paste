# RULES_ENGINE.md

## Princípios
- regras determinísticas
- evidência obrigatória
- ausência ≠ erro
- IA não decide

## Severidade
- info
- atencao
- relevante

---

## Regras MVP

### Nome da obra divergente
- campo: nome_obra
- condição: valores diferentes
- severidade: relevante

### Número do projeto divergente
- campo: numero_projeto
- condição: valores diferentes
- severidade: relevante

### Bairro divergente
- campo: bairro
- condição: valores diferentes
- severidade: relevante

### Campo obrigatório ausente
- condição: não encontrado
- severidade: atencao

### LD vs prancha divergente
- condição: descrição diferente
- severidade: relevante