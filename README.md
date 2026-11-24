# Radar Fiscal — resumo

O CIGA recebe dinheiro todo mês (principalmente das prefeituras consorciadas, pelos serviços que presta) e gasta todo mês (salários, contratos, fornecedores de tecnologia). Hoje esses números ficam registrados no ERP, mas são analisados **depois** que o mês fecha. Quando um problema aparece no relatório, normalmente já sobrou pouco tempo para reagir.

O **Radar Fiscal** acompanha esses números todos os dias, de forma automática, e faz três coisas.

## 1. Mostra a situação atual

Toda madrugada ele lê os dados do ERP, só para leitura, sem poder alterar nada. Depois apresenta em painéis simples quanto entrou, quanto saiu, quanto há em caixa, quanto há a pagar e quanto de cada verba do ano já foi usado.

## 2. Projeta os próximos meses

Com base no comportamento recente, ele estima como devem ficar receita, despesa e caixa. No exemplo do protótipo: a receita vem caindo e a despesa subindo, então o caixa deve ficar abaixo do mínimo de segurança em fevereiro.

Ele mostra três cenários (mais provável, otimista e pessimista) e a margem de erro de cada previsão, para não passar falsa certeza.

## 3. Avisa com antecedência e explica o motivo

Quando um número passa de um limite definido pelo CIGA, o sistema gera um alerta no painel e, se configurado, por e-mail. Cada alerta mostra:

- a regra usada;
- a conta feita;
- o que causou o problema;
- o grau de confiança;
- o que vale conferir.

Qualquer pessoa pode verificar o raciocínio e discordar dele.

## Simulador

O gestor testa hipóteses ("e se a receita cair 10%?", "e se houver reajuste salarial em janeiro?") e vê na hora o efeito no caixa, antes de tomar a decisão.

## Cada área vê o que precisa

| Área | O que vê e faz |
| --- | --- |
| **Dirigente** | O resumo e os alertas mais graves, para saber se há algo a decidir. |
| **Gestor** | Os números detalhados, o simulador, o registro do que foi feito em cada alerta e a lista de quem tem acesso. |
| **Contador** | A conta completa de cada alerta, a situação das verbas, a configuração das regras e dos e-mails e o histórico do sistema. |

## Tudo fica registrado

Leituras de dados, cálculos, alterações de regras e providências tomadas vão para um histórico com data, hora e responsável. Isso garante transparência e permite auditoria.

## Limites importantes

- O sistema roda na nuvem do próprio CIGA, usa o login que o CIGA já tem e não envia dados para fora.
- Os alertas apoiam a decisão; não a tomam sozinhos, não apontam irregularidades e não substituem o contador nem o controle interno.

## Em uma frase

O Radar Fiscal acompanha diariamente as finanças do CIGA e avisa com meses de antecedência quando algo tende a sair do controle, explicando de forma clara o motivo e o que pode ser feito.
