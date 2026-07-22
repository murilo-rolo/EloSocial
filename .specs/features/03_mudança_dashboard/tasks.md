# Tasks: Mudança da Página de Entrada

## Visão Geral

3 tarefas atômicas, sequenciais (cada uma pode ser commitada independentemente).

---

## Task 1: Criar componente Welcome.jsx

**Arquivo**: `frontend/src/pages/Welcome.jsx` (novo)
**Requisito**: REQ-01
**Complexidade**: Small

### Passos
1. Criar `Welcome.jsx` com:
   - Import de `useAuth` e `Layout`
   - Renderiza `<Layout title="Início">` com `<h1>` contendo "Bem vindo, " + `<em>{profile?.nome}</em>` + "!"
   - Estilo: `page-title font-serif` (padrão do projeto)

### Verificação
- [ ] Componente renderiza sem erros
- [ ] Nome do usuário aparece em itálico
- [ ] Layout (sidebar + topbar) é exibido corretamente

### Critério de Aceite
```jsx
<Layout title="Início">
  <h1 className="page-title font-serif">
    Bem vindo, <em>{profile?.nome}</em>!
  </h1>
</Layout>
```

---

## Task 2: Atualizar rotas em App.jsx

**Arquivo**: `frontend/src/App.jsx`
**Requisito**: REQ-02
**Complexidade**: Small

### Passos
1. Importar `Welcome` de `./pages/Welcome`
2. Trocar a rota `/` de `<Dashboard />` para `<Welcome />`
3. Adicionar nova rota `/dashboard` → `<Dashboard />`

### Verificação
- [x] Rota `/` renderiza Welcome
- [x] Rota `/dashboard` renderiza Dashboard
- [x] Rota `/login` redireciona para `/` (Welcome) quando logado

### Critério de Aceite
```jsx
<Route path="/" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
<Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
```

---

## Task 3: Atualizar link "Dashboard" na sidebar do profissional

**Arquivo**: `frontend/src/components/Layout/Sidebar.jsx`
**Requisito**: REQ-03
**Complexidade**: Small

### Passos
1. Na array `links` para não-requerentes (linha 19), trocar `to: '/'` para `to: '/dashboard'`

### Verificação
- [x] Sidebar profissional: link "Dashboard" aponta para `/dashboard`
- [x] Sidebar requerente: link "Dashboard" continua apontando para `/acompanhamento`

### Critério de Aceite
```javascript
{ to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, end: true },
```

---

## Ordem de Execução

```
Task 1 → Task 2 → Task 3
  │         │         │
  └─────────┴─────────┘
  Cada task é um commit atômico
```

## Validação Final

Após todas as tarefas:
1. `npm run build` sem erros
2. Login como profissional → vê Welcome em `/`, sidebar "Dashboard" vai para `/dashboard`
3. Login como requerente → vê Welcome em `/`, sidebar inalterada
4. Acessar `/dashboard` diretamente → mostra analytics
