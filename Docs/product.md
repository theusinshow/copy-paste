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
- gera incongruências com evidência
- permite modos configuráveis de análise com `full_check` como padrão

## Modos de análise
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
