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

### LD vs prancha com folha divergente
- condição: código da LD existe em prancha detectada, mas folha difere
- severidade: relevante

### LD vs prancha com descrição diferente
- condição: código e folha batem, mas descrição normalizada não tem compatibilidade textual mínima
- severidade: atencao

### LD com código de projeto divergente
- condição: item da LD declara número de projeto diferente do predominante nas LDs
- severidade: atencao

### Item da LD sem correspondência clara
- condição: código declarado na LD não aparece textualmente nas páginas extraídas do pacote
- severidade: atencao
