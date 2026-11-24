// Componentes compartilhados do protótipo Radar Fiscal.
window.UI = (() => {
  const R = RF, sum = R.sum;
  const fmt = v => 'R$ ' + (v / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' mi';
  const fmtk = v => 'R$ ' + Math.round(v).toLocaleString('pt-BR') + ' mil';
  const pct = v => (v * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  const num = v => String(v).replace('.', ',');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const ROLES = {
    dirigente: { nome: 'Dirigente', user: 'Marina Albuquerque' },
    gestor: { nome: 'Gestor', user: 'Renata Coelho' },
    contador: { nome: 'Contador', user: 'Luciana Prates' }};
  let role = null;

  // ---------- regras configuráveis ----------
  function rules() { const s = store.get('rf.rules', {}); return R.RULES.map(r => ({ ...r, ...(s[r.id] || {}) })); }
  function saveRules(list) { const o = {}; list.forEach(r => o[r.id] = { val: r.val, sev: r.sev, canais: r.canais, resp: r.resp, per: r.per, on: r.on }); store.set('rf.rules', o); }

  // ---------- trilha de auditoria ----------
  const AUDIT0 = [
    ['05/11/2026 02:00', 'Dados lidos do ERP', 'Sistema · leitura pela API (sem poder alterar nada)', '4.812 lançamentos de out/2026 lidos; todos conferidos; nenhum recusado'],
    ['05/11/2026 02:06', 'Contas refeitas', 'Sistema · regras versão 0.3', '14 números recalculados'],
    ['05/11/2026 02:07', 'Previsões feitas', 'Sistema · previsão versão 0.2', 'Cenários provável, otimista e pessimista para os próximos 6 meses'],
    ['05/11/2026 07:00', 'E-mail enviado', 'Sistema · e-mail do Ciga', 'Resumo do dia para 4 pessoas; sem anexo']];
  const getAudit = () => store.get('rf.audit', null) || AUDIT0.slice();
  function log(ev, det) {
    const a = getAudit(), d = new Date();
    const t = d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    a.unshift([t, ev, role ? `${ROLES[role].user} (${ROLES[role].nome})` : 'Sistema', det]);
    store.set('rf.audit', a.slice(0, 100));
    document.dispatchEvent(new Event('audit'));
  }

  // ---------- motor de alertas ----------
  const SEVORD = { crit: 0, serious: 1, warn: 2 };
  function alerts(prem) {
    prem = prem || R.SCEN.provavel;
    const rs = rules(), g = id => rs.find(r => r.id === id), out = [];
    const reserva = g('R1').val * R.despMed, rows = R.project(prem);
    const base = (id, o) => out.push({ id, sev: g(id).sev, resp: g(id).resp, ...o });
    if (g('R1').on) {
      const br = rows.find(x => x.c < reserva), lo = rows.find(x => x.lo < reserva);
      if (br) base('R1', { t: `O dinheiro em caixa deve ficar abaixo do mínimo de segurança em ${br.m}`, d: `A previsão é ter ${fmt(br.c)} em caixa, mas o mínimo combinado é ${fmt(reserva)}.`,
        calc: `Previsão de ${fmt(br.c)} é menor que o mínimo de ${fmt(reserva)} (${num(g('R1').val)} mês(es) de gasto médio, que é ${fmt(R.despMed)} por mês)`,
        fat: `Está entrando menos dinheiro a cada mês (cerca de ${fmtk(-R.slope)} a menos), está saindo mais (cerca de ${fmtk(R.dGrow)} a mais) e em dezembro tem o 13º salário.`,
        lim: 'A conta supõe que tudo continua como está. Ela não sabe de dinheiro extra que possa entrar nem de decisões que ainda vão ser tomadas.',
        conf: `Média. Em ${br.m}, o caixa deve ficar entre ${fmt(br.lo)} e ${fmt(br.hi)}.`,
        ver: 'Ver quais pagamentos podem esperar e cobrar quem está atrasando repasses.',
        src: 'ERP: dinheiro que entrou e que saiu, de nov/25 a out/26', v: 'Regra R1, versão 0.3 · previsão, versão 0.2' });
      else if (lo) base('R1', { sev: 'warn', t: `O dinheiro em caixa pode ficar abaixo do mínimo de segurança em ${lo.m}`, d: `O mais provável é ficar acima, mas no pior caso da previsão (${fmt(lo.lo)}) fica abaixo.`,
        calc: `Pior caso de ${fmt(lo.lo)} é menor que o mínimo de ${fmt(reserva)}`, fat: 'A previsão sempre tem uma margem de erro.', lim: 'A conta supõe que tudo continua como está.', conf: 'Baixa a média.',
        ver: 'Acompanhar quanto dinheiro entra nas próximas semanas.', src: 'Previsão do cenário escolhido', v: 'Regra R1b, versão 0.3' });
    }
    const ex3 = sum(R.real.slice(9)) / sum(R.prev.slice(9));
    if (g('R2').on && ex3 * 100 < g('R2').val) base('R2', { t: 'Está entrando menos dinheiro do que o planejado', d: `Nos últimos 3 meses entrou ${pct(ex3)} do que estava previsto. O mínimo aceitável é ${g('R2').val}%.`,
      calc: `Entrou ${fmt(sum(R.real.slice(9)))} de ${fmt(sum(R.prev.slice(9)))} previstos = ${pct(ex3)}`,
      fat: `Quem mais ficou abaixo foram os contratos de serviços: ${pct(R.fontes[1].real / R.fontes[1].prev)} do previsto em 12 meses. O rateio ficou em ${pct(R.fontes[0].real / R.fontes[0].prev)}.`,
      lim: 'Alguém pode só ter pagado atrasado e acertar no mês seguinte.', conf: 'Alta: é dinheiro que já entrou (ou não entrou), não é previsão.',
      ver: 'Ver quais faturas de serviços ainda não foram pagas.', src: 'ERP: dinheiro recebido por origem e valor previsto no orçamento', v: 'Regra R2, versão 0.3' });
    if (g('R3').on) {
      const falta = R.naturezas.map(n => { const rate = n.emp / R.MESES_DECORRIDOS, saldo = n.dot - n.emp, need = rate * 2 + n.extraDez;
        return { ...n, rate, saldo, folga: saldo - need, mes: saldo < rate ? 'nov/26' : 'dez/26' }; }).filter(n => n.folga < g('R3').val);
      if (falta.length) base('R3', { t: `A verba reservada não vai dar até dezembro em ${falta.length} tipos de gasto`, d: falta.map(n => `${n.n}: acaba em ${n.mes}, faltam ${fmtk(-n.folga)}`).join('; ') + '.',
        calc: 'O que sobra da verba − (gasto médio por mês × 2 meses que faltam + 13º salário, quando tem)',
        fat: falta.map(n => `${n.n}: já usou ${pct(n.emp / n.dot)} da verba em 10 dos 12 meses`).join('; '),
        lim: 'Supõe que vai continuar gastando no mesmo ritmo. Pedidos de mais verba que já foram feitos não entram na conta.', conf: 'Média a alta.',
        ver: 'Ver se dá para passar verba de um tipo de gasto que vai sobrar, ou pedir mais verba antes do fim do ano.', src: 'ERP: verba reservada (dotação) e valores já comprometidos (empenhos), jan a out/26', v: 'Regra R3, versão 0.3' });
    }
    let up = 0; for (let i = 11; i > 0 && R.rp[i] > R.rp[i - 1]; i--) up++;
    if (g('R4').on && up >= g('R4').val) base('R4', { t: `As contas a pagar estão crescendo há ${up} meses seguidos`, d: `Eram ${fmtk(R.rp[11 - up])} e agora são ${fmtk(R.rp[11])} (+${pct(R.rp[11] / R.rp[11 - up] - 1)}).`,
      calc: `Meses seguidos subindo: ${up}. O limite para avisar é ${g('R4').val}.`, fat: 'Serviços já entregues que ainda não foram pagos.', lim: 'Parte pode ser só a data de pagamento caindo no mês seguinte.', conf: 'Alta: são valores registrados.',
      ver: 'Ver há quanto tempo essas contas estão esperando.', src: 'ERP: despesas já conferidas (liquidadas) e ainda não pagas', v: 'Regra R4, versão 0.3' });
    let ds = 0; for (let i = 6; i < 12; i++) if (R.desp[i] > R.desp[i - 1] && R.real[i] <= R.real[i - 1] + 20) ds++;
    if (g('R5').on && ds >= g('R5').val) base('R5', { t: 'Está saindo cada vez mais dinheiro e entrando cada vez menos', d: `Em ${ds} dos últimos 6 meses, o gasto subiu e o dinheiro que entra ficou igual ou caiu.`,
      calc: `${ds} de 6 meses. O limite para avisar é ${g('R5').val}.`, fat: 'Junta duas coisas: menos dinheiro entrando e gastos subindo todo mês.', lim: 'É um sinal geral; não aponta uma causa só.', conf: 'Média.',
      ver: 'Rever os gastos planejados para o começo de 2027.', src: 'ERP: entradas e saídas de cada mês', v: 'Regra R5, versão 0.3' });
    if (g('R6').on && R.concentracao * 100 > g('R6').val) base('R6', { t: 'Poucos fornecedores recebem a maior parte dos pagamentos', d: `Só 3 fornecedores receberam ${pct(R.concentracao)} do que foi pago em serviços nos últimos 12 meses.`,
      calc: `${pct(R.concentracao)} é mais que o limite de ${g('R6').val}%`, fat: 'Contratos de tecnologia de valor alto.', lim: 'Isso pode ser normal em serviços muito especializados. Não quer dizer que há algo errado.', conf: 'Alta.',
      ver: 'Pensar no que aconteceria se um deles parasse de atender.', src: 'ERP: pagamentos por fornecedor (somados, sem detalhes)', v: 'Regra R6, versão 0.3' });
    const pr = sum(R.pes) / sum(R.real);
    if (g('R7').on && pr * 100 > g('R7').val) base('R7', { t: 'O gasto com salários está acima do limite de atenção', d: `Os salários usaram ${pct(pr)} de todo o dinheiro que entrou em 12 meses. O limite de atenção (${g('R7').val}%) é o Ciga que escolhe.`,
      calc: `${fmt(sum(R.pes))} de salários ÷ ${fmt(sum(R.real))} que entraram = ${pct(pr)}`, fat: 'Reajuste e 13º salário, com menos dinheiro entrando.', lim: 'É um limite interno de cuidado, não o limite da lei.', conf: 'Alta.',
      ver: 'Calcular o efeito de qualquer aumento antes de concedê-lo.', src: 'ERP: total da folha de pagamento (sem dados de cada pessoa)', v: 'Regra R7, versão 0.3' });
    return out.sort((a, b) => SEVORD[a.sev] - SEVORD[b.sev]);
  }

  // ---------- visual dos alertas ----------
  const SEV = { crit: ['Urgente', 'var(--crit)', 'M12 2 22 20H2z M12 9v5 M12 17v.5'], serious: ['Importante', 'var(--serious)', 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 8v5 M12 16v.5'], warn: ['Fique de olho', 'var(--warn)', 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z M12 12h.01'] };
  const sevTag = s => { const [lb, col, ic] = SEV[s]; return `<span class="sev"><svg viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ic}"/></svg>${lb}</span>`; };
  const ST = ['Novo', 'Estamos olhando', 'Já tomamos uma providência', 'Resolvido'];
  const getSt = () => store.get('rf.st', {});
  function renderAlerts(el, list, mode) {
    const st = getSt();
    el.innerHTML = list.length ? list.map((a, i) => { const s = st[a.id] || {};
      return `<li class="alert"><div class="hd">${sevTag(a.sev)}<span class="st">${s.fb ? `<span class="fbmark">Você marcou como ${esc(s.fb)}</span> · ` : ''}Como está: <b>${esc(s.st || 'Novo')}</b> · Quem cuida: ${esc(s.resp || a.resp)}</span></div>
      <h3>${esc(a.t)}</h3><p>${esc(a.d)}</p>
      <details${mode === 'tech' ? ' open' : ''}><summary>Por que estou vendo este alerta?</summary><dl class="why">
      <dt>Qual regra</dt><dd>${esc(a.id)} · ${esc(rules().find(r => r.id === a.id).nome)}</dd><dt>A conta</dt><dd>${esc(a.calc)}</dd><dt>O que causou</dt><dd>${esc(a.fat)}</dd>
      <dt>Quanto confiar</dt><dd>${esc(a.conf)}</dd><dt>O que a conta não sabe</dt><dd>${esc(a.lim)}</dd><dt>O que conferir</dt><dd>${esc(a.ver)}</dd>
      <dt>De onde vieram os números</dt><dd>${esc(a.src)}</dd><dt>Versão da conta</dt><dd>${esc(a.v)}</dd></dl></details>
      ${mode !== 'exec' ? `<details class="noprint"${s.prov||s.st&&s.st!=='Novo'?' open':''}><summary>Anotar o que foi feito</summary><div class="wf"><label>Como está<select data-i="${i}" data-f="st">${ST.map(x => `<option${x === (s.st || 'Novo') ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
      <label>Quem cuida<input type="text" data-i="${i}" data-f="resp" value="${esc(s.resp || a.resp)}"></label>
      <label class="full">O que foi visto e o que foi feito<textarea data-i="${i}" data-f="prov" placeholder="Ex.: conferimos as faturas e cobramos o município X">${esc(s.prov || '')}</textarea></label>
      <div class="full row"><button class="pri" data-i="${i}" data-save>Salvar anotação</button></div></div></details>` : ''}
      <div class="row noprint" style="margin-top:8px"><span class="st">Este alerta ajudou você?</span><button data-i="${i}" data-fb="útil"${s.fb === 'útil' ? ' aria-pressed="true"' : ''}>Útil</button><button data-i="${i}" data-fb="pouco útil"${s.fb === 'pouco útil' ? ' aria-pressed="true"' : ''}>Pouco útil</button></div></li>`; }).join('')
      : '<li class="alert"><h3>Tudo tranquilo por aqui</h3><p>Nenhum número passou dos limites combinados.</p></li>';
    el.querySelectorAll('[data-save]').forEach(b => b.onclick = () => { const i = +b.dataset.i, a = list[i], s = getSt(), cur = s[a.id] || {};
      el.querySelectorAll(`[data-i="${i}"][data-f]`).forEach(f => cur[f.dataset.f] = f.value); s[a.id] = cur; store.set('rf.st', s);
      log('Anotação em alerta', `${a.id} "${a.t}": ${cur.st}${cur.prov ? '; com anotação' : ''}`); toast('Anotação salva no histórico'); renderAlerts(el, list, mode); });
    el.querySelectorAll('[data-fb]').forEach(b => b.onclick = () => { const a = list[+b.dataset.i], s = getSt(); s[a.id] = { ...(s[a.id] || {}), fb: b.dataset.fb }; store.set('rf.st', s);
      log('Opinião sobre alerta', `${a.id} marcado como ${b.dataset.fb}`); renderAlerts(el, list, mode); toast('Feedback enviado'); });
  }

  // ---------- gráfico de linhas ----------
  function niceStep(r) { const p = 10 ** Math.floor(Math.log10(r)); return [1, 2, 2.5, 5, 10].map(x => x * p).find(x => x >= r); }
  function chart(svg, tip, o) {
    const draw = () => {
      const W = svg.clientWidth, H = svg.clientHeight; if (!W) return;
      const n = o.labels.length, m = { l: W < 520 ? 40 : 54, r: 14, t: 26, b: 28 };
      const vals = o.series.flatMap(s => s.vals.filter(v => v != null)).concat(o.band ? o.band.flatMap(b => b ? [b[0], b[1]] : []) : [], o.ref ? [o.ref.v] : []);
      const step = niceStep((Math.max(...vals) - Math.min(...vals)) / 5 || 1);
      const lo = Math.floor(Math.min(...vals) / step) * step, hi = Math.ceil(Math.max(...vals) / step) * step;
      const X = i => m.l + (W - m.l - m.r) * i / (n - 1), Y = v => m.t + (H - m.t - m.b) * (1 - (v - lo) / (hi - lo));
      let g = '';
      for (let v = lo; v <= hi + 1e-6; v += step) g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--grid)"/><text x="${m.l - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="12" fill="var(--ink2)">${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</text>`;
      g += `<text x="${m.l - 6}" y="11" text-anchor="end" font-size="11" fill="var(--ink2)">R$ mi</text>`;
      const k = Math.ceil(n / (W < 520 ? 4 : 9));
      o.labels.forEach((l, i) => { if ((i % k === 0 && n - 1 - i >= k) || i === n - 1) g += `<text x="${X(i)}" y="${H - 8}" text-anchor="${i === n - 1 ? 'end' : i === 0 ? 'start' : 'middle'}" font-size="12" fill="var(--ink2)">${l}</text>`; });
      if (o.band) { const idx = o.band.map((b, i) => b ? i : -1).filter(i => i >= 0);
        g += `<path d="M${idx.map(i => X(i) + ',' + Y(o.band[i][1])).join('L')}L${idx.slice().reverse().map(i => X(i) + ',' + Y(o.band[i][0])).join('L')}Z" fill="var(--s1)" opacity=".13"/>`; }
      if (o.split != null) g += `<line x1="${X(o.split)}" x2="${X(o.split)}" y1="${m.t}" y2="${H - m.b}" stroke="var(--line)"/><text x="${X(o.split) + 6}" y="${m.t + 10}" font-size="12" fill="var(--ink2)">projeção →</text>`;
      if (o.ref) g += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(o.ref.v)}" y2="${Y(o.ref.v)}" stroke="var(--crit)" stroke-width="2" stroke-dasharray="2 4"/><text x="${m.l + 6}" y="${Y(o.ref.v) - 6}" font-size="12" fill="var(--ink2)">${esc(o.ref.label)}</text>`;
      o.series.forEach(s => { let d = ''; s.vals.forEach((v, i) => { if (v == null) return; d += (d && s.vals[i - 1] != null ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1); });
        g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/>`; });
      (o.marks || []).forEach(p => g += `<circle cx="${X(p.i)}" cy="${Y(p.v)}" r="5" fill="var(--crit)" stroke="var(--bg)" stroke-width="2"/>`);
      g += `<line class="xh" y1="${m.t}" y2="${H - m.b}" stroke="var(--ink2)" visibility="hidden"/><rect x="${m.l}" y="0" width="${W - m.l - m.r}" height="${H}" fill="transparent" class="hit"/>`;
      svg.innerHTML = g;
      const hit = svg.querySelector('.hit'), xh = svg.querySelector('.xh');
      hit.onpointermove = e => { const b = svg.getBoundingClientRect(), i = Math.max(0, Math.min(n - 1, Math.round((e.clientX - b.left - m.l) / (W - m.l - m.r) * (n - 1))));
        xh.setAttribute('x1', X(i)); xh.setAttribute('x2', X(i)); xh.setAttribute('visibility', 'visible');
        let t = `<b>${o.labels[i]}</b>`; o.series.forEach(s => { if (s.vals[i] != null) t += `<br>${esc(s.name)}: ${fmt(s.vals[i])}`; });
        if (o.band && o.band[i]) t += `<br>Pode variar de ${fmt(o.band[i][0])} a ${fmt(o.band[i][1])}`; if (o.ref) t += `<br>${esc(o.ref.label.split(' R$')[0])}: ${fmt(o.ref.v)}`;
        tip.innerHTML = t; tip.style.display = 'block'; tip.style.left = Math.max(4, Math.min(X(i) + 12, W - tip.offsetWidth - 4)) + 'px'; tip.style.top = '14px'; };
      hit.onpointerleave = () => { xh.setAttribute('visibility', 'hidden'); tip.style.display = 'none'; };
    };
    const ro = new ResizeObserver(draw); ro.observe(svg); return draw;
  }
  // série combinada: histórico (12) + projeção (6)
  function cashSeries(rows) { return [...R.cash, ...rows.map(r => r.c)]; }
  function projOnly(rows) { return [...Array(11).fill(null), R.cash[11], ...rows.map(r => r.c)]; }

  // ---------- cabeçalho, utilidades ----------
  const NAV = {
    dirigente: [['visao-geral', 'Resumo'], ['cenarios', 'Previsões'], ['alertas', 'Alertas'], ['relatorio', 'Relatório']],
    gestor: [['painel', 'Números'], ['cenarios', 'Simulador "e se?"'], ['alertas', 'Alertas'], ['pessoas', 'Quem tem acesso'], ['relatorios', 'Relatórios']],
    contador: [['analise', 'Alertas em detalhe'], ['dotacoes', 'Verbas do ano'], ['alarmes', 'Regras dos alertas'], ['notificacoes', 'E-mails'], ['auditoria', 'Histórico'], ['dados', 'De onde vêm os dados']]};
  function header(key, cur) {
    role = key; const r = ROLES[key];
    const el = document.createElement('header'); el.className = 'top';
    el.innerHTML = `<div class="bar"><a class="brand" href="${NAV[key][0][0]}.html" style="color:inherit;text-decoration:none">Radar Fiscal<small>Ciga · protótipo</small></a>
      <div class="who"><span class="badge">Você entrou como: ${r.nome}</span><span>${r.user}</span><a class="btn" href="../../index.html">Trocar de área</a></div></div>
      <nav class="secs" aria-label="Páginas do perfil">${NAV[key].map(([id, t]) => `<a href="${id}.html"${id === cur ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
      <div class="demo">Isto é uma demonstração: os números e as pessoas são inventados. Os dados vão até outubro de 2026.</div>`;
    document.body.prepend(el);
    const t = NAV[key].find(n => n[0] === cur); if (t) document.title = `Radar Fiscal — ${t[1]} · ${r.nome}`;
  }
  let tt; function toast(msg) { let t = document.getElementById('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
    t.textContent = msg; t.style.display = 'block'; clearTimeout(tt); tt = setTimeout(() => t.style.display = 'none', 3500); }
  function printReport() { log('Relatório impresso', 'Relatório da área ' + ROLES[role].nome); try { window.print(); } catch (e) {}
    toast('Se a janela de impressão não abrir, aperte Ctrl+P. Dentro do Claude a impressão fica bloqueada.'); }
  function renderAudit(tbody, filter) { const f = (filter || '').toLowerCase();
    tbody.innerHTML = getAudit().filter(r => !f || r.join(' ').toLowerCase().includes(f)).map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('') || '<tr><td colspan="4">Nenhum evento encontrado.</td></tr>'; }
  const kpi = (l, v, s) => `<div class="kpi"><span>${l}</span><strong>${v}</strong><em>${s}</em></div>`;
  const reservaPadrao = () => rules().find(r => r.id === 'R1').val * R.despMed;
  function finding(rows, reserva) { const br = rows.find(x => x.c < reserva);
    return br ? { t: `O dinheiro em caixa deve ficar abaixo do mínimo de segurança em ${br.m}`, m: br.m, idx: R.MF.indexOf(br.m) } : { t: `O dinheiro em caixa deve ficar acima do mínimo de segurança até ${R.MF[5]}`, m: null, idx: -1 }; }

  return { R, fmt, fmtk, pct, num, esc, store, rules, saveRules, log, getAudit, alerts, renderAlerts, sevTag, chart, cashSeries, projOnly,
    header, NAV, toast, printReport, renderAudit, kpi, reservaPadrao, finding, ROLES, SEV };
})();
