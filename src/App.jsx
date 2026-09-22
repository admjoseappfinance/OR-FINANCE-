import { useState } from "react";

const menu = [
  "Início",
  "Contas",
  "Entradas",
  "Despesas",
  "Contas a pagar",
  "Cartões",
  "Metas",
  "Relatórios",
];

function Inicio() {
  return (
    <>
      <section className="hero">
        <div>
          <span>Saldo disponível</span>
          <strong>R$ 0,00</strong>
        </div>
        <button className="primary-button">+ Nova movimentação</button>
      </section>

      <div className="stats">
        <div className="stat-card">
          <span>Entradas</span>
          <strong>R$ 0,00</strong>
          <small>Este mês</small>
        </div>

        <div className="stat-card">
          <span>Despesas</span>
          <strong>R$ 0,00</strong>
          <small>Este mês</small>
        </div>

        <div className="stat-card">
          <span>A pagar</span>
          <strong>R$ 0,00</strong>
          <small>Próximos vencimentos</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="panel large">
          <div className="panel-title">
            <div>
              <span>FLUXO FINANCEIRO</span>
              <h2>Movimentações recentes</h2>
            </div>
          </div>

          <div className="empty">
            <div className="empty-icon">—</div>
            <h3>Nenhuma movimentação</h3>
            <p>Suas entradas e despesas aparecerão aqui.</p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <div>
              <span>ACESSO RÁPIDO</span>
              <h2>Adicionar</h2>
            </div>
          </div>

          <div className="quick-actions">
            <button>+ Entrada</button>
            <button>− Despesa</button>
            <button>+ Conta</button>
            <button>+ Cartão</button>
          </div>
        </section>
      </div>
    </>
  );
}

function Tela({ nome }) {
  return (
    <section className="panel page">
      <span>MÓDULO</span>
      <h2>{nome}</h2>
      <p>Esta área será configurada em seguida.</p>
    </section>
  );
}

export default function App() {
  const [active, setActive] = useState("Início");

  return (
    <div className="app">
      <div className="layout">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo">O</div>
            <div>
              <div className="brand-name">Or Finance</div>
              <div className="brand-subtitle">FINANÇAS PESSOAIS</div>
            </div>
          </div>

          <nav className="nav">
            {menu.map((item) => (
              <button
                key={item}
                className={`nav-button ${
                  active === item ? "active" : ""
                }`}
                onClick={() => setActive(item)}
              >
                {item}
              </button>
            ))}
          </nav>

          <button className="settings-button">
            Configurações
          </button>
        </aside>

        <main className="main">
          <header className="topbar">
            <div>
              <div className="eyebrow">OR FINANCE</div>
              <h1>{active}</h1>
            </div>

            <div className="profile">JC</div>
          </header>

          <section className="content">
            {active === "Início" ? (
              <Inicio />
            ) : (
              <Tela nome={active} />
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
