// Telas do protótipo Radar Fiscal. Cada página chama Pages.render('perfil', 'tela').
window.Pages = (() => {
  const U = UI, R = U.R, { fmt, fmtk, pct, num, esc, kpi } = U, sum = R.sum;
  const $ = id => document.getElementById(id);
  const DISC = '<p class="disc">Os alertas e as previsões ajudam a decidir, mas não decidem sozinhos. Eles não dizem que alguém fez algo errado e não substituem o contador nem o controle interno.</p>';
  const band = (inner, alt) => `<section class="band${alt ? ' alt' : ''}"><div class="wrap">${inner}</div></section>`;
  const fig = (id, label, h) => `<div class="fig"${h ? ` style="min-height:${h}px"` : ''}><svg id="svg${id}" role="img" aria-label="${label}"></svg><div class="tip" id="tip${id}"></div></div>`;
  const leg = items => `<div class="legend">${items.map(([c, t, d]) => `<span><i style="border-color:${c}${d ? ';border-top-style:' + d : ''}"></i>${t}</span>`).join('')}</div>`;
  const pre = Array(11).fill(null);
  const scen = () => ({ P: R.project(R.SCEN.provavel), F: R.project(R.SCEN.favoravel), A: R.project(R.SCEN.adverso) });
  function scenChart(id) {
    const { P, F, A } = scen(), reserva = U.reservaPadrao(), f = U.finding(P, reserva);
    U.chart($('svg' + id), $('tip' + id), { labels: [...R.MH, ...R.MF], split: 11,
      series: [{ name: 'Mais provável', vals: U.cashSeries(P), color: 'var(--s1)' }, { name: 'Otimista', vals: [...pre, R.cash[11], ...F.map(r => r.c)], color: 'var(--s3)', dash: '6 5' }, { name: 'Pessimista', vals: [...pre, R.cash[11], ...A.map(r => r.c)], color: 'var(--s2)', dash: '6 5' }],
      band: [...pre, [R.cash[11], R.cash[11]], ...P.map(r => [r.lo, r.hi])], ref: { v: reserva, label: 'Mínimo de segurança ' + fmt(reserva) }, marks: f.idx >= 0 ? [{ i: 12 + f.idx, v: P[f.idx].c }] : [] });
  }
  const scenLegend = leg([['var(--s1)', 'O que aconteceu e o mais provável (área clara: margem de erro)'], ['var(--s3)', 'Otimista', 'dashed'], ['var(--s2)', 'Pessimista', 'dashed'], ['var(--crit)', 'Mínimo de segurança', 'dotted']]);
  const cobertura = () => (R.cash[11] / R.despMed).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' meses';
  function execReport() {
    const P = R.project(R.SCEN.provavel), f = U.finding(P, U.reservaPadrao()), list = U.alerts().filter(a => a.sev !== 'warn');
    return `<h3>Em poucas palavras</h3><p>${esc(f.t)}. Nos últimos três meses entrou só ${pct(sum(R.real.slice(9)) / sum(R.prev.slice(9)))} do dinheiro que estava previsto, principalmente por causa dos contratos de serviços. Enquanto isso, os gastos sobem cerca de ${fmtk(R.dGrow)} por mês.</p>
    <h3>Por que isso está acontecendo</h3><ul>${list.map(a => `<li>${esc(a.t)}: ${esc(a.d)}</li>`).join('')}</ul>
    <h3>De onde vieram os números</h3><p>Do ERP do Ciga: dinheiro que entrou e que estava previsto, pagamentos, verbas reservadas e contas a pagar, de nov/25 a out/26. O sistema só lê os dados, sem poder alterar nada. Última leitura: 05/11/2026, às 2h.</p>
    <h3>O que as contas não sabem</h3><p>As previsões supõem que tudo continua como está e têm uma margem de erro. Elas não sabem de dinheiro extra que possa entrar nem de decisões que ainda vão ser tomadas.</p>
    <h3>O que vale conferir</h3><ul>${list.map(a => `<li>${esc(a.ver)}</li>`).join('')}</ul>`;
  }
  const premTxt = { provavel: 'Tudo continua como está; 13º salário em dezembro', favoravel: 'Entra 3% mais dinheiro e sai 2% menos', adverso: 'Entra 8% menos dinheiro e os salários sobem 5% em janeiro' };

  const V = {};
  // ================= DIRIGENTE =================
  V['dirigente/visao-geral'] = app => {
    const { P, A } = scen(), f = U.finding(P, U.reservaPadrao());
    app.innerHTML = band(`<h1>${esc(f.t)}</h1><p class="lede">Está entrando menos dinheiro e saindo mais. Por isso o caixa vai de ${fmt(R.cash[11])} em out/26 para ${fmt(P[5].c)} em abr/27, no caminho mais provável. No pior caso, chega a ${fmt(A[5].c)}.</p>
      <div class="hero"><div><div class="key"><span>Quando o caixa deve ficar abaixo do mínimo de segurança</span><b>${f.m || 'não deve ficar'}</b><span>${f.m ? `Faltam ${f.idx + 1} meses para agir, contando de out/26.` : 'Nos próximos 6 meses.'}</span></div>
      <div class="kpis">${kpi('Dinheiro em caixa hoje', fmt(R.cash[11]), `${fmt(Math.abs(R.cash[11] - R.cash[10]))} ${R.cash[11] < R.cash[10] ? 'a menos' : 'a mais'} que no mês passado`)}${kpi('Dinheiro que entrou em 12 meses', pct(sum(R.real) / sum(R.prev)), `do previsto; ${fmt(sum(R.prev) - sum(R.real))} a menos que o planejado`)}${kpi('O caixa aguenta', cobertura(), 'de gastos, se nada mais entrar')}${kpi('Alertas', String(U.alerts().length), '<a href="alertas.html">ver os alertas</a>')}</div></div>
      <div><h2>Quanto dinheiro deve ter em caixa nos próximos meses</h2>${scenLegend}${fig('C', 'Dinheiro em caixa: o que aconteceu e as previsões mais provável, otimista e pessimista')}</div></div>`);
    scenChart('C');
  };
  V['dirigente/cenarios'] = app => {
    const { P, F, A } = scen(), reserva = U.reservaPadrao();
    app.innerHTML = band(`<h1>Previsões: o que pode acontecer</h1><p class="lede">Ninguém sabe o futuro com certeza. Por isso mostramos três caminhos: o mais provável, um otimista e um pessimista.</p>
      ${scenLegend}${fig('C', 'Dinheiro em caixa nos três caminhos', 340)}
      <div class="scroll" style="margin-top:18px"><table class="stack"><thead><tr><th>Caminho</th><th>O que imaginamos</th><th class="n">Caixa em abr/27</th><th>Fica abaixo do mínimo?</th></tr></thead><tbody>
      ${[['provavel', P, 'Mais provável'], ['favoravel', F, 'Otimista'], ['adverso', A, 'Pessimista']].map(([k, rows, nome]) => { const b = rows.find(r => r.c < reserva); return `<tr><td><b>${nome}</b></td><td>${premTxt[k]}</td><td class="n">${fmt(rows[5].c)}</td><td>${b ? 'Sim, em ' + b.m : 'Não, até abr/27'}</td></tr>`; }).join('')}</tbody></table></div>`);
    scenChart('C');
  };
  V['dirigente/alertas'] = app => {
    const all = U.alerts(), list = all.filter(a => a.sev !== 'warn');
    app.innerHTML = band(`<h1>O que precisa da sua atenção</h1><p class="lede">${list.length} alertas urgentes ou importantes, do mais grave para o menos grave. Há também ${all.length - list.length} para ficar de olho, que a equipe técnica acompanha. Para ver a conta por trás de cada um, clique em "Por que estou vendo este alerta?".</p><ul class="alerts" id="al"></ul>${DISC}`);
    U.renderAlerts($('al'), list, 'exec');
  };
  V['dirigente/relatorio'] = app => {
    app.innerHTML = band(`<div class="row" style="justify-content:space-between"><h1 style="margin:0">Relatório do mês · outubro/2026</h1><button class="pri" id="print">Imprimir ou salvar em PDF</button></div>
      <div class="panel" style="margin-top:14px">${execReport()}</div>${DISC}`);
    $('print').onclick = U.printReport;
  };

  // ================= GESTOR =================
  V['gestor/painel'] = app => {
    app.innerHTML = band(`<h1>Os números do Ciga</h1><p class="lede">Como estão o dinheiro que entra, o que sai, o caixa e as contas a pagar, mês a mês. Os dados vêm do ERP e vão até out/2026.</p>
      <div class="kpis wide">${kpi('Dinheiro em caixa hoje', fmt(R.cash[11]), `${fmt(Math.abs(R.cash[11] - R.cash[10]))} ${R.cash[11] < R.cash[10] ? 'a menos' : 'a mais'} que no mês passado`)}${kpi('Dinheiro que entrou em 12 meses', pct(sum(R.real) / sum(R.prev)), `do previsto; ${fmt(sum(R.real))}`)}${kpi('Gasto médio por mês', fmt(R.despMed), `subindo ${fmtk(R.dGrow)} por mês`)}${kpi('Contas a pagar', fmt(R.rp[11]), `+${pct(R.rp[11] / R.rp[10] - 1)} em relação ao mês passado`)}${kpi('O caixa aguenta', cobertura(), 'de gastos, se nada mais entrar')}</div>
      <div class="row" style="margin:22px 0 4px"><label style="flex:1 1 260px">O que mostrar<select id="selInd"><option value="rec">Dinheiro que entrou × o que estava previsto</option><option value="desp">Dinheiro que saiu (pagamentos)</option><option value="cash">Dinheiro em caixa</option><option value="rp">Contas a pagar</option></select></label>
      <label style="flex:0 1 200px">Período<select id="selPer"><option value="12">Últimos 12 meses</option><option value="6">Últimos 6 meses</option></select></label></div>
      <div id="legH"></div>${fig('H', 'Gráfico do número escolhido, mês a mês', 300)}`)
      + band(`<h2>De onde vem o dinheiro (12 meses)</h2><div class="scroll"><table class="stack"><thead><tr><th>Origem</th><th class="n">Previsto</th><th class="n">Entrou</th><th class="n">Quanto do previsto</th></tr></thead><tbody>${R.fontes.map(f => `<tr><td>${f.n}</td><td class="n">${fmt(f.prev)}</td><td class="n">${fmt(f.real)}</td><td class="n">${pct(f.real / f.prev)}</td></tr>`).join('')}</tbody></table></div>`, true);
    const h = { o: { labels: [], series: [] }, draw: null };
    const set = () => { const per = +$('selPer').value, ind = $('selInd').value, s = 12 - per; let ser;
      if (ind === 'rec') ser = [{ name: 'Entrou', vals: R.real.slice(s), color: 'var(--s1)' }, { name: 'Previsto', vals: R.prev.slice(s), color: 'var(--ref)', dash: '6 5' }];
      else ser = [{ name: { desp: 'Dinheiro que saiu', cash: 'Dinheiro em caixa', rp: 'Contas a pagar' }[ind], vals: { desp: R.desp, cash: R.cash, rp: R.rp }[ind].slice(s), color: 'var(--s1)' }];
      Object.assign(h.o, { labels: R.MH.slice(s), series: ser });
      $('legH').innerHTML = ser.length > 1 ? leg(ser.map(x => [x.color, x.name, x.dash ? 'dashed' : ''])) : '';
      h.draw ? h.draw() : h.draw = U.chart($('svgH'), $('tipH'), h.o); };
    $('selInd').onchange = $('selPer').onchange = set; set();
  };
  V['gestor/cenarios'] = app => {
    app.innerHTML = band(`<h1>Simulador "e se?"</h1><p class="lede">Mexa nos controles e veja o que acontece com o caixa nos próximos 6 meses. Por exemplo: e se entrar menos dinheiro? E se os salários subirem? Você pode guardar as simulações e comparar.</p>
      <div class="grid2"><div>
      <p class="st" style="margin:0 0 6px">Comece por um destes:</p>
      <div class="row"><button data-p="provavel">Mais provável</button><button data-p="favoravel">Otimista</button><button data-p="adverso">Pessimista</button></div>
      <label class="sl" for="sRec">E se entrar mais ou menos dinheiro? <output id="oRec"></output></label><input type="range" id="sRec" min="-15" max="10" step="1" value="0">
      <label class="sl" for="sDesp">E se gastarmos mais ou menos? <output id="oDesp"></output></label><input type="range" id="sDesp" min="-10" max="10" step="1" value="0">
      <label class="sl" for="sPes">E se os salários subirem em janeiro? <output id="oPes"></output></label><input type="range" id="sPes" min="0" max="10" step="1" value="0">
      <label class="sl" for="sRes">Mínimo de segurança em caixa (meses de gastos) <output id="oRes"></output></label><input type="range" id="sRes" min="1" max="3" step="0.5" value="1.5">
      <div class="row" style="margin-top:12px"><input type="text" id="nome" placeholder="Dê um nome a esta simulação" style="flex:1 1 200px"><button class="pri" id="salvar">Guardar simulação</button></div></div>
      <div><h2 id="scenRes" style="font-size:20px">…</h2>${leg([['var(--s1)', 'Caixa: o que aconteceu e a previsão (área clara: margem de erro)'], ['var(--crit)', 'Mínimo de segurança', 'dotted']])}${fig('S', 'Previsão do caixa na simulação')}</div></div>`)
      + band(`<h2>Simulações guardadas</h2><div class="scroll"><table class="stack"><thead><tr><th>Nome</th><th>O que imaginamos</th><th class="n">Caixa em abr/27</th><th>Fica abaixo do mínimo?</th><th></th></tr></thead><tbody id="tSaved"></tbody></table></div>`, true);
    const S = { o: { labels: [...R.MH, ...R.MF], split: 11, series: [] }, draw: null };
    const prem = () => ({ rec: +$('sRec').value / 100, desp: +$('sDesp').value / 100, pes: +$('sPes').value / 100, res: +$('sRes').value });
    const sg = v => (v > 0 ? '+' : '') + Math.round(v * 100) + '%';
    const txt = p => `Entrada de dinheiro ${sg(p.rec)}; gastos ${sg(p.desp)}; salários ${sg(p.pes)}; mínimo de ${num(p.res)} mês(es)`;
    function sim() { const p = prem(), rows = R.project(p), res = p.res * R.despMed, f = U.finding(rows, res);
      $('oRec').textContent = sg(p.rec); $('oDesp').textContent = sg(p.desp); $('oPes').textContent = sg(p.pes); $('oRes').textContent = num($('sRes').value);
      $('scenRes').textContent = f.m ? `Assim, o caixa fica abaixo do mínimo em ${f.m}` : 'Assim, o caixa fica acima do mínimo até abr/27';
      Object.assign(S.o, { series: [{ name: 'Caixa', vals: U.cashSeries(rows), color: 'var(--s1)' }], band: [...pre, [R.cash[11], R.cash[11]], ...rows.map(r => [r.lo, r.hi])], ref: { v: res, label: 'Mínimo de segurança ' + fmt(res) }, marks: f.idx >= 0 ? [{ i: 12 + f.idx, v: rows[f.idx].c }] : [] });
      S.draw ? S.draw() : S.draw = U.chart($('svgS'), $('tipS'), S.o); return { p, rows, f }; }
    ['sRec', 'sDesp', 'sPes', 'sRes'].forEach(id => $(id).oninput = sim);
    const nomes = { provavel: 'Mais provável', favoravel: 'Otimista', adverso: 'Pessimista' };
    document.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { const c = R.SCEN[b.dataset.p]; $('sRec').value = c.rec * 100; $('sDesp').value = c.desp * 100; $('sPes').value = c.pes * 100; sim(); U.log('Simulação aberta', 'Caminho ' + nomes[b.dataset.p]); });
    const saved = () => U.store.get('rf.scen', []);
    function renderSaved() { $('tSaved').innerHTML = saved().map((s, i) => `<tr><td><b>${esc(s.nome)}</b></td><td>${esc(s.prem)}</td><td class="n">${fmt(s.fim)}</td><td>${esc(s.rup)}</td><td><button data-del="${i}">Apagar</button></td></tr>`).join('') || '<tr><td colspan="5">Nenhuma simulação guardada ainda.</td></tr>';
      document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const a = saved(), [x] = a.splice(+b.dataset.del, 1); U.store.set('rf.scen', a); U.log('Simulação apagada', x.nome); renderSaved(); }); }
    $('salvar').onclick = () => { const { p, rows, f } = sim(), nome = $('nome').value.trim() || 'Simulação ' + (saved().length + 1), a = saved();
      a.unshift({ nome, prem: txt(p), fim: rows[5].c, rup: f.m ? 'Sim, em ' + f.m : 'Não' }); U.store.set('rf.scen', a.slice(0, 10)); U.log('Simulação guardada', `${nome}: ${txt(p)}`); $('nome').value = ''; renderSaved(); U.toast('Simulação guardada'); };
    sim(); renderSaved();
  };
  V['gestor/alertas'] = app => {
    app.innerHTML = band(`<h1>Alertas e o que foi feito</h1><p class="lede">Para cada alerta, anote quem está cuidando, o que foi visto e o que foi feito, até resolver. Tudo fica guardado no histórico.</p><ul class="alerts" id="al"></ul>${DISC}`);
    U.renderAlerts($('al'), U.alerts(), 'full');
  };
  V['gestor/pessoas'] = app => {
    app.innerHTML = band(`<h1>Quem tem acesso</h1><p class="lede">As pessoas entram com o login do Ciga. Quem dá ou tira o acesso é o próprio Ciga, colocando ou tirando a pessoa do grupo certo. Aqui você vê quem tem acesso, revisa de tempos em tempos e consulta o histórico.</p>
      <div class="row" style="margin-bottom:10px"><input type="text" id="busca" placeholder="Procurar por nome, setor ou área" style="flex:1 1 260px"><button id="revisao">Marcar que revisei os acessos</button></div>
      <div class="scroll"><table class="stack"><thead><tr><th>Nome</th><th>E-mail</th><th>Setor</th><th>Área no sistema</th><th>Grupo no login do Ciga</th><th>Situação</th><th>Último acesso</th><th>Última revisão</th></tr></thead><tbody id="tUsers"></tbody></table></div>`)
      + band(`<div class="grid2"><div><h2>O que cada área pode fazer</h2><div class="scroll"><table class="stack"><thead><tr><th>Área</th><th>Grupo no login</th><th>Pode</th></tr></thead><tbody>
      <tr><td>Dirigente</td><td>GRP-RADAR-DIRIGENTE</td><td>Ver o resumo, as previsões, os alertas mais graves e o relatório do mês</td></tr>
      <tr><td>Gestor</td><td>GRP-RADAR-GESTOR</td><td>Ver os números, usar o simulador, anotar o que foi feito nos alertas, gerar relatórios e ver quem tem acesso</td></tr>
      <tr><td>Contador</td><td>GRP-RADAR-CONTADOR</td><td>Ver a conta de cada alerta e as verbas, ajustar as regras dos alertas e os e-mails, ver o histórico</td></tr></tbody></table></div></div>
      <div><h2>Histórico de acessos</h2><div class="scroll"><table class="stack"><thead><tr><th>Quando</th><th>O que aconteceu</th><th>Pessoa</th><th>Detalhe</th></tr></thead><tbody id="tAcc"></tbody></table></div></div></div>`, true);
    const tag = s => `<span class="tag ${s === 'Com acesso' ? 'ok' : s === 'Sem acesso' ? 'rev' : 'pend'}">${s}</span>`;
    const users = () => { const q = $('busca').value.toLowerCase(); $('tUsers').innerHTML = R.USERS.filter(u => !q || [u.nome, u.setor, u.perfil].join(' ').toLowerCase().includes(q)).map(u => `<tr><td><b>${u.nome}</b></td><td>${u.email}</td><td>${u.setor}</td><td>${u.perfil}</td><td>${u.grupo}</td><td>${tag(u.status)}</td><td>${u.ultimo}</td><td>${u.rev}</td></tr>`).join('') || '<tr><td colspan="8">Ninguém encontrado.</td></tr>'; };
    $('busca').oninput = users; users();
    const acc = () => U.store.get('rf.acc', null) || R.ACCESS_LOG.slice();
    const renderAcc = () => $('tAcc').innerHTML = acc().map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join(''); renderAcc();
    $('revisao').onclick = () => { const a = acc(), d = new Date(); a.unshift([d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), 'Acessos revisados', 'Todos com acesso', `${U.ROLES.gestor.user} revisou os acessos; falta revisar Carla Menezes`]);
      U.store.set('rf.acc', a); U.log('Acessos revisados', 'Revisão de tempos em tempos registrada'); renderAcc(); U.toast('Revisão registrada'); };
  };
  V['gestor/relatorios'] = app => {
    app.innerHTML = band(`<h1>Relatórios</h1><p class="lede">Escolha um relatório, confira na tela e imprima ou salve em PDF.</p>
      <div class="row"><label style="flex:1 1 280px">Qual relatório<select id="selRep"><option value="exec">Resumo do mês</option><option value="alertas">Alertas e o que foi feito</option><option value="cen">Previsões do mês</option><option value="fontes">De onde veio o dinheiro</option></select></label><button class="pri" id="print" style="align-self:end">Imprimir ou salvar em PDF</button></div>
      <div class="panel" id="rep" style="margin-top:12px"></div>${DISC}`);
    function rep() { const k = $('selRep').value, al = U.alerts(), st = U.store.get('rf.st', {}); let h = '';
      if (k === 'exec') h = `<h2>Resumo do mês · outubro/2026</h2>${execReport()}`;
      else if (k === 'alertas') h = `<h2>Alertas e o que foi feito</h2><div class="scroll"><table><thead><tr><th>Alerta</th><th>Gravidade</th><th>Como está</th><th>Quem cuida</th><th>O que foi feito</th></tr></thead><tbody>${al.map(a => { const s = st[a.id] || {}; return `<tr><td>${esc(a.t)}</td><td>${U.SEV[a.sev][0]}</td><td>${esc(s.st || 'Novo')}</td><td>${esc(s.resp || a.resp)}</td><td>${esc(s.prov || '—')}</td></tr>`; }).join('')}</tbody></table></div>`;
      else if (k === 'cen') { const sc = scen(); h = `<h2>Previsões do mês: dinheiro em caixa</h2><div class="scroll"><table><thead><tr><th>Mês</th><th class="n">Mais provável</th><th class="n">Pode variar de</th><th class="n">Otimista</th><th class="n">Pessimista</th></tr></thead><tbody>${sc.P.map((r, i) => `<tr><td>${r.m}</td><td class="n">${fmt(r.c)}</td><td class="n">${fmt(r.lo)} a ${fmt(r.hi)}</td><td class="n">${fmt(sc.F[i].c)}</td><td class="n">${fmt(sc.A[i].c)}</td></tr>`).join('')}</tbody></table></div>`; }
      else h = `<h2>De onde veio o dinheiro</h2><table><thead><tr><th>Origem</th><th class="n">Previsto</th><th class="n">Entrou</th><th class="n">Quanto do previsto</th></tr></thead><tbody>${R.fontes.map(f => `<tr><td>${f.n}</td><td class="n">${fmt(f.prev)}</td><td class="n">${fmt(f.real)}</td><td class="n">${pct(f.real / f.prev)}</td></tr>`).join('')}</tbody></table>`;
      $('rep').innerHTML = h + `<p class="st">Feito em ${new Date().toLocaleString('pt-BR')} por ${U.ROLES.gestor.user}. Números lidos do ERP do Ciga, até out/2026.</p>`; }
    $('selRep').onchange = rep; rep(); $('print').onclick = () => { rep(); U.printReport(); };
  };

  // ================= CONTADOR =================
  V['contador/analise'] = app => {
    const al = U.alerts();
    app.innerHTML = band(`<h1>Alertas em detalhe</h1><p class="lede">Aqui cada alerta mostra a conta inteira: qual regra disparou, os números usados, o que causou, quanto dá para confiar e o que a conta não sabe. Assim dá para conferir e, se for o caso, discordar.</p>
      <div class="kpis wide">${kpi('Alertas agora', String(al.length), `${al.filter(a => a.sev === 'crit').length} urgente(s)`)}${kpi('Dinheiro que entrou (3 meses)', pct(sum(R.real.slice(9)) / sum(R.prev.slice(9))), 'do que estava previsto')}${kpi('Salários sobre o que entrou (12 meses)', pct(sum(R.pes) / sum(R.real)), 'o limite de atenção é o Ciga que define')}${kpi('Última leitura do ERP', '05/11, às 2h', '4.812 lançamentos')}</div>
      <ul class="alerts" id="al" style="margin-top:20px"></ul>${DISC}`);
    U.renderAlerts($('al'), al, 'tech');
  };
  V['contador/dotacoes'] = app => {
    app.innerHTML = band(`<h1>A verba de cada tipo de gasto vai dar até dezembro?</h1><p class="lede">No começo do ano, cada tipo de gasto recebe uma verba (a dotação). A barra mostra quanto dela já foi comprometido (empenhado). O tracinho mostra onde a barra deveria estar agora: em outubro já passaram 10 dos 12 meses, ou 83% do ano. À direita, quanto deve faltar ou sobrar no fim do ano.</p>
      <div class="bars">${R.naturezas.map(n => { const rate = n.emp / R.MESES_DECORRIDOS, folga = n.dot - n.emp - (rate * 2 + n.extraDez), p = n.emp / n.dot;
        return `<div class="b"><div><b>${n.n}</b><br><span class="st">usou ${fmtk(n.emp)} de ${fmtk(n.dot)} · ${pct(p)}</span></div><div class="track" role="img" aria-label="${pct(p)} da verba já usada"><div class="fill" style="width:${Math.min(100, p * 100)}%${folga < 0 ? ';background:var(--serious)' : ''}"></div><div class="mark" style="left:83.3%"></div></div><div style="text-align:right"><b>${folga < 0 ? 'vão faltar ' + fmtk(-folga) : 'vão sobrar ' + fmtk(folga)}</b></div></div>`; }).join('')}</div>
      <p class="disc">Laranja: nesse ritmo, a verba acaba antes de dezembro. A conta: gasto médio por mês × 2 meses que faltam, mais o 13º salário no caso da folha. Quando um tipo de gasto vai sobrar, dá para passar parte da verba para outro.</p>`);
  };
  V['contador/alarmes'] = app => {
    app.innerHTML = band(`<h1>Regras dos alertas</h1><p class="lede">Cada linha é uma regra que vigia um número. Aqui você escolhe: se a regra está ligada, a partir de quando ela avisa, se é urgente ou não, se avisa no sistema e/ou por e-mail, quem cuida e de quanto em quanto tempo. O que mudar aqui vale para todos e fica no histórico.</p>
      <div class="scroll"><table class="stack rules"><thead><tr><th>Ligada</th><th>Regra</th><th>Avisar a partir de</th><th>Gravidade</th><th>Onde avisar</th><th>Quem cuida</th><th>De quanto em quanto tempo</th></tr></thead><tbody id="tRules"></tbody></table></div>
      <div class="row" style="margin-top:12px"><button class="pri" id="saveRules">Salvar regras</button><button id="resetRules">Voltar ao padrão</button><a class="btn" href="notificacoes.html">Ajustar os e-mails →</a></div>`);
    let rs = U.rules(); const SEVN = { crit: 'Urgente', serious: 'Importante', warn: 'Fique de olho' };
    const PER = [['Imediato', 'Assim que acontecer'], ['Diário', 'Uma vez por dia'], ['Semanal', 'Uma vez por semana'], ['Mensal', 'Uma vez por mês']];
    function render() { $('tRules').innerHTML = rs.map((r, i) => `<tr>
      <td><label class="chk"><input type="checkbox" data-i="${i}" data-f="on"${r.on ? ' checked' : ''} aria-label="Ligar a regra ${esc(r.nome)}"></label></td>
      <td><b>${esc(r.nome)}</b><br><span class="st">${esc(r.param)}</span></td>
      <td><div class="row" style="flex-wrap:nowrap"><input type="number" step="0.5" data-i="${i}" data-f="val" value="${r.val}" aria-label="Avisar a partir de, em ${esc(r.unit)}"><span class="st">${esc(r.unit)}</span></div></td>
      <td><select data-i="${i}" data-f="sev" aria-label="Gravidade">${Object.entries(SEVN).map(([k, v]) => `<option value="${k}"${k === r.sev ? ' selected' : ''}>${v}</option>`).join('')}</select></td>
      <td><label class="chk"><input type="checkbox" data-i="${i}" data-c="painel"${r.canais.includes('painel') ? ' checked' : ''}>No sistema</label><label class="chk"><input type="checkbox" data-i="${i}" data-c="email"${r.canais.includes('email') ? ' checked' : ''}>Por e-mail</label></td>
      <td><input type="text" data-i="${i}" data-f="resp" value="${esc(r.resp)}" aria-label="Quem cuida"></td>
      <td><select data-i="${i}" data-f="per" aria-label="De quanto em quanto tempo">${PER.map(([v, t]) => `<option value="${v}"${v === r.per ? ' selected' : ''}>${t}</option>`).join('')}</select></td></tr>`).join(''); }
    render();
    function read() { document.querySelectorAll('#tRules [data-f]').forEach(el => { const r = rs[+el.dataset.i], f = el.dataset.f; r[f] = f === 'on' ? el.checked : f === 'val' ? +el.value : el.value; });
      rs.forEach((r, i) => r.canais = [...document.querySelectorAll(`#tRules [data-i="${i}"][data-c]`)].filter(c => c.checked).map(c => c.dataset.c)); }
    const perTxt = v => PER.find(p => p[0] === v)[1].toLowerCase();
    $('saveRules').onclick = () => { const before = U.rules(); read(); U.saveRules(rs);
      const ch = rs.filter((r, i) => JSON.stringify(r) !== JSON.stringify(before[i])).map(r => `${r.nome} (${r.on ? 'ligada' : 'desligada'}, a partir de ${num(r.val)} ${r.unit}, ${SEVN[r.sev].toLowerCase()}, ${perTxt(r.per)})`);
      U.log('Regras dos alertas mudadas', ch.length ? ch.join('; ') : 'Nada mudou'); U.toast(ch.length ? `${ch.length} regra(s) mudada(s)` : 'Nada mudou'); };
    $('resetRules').onclick = () => { U.store.set('rf.rules', {}); rs = U.rules(); render(); U.log('Regras voltaram ao padrão', 'As 7 regras voltaram aos valores iniciais'); U.toast('Regras de volta ao padrão'); };
  };
  V['contador/notificacoes'] = app => {
    app.innerHTML = band(`<h1>E-mails de aviso</h1><p class="lede">Escolha quando o resumo é enviado e para quem. Os e-mails saem pelo servidor do próprio Ciga e só para endereços do Ciga. Quais alertas entram no e-mail se escolhe em <a href="alarmes.html">Regras dos alertas</a>.</p>
      <div class="grid2"><div class="panel">
      <label class="sl" for="nFreq">Quando mandar</label><select id="nFreq"><option value="diario">Todo dia útil</option><option value="semanal">Toda segunda-feira</option><option value="mensal">Uma vez por mês, no dia escolhido</option><option value="crit">Só quando aparecer algo urgente</option></select>
      <div class="row" style="margin-top:8px"><label style="flex:1 1 140px">Horário<input type="time" id="nHora" value="07:00"></label><label style="flex:1 1 140px">Dia do mês (se for mensal)<input type="number" id="nDia" min="1" max="28" value="5"></label></div>
      <label class="sl" for="nDest">Para quem (um e-mail por linha)</label><textarea id="nDest" style="min-height:120px"></textarea>
      <label class="chk"><input type="checkbox" id="nAgr">Juntar tudo em um e-mail só</label>
      <label class="chk"><input type="checkbox" id="nNovos">Mandar só o que for novo ou tiver mudado</label>
      <label class="chk"><input type="checkbox" id="nPdf">Mandar o relatório completo em PDF junto</label>
      <p class="st" id="pdfNote"></p>
      <div class="row" style="margin-top:8px"><button class="pri" id="saveN">Salvar</button><button id="teste">Mandar um e-mail de teste</button></div></div>
      <div><h2 style="font-size:18px">Como vai ficar o próximo e-mail</h2><div class="mail" id="mail"></div></div></div>`);
    const N = Object.assign({ freq: 'diario', hora: '07:00', dia: 5, dest: 'renata.coelho@exemplo.gov.br\nmarina.albuquerque@exemplo.gov.br\nluciana.prates@exemplo.gov.br\nigor.fontana@exemplo.gov.br', agr: true, novos: true, pdf: false }, U.store.get('rf.notif', {}));
    $('nFreq').value = N.freq; $('nHora').value = N.hora; $('nDia').value = N.dia; $('nDest').value = N.dest; $('nAgr').checked = N.agr; $('nNovos').checked = N.novos; $('nPdf').checked = N.pdf;
    const read = () => Object.assign(N, { freq: $('nFreq').value, hora: $('nHora').value, dia: +$('nDia').value, dest: $('nDest').value, agr: $('nAgr').checked, novos: $('nNovos').checked, pdf: $('nPdf').checked });
    const dests = () => N.dest.split(/\n+/).map(s => s.trim()).filter(Boolean);
    function mail() { read(); const rs = U.rules(), al = U.alerts().filter(a => rs.find(r => r.id === a.id).canais.includes('email'));
      const quando = { diario: `todo dia útil, às ${N.hora}`, semanal: `toda segunda-feira, às ${N.hora}`, mensal: `todo dia ${N.dia}, às ${N.hora}`, crit: 'só quando aparecer algo urgente' }[N.freq];
      $('mail').innerHTML = `<div class="mh">De: radar-fiscal@exemplo.gov.br<br>Para: ${dests().length} pessoa(s)<br>Assunto: Radar Fiscal · ${al.length} alerta(s), ${al.filter(a => a.sev === 'crit').length} urgente(s)<br>Quando: ${esc(quando)}${N.pdf ? '<br>Anexo: radar-fiscal-out-2026.pdf' : ''}</div>
      <div class="mb"><p style="margin-top:0">Bom dia! O Radar Fiscal leu os dados do ERP de 05/11/2026 e encontrou:</p><ul>${al.map(a => `<li><b>${U.SEV[a.sev][0]}:</b> ${esc(a.t)}</li>`).join('') || '<li>Nenhum alerta marcado para ir por e-mail.</li>'}</ul>
      <p>Para ver os detalhes e as previsões: <u>abrir o Radar Fiscal</u> (entre com o seu login do Ciga).</p><p class="st">E-mail automático. Os alertas ajudam a decidir e não dizem que alguém fez algo errado.</p></div>`;
      $('pdfNote').textContent = N.pdf ? 'Com o PDF, todos os números vão por e-mail. Use só para endereços do Ciga e com o aval de quem cuida da proteção de dados.' : 'Sem o PDF, o e-mail leva só o resumo e o link. Os números ficam no sistema, protegidos pelo login. É o mais seguro.'; }
    ['nFreq', 'nHora', 'nDia', 'nDest', 'nAgr', 'nNovos', 'nPdf'].forEach(id => $(id).addEventListener('input', mail)); mail();
    $('saveN').onclick = () => { read(); U.store.set('rf.notif', N); U.log('E-mails de aviso mudados', `${{ diario: 'Todo dia útil', semanal: 'Toda segunda', mensal: 'Mensal', crit: 'Só urgente' }[N.freq]}, ${N.hora}; ${dests().length} pessoa(s); PDF ${N.pdf ? 'junto' : 'não'}`); U.toast('Salvo'); };
    $('teste').onclick = () => { U.log('E-mail de teste', 'Mandado para ' + (dests()[0] || '—') + ' (simulação)'); U.toast('E-mail de teste mandado (simulação) e anotado no histórico'); };
  };
  V['contador/auditoria'] = app => {
    app.innerHTML = band(`<h1>Histórico de tudo o que aconteceu</h1><p class="lede">Cada leitura do ERP, cada conta refeita, cada e-mail, cada regra mudada e cada anotação feita por alguém fica guardada aqui, com data, hora e quem fez. Serve para conferir qualquer número depois.</p>
      <div class="row" style="margin-bottom:10px"><input type="text" id="fAud" placeholder="Procurar por evento, pessoa ou detalhe" style="flex:1 1 280px"></div>
      <div class="scroll"><table class="stack"><thead><tr><th>Quando</th><th>O que aconteceu</th><th>Quem fez</th><th>Detalhe</th></tr></thead><tbody id="tAud"></tbody></table></div>`);
    const aud = () => U.renderAudit($('tAud'), $('fAud').value); $('fAud').oninput = aud; document.addEventListener('audit', aud); aud();
  };
  V['contador/dados'] = app => {
    app.innerHTML = band(`<h1>De onde vêm os dados</h1><p class="lede">Os números vêm do ERP do Ciga. O Radar Fiscal só lê, pela porta oficial do ERP (a API), e não consegue mudar nada. Tudo fica guardado na nuvem do próprio Ciga, e nenhum dado vai para fora.</p>
      <div class="flow"><div class="box"><b>ERP do Ciga</b>onde ficam os lançamentos</div><b class="arr" aria-hidden="true">→</b>
      <div class="cloud"><span>Tudo dentro da nuvem do Ciga</span><div class="box"><b>1. Leitura</b>todo dia de madrugada, com registro de cada leitura</div><div class="box"><b>2. Organização</b>guarda só o necessário</div><div class="box"><b>3. Contas e previsões</b>regras que o Ciga pode ajustar</div><div class="box"><b>4. Telas e e-mails</b>login do Ciga, cada um vê o que pode, tudo no histórico</div></div></div>`)
      + band(`<h2>Quais dados lemos</h2><div class="scroll"><table class="stack"><thead><tr><th>O que é</th><th>Onde lemos no ERP</th><th>Quando lemos</th><th>Última leitura</th><th class="n">Registros</th><th>Como está</th></tr></thead><tbody>
      <tr><td>Dinheiro previsto e que entrou</td><td>/receitas</td><td>Todo dia, às 2h</td><td>05/11/2026</td><td class="n">1.904</td><td>Completo</td></tr>
      <tr><td>Gastos: verba, comprometido, conferido e pago</td><td>/despesas</td><td>Todo dia, às 2h</td><td>05/11/2026</td><td class="n">2.311</td><td>Completo</td></tr>
      <tr><td>Contas a pagar</td><td>/obrigacoes</td><td>Todo dia, às 2h</td><td>05/11/2026</td><td class="n">412</td><td>3 sem data de vencimento</td></tr>
      <tr><td>Total da folha de pagamento (sem dados de cada pessoa)</td><td>/folha/totais</td><td>Uma vez por mês</td><td>05/11/2026</td><td class="n">12</td><td>Completo</td></tr>
      <tr><td>Pagamentos por fornecedor (somados)</td><td>/pagamentos/credores</td><td>Uma vez por semana</td><td>04/11/2026</td><td class="n">173</td><td>Completo</td></tr></tbody></table></div>
      <p class="disc">Os endereços da API são só exemplos. Os de verdade serão combinados com a empresa do ERP no começo do projeto (Marco 1).</p>`, true);
  };

  function render(role, view) { U.header(role, view); const app = document.getElementById('app'); (V[role + '/' + view] || (() => app.textContent = 'Página não encontrada.'))(app); }
  return { render, views: Object.keys(V) };
})();
