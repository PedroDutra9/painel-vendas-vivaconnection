# Painel de vendas

Dashboard de vendas e receita mensal, pronto para publicar no Vercel.

## O que é

Mesmo painel do artifact do Claude, agora como um site normal:
- Vendas e receita (MRR) por mês, com gráficos
- Tabela vendedora × mês (vendas e receita)
- Filtros por vendedora e status do serviço
- Botão para importar um novo relatório .xlsx exportado do sistema — os dados ficam
  salvos no navegador (localStorage) e continuam lá da próxima vez que você abrir o site
  *nesse mesmo navegador*

**Importante sobre os dados:** como não há um banco de dados por trás, os dados ficam
só no navegador de quem está usando. Se você abrir o site em outro computador ou
navegador, vai ver apenas a base inicial (a planilha que você já tinha carregado),
sem as atualizações feitas em outro lugar. Se no futuro você quiser que todo mundo
da equipe veja os mesmos dados atualizados, dá para trocar `src/storage.js` por um
banco de verdade (Vercel KV, Supabase, etc.) — me avise se quiser ajuda com isso.

## Publicar no Vercel

### Opção 1 — pelo site do Vercel (mais fácil)

1. Crie uma conta em [vercel.com](https://vercel.com) (dá para entrar com GitHub, GitLab ou e-mail).
2. Suba esta pasta para um repositório no GitHub:
   ```bash
   cd painel-vendas
   git init
   git add .
   git commit -m "primeiro commit"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/painel-vendas.git
   git push -u origin main
   ```
3. No Vercel, clique em **New Project**, escolha o repositório `painel-vendas`.
4. O Vercel detecta sozinho que é um projeto Vite — deixe as configurações padrão
   (Build Command: `npm run build`, Output Directory: `dist`) e clique em **Deploy**.
5. Em ~1 minuto o site está no ar, com uma URL tipo `painel-vendas.vercel.app`.

### Opção 2 — pela linha de comando (sem GitHub)

Com [Node.js](https://nodejs.org) instalado no seu computador:

```bash
cd painel-vendas
npm install -g vercel
vercel
```

Siga as perguntas (login, nome do projeto) e ele publica direto, sem precisar de
GitHub.

## Rodar localmente antes de publicar (opcional)

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Estrutura

- `src/App.jsx` — o painel (dados da planilha já embutidos)
- `src/storage.js` — armazenamento local (substitui o `window.storage` do Claude)
- `src/main.jsx` — ponto de entrada
