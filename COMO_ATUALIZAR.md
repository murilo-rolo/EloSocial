# 🔄 Guia Rápido: Como Atualizar o Sistema (EloSocial)

Sempre que houver código novo no repositório do GitHub (por exemplo, após a Inteligência Artificial ou outro desenvolvedor subir alterações) e você precisar atualizar a sua máquina local para rodar a última versão, siga este guia.

---

## 🛠️ O Método Rápido (Copia e Cola)

Se você tem pressa, apenas abra o **PowerShell** ou Terminal dentro da pasta principal do projeto (`EloSocial-main`), copie o bloco abaixo, cole lá e aperte Enter:

```bash
git pull origin main
cd frontend
npm install
cd ..
docker compose up --build -d
```

---

## 📖 Entendendo o Passo a Passo (O que cada comando faz?)

Caso algum erro ocorra ou você queira entender o processo, aqui está o detalhamento cirúrgico:

### Passo 1: Baixar as Novidades da Nuvem
```bash
git pull origin main
```
* **O que faz?** O Git verifica o repositório na nuvem (`origin`), na linha do tempo principal (`main`), compara com o seu computador e baixa apenas os arquivos modificados.
* **Por que fazer?** Garante que você sincronize sua máquina com a versão mais recente construída.

### Passo 2: Sincronizar Bibliotecas (Node Modules)
```bash
cd frontend
npm install
cd ..
```
* **O que faz?** Entra na pasta do frontend (`cd frontend`) e manda o NPM (gerenciador de pacotes) ler a sua "lista de compras" (`package.json`) para baixar pacotes visuais ou bibliotecas novas que não sobem para o GitHub por serem pesadas demais. O `cd ..` te devolve para a pasta raiz.
* **Por que fazer?** Evita a tela em branco ou mensagens de erro dizendo que pacotes como `react-markdown` ou `lucide-react` não foram encontrados.

### Passo 3: Limpar o Cache do Vite (Apenas em caso de problemas visuais)
*(Comando para PowerShell do Windows)*
```powershell
Remove-Item -Recurse -Force frontend\.vite
```
* **O que faz?** Apaga a pasta `.vite`.
* **Por que fazer?** Às vezes, mesmo baixando código novo, o navegador ou o servidor local insistem em mostrar uma tela velha presa na memória cache. Apagar essa pasta força o sistema a redesenhar a tela inteira do zero na próxima vez que iniciar.

### Passo 4: Recriar o "Cérebro" do Docker
```bash
docker compose up --build -d
```
* **O que faz?** Liga os servidores Frontend e Backend (`docker compose up`), mas a flag mágica `--build` obriga o Docker a destruir a imagem antiga que ele tinha na memória e montar um servidor zero-quilômetro lendo as pastas que você acabou de atualizar no Passo 1. O `-d` solta o terminal para você poder fechar a janela sem derrubar o servidor.
* **Por que fazer?** Fundamental se houverem mudanças no banco de dados (`supabase/migrations`) ou no backend de inteligência artificial em Python. Sem `--build`, o Docker finge que o código novo não existe.
