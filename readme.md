# Copy&Paste

Sistema de auditoria documental para projetos de engenharia civil.

## Objetivo
Verificar consistência entre:
- memorial
- capa
- selo de pranchas
- lista de desenhos (LD)

## Princípios
- baseado em regras determinísticas
- evidência obrigatória
- revisão humana
- sem dependência de IA para decisão

## Stack
- Frontend: Next.js + Tailwind
- Backend: FastAPI
- Worker: Python
- Banco: PostgreSQL
- Fila: Redis

## Estrutura
/docs → documentação do sistema  
/frontend → interface  
/backend → API  
/worker → processamento  

## Status
MVP em desenvolvimento