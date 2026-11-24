// Dados sintéticos e regras do protótipo Radar Fiscal. Valores em R$ mil.
window.RF = (() => {
  const MH = ['nov/25','dez/25','jan/26','fev/26','mar/26','abr/26','mai/26','jun/26','jul/26','ago/26','set/26','out/26'];
  const MF = ['nov/26','dez/26','jan/27','fev/27','mar/27','abr/27'];
  const prev = [3250,3400,3350,3300,3300,3350,3350,3400,3400,3450,3450,3450];
  const real = [3230,3390,3290,3220,3180,3240,3200,3210,3190,3170,3150,3110];
  const desp = [3050,4150,3080,3120,3150,3180,3200,3230,3260,3290,3310,3330];
  const pes  = [1500,2500,1520,1520,1530,1530,1540,1540,1560,1560,1570,1580];
  const rp   = [620,640,600,610,640,600,615,640,690,740,790,850]; // obrigações a pagar
  const cash = []; { let c = 7800; for (let i = 0; i < 12; i++) { c += real[i] - desp[i]; cash.push(c); } }
  const sum = a => a.reduce((x, y) => x + y, 0);
  const fontes = [
    { n: 'Contratos de rateio', prev: 16200, real: 16150 },
    { n: 'Contratos de programa e serviços', prev: 23050, real: 21180 },
    { n: 'Rendimentos de aplicações', prev: 1200, real: 1250 }];
  const MESES_DECORRIDOS = 10; // jan a out/2026
  const naturezas = [
    { n: 'Pessoal e encargos', dot: 19800, emp: 15900, extraDez: 1000 },
    { n: 'Serviços de TI de terceiros', dot: 6000, emp: 5600, extraDez: 0 },
    { n: 'Locação e manutenção', dot: 1200, emp: 1010, extraDez: 0 },
    { n: 'Diárias e passagens', dot: 300, emp: 280, extraDez: 0 },
    { n: 'Material de consumo', dot: 400, emp: 230, extraDez: 0 },
    { n: 'Equipamentos (investimento)', dot: 2500, emp: 640, extraDez: 0 }];
  const concentracao = 0.61; // 3 maiores fornecedores sobre pagamentos de serviços (12 meses)

  // tendência linear da receita nos últimos 6 meses
  const ys = real.slice(6), my = sum(ys) / 6;
  const slope = sum(ys.map((y, x) => (x - 2.5) * (y - my))) / sum([0,1,2,3,4,5].map(x => (x - 2.5) ** 2));
  const icp = my - slope * 2.5;
  const sd = Math.max(Math.sqrt(sum(ys.map((y, x) => (y - (icp + slope * x)) ** 2)) / 4), 0.02 * my);
  const dGrow = (desp[11] - desp[6]) / 5;
  const despMed = sum(desp.slice(6)) / 6;

  const SCEN = {
    provavel:  { nome: 'Provável',  rec: 0,     desp: 0,     pes: 0,    cor: 'var(--s1)' },
    favoravel: { nome: 'Otimista', rec: 0.03,  desp: -0.02, pes: 0,    cor: 'var(--s3)' },
    adverso:   { nome: 'Pessimista',   rec: -0.08, desp: 0,     pes: 0.05, cor: 'var(--s2)' }};

  function project(p) {
    const rows = []; let c = cash[11];
    for (let h = 1; h <= 6; h++) {
      const rec = (icp + slope * (5 + h)) * (1 + p.rec);
      const pesAdj = h >= 3 ? (1580 + 10 * h) * p.pes : 0;
      const d = (desp[11] + dGrow * h + (h === 2 ? 1000 : 0)) * (1 + p.desp) + pesAdj;
      c += rec - d; const band = 1.28 * sd * Math.sqrt(h) * 1.4;
      rows.push({ m: MF[h - 1], rec, d, c, lo: c - band, hi: c + band });
    }
    return rows;
  }

  const RULES = [
    { id: 'R1', nome: 'Pouco dinheiro em caixa', param: 'Mínimo de segurança: quantos meses de gastos guardar', val: 1.5, unit: 'meses', sev: 'crit', canais: ['painel','email'], resp: 'Gerência financeira', per: 'Imediato', on: true },
    { id: 'R2', nome: 'Entrando menos dinheiro que o planejado', param: 'Quanto do previsto precisa entrar, no mínimo (últimos 3 meses)', val: 95, unit: '%', sev: 'serious', canais: ['painel','email'], resp: 'Gerência financeira', per: 'Diário', on: true },
    { id: 'R3', nome: 'Verba acabando antes do fim do ano', param: 'Avisar quando a verba reservada não der até dezembro', val: 0, unit: 'mil reais de sobra', sev: 'serious', canais: ['painel','email'], resp: 'Contabilidade', per: 'Semanal', on: true },
    { id: 'R4', nome: 'Contas a pagar crescendo', param: 'Quantos meses seguidos subindo', val: 3, unit: 'meses', sev: 'warn', canais: ['painel'], resp: 'Tesouraria', per: 'Semanal', on: true },
    { id: 'R5', nome: 'Gasto subindo e entrada caindo', param: 'Em quantos dos últimos 6 meses isso aconteceu', val: 5, unit: 'meses', sev: 'serious', canais: ['painel','email'], resp: 'Diretoria', per: 'Semanal', on: true },
    { id: 'R6', nome: 'Pagamentos em poucos fornecedores', param: 'Quanto os 3 maiores fornecedores podem receber, no máximo', val: 50, unit: '%', sev: 'warn', canais: ['painel'], resp: 'Controle interno', per: 'Mensal', on: true },
    { id: 'R7', nome: 'Salários pesando demais', param: 'Quanto do dinheiro que entra pode ir para salários', val: 50, unit: '%', sev: 'warn', canais: ['painel'], resp: 'Diretoria', per: 'Mensal', on: true }];

  const USERS = [
    { nome: 'Marina Albuquerque', email: 'marina.albuquerque@exemplo.gov.br', setor: 'Diretoria executiva', grupo: 'GRP-RADAR-DIRIGENTE', perfil: 'Dirigente', status: 'Com acesso', desde: '05/10/2026', ultimo: 'hoje, 08:12', rev: '05/10/2026' },
    { nome: 'Paulo Henrique Lemos', email: 'paulo.lemos@exemplo.gov.br', setor: 'Diretoria administrativa', grupo: 'GRP-RADAR-DIRIGENTE', perfil: 'Dirigente', status: 'Com acesso', desde: '05/10/2026', ultimo: 'ontem, 17:40', rev: '05/10/2026' },
    { nome: 'Renata Coelho', email: 'renata.coelho@exemplo.gov.br', setor: 'Gerência financeira', grupo: 'GRP-RADAR-GESTOR', perfil: 'Gestor', status: 'Com acesso', desde: '05/10/2026', ultimo: 'hoje, 09:01', rev: '05/10/2026' },
    { nome: 'Igor Fontana', email: 'igor.fontana@exemplo.gov.br', setor: 'Tesouraria', grupo: 'GRP-RADAR-GESTOR', perfil: 'Gestor', status: 'Com acesso', desde: '06/10/2026', ultimo: 'hoje, 07:55', rev: '06/10/2026' },
    { nome: 'Luciana Prates', email: 'luciana.prates@exemplo.gov.br', setor: 'Contabilidade', grupo: 'GRP-RADAR-CONTADOR', perfil: 'Contador', status: 'Com acesso', desde: '05/10/2026', ultimo: 'hoje, 08:47', rev: '05/10/2026' },
    { nome: 'Diego Sampaio', email: 'diego.sampaio@exemplo.gov.br', setor: 'Controle interno', grupo: 'GRP-RADAR-CONTADOR', perfil: 'Contador', status: 'Com acesso', desde: '07/10/2026', ultimo: '3 dias atrás', rev: '07/10/2026' },
    { nome: 'Carla Menezes', email: 'carla.menezes@exemplo.gov.br', setor: 'Planejamento e orçamento', grupo: 'GRP-RADAR-GESTOR', perfil: 'Gestor', status: 'Precisa revisar', desde: '14/10/2026', ultimo: '21 dias atrás', rev: '—' },
    { nome: 'Rafael Toledo', email: 'rafael.toledo@exemplo.gov.br', setor: 'Gerência financeira (desligado)', grupo: '—', perfil: '—', status: 'Sem acesso', desde: '05/10/2026', ultimo: '6 dias atrás', rev: '30/10/2026' }];

  const ACCESS_LOG = [
    ['30/10/2026 10:12', 'Acesso retirado', 'Rafael Toledo', 'Saiu do grupo de gestores no login do Ciga; perdeu o acesso na hora'],
    ['14/10/2026 14:30', 'Acesso dado', 'Carla Menezes', 'Entrou no grupo de gestores; próxima revisão em 3 meses'],
    ['07/10/2026 09:05', 'Acesso dado', 'Diego Sampaio', 'Entrou no grupo de contadores'],
    ['06/10/2026 11:20', 'Acesso mudado', 'Igor Fontana', 'Mudou de contador para gestor, a pedido da Gerência financeira']];

  return { MH, MF, prev, real, desp, pes, rp, cash, fontes, naturezas, MESES_DECORRIDOS, concentracao,
    slope, icp, sd, dGrow, despMed, SCEN, project, RULES, USERS, ACCESS_LOG, sum };
})();
