# Painel de vendas + DRE Gerencial

Site com duas abas: **Vendas** (painel de vendas mensal) e **DRE Gerencial**
(demonstrativo de resultado, mês a mês, com upload do XLS do mês para conciliar).

## O que tem na aba DRE Gerencial

- Estrutura igual à da sua planilha original (Receitas, Deduções, Impostos, Custos
  Variáveis, Margem de Contribuição, Custos Fixos, Despesas Operacionais, Material
  para Revenda, Resultado Operacional, Investimentos, Empréstimos, Resultado Líquido
  Operacional, Receitas Financeiras, Retirada de Sócios, Resultado Líquido Financeiro).
- Um seletor de mês (2025 a 2027) e o botão **"Subir XLS do mês"**.
- Ao subir um arquivo, o site procura por códigos de conta (tipo `01.01`, `04.02.06.02`)
  em qualquer célula, pega o valor na mesma linha, e soma tudo pela linha certa do DRE
  — isso funciona **mesmo que o layout do arquivo mude de mês para mês**, desde que os
  códigos do plano de contas apareçam em algum lugar da planilha.
- Antes de salvar, aparece uma tela de conferência: quanto foi reconhecido por linha, e
  quais códigos não bateram com nada (para você conferir antes de confirmar).
- Depois de confirmado, o mês fica salvo (no navegador) e aparece um gráfico comparando
  receita e resultado operacional entre os meses já salvos.

**Sobre o arquivo a subir:** o mapeamento foi construído a partir das fórmulas da sua
própria planilha (DRE Gerencial 0126 a 1226 → Plano de Contas). Ele espera um arquivo
com os valores **de um mês só** — se você subir uma planilha com vários meses lado a
lado (como a "Plano de Contas - MATRIZ 2026" original, com uma coluna por mês), o
programa vai pegar o maior valor de cada linha, não necessariamente o do mês certo.
Um extrato mensal (uma coluna de valor só) funciona melhor.

Duas linhas do DRE original não tinham conta vinculada na sua planilha (ficavam sempre
zeradas): "Devoluções e Abatimentos da Receita" e "Material para Revenda" e "Receitas
Financeiras". Elas aparecem no site do mesmo jeito, zeradas, até que você me diga a
qual conta do plano de contas cada uma deveria se ligar.

## Publicar as mudanças no Vercel

Como o projeto já está conectado ao GitHub e ao Vercel, é só substituir os arquivos e
mandar de novo:

```bash
cd painel-vendas-vivaconnection
git add .
git commit -m "adiciona aba DRE Gerencial"
git push
```

O Vercel detecta o push e publica sozinho em cerca de 1 minuto.

## Rodar localmente antes de publicar (opcional)

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Estrutura

- `src/App.jsx` — abas (Vendas / DRE Gerencial)
- `src/SalesDashboard.jsx` — painel de vendas (igual antes)
- `src/DreGerencial.jsx` — painel do DRE
- `src/dreMapping.js` — tabela de códigos de conta → linha do DRE
- `src/dreParser.js` — leitura do XLS enviado e reconciliação
- `src/storage.js` — armazenamento local (substitui o `window.storage` do Claude)
- `src/theme.js` — cores e fontes compartilhadas entre as duas abas
