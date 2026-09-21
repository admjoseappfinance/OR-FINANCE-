import { useState } from "react";

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");

  const menu = [
    { id: "dashboard", label: "Início", icon: "⌂" },
    { id: "accounts", label: "Contas", icon: "◉" },
    { id: "income", label: "Entradas", icon: "＋" },
    { id: "expenses", label: "Despesas", icon: "−" },
    { id: "bills", label: "Contas a pagar", icon: "▣" },
    { id: "cards", label: "Cartões", icon: "▤" },
    { id: "goals", label: "Metas", icon: "◇" },
    { id: "reports", label: "Relatórios", icon: "▥" }
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">OR</div>

          <div>
            <strong>Or Finance</strong>
            <span>Controle financeiro</span>
          </div>
        </div>

        <nav>
          {menu.map((item) => (
            <button
              key={item.id}
              className={activePage === item.id ? "menu-item active" : "menu-item"}
              onClick={() => setActivePage(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          className="settings-button"
          onClick={() => setActivePage("settings")}
        >
          ⚙ <span>Configurações</span>
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">VISÃO GERAL</span>
            <h1>
              {activePage === "dashboard"
                ? "Olá, seja bem-vindo"
                : menu.find((item) => item.id === activePage)?.label ||
                  "Configurações"}
            </h1>
          </div>

          <div className="profile">
            <div className="notification">♧</div>
            <div className="avatar">U</div>
          </div>
        </header>

        {activePage === "dashboard" ? (
          <>
            <section className="balance-card">
              <div>
                <span className="card-label">SALDO TOTAL</span>
                <strong>R$ 0,00</strong>
                <small>Atualizado agora</small>
              </div>

              <div className="balance-icon">R$</div>
            </section>

            <section className="summary-grid">
              <div className="summary-card">
                <span>Entradas</span>
                <strong>R$ 0,00</strong>
                <small>Este mês</small>
              </div>

              <div className="summary-card">
                <span>Despesas</span>
                <strong>R$ 0,00</strong>
                <small>Este mês</small>
              </div>

              <div className="summary-card">
                <span>A pagar</span>
                <strong>R$ 0,00</strong>
                <small>Próximos vencimentos</small>
              </div>
            </section>

            <section className="content-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <span className="eyebrow">MOVIMENTAÇÕES</span>
                    <h2>Últimas movimentações</h2>
                  </div>

                  <button>Ver todas</button>
                </div>

                <div className="empty-state">
                  <div className="empty-icon">＋</div>
                  <strong>Nenhuma movimentação ainda</strong>
                  <p>
                    Suas entradas e despesas aparecerão aqui.
                  </p>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <span className="eyebrow">ACESSO RÁPIDO</span>
                    <h2>Adicionar</h2>
                  </div>
                </div>

                <div className="quick-actions">
                  <button onClick={() => setActivePage("income")}>
                    <span>＋</span>
                    Entrada
                  </button>

                  <button onClick={() => setActivePage("expenses")}>
                    <span>−</span>
                    Despesa
                  </button>

                  <button onClick={() => setActivePage("bills")}>
                    <span>▣</span>
                    Conta
                  </button>

                  <button onClick={() => setActivePage("goals")}>
                    <span>◇</span>
                    Meta
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="page-placeholder">
            <div className="placeholder-icon">OR</div>
            <h2>{menu.find((item) => item.id === activePage)?.label || "Configurações"}</h2>
            <p>
              Esta área será conectada ao seu banco de dados Supabase.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
