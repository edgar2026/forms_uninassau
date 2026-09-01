import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabase';
import {
  RefreshCw,
  Filter,
  Download,
  Search,
  Users,
  Calendar,
  GraduationCap,
  Building2,
  PieChart,
  BarChart3,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2
} from 'lucide-react';

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDateOnly(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('pt-BR');
}

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [logoError, setLogoError] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    curso: '',
    periodo: '',
    sexo: '',
    faixaEtaria: '',
    cidadeMoradia: '',
    bairro: '',
    cidadeEscola: '',
    categoriaEscola: '',
    escola: '',
    motivoEscolha: '',
    canalConhecimento: ''
  });

  // Table state
  const [searchMatricula, setSearchMatricula] = useState('');
  const [searchNome, setSearchNome] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: err } = await supabase
        .from('respostas_pesquisa_academica')
        .select('*')
        .order('criado_em', { ascending: false });

      if (err) throw err;
      setData(rows || []);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Erro ao carregar dados do Supabase:', e);
      setError('Erro ao carregar os dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      curso: '',
      periodo: '',
      sexo: '',
      faixaEtaria: '',
      cidadeMoradia: '',
      bairro: '',
      cidadeEscola: '',
      categoriaEscola: '',
      escola: '',
      motivoEscolha: '',
      canalConhecimento: ''
    });
    setSearchMatricula('');
    setSearchNome('');
    setPage(1);
  };

  // Distinct values for filter dropdowns (derived from all data)
  const filterOptions = useMemo(() => {
    const getUnique = field => [...new Set(data.map(item => item[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return {
      cursos: getUnique('curso'),
      periodos: getUnique('periodo'),
      sexos: getUnique('sexo'),
      faixasEtarias: getUnique('faixa_etaria'),
      cidadesMoradia: getUnique('cidade_moradia'),
      bairros: getUnique('bairro'),
      cidadesEscola: getUnique('cidade_escola'),
      categoriasEscola: getUnique('categoria_escola'),
      escolas: getUnique('nome_escola'),
      motivos: getUnique('motivo_escolha'),
      canais: getUnique('canal_conhecimento')
    };
  }, [data]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filters.startDate) {
        const itemDate = new Date(item.criado_em);
        const start = new Date(filters.startDate + 'T00:00:00');
        if (itemDate < start) return false;
      }
      if (filters.endDate) {
        const itemDate = new Date(item.criado_em);
        const end = new Date(filters.endDate + 'T23:59:59');
        if (itemDate > end) return false;
      }
      if (filters.curso && item.curso !== filters.curso) return false;
      if (filters.periodo && item.periodo !== filters.periodo) return false;
      if (filters.sexo && item.sexo !== filters.sexo) return false;
      if (filters.faixaEtaria && item.faixa_etaria !== filters.faixaEtaria) return false;
      if (filters.cidadeMoradia && item.cidade_moradia !== filters.cidadeMoradia) return false;
      if (filters.bairro && item.bairro !== filters.bairro) return false;
      if (filters.cidadeEscola && item.cidade_escola !== filters.cidadeEscola) return false;
      if (filters.categoriaEscola && item.categoria_escola !== filters.categoriaEscola) return false;
      if (filters.escola && item.nome_escola !== filters.escola) return false;
      if (filters.motivoEscolha && item.motivo_escolha !== filters.motivoEscolha) return false;
      if (filters.canalConhecimento && item.canal_conhecimento !== filters.canalConhecimento) return false;

      return true;
    });
  }, [data, filters]);

  // Indicators calculations
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const total = filteredData.length;
    let todayCount = 0;
    let last7DaysCount = 0;
    let last30DaysCount = 0;

    const cursosSet = new Set();
    const escolasSet = new Set();
    let manualBairrosCount = 0;
    let manualEscolasCount = 0;

    filteredData.forEach(item => {
      const d = new Date(item.criado_em);
      if (d >= todayStart) todayCount++;
      if (d >= sevenDaysAgo) last7DaysCount++;
      if (d >= thirtyDaysAgo) last30DaysCount++;

      if (item.curso) cursosSet.add(item.curso);
      if (item.nome_escola) escolasSet.add(item.nome_escola);
      if (item.outro_bairro || item.bairro === 'Meu bairro não está na lista') manualBairrosCount++;
      if (item.escola_manual) manualEscolasCount++;
    });

    return {
      total,
      todayCount,
      last7DaysCount,
      last30DaysCount,
      cursosCount: cursosSet.size,
      escolasCount: escolasSet.size,
      manualBairrosCount,
      manualEscolasCount
    };
  }, [filteredData]);

  // Distribution breakdowns
  const distributions = useMemo(() => {
    const countBy = field => {
      const counts = {};
      filteredData.forEach(item => {
        const val = item[field] || 'Não informado';
        counts[val] = (counts[val] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1]);
    };

    return {
      byCurso: countBy('curso'),
      byPeriodo: countBy('periodo'),
      bySexo: countBy('sexo'),
      byFaixaEtaria: countBy('faixa_etaria'),
      byCidadeMoradia: countBy('cidade_moradia'),
      byBairro: countBy('bairro').slice(0, 10),
      byCidadeEscola: countBy('cidade_escola'),
      byCategoriaEscola: countBy('categoria_escola'),
      byTopEscolas: countBy('nome_escola').slice(0, 10),
      byMotivo: countBy('motivo_escolha'),
      byCanal: countBy('canal_conhecimento')
    };
  }, [filteredData]);

  // Table filtering, sorting, pagination
  const tableData = useMemo(() => {
    let result = [...filteredData];

    if (searchMatricula.trim()) {
      const q = searchMatricula.trim().toLowerCase();
      result = result.filter(item => item.matricula.toLowerCase().includes(q));
    }

    if (searchNome.trim()) {
      const q = searchNome.trim().toLowerCase();
      result = result.filter(item => item.nome_completo.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      const dA = new Date(a.criado_em).getTime();
      const dB = new Date(b.criado_em).getTime();
      return sortOrder === 'asc' ? dA - dB : dB - dA;
    });

    return result;
  }, [filteredData, searchMatricula, searchNome, sortOrder]);

  const totalPages = Math.ceil(tableData.length / pageSize) || 1;
  const paginatedTableData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return tableData.slice(start, start + pageSize);
  }, [tableData, page, pageSize]);

  // CSV Export
  const handleExportCSV = () => {
    if (tableData.length === 0) return;

    const headers = [
      'Data/Hora',
      'Matrícula',
      'Nome Completo',
      'Sexo',
      'Faixa Etária',
      'Curso',
      'Curso (Outro)',
      'Período',
      'Cidade Moradia',
      'Cidade Moradia (Outra)',
      'Bairro',
      'Bairro (Outro)',
      'Cidade Escola',
      'Cidade Escola (Outra)',
      'Categoria Escola',
      'Nome Escola',
      'Escola Manual',
      'Rede Escola',
      'Motivo Escolha',
      'Motivo Escolha (Outro)',
      'Canal Conhecimento',
      'Canal Conhecimento (Outro)'
    ];

    const escapeCSV = str => {
      if (str === null || str === undefined) return '""';
      const text = String(str).replace(/"/g, '""');
      return `"${text}"`;
    };

    const rows = tableData.map(item => [
      escapeCSV(formatDate(item.criado_em)),
      escapeCSV(item.matricula),
      escapeCSV(item.nome_completo),
      escapeCSV(item.sexo),
      escapeCSV(item.faixa_etaria || ''),
      escapeCSV(item.curso),
      escapeCSV(item.outro_curso || ''),
      escapeCSV(item.periodo),
      escapeCSV(item.cidade_moradia),
      escapeCSV(item.outra_cidade_moradia || ''),
      escapeCSV(item.bairro),
      escapeCSV(item.outro_bairro || ''),
      escapeCSV(item.cidade_escola),
      escapeCSV(item.outra_cidade_escola || ''),
      escapeCSV(item.categoria_escola),
      escapeCSV(item.nome_escola),
      escapeCSV(item.escola_manual ? 'Sim' : 'Não'),
      escapeCSV(item.rede_escola || ''),
      escapeCSV(item.motivo_escolha),
      escapeCSV(item.outro_motivo || ''),
      escapeCSV(item.canal_conhecimento),
      escapeCSV(item.outro_canal || '')
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pesquisa_academica_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean) || searchMatricula || searchNome;

  return (
    <div className="db-root">
      <div className="top" />

      {/* Header */}
      <header className="db-header">
        <div className="db-header-container">
          <div className="db-brand">
            <div className="brand-logo-wrap">
              {!logoError ? (
                <img
                  src="/assets/branding/logo.png"
                  alt="UNINASSAU"
                  className="brand-logo"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <b className="brand-fallback">
                  <GraduationCap />
                </b>
              )}
            </div>
            <div>
              <small>UNINASSAU</small>
              <h1>Dashboard da Pesquisa Acadêmica</h1>
              {lastUpdated && (
                <p className="db-last-updated">
                  Última atualização: {formatDate(lastUpdated)}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="db-btn db-btn-refresh"
          >
            <RefreshCw className={loading ? 'spin' : ''} size={16} />
            <span>{loading ? 'Atualizando...' : 'Atualizar dados'}</span>
          </button>
        </div>
      </header>

      <main className="db-main">
        {error ? (
          <div className="db-alert db-alert-error">
            <p>{error}</p>
            <button onClick={fetchData} className="db-btn db-btn-sm">Tentar novamente</button>
          </div>
        ) : loading && data.length === 0 ? (
          <div className="db-loading-state">
            <RefreshCw className="spin" size={32} />
            <p>Carregando dados da pesquisa...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="db-empty-state">
            <Users size={48} />
            <h2>Nenhuma resposta cadastrada ainda</h2>
            <p>Os dados aparecerão aqui conforme os alunos preencherem o formulário.</p>
          </div>
        ) : (
          <>
            {/* Filters Section */}
            <section className="db-card db-filters-card">
              <div className="db-filters-header">
                <div className="db-filters-title">
                  <Filter size={18} />
                  <h3>Filtros de Pesquisa</h3>
                </div>
                {hasActiveFilters && (
                  <button onClick={handleClearFilters} className="db-btn-text">
                    <X size={14} /> Limpar filtros
                  </button>
                )}
              </div>

              <div className="db-filters-grid">
                <div className="db-field">
                  <label>Data inicial</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={e => handleFilterChange('startDate', e.target.value)}
                  />
                </div>

                <div className="db-field">
                  <label>Data final</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={e => handleFilterChange('endDate', e.target.value)}
                  />
                </div>

                <div className="db-field">
                  <label>Curso</label>
                  <select
                    value={filters.curso}
                    onChange={e => handleFilterChange('curso', e.target.value)}
                  >
                    <option value="">Todos os cursos</option>
                    {filterOptions.cursos.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="db-field">
                  <label>Período</label>
                  <select
                    value={filters.periodo}
                    onChange={e => handleFilterChange('periodo', e.target.value)}
                  >
                    <option value="">Todos os períodos</option>
                    {filterOptions.periodos.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="db-field">
                  <label>Sexo</label>
                  <select
                    value={filters.sexo}
                    onChange={e => handleFilterChange('sexo', e.target.value)}
                  >
                    <option value="">Todos</option>
                    {filterOptions.sexos.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="db-field">
                  <label>Faixa Etária</label>
                  <select
                    value={filters.faixaEtaria}
                    onChange={e => handleFilterChange('faixaEtaria', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {filterOptions.faixasEtarias.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="db-field">
                  <label>Cidade de Moradia</label>
                  <select
                    value={filters.cidadeMoradia}
                    onChange={e => handleFilterChange('cidadeMoradia', e.target.value)}
                  >
                    <option value="">Todas as cidades</option>
                    {filterOptions.cidadesMoradia.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="db-field">
                  <label>Bairro</label>
                  <select
                    value={filters.bairro}
                    onChange={e => handleFilterChange('bairro', e.target.value)}
                  >
                    <option value="">Todos os bairros</option>
                    {filterOptions.bairros.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div className="db-field">
                  <label>Cidade da Escola</label>
                  <select
                    value={filters.cidadeEscola}
                    onChange={e => handleFilterChange('cidadeEscola', e.target.value)}
                  >
                    <option value="">Todas as cidades</option>
                    {filterOptions.cidadesEscola.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="db-field">
                  <label>Categoria da Escola</label>
                  <select
                    value={filters.categoriaEscola}
                    onChange={e => handleFilterChange('categoriaEscola', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {filterOptions.categoriasEscola.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="db-field">
                  <label>Escola de Origem</label>
                  <select
                    value={filters.escola}
                    onChange={e => handleFilterChange('escola', e.target.value)}
                  >
                    <option value="">Todas as escolas</option>
                    {filterOptions.escolas.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>

                <div className="db-field">
                  <label>Motivo da Escolha</label>
                  <select
                    value={filters.motivoEscolha}
                    onChange={e => handleFilterChange('motivoEscolha', e.target.value)}
                  >
                    <option value="">Todos os motivos</option>
                    {filterOptions.motivos.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="db-field">
                  <label>Canal de Conhecimento</label>
                  <select
                    value={filters.canalConhecimento}
                    onChange={e => handleFilterChange('canalConhecimento', e.target.value)}
                  >
                    <option value="">Todos os canais</option>
                    {filterOptions.canais.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Metrics Cards Grid */}
            <section className="db-metrics-grid">
              <div className="db-metric-card">
                <div className="db-metric-icon icon-blue"><Users size={24} /></div>
                <div className="db-metric-info">
                  <span className="db-metric-value">{metrics.total}</span>
                  <span className="db-metric-label">Total de Respostas</span>
                </div>
              </div>

              <div className="db-metric-card">
                <div className="db-metric-icon icon-yellow"><Calendar size={24} /></div>
                <div className="db-metric-info">
                  <span className="db-metric-value">{metrics.todayCount}</span>
                  <span className="db-metric-label">Recebidas Hoje</span>
                </div>
              </div>

              <div className="db-metric-card">
                <div className="db-metric-icon icon-teal"><Calendar size={24} /></div>
                <div className="db-metric-info">
                  <span className="db-metric-value">{metrics.last7DaysCount}</span>
                  <span className="db-metric-label">Últimos 7 dias</span>
                </div>
              </div>

              <div className="db-metric-card">
                <div className="db-metric-icon icon-purple"><Calendar size={24} /></div>
                <div className="db-metric-info">
                  <span className="db-metric-value">{metrics.last30DaysCount}</span>
                  <span className="db-metric-label">Últimos 30 dias</span>
                </div>
              </div>

              <div className="db-metric-card">
                <div className="db-metric-icon icon-indigo"><GraduationCap size={24} /></div>
                <div className="db-metric-info">
                  <span className="db-metric-value">{metrics.cursosCount}</span>
                  <span className="db-metric-label">Cursos Representados</span>
                </div>
              </div>

              <div className="db-metric-card">
                <div className="db-metric-icon icon-orange"><Building2 size={24} /></div>
                <div className="db-metric-info">
                  <span className="db-metric-value">{metrics.escolasCount}</span>
                  <span className="db-metric-label">Escolas Informadas</span>
                </div>
              </div>
            </section>

            {/* Manual entries summary banner */}
            <div className="db-banner-manual">
              <div>
                <strong>Bairros manuais:</strong> {metrics.manualBairrosCount} aluno(s) informaram um bairro fora da lista principal
              </div>
              <div>
                <strong>Escolas manuais:</strong> {metrics.manualEscolasCount} aluno(s) informaram uma escola fora da lista cadastrada
              </div>
            </div>

            {filteredData.length === 0 ? (
              <div className="db-card db-empty-filter-state">
                <Filter size={32} />
                <h3>Nenhum resultado para os filtros selecionados</h3>
                <p>Tente alterar ou limpar os filtros aplicados acima.</p>
                <button onClick={handleClearFilters} className="db-btn db-btn-sm">Limpar filtros</button>
              </div>
            ) : (
              <>
                {/* Visualizations Grid */}
                <section className="db-charts-grid">
                  {/* Respostas por Curso */}
                  <div className="db-card db-chart-card">
                    <div className="db-chart-header">
                      <BarChart3 size={18} />
                      <h4>Respostas por Curso</h4>
                    </div>
                    <div className="db-bar-list">
                      {distributions.byCurso.map(([name, count]) => {
                        const pct = Math.round((count / metrics.total) * 100);
                        return (
                          <div key={name} className="db-bar-item">
                            <div className="db-bar-label">
                              <span>{name}</span>
                              <strong>{count} ({pct}%)</strong>
                            </div>
                            <div className="db-bar-track">
                              <div className="db-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Respostas por Período */}
                  <div className="db-card db-chart-card">
                    <div className="db-chart-header">
                      <BarChart3 size={18} />
                      <h4>Respostas por Período</h4>
                    </div>
                    <div className="db-bar-list">
                      {distributions.byPeriodo.map(([name, count]) => {
                        const pct = Math.round((count / metrics.total) * 100);
                        return (
                          <div key={name} className="db-bar-item">
                            <div className="db-bar-label">
                              <span>{name}</span>
                              <strong>{count} ({pct}%)</strong>
                            </div>
                            <div className="db-bar-track">
                              <div className="db-bar-fill db-bar-fill-yellow" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Respostas por Sexo */}
                  <div className="db-card db-chart-card">
                    <div className="db-chart-header">
                      <PieChart size={18} />
                      <h4>Respostas por Sexo</h4>
                    </div>
                    <div className="db-bar-list">
                      {distributions.bySexo.map(([name, count]) => {
                        const pct = Math.round((count / metrics.total) * 100);
                        return (
                          <div key={name} className="db-bar-item">
                            <div className="db-bar-label">
                              <span>{name}</span>
                              <strong>{count} ({pct}%)</strong>
                            </div>
                            <div className="db-bar-track">
                              <div className="db-bar-fill db-bar-fill-teal" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Respostas por Faixa Etária */}
                  <div className="db-card db-chart-card">
                    <div className="db-chart-header">
                      <Users size={18} />
                      <h4>Respostas por Faixa Etária</h4>
                    </div>
                    <div className="db-bar-list">
                      {distributions.byFaixaEtaria.map(([name, count]) => {
                        const pct = Math.round((count / metrics.total) * 100);
                        return (
                          <div key={name} className="db-bar-item">
                            <div className="db-bar-label">
                              <span>{name}</span>
                              <strong>{count} ({pct}%)</strong>
                            </div>
                            <div className="db-bar-track">
                              <div className="db-bar-fill db-bar-fill-purple" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Escolas Públicas vs Privadas */}
                  <div className="db-card db-chart-card">
                    <div className="db-chart-header">
                      <Building2 size={18} />
                      <h4>Categoria da Escola (Pública vs Privada)</h4>
                    </div>
                    <div className="db-bar-list">
                      {distributions.byCategoriaEscola.map(([name, count]) => {
                        const pct = Math.round((count / metrics.total) * 100);
                        return (
                          <div key={name} className="db-bar-item">
                            <div className="db-bar-label">
                              <span>{name}</span>
                              <strong>{count} ({pct}%)</strong>
                            </div>
                            <div className="db-bar-track">
                              <div className="db-bar-fill db-bar-fill-purple" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cidade de Moradia */}
                  <div className="db-card db-chart-card">
                    <div className="db-chart-header">
                      <BarChart3 size={18} />
                      <h4>Cidade de Moradia</h4>
                    </div>
                    <div className="db-bar-list">
                      {distributions.byCidadeMoradia.map(([name, count]) => {
                        const pct = Math.round((count / metrics.total) * 100);
                        return (
                          <div key={name} className="db-bar-item">
                            <div className="db-bar-label">
                              <span>{name}</span>
                              <strong>{count} ({pct}%)</strong>
                            </div>
                            <div className="db-bar-track">
                              <div className="db-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cidade da Escola */}
                  <div className="db-card db-chart-card">
                    <div className="db-chart-header">
                      <BarChart3 size={18} />
                      <h4>Cidade da Escola</h4>
                    </div>
                    <div className="db-bar-list">
                      {distributions.byCidadeEscola.map(([name, count]) => {
                        const pct = Math.round((count / metrics.total) * 100);
                        return (
                          <div key={name} className="db-bar-item">
                            <div className="db-bar-label">
                              <span>{name}</span>
                              <strong>{count} ({pct}%)</strong>
                            </div>
                            <div className="db-bar-track">
                              <div className="db-bar-fill db-bar-fill-orange" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top Bairros */}
                  <div className="db-card db-chart-card">
                    <div className="db-chart-header">
                      <BarChart3 size={18} />
                      <h4>Top 10 Bairros de Moradia</h4>
                    </div>
                    <div className="db-bar-list">
                      {distributions.byBairro.map(([name, count]) => {
                        const pct = Math.round((count / metrics.total) * 100);
                        return (
                          <div key={name} className="db-bar-item">
                            <div className="db-bar-label">
                              <span>{name}</span>
                              <strong>{count} ({pct}%)</strong>
                            </div>
                            <div className="db-bar-track">
                              <div className="db-bar-fill db-bar-fill-teal" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top Escolas de Origem */}
                  <div className="db-card db-chart-card">
                    <div className="db-chart-header">
                      <Building2 size={18} />
                      <h4>Top 10 Escolas de Origem</h4>
                    </div>
                    <div className="db-bar-list">
                      {distributions.byTopEscolas.map(([name, count]) => {
                        const pct = Math.round((count / metrics.total) * 100);
                        return (
                          <div key={name} className="db-bar-item">
                            <div className="db-bar-label">
                              <span title={name}>{name}</span>
                              <strong>{count} ({pct}%)</strong>
                            </div>
                            <div className="db-bar-track">
                              <div className="db-bar-fill db-bar-fill-purple" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Motivos de Escolha */}
                  <div className="db-card db-chart-card">
                    <div className="db-chart-header">
                      <BarChart3 size={18} />
                      <h4>Motivo para Escolher a UNINASSAU</h4>
                    </div>
                    <div className="db-bar-list">
                      {distributions.byMotivo.map(([name, count]) => {
                        const pct = Math.round((count / metrics.total) * 100);
                        return (
                          <div key={name} className="db-bar-item">
                            <div className="db-bar-label">
                              <span>{name}</span>
                              <strong>{count} ({pct}%)</strong>
                            </div>
                            <div className="db-bar-track">
                              <div className="db-bar-fill db-bar-fill-yellow" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Canal de Conhecimento */}
                  <div className="db-card db-chart-card">
                    <div className="db-chart-header">
                      <BarChart3 size={18} />
                      <h4>Como Conheceu o Curso / UNINASSAU</h4>
                    </div>
                    <div className="db-bar-list">
                      {distributions.byCanal.map(([name, count]) => {
                        const pct = Math.round((count / metrics.total) * 100);
                        return (
                          <div key={name} className="db-bar-item">
                            <div className="db-bar-label">
                              <span>{name}</span>
                              <strong>{count} ({pct}%)</strong>
                            </div>
                            <div className="db-bar-track">
                              <div className="db-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* Detailed Table Section */}
                <section className="db-card db-table-card">
                  <div className="db-table-header">
                    <div className="db-table-title">
                      <FileSpreadsheet size={20} />
                      <h3>Tabela Detalhada de Respostas</h3>
                      <span className="db-badge">{tableData.length} registros</span>
                    </div>

                    <button onClick={handleExportCSV} className="db-btn db-btn-export">
                      <Download size={16} />
                      <span>Exportar CSV</span>
                    </button>
                  </div>

                  {/* Search and Sort Toolbar */}
                  <div className="db-table-toolbar">
                    <div className="db-search-input">
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder="Pesquisar por matrícula..."
                        value={searchMatricula}
                        onChange={e => { setSearchMatricula(e.target.value); setPage(1); }}
                      />
                    </div>

                    <div className="db-search-input">
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder="Pesquisar por nome..."
                        value={searchNome}
                        onChange={e => { setSearchNome(e.target.value); setPage(1); }}
                      />
                    </div>

                    <div className="db-toolbar-controls">
                      <label>Ordem por data:</label>
                      <select
                        value={sortOrder}
                        onChange={e => setSortOrder(e.target.value)}
                      >
                        <option value="desc">Mais recentes primeiro</option>
                        <option value="asc">Mais antigas primeiro</option>
                      </select>
                    </div>

                    <div className="db-toolbar-controls">
                      <label>Itens por página:</label>
                      <select
                        value={pageSize}
                        onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                      >
                        <option value={10}>10 por página</option>
                        <option value={25}>25 por página</option>
                        <option value={50}>50 por página</option>
                        <option value={100}>100 por página</option>
                      </select>
                    </div>
                  </div>

                  {/* Data Table */}
                  {tableData.length === 0 ? (
                    <div className="db-empty-table">
                      <p>Nenhuma resposta encontrada para a busca.</p>
                    </div>
                  ) : (
                    <div className="db-table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Data/Hora</th>
                            <th>Matrícula</th>
                            <th>Nome Completo</th>
                            <th>Sexo</th>
                            <th>Faixa Etária</th>
                            <th>Curso</th>
                            <th>Período</th>
                            <th>Cidade Moradia</th>
                            <th>Bairro</th>
                            <th>Cidade Escola</th>
                            <th>Categoria Escola</th>
                            <th>Nome da Escola</th>
                            <th>Motivo Escolha</th>
                            <th>Canal Conhecimento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTableData.map(row => (
                            <tr key={row.id}>
                              <td className="nowrap">{formatDate(row.criado_em)}</td>
                              <td className="bold">{row.matricula}</td>
                              <td>{row.nome_completo}</td>
                              <td>{row.sexo}</td>
                              <td>{row.faixa_etaria || 'Não informado'}</td>
                              <td>
                                {row.curso}
                                {row.outro_curso && <small className="db-subtext"> ({row.outro_curso})</small>}
                              </td>
                              <td>{row.periodo}</td>
                              <td>
                                {row.cidade_moradia}
                                {row.outra_cidade_moradia && <small className="db-subtext"> ({row.outra_cidade_moradia})</small>}
                              </td>
                              <td>
                                {row.bairro}
                                {row.outro_bairro && <small className="db-subtext"> ({row.outro_bairro})</small>}
                              </td>
                              <td>
                                {row.cidade_escola}
                                {row.outra_cidade_escola && <small className="db-subtext"> ({row.outra_cidade_escola})</small>}
                              </td>
                              <td>
                                <span className={`db-pill ${row.categoria_escola === 'Pública' ? 'pill-publica' : 'pill-privada'}`}>
                                  {row.categoria_escola}
                                </span>
                              </td>
                              <td>
                                {row.nome_escola}
                                {row.escola_manual && <span className="db-pill pill-manual">Manual</span>}
                              </td>
                              <td>
                                {row.motivo_escolha}
                                {row.outro_motivo && <small className="db-subtext"> ({row.outro_motivo})</small>}
                              </td>
                              <td>
                                {row.canal_conhecimento}
                                {row.outro_canal && <small className="db-subtext"> ({row.outro_canal})</small>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination Footer */}
                  {tableData.length > 0 && (
                    <div className="db-pagination">
                      <span>
                        Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, tableData.length)} de {tableData.length} resultados
                      </span>

                      <div className="db-pagination-buttons">
                        <button
                          onClick={() => setPage(p => Math.max(p - 1, 1))}
                          disabled={page === 1}
                          className="db-btn-page"
                        >
                          <ChevronLeft size={16} /> Anterior
                        </button>
                        <span className="db-page-num">Página {page} de {totalPages}</span>
                        <button
                          onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                          disabled={page >= totalPages}
                          className="db-btn-page"
                        >
                          Próximo <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
