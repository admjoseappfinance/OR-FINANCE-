import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qprlpwyvssxjzcftkgav.supabase.co",
  "sb_publishable_hGG9yCIjIcvmIqo69n5nRQ_uImcekYe"
);

export default function App() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [modoCadastro, setModoCadastro] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function entrar(e) {
    e.preventDefault();
    setMensagem("Aguarde...");

    const resultado = modoCadastro
      ? await supabase.auth.signUp({ email, password: senha })
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
          {modoCadastro ? "Criar sua conta" : "Entrar na sua conta"}
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
          <p style={{ color: "#aaa", marginTop: 18 }}>{mensagem}</p>
        )}
      </form>
    </div>
  );
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
