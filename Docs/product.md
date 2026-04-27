# PRODUCT.md

## Objetivo
Criar um sistema de auditoria documental para verificar consistência entre documentos técnicos.

## Problema
Conferência manual é:
- lenta
- sujeita a erro
- não padronizada

## Solução
Sistema que:
- extrai campos
- compara documentos
- aplica regras
- gera pontos verificáveis com evidência
- prepara contextos para leitura assistida por IA, sem delegar a decisão
- permite modos configuráveis de análise com `full_check` como padrão
- permite informar a identidade esperada do projeto antes da leitura dos PDFs
- oferece checklist pós-análise para a decisão humana sobre cada ponto encontrado
- apresenta achados como triagem técnica (`verificar`, `conferir`, `não confirmado`), sem declarar erro automático para o usuário cotidiano

## Modos de análise
- A interface principal expõe dois fluxos cotidianos:
  - `full_check` como **Volume de projeto**
  - `memorial_only` como **Memorial**
- Os demais modos continuam como capacidades técnicas dirigidas e não precisam aparecer no fluxo principal.
- Nos fluxos cotidianos, o usuário pode preencher centro de custo, endereço, prefeitura/órgão, bairro, município e nome da obra como referência declarada.
- Campos de referência vazios são ignorados; ausência de campo informado não inventa regra.

## Modos técnicos disponíveis
- `full_check`
- `memorial_only`
- `sheets_only`
- `ld_only`
- `find_text`
- `find_replace`
- `check_address`
- `check_project_number`
- `check_work_name`

## Objetivo dos modos
- reutilizar a mesma base técnica para análises completas e verificações dirigidas
- manter o fluxo determinístico
- preservar compatibilidade com o fluxo atual de análise completa

## Usuários
- desenhistas
- engenheiros
- revisores

## Fora de escopo
- IA como decisora
- interpretação subjetiva
- divergência automática de órgão/cliente quando houver apenas variação de padrão textual
- linguagem de erro ou culpa para pontos que ainda dependem de conferência humana
