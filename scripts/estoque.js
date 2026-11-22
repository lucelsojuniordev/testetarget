const produtosIniciais = [
  { codigoProduto: 101, descricaoProduto: "Caneta Azul", estoque: 150 },
  { codigoProduto: 102, descricaoProduto: "Caderno Universitário", estoque: 75 },
  { codigoProduto: 103, descricaoProduto: "Borracha Branca", estoque: 200 },
  { codigoProduto: 104, descricaoProduto: "Lápis Preto HB", estoque: 320 },
  { codigoProduto: 105, descricaoProduto: "Marcador de Texto Amarelo", estoque: 90 }
];

const chaveEstoque = "desafio-dev-estoque-v1";
const formularioMovimentacao = document.querySelector("#movement-form");
const seletorProduto = document.querySelector("#product-code");
const campoTipo = document.querySelector("#movement-type");
const campoQuantidade = document.querySelector("#movement-quantity");
const statusEstoque = document.querySelector("#inventory-status");
const corpoEstoque = document.querySelector("#inventory-results");
const corpoMovimentacoes = document.querySelector("#movement-results");

const mostrarStatusEstoque = (mensagem, erro = false) => {
  statusEstoque.textContent = mensagem;
  statusEstoque.classList.toggle("error", erro);
};

const criarEstadoInicial = () => ({
  produtos: produtosIniciais.map((produto) => ({ ...produto })),
  movimentacoes: [],
  proximoId: 1
});

const carregarEstadoEstoque = () => {
  const salvo = localStorage.getItem(chaveEstoque);
  if (salvo === null) return criarEstadoInicial();

  const estado = JSON.parse(salvo);
  const estadoValido =
    estado &&
    Array.isArray(estado.produtos) &&
    Array.isArray(estado.movimentacoes) &&
    Number.isInteger(estado.proximoId) &&
    estado.produtos.every(
      (produto) =>
        Number.isInteger(produto.codigoProduto) &&
        typeof produto.descricaoProduto === "string" &&
        Number.isInteger(produto.estoque) &&
        produto.estoque >= 0
    );

  if (!estadoValido) {
    throw new Error("Os dados de estoque salvos no navegador são inválidos.");
  }
  return estado;
};

const salvarEstadoEstoque = (estado) => {
  localStorage.setItem(chaveEstoque, JSON.stringify(estado));
};

const renderizarEstoque = (estado) => {
  seletorProduto.replaceChildren();
  for (const produto of estado.produtos) {
    const opcao = document.createElement("option");
    opcao.value = String(produto.codigoProduto);
    opcao.textContent = `${produto.codigoProduto} - ${produto.descricaoProduto}`;
    seletorProduto.append(opcao);
  }

  corpoEstoque.replaceChildren();
  for (const produto of estado.produtos) {
    const linha = document.createElement("tr");
    for (const valor of [
      produto.codigoProduto,
      produto.descricaoProduto,
      produto.estoque
    ]) {
      const celula = document.createElement("td");
      celula.textContent = String(valor);
      linha.append(celula);
    }
    corpoEstoque.append(linha);
  }

  corpoMovimentacoes.replaceChildren();
  for (const movimentacao of [...estado.movimentacoes].reverse()) {
    const linha = document.createElement("tr");
    const valores = [
      movimentacao.id,
      movimentacao.produto,
      movimentacao.tipo === "entrada" ? "Entrada" : "Saída",
      movimentacao.quantidade,
      movimentacao.estoqueFinal
    ];
    for (const valor of valores) {
      const celula = document.createElement("td");
      celula.textContent = String(valor);
      linha.append(celula);
    }
    corpoMovimentacoes.append(linha);
  }
};


let estadoEstoque;
try {
  estadoEstoque = carregarEstadoEstoque();
  renderizarEstoque(estadoEstoque);
} catch (erro) {
  mostrarStatusEstoque(`Não foi possível carregar o estoque: ${erro.message}`, true);
  formularioMovimentacao.querySelectorAll("input, select, button").forEach((campo) => {
    campo.disabled = true;
  });
}

formularioMovimentacao.addEventListener("submit", (evento) => {
  evento.preventDefault();
  if (!estadoEstoque) return;

  const codigoProduto = Number(seletorProduto.value);
  const quantidade = Number(campoQuantidade.value);
  const tipo = campoTipo.value;
  const produto = estadoEstoque.produtos.find(
    (item) => item.codigoProduto === codigoProduto
  );

  if (!produto || !Number.isInteger(quantidade) || quantidade <= 0) {
    mostrarStatusEstoque("Informe um produto e uma quantidade inteira positiva.", true);
    return;
  }

  if (tipo === "saida" && quantidade > produto.estoque) {
    mostrarStatusEstoque(
      `Estoque insuficiente. Disponível para ${produto.descricaoProduto}: ${produto.estoque}.`,
      true
    );
    return;
  }

  const estoqueFinal =
    tipo === "entrada" ? produto.estoque + quantidade : produto.estoque - quantidade;
  const novaMovimentacao = {
    id: estadoEstoque.proximoId,
    produto: produto.descricaoProduto,
    codigoProduto,
    tipo,
    quantidade,
    estoqueFinal
  };
  const novoEstado = {
    ...estadoEstoque,
    produtos: estadoEstoque.produtos.map((item) =>
      item.codigoProduto === codigoProduto
        ? { ...item, estoque: estoqueFinal }
        : item
    ),
    movimentacoes: [...estadoEstoque.movimentacoes, novaMovimentacao],
    proximoId: estadoEstoque.proximoId + 1
  };

  try {
    salvarEstadoEstoque(novoEstado);
  } catch (erro) {
    mostrarStatusEstoque(`Não foi possível salvar a movimentação: ${erro.message}`, true);
    return;
  }

  estadoEstoque = novoEstado;
  renderizarEstoque(estadoEstoque);
  formularioMovimentacao.reset();
  mostrarStatusEstoque(
    `Movimentação #${novaMovimentacao.id} registrada. Estoque final de ${produto.descricaoProduto}: ${estoqueFinal}.`
  );
});
