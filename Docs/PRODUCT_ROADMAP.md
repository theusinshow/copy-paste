# PRODUCT_ROADMAP.md

## Visao do produto

Construir uma plataforma de auditoria documental tecnica para pacotes de projeto.

O sistema deve receber um conjunto de PDFs e responder:

- Que projeto e esse?
- Quais documentos fazem parte do pacote?
- A identidade do projeto esta consistente?
- A LD bate com as pranchas?
- Ha sinais de reaproveitamento?
- Ha textos, endereco ou numero para corrigir?
- O memorial tem problemas ortograficos ou termos suspeitos?
- Qual e o status final da entrega?
- Onde esta a evidencia de cada problema?

## Principio central

O sistema nao deve decidir por intuicao.

Toda incongruencia precisa apontar:

- arquivo
- pagina
- campo
- valor encontrado
- valor esperado ou valor comparado
- tipo de problema
- severidade

A IA pode entrar como camada auxiliar de leitura, classificacao e explicacao,
mas nao como decisora sem evidencia.

## Fase 1 - Produto minimo forte

Objetivo:
transformar o sistema de comparador simples de campos em auditor de pacote.

Entregas:

- upload de varios PDFs
- classificacao basica de documentos
- extracao de capa ou folha de rosto
- extracao de identidade principal
- extracao de LDs internas
- extracao de campos de selo ou prancha
- comparacao de identidade
- tela de evidencias

Campos principais:

- nome_obra
- numero_projeto
- bairro
- municipio
- orgao_cliente
- volume
- tomo
- disciplina
- data_emissao
- codigo_arquivo
- titulo_prancha
- numero_folha
- revisao

Regras iniciais:

- nome da obra divergente
- numero do projeto divergente
- bairro divergente
- municipio divergente
- orgao ou cliente divergente
- volume ou tomo incompativel com arquivo
- arquivo duplicado assinado e nao assinado
- codigo estranho no caminho ou texto, como `118_25` dentro de projeto `117_25`
- LD lista prancha que nao aparece
- prancha aparece mas nao esta na LD
- folha fora da sequencia esperada

Visualizacoes:

- resumo do pacote
- identidade detectada
- documentos analisados
- issues por severidade
- campos extraidos por arquivo
- lista de documentos extraida
- comparativo LD x pranchas

## Fase 2 - Motor de pacote

Objetivo:
fazer o sistema entender estrutura de volume, pasta e disciplina.

Conceitos a modelar:

- ProjectPackage
- PackageDocument
- DocumentSection
- ProjectIdentity
- DrawingList
- DrawingListItem
- SheetStamp
- AuditFinding

Classificacao de arquivos:

- memorial
- volume_topografia
- volume_urbanismo
- volume_arquitetura
- volume_estrutura
- volume_eletrica
- volume_hidrossanitario
- volume_climatizacao
- prancha
- lista_documentos
- desconhecido

Heuristicas:

- nome da pasta
- nome do arquivo
- primeira pagina
- presenca de `LISTA DE DOCUMENTOS`
- presenca de `VOLUME`
- presenca de `TOMO`
- padroes como `117_25_xxx_001_a`

## Fase 3 - LD x pranchas

Objetivo:
criar o recurso principal de auditoria entre lista de documentos e pranchas.

Extrair das LDs:

- disciplina
- folha, como `01/07`
- codigo, como `117_25_urb_001_a`
- descricao
- arquivo_origem
- pagina

Extrair das pranchas ou folhas:

- codigo de prancha
- numero da folha
- titulo
- disciplina
- revisao
- data

Regras:

- LD cita codigo inexistente no pacote
- pacote tem prancha nao citada na LD
- descricao da LD diferente do titulo da prancha
- folha ausente, como `03/07`
- folha repetida
- codigo com numero de projeto diferente
- revisao inconsistente
- tomo contem folha que deveria estar em outro tomo

## Fase 4 - Localizador e corretor dirigido

Objetivo:
resolver tarefas praticas do dia a dia.

Funcionalidades:

- localizar endereco
- localizar numero do projeto
- localizar nome da obra
- localizar bairro
- localizar qualquer texto
- mostrar todos os lugares onde aparece
- permitir marcar como precisa alterar
- gerar lista de correcoes

Exemplo:

```txt
Buscar: Rua XV de Novembro
Substituir por: Rua Ariovaldo Machado
```

Resultado esperado:

- arquivo X, pagina 1, capa
- arquivo Y, pagina 3, LD
- arquivo Z, pagina 9, selo

Correcao ortografica dos memoriais:

- extrair texto do memorial
- rodar corretor ortografico
- ignorar termos tecnicos cadastrados
- separar erro ortografico de termo tecnico
- mostrar contexto

Dicionarios customizados:

- concreto
- hidrossanitario
- CFTV
- SPDA
- prancha
- terraplenagem
- Criciuma
- Vila Manaus
- Prosul

## Fase 5 - Camada IA assistida

Objetivo:
ganhar adaptacao a padroes diferentes sem perder rastreabilidade.

Usos adequados da IA:

- classificar paginas dificeis
- sugerir campos quando o layout muda
- resumir problemas encontrados
- explicar impacto do problema
- detectar possivel reaproveitamento nao mapeado
- gerar relatorio narrativo
- auxiliar correcao de texto do memorial

Regras de seguranca:

- IA nao cria issue sozinha sem evidencia
- IA sempre aponta trecho usado
- IA pode sugerir `ponto de atencao candidato`
- usuario ou regra confirma
- tudo fica auditavel

Fluxo ideal:

```txt
PDF -> extracao local -> regras -> findings
findings + trechos -> IA resume e explica
```

## Fase 6 - Relatorios e venda interna

Objetivo:
mostrar valor para lideranca e viabilizar piloto interno.

Relatorios:

- relatorio executivo
- relatorio tecnico completo
- checklist de entrega
- mapa LD x pranchas
- lista de correcoes
- resumo por disciplina
- historico de analises

Status final:

- sem incongruencia relevante
- com pontos de atencao
- com incongruencia relevante
- analise incompleta por falta de evidencia

Metricas para demonstracao:

- documentos analisados
- paginas lidas
- campos extraidos
- inconsistencias encontradas
- tempo estimado economizado

## Cronograma sugerido

### Semana 1

- mapear pacote real
- criar extracao de identidade por capa
- criar classificacao de documento
- mostrar dashboard do pacote

### Semana 2

- extrair LDs internas
- modelar DrawingList e DrawingListItem
- mostrar LD na tela

### Semana 3

- extrair selos e pranchas
- comparar LD x pranchas
- gerar primeiras issues fortes

### Semana 4

- melhorar visualizacoes
- criar status final
- criar relatorio simples

### Semana 5

- localizador de texto e endereco
- lista de correcoes
- modo find/replace visual

### Semana 6

- ortografia em memorial
- dicionario tecnico
- pontos de atencao textuais

### Semana 7+

- camada IA assistida
- relatorio narrativo
- piloto interno com projetos reais

## Colaboracao

O usuario fornece:

- pacotes reais
- exemplos de erro
- padroes da empresa
- fluxo atual de revisao
- problemas mais frequentes
- prints ou exemplos do resultado esperado

Codex ajuda com:

- modelagem
- implementacao
- extracao
- regras
- telas
- validacao
- documentacao
- changelog
- roteiro de demonstracao

## Proximo passo recomendado

Comecar pela auditoria de pacote:

- detectar identidade principal do conjunto
- classificar cada PDF por volume, disciplina e tomo
- extrair LDs internas
- exibir tela `Resumo do pacote`

Esse passo transforma o sistema de `analisa PDF` para `entende uma entrega de projeto`.

