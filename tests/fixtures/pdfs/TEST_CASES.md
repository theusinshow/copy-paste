# Casos de teste para PDFs

Use este arquivo como base para criar PDFs simples, com texto nativo.
Copie cada bloco para um editor, exporte como PDF e anexe os PDFs pela interface.

Recomendacao de nomes:
- `sem_erro_memorial.pdf`
- `sem_erro_prancha.pdf`
- `erro_numero_memorial.pdf`
- `erro_numero_prancha.pdf`
- `erro_bairro_memorial.pdf`
- `erro_bairro_prancha.pdf`
- `erro_nome_memorial.pdf`
- `erro_nome_prancha.pdf`
- `campo_ausente_memorial.pdf`
- `campo_ausente_prancha.pdf`

Evite PDF escaneado ou imagem. O leitor atual usa texto nativo do PDF.

---

## 01 - Sem erro

Objetivo:
- confirmar que campos iguais nao geram issue.

Esperado:
- `0 issues`
- campos extraidos aparecem na tela de resultado

### Arquivo A

```txt
Documento: Memorial descritivo
Tipo: memorial

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-25
Bairro: Vila Rica
Endereco da obra: Rua Ariovaldo Machado, 120
Municipio: Criciuma
Cliente: Municipio de Criciuma
```

### Arquivo B

```txt
Documento: Prancha tecnica
Tipo: prancha

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-25
Bairro: Vila Rica
Endereco da obra: Rua Ariovaldo Machado, 120
Municipio: Criciuma
Cliente: Municipio de Criciuma
```

---

## 02 - Numero do projeto divergente

Objetivo:
- validar `numero_projeto_divergente`.

Esperado:
- issue relevante para numero do projeto

### Arquivo A

```txt
Documento: Memorial descritivo
Tipo: memorial

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-25
Bairro: Vila Rica
Endereco da obra: Rua Ariovaldo Machado, 120
```

### Arquivo B

```txt
Documento: Prancha tecnica
Tipo: prancha

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-26
Bairro: Vila Rica
Endereco da obra: Rua Ariovaldo Machado, 120
```

---

## 03 - Bairro divergente

Objetivo:
- validar `bairro_divergente`.

Esperado:
- issue relevante para bairro

### Arquivo A

```txt
Documento: Memorial descritivo
Tipo: memorial

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-25
Bairro: Vila Rica
Endereco da obra: Rua Ariovaldo Machado, 120
```

### Arquivo B

```txt
Documento: Prancha tecnica
Tipo: prancha

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-25
Bairro: Centro
Endereco da obra: Rua Ariovaldo Machado, 120
```

---

## 04 - Nome da obra divergente

Objetivo:
- validar `nome_obra_divergente`.

Esperado:
- issue relevante para nome da obra

### Arquivo A

```txt
Documento: Memorial descritivo
Tipo: memorial

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-25
Bairro: Vila Rica
Endereco da obra: Rua Ariovaldo Machado, 120
```

### Arquivo B

```txt
Documento: Prancha tecnica
Tipo: prancha

Nome da obra: Travessia Centro
Numero do projeto: 101-25
Bairro: Vila Rica
Endereco da obra: Rua Ariovaldo Machado, 120
```

---

## 05 - Campo ausente em um documento

Objetivo:
- validar `campo_obrigatorio_ausente`.

Esperado:
- issue de atencao para campo obrigatorio ausente
- a issue so deve aparecer porque o campo existe em pelo menos um documento

### Arquivo A

```txt
Documento: Memorial descritivo
Tipo: memorial

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-25
Bairro: Vila Rica
Endereco da obra: Rua Ariovaldo Machado, 120
```

### Arquivo B

```txt
Documento: Prancha tecnica
Tipo: prancha

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-25
Endereco da obra: Rua Ariovaldo Machado, 120
```

---

## 06 - Multiplas divergencias

Objetivo:
- validar mais de uma issue na mesma analise.

Esperado:
- issue relevante para numero do projeto
- issue relevante para bairro
- issue relevante para nome da obra

### Arquivo A

```txt
Documento: Memorial descritivo
Tipo: memorial

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-25
Bairro: Vila Rica
Endereco da obra: Rua Ariovaldo Machado, 120
```

### Arquivo B

```txt
Documento: Prancha tecnica
Tipo: prancha

Nome da obra: Travessia Centro
Numero do projeto: 101-26
Bairro: Centro
Endereco da obra: Rua Ariovaldo Machado, 120
```

---

## 07 - Verificacao pontual de endereco

Objetivo:
- validar o modo `check_address`.

Como rodar:
- selecione o modo `Checar endereco`
- informe o valor esperado: `Rua Ariovaldo Machado, 120`

Esperado:
- `0 issues` quando o endereco bate

### Arquivo

```txt
Documento: Memorial descritivo
Tipo: memorial

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-25
Bairro: Vila Rica
Endereco da obra: Rua Ariovaldo Machado, 120
```

---

## 08 - Verificacao pontual de endereco divergente

Objetivo:
- validar issue do modo `check_address`.

Como rodar:
- selecione o modo `Checar endereco`
- informe o valor esperado: `Rua Ariovaldo Machado, 120`

Esperado:
- issue relevante para endereco diferente do esperado

### Arquivo

```txt
Documento: Memorial descritivo
Tipo: memorial

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-25
Bairro: Vila Rica
Endereco da obra: Rua XV de Novembro, 500
```

---

## 09 - Verificacao pontual de numero do projeto

Objetivo:
- validar o modo `check_project_number`.

Como rodar:
- selecione o modo `Checar numero do projeto`
- informe o valor esperado: `101-25`

Esperado:
- issue relevante se o PDF tiver outro numero

### Arquivo

```txt
Documento: Memorial descritivo
Tipo: memorial

Nome da obra: Travessia Vila Rica
Numero do projeto: 101-26
Bairro: Vila Rica
Endereco da obra: Rua Ariovaldo Machado, 120
```

---

## 10 - Verificacao pontual de nome da obra

Objetivo:
- validar o modo `check_work_name`.

Como rodar:
- selecione o modo `Checar nome da obra`
- informe o valor esperado: `Travessia Vila Rica`

Esperado:
- issue relevante se o PDF tiver outro nome de obra

### Arquivo

```txt
Documento: Memorial descritivo
Tipo: memorial

Nome da obra: Travessia Centro
Numero do projeto: 101-25
Bairro: Vila Rica
Endereco da obra: Rua Ariovaldo Machado, 120
```

