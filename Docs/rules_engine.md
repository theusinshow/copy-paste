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

## Revisão humana dos pontos
- `confirmada`: mantém o ponto ativo no fechamento
- `falso_positivo`: remove o ponto do fechamento e registra descarte
- `corrigido`: remove o ponto do fechamento e registra resolução
- `nao_aplicavel`: remove o ponto do fechamento e registra descarte por contexto
- `sem_evidencia`: tira o ponto da fila ativa, mas marca o fechamento como inconclusivo quando ele é o único bloqueio restante
- ponto sem decisão registrada permanece em `pending_review` e impede fechamento limpo
- a aplicação em lote dessas decisões deve apenas repetir a mesma justificativa para vários pontos; não muda a regra nem a severidade base automaticamente

## Encerramento formal da analise
- o `AuditSummary` continua sendo o fechamento calculado pelo sistema
- o `AnalysisSignoff` registra a decisao humana final do pacote com:
  - `clean`
  - `needs_review`
  - `relevant_issue`
  - `incomplete`
- o sign-off nao cria regra nova nem altera evidencias; apenas formaliza a conclusao humana sobre o pacote
- sign-off sem evidencias suficientes deve usar `incomplete`

## Modos dirigidos
- `find_text` e `find_replace` operam sobre texto extraido e retornam evidencias agrupadas por linha
- `check_address`, `check_project_number` e `check_work_name` operam sobre `ExtractedField`
- a saida dirigida e sempre consultiva:
  - lista ocorrencias
  - mostra valor esperado ou sugestao
  - nao salva alteracao em PDF
  - nao inventa incongruencia quando nao houver evidencia extraida

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

### Prancha detectada sem LD correspondente
- condição: uma prancha é detectada fora das páginas de LD, mas seu código não aparece em nenhuma Lista de Documentos do pacote
- severidade: relevante
- observação: usada para indicar folha que entrou no pacote sem declaração documental explícita
- observação: se nenhuma LD for detectada no pacote, o cruzamento LD × Pranchas não gera problema automaticamente

### Prancha detectada com LD em outra seção
- condição: a prancha é detectada em uma seção interna, mas a linha correspondente da LD aparece em outra seção do mesmo PDF
- severidade: relevante
- observação: indica possível mistura entre subvolumes, seção fora de ordem ou reorganização indevida do pacote

### Prancha detectada com LD em outro documento
- condição: a prancha é detectada em um PDF, mas a linha correspondente da LD só aparece em outro documento do pacote
- severidade: atencao
- observação: usada quando a montagem do pacote pode estar distribuída em arquivos diferentes e exige revisão humana

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
- observação: regra desativada no fluxo cotidiano porque nomes de escritório e cliente podem variar entre padrões reais do pacote

### Órgão/cliente
- campo: orgao_cliente
- condição: não gera divergência automática
- observação: variações como razão social, escritório, sigla ou unidade do cliente são tratadas como contexto de leitura, não como problema do pacote
