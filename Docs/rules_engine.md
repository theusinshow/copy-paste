# RULES_ENGINE.md

## Princípios
- regras determinísticas
- evidência obrigatória
- ausência ≠ erro
- IA não decide
- IA, quando existir, sugere revisão com evidência e não altera severidade final sozinha

## Severidade
- info
- atencao
- relevante

## Categorias de cruzamento
- compatible: evidencias batem de forma suficiente
- needs_review: ha diferenca textual que exige revisao humana
- probable_issue: ha conflito objetivo forte
- extraction_limit: o sistema nao conseguiu confirmar com confianca

## Classificacao de paginas
- capa: primeira pagina com sinais de identidade do projeto
- lista de documentos: pagina com titulo `Lista de Documentos`
- separatriz: pagina curta usada como contra capa de disciplina, com sinais de volume, tomo, disciplina ou sigla
- prancha: pagina com codigo documental, campos de selo ou sigla de disciplina no selo
- memorial: pagina com titulo de memorial
- sumario: pagina com sumario ou indice
- nao classificada: sem sinal forte; nao gera erro automaticamente

## Siglas de disciplina
- `FND`: fundacao
- `EST`: estrutural
- `HIS`: hidrossanitario
- `DRE`: drenagem
- `ARQ`: arquitetura
- outras siglas podem ser adicionadas conforme o padrão real da empresa

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

### LD vs prancha em PDF com múltiplos volumes internos
- condição: um mesmo PDF contém mais de uma LD; cada LD é cruzada primeiro apenas com as pranchas entre a sua seção e a próxima LD
- severidade: atencao quando a prancha não é confirmada dentro da seção correta
- observação: evita misturar LDs de fundação, concreto ou outros subvolumes dentro do mesmo arquivo

### Prancha encontrada fora da seção da LD
- condição: o código declarado na LD não aparece na seção correta do mapa do pacote, mas aparece em outra seção do mesmo PDF
- severidade: relevante
- observação: indica possível mistura entre subvolumes ou separatriz/LD fora de ordem

### Prancha encontrada em outro documento
- condição: o código declarado na LD não aparece na seção correta, mas aparece em outro PDF do pacote
- severidade: atencao
- observação: usado quando o pacote pode estar dividido em arquivos diferentes e exige revisão humana

### Rodapé com número de projeto divergente
- condição: número de projeto detectado no rodapé diverge da identidade principal do pacote
- severidade: relevante
- observação: usado para detectar rodapé reaproveitado de outro projeto

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
