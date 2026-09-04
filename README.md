# Painel de vendas + DRE Gerencial

Site com duas abas: **Vendas** (painel de vendas mensal) e **DRE Gerencial**
(demonstrativo de resultado, mês a mês, com upload do arquivo do mês para conciliar).

## O que tem na aba DRE Gerencial

- Estrutura igual à da sua planilha original (Receitas, Deduções, Impostos, Custos
  Variáveis, Margem de Contribuição, Custos Fixos, Despesas Operacionais, Material
  para Revenda, Resultado Operacional, Investimentos, Empréstimos, Resultado Líquido
  Operacional, Receitas Financeiras, Retirada de Sócios, Resultado Líquido Financeiro).
- Um seletor de mês (2025 a 2027) e o botão **"Subir XLS do mês"**.
- Antes de salvar, aparece uma tela de conferência: quanto foi reconhecido por linha,
  o que ficou de fora de propósito, e o que não bateu com nada — para você conferir
  antes de confirmar.
- Depois de confirmado, o mês fica salvo (no navegador) e aparece um gráfico comparando
  receita e resultado operacional entre os meses já salvos.

## Sobre o arquivo que você sobe todo mês

O reconhecimento é feito pelo **nome da categoria** (ex: "FOLHA DE PAGAMENTO",
"SIMPLES NACIONAL", "PRO-LABORE"), lendo as colunas `descricao`, `valor` e
`valor_total` do relatório "demonstrativo financeiro" que você exporta do sistema.
Linhas com `valor_total` preenchido são cabeçalhos de grupo (o total dos itens
abaixo) e são ignoradas para não contar em dobro; só os itens de linha (sem
`valor_total`) entram na soma.

Testado com o arquivo real de setembro/2026: **95 de 95 linhas com valor foram
reconhecidas**, e o resultado final bateu exatamente com "Total de Receitas" menos
"Total de Despesas" do arquivo original.

Ficam de fora do DRE de propósito (é movimentação interna de caixa, não é resultado):
"Rotativo/Empréstimo", "Amortização/Rotativo", "Investimentos Financeiros",
"Reserva 13º + IPVA + IPTU", "Reserva do ICMS" — e o bloco de saldos de caixa no
final do arquivo ("SOMATÓRIOS CAIXAS FINANCEIROS").

Alguns itens tiveram que ser decididos por julgamento (o relatório mensal agrupa
coisas que no DRE ficam em linhas separadas) — se quiser mudar algum, é só falar:
- "PLANO DE SAUDE - SÓCIOS" → hoje conta como Despesas Administrativas
- "JUROS E ENCARGOS" → hoje conta como Despesas Financeiras (Bancos)
- Consultoria técnica, EPI, fretes, manutenção de rede, mitigação → hoje somados em
  "Outras Despesas Operacionais"

Se uma categoria nova aparecer num mês futuro (nome que eu nunca vi), ela cai em
"não reconhecidos" na tela de conferência — me diga o nome e eu adiciono ao
mapeamento (`src/dreNameMapping.js`).

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
- `src/dreMapping.js` — estrutura do DRE (linhas, grupos, subtotais)
- `src/dreNameMapping.js` — nome da categoria → linha do DRE (o mapeamento que importa)
- `src/dreParserByName.js` — leitura do demonstrativo financeiro mensal e reconciliação
- `src/storage.js` — armazenamento local (substitui o `window.storage` do Claude)
- `src/theme.js` — cores e fontes compartilhadas entre as duas abas
