# PDF unico de teste geral

Este arquivo foi feito para ser exportado como um PDF maior e anexado sozinho na interface.

Objetivo:
- validar se o sistema extrai varias ocorrencias de campos no mesmo PDF
- provocar divergencias de `nome_obra`, `numero_projeto` e `bairro`
- verificar se a tela de resultado mostra issues e campos extraidos

Uso recomendado:
1. Exporte este Markdown como PDF com texto nativo.
2. Anexe apenas este PDF na tela inicial.
3. Use o modo `Analise completa`.
4. Informe o tipo como `Tudo` ou `memorial`.

Resultado esperado:
- issue relevante para `nome_obra_divergente`
- issue relevante para `numero_projeto_divergente`
- issue relevante para `bairro_divergente`
- lista de campos extraidos preenchida

Observacao:
- este arquivo mistura muitos cenarios de proposito
- para testar um erro isolado, use `TEST_CASES.md`

---

## Pagina 1 - Memorial correto

Documento: Memorial descritivo
Tipo: memorial

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-25
Bairro: Vila Rica
Endereco da obra: Rua Ariovaldo Machado, 120
Municipio: Criciuma
Cliente: Municipio de Criciuma

Resumo:
Este trecho representa o documento de referencia correto. Os demais blocos abaixo
introduzem divergencias controladas para validar o rules engine.

---

## Pagina 2 - Prancha com numero divergente

Documento: Prancha tecnica
Tipo: prancha

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-26
Bairro: Vila Rica
Endereco da obra: Rua Ariovaldo Machado, 120
Municipio: Criciuma
Cliente: Municipio de Criciuma

Resumo:
Este bloco deve gerar divergencia no numero do projeto quando comparado com a
pagina 1.

---

## Pagina 3 - Prancha com bairro divergente

Documento: Prancha tecnica
Tipo: prancha

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-25
Bairro: Centro
Endereco da obra: Rua Ariovaldo Machado, 120
Municipio: Criciuma
Cliente: Municipio de Criciuma

Resumo:
Este bloco deve gerar divergencia no bairro quando comparado com a pagina 1.

---

## Pagina 4 - Memorial com nome da obra divergente

Documento: Memorial complementar
Tipo: memorial

Nome da obra: Travessia Centro
Numero do projeto: 101-25
Bairro: Vila Rica
Endereco da obra: Rua Ariovaldo Machado, 120
Municipio: Criciuma
Cliente: Municipio de Criciuma

Resumo:
Este bloco deve gerar divergencia no nome da obra quando comparado com a pagina 1.

---

## Pagina 5 - Multiplas divergencias

Documento: Lista de desenhos
Tipo: ld

Nome da obra: Travessia Sao Luiz
Numero do projeto: 999-99
Bairro: Sao Luiz
Endereco da obra: Rua XV de Novembro, 500
Municipio: Criciuma
Cliente: Municipio de Criciuma

Resumo:
Este bloco deve reforcar as divergencias de nome da obra, numero do projeto e bairro.

---

## Pagina 6 - Campo ausente proposital

Documento: Prancha sem bairro
Tipo: prancha

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-25
Endereco da obra: Rua Ariovaldo Machado, 120
Municipio: Criciuma
Cliente: Municipio de Criciuma

Resumo:
Este bloco nao possui `Bairro`. Como outros blocos possuem bairro, pode ajudar a
validar a regra de campo obrigatorio ausente quando ela estiver ativa para este
formato de documento.

