import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from './supabase';
import Dashboard from './Dashboard';
import './styles.css';

const isCreche = (nome) => /CRECHE|\bCMEI\b|\bINFANTIL\b|\bMATERNAL\b|BERÇ?ARIO|JARDIM DE INF/i.test(nome);

const cities = ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Outra cidade'];
const courses = [
  'Administração',
  'Análise e Desenvolvimento de Sistemas',
  'Biomedicina',
  'Ciências Aeronáuticas',
  'Ciências Contábeis',
  'Direito',
  'Disciplina Isolada',
  'Enfermagem',
  'Farmácia',
  'Fisioterapia',
  'Fonoaudiologia',
  'Medicina',
  'Medicina Veterinária',
  'Nutrição',
  'Odontologia',
  'Psicologia',
  'Relações Internacionais',
  'Terapia Ocupacional',
  'Meu curso não está na lista'
];
const reasons = [
  'Localização',
  'Preço ou mensalidade',
  'Qualidade acadêmica',
  'Indicação de amigos ou familiares',
  'Estrutura da instituição',
  'Oferta do curso',
  'Bolsa, desconto ou financiamento',
  'Outro motivo'
];
const channels = [
  'Redes sociais',
  'Pesquisa no Google',
  'Ação realizada na minha escola',
  'Ação realizada na minha cidade',
  'Indicação de amigo ou familiar',
  'Evento, feira ou palestra',
  'Publicidade na internet',
  'Já conhecia a UNINASSAU',
  'Outro canal'
];
const ageRanges = [
  '17 a 22 anos',
  '23 a 27 anos',
  '28 a 34 anos',
  '35 a 44 anos',
  '45 a 59 anos',
  '60 anos ou mais'
];
const empty = {
  matricula: '',
  nomeCompleto: '',
  sexo: '',
  faixaEtaria: '',
  course: '',
  otherCourse: '',
  period: '',
  homeCity: '',
  otherHomeCity: '',
  neighborhood: '',
  otherNeighborhood: '',
  schoolCity: '',
  otherSchoolCity: '',
  schoolCategory: '',
  schoolName: '',
  schoolNetwork: '',
  schoolStatus: '',
  otherSchool: '',
  reason: '',
  otherReason: '',
  channel: '',
  otherChannel: ''
};

function normalizeStr(s) {
  return s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim() : '';
}

function Select({ label, value, onChange, options, disabled }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
        <option value="">Selecione uma opção</option>
        {options.map(x => (
          <option key={x}>{x}</option>
        ))}
      </select>
    </label>
  );
}

function Text({ label, value, onChange, placeholder, disabled }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        value={value}
        placeholder={placeholder || ''}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      />
    </label>
  );
}

function App() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(empty);
  const [sent, setSent] = useState(false);
  const [search, setSearch] = useState('');
  const [logoError, setLogoError] = useState(false);
  const [escolasData, setEscolasData] = useState(null);
  const [escolasLoading, setEscolasLoading] = useState(true);
  const [escolasError, setEscolasError] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(50);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const autocompleteRef = useRef(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch('/data/escolas.json')
      .then(r => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(d => {
        setEscolasData(d);
        setEscolasLoading(false);
      })
      .catch(e => {
        console.error('Erro ao carregar escolas:', e);
        setEscolasError(true);
        setEscolasLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowSchoolDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const nopts = useMemo(() => {
    if (!escolasData || !form.homeCity || form.homeCity === 'Outra cidade') return [];
    const l = [...(escolasData.bairros[form.homeCity] || [])];
    l.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    l.push('Meu bairro não está na lista');
    return l;
  }, [escolasData, form.homeCity]);

  const escolasFiltradas = useMemo(() => {
    if (!escolasData || !form.schoolCity || form.schoolCity === 'Outra cidade' || !form.schoolCategory) return [];
    const cat = form.schoolCategory === 'Pública' ? 'Pública' : 'Privada';
    const lista = (escolasData.escolas[form.schoolCity] && escolasData.escolas[form.schoolCity][cat]) || [];
    const semCreches = lista.filter(e => !isCreche(e.nome));
    if (!search) return semCreches;
    const ns = normalizeStr(search);
    return semCreches.filter(e => normalizeStr(e.nome).includes(ns));
  }, [escolasData, form.schoolCity, form.schoolCategory, search]);

  const baseOpts = useMemo(() => {
    const m = escolasFiltradas.map(e => ({ nome: e.nome, rede: e.rede }));
    m.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    return m.slice(0, displayLimit);
  }, [escolasFiltradas, displayLimit]);

  const schoolOpts = useMemo(() => {
    const o = [...baseOpts];
    if (form.schoolName && form.schoolName !== '__manual__' && !o.some(e => e.nome === form.schoolName)) {
      const cat = form.schoolCategory === 'Pública' ? 'Pública' : 'Privada';
      const fl = escolasData?.escolas?.[form.schoolCity]?.[cat] || [];
      const f = fl.find(e => e.nome === form.schoolName);
      if (f) o.push({ nome: f.nome, rede: f.rede });
    }
    const seen = new Set();
    return o.filter(e => {
      const k = normalizeStr(e.nome);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [baseOpts, form.schoolName, form.schoolCategory, form.schoolCity, escolasData]);

  useEffect(() => {
    setDisplayLimit(50);
  }, [search]);

  const matriculaValid = form.matricula.length > 0 && !/\D/.test(form.matricula);
  const nomeParts = form.nomeCompleto.trim().split(/\s+/).filter(Boolean);
  const nomeValid = nomeParts.length >= 2 && !/^\d+$/.test(form.nomeCompleto.trim());
  const sexoValid = form.sexo !== '';
  const faixaEtariaValid = form.faixaEtaria !== '';

  const valid = [
    matriculaValid && nomeValid && sexoValid && faixaEtariaValid,
    form.course && form.period && (form.course !== 'Meu curso não está na lista' || form.otherCourse),
    form.homeCity && (form.homeCity === 'Outra cidade' ? form.otherHomeCity && form.otherNeighborhood : form.neighborhood && (form.neighborhood !== 'Meu bairro não está na lista' || form.otherNeighborhood)),
    form.schoolCity && form.schoolCategory && (form.schoolCity === 'Outra cidade' ? form.otherSchoolCity && form.otherSchool : form.schoolName && (form.schoolName !== '__manual__' || form.otherSchool)),
    form.reason && form.channel && (form.reason !== 'Outro motivo' || form.otherReason) && (form.channel !== 'Outro canal' || form.otherChannel),
    true
  ][step];

  const escolaDisplay = form.schoolName && form.schoolName !== '__manual__'
    ? form.schoolNetwork ? `${form.schoolName} — ${form.schoolNetwork}` : form.schoolName
    : '';

  const review = [
    ['Matrícula', form.matricula],
    ['Nome completo', form.nomeCompleto],
    ['Sexo', form.sexo],
    ['Faixa etária', form.faixaEtaria],
    ['Curso', form.course === 'Meu curso não está na lista' ? form.otherCourse : form.course],
    ['Período', form.period],
    ['Cidade', form.homeCity === 'Outra cidade' ? form.otherHomeCity : form.homeCity],
    ['Bairro', form.homeCity === 'Outra cidade' || form.neighborhood === 'Meu bairro não está na lista' ? form.otherNeighborhood : form.neighborhood],
    ['Cidade da escola', form.schoolCity === 'Outra cidade' ? form.otherSchoolCity : form.schoolCity],
    ['Categoria', form.schoolCategory],
    ['Escola', form.schoolCity === 'Outra cidade'
      ? form.otherSchool
      : form.schoolName === '__manual__'
        ? `${form.otherSchool} (informada manualmente)`
        : escolaDisplay],
    ['Motivo', form.reason === 'Outro motivo' ? form.otherReason : form.reason],
    ['Canal', form.channel === 'Outro canal' ? form.otherChannel : form.channel]
  ];

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        matricula: form.matricula.trim(),
        nome_completo: form.nomeCompleto.trim(),
        sexo: form.sexo,
        faixa_etaria: form.faixaEtaria,
        curso: form.course === 'Meu curso não está na lista' ? form.otherCourse.trim() : form.course,
        outro_curso: form.course === 'Meu curso não está na lista' ? form.otherCourse.trim() : null,
        periodo: form.period,
        cidade_moradia: form.homeCity === 'Outra cidade' ? form.otherHomeCity.trim() : form.homeCity,
        outra_cidade_moradia: form.homeCity === 'Outra cidade' ? form.otherHomeCity.trim() : null,
        bairro: form.homeCity === 'Outra cidade' || form.neighborhood === 'Meu bairro não está na lista' ? form.otherNeighborhood.trim() : form.neighborhood,
        outro_bairro: form.homeCity === 'Outra cidade' || form.neighborhood === 'Meu bairro não está na lista' ? form.otherNeighborhood.trim() : null,
        cidade_escola: form.schoolCity === 'Outra cidade' ? form.otherSchoolCity.trim() : form.schoolCity,
        outra_cidade_escola: form.schoolCity === 'Outra cidade' ? form.otherSchoolCity.trim() : null,
        categoria_escola: form.schoolCategory,
        nome_escola: form.schoolCity === 'Outra cidade' ? form.otherSchool.trim() : (form.schoolName === '__manual__' ? form.otherSchool.trim() : form.schoolName),
        escola_manual: form.schoolCity === 'Outra cidade' || form.schoolName === '__manual__',
        rede_escola: form.schoolNetwork || null,
        motivo_escolha: form.reason === 'Outro motivo' ? form.otherReason.trim() : form.reason,
        outro_motivo: form.reason === 'Outro motivo' ? form.otherReason.trim() : null,
        canal_conhecimento: form.channel === 'Outro canal' ? form.otherChannel.trim() : form.channel,
        outro_canal: form.channel === 'Outro canal' ? form.otherChannel.trim() : null
      };

      const { error } = await supabase
        .from('respostas_pesquisa_academica')
        .insert([payload]);

      if (error) {
        console.error('Erro no Supabase:', error);
        const isDuplicate = error.code === '23505' ||
                            error.status === 409 ||
                            (error.message && (error.message.includes('unique') || error.message.includes('duplicate') || error.message.includes('23505')));
        if (isDuplicate) {
          setSubmitError('Já existe uma resposta registrada para esta matrícula.');
        } else {
          setSubmitError('Ocorreu um erro ao enviar sua resposta. Tente novamente.');
        }
        return;
      }

      setForm(empty);
      setSent(true);
    } catch (e) {
      console.error('Erro inesperado no envio:', e);
      setSubmitError('Ocorreu um erro ao enviar sua resposta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <main className="center">
        <section className="success">
          <CheckCircle2 />
          <h1>Resposta enviada com sucesso!</h1>
          <p>Obrigado por participar. Seus dados ajudarão no planejamento acadêmico e institucional.</p>
          <button onClick={() => { setForm(empty); setStep(0); setSent(false); setSubmitError(''); }}>
            Enviar nova resposta
          </button>
        </section>
      </main>
    );
  }

  const labels = ['Identificação', 'Acadêmico', 'Localização', 'Escola', 'Escolha', 'Revisão'];
  const titles = ['Identificação', 'Identificação acadêmica', 'Onde você mora', 'Sua escola de origem', 'Sua escolha pela UNINASSAU', 'Revise suas respostas'];

  const handleSchoolCityChange = v => {
    set('schoolCity', v); set('schoolCategory', ''); set('schoolName', ''); set('schoolNetwork', ''); set('schoolStatus', ''); set('otherSchool', ''); setSearch(''); setShowSchoolDropdown(false);
  };
  const handleSchoolCategoryChange = v => {
    set('schoolCategory', v); set('schoolName', ''); set('schoolNetwork', ''); set('schoolStatus', ''); set('otherSchool', ''); setSearch(''); setShowSchoolDropdown(false);
  };
  const handleSchoolSelect = v => {
    if (v === '__manual__') { set('schoolName', '__manual__'); set('schoolNetwork', ''); set('schoolStatus', ''); }
    else { const f = escolasFiltradas.find(e => e.nome === v); set('schoolName', v); set('schoolNetwork', f ? f.rede : ''); set('schoolStatus', f && f.situacao ? f.situacao : ''); }
  };

  return (
    <>
      <div className="top" />
      <main className="layout">
        <aside>
          <div className="brand">
            <div className="brand-logo-wrap">
              {!logoError ? (
                <img
                  src="/assets/branding/logo.png"
                  alt="UNINASSAU"
                  className="brand-logo"
                  onError={() => { console.error('Erro ao carregar logo: /assets/branding/logo.png'); setLogoError(true); }}
                />
              ) : (
                <b className="brand-fallback"><GraduationCapIcon /></b>
              )}
            </div>
            <div><small>UNINASSAU</small><h1>Pesquisa Acadêmica</h1></div>
          </div>
          <p>Conte-nos um pouco sobre sua trajetória. Leva menos de 3 minutos.</p>
          <nav>
            {labels.map((x, i) => (
              <div className={i === step ? 'active' : i < step ? 'done' : ''} key={x}>
                <i>{i < step ? '✓' : i + 1}</i>{x}
              </div>
            ))}
          </nav>
        </aside>

        <section className="content">
          <header>
            <small>Etapa {step + 1} de 6</small>
            <h2>{titles[step]}</h2>
            <div className="progress"><b style={{ width: `${((step + 1) / 6) * 100}%` }} /></div>
          </header>

          <article>
            {step === 0 && (
              <>
                <Text label="Matrícula" value={form.matricula} onChange={v => set('matricula', v.replace(/\s/g, '').replace(/[^0-9]/g, ''))} placeholder="Digite sua matrícula" />
                <Text label="Nome completo" value={form.nomeCompleto} onChange={v => set('nomeCompleto', v.replace(/\s+/g, ' '))} placeholder="Digite seu nome completo" />
                <Select label="Sexo" value={form.sexo} onChange={v => set('sexo', v)} options={['Feminino', 'Masculino', 'Prefiro não informar']} />
                <Select label="Faixa etária" value={form.faixaEtaria} onChange={v => set('faixaEtaria', v)} options={ageRanges} />
              </>
            )}

            {step === 1 && (
              <>
                <Select label="Qual é o seu curso?" value={form.course} onChange={v => set('course', v)} options={courses} />
                {form.course === 'Meu curso não está na lista' && (
                  <Text label="Digite o nome do curso" value={form.otherCourse} onChange={v => set('otherCourse', v)} />
                )}
                <Select label="Qual é o seu período atual?" value={form.period} onChange={v => set('period', v)} options={Array.from({ length: 12 }, (_, i) => `${i + 1}º período`)} />
              </>
            )}

            {step === 2 && (
              <>
                <Select label="Em qual cidade você mora?" value={form.homeCity} onChange={v => { set('homeCity', v); set('neighborhood', ''); }} options={cities} />
                {form.homeCity === 'Outra cidade' ? (
                  <>
                    <Text label="Digite a cidade" value={form.otherHomeCity} onChange={v => set('otherHomeCity', v)} />
                    <Text label="Digite o bairro" value={form.otherNeighborhood} onChange={v => set('otherNeighborhood', v)} />
                  </>
                ) : form.homeCity && (
                  <>
                    <Select label="Selecione seu bairro" value={form.neighborhood} onChange={v => set('neighborhood', v)} options={nopts} />
                    {form.neighborhood === 'Meu bairro não está na lista' && (
                      <Text label="Digite o nome do bairro" value={form.otherNeighborhood} onChange={v => set('otherNeighborhood', v)} />
                    )}
                  </>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <Select label="Cidade da escola onde concluiu o Ensino Médio" value={form.schoolCity} onChange={handleSchoolCityChange} options={cities} />
                {form.schoolCity === 'Outra cidade' ? (
                  <>
                    <Text label="Digite a cidade da escola" value={form.otherSchoolCity} onChange={v => set('otherSchoolCity', v)} />
                    <Select label="A escola era" value={form.schoolCategory} onChange={v => set('schoolCategory', v)} options={['Pública', 'Privada']} />
                    <Text label="Digite o nome completo da escola" value={form.otherSchool} onChange={v => set('otherSchool', v)} />
                  </>
                ) : form.schoolCity && (
                  <>
                    <Select label="A escola era" value={form.schoolCategory} onChange={handleSchoolCategoryChange} options={['Pública', 'Privada']} />
                    {form.schoolCategory && (
                      <>
                        <div className="autocomplete-container" ref={autocompleteRef}>
                          <label className="field" style={{ marginBottom: 0 }}>
                            <span>Digite ou selecione o nome da sua escola</span>
                            <input
                              type="text"
                              placeholder="Comece a digitar o nome da escola..."
                              value={search}
                              onFocus={() => setShowSchoolDropdown(true)}
                              onChange={e => {
                                setSearch(e.target.value);
                                setShowSchoolDropdown(true);
                                if (form.schoolName) {
                                  set('schoolName', '');
                                  set('schoolNetwork', '');
                                }
                              }}
                            />
                          </label>

                          {showSchoolDropdown && (
                            <div className="autocomplete-menu">
                              {escolasLoading ? (
                                <div className="autocomplete-item">Carregando escolas...</div>
                              ) : escolasError ? (
                                <div className="autocomplete-item">Não foi possível carregar a lista.</div>
                              ) : (
                                <>
                                  {schoolOpts.map(e => (
                                    <div
                                      key={e.nome}
                                      className={`autocomplete-item ${form.schoolName === e.nome ? 'selected' : ''}`}
                                      onClick={() => {
                                        set('schoolName', e.nome);
                                        set('schoolNetwork', e.rede);
                                        set('otherSchool', '');
                                        setSearch(e.nome);
                                        setShowSchoolDropdown(false);
                                      }}
                                    >
                                      <span className="autocomplete-item-name">{e.nome}</span>
                                      {e.rede && <span className="autocomplete-item-badge">{e.rede}</span>}
                                    </div>
                                  ))}
                                  <div
                                    className="autocomplete-item autocomplete-item-manual"
                                    onClick={() => {
                                      set('schoolName', '__manual__');
                                      set('schoolNetwork', '');
                                      setSearch('Minha escola não está na lista');
                                      setShowSchoolDropdown(false);
                                    }}
                                  >
                                    + Minha escola não está na lista
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {form.schoolName === '__manual__' && (
                          <Text label="Digite o nome completo da escola" value={form.otherSchool} onChange={v => set('otherSchool', v)} />
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {step === 4 && (
              <>
                <Select label="Principal motivo para escolher a UNINASSAU" value={form.reason} onChange={v => set('reason', v)} options={reasons} />
                {form.reason === 'Outro motivo' && (
                  <Text label="Informe o motivo" value={form.otherReason} onChange={v => set('otherReason', v)} />
                )}
                <Select label="Como ficou sabendo do curso ou da UNINASSAU?" value={form.channel} onChange={v => set('channel', v)} options={channels} />
                {form.channel === 'Outro canal' && (
                  <Text label="Informe o canal" value={form.otherChannel} onChange={v => set('otherChannel', v)} />
                )}
              </>
            )}

            {step === 5 && (
              <>
                <div className="review">
                  {review.map(([k, v]) => (
                    <div key={k}>
                      <small>{k}</small>
                      <strong>{v || 'Não informado'}</strong>
                    </div>
                  ))}
                </div>
                {submitError && (
                  <div style={{ marginTop: '16px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}>
                    {submitError}
                  </div>
                )}
              </>
            )}
          </article>

          <footer>
            <button className="secondary" disabled={step === 0 || submitting} onClick={() => setStep(x => x - 1)}>
              <ChevronLeft />Voltar
            </button>
            {step < 5 ? (
              <button disabled={!valid} onClick={() => valid && setStep(x => x + 1)}>
                Continuar<ChevronRight />
              </button>
            ) : (
              <button className="yellow" disabled={!valid || submitting} onClick={handleSubmit}>
                <CheckCircle2 />{submitting ? 'Enviando...' : 'Enviar pesquisa'}
              </button>
            )}
          </footer>

          <p className="privacy">Seus dados serão utilizados exclusivamente para fins acadêmicos e institucionais.</p>
        </section>
      </main>
    </>
  );
}

function GraduationCapIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function Root() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const isDashboard = currentPath.toLowerCase().startsWith('/dashboard');

  if (isDashboard) {
    return <Dashboard />;
  }

  return <App />;
}

createRoot(document.getElementById('root')).render(<Root />);
