# Painel de vendas + DRE Gerencial

Site com duas abas: **Vendas** (painel de vendas mensal) e **DRE Gerencial**
(demonstrativo de resultado, mês a mês, com upload do arquivo do mês para conciliar).

Os dados agora ficam salvos num banco de verdade (não mais no navegador), então
funcionam em qualquer aparelho/navegador e não somem se o Safari do iPhone limpar
o armazenamento local.

## ⚠️ Passo obrigatório: conectar um banco de dados

Antes de usar em produção, você precisa conectar um banco Redis gratuito ao projeto
no Vercel (leva 2 minutos):

1. No painel do Vercel, abra o projeto e vá na aba **Storage**.
2. Clique em **Create Database** (ou **Connect Store**).
3. Escolha **Upstash** (procure por "Upstash" na lista de parceiros — tem plano
   gratuito). Não escolha "Redis Cloud" ou outros que não sejam Upstash, porque o
   código usa a API REST da Upstash especificamente.
4. Crie o banco (nome padrão serve) e clique em **Connect** para ligar ao projeto
   `painel-vendas-vivaconnection`.
5. O Vercel injeta as variáveis de ambiente automaticamente — não precisa copiar
   nada manualmente. Vá em **Deployments** e clique em **Redeploy** no último
   deploy para a variável passar a valer.

Se você esquecer esse passo, o site mostra uma faixa vermelha no topo avisando que
o banco não está conectado, em vez de falhar silenciosamente.

## O que tem na aba DRE Gerencial

- Estrutura igual à da sua planilha original (Receitas, Deduções, Impostos, Custos
  Variáveis, Margem de Contribuição, Custos Fixos, Despesas Operacionais, Material
  para Revenda, Resultado Operacional, Investimentos, Empréstimos, Resultado Líquido
  Operacional, Receitas Financeiras, Retirada de Sócios, Resultado Líquido Financeiro).
- Um seletor de mês (2025 a 2027) e o botão **"Subir XLS do mês"**.
- Antes de salvar, aparece uma tela de conferência: quanto foi reconhecido por linha,
  o que ficou de fora de propósito, e o que não bateu com nada.
- Depois de confirmado, o mês fica salvo e aparece um gráfico comparando receita e
  resultado operacional entre os meses já salvos.

## Sobre o arquivo que você sobe todo mês

O reconhecimento é feito pelo **nome da categoria** (ex: "FOLHA DE PAGAMENTO",
"SIMPLES NACIONAL", "PRO-LABORE"), lendo as colunas `descricao`, `valor` e
`valor_total` do relatório "demonstrativo financeiro" que você exporta do sistema.
Linhas com `valor_total` preenchido são cabeçalhos de grupo (o total dos itens
abaixo) e são ignoradas para não contar em dobro.

Testado com o arquivo real de setembro/2026: **95 de 95 linhas com valor foram
reconhecidas**, e o resultado final bateu exatamente com "Total de Receitas" menos
"Total de Despesas" do arquivo original.

Ficam de fora do DRE de propósito (é movimentação interna de caixa, não é resultado):
"Rotativo/Empréstimo", "Amortização/Rotativo", "Investimentos Financeiros",
"Reserva 13º + IPVA + IPTU", "Reserva do ICMS" — e o bloco de saldos de caixa no
final do arquivo.

Alguns itens foram decididos por julgamento (o relatório mensal agrupa coisas que
no DRE ficam em linhas separadas) — se quiser mudar algum, é só falar:
- "PLANO DE SAUDE - SÓCIOS" → hoje conta como Despesas Administrativas
- "JUROS E ENCARGOS" → hoje conta como Despesas Financeiras (Bancos)
- Consultoria técnica, EPI, fretes, manutenção de rede, mitigação → somados em
  "Outras Despesas Operacionais"

Se uma categoria nova aparecer num mês futuro, ela cai em "não reconhecidos" na
tela de conferência — me diga o nome e eu adiciono ao mapeamento
(`src/dreNameMapping.js`).

## Publicar as mudanças no Vercel

```bash
cd painel-vendas-vivaconnection
git add .
git commit -m "adiciona banco de dados real para o DRE e vendas"
git push
```

O Vercel publica sozinho em cerca de 1 minuto — mas lembre de conectar o banco
(passo acima) antes ou depois do primeiro deploy dessa versão.

## Rodar localmente (opcional)

```bash
npm install
npm run dev
```

O `/api/storage` só funciona quando publicado no Vercel (ou rodando `vercel dev`
com o CLI da Vercel) — no `npm run dev` comum ele não vai responder, o que é
esperado.

## Estrutura

- `src/App.jsx` — abas (Vendas / DRE Gerencial) + aviso se o banco não estiver conectado
- `src/SalesDashboard.jsx` — painel de vendas
- `src/DreGerencial.jsx` — painel do DRE
- `src/dreMapping.js` — estrutura do DRE (linhas, grupos, subtotais)
- `src/dreNameMapping.js` — nome da categoria → linha do DRE
- `src/dreParserByName.js` — leitura do demonstrativo financeiro mensal
- `src/storage.js` — cliente que fala com `/api/storage`
- `api/storage.js` — função serverless que lê/grava no banco (Upstash Redis)
- `src/theme.js` — cores e fontes compartilhadas
