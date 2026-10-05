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
  "Saidas",
  "Contas a pagar",
  "Compromissos",
  "Cartões",
  "Metas",
  "Relatórios",
];

function normalizarId(valor) {
  if (valor === undefined || valor === null) return null;

  const texto = String(valor).trim();

  if (!texto || texto === "null" || texto === "undefined") {
    return null;
  }

  return texto;
}

function getCardId(card) {
  return normalizarId(card?.id);
}

function getCardIdColumn() {
  return "id";
}

function isUuid(valor) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(valor || "")
  );
}

function getRowId(row) {
  return normalizarId(row?.id);
}

function getRowIdColumn() {
  return "id";
}

function Painel({ email, sair, userId }) {
  const [contas, setContas] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [Saidas, setSaidas] = useState([]);
  const [contasPagar, setContasPagar] = useState([]);
  const [cartoes, setCartoes] = useState([]);
  const [compras, setCompras] = useState([]);
  const [parcelas, setParcelas] = useState([]);
  const [faturas, setFaturas] = useState([]);

  const [nomeConta, setNomeConta] = useState("");
  const [saldoConta, setSaldoConta] = useState("");

  const [valorEntrada, setValorEntrada] = useState("");
  const [descricaoEntrada, setDescricaoEntrada] = useState("");
  const [contaEntrada, setContaEntrada] = useState("");

  const [valordespesa, setValordespesa] = useState("");
  const [descricaodespesa, setDescricaodespesa] = useState("");
  const [contadespesa, setContadespesa] = useState("");

  const [descricaoContaPagar, setDescricaoContaPagar] = useState("");
  const [valorContaPagar, setValorContaPagar] = useState("");
  const [vencimentoContaPagar, setVencimentoContaPagar] = useState("");
  const [contaPagarSelecionada, setContaPagarSelecionada] = useState("");

  const [descricaoCompromisso, setDescricaoCompromisso] = useState("");
  const [valorCompromisso, setValorCompromisso] = useState("");
  const [vencimentoCompromisso, setVencimentoCompromisso] = useState("");
  const [contaCompromissoSelecionada, setContaCompromissoSelecionada] = useState("");
  const [compromissoEditando, setCompromissoEditando] = useState(null);

  const [nomeCartao, setNomeCartao] = useState("");
  const [bancoCartao, setBancoCartao] = useState("");
  const [ultimosQuatro, setUltimosQuatro] = useState("");
  const [limiteCartao, setLimiteCartao] = useState("");
  const [limiteDisponivel, setLimiteDisponivel] = useState("");
  const [fechamentoCartao, setFechamentoCartao] = useState("");
  const [vencimentoCartao, setVencimentoCartao] = useState("");
  const [bandeiraCartao, setBandeiraCartao] = useState("");
  const [corCartao, setCorCartao] = useState("#ffffff");
  const [cartaoEditando, setCartaoEditando] = useState(null);

  const [contasFaturaSelecionadas, setContasFaturaSelecionadas] =
    useState({});
  const [contasParcelaSelecionadas, setContasParcelaSelecionadas] =
    useState({});

  const [cartaoCompra, setCartaoCompra] = useState("");
  const [descricaoCompra, setDescricaoCompra] = useState("");
  const [valorCompra, setValorCompra] = useState("");
  const [dataCompra, setDataCompra] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [totalParcelasCompra, setTotalParcelasCompra] = useState("1");
  const [observacaoCompra, setObservacaoCompra] = useState("");

  const [active, setActive] = useState("Início");
  const [menuAberto, setMenuAberto] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [mostrarSaldo, setMostrarSaldo] = useState(true);
  const [senhaNova, setSenhaNova] = useState("");
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  async function carregarContas() {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setContas(data || []);
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

    setEntradas(data || []);
  }

  async function carregarSaidas() {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setSaidas(data || []);
  }

  async function carregarContasPagar() {
    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .order("due_date", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setContasPagar(data || []);
  }

  /*
   * CORREÇÃO PRINCIPAL:
   *
   * O limite disponível não depende mais do valor salvo anteriormente
   * em cards.available_limit.
   *
   * Ele é recalculado usando:
   *
   * limite do cartão
   * MENOS
   * todas as parcelas que ainda estão pendentes.
   *
   * Isso faz compras antigas também entrarem no cálculo.
   */
  async function carregarCartoes() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: cartoesData, error: erroCartoes } = await supabase
      .from("cards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (erroCartoes) {
      alert(erroCartoes.message);
      return;
    }

    const { data: comprasData, error: erroCompras } = await supabase
      .from("card_purchases")
      .select("id, card_id")
      .eq("user_id", user.id);

    if (erroCompras) {
      alert(erroCompras.message);
      return;
    }

    const { data: parcelasData, error: erroParcelas } = await supabase
      .from("card_installments")
      .select("purchase_id, amount, status")
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (erroParcelas) {
      alert(erroParcelas.message);
      return;
    }

    const compraParaCartao = new Map(
      (comprasData || []).map((compra) => [
        String(compra.id),
        String(compra.card_id),
      ])
    );

    const utilizadoPorCartao = {};

    for (const parcela of parcelasData || []) {
      const cardId = compraParaCartao.get(
        String(parcela.purchase_id)
      );

      if (!cardId) continue;

      utilizadoPorCartao[cardId] =
        (utilizadoPorCartao[cardId] || 0) +
        Number(parcela.amount || 0);
    }

    const cartoesAtualizados = [];

    for (const cartao of cartoesData || []) {
      const idCartao = getCardId(cartao);

      // Nunca enviaremos "null"/"undefined" para uma coluna UUID.
      // Isso evita o erro: invalid input syntax for type uuid: "null".
      if (!isUuid(idCartao)) {
        continue;
      }

      const limite = Number(cartao.credit_limit || 0);

      const utilizado = Number(
        utilizadoPorCartao[String(idCartao)] || 0
      );

      const disponivel = Math.max(
        0,
        limite - utilizado
      );

      if (
        Math.abs(
          Number(cartao.available_limit || 0) -
            disponivel
        ) > 0.009
      ) {
        const { error: erroAtualizacao } = await supabase
          .from("cards")
          .update({
            available_limit: disponivel,
          })
          .eq(getCardIdColumn(cartao), idCartao)
          .eq("user_id", user.id);

        if (erroAtualizacao) {
          alert(erroAtualizacao.message);
          return;
        }
      }

      cartoesAtualizados.push({
        ...cartao,
        available_limit: disponivel,
      });
    }

    setCartoes(cartoesAtualizados);
  }

  async function carregarCompras() {
    const { data, error } = await supabase
      .from("card_purchases")
      .select("*")
      .order("purchase_date", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setCompras(data || []);
  }

  async function carregarParcelas() {
    const { data, error } = await supabase
      .from("card_installments")
      .select("*")
      .order("due_date", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setParcelas(data || []);
  }

  async function carregarFaturas() {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("due_date", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setFaturas(data || []);
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

    alert("Conta adicionada com sucesso!");
  }

  async function criarEntrada(e) {
    e.preventDefault();

    const conta = contas[Number(contaEntrada)];

    if (!conta) {
      alert("Selecione uma conta.");
      return;
    }

    const identificador = conta.id ?? conta.uuid;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !identificador) return;

    const valor = Number(valorEntrada) || 0;

    const { error } = await supabase.from("incomes").insert({
      user_id: user.id,
      account_id: identificador,
      description: descricaoEntrada,
      amount: valor,
      income_date: new Date().toISOString().split("T")[0],
    });

    if (error) {
      alert(error.message);
      return;
    }

    const novoSaldo = Number(conta.balance || 0) + valor;

    const colunaId = conta.id !== undefined ? "id" : "uuid";

    const { error: erroSaldo } = await supabase
      .from("accounts")
      .update({ balance: novoSaldo })
      .eq(colunaId, identificador);

    if (erroSaldo) {
      alert(erroSaldo.message);
      return;
    }

    setValorEntrada("");
    setDescricaoEntrada("");
    setContaEntrada("");

    await carregarContas();
    await carregarEntradas();

    alert("Entrada adicionada com sucesso!");
  }

  async function criardespesa(e) {
    e.preventDefault();

    const conta = contas[Number(contadespesa)];

    if (!conta) {
      alert("Selecione uma conta.");
      return;
    }

    const identificador = conta.id ?? conta.uuid;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !identificador) return;

    const valor = Number(valordespesa) || 0;

    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      account_id: identificador,
      description: descricaodespesa,
      amount: valor,
      expense_date: new Date().toISOString().split("T")[0],
    });

    if (error) {
      alert(error.message);
      return;
    }

    const novoSaldo = Number(conta.balance || 0) - valor;

    const colunaId = conta.id !== undefined ? "id" : "uuid";

    const { error: erroSaldo } = await supabase
      .from("accounts")
      .update({ balance: novoSaldo })
      .eq(colunaId, identificador);

    if (erroSaldo) {
      alert(erroSaldo.message);
      return;
    }

    setValordespesa("");
    setDescricaodespesa("");
    setContadespesa("");

    await carregarContas();
    await carregarSaidas();

    alert("despesa adicionada com sucesso!");
  }

  async function criarContaPagar(e) {
    e.preventDefault();

    const conta = contas[Number(contaPagarSelecionada)];

    if (!conta) {
      alert("Selecione a conta.");
      return;
    }

    const identificador = conta.id ?? conta.uuid;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !identificador) return;

    const { error } = await supabase.from("bills").insert({
      user_id: user.id,
      account_id: identificador,
      description: descricaoContaPagar,
      amount: Number(valorContaPagar) || 0,
      due_date: vencimentoContaPagar,
      status: "pending",
      recurring: false,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setDescricaoContaPagar("");
    setValorContaPagar("");
    setVencimentoContaPagar("");
    setContaPagarSelecionada("");

    await carregarContasPagar();

    alert("Conta a pagar adicionada com sucesso!");
  }

  async function criarCompromisso(e) {
    e.preventDefault();

    const conta = contas[Number(contaCompromissoSelecionada)];
    if (!conta) {
      alert("Selecione a conta.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const accountId = conta.id ?? conta.uuid;
    if (!user || !accountId) return;

    const dados = {
      user_id: user.id,
      account_id: accountId,
      description: descricaoCompromisso,
      amount: Number(valorCompromisso) || 0,
      due_date: vencimentoCompromisso,
      status: "pending",
      recurring: true,
    };

    const { error } = compromissoEditando
      ? await supabase.from("bills").update({
          account_id: accountId,
          description: descricaoCompromisso,
          amount: Number(valorCompromisso) || 0,
          due_date: vencimentoCompromisso,
          recurring: true,
        }).eq("id", compromissoEditando.id)
      : await supabase.from("bills").insert(dados);

    if (error) {
      alert(error.message);
      return;
    }

    setDescricaoCompromisso("");
    setValorCompromisso("");
    setVencimentoCompromisso("");
    setContaCompromissoSelecionada("");
    setCompromissoEditando(null);
    await carregarContasPagar();
    alert(compromissoEditando ? "Compromisso atualizado com sucesso!" : "Compromisso cadastrado com sucesso!");
  }

  function editarCompromisso(compromisso) {
    const indiceConta = contas.findIndex(
      (conta) => String(conta.id ?? conta.uuid) === String(compromisso.account_id)
    );

    setCompromissoEditando(compromisso);
    setDescricaoCompromisso(compromisso.description || "");
    setValorCompromisso(String(compromisso.amount || ""));
    setVencimentoCompromisso(compromisso.due_date || "");
    setContaCompromissoSelecionada(indiceConta >= 0 ? String(indiceConta) : "");
  }

  function cancelarEdicaoCompromisso() {
    setCompromissoEditando(null);
    setDescricaoCompromisso("");
    setValorCompromisso("");
    setVencimentoCompromisso("");
    setContaCompromissoSelecionada("");
  }

  async function pagarConta(conta) {
    if (conta.status === "paid") return;

    const contaSelecionada = contas.find(
      (item) => (item.id ?? item.uuid) === conta.account_id
    );

    if (!contaSelecionada) {
      alert("Conta bancária não encontrada.");
      return;
    }

    const confirmar = window.confirm(
      `Confirmar pagamento de "${conta.description}" no valor de R$ ${Number(
        conta.amount || 0
      )
        .toFixed(2)
        .replace(".", ",")}?`
    );

    if (!confirmar) return;

    const novoSaldo =
      Number(contaSelecionada.balance || 0) -
      Number(conta.amount || 0);

    const colunaId =
      contaSelecionada.id !== undefined ? "id" : "uuid";

    const { error: erroSaldo } = await supabase
      .from("accounts")
      .update({ balance: novoSaldo })
      .eq(colunaId, conta.account_id);

    if (erroSaldo) {
      alert(erroSaldo.message);
      return;
    }

    const { error } = await supabase
      .from("bills")
      .update({
        status: "paid",
        paid_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", conta.id);

    if (error) {
      alert(error.message);
      return;
    }

    await carregarContas();
    await carregarContasPagar();

    alert("Conta paga com sucesso!");
  }

  async function pagarFatura(fatura) {
    if (fatura.status === "paid") return;

    const contaId = contasFaturaSelecionadas[fatura.id];

    const contaSelecionada = contas.find(
      (item) =>
        String(item.id ?? item.uuid) === String(contaId)
    );

    if (!contaSelecionada) {
      alert(
        "Selecione a conta bancária que será usada para pagar a fatura."
      );
      return;
    }

    const restante = Math.max(
      0,
      Number(fatura.total_amount || 0) -
        Number(fatura.paid_amount || 0)
    );

    if (restante <= 0) return;

    const confirmar = window.confirm(
      `Confirmar pagamento da fatura no valor de R$ ${restante
        .toFixed(2)
        .replace(".", ",")}?`
    );

    if (!confirmar) return;

    const novoSaldo =
      Number(contaSelecionada.balance || 0) -
      restante;

    const colunaId =
      contaSelecionada.id !== undefined ? "id" : "uuid";

    const { error: erroSaldo } = await supabase
      .from("accounts")
      .update({ balance: novoSaldo })
      .eq(colunaId, contaId);

    if (erroSaldo) {
      alert(erroSaldo.message);
      return;
    }

    const novoPago =
      Number(fatura.paid_amount || 0) + restante;

    const { error: erroFatura } = await supabase
      .from("invoices")
      .update({
        paid_amount: novoPago,
        status: "paid",
      })
      .eq("id", fatura.id);

    if (erroFatura) {
      alert(erroFatura.message);
      return;
    }

    const { data: comprasDaFatura } = await supabase
      .from("card_purchases")
      .select("id")
      .eq("invoice_id", fatura.id);

    if (comprasDaFatura?.length) {
      const ids = comprasDaFatura.map(
        (compra) => compra.id
      );

      await supabase
        .from("card_installments")
        .update({ status: "paid" })
        .in("purchase_id", ids)
        .eq("due_date", fatura.due_date);
    }

    /*
     * Não alteramos mais o limite manualmente.
     * carregarCartoes() recalcula o limite real
     * usando as parcelas pendentes.
     */

    await carregarContas();
    await carregarCartoes();
    await carregarFaturas();
    await carregarParcelas();

    alert("Fatura paga com sucesso!");
  }

  async function pagarParcela(parcela) {
    if (parcela.status === "paid") return;

    const contaId =
      contasParcelaSelecionadas[parcela.id];

    const contaSelecionada = contas.find(
      (item) =>
        String(item.id ?? item.uuid) === String(contaId)
    );

    if (!contaSelecionada) {
      alert(
        "Selecione a conta bancária que será usada para pagar a parcela."
      );
      return;
    }

    const valor = Number(parcela.amount || 0);

    const confirmar = window.confirm(
      `Confirmar pagamento da parcela no valor de R$ ${valor
        .toFixed(2)
        .replace(".", ",")}?`
    );

    if (!confirmar) return;

    const novoSaldo =
      Number(contaSelecionada.balance || 0) - valor;

    const colunaId =
      contaSelecionada.id !== undefined ? "id" : "uuid";

    const { error: erroSaldo } = await supabase
      .from("accounts")
      .update({ balance: novoSaldo })
      .eq(colunaId, contaId);

    if (erroSaldo) {
      alert(erroSaldo.message);
      return;
    }

    const { error: erroParcela } = await supabase
      .from("card_installments")
      .update({ status: "paid" })
      .eq("id", parcela.id);

    if (erroParcela) {
      alert(erroParcela.message);
      return;
    }

    const { data: compra } = await supabase
      .from("card_purchases")
      .select("card_id")
      .eq("id", parcela.purchase_id)
      .maybeSingle();

    const { data: fatura } = await supabase
      .from("invoices")
      .select("*")
      .eq("card_id", compra?.card_id)
      .eq("due_date", parcela.due_date)
      .maybeSingle();

    if (fatura) {
      const novoPago = Math.min(
        Number(fatura.total_amount || 0),
        Number(fatura.paid_amount || 0) + valor
      );

      await supabase
        .from("invoices")
        .update({
          paid_amount: novoPago,
          status:
            novoPago >=
            Number(fatura.total_amount || 0)
              ? "paid"
              : "open",
        })
        .eq("id", fatura.id);
    }

    /*
     * O limite é recalculado pelas parcelas
     * que continuam pendentes.
     */

    await carregarContas();
    await carregarCartoes();
    await carregarParcelas();
    await carregarFaturas();

    alert("Parcela paga com sucesso!");
  }

  async function criarCartao(e) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const limite = Number(limiteCartao) || 0;

    const { error } = await supabase.from("cards").insert({
      user_id: user.id,
      name: nomeCartao,
      bank_name: bancoCartao || null,
      last_four_digits: ultimosQuatro || null,
      credit_limit: limite,
      available_limit: limite,
      closing_day: fechamentoCartao
        ? Number(fechamentoCartao)
        : null,
      due_day: vencimentoCartao
        ? Number(vencimentoCartao)
        : null,
      brand: bandeiraCartao || null,
      color: corCartao || "#ffffff",
      is_active: true,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setNomeCartao("");
    setBancoCartao("");
    setUltimosQuatro("");
    setLimiteCartao("");
    setLimiteDisponivel("");
    setFechamentoCartao("");
    setVencimentoCartao("");
    setBandeiraCartao("");
    setCorCartao("#ffffff");

    await carregarCartoes();

    alert("Cartão adicionado com sucesso!");
  }

  function iniciarEdicaoCartao(cartao) {
    setCartaoEditando(cartao);
    setNomeCartao(cartao.name || "");
    setBancoCartao(cartao.bank_name || "");
    setUltimosQuatro(cartao.last_four_digits || "");
    setLimiteCartao(cartao.credit_limit ?? "");
    setLimiteDisponivel(cartao.available_limit ?? "");
    setFechamentoCartao(cartao.closing_day ?? "");
    setVencimentoCartao(cartao.due_day ?? "");
    setBandeiraCartao(cartao.brand || "");
    setCorCartao(cartao.color || "#ffffff");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelarEdicaoCartao() {
    setCartaoEditando(null);
    setNomeCartao("");
    setBancoCartao("");
    setUltimosQuatro("");
    setLimiteCartao("");
    setLimiteDisponivel("");
    setFechamentoCartao("");
    setVencimentoCartao("");
    setBandeiraCartao("");
    setCorCartao("#ffffff");
  }

  async function salvarEdicaoCartao(e) {
    e.preventDefault();

    if (!cartaoEditando) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const limite = Number(limiteCartao) || 0;

    /*
     * O valor usado é calculado novamente pelas
     * parcelas pendentes depois da atualização.
     */
    const { error } = await supabase
      .from("cards")
      .update({
        name: nomeCartao,
        bank_name: bancoCartao || null,
        last_four_digits: ultimosQuatro || null,
        credit_limit: limite,
        available_limit: limite,
        closing_day: fechamentoCartao
          ? Number(fechamentoCartao)
          : null,
        due_day: vencimentoCartao
          ? Number(vencimentoCartao)
          : null,
        brand: bandeiraCartao || null,
        color: corCartao || "#ffffff",
      })
      .eq(getCardIdColumn(cartaoEditando), getCardId(cartaoEditando))
      .eq("user_id", user.id);

    if (error) {
      alert(error.message);
      return;
    }

    cancelarEdicaoCartao();

    await carregarCartoes();

    alert("Cartão atualizado com sucesso!");
  }

  function adicionarMes(data, quantidade) {
    const novaData = new Date(data);

    novaData.setMonth(
      novaData.getMonth() + quantidade
    );

    return novaData;
  }

  function formatarData(data) {
    if (!data) return "-";

    return new Date(
      `${data}T00:00:00`
    ).toLocaleDateString("pt-BR");
  }

  function dataParaString(data) {
    return data.toISOString().split("T")[0];
  }

  function calcularFatura(card, data) {
    const compra = new Date(
      `${data}T00:00:00`
    );

    const fechamento =
      Number(card.closing_day || 31);

    const vencimento =
      Number(card.due_day || 10);

    let referencia = new Date(
      compra.getFullYear(),
      compra.getMonth(),
      1
    );

    if (compra.getDate() > fechamento) {
      referencia = adicionarMes(
        referencia,
        1
      );
    }

    const ultimoDiaFechamento =
      new Date(
        referencia.getFullYear(),
        referencia.getMonth() + 1,
        0
      ).getDate();

    const diaFechamento = Math.min(
      fechamento,
      ultimoDiaFechamento
    );

    const dataFechamento = new Date(
      referencia.getFullYear(),
      referencia.getMonth(),
      diaFechamento
    );

    let anoVencimento =
      referencia.getFullYear();

    let mesVencimento =
      referencia.getMonth();

    if (vencimento <= diaFechamento) {
      mesVencimento += 1;
    }

    const ultimoDiaVencimento =
      new Date(
        anoVencimento,
        mesVencimento + 1,
        0
      ).getDate();

    const diaVencimento = Math.min(
      vencimento,
      ultimoDiaVencimento
    );

    const dataVencimento = new Date(
      anoVencimento,
      mesVencimento,
      diaVencimento
    );

    return {
      referenceMonth: `${referencia.getFullYear()}-${String(
        referencia.getMonth() + 1
      ).padStart(2, "0")}-01`,

      closingDate:
        dataParaString(dataFechamento),

      dueDate:
        dataParaString(dataVencimento),
    };
  }

  async function criarCompra(e) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || !isUuid(user.id)) {
      alert("Sua sessão não possui um ID de usuário válido. Faça login novamente.");
      return;
    }

    const cartao = cartoes.find(
      (item) => String(getCardId(item)) === String(cartaoCompra)
    );

    if (!cartao) {
      alert("Selecione um cartão.");
      return;
    }

    const idCartao = getCardId(cartao);

    if (!isUuid(idCartao)) {
      alert("O cartão selecionado possui um ID inválido no banco de dados.");
      return;
    }

    const valor = Number(valorCompra) || 0;
    const totalParcelas = Math.max(1, Number(totalParcelasCompra) || 1);

    if (valor <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    const limiteDisponivelAtual = Number(
      cartao.available_limit ?? cartao.credit_limit ?? 0
    );

    if (valor > limiteDisponivelAtual) {
      alert(
        `Compra não autorizada. O limite disponível é de R$ ${limiteDisponivelAtual
          .toFixed(2)
          .replace(".", ",")}.`
      );
      return;
    }

    const valorParcela = valor / totalParcelas;
    const primeiraFaturaDados = calcularFatura(cartao, dataCompra);

    // Busca/cria todas as faturas antes de gravar a compra.
    // Assim nenhum registro fica apontando para um ID nulo.
    const faturasCompra = [];

    for (let i = 1; i <= totalParcelas; i++) {
      const referencia = adicionarMes(
        new Date(`${primeiraFaturaDados.referenceMonth}T00:00:00`),
        i - 1
      );
      const fechamento = adicionarMes(
        new Date(`${primeiraFaturaDados.closingDate}T00:00:00`),
        i - 1
      );
      const vencimento = adicionarMes(
        new Date(`${primeiraFaturaDados.dueDate}T00:00:00`),
        i - 1
      );

      const dadosFatura = {
        referenceMonth: `${referencia.getFullYear()}-${String(
          referencia.getMonth() + 1
        ).padStart(2, "0")}-01`,
        closingDate: dataParaString(fechamento),
        dueDate: dataParaString(vencimento),
      };

      let { data: fatura, error: erroBusca } = await supabase
        .from("invoices")
        .select("id, user_id, card_id, reference_month, closing_date, due_date, total_amount, paid_amount, status")
        .eq("user_id", user.id)
        .eq("card_id", idCartao)
        .eq("reference_month", dadosFatura.referenceMonth)
        .maybeSingle();

      if (erroBusca) {
        alert(`Erro ao buscar a fatura: ${erroBusca.message}`);
        return;
      }

      if (!fatura) {
        const resultado = await supabase
          .from("invoices")
          .insert({
            user_id: user.id,
            card_id: idCartao,
            reference_month: dadosFatura.referenceMonth,
            closing_date: dadosFatura.closingDate,
            due_date: dadosFatura.dueDate,
            total_amount: 0,
            paid_amount: 0,
            status: "open",
          })
          .select("id, user_id, card_id, reference_month, closing_date, due_date, total_amount, paid_amount, status")
          .single();

        if (resultado.error) {
          alert(`Erro ao criar a fatura: ${resultado.error.message}`);
          return;
        }

        fatura = resultado.data;
      }

      if (!fatura?.id || !isUuid(fatura.id)) {
        alert("O banco não retornou um ID válido para a fatura.");
        return;
      }

      faturasCompra.push({ fatura, valorParcela });
    }

    if (!faturasCompra.length || !faturasCompra[0]?.fatura?.id) {
      alert("Não foi possível obter uma fatura válida para a compra.");
      return;
    }

    const idFaturaPrincipal = faturasCompra[0].fatura.id;

    if (!isUuid(idFaturaPrincipal)) {
      alert("A fatura selecionada possui um ID inválido.");
      return;
    }

    // Grava a compra sem enviar campos UUID opcionais como null.
    const dadosCompra = {
      user_id: user.id,
      card_id: idCartao,
      invoice_id: idFaturaPrincipal,
      description: descricaoCompra,
      amount: valor,
      purchase_date: dataCompra,
      total_installments: totalParcelas,
      current_installment: 1,
    };

    if (observacaoCompra?.trim()) {
      dadosCompra.notes = observacaoCompra.trim();
    }

    const { data: compraCriada, error: erroCompra } = await supabase
      .from("card_purchases")
      .insert(dadosCompra)
      .select("id, user_id, card_id, invoice_id, description, amount, purchase_date, total_installments, current_installment, notes")
      .single();

    if (erroCompra) {
      alert(`Erro ao registrar a compra: ${erroCompra.message}`);
      return;
    }

    if (!compraCriada?.id || !isUuid(compraCriada.id)) {
      alert("A compra foi registrada, mas o banco não retornou um ID válido.");
      return;
    }

    // Prepara as parcelas usando somente UUIDs já validados.
    const listaParcelas = faturasCompra.map(({ fatura, valorParcela }, index) => ({
      user_id: user.id,
      purchase_id: compraCriada.id,
      installment_number: index + 1,
      total_installments: totalParcelas,
      amount: valorParcela,
      due_date: fatura.due_date,
      status: "pending",
    }));

    const { error: erroParcelas } = await supabase
      .from("card_installments")
      .insert(listaParcelas);

    if (erroParcelas) {
      // A compra não deve ficar incompleta se a criação das parcelas falhar.
      await supabase
        .from("card_purchases")
        .delete()
        .eq("id", compraCriada.id)
        .eq("user_id", user.id);

      alert(`Erro ao registrar as parcelas: ${erroParcelas.message}`);
      return;
    }

    // Agora soma cada parcela à sua respectiva fatura.
    for (const { fatura, valorParcela } of faturasCompra) {
      const novoTotal = Number(fatura.total_amount || 0) + valorParcela;

      const { error: erroAtualizacaoFatura } = await supabase
        .from("invoices")
        .update({
          total_amount: novoTotal,
          status: "open",
        })
        .eq("id", fatura.id)
        .eq("user_id", user.id);

      if (erroAtualizacaoFatura) {
        alert(`Erro ao atualizar a fatura: ${erroAtualizacaoFatura.message}`);
        return;
      }
    }

    setCartaoCompra("");
    setDescricaoCompra("");
    setValorCompra("");
    setDataCompra(new Date().toISOString().split("T")[0]);
    setTotalParcelasCompra("1");
    setObservacaoCompra("");

    await carregarCartoes();
    await carregarCompras();
    await carregarParcelas();
    await carregarFaturas();

    alert("Compra adicionada com sucesso!");
  }

  useEffect(() => {
    async function carregarTudo() {
      await carregarContas();
      await carregarEntradas();
      await carregarSaidas();
      await carregarContasPagar();
      await carregarCompras();
      await carregarParcelas();
      await carregarFaturas();
      await carregarCartoes();
    }

    carregarTudo();
  }, []);

  function selecionar(item) {
    setActive(item);
    setMenuAberto(false);
  }

  async function alterarSenha() {
    if (!senhaNova || senhaNova.length < 6) {
      alert("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setAlterandoSenha(true);

    const { error } = await supabase.auth.updateUser({
      password: senhaNova,
    });

    setAlterandoSenha(false);

    if (error) {
      alert(`Não foi possível alterar a senha: ${error.message}`);
      return;
    }

    setSenhaNova("");
    alert("Senha alterada com sucesso.");
  }

  async function restaurarAplicativo() {
    if (restaurando) return;

    const confirmar = window.confirm(
      "ATENÇÃO: isso vai apagar todos os dados financeiros desta conta, como contas, entradas, Saidas, contas a pagar, cartões, compras, faturas e metas. Seu login será mantido. Deseja continuar?"
    );

    if (!confirmar) return;

    setRestaurando(true);

    const tabelas = [
      "goal_transactions",
      "card_installments",
      "card_purchases",
      "invoices",
      "detected_transactions",
      "bills",
      "incomes",
      "expenses",
      "goals",
      "automation_settings",
      "monitored_apps",
      "cards",
      "accounts",
      "categories",
    ];

    for (const tabela of tabelas) {
      const { error } = await supabase
        .from(tabela)
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error(`Erro ao restaurar ${tabela}:`, error);
        alert(`Não foi possível restaurar o aplicativo. Erro em ${tabela}: ${error.message}`);
        setRestaurando(false);
        return;
      }
    }

    setContas([]);
    setEntradas([]);
    setSaidas([]);
    setContasPagar([]);
    setCartoes([]);
    setCompras([]);
    setParcelas([]);
    setFaturas([]);
    setActive("Início");
    setRestaurando(false);

    alert("Aplicativo restaurado com sucesso. Seu login foi mantido.");
  }

  const totalContas =
    contas.reduce(
      (total, conta) =>
        total +
        Number(
          conta.balance || 0
        ),
      0
    );

  const totalEntradas =
    entradas.reduce(
      (total, entrada) =>
        total +
        Number(
          entrada.amount || 0
        ),
      0
    );

  const totalSaidas =
    Saidas.reduce(
      (total, despesa) =>
        total +
        Number(
          despesa.amount || 0
        ),
      0
    );

  const totalPagar =
    contasPagar
      .filter(
        (conta) =>
          conta.status !== "paid"
      )
      .reduce(
        (total, conta) =>
          total +
          Number(
            conta.amount || 0
          ),
        0
      );

  const totalFaturas =
    faturas
      .filter(
        (fatura) =>
          fatura.status !== "paid"
      )
      .reduce(
        (total, fatura) =>
          total +
          Math.max(
            0,
            Number(
              fatura.total_amount || 0
            ) -
              Number(
                fatura.paid_amount || 0
              )
          ),
        0
      );

  const movimentacoes = [
    ...entradas.map(
      (entrada) => ({
        id:
          `entrada-${entrada.id}`,
        tipo: "Entrada",
        descricao:
          entrada.description,
        valor:
          Number(
            entrada.amount || 0
          ),
        data:
          entrada.income_date,
      })
    ),

    ...Saidas.map(
      (despesa) => ({
        id:
          `despesa-${despesa.id}`,
        tipo: "despesa",
        descricao:
          despesa.description,
        valor:
          Number(
            despesa.amount || 0
          ),
        data:
         despesa.expense_date,
      })
    ),
  ]
    .sort(
      (a, b) =>
        new Date(
          b.data || 0
        ) -
        new Date(
          a.data || 0
        )
    )
    .slice(0, 8);

  return (
    <div className="app">
      <aside
        className={`sidebar ${
          menuAberto
            ? "mobile-open"
            : ""
        }`}
      >
        <div className="brand">
          <div className="brand-logo">
            O
          </div>

          <div>
            <div className="brand-name">
              Or Finance
            </div>

            <div className="brand-subtitle">
              FINANÇAS PESSOAIS
            </div>
          </div>
        </div>

        <nav className="nav">
          {menu.map(
            (item) => (
              <button
                key={item}
                className={`nav-button ${
                  active === item
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  selecionar(item)
                }
              >
                {item}
              </button>
            )
          )}
        </nav>

      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() =>
              setMenuAberto(
                !menuAberto
              )
            }
          >
            ☰
          </button>

          <div>
            <div className="eyebrow">
              OR FINANCE
            </div>

            <h1>
              {active}
            </h1>
          </div>

          <button
            className="profile"
            onClick={() => selecionar("Configurações")}
            aria-label="Abrir configurações"
          >
            JC
          </button>
        </header>

        <section className="content">
          {active ===
          "Início" ? (
            <>
              <section className="hero">
                <div>
                  <span>
                    Saldo disponível
                  </span>

                  <strong>
                    R${" "}
                    {totalContas
                      .toFixed(2)
                      .replace(
                        ".",
                        ","
                      )}
                  </strong>
                </div>

                <button
                  className="primary-button"
                  onClick={() =>
                    selecionar(
                      "Entradas"
                    )
                  }
                >
                  + Nova movimentação
                </button>
              </section>

              <div className="stats">
                <div className="stat-card">
                  <span>
                    Entradas
                  </span>

                  <strong>
                    R${" "}
                    {totalEntradas
                      .toFixed(2)
                      .replace(
                        ".",
                        ","
                      )}
                  </strong>

                  <small>
                    Total cadastrado
                  </small>
                </div>

                <div className="stat-card">
                  <span>
                    Saidas
                  </span>

                  <strong>
                    R${" "}
                    {totalSaidas
                      .toFixed(2)
                      .replace(
                        ".",
                        ","
                      )}
                  </strong>

                  <small>
                    Total cadastrado
                  </small>
                </div>

                <div className="stat-card">
                  <span>
                    A pagar
                  </span>

                  <strong>
                    R${" "}
                    {(
                      totalPagar +
                      totalFaturas
                    )
                      .toFixed(2)
                      .replace(
                        ".",
                        ","
                      )}
                  </strong>

                  <small>
                    Contas + faturas
                  </small>
                </div>
              </div>

              <div className="dashboard-grid">
                <section className="panel large">
                  <div className="panel-title">
                    <div>
                      <span>
                        FLUXO FINANCEIRO
                      </span>

                      <h2>
                        Movimentações recentes
                      </h2>
                    </div>
                  </div>

                  {movimentacoes.length ===
                  0 ? (
                    <div className="empty">
                      <div className="empty-icon">
                        —
                      </div>

                      <h3>
                        Nenhuma movimentação
                      </h3>

                      <p>
                        Suas entradas e Saidas
                        aparecerão aqui.
                      </p>
                    </div>
                  ) : (
                    movimentacoes.map(
                      (
                        movimento
                      ) => (
                        <div
                          key={
                            movimento.id
                          }
                          style={{
                            padding: 15,
                            marginTop: 10,
                            background:
                              "#111",
                            border:
                              "1px solid #222",
                            borderRadius: 10,
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                          }}
                        >
                          <div>
                            <strong>
                              {
                                movimento.descricao
                              }
                            </strong>

                            <div
                              style={{
                                color:
                                  "#666",
                                fontSize: 12,
                                marginTop: 5,
                              }}
                            >
                              {
                                movimento.tipo
                              }{" "}
                              •{" "}
                              {formatarData(
                                movimento.data
                              )}
                            </div>
                          </div>

                          <strong>
                            {movimento.tipo ===
                            "Entrada"
                              ? "+"
                              : "-"}{" "}
                            R${" "}
                            {movimento.valor
                              .toFixed(2)
                              .replace(
                                ".",
                                ","
                              )}
                          </strong>
                        </div>
                      )
                    )
                  )}
                </section>

                <section className="panel">
                  <div className="panel-title">
                    <div>
                      <span>
                        ACESSO RÁPIDO
                      </span>

                      <h2>
                        Adicionar
                      </h2>
                    </div>
                  </div>

                  <div className="quick-actions">
                    <button
                      onClick={() =>
                        selecionar(
                          "Entradas"
                        )
                      }
                    >
                      + Entrada
                    </button>

                    <button
                      onClick={() =>
                        selecionar(
                          "Saidas"
                        )
                      }
                    >
                      −despesa
                    </button>

                    <button
                      onClick={() =>
                        selecionar(
                          "Contas"
                        )
                      }
                    >
                      + Conta
                    </button>

                    <button
                      onClick={() =>
                        selecionar(
                          "Cartões"
                        )
                      }
                    >
                      + Cartão
                    </button>
                  </div>
                </section>
              </div>
            </>
          ) : (
            <section className="panel page">
              {active ===
                "Contas" && (
                <>
                  <span>
                    FINANÇAS
                  </span>

                  <h2>
                    Minhas contas
                  </h2>

                  <form
                    onSubmit={
                      criarConta
                    }
                    style={{
                      marginTop: 20,
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Nome da conta"
                      value={
                        nomeConta
                      }
                      onChange={(e) =>
                        setNomeConta(
                          e.target.value
                        )
                      }
                      required
                      style={
                        campo
                      }
                    />

                    <input
                      type="number"
                      placeholder="Saldo inicial"
                      value={
                        saldoConta
                      }
                      onChange={(e) =>
                        setSaldoConta(
                          e.target.value
                        )
                      }
                      step="0.01"
                      style={
                        campo
                      }
                    />

                    <button
                      type="submit"
                      style={
                        botao
                      }
                    >
                      Adicionar conta
                    </button>
                  </form>

                  <ListaVazia
                    vazio={
                      contas.length ===
                      0
                    }
                    texto="Nenhuma conta cadastrada."
                  >
                    {contas.map(
                      (
                        conta,
                        index
                      ) => (
                        <div
                          key={
                            conta.id ??
                            conta.uuid ??
                            index
                          }
                          style={
                            itemStyle
                          }
                        >
                          <strong>
                            {
                              conta.name
                            }
                          </strong>

                          <span>
                            R${" "}
                            {Number(
                              conta.balance ||
                                0
                            )
                              .toFixed(
                                2
                              )
                              .replace(
                                ".",
                                ","
                              )}
                          </span>
                        </div>
                      )
                    )}
                  </ListaVazia>
                </>
              )}

              {active ===
                "Entradas" && (
                <>
                  <span>
                    FINANÇAS
                  </span>

                  <h2>
                    Entradas
                  </h2>

                  <form
                    onSubmit={
                      criarEntrada
                    }
                    style={{
                      marginTop: 20,
                    }}
                  >
                    <select
                      value={
                        contaEntrada
                      }
                      onChange={(e) =>
                        setContaEntrada(
                          e.target.value
                        )
                      }
                      required
                      style={
                        campo
                      }
                    >
                      <option value="">
                        Selecione a conta
                      </option>

                      {contas.map(
                        (
                          conta,
                          index
                        ) => (
                          <option
                            key={
                              conta.id ??
                              conta.uuid ??
                              index
                            }
                            value={
                              index
                            }
                          >
                            {
                              conta.name
                            }
                          </option>
                        )
                      )}
                    </select>

                    <input
                      type="text"
                      placeholder="Descrição da entrada"
                      value={
                        descricaoEntrada
                      }
                      onChange={(e) =>
                        setDescricaoEntrada(
                          e.target.value
                        )
                      }
                      required
                      style={
                        campo
                      }
                    />

                    <input
                      type="number"
                      placeholder="Valor"
                      value={
                        valorEntrada
                      }
                      onChange={(e) =>
                        setValorEntrada(
                          e.target.value
                        )
                      }
                      required
                      step="0.01"
                      style={
                        campo
                      }
                    />

                    <button
                      type="submit"
                      style={
                        botao
                      }
                    >
                      Adicionar entrada
                    </button>
                  </form>

                  <ListaVazia
                    vazio={
                      entradas.length ===
                      0
                    }
                    texto="Nenhuma entrada cadastrada."
                  >
                    {entradas.map(
                      (
                        entrada
                      ) => (
                        <div
                          key={
                            entrada.id
                          }
                          style={
                            itemStyle
                          }
                        >
                          <div>
                            <strong>
                              {
                                entrada.description
                              }
                            </strong>

                            <small
                              style={{
                                display:
                                  "block",
                                color:
                                  "#666",
                                marginTop: 5,
                              }}
                            >
                              {formatarData(
                                entrada.income_date
                              )}
                            </small>
                          </div>

                          <span>
                            R${" "}
                            {Number(
                              entrada.amount ||
                                0
                            )
                              .toFixed(
                                2
                              )
                              .replace(
                                ".",
                                ","
                              )}
                          </span>
                        </div>
                      )
                    )}
                  </ListaVazia>
                </>
              )}

              {active ===
                "Saidas" && (
                <>
                  <span>
                    FINANÇAS
                  </span>

                  <h2>
                    Saidas
                  </h2>

                  <form
                    onSubmit={
                      criardespesa
                    }
                    style={{
                      marginTop: 20,
                    }}
                  >
                    <select
                      value={
                        contadespesa
                      }
                      onChange={(e) =>
                        setContadespesa(
                          e.target.value
                        )
                      }
                      required
                      style={
                        campo
                      }
                    >
                      <option value="">
                        Selecione a conta
                      </option>

                      {contas.map(
                        (
                          conta,
                          index
                        ) => (
                          <option
                            key={
                              conta.id ??
                              conta.uuid ??
                              index
                            }
                            value={
                              index
                            }
                          >
                            {
                              conta.name
                            }
                          </option>
                        )
                      )}
                    </select>

                    <input
                      type="text"
                      placeholder="Descrição da despesa"
                      value={
                        descricaodespesa
                      }
                      onChange={(e) =>
                        setDescricaodespesa(
                          e.target.value
                        )
                      }
                      required
                      style={
                        campo
                      }
                    />

                    <input
                      type="number"
                      placeholder="Valor"
                      value={
                        valordespesa
                      }
                      onChange={(e) =>
                        setValordespesa(
                          e.target.value
                        )
                      }
                      required
                      step="0.01"
                      style={
                        campo
                      }
                    />

                    <button
                      type="submit"
                      style={
                        botao
                      }
                    >
                      Adicionar despesa
                    </button>
                  </form>

                  <ListaVazia
                    vazio={
                      Saidas.length ===
                      0
                    }
                    texto="Nenhuma despesa cadastrada."
                  >
                    {Saidas.map(
                      (
                        despesa
                      ) => (
                        <div
                          key={
                            despesa.id
                          }
                          style={
                            itemStyle
                          }
                        >
                          <div>
                            <strong>
                              {
                                despesa.description
                              }
                            </strong>

                            <small
                              style={{
                                display:
                                  "block",
                                color:
                                  "#666",
                                marginTop: 5,
                              }}
                            >
                              {formatarData(
                                despesa.expense_date
                              )}
                            </small>
                          </div>

                          <span>
                            R${" "}
                            {Number(
                              despesa.amount ||
                                0
                            )
                              .toFixed(
                                2
                              )
                              .replace(
                                ".",
                                ","
                              )}
                          </span>
                        </div>
                      )
                    )}
                  </ListaVazia>
                </>
              )}

              {active ===
                "Contas a pagar" && (
                <>
                  <span>
                    FINANÇAS
                  </span>

                  <h2>
                    Contas a pagar
                  </h2>

                  <form
                    onSubmit={
                      criarContaPagar
                    }
                    style={{
                      marginTop: 20,
                    }}
                  >
                    <select
                      value={
                        contaPagarSelecionada
                      }
                      onChange={(e) =>
                        setContaPagarSelecionada(
                          e.target.value
                        )
                      }
                      required
                      style={
                        campo
                      }
                    >
                      <option value="">
                        Selecione a conta
                      </option>

                      {contas.map(
                        (
                          conta,
                          index
                        ) => (
                          <option
                            key={
                              conta.id ??
                              conta.uuid ??
                              index
                            }
                            value={
                              index
                            }
                          >
                            {
                              conta.name
                            }
                          </option>
                        )
                      )}
                    </select>

                    <input
                      type="text"
                      placeholder="Descrição da conta"
                      value={
                        descricaoContaPagar
                      }
                      onChange={(e) =>
                        setDescricaoContaPagar(
                          e.target.value
                        )
                      }
                      required
                      style={
                        campo
                      }
                    />

                    <input
                      type="number"
                      placeholder="Valor"
                      value={
                        valorContaPagar
                      }
                      onChange={(e) =>
                        setValorContaPagar(
                          e.target.value
                        )
                      }
                      required
                      step="0.01"
                      style={
                        campo
                      }
                    />

                    <input
                      type="date"
                      value={
                        vencimentoContaPagar
                      }
                      onChange={(e) =>
                        setVencimentoContaPagar(
                          e.target.value
                        )
                      }
                      required
                      style={
                        campo
                      }
                    />

                    <button
                      type="submit"
                      style={
                        botao
                      }
                    >
                      Adicionar conta a pagar
                    </button>
                  </form>

                  <ListaVazia
                    vazio={
                      contasPagar.length ===
                      0
                    }
                    texto="Nenhuma conta a pagar cadastrada."
                  >
                    {contasPagar.map(
                      (
                        conta
                      ) => {
                        const paga =
                          conta.status ===
                          "paid";

                        return (
                          <div
                            key={
                              conta.id
                            }
                            style={{
                              ...itemStyle,
                              display:
                                "block",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                justifyContent:
                                  "space-between",
                                gap: 15,
                              }}
                            >
                              <div>
                                <strong>
                                  {
                                    conta.description
                                  }
                                </strong>

                                <div
                                  style={{
                                    color:
                                      "#666",
                                    fontSize: 12,
                                    marginTop: 6,
                                  }}
                                >
                                  Vencimento:{" "}
                                  {formatarData(
                                    conta.due_date
                                  )}
                                </div>

                                <div
                                  style={{
                                    color:
                                      "#888",
                                    fontSize: 12,
                                    marginTop: 5,
                                  }}
                                >
                                  Status:{" "}
                                  {paga
                                    ? "Paga"
                                    : "Pendente"}
                                </div>
                              </div>

                              <div
                                style={{
                                  textAlign:
                                    "right",
                                }}
                              >
                                <strong>
                                  R${" "}
                                  {Number(
                                    conta.amount ||
                                      0
                                  )
                                    .toFixed(
                                      2
                                    )
                                    .replace(
                                      ".",
                                      ","
                                    )}
                                </strong>

                                {!paga && (
                                  <button
                                    onClick={() =>
                                      pagarConta(
                                        conta
                                      )
                                    }
                                    style={{
                                      display:
                                        "block",
                                      marginTop:
                                        10,
                                      padding:
                                        "9px 12px",
                                      background:
                                        "#fff",
                                      color:
                                        "#000",
                                      border: 0,
                                      borderRadius:
                                        7,
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    Pagar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </ListaVazia>

                  <div
                    style={{
                      marginTop: 35,
                    }}
                  >
                    <span>
                      FATURAS DO CARTÃO
                    </span>

                    <h2>
                      Faturas a pagar
                    </h2>

                    {faturas.filter(
                      (fatura) =>
                        fatura.status !==
                        "paid"
                    ).length === 0 ? (
                      <p>
                        Nenhuma fatura de cartão
                        pendente.
                      </p>
                    ) : (
                      faturas
                        .filter(
                          (fatura) =>
                            fatura.status !==
                            "paid"
                        )
                        .map(
                          (
                            fatura
                          ) => {
                            const cartao =
                              cartoes.find(
                                (
                                  item
                                ) =>
                                  String(
                                    item.id
                                  ) ===
                                  String(
                                    fatura.card_id
                                  )
                              );

                            const restante =
                              Math.max(
                                0,
                                Number(
                                  fatura.total_amount ||
                                    0
                                ) -
                                  Number(
                                    fatura.paid_amount ||
                                      0
                                  )
                              );

                            return (
                              <div
                                key={`fatura-pagar-${fatura.id}`}
                                style={{
                                  ...itemStyle,
                                  display:
                                    "block",
                                }}
                              >
                                <div
                                  style={{
                                    display:
                                      "flex",
                                    justifyContent:
                                      "space-between",
                                    gap: 15,
                                    alignItems:
                                      "center",
                                  }}
                                >
                                  <div>
                                    <strong>
                                      {
                                        cartao?.name ||
                                        "Cartão"
                                      }{" "}
                                      — Fatura
                                    </strong>

                                    <div
                                      style={{
                                        color:
                                          "#666",
                                        fontSize: 12,
                                        marginTop: 6,
                                      }}
                                    >
                                      Vencimento:{" "}
                                      {formatarData(
                                        fatura.due_date
                                      )}
                                    </div>

                                    <div
                                      style={{
                                        color:
                                          "#777",
                                        fontSize: 12,
                                        marginTop: 5,
                                      }}
                                    >
                                      Restante:
                                      {" "}
                                      R${" "}
                                      {restante
                                        .toFixed(
                                          2
                                        )
                                        .replace(
                                          ".",
                                          ","
                                        )}
                                    </div>
                                  </div>

                                  <div
                                    style={{
                                      minWidth:
                                        180,
                                    }}
                                  >
                                    <select
                                      value={
                                        contasFaturaSelecionadas[
                                          fatura.id
                                        ] ||
                                        ""
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        setContasFaturaSelecionadas(
                                          (
                                            atual
                                          ) => ({
                                            ...atual,
                                            [fatura.id]:
                                              e.target
                                                .value,
                                          })
                                        )
                                      }
                                      style={{
                                        ...campo,
                                        marginBottom:
                                          8,
                                      }}
                                    >
                                      <option value="">
                                        Conta para pagar
                                      </option>

                                      {contas.map(
                                        (
                                          conta
                                        ) => (
                                          <option
                                            key={
                                              conta.id ??
                                              conta.uuid
                                            }
                                            value={
                                              conta.id ??
                                              conta.uuid
                                            }
                                          >
                                            {
                                              conta.name
                                            }
                                          </option>
                                        )
                                      )}
                                    </select>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        pagarFatura(
                                          fatura
                                        )
                                      }
                                      style={{
                                        ...botao,
                                        marginTop:
                                          0,
                                      }}
                                    >
                                      Pagar fatura
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )
                    )}
                  </div>
                </>
              )}

              {active ===
                "Compromissos" && (
                <>
                  <span>FINANÇAS</span>
                  <h2>Compromissos</h2>

                  <form onSubmit={criarCompromisso} style={{ marginTop: 20 }}>
                    <select
                      value={contaCompromissoSelecionada}
                      onChange={(e) => setContaCompromissoSelecionada(e.target.value)}
                      required
                      style={campo}
                    >
                      <option value="">Selecione a conta</option>
                      {contas.map((conta, index) => (
                        <option key={conta.id ?? conta.uuid ?? index} value={index}>
                          {conta.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Descrição do compromisso"
                      value={descricaoCompromisso}
                      onChange={(e) => setDescricaoCompromisso(e.target.value)}
                      required
                      style={campo}
                    />

                    <input
                      type="number"
                      placeholder="Valor"
                      value={valorCompromisso}
                      onChange={(e) => setValorCompromisso(e.target.value)}
                      required
                      step="0.01"
                      style={campo}
                    />

                    <input
                      type="date"
                      value={vencimentoCompromisso}
                      onChange={(e) => setVencimentoCompromisso(e.target.value)}
                      required
                      style={campo}
                    />

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="submit" style={botao}>
                        {compromissoEditando ? "Salvar alterações" : "Adicionar compromisso"}
                      </button>
                      {compromissoEditando && (
                        <button type="button" onClick={cancelarEdicaoCompromisso} style={{ ...botao, background: "#222", color: "#fff" }}>
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>

                  <ListaVazia
                    vazio={contasPagar.filter((item) => item.recurring === true).length === 0}
                    texto="Nenhum compromisso recorrente cadastrado."
                  >
                    {contasPagar
                      .filter((item) => item.recurring === true)
                      .map((compromisso) => (
                        <div key={compromisso.id} style={{ ...itemStyle, display: "block" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 15, alignItems: "center" }}>
                            <div>
                              <strong>{compromisso.description}</strong>
                              <div style={{ color: "#777", fontSize: 12, marginTop: 6 }}>
                                Vencimento: {formatarData(compromisso.due_date)}
                              </div>
                              <div style={{ color: "#888", fontSize: 12, marginTop: 5 }}>
                                {compromisso.status === "paid" ? "Paga" : "Pendente"}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <strong>R$ {Number(compromisso.amount || 0).toFixed(2).replace(".", ",")}</strong>
                              <button
                                type="button"
                                onClick={() => editarCompromisso(compromisso)}
                                style={{ display: "block", marginTop: 10, padding: "9px 12px", background: "#fff", color: "#000", border: 0, borderRadius: 7, fontWeight: 700 }}
                              >
                                Editar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </ListaVazia>
                </>
              )}

              {active ===
                "Cartões" && (
                <>
                  <span>
                    CRÉDITO
                  </span>

                  <h2>
                    Meus cartões
                  </h2>

                  <form
                    onSubmit={
                      cartaoEditando
                        ? salvarEdicaoCartao
                        : criarCartao
                    }
                    style={{
                      marginTop: 20,
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Nome do cartão"
                      value={
                        nomeCartao
                      }
                      onChange={(e) =>
                        setNomeCartao(
                          e.target.value
                        )
                      }
                      required
                      style={
                        campo
                      }
                    />

                    <input
                      type="text"
                      placeholder="Banco"
                      value={
                        bancoCartao
                      }
                      onChange={(e) =>
                        setBancoCartao(
                          e.target.value
                        )
                      }
                      style={
                        campo
                      }
                    />

                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="Últimos 4 dígitos"
                      value={
                        ultimosQuatro
                      }
                      onChange={(e) =>
                        setUltimosQuatro(
                          e.target.value
                            .replace(
                              /\D/g,
                              ""
                            )
                            .slice(
                              0,
                              4
                            )
                        )
                      }
                      style={
                        campo
                      }
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Limite de crédito"
                      value={
                        limiteCartao
                      }
                      onChange={(e) =>
                        setLimiteCartao(
                          e.target.value
                        )
                      }
                      required
                      style={
                        campo
                      }
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Limite disponível"
                      value={
                        limiteDisponivel
                      }
                      readOnly
                      style={{
                        ...campo,
                        opacity:
                          0.65,
                      }}
                    />

                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Dia de fechamento"
                      value={
                        fechamentoCartao
                      }
                      onChange={(e) =>
                        setFechamentoCartao(
                          e.target.value
                        )
                      }
                      style={
                        campo
                      }
                    />

                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Dia de vencimento"
                      value={
                        vencimentoCartao
                      }
                      onChange={(e) =>
                        setVencimentoCartao(
                          e.target.value
                        )
                      }
                      style={
                        campo
                      }
                    />

                    <input
                      type="text"
                      placeholder="Bandeira"
                      value={
                        bandeiraCartao
                      }
                      onChange={(e) =>
                        setBandeiraCartao(
                          e.target.value
                        )
                      }
                      style={
                        campo
                      }
                    />

                    <label
                      style={{
                        display:
                          "block",
                        marginTop:
                          12,
                        color:
                          "#777",
                        fontSize:
                          12,
                      }}
                    >
                      Cor do cartão

                      <input
                        type="color"
                        value={
                          corCartao
                        }
                        onChange={(e) =>
                          setCorCartao(
                            e.target.value
                          )
                        }
                        style={{
                          display:
                            "block",
                          width: 60,
                          height: 38,
                          marginTop: 8,
                          background:
                            "#111",
                          border:
                            "1px solid #292929",
                          borderRadius:
                            8,
                        }}
                      />
                    </label>

                    <button
                      type="submit"
                      style={
                        botao
                      }
                    >
                      {cartaoEditando
                        ? "Salvar alterações"
                        : "Adicionar cartão"}
                    </button>

                    {cartaoEditando && (
                      <button
                        type="button"
                        onClick={
                          cancelarEdicaoCartao
                        }
                        style={{
                          ...troca,
                          marginTop:
                            6,
                          border:
                            "1px solid #292929",
                          borderRadius:
                            9,
                        }}
                      >
                        Cancelar edição
                      </button>
                    )}
                  </form>

                  <div
                    style={{
                      marginTop: 35,
                    }}
                  >
                    <h3>
                      Cartões cadastrados
                    </h3>

                    {cartoes.length ===
                    0 ? (
                      <p>
                        Nenhum cartão
                        cadastrado.
                      </p>
                    ) : (
                      cartoes.map(
                        (
                          cartao
                        ) => (
                          <div
                            key={
                              getCardId(cartao)
                            }
                            style={{
                              padding:
                                18,
                              marginTop:
                                10,
                              background:
                                "#111",
                              border: `1px solid ${
                                cartao.color ||
                                "#222"
                              }`,
                              borderRadius:
                                12,
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                justifyContent:
                                  "space-between",
                              }}
                            >
                              <div>
                                <strong>
                                  {
                                    cartao.name
                                  }
                                </strong>

                                <div
                                  style={{
                                    color:
                                      "#777",
                                    fontSize:
                                      12,
                                    marginTop:
                                      6,
                                  }}
                                >
                                  {cartao.bank_name ||
                                    "Banco não informado"}

                                  {cartao.last_four_digits
                                    ? ` •••• ${cartao.last_four_digits}`
                                    : ""}
                                </div>
                              </div>

                              <div
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  gap: 10,
                                }}
                              >
                                <span
                                  style={{
                                    width:
                                      14,
                                    height:
                                      14,
                                    borderRadius:
                                      "50%",
                                    background:
                                      cartao.color ||
                                      "#fff",
                                  }}
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    iniciarEdicaoCartao(
                                      cartao
                                    )
                                  }
                                  style={{
                                    padding:
                                      "8px 12px",
                                    background:
                                      "#fff",
                                    color:
                                      "#000",
                                    border: 0,
                                    borderRadius:
                                      7,
                                    fontWeight:
                                      700,
                                    cursor:
                                      "pointer",
                                  }}
                                >
                                  Editar
                                </button>
                              </div>
                            </div>

                            <div
                              style={{
                                display:
                                  "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fit,minmax(150px,1fr))",
                                gap: 10,
                                marginTop:
                                  16,
                              }}
                            >
                              <div>
                                <small>
                                  Limite
                                </small>

                                <div>
                                  R${" "}
                                  {Number(
                                    cartao.credit_limit ||
                                      0
                                  )
                                    .toFixed(
                                      2
                                    )
                                    .replace(
                                      ".",
                                      ","
                                    )}
                                </div>
                              </div>

                              <div>
                                <small>
                                  Disponível
                                </small>

                                <div>
                                  R${" "}
                                  {Number(
                                    cartao.available_limit ??
                                      0
                                  )
                                    .toFixed(
                                      2
                                    )
                                    .replace(
                                      ".",
                                      ","
                                    )}
                                </div>
                              </div>

                              <div>
                                <small>
                                  Fechamento
                                </small>

                                <div>
                                  {cartao.closing_day ||
                                    "-"}
                                  º dia
                                </div>
                              </div>

                              <div>
                                <small>
                                  Vencimento
                                </small>

                                <div>
                                  {cartao.due_day ||
                                    "-"}
                                  º dia
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                color:
                                  "#666",
                                fontSize:
                                  12,
                                marginTop:
                                  12,
                              }}
                            >
                              {cartao.brand ||
                                "Bandeira não informada"}
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 40,
                      paddingTop:
                        30,
                      borderTop:
                        "1px solid #222",
                    }}
                  >
                    <span>
                      COMPRAS NO CARTÃO
                    </span>

                    <h2>
                      Nova compra
                    </h2>

                    <form
                      onSubmit={
                        criarCompra
                      }
                      style={{
                        marginTop:
                          20,
                      }}
                    >
                      <select
                        value={
                          cartaoCompra
                        }
                        onChange={(e) =>
                          setCartaoCompra(
                            e.target.value
                          )
                        }
                        required
                        style={
                          campo
                        }
                      >
                        <option value="">
                          Selecione o cartão
                        </option>

                        {cartoes.map(
                          (
                            cartao
                          ) => (
                            <option
                              key={
                                getCardId(cartao)
                              }
                              value={
                                getCardId(cartao)
                              }
                            >
                              {
                                cartao.name
                              }
                            </option>
                          )
                        )}
                      </select>

                      <input
                        type="text"
                        placeholder="Descrição da compra"
                        value={
                          descricaoCompra
                        }
                        onChange={(e) =>
                          setDescricaoCompra(
                            e.target.value
                          )
                        }
                        required
                        style={
                          campo
                        }
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Valor total"
                        value={
                          valorCompra
                        }
                        onChange={(e) =>
                          setValorCompra(
                            e.target.value
                          )
                        }
                        required
                        style={
                          campo
                        }
                      />

                      <input
                        type="date"
                        value={
                          dataCompra
                        }
                        onChange={(e) =>
                          setDataCompra(
                            e.target.value
                          )
                        }
                        required
                        style={
                          campo
                        }
                      />

                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Quantidade de parcelas"
                        value={
                          totalParcelasCompra
                        }
                        onChange={(e) =>
                          setTotalParcelasCompra(
                            e.target.value
                          )
                        }
                        required
                        style={
                          campo
                        }
                      />

                      <input
                        type="text"
                        placeholder="Observação (opcional)"
                        value={
                          observacaoCompra
                        }
                        onChange={(e) =>
                          setObservacaoCompra(
                            e.target.value
                          )
                        }
                        style={
                          campo
                        }
                      />

                      {Number(
                        totalParcelasCompra
                      ) > 1 &&
                        Number(
                          valorCompra
                        ) > 0 && (
                          <div
                            style={{
                              marginTop:
                                12,
                              padding:
                                14,
                              background:
                                "#111",
                              border:
                                "1px solid #222",
                              borderRadius:
                                9,
                              color:
                                "#aaa",
                            }}
                          >
                            Valor aproximado
                            de cada parcela:{" "}
                            <strong>
                              R${" "}
                              {(
                                Number(
                                  valorCompra
                                ) /
                                Number(
                                  totalParcelasCompra
                                )
                              )
                                .toFixed(
                                  2
                                )
                                .replace(
                                  ".",
                                  ","
                                )}
                            </strong>
                          </div>
                        )}

                      <button
                        type="submit"
                        style={
                          botao
                        }
                      >
                        Registrar compra
                      </button>
                    </form>
                  </div>

                  <div
                    style={{
                      marginTop: 35,
                    }}
                  >
                    <span>
                      HISTÓRICO
                    </span>

                    <h2>
                      Compras
                    </h2>

                    {compras.length ===
                    0 ? (
                      <p>
                        Nenhuma compra
                        cadastrada.
                      </p>
                    ) : (
                      compras.map(
                        (
                          compra
                        ) => {
                          const cartao =
                            cartoes.find(
                              (
                                item
                              ) =>
                                String(
                                  item.id
                                ) ===
                                String(
                                  compra.card_id
                                )
                            );

                          return (
                            <div
                              key={
                                compra.id
                              }
                              style={{
                                ...itemStyle,
                                display:
                                  "block",
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    "flex",
                                  justifyContent:
                                    "space-between",
                                  gap: 15,
                                }}
                              >
                                <div>
                                  <strong>
                                    {
                                      compra.description
                                    }
                                  </strong>

                                  <div
                                    style={{
                                      color:
                                        "#777",
                                      fontSize:
                                        12,
                                      marginTop:
                                        6,
                                    }}
                                  >
                                    {cartao?.name ||
                                      "Cartão"}{" "}
                                    •{" "}
                                    {formatarData(
                                      compra.purchase_date
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      color:
                                        "#666",
                                      fontSize:
                                        12,
                                      marginTop:
                                        5,
                                    }}
                                  >
                                    {compra.total_installments ||
                                      1}{" "}
                                    parcela(s)
                                  </div>
                                </div>

                                <strong>
                                  R${" "}
                                  {Number(
                                    compra.amount ||
                                      0
                                  )
                                    .toFixed(
                                      2
                                    )
                                    .replace(
                                      ".",
                                      ","
                                    )}
                                </strong>
                              </div>
                            </div>
                          );
                        }
                      )
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 35,
                    }}
                  >
                    <span>
                      PARCELAS
                    </span>

                    <h2>
                      Parcelas
                    </h2>

                    {parcelas.length ===
                    0 ? (
                      <p>
                        Nenhuma parcela
                        cadastrada.
                      </p>
                    ) : (
                      parcelas.map(
                        (
                          parcela
                        ) => (
                          <div
                            key={
                              parcela.id
                            }
                            style={
                              itemStyle
                            }
                          >
                            <div>
                              <strong>
                                Parcela{" "}
                                {
                                  parcela.installment_number
                                }
                                /
                                {
                                  parcela.total_installments
                                }
                              </strong>

                              <div
                                style={{
                                  color:
                                    "#666",
                                  fontSize:
                                    12,
                                  marginTop:
                                    5,
                                }}
                              >
                                Vencimento:{" "}
                                {formatarData(
                                  parcela.due_date
                                )}
                              </div>
                            </div>

                            <div>
                              <strong>
                                R${" "}
                                {Number(
                                  parcela.amount ||
                                    0
                                )
                                  .toFixed(
                                    2
                                  )
                                  .replace(
                                    ".",
                                    ","
                                  )}
                              </strong>

                              <div
                                style={{
                                  color:
                                    "#777",
                                  fontSize:
                                    12,
                                  marginTop:
                                    4,
                                  textAlign:
                                    "right",
                                }}
                              >
                                {parcela.status ===
                                "paid" ? (
                                  "Paga"
                                ) : (
                                  <>
                                    <select
                                      value={
                                        contasParcelaSelecionadas[
                                          parcela.id
                                        ] ||
                                        ""
                                      }
                                      onChange={(
                                        e
                                      ) =>
                                        setContasParcelaSelecionadas(
                                          (
                                            atual
                                          ) => ({
                                            ...atual,
                                            [parcela.id]:
                                              e
                                                .target
                                                .value,
                                          })
                                        )
                                      }
                                      style={{
                                        ...campo,
                                        marginTop:
                                          6,
                                        minWidth:
                                          150,
                                      }}
                                    >
                                      <option value="">
                                        Conta para pagar
                                      </option>

                                      {contas.map(
                                        (
                                          conta
                                        ) => (
                                          <option
                                            key={
                                              conta.id ??
                                              conta.uuid
                                            }
                                            value={
                                              conta.id ??
                                              conta.uuid
                                            }
                                          >
                                            {
                                              conta.name
                                            }
                                          </option>
                                        )
                                      )}
                                    </select>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        pagarParcela(
                                          parcela
                                        )
                                      }
                                      style={{
                                        ...botao,
                                        marginTop:
                                          6,
                                        padding:
                                          "8px 12px",
                                      }}
                                    >
                                      Pagar parcela
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 35,
                    }}
                  >
                    <span>
                      FATURAS
                    </span>

                    <h2>
                      Minhas faturas
                    </h2>

                    {faturas.length ===
                    0 ? (
                      <p>
                        Nenhuma fatura
                        cadastrada.
                      </p>
                    ) : (
                      faturas.map(
                        (
                          fatura
                        ) => {
                          const cartao =
                            cartoes.find(
                              (
                                item
                              ) =>
                                String(
                                  item.id
                                ) ===
                                String(
                                  fatura.card_id
                                )
                            );

                          const restante =
                            Math.max(
                              0,
                              Number(
                                fatura.total_amount ||
                                  0
                              ) -
                                Number(
                                  fatura.paid_amount ||
                                    0
                                )
                            );

                          return (
                            <div
                              key={
                                fatura.id
                              }
                              style={{
                                ...itemStyle,
                                display:
                                  "block",
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    "flex",
                                  justifyContent:
                                    "space-between",
                                  gap: 15,
                                }}
                              >
                                <div>
                                  <strong>
                                    {cartao?.name ||
                                      "Cartão"}
                                  </strong>

                                  <div
                                    style={{
                                      color:
                                        "#777",
                                      fontSize:
                                        12,
                                      marginTop:
                                        6,
                                    }}
                                  >
                                    Referência:{" "}
                                    {formatarData(
                                      fatura.reference_month
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      color:
                                        "#666",
                                      fontSize:
                                        12,
                                      marginTop:
                                        5,
                                    }}
                                  >
                                    Fechamento:{" "}
                                    {formatarData(
                                      fatura.closing_date
                                    )}
                                    {" • "}
                                    Vencimento:{" "}
                                    {formatarData(
                                      fatura.due_date
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      color:
                                        "#777",
                                      fontSize:
                                        12,
                                      marginTop:
                                        5,
                                    }}
                                  >
                                    Status:{" "}
                                    {fatura.status ||
                                      "open"}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    textAlign:
                                      "right",
                                  }}
                                >
                                  <strong>
                                    R${" "}
                                    {Number(
                                      fatura.total_amount ||
                                        0
                                    )
                                      .toFixed(
                                        2
                                      )
                                      .replace(
                                        ".",
                                        ","
                                      )}
                                  </strong>

                                  <div
                                    style={{
                                      color:
                                        "#777",
                                      fontSize:
                                        12,
                                      marginTop:
                                        5,
                                    }}
                                  >
                                    Restante: R${" "}
                                    {restante
                                      .toFixed(
                                        2
                                      )
                                      .replace(
                                        ".",
                                        ","
                                      )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )
                    )}
                  </div>
                </>
              )}

              {active ===
                "Relatórios" && (
                <>
                  <span>
                    FECHAMENTO
                  </span>

                  <h2>
                    Fechamento financeiro
                  </h2>

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit,minmax(220px,1fr))",
                      gap: 14,
                      marginTop: 25,
                    }}
                  >
                    <Resumo
                      titulo="Saldo atual"
                      valor={
                        totalContas
                      }
                    />

                    <Resumo
                      titulo="Total de entradas"
                      valor={
                        totalEntradas
                      }
                    />

                    <Resumo
                      titulo="Total de Saidas"
                      valor={
                        totalSaidas
                      }
                    />

                    <Resumo
                      titulo="Contas a pagar"
                      valor={
                        totalPagar
                      }
                    />

                    <Resumo
                      titulo="Faturas"
                      valor={
                        totalFaturas
                      }
                    />

                    <Resumo
                      titulo="Resultado"
                      valor={
                        totalEntradas -
                        totalSaidas
                      }
                    />
                  </div>
                </>
              )}

              {active === "Configurações" ? (
                <>
                  <span>CONFIGURAÇÕES</span>

                  <h2>Configurações</h2>

                  <div
                    style={{
                      display: "grid",
                      gap: 14,
                      marginTop: 25,
                      maxWidth: 850,
                    }}
                  >
                    <div
                      style={{
                        padding: 22,
                        background: "#0b0b0b",
                        border: "1px solid #222",
                        borderRadius: 14,
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: 14 }}>
                        Perfil da conta
                      </span>

                      <p style={{ marginTop: 10, lineHeight: 1.6 }}>
                        E-mail utilizado para entrar no Or Finance.
                      </p>

                      <div
                        style={{
                          marginTop: 15,
                          padding: 13,
                          background: "#111",
                          border: "1px solid #222",
                          borderRadius: 9,
                          color: "#aaa",
                        }}
                      >
                        {email}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 22,
                        background: "#0b0b0b",
                        border: "1px solid #222",
                        borderRadius: 14,
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: 14 }}>
                        Preferências
                      </span>

                      <p style={{ marginTop: 10, lineHeight: 1.6 }}>
                        Controle como os valores são exibidos no aplicativo.
                      </p>

                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginTop: 15,
                          color: "#aaa",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={mostrarSaldo}
                          onChange={(e) => setMostrarSaldo(e.target.checked)}
                        />
                        Mostrar valores financeiros
                      </label>
                    </div>

                    <div
                      style={{
                        padding: 22,
                        background: "#0b0b0b",
                        border: "1px solid #222",
                        borderRadius: 14,
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: 14 }}>
                        Segurança
                      </span>

                      <p style={{ marginTop: 10, lineHeight: 1.6 }}>
                        Altere sua senha de acesso ao Or Finance.
                      </p>

                      <input
                        type="password"
                        placeholder="Nova senha (mínimo 6 caracteres)"
                        value={senhaNova}
                        onChange={(e) => setSenhaNova(e.target.value)}
                        style={{
                          width: "100%",
                          maxWidth: 420,
                          marginTop: 12,
                          padding: 13,
                          background: "#111",
                          color: "#fff",
                          border: "1px solid #292929",
                          borderRadius: 9,
                          outline: "none",
                        }}
                      />

                      <br />

                      <button
                        onClick={alterarSenha}
                        disabled={alterandoSenha}
                        style={{
                          marginTop: 12,
                          padding: "11px 16px",
                          background: alterandoSenha ? "#333" : "#fff",
                          color: alterandoSenha ? "#888" : "#000",
                          border: 0,
                          borderRadius: 8,
                          fontWeight: 700,
                          cursor: alterandoSenha ? "not-allowed" : "pointer",
                        }}
                      >
                        {alterandoSenha ? "Alterando..." : "Alterar senha"}
                      </button>
                    </div>

                    <div
                      style={{
                        padding: 22,
                        background: "#0b0b0b",
                        border: "1px solid #222",
                        borderRadius: 14,
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: 14 }}>
                        Restaurar aplicativo
                      </span>

                      <p style={{ marginTop: 10, lineHeight: 1.6 }}>
                        Apaga todos os dados financeiros desta conta e mantém seu login.
                      </p>

                      <button
                        onClick={restaurarAplicativo}
                        disabled={restaurando}
                        style={{
                          marginTop: 18,
                          padding: "12px 16px",
                          background: restaurando ? "#333" : "#fff",
                          color: restaurando ? "#888" : "#000",
                          border: "0",
                          borderRadius: 8,
                          fontWeight: 700,
                          cursor: restaurando ? "not-allowed" : "pointer",
                        }}
                      >
                        {restaurando ? "Restaurando..." : "Restaurar aplicativo"}
                      </button>
                    </div>

                    <div
                      style={{
                        padding: 22,
                        background: "#0b0b0b",
                        border: "1px solid #222",
                        borderRadius: 14,
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: 14 }}>
                        Sessão
                      </span>

                      <p style={{ marginTop: 10, lineHeight: 1.6 }}>
                        Encerra o acesso à sua conta neste dispositivo.
                      </p>

                      <button
                        onClick={sair}
                        style={{
                          marginTop: 15,
                          padding: "11px 16px",
                          background: "#111",
                          color: "#fff",
                          border: "1px solid #333",
                          borderRadius: 8,
                          fontWeight: 700,
                        }}
                      >
                        Sair da conta
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                ![
                  "Contas",
                  "Entradas",
                  "Saidas",
                  "Contas a pagar",
                  "Cartões",
                  "Relatórios",
                  "Metas",
                ].includes(active) && (
                  <>
                    <span>MÓDULO</span>

                    <h2>{active}</h2>

                    <p>
                      Esta área será configurada em seguida.
                    </p>
                  </>
                )
              )}
              <button
                onClick={sair}
                style={{
                  marginTop: 25,
                  padding:
                    "10px 15px",
                  background:
                    "#111",
                  color: "#888",
                  border:
                    "1px solid #222",
                  borderRadius: 8,
                }}
              >
                Sair
              </button>

              <small
                style={{
                  display:
                    "block",
                  color:
                    "#444",
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

function ListaVazia({
  vazio,
  texto,
  children,
}) {
  return (
    <div
      style={{
        marginTop: 25,
      }}
    >
      {vazio
        ? <p>{texto}</p>
        : children}
    </div>
  );
}

function Resumo({
  titulo,
  valor,
}) {
  return (
    <div
      style={{
        padding: 20,
        background:
          "#111",
        border:
          "1px solid #222",
        borderRadius: 12,
      }}
    >
      <span>
        {titulo}
      </span>

      <h3
        style={{
          fontSize: 26,
        }}
      >
        R${" "}
        {Number(
          valor || 0
        )
          .toFixed(2)
          .replace(
            ".",
            ","
          )}
      </h3>
    </div>
  );
}

function Login() {
  const [email, setEmail] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [modoCadastro, setModoCadastro] =
    useState(false);

  const [mensagem, setMensagem] =
    useState("");

  async function entrar(e) {
    e.preventDefault();

    setMensagem(
      "Aguarde..."
    );

    const resultado =
      modoCadastro
        ? await supabase.auth.signUp({
            email,
            password:
              senha,
          })
        : await supabase.auth.signInWithPassword({
            email,
            password:
              senha,
          });

    if (resultado.error) {
      setMensagem(
        resultado.error
          .message
      );
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
        minHeight:
          "100vh",
        background:
          "#050505",
        color: "#fff",
        display:
          "grid",
        placeItems:
          "center",
        padding: 20,
      }}
    >
      <form
        onSubmit={entrar}
        style={{
          width:
            "100%",
          maxWidth:
            380,
          background:
            "#0b0b0b",
          border:
            "1px solid #222",
          borderRadius:
            18,
          padding: 28,
        }}
      >
        <h1>
          Or Finance
        </h1>

        <p
          style={{
            color:
              "#777",
          }}
        >
          {modoCadastro
            ? "Criar sua conta"
            : "Entrar na sua conta"}
        </p>

        <input
          type="email"
          placeholder="Seu e-mail"
          value={
            email
          }
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          required
          style={
            campo
          }
        />

        <input
          type="password"
          placeholder="Sua senha"
          value={
            senha
          }
          onChange={(e) =>
            setSenha(
              e.target.value
            )
          }
          required
          minLength={6}
          style={
            campo
          }
        />

        <button
          type="submit"
          style={
            botao
          }
        >
          {modoCadastro
            ? "Criar conta"
            : "Entrar"}
        </button>

        <button
          type="button"
          onClick={() => {
            setModoCadastro(
              !modoCadastro
            );

            setMensagem(
              ""
            );
          }}
          style={
            troca
          }
        >
          {modoCadastro
            ? "Já tenho uma conta"
            : "Ainda não tenho uma conta"}
        </button>

        {mensagem && (
          <p
            style={{
              color:
                "#aaa",
              marginTop:
                18,
            }}
          >
            {mensagem}
          </p>
        )}
      </form>
    </div>
  );
}

export default function App() {
  const [usuario, setUsuario] =
    useState(null);

  const [carregando, setCarregando] =
    useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(
        ({
          data,
        }) => {
          setUsuario(
            data.session
              ?.user ??
              null
          );

          setCarregando(
            false
          );
        }
      );

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          session
        ) => {
          setTimeout(
            () => {
              setUsuario(
                session
                  ?.user ??
                  null
              );
            },
            0
          );
        }
      );

    return () =>
      subscription.unsubscribe();
  }, []);

  async function sair() {
    await supabase.auth.signOut();
  }

  if (carregando) {
    return (
      <div
        style={{
          minHeight:
            "100vh",
          background:
            "#050505",
          color: "#fff",
          display:
            "grid",
          placeItems:
            "center",
        }}
      >
        Carregando...
      </div>
    );
  }

  if (!usuario) {
    return (
      <Login />
    );
  }

  return (
    <Painel
      email={
        usuario.email
      }
      userId={
        usuario.id
      }
      sair={sair}
    />
  );
}

const campo = {
  width:
    "100%",
  padding:
    "13px",
  marginTop:
    12,
  background:
    "#111",
  color:
    "#fff",
  border:
    "1px solid #292929",
  borderRadius:
    9,
  outline:
    "none",
};

const botao = {
  width:
    "100%",
  padding:
    "13px",
  marginTop:
    18,
  background:
    "#fff",
  color:
    "#000",
  border: 0,
  borderRadius:
    9,
  fontWeight:
    700,
  cursor:
    "pointer",
};

const troca = {
  width:
    "100%",
  padding:
    "12px",
  marginTop:
    8,
  background:
    "transparent",
  color:
    "#aaa",
  border: 0,
  cursor:
    "pointer",
};

const itemStyle = {
  padding:
    15,
  marginTop:
    10,
  background:
    "#111",
  border:
    "1px solid #222",
  borderRadius:
    10,
  display:
    "flex",
  justifyContent:
    "space-between",
  alignItems:
    "center",
  gap: 15,
};
