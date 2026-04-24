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

## Categorias de cruzamento
- compatible: evidencias batem de forma suficiente
- needs_review: ha diferenca textual que exige revisao humana
- probable_issue: ha conflito objetivo forte
- extraction_limit: o sistema nao conseguiu confirmar com confianca

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

### Memorial com identidade divergente
- condição: campo encontrado no memorial diverge da identidade principal do pacote
- severidade: relevante

### Memorial com múltiplos endereços
- condição: mais de um endereço distinto é encontrado nos memoriais
- severidade: atencao
- observação: ausência de endereço não gera erro

### Memorial com múltiplos municípios ou números de projeto
- condição: mais de um valor distinto é encontrado nos memoriais
- severidade: atencao
- observação: usado quando a identidade principal não permite comparação conclusiva

### Memorial com proprietário/cliente de outro município
- condição: proprietário ou cliente textual aponta município diferente do município dominante no memorial
- severidade: relevante
- observação: usado para indicar possível reaproveitamento de memorial ou trecho de outro projeto
