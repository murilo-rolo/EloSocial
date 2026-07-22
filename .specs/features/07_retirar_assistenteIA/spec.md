# Plano: Remoção do EloBot Global

## Objetivo

Remover completamente o EloBot Global (assistente IA gerencial) do sistema EloSocial. O Copiloto SUAS permanece intacto.

---

## Análise de Impacto

### Arquivos afetados: 10

| Arquivo | Ação | Descrição |
|---|---|---|
| `frontend/src/components/GlobalChat.jsx` | **DELETAR** | Componente inteiro do EloBot Global |
| `frontend/src/components/Layout/Layout.jsx` | **EDITAR** | Remover import e render de `<GlobalChat />` |
| `frontend/src/index.css` | **EDITAR** | Remover regras CSS `.global-chat-position` |
| `backend/app/api/search_global.py` | **DELETAR** | Endpoint inteiro `POST /api/search-global` |
| `backend/app/main.py` | **EDITAR** | Remover import e registro do router |
| `.opencode/skills/elosocial/SKILL.md` | **EDITAR** | Remover linha da tabela "Busca Global" |
| `.opencode/skills/elosocial/ROTAS.md` | **EDITAR** | Remover linha da tabela de rotas |
| `.opencode/skills/elosocial/BACKLOG.md` | **EDITAR** | Remover item "EloBot — busca global com IA" |
| `.opencode/skills/elosocial/ESTRUTURA.md` | **EDITAR** | Remover referências a `search_global.py` e `GlobalChat.jsx` |
| `docs/migracao-telemedicina/00-VISAO-GERAL.md` | **EDITAR** | Remover "+ GlobalChat" da descrição do Layout |

---

## Tarefas (5 tarefas)

### Tarefa 1: Deletar arquivos do EloBot

**Arquivos:**
- `frontend/src/components/GlobalChat.jsx` — deletar
- `backend/app/api/search_global.py` — deletar

**Critério de verificação:** Arquivos não existem mais.

---

### Tarefa 2: Limpar frontend (Layout + CSS)

**Arquivo:** `frontend/src/components/Layout/Layout.jsx`
- Remover linha 5: `import GlobalChat from '../GlobalChat'`
- Remover linha 25: `<GlobalChat />`

**Arquivo:** `frontend/src/index.css`
- Remover linhas 753-760: regras `.global-chat-position` (bloco base + media query)

**Critério de verificação:**
- `Layout.jsx` não referencia mais `GlobalChat`
- `index.css` não contém `.global-chat-position`
- App compila sem erros: `cd frontend && npm run build`

---

### Tarefa 3: Limpar backend (main.py)

**Arquivo:** `backend/app/main.py`
- Remover linha 20: `from app.api.search_global import router as search_global_router`
- Remover linha 29: `app.include_router(search_global_router, prefix="/api", tags=["ai_global"])`

**Critério de verificação:**
- `main.py` não importa nem registra `search_global`
- Backend inicia sem erros: `cd backend && python -c "from app.main import app; print('OK')"`

---

### Tarefa 4: Atualizar documentação do skill

**Arquivo:** `.opencode/skills/elosocial/SKILL.md`
- Remover linha 81: `| Busca Global | POST /api/search-global | EloBot: assistente IA gerencial |`

**Arquivo:** `.opencode/skills/elosocial/ROTAS.md`
- Remover linha 52: `| POST | /api/search-global | EloBot: assistente IA gerencial (busca global) |`

**Arquivo:** `.opencode/skills/elosocial/BACKLOG.md`
- Remover linha 18: `- Backend: EloBot — busca global com IA`

**Arquivo:** `.opencode/skills/elosocial/ESTRUTURA.md`
- Remover linha 60: `│   │   │   ├── search_global.py   ← POST /api/search-global (EloBot)`
- Remover linha 88: `│   │   ├── GlobalChat.jsx     ← Chat global`

**Arquivo:** `docs/migracao-telemedicina/00-VISAO-GERAL.md`
- Editar linha 30: remover "+ GlobalChat" → `Sidebar + Topbar`

**Critério de verificação:**
- Nenhuma referência a "EloBot", "GlobalChat", ou "search-global" nas documentações

---

### Tarefa 5: Verificação final global

**Ações:**
- Busca global no código por "EloBot", "GlobalChat", "search-global", "search_global", "ai_global"
- Confirmar que nenhum arquivo Python ou JSX referencia o feature removido
- Confirmar que o Copiloto SUAS (ChatLLM, ChatIA, ai.py) está intacto

**Critério de verificação:**
- `grep -r "EloBot\|GlobalChat\|search-global\|search_global\|ai_global" frontend/ backend/ --include="*.jsx" --include="*.js" --include="*.py" --include="*.css"` retorna vazio (exceto possíveis comments irrelevantes)

---

## Riscos

| Risco | Mitigação |
|---|---|
| CSS removido afeta outro componente | `.global-chat-position` é exclusivo do GlobalChat — sem conflito |
| Router removido causa erro de import | Tarefa 3 remove tanto import quanto registro |
| Documentação fica desatualizada | Tarefa 4 atualiza todas as 5 referências |

---

## Ordem de Execução

```
Tarefa 1 (deletar arquivos)
    ↓
Tarefa 2 (limpar frontend)  ←  depende da Tarefa 1
    ↓
Tarefa 3 (limpar backend)   ←  depende da Tarefa 1
    ↓
Tarefa 4 (atualizar docs)   ←  independente, mas melhor após código limpo
    ↓
Tarefa 5 (verificação final) ←  depende de todas anteriores
```

Tarefas 2 e 3 podem rodar em paralelo após a Tarefa 1.
