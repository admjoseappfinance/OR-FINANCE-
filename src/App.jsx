import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qprlpwyvssxjzcftkgav.supabase.co",
  "sb_publishable_hGG9yCIjIcvmIqo69n5nRQ_uImcekYe"
);

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

function Painel({ email, sair }) {
  const [contas, setContas] = useState([]);
  const [nomeConta, setNomeConta] = useState("");
  const [saldoConta, setSaldoConta] = useState("");

  const [valorEntrada, setValorEntrada] = useState("");
  const [descricaoEntrada, setDescricaoEntrada] = useState("");
  const [contaEntrada, setContaEntrada] = useState("");
  const [entradas, setEntradas] = useState([]);

  const [valorDespesa, setValorDespesa] = useState("");
  const [descricaoDespesa, setDescricaoDespesa] = useState("");
  const [contaDespesa, setContaDespesa] = useState("");
  const [despesas, setDespesas] = useState([]);

  const [active, setActive] = useState("Início");
  const [menuAberto, setMenuAberto] = useState(false);

  async function carregarContas() {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setContas(data);

      if (data.length > 0) {
        setContaEntrada((atual) => atual || data[0].uuid);
        setContaDespesa((atual) => atual || data[0].uuid);
      }
    }
  }

  async function carregarEntradas() {
    const { data, error } = await supabase
      .from("incomes")
      .select("*")
      .order("income_date", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setEntradas(data);
    }
  }

  async function carregarDespesas() {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setDespesas(data);
    }
  }

  async function criarConta(e) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: nomeConta,
      type: "corrente",
      balance: Number(saldoConta) || 0,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setNomeConta("");
    setSaldoConta("");

    await carregarContas();
  }

  async function criarEntrada(e) {
    e.preventDefault();

    if (!contaEntrada) {
      alert("Selecione uma conta.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const valor = Number(valorEntrada) || 0;

    const { error } = await supabase.from("incomes").insert({
      user_id: user.id,
      account_id: contaEntrada,
      description: descricaoEntrada,
      amount: valor,
      income_date: new Date().toISOString().split("T")[0],
    });

    if (error) {
      alert(error.message);
      return;
    }

    const contaAtual = contas.find(
      (conta) => conta.uuid === contaEntrada
    );

    if (!contaAtual) {
      alert("Conta não encontrada.");
      return;
    }

    const novoSaldo = Number(contaAtual.balance || 0) + valor;

    const { error: erroSaldo } = await supabase
      .from("accounts")
      .update({
        balance: novoSaldo,
      })
      .eq("uuid", contaEntrada);

    if (erroSaldo) {
      alert(erroSaldo.message);
      return;
    }

    setValorEntrada("");
    setDescricaoEntrada("");

    await carregarContas();
    await carregarEntradas();
  }

  async function criarDespesa(e) {
    e.preventDefault();

    if (!contaDespesa) {
      alert("Selecione uma conta.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const valor = Number(valorDespesa) || 0;

    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      account_id: contaDespesa,
      description: descricaoDespesa,
      amount: valor,
      expense_date: new Date().toISOString().split("T")[0],
    });

    if (error) {
      alert(error.message);
      return;
    }

    const contaAtual = contas.find(
      (conta) => conta.uuid === contaDespesa
    );

    if (!contaAtual) {
      alert("Conta não encontrada.");
      return;
    }

    const novoSaldo = Number(contaAtual.balance || 0) - valor;

    const { error: erroSaldo } = await supabase
      .from("accounts")
      .update({
        balance: novoSaldo,
      })
      .eq("uuid", contaDespesa);

    if (erroSaldo) {
      alert(erroSaldo.message);
      return;
    }

    setValorDespesa("");
    setDescricaoDespesa("");

    await carregarContas();
    await carregarDespesas();
  }

  useEffect(() => {
    carregarContas();
    carregarEntradas();
    carregarDespesas();
  }, []);

  function selecionar(item) {
    setActive(item);
    setMenuAberto(false);
  }

  const totalContas = contas.reduce(
    (total, conta) => total + Number(conta.balance || 0),
    0
  );

  const totalEntradas = entradas.reduce(
    (total, entrada) => total + Number(entrada.amount || 0),
    0
  );

  const totalDespesas = despesas.reduce(
    (total, despesa) => total + Number(despesa.amount || 0),
    0
  );

  const saldoTotal = totalContas;

  return (
    <div className="app">
      <aside className={`sidebar ${menuAberto ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-logo">O</div>

          <div>
            <div className="brand-name">Or Finance</div>
            <div className="brand-subtitle">
              FINANÇAS PESSOAIS
            </div>
          </div>
        </div>

        <nav className="nav">
          {menu.map((item) => (
            <button
              key={item}
              className={`nav-button ${
                active === item ? "active" : ""
              }`}
              onClick={() => selecionar(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <button
          className="settings-button"
          onClick={() => selecionar("Configurações")}
        >
          Configurações
        </button>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMenuAberto(!menuAberto)}
          >
            ☰
          </button>

          <div>
            <div className="eyebrow">OR FINANCE</div>
            <h1>{active}</h1>
          </div>

          <div className="profile">JC</div>
        </header>

        <section className="content">
          {active === "Início" ? (
            <>
              <section className="hero">
                <div>
                  <span>Saldo disponível</span>

                  <strong>
                    R$ {saldoTotal.toFixed(2).replace(".", ",")}
                  </strong>
                </div>

                <button className="primary-button">
                  + Nova movimentação
                </button>
              </section>

              <div className="stats">
                <div className="stat-card">
                  <span>Entradas</span>

                  <strong>
                    R$ {totalEntradas.toFixed(2).replace(".", ",")}
                  </strong>

                  <small>Total cadastrado</small>
                </div>

                <div className="stat-card">
                  <span>Despesas</span>

                  <strong>
                    R$ {totalDespesas.toFixed(2).replace(".", ",")}
                  </strong>

                  <small>Total cadastrado</small>
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

                    <p>
                      Suas entradas e despesas aparecerão aqui.
                    </p>
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
          ) : (
            <section className="panel page">
              {active === "Contas" ? (
                <>
                  <span>FINANÇAS</span>

                  <h2>Minhas contas</h2>

                  <form
                    onSubmit={criarConta}
                    style={{ marginTop: 20 }}
                  >
                    <input
                      type="text"
                      placeholder="Nome da conta"
                      value={nomeConta}
                      onChange={(e) =>
                        setNomeConta(e.target.value)
                      }
                      required
                      style={campo}
                    />

                    <input
                      type="number"
                      placeholder="Saldo inicial"
                      value={saldoConta}
                      onChange={(e) =>
                        setSaldoConta(e.target.value)
                      }
                      step="0.01"
                      style={campo}
                    />

                    <button type="submit" style={botao}>
                      Adicionar conta
                    </button>
                  </form>

                  <div style={{ marginTop: 25 }}>
                    {contas.length === 0 ? (
                      <p>Nenhuma conta cadastrada.</p>
                    ) : (
                      contas.map((conta) => (
                        <div
                          key={conta.uuid}
                          style={{
                            padding: 15,
                            marginTop: 10,
                            background: "#111",
                            border: "1px solid #222",
                            borderRadius: 10,
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <strong>{conta.name}</strong>

                          <span>
                            R${" "}
                            {Number(conta.balance || 0)
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : active === "Entradas" ? (
                <>
                  <span>FINANÇAS</span>

                  <h2>Entradas</h2>

                  <form
                    onSubmit={criarEntrada}
                    style={{ marginTop: 20 }}
                  >
                    <select
                      value={contaEntrada}
                      onChange={(e) =>
                        setContaEntrada(e.target.value)
                      }
                      required
                      style={campo}
                    >
                      <option value="">
                        Selecione a conta
                      </option>

                      {contas.map((conta) => (
                        <option
                          key={conta.uuid}
                          value={conta.uuid}
                        >
                          {conta.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Descrição da entrada"
                      value={descricaoEntrada}
                      onChange={(e) =>
                        setDescricaoEntrada(e.target.value)
                      }
                      required
                      style={campo}
                    />

                    <input
                      type="number"
                      placeholder="Valor"
                      value={valorEntrada}
                      onChange={(e) =>
                        setValorEntrada(e.target.value)
                      }
                      required
                      step="0.01"
                      style={campo}
                    />

                    <button type="submit" style={botao}>
                      Adicionar entrada
                    </button>
                  </form>

                  <div style={{ marginTop: 25 }}>
                    {entradas.length === 0 ? (
                      <p>Nenhuma entrada cadastrada.</p>
                    ) : (
                      entradas.map((entrada) => (
                        <div
                          key={entrada.id}
                          style={{
                            padding: 15,
                            marginTop: 10,
                            background: "#111",
                            border: "1px solid #222",
                            borderRadius: 10,
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <strong>
                            {entrada.description}
                          </strong>

                          <span>
                            R${" "}
                            {Number(entrada.amount || 0)
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : active === "Despesas" ? (
                <>
                  <span>FINANÇAS</span>

                  <h2>Despesas</h2>

                  <form
                    onSubmit={criarDespesa}
                    style={{ marginTop: 20 }}
                  >
                    <select
                      value={contaDespesa}
                      onChange={(e) =>
                        setContaDespesa(e.target.value)
                      }
                      required
                      style={campo}
                    >
                      <option value="">
                        Selecione a conta
                      </option>

                      {contas.map((conta) => (
                        <option
                          key={conta.uuid}
                          value={conta.uuid}
                        >
                          {conta.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Descrição da despesa"
                      value={descricaoDespesa}
                      onChange={(e) =>
                        setDescricaoDespesa(e.target.value)
                      }
                      required
                      style={campo}
                    />

                    <input
                      type="number"
                      placeholder="Valor"
                      value={valorDespesa}
                      onChange={(e) =>
                        setValorDespesa(e.target.value)
                      }
                      required
                      step="0.01"
                      style={campo}
                    />

                    <button type="submit" style={botao}>
                      Adicionar despesa
                    </button>
                  </form>

                  <div style={{ marginTop: 25 }}>
                    {despesas.length === 0 ? (
                      <p>Nenhuma despesa cadastrada.</p>
                    ) : (
                      despesas.map((despesa) => (
                        <div
                          key={despesa.id}
                          style={{
                            padding: 15,
                            marginTop: 10,
                            background: "#111",
                            border: "1px solid #222",
                            borderRadius: 10,
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <strong>
                            {despesa.description}
                          </strong>

                          <span>
                            R${" "}
                            {Number(despesa.amount || 0)
                              .toFixed(2)
                              .replace(".", ",")}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  <span>MÓDULO</span>

                  <h2>{active}</h2>

                  <p>Esta área será configurada em seguida.</p>
                </>
              )}

              <button
                onClick={sair}
                style={{
                  marginTop: 20,
                  padding: "10px 15px",
                  background: "#111",
                  color: "#888",
                  border: "1px solid #222",
                  borderRadius: 8,
                }}
              >
                Sair
              </button>

              <small
                style={{
                  display: "block",
                  color: "#444",
                  marginTop: 8,
                }}
              >
                {email}
              </small>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modoCadastro, setModoCadastro] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function entrar(e) {
    e.preventDefault();

    setMensagem("Aguarde...");

    const resultado = modoCadastro
      ? await supabase.auth.signUp({
          email,
          password: senha,
        })
      : await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });

    if (resultado.error) {
      setMensagem(resultado.error.message);
    } else {
      setMensagem(
        modoCadastro
          ? "Cadastro realizado com sucesso!"
          : "Login realizado com sucesso!"
      );
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <form
        onSubmit={entrar}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#0b0b0b",
          border: "1px solid #222",
          borderRadius: 18,
          padding: 28,
        }}
      >
        <h1>Or Finance</h1>

        <p style={{ color: "#777" }}>
          {modoCadastro
            ? "Criar sua conta"
            : "Entrar na sua conta"}
        </p>

        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={campo}
        />

        <input
          type="password"
          placeholder="Sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          minLength={6}
          style={campo}
        />

        <button type="submit" style={botao}>
          {modoCadastro ? "Criar conta" : "Entrar"}
        </button>

        <button
          type="button"
          onClick={() => {
            setModoCadastro(!modoCadastro);
            setMensagem("");
          }}
          style={troca}
        >
          {modoCadastro
            ? "Já tenho uma conta"
            : "Ainda não tenho uma conta"}
        </button>

        {mensagem && (
          <p style={{ color: "#aaa", marginTop: 18 }}>
            {mensagem}
          </p>
        )}
      </form>
    </div>
  );
}

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUsuario(data.session?.user ?? null);
      setCarregando(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        setUsuario(session?.user ?? null);
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function sair() {
    await supabase.auth.signOut();
  }

  if (carregando) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050505",
          color: "#fff",
          display: "grid",
          placeItems: "center",
        }}
      >
        Carregando...
      </div>
    );
  }

  if (!usuario) {
    return <Login />;
  }

  return <Painel email={usuario.email} sair={sair} />;
}

const campo = {
  width: "100%",
  padding: "13px",
  marginTop: 12,
  background: "#111",
  color: "#fff",
  border: "1px solid #292929",
  borderRadius: 9,
  outline: "none",
};

const botao = {
  width: "100%",
  padding: "13px",
  marginTop: 18,
  background: "#fff",
  color: "#000",
  border: 0,
  borderRadius: 9,
  fontWeight: 700,
  cursor: "pointer",
};

const troca = {
  width: "100%",
  padding: "12px",
  marginTop: 8,
  background: "transparent",
  color: "#aaa",
  border: 0,
  cursor: "pointer",
};
