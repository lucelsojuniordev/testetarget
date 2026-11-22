const formatarMoedaComissao = (valor) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const obterPercentualComissao = (valor) => {
  if (valor < 100) return 0;
  if (valor < 500) return 0.01;
  return 0.05;
};

const corpoTabelaVendas = document.querySelector("#sales-results");
const cartoesTotais = document.querySelector("#commission-totals");
const formularioImportacaoVendas = document.querySelector("#sales-import-form");
const campoArquivoVendas = document.querySelector("#sales-file");
const statusImportacaoVendas = document.querySelector("#sales-import-status");

const validarVendas = (dados) => {
  if (!dados || typeof dados !== "object" || !Array.isArray(dados.vendas)) {
    throw new Error('O JSON deve conter uma propriedade "vendas" com uma lista.');
  }

  if (dados.vendas.length === 0) {
    throw new Error("A lista de vendas precisa conter pelo menos uma venda.");
  }

  for (const [indice, venda] of dados.vendas.entries()) {
    if (!venda || typeof venda !== "object" || Array.isArray(venda)) {
      throw new Error(`O registro ${indice + 1} não é um objeto válido.`);
    }

    if (typeof venda.vendedor !== "string" || venda.vendedor.trim() === "") {
      throw new Error(`O registro ${indice + 1} precisa ter um vendedor preenchido.`);
    }

    if (typeof venda.valor !== "number" || !Number.isFinite(venda.valor) || venda.valor < 0) {
      throw new Error(`O valor do registro ${indice + 1} deve ser um número igual ou maior que zero.`);
    }
  }

  return dados.vendas;
};

const renderizarComissoes = (vendas) => {
  const linhas = document.createDocumentFragment();
  const cartoes = document.createDocumentFragment();
  const totaisPorVendedor = new Map();

  for (const venda of vendas) {
    const percentual = obterPercentualComissao(venda.valor);
    const comissaoEmCentavos = Math.round(venda.valor * percentual * 100);
    totaisPorVendedor.set(
      venda.vendedor,
      (totaisPorVendedor.get(venda.vendedor) ?? 0) + comissaoEmCentavos
    );

    const linha = document.createElement("tr");
    const valores = [
      venda.vendedor.trim(),
      formatarMoedaComissao(venda.valor),
      `${percentual * 100}%`,
      formatarMoedaComissao(comissaoEmCentavos / 100)
    ];

    for (const valor of valores) {
      const celula = document.createElement("td");
      celula.textContent = valor;
      linha.append(celula);
    }
    linhas.append(linha);
  }

  for (const [vendedor, totalEmCentavos] of totaisPorVendedor) {
    const cartao = document.createElement("div");
    cartao.className = "total-card";

    const nome = document.createElement("span");
    nome.textContent = vendedor;
    const valor = document.createElement("strong");
    valor.textContent = formatarMoedaComissao(totalEmCentavos / 100);

    cartao.append(nome, valor);
    cartoes.append(cartao);
  }

  corpoTabelaVendas.replaceChildren(linhas);
  cartoesTotais.replaceChildren(cartoes);
};

formularioImportacaoVendas.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const arquivo = campoArquivoVendas.files[0];
  if (!arquivo) {
    statusImportacaoVendas.textContent = "Selecione um arquivo JSON para importar.";
    statusImportacaoVendas.classList.add("error");
    return;
  }

  try {
    const conteudo = await arquivo.text();
    const dados = JSON.parse(conteudo);
    const vendas = validarVendas(dados);
    renderizarComissoes(vendas);
    statusImportacaoVendas.textContent =
      `Arquivo "${arquivo.name}" importado com sucesso: ${vendas.length} venda(s) validada(s).`;
    statusImportacaoVendas.classList.remove("error");
  } catch (erro) {
    const mensagem =
      erro instanceof SyntaxError
        ? "O arquivo não contém um JSON válido."
        : erro.message || "Não foi possível ler o arquivo selecionado.";
    statusImportacaoVendas.textContent = `${mensagem} As comissões atuais foram mantidas.`;
    statusImportacaoVendas.classList.add("error");
  }
});
