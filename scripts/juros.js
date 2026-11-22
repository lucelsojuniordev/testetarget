const formularioJuros = document.querySelector("#interest-form");
const campoValorOriginal = document.querySelector("#original-amount");
const campoDataVencimento = document.querySelector("#due-date");
const resultadoJuros = document.querySelector("#interest-result");

const formatarMoedaJuros = (valor) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const converterDataEmUtc = (valor) => {
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    return null;
  }
  return data;
};

formularioJuros.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const valorOriginal = Number(campoValorOriginal.value);
  const vencimento = converterDataEmUtc(campoDataVencimento.value);
  if (!Number.isFinite(valorOriginal) || valorOriginal <= 0 || !vencimento) {
    resultadoJuros.textContent = "Informe um valor válido e uma data de vencimento válida.";
    return;
  }

  const hoje = new Date();
  const hojeUtc = Date.UTC(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate()
  );
  const diasEmAtraso = Math.max(
    0,
    Math.floor((hojeUtc - vencimento.getTime()) / 86_400_000)
  );
  const juros = Math.round(valorOriginal * 0.025 * diasEmAtraso * 100) / 100;
  const totalAtualizado = Math.round((valorOriginal + juros) * 100) / 100;
  const textoDias =
    diasEmAtraso === 1 ? "1 dia em atraso" : `${diasEmAtraso} dias em atraso`;

  resultadoJuros.replaceChildren();
  const linhas = [
    ["Dias em atraso", textoDias],
    ["Juros (2,5% ao dia, simples)", formatarMoedaJuros(juros)],
    ["Valor total atualizado", formatarMoedaJuros(totalAtualizado)]
  ];

  for (const [rotulo, valor] of linhas) {
    const linha = document.createElement("div");
    const detalhe = document.createElement("span");
    detalhe.textContent = `${rotulo}: `;
    const destaque = document.createElement("strong");
    destaque.textContent = valor;
    linha.append(detalhe, destaque);
    resultadoJuros.append(linha, document.createTextNode(" "));
  }
});
