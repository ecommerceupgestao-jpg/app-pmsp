const { useState, useEffect } = React;

const T = {
  void: "#12140F", panel: "#1B1F16", panelLine: "#2A3122",
  olive: "#8FA05E", oliveDim: "#5C6A3E", amber: "#D9A62E",
  brick: "#BD5B3F", ink: "#ECE8DC", inkDim: "#94997F",
};

const INCIDENCIA = [
  { materia: "Português", pct: 33.3 }, { materia: "Matemática", pct: 25.0 },
  { materia: "Informática", pct: 8.3 }, { materia: "História do Brasil", pct: 6.7 },
  { materia: "Geografia do Brasil", pct: 6.7 }, { materia: "Atualidades", pct: 5.0 },
  { materia: "Direito Constitucional", pct: 5.0 }, { materia: "História Geral", pct: 3.3 },
  { materia: "Geografia Geral", pct: 3.3 }, { materia: "Direito Militar", pct: 2.5 },
  { materia: "Adm. Pública", pct: 0.8 },
];

const METAS_PADRAO = [
  { id: "questoes", label: "Responder 20 questões", peso: 2 },
  { id: "flash", label: "Revisar 5 flashcards de erro", peso: 1 },
  { id: "redacao", label: "1 bloco de redação (15 min)", peso: 1 },
];

const BANCO = window.BANCO || [];
const INTERVALOS = [1, 3, 7];
const DOMINIO_APOS = 3;

function todayKey() { return new Date().toISOString().slice(0, 10); }
function somaDias(dataStr, n) { const d = new Date(dataStr + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function daysBetween(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / 86400000);
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function normalizarErro(erro) {
  return { streak_dias_corretos: erro.streak_dias_corretos || [], next_review: erro.next_review || todayKey(), dominado: erro.dominado || false, vezes_errada: erro.vezes_errada || 1, ...erro };
}

/* ---------- ícones simples desenhados na mão (sem dependência externa) ---------- */
function Icon({ type, size = 18, color = T.ink, style }) {
  const s = { width: size, height: size, ...style };
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case "home": return <svg {...s} {...common}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></svg>;
    case "pen": return <svg {...s} {...common}><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" /></svg>;
    case "clock": return <svg {...s} {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l4 2" /></svg>;
    case "flame": return <svg {...s} {...common}><path d="M12 3c1 3-3 4-3 8a3 3 0 006 0c0-2-1-2-1-4 1 1 3 3 3 6a5 5 0 01-10 0c0-4 3-6 5-10z" /></svg>;
    case "target": return <svg {...s} {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" fill={color} /></svg>;
    case "calendar": return <svg {...s} {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>;
    case "calendar-check": return <svg {...s} {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /><path d="M9 14l2 2 4-4" /></svg>;
    case "check": return <svg {...s} {...common}><path d="M5 12l5 5L19 7" /></svg>;
    case "x": return <svg {...s} {...common}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case "chevron-right": return <svg {...s} {...common}><path d="M9 6l6 6-6 6" /></svg>;
    case "settings": return <svg {...s} {...common}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></svg>;
    case "radar": return <svg {...s} {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="M12 12L18 8" /></svg>;
    case "trophy": return <svg {...s} {...common}><path d="M8 3h8v5a4 4 0 01-8 0V3z" /><path d="M8 4H5a2 2 0 002 4M16 4h3a2 2 0 01-2 4" /><path d="M10 15v3h4v-3M9 21h6" /></svg>;
    case "inbox": return <svg {...s} {...common}><path d="M3 12h5l2 3h4l2-3h5" /><path d="M5 5h14l2 7v7H3v-7z" /></svg>;
    case "rotate": return <svg {...s} {...common}><path d="M3 12a9 9 0 1015-6.7" /><path d="M3 4v5h5" /></svg>;
    case "book-x": return <svg {...s} {...common}><path d="M4 4h13a3 3 0 013 3v13H7a3 3 0 01-3-3V4z" /><path d="M9 9l6 6M15 9l-6 6" /></svg>;
    case "help": return <svg {...s} {...common}><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 115 0c0 1.5-2 2-2 3.5" /><circle cx="12" cy="17" r="0.6" fill={color} /></svg>;
    case "info": return <svg {...s} {...common}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="8" r="0.6" fill={color} /></svg>;
    default: return null;
  }
}

function Eyebrow({ children }) {
  return <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.14em", color: T.inkDim, textTransform: "uppercase" }}>{children}</div>;
}
function cornerStyle(pos) {
  const size = 10, base = { position: "absolute", width: size, height: size };
  if (pos === "tl") return { ...base, top: -1, left: -1, borderTop: `2px solid ${T.olive}`, borderLeft: `2px solid ${T.olive}` };
  return { ...base, bottom: -1, right: -1, borderBottom: `2px solid ${T.olive}`, borderRight: `2px solid ${T.olive}` };
}
function Bracket({ children, style }) {
  return <div style={{ position: "relative", ...style }}><span style={cornerStyle("tl")} /><span style={cornerStyle("br")} />{children}</div>;
}
function PrimaryButton({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{ width: "100%", background: T.olive, color: T.void, border: "none", borderRadius: 6, padding: "14px 16px", fontFamily: "'Oswald', sans-serif", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", ...style }}>
      {children}
    </button>
  );
}
function GhostButton({ children, onClick, active }) {
  return (
    <button onClick={onClick} style={{ background: active ? "rgba(217,166,46,0.1)" : "transparent", color: active ? T.amber : T.inkDim, border: `1px solid ${active ? T.amber : T.panelLine}`, borderRadius: 6, padding: "8px 12px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
      {children}
    </button>
  );
}
function AlternativaBtn({ letra, texto, revelada, selecionada, correta, onClick }) {
  const isSel = selecionada === letra;
  let borderColor = T.panelLine, bg = T.panel;
  if (revelada && correta) { borderColor = T.olive; bg = "rgba(143,160,94,0.12)"; }
  else if (revelada && isSel && !correta) { borderColor = T.brick; bg = "rgba(189,91,63,0.12)"; }
  return (
    <button onClick={onClick} disabled={revelada} style={{ display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left", background: bg, border: `1px solid ${borderColor}`, borderRadius: 6, padding: "11px 12px", cursor: revelada ? "default" : "pointer", color: T.ink, fontSize: 13.5, lineHeight: 1.4, width: "100%" }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 12, color: revelada && correta ? T.olive : revelada && isSel ? T.brick : T.inkDim, flexShrink: 0, width: 16 }}>{letra}</span>
      <span style={{ flex: 1 }}>{texto}</span>
      {revelada && correta && <Icon type="check" size={16} color={T.olive} style={{ flexShrink: 0 }} />}
      {revelada && isSel && !correta && <Icon type="x" size={16} color={T.brick} style={{ flexShrink: 0 }} />}
    </button>
  );
}
function Loading({ msg }) {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}><span style={{ fontFamily: "'IBM Plex Mono', monospace", color: T.inkDim, fontSize: 13 }}>{msg}</span></div>;
}

/* ---------- painel com Dica + Explicação (usado em Estudo e Revisão) ---------- */
function PainelQuestao({ q, selecionada, revelada, onResponder, mostrarDica, setMostrarDica }) {
  const errou = revelada && selecionada && selecionada !== q.gabarito;
  return (
    <div>
      <div style={{ background: T.panel, border: `1px solid ${T.panelLine}`, borderRadius: 6, padding: 16, marginBottom: 10 }}>
        <Eyebrow>{q.assunto}</Eyebrow>
        <div style={{ fontSize: 15, lineHeight: 1.5, marginTop: 8 }}>{q.enunciado}</div>
      </div>

      {!revelada && q.dica && (
        <div style={{ marginBottom: 14 }}>
          <GhostButton onClick={() => setMostrarDica(!mostrarDica)} active={mostrarDica}>
            <Icon type="help" size={14} color={mostrarDica ? T.amber : T.inkDim} />
            {mostrarDica ? "Ocultar dica" : "Estou em dúvida — me dá uma dica"}
          </GhostButton>
          {mostrarDica && (
            <div style={{ marginTop: 8, background: "rgba(217,166,46,0.06)", border: `1px solid ${T.amber}`, borderRadius: 6, padding: 12, fontSize: 13, color: T.ink, lineHeight: 1.5 }}>
              {q.dica}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {Object.entries(q.alternativas).map(([letra, texto]) => (
          <AlternativaBtn key={letra} letra={letra} texto={texto} revelada={revelada} selecionada={selecionada} correta={letra === q.gabarito} onClick={() => onResponder(letra)} />
        ))}
      </div>

      {revelada && q.explicacao && (
        <div style={{ marginBottom: 14 }}>
          <GhostButton onClick={() => setMostrarDica(!mostrarDica)} active={mostrarDica}>
            <Icon type="info" size={14} color={mostrarDica ? T.amber : T.inkDim} />
            {mostrarDica ? "Ocultar explicação" : (errou ? "Ver por que errei" : "Ver explicação")}
          </GhostButton>
          {mostrarDica && (
            <div style={{ marginTop: 8, background: T.panel, border: `1px solid ${T.panelLine}`, borderRadius: 6, padding: 12, fontSize: 13, color: T.inkDim, lineHeight: 1.55 }}>
              {q.explicacao}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================== TELA: PAINEL ============================== */
function ReadinessDial({ pct }) {
  const size = 128, stroke = 8, r = (size - stroke) / 2, c = 2 * Math.PI * r, offset = c - (pct / 100) * c;
  const ticks = Array.from({ length: 24 });
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0 }}>
        {ticks.map((_, i) => {
          const angle = (i / ticks.length) * 360, long = i % 6 === 0;
          return <line key={i} x1={size / 2} y1={stroke / 2} x2={size / 2} y2={stroke / 2 + (long ? 6 : 3)} stroke={long ? T.oliveDim : "#3A4230"} strokeWidth={1} transform={`rotate(${angle} ${size / 2} ${size / 2})`} />;
        })}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.panelLine} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.olive} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, fontWeight: 600, color: T.ink }}>{pct}%</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: T.inkDim, letterSpacing: "0.1em" }}>PRONTIDÃO</span>
      </div>
    </div>
  );
}

function TelaPainel({ irPara }) {
  const [loaded, setLoaded] = useState(false);
  const [examDate, setExamDate] = useState("");
  const [editingDate, setEditingDate] = useState(false);
  const [streak, setStreak] = useState({ count: 0, lastDate: null });
  const [goalsDone, setGoalsDone] = useState({});
  const [historicoPontos, setHistoricoPontos] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [d, s, g, h] = await Promise.all([
          window.storage.get("examDate").catch(() => null),
          window.storage.get("streak").catch(() => null),
          window.storage.get(`goals:${todayKey()}`).catch(() => null),
          window.storage.get("historicoPontos").catch(() => null),
        ]);
        if (d) setExamDate(JSON.parse(d.value));
        if (s) setStreak(JSON.parse(s.value));
        if (g) setGoalsDone(JSON.parse(g.value));
        if (h) setHistoricoPontos(JSON.parse(h.value));
      } catch (e) { console.error(e); } finally { setLoaded(true); }
    })();
  }, []);

  async function saveExamDate(value) {
    setExamDate(value); setEditingDate(false);
    try { await window.storage.set("examDate", JSON.stringify(value)); } catch (e) { console.error(e); }
  }
  async function toggleGoal(id, peso) {
    const next = { ...goalsDone, [id]: !goalsDone[id] };
    setGoalsDone(next);
    try { await window.storage.set(`goals:${todayKey()}`, JSON.stringify(next)); } catch (e) { console.error(e); }
    const justCompleted = !goalsDone[id];
    if (justCompleted) {
      const newPontos = historicoPontos + peso;
      setHistoricoPontos(newPontos);
      window.storage.set("historicoPontos", JSON.stringify(newPontos)).catch((e) => console.error(e));
      const today = todayKey();
      if (streak.lastDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        const count = streak.lastDate === yesterday ? streak.count + 1 : 1;
        const nextStreak = { count, lastDate: today };
        setStreak(nextStreak);
        window.storage.set("streak", JSON.stringify(nextStreak)).catch((e) => console.error(e));
      }
    }
  }

  const dias = daysBetween(examDate);
  const prontidao = Math.min(100, Math.round(historicoPontos * 1.6));
  const metasCompletas = METAS_PADRAO.filter((m) => goalsDone[m.id]).length;

  if (!loaded) return <Loading msg="carregando painel…" />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.olive, letterSpacing: "0.16em" }}>PMESP · SD 2ª CLASSE</div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 600, marginTop: 2 }}>PAINEL DE PRONTIDÃO</div>
        </div>
        <button onClick={() => setEditingDate(true)} style={{ background: "none", border: "none", color: T.inkDim, padding: 6, cursor: "pointer" }} aria-label="Configurar data da prova">
          <Icon type="settings" size={18} color={T.inkDim} />
        </button>
      </div>

      <Bracket style={{ background: T.panel, border: `1px solid ${T.panelLine}`, borderRadius: 6, padding: "14px 16px", marginBottom: 14 }}>
        {editingDate || !examDate ? (
          <div>
            <Eyebrow>Data da próxima prova</Eyebrow>
            <input type="date" defaultValue={examDate || ""} onChange={(e) => saveExamDate(e.target.value)}
              style={{ width: "100%", marginTop: 8, background: T.void, border: `1px solid ${T.panelLine}`, borderRadius: 4, color: T.ink, padding: "8px 10px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 }} />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <Eyebrow><Icon type="calendar" size={11} color={T.inkDim} style={{ verticalAlign: "-2px", marginRight: 4 }} />Contagem regressiva</Eyebrow>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, color: T.inkDim }}>
                {new Date(examDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </div>
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 32, fontWeight: 600, color: dias <= 30 ? T.amber : T.ink, lineHeight: 1 }}>D–{dias >= 0 ? dias : 0}</div>
          </div>
        )}
      </Bracket>

      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <Bracket style={{ flex: 1.3, background: T.panel, border: `1px solid ${T.panelLine}`, borderRadius: 6, padding: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <ReadinessDial pct={prontidao} />
          <div style={{ fontSize: 11, color: T.inkDim, marginTop: 8, textAlign: "center" }}>Sobe conforme você cumpre metas</div>
        </Bracket>
        <Bracket style={{ flex: 1, background: T.panel, border: `1px solid ${T.panelLine}`, borderRadius: 6, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <Eyebrow>Sequência</Eyebrow>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <Icon type="flame" size={20} color={streak.count > 0 ? T.amber : T.inkDim} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 26, fontWeight: 600 }}>{streak.count}</span>
          </div>
          <div style={{ fontSize: 11, color: T.inkDim }}>{streak.count === 0 ? "comece hoje" : streak.count === 1 ? "dia consecutivo" : "dias consecutivos"}</div>
        </Bracket>
      </div>

      <Bracket style={{ background: T.panel, border: `1px solid ${T.panelLine}`, borderRadius: 6, padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Eyebrow><Icon type="target" size={11} color={T.inkDim} style={{ verticalAlign: "-2px", marginRight: 4 }} />Metas de hoje</Eyebrow>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.inkDim }}>{metasCompletas}/{METAS_PADRAO.length}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {METAS_PADRAO.map((m) => {
            const done = !!goalsDone[m.id];
            return (
              <button key={m.id} onClick={() => toggleGoal(m.id, m.peso)} style={{ display: "flex", alignItems: "center", gap: 10, background: done ? "rgba(143,160,94,0.1)" : T.void, border: `1px solid ${done ? T.oliveDim : T.panelLine}`, borderRadius: 5, padding: "10px 12px", cursor: "pointer", textAlign: "left", width: "100%" }}>
                <span style={{ width: 18, height: 18, borderRadius: 3, border: `1.5px solid ${done ? T.olive : T.inkDim}`, background: done ? T.olive : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {done && <Icon type="check" size={12} color={T.void} />}
                </span>
                <span style={{ fontSize: 14, color: done ? T.inkDim : T.ink, textDecoration: done ? "line-through" : "none" }}>{m.label}</span>
              </button>
            );
          })}
        </div>
      </Bracket>

      <Bracket style={{ background: T.panel, border: `1px solid ${T.panelLine}`, borderRadius: 6, padding: 16, marginBottom: 16 }}>
        <Eyebrow><Icon type="radar" size={11} color={T.inkDim} style={{ verticalAlign: "-2px", marginRight: 4 }} />Onde mais cai · VUNESP</Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 6 }}>
          {INCIDENCIA.map((m) => (
            <div key={m.materia} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: T.inkDim, width: 108, flexShrink: 0 }}>{m.materia}</span>
              <div style={{ flex: 1, height: 6, background: T.void, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(m.pct / 33.3) * 100}%`, background: m.pct >= 20 ? T.amber : T.oliveDim, borderRadius: 3 }} />
              </div>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.inkDim, width: 32, textAlign: "right" }}>{m.pct}%</span>
            </div>
          ))}
        </div>
      </Bracket>

      <PrimaryButton onClick={() => irPara("estudo")}>INICIAR SESSÃO DE ESTUDO<Icon type="chevron-right" size={18} color={T.void} /></PrimaryButton>
    </div>
  );
}

/* ============================== TELA: ESTUDO ============================== */
function TelaEstudo() {
  const [fase, setFase] = useState("carregando");
  const [fila, setFila] = useState([]);
  const [idx, setIdx] = useState(0);
  const [selecionada, setSelecionada] = useState(null);
  const [revelada, setRevelada] = useState(false);
  const [mostrarPainel, setMostrarPainel] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [erradasSessao, setErradasSessao] = useState([]);
  const [errosSalvos, setErrosSalvos] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("banco_erros").catch(() => null);
        if (r) setErrosSalvos(JSON.parse(r.value));
      } catch (e) { console.error(e); }
      iniciarSessao();
    })();
  }, []);

  function iniciarSessao() {
    setFila(shuffle(BANCO).slice(0, 10)); setIdx(0); setSelecionada(null);
    setRevelada(false); setMostrarPainel(false); setAcertos(0); setErradasSessao([]); setFase("sessao");
  }

  async function responder(letra) {
    if (revelada) return;
    setSelecionada(letra); setRevelada(true); setMostrarPainel(false);
    const q = fila[idx];
    const correta = letra === q.gabarito;
    if (correta) { setAcertos((a) => a + 1); }
    else {
      setErradasSessao((e) => [...e, q]);
      const novoBanco = { ...errosSalvos, [q.id]: { ...q, vezes_errada: (errosSalvos[q.id]?.vezes_errada || 0) + 1, ultima_vez: new Date().toISOString() } };
      setErrosSalvos(novoBanco);
      try { await window.storage.set("banco_erros", JSON.stringify(novoBanco)); } catch (e) { console.error(e); }
    }
  }
  function proxima() {
    setMostrarPainel(false);
    if (idx + 1 >= fila.length) setFase("resumo");
    else { setIdx((i) => i + 1); setSelecionada(null); setRevelada(false); }
  }

  if (fase === "carregando" || fila.length === 0) return <Loading msg="carregando sessão…" />;
  const q = fila[idx];
  const pct = Math.round((acertos / fila.length) * 100);

  return (
    <div>
      {fase === "sessao" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: T.olive, letterSpacing: "0.1em" }}>QUESTÃO {idx + 1}/{fila.length}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: T.inkDim }}>{q.materia} · {q.banca}</div>
          </div>
          <div style={{ display: "flex", gap: 3, marginBottom: 18 }}>
            {fila.map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < idx ? T.olive : i === idx ? T.amber : T.panelLine }} />)}
          </div>

          <PainelQuestao q={q} selecionada={selecionada} revelada={revelada} onResponder={responder} mostrarDica={mostrarPainel} setMostrarDica={setMostrarPainel} />

          {revelada && (
            <PrimaryButton onClick={proxima}>{idx + 1 >= fila.length ? "VER RESULTADO" : "PRÓXIMA QUESTÃO"}<Icon type="chevron-right" size={18} color={T.void} /></PrimaryButton>
          )}
        </>
      )}

      {fase === "resumo" && (
        <div>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <Icon type="trophy" size={32} color={T.amber} style={{ marginBottom: 8 }} />
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 600 }}>SESSÃO CONCLUÍDA</div>
          </div>
          <div style={{ background: T.panel, border: `1px solid ${T.panelLine}`, borderRadius: 6, padding: 20, marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 42, fontWeight: 600, color: pct >= 70 ? T.olive : pct >= 40 ? T.amber : T.brick }}>{pct}%</div>
            <div style={{ fontSize: 13, color: T.inkDim, marginTop: 4 }}>{acertos} de {fila.length} questões corretas</div>
          </div>
          {erradasSessao.length > 0 && (
            <div style={{ background: T.panel, border: `1px solid ${T.panelLine}`, borderRadius: 6, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Icon type="book-x" size={14} color={T.brick} /><Eyebrow>Foram para o banco de erros</Eyebrow></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {erradasSessao.map((e) => (
                  <div key={e.id} style={{ fontSize: 13, color: T.inkDim, display: "flex", justifyContent: "space-between" }}>
                    <span>{e.assunto}</span><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.brick }}>resposta: {e.gabarito}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: T.inkDim, marginTop: 10, lineHeight: 1.4 }}>Voltam nas revisões até você acertar 3 vezes em dias diferentes.</div>
            </div>
          )}
          <PrimaryButton onClick={iniciarSessao}><Icon type="rotate" size={16} color={T.void} />NOVA SESSÃO</PrimaryButton>
        </div>
      )}
    </div>
  );
}

/* ============================== TELA: REVISÃO ============================== */
function TelaRevisao() {
  const [carregando, setCarregando] = useState(true);
  const [bancoErros, setBancoErros] = useState({});
  const [fila, setFila] = useState([]);
  const [idx, setIdx] = useState(0);
  const [selecionada, setSelecionada] = useState(null);
  const [revelada, setRevelada] = useState(false);
  const [mostrarPainel, setMostrarPainel] = useState(false);
  const [dominadosHoje, setDominadosHoje] = useState([]);
  const [fase, setFase] = useState("revisando");

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("banco_erros").catch(() => null);
        const banco = r ? JSON.parse(r.value) : {};
        const normalizado = {};
        Object.entries(banco).forEach(([id, e]) => (normalizado[id] = normalizarErro(e)));
        setBancoErros(normalizado);
        const t = todayKey();
        const devidos = Object.values(normalizado).filter((e) => !e.dominado && e.next_review <= t);
        setFila(devidos);
        setFase(devidos.length === 0 ? "vazio" : "revisando");
      } catch (e) { console.error(e); setFase("vazio"); } finally { setCarregando(false); }
    })();
  }, []);

  async function salvarBanco(novoBanco) {
    setBancoErros(novoBanco);
    try { await window.storage.set("banco_erros", JSON.stringify(novoBanco)); } catch (e) { console.error(e); }
  }
  async function responder(letra) {
    if (revelada) return;
    setSelecionada(letra); setRevelada(true); setMostrarPainel(false);
    const item = fila[idx];
    const correta = letra === item.gabarito;
    const t = todayKey();
    const atual = bancoErros[item.id] || normalizarErro(item);
    let atualizado;
    if (correta) {
      const jaContaHoje = atual.streak_dias_corretos.includes(t);
      const novoStreak = jaContaHoje ? atual.streak_dias_corretos : [...atual.streak_dias_corretos, t];
      const nivel = novoStreak.length;
      const dominado = nivel >= DOMINIO_APOS;
      const intervalo = INTERVALOS[Math.min(nivel - 1, INTERVALOS.length - 1)];
      atualizado = { ...atual, streak_dias_corretos: novoStreak, dominado, next_review: dominado ? null : somaDias(t, intervalo) };
      if (dominado) setDominadosHoje((d) => [...d, item]);
    } else {
      atualizado = { ...atual, vezes_errada: (atual.vezes_errada || 0) + 1, next_review: somaDias(t, 1) };
    }
    await salvarBanco({ ...bancoErros, [item.id]: atualizado });
  }
  function proxima() {
    setMostrarPainel(false);
    if (idx + 1 >= fila.length) setFase("resumo");
    else { setIdx((i) => i + 1); setSelecionada(null); setRevelada(false); }
  }
  function recarregar() {
    setIdx(0); setSelecionada(null); setRevelada(false); setDominadosHoje([]); setMostrarPainel(false);
    const t = todayKey();
    const devidos = Object.values(bancoErros).filter((e) => !e.dominado && e.next_review <= t);
    setFila(devidos); setFase(devidos.length === 0 ? "vazio" : "revisando");
  }

  if (carregando) return <Loading msg="verificando pendências…" />;

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.olive, letterSpacing: "0.16em" }}>REVISÃO ESPAÇADA</div>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, fontWeight: 600, marginTop: 2 }}>O QUE ESTÁ PRA VENCER</div>
      </div>

      {fase === "vazio" && (
        <div style={{ background: T.panel, border: `1px solid ${T.panelLine}`, borderRadius: 6, padding: 28, textAlign: "center" }}>
          <Icon type="inbox" size={28} color={T.oliveDim} style={{ marginBottom: 10 }} />
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, marginBottom: 6 }}>Nada pendente hoje</div>
          <div style={{ fontSize: 13, color: T.inkDim, lineHeight: 1.5 }}>
            {Object.keys(bancoErros).length === 0 ? "Seu banco de erros está vazio. Responda questões na aba Estudo para começar." : "Tudo revisado por hoje. Volte mais tarde."}
          </div>
        </div>
      )}

      {fase === "revisando" && fila[idx] && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: T.amber }}>PENDENTE {idx + 1}/{fila.length}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.inkDim }}>errou {fila[idx].vezes_errada}x · {(fila[idx].streak_dias_corretos || []).length}/{DOMINIO_APOS} p/ domínio</div>
          </div>
          <div style={{ display: "flex", gap: 3, marginBottom: 18 }}>
            {fila.map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < idx ? T.olive : i === idx ? T.amber : T.panelLine }} />)}
          </div>

          <PainelQuestao q={fila[idx]} selecionada={selecionada} revelada={revelada} onResponder={responder} mostrarDica={mostrarPainel} setMostrarDica={setMostrarPainel} />

          {revelada && (
            <>
              <div style={{ fontSize: 12, color: T.inkDim, marginBottom: 10, textAlign: "center" }}>
                {selecionada === fila[idx].gabarito
                  ? (bancoErros[fila[idx].id]?.dominado ? "Domínio confirmado — sai da fila de revisão." : `Volta em ${INTERVALOS[Math.min((bancoErros[fila[idx].id]?.streak_dias_corretos.length || 1) - 1, INTERVALOS.length - 1)]} dia(s).`)
                  : "Sem problema — volta amanhã."}
              </div>
              <PrimaryButton onClick={proxima}>{idx + 1 >= fila.length ? "FINALIZAR REVISÃO" : "PRÓXIMO PENDENTE"}<Icon type="chevron-right" size={18} color={T.void} /></PrimaryButton>
            </>
          )}
        </>
      )}

      {fase === "resumo" && (
        <div>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <Icon type="calendar-check" size={30} color={T.olive} style={{ marginBottom: 8 }} />
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, fontWeight: 600 }}>REVISÃO CONCLUÍDA</div>
          </div>
          {dominadosHoje.length > 0 && (
            <div style={{ background: T.panel, border: `1px solid ${T.oliveDim}`, borderRadius: 6, padding: 16, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}><Icon type="flame" size={14} color={T.amber} /><Eyebrow>Dominados agora</Eyebrow></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {dominadosHoje.map((d) => <div key={d.id} style={{ fontSize: 13, color: T.ink }}>{d.assunto}</div>)}
              </div>
            </div>
          )}
          <div style={{ fontSize: 12, color: T.inkDim, marginBottom: 16, lineHeight: 1.5, textAlign: "center" }}>Os itens pendentes voltam na data certa, sem você precisar decidir nada.</div>
          <PrimaryButton onClick={recarregar}><Icon type="rotate" size={16} color={T.void} />VERIFICAR DE NOVO</PrimaryButton>
        </div>
      )}
    </div>
  );
}

/* ============================== APP SHELL ============================== */
const ABAS = [
  { id: "painel", label: "Painel", icone: "home" },
  { id: "estudo", label: "Estudo", icone: "pen" },
  { id: "revisao", label: "Revisão", icone: "clock" },
];

function AppPMESP() {
  const [aba, setAba] = useState("painel");
  return (
    <div style={{ background: T.void, minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "18px 16px 90px", color: T.ink }}>
        {aba === "painel" && <TelaPainel irPara={setAba} />}
        {aba === "estudo" && <TelaEstudo />}
        {aba === "revisao" && <TelaRevisao />}
      </div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.panel, borderTop: `1px solid ${T.panelLine}`, paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex" }}>
          {ABAS.map(({ id, label, icone }) => {
            const ativo = aba === id;
            return (
              <button key={id} onClick={() => setAba(id)} style={{ flex: 1, background: "none", border: "none", padding: "10px 0 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <Icon type={icone} size={19} color={ativo ? T.olive : T.inkDim} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.06em", color: ativo ? T.olive : T.inkDim }}>{label.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<AppPMESP />);
