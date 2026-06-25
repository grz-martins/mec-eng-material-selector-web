const API = "https://mec-eng-material-selector-api-1.onrender.com";

// =========================
// Cabeçalho do Projeto
// =========================
async function carregarCabecalho() {

    const projectId = localStorage.getItem("projetoSelecionado");
    const descricaoFormula = localStorage.getItem("descricaoFormula");
    const categorias = localStorage.getItem("categoriasSelecionadas") || "todos";

    // 1. Buscar nome e time do projeto no backend
    let nomeProjeto = "—";
    let timeProjeto = "—";
    try {
        const resp = await fetch(`${API}/api/projects/${projectId}`);
        const json = await resp.json();

        nomeProjeto = json.data?.name || "—";
        timeProjeto = json.data?.team || "—"
    } catch (e) {
        nomeProjeto = "—";
        timeProjeto = "—";
    }

    // 2. Buscar requisitos do projeto
    let requisitos = [];
    try {
        const resp = await fetch(`${API}/api/projects/${projectId}/requirements`);
        const json = await resp.json();
        requisitos = json.data || [];
    } catch (e) {
        requisitos = [];
    }

    // 3. Renderizar no HTML
    document.getElementById("infoProjetoNome").innerHTML =
        `<strong>Nome do projeto selecionado:</strong> ${nomeProjeto}`;

    document.getElementById("infoProjetoTime").innerHTML =
        `<strong>Time responsável:</strong> ${timeProjeto}`;

    if (requisitos.length === 0) {
        document.getElementById("infoProjetoRequisitos").innerHTML =
            `<strong>Requisitos do projeto:</strong> Nenhum requisito cadastrado`;
    } else {
        let htmlReq = `<strong>Requisitos:</strong><ul>`;
        requisitos.forEach(r => {
            htmlReq += `<li>${r.type} = ${r.value} ${r.unit}</li>`;
        });
        htmlReq += `</ul>`;
        document.getElementById("infoProjetoRequisitos").innerHTML = htmlReq;
    }

    document.getElementById("infoProjetoMerito").innerHTML =
        `<strong>Indice de mérito usado para o score:</strong> ${descricaoFormula}`;

    document.getElementById("infoProjetoCategorias").innerHTML =
        `<strong>Categorias de materiais retornados no resultado:</strong> ${categorias}`;
}

carregarCabecalho();

// =========================
// Tradução de categorias
// =========================
function traduzirCategoria(cat) {
    const mapa = {
        "metal": "Metais",
        "composite": "Compósitos",
        "polymer": "Polímeros",
        "ceramic": "Cerâmicas",

        "metais": "Metais",
        "compositos": "Compósitos",
        "polimeros": "Polímeros",
        "ceramicas": "Cerâmicas"
    };
    return mapa[cat] || cat;
}

// =========================
// Renderização do ranking
// =========================
function renderResultados(lista) {
    const tbody = document.querySelector("#tabelaResultados tbody");
    tbody.innerHTML = "";

    if (!lista || lista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:15px; color:#555;">
                    Nenhum resultado encontrado para este projeto
                </td>
            </tr>
        `;
        return;
    }

    lista.forEach((item, index) => {
        const idMaterial = item.materialId ?? "—";
        const nome = item.materialName ?? `Material de ID ${item.materialId}`;
        const categoria = item.materialCategory ?? "—";
        const score = item.score?.toFixed(4) ?? "-";
        const notes = item.notes ?? "—";
        const source = item.materialSource ?? "—";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${index + 1}º</td>
            <td>${nome}</td>
            <td>${categoria}</td>
            <td>${score}</td>
            <td>${notes}</td>
            <td>${source}</td>
        `;
        tbody.appendChild(tr);
    });
}

// =========================
// Carregar ranking
// =========================
document.getElementById("btnCarregarResultados").onclick = async () => {

    const projectId = localStorage.getItem("projetoSelecionado");
    if (!projectId) {
        alert("Nenhum projeto foi selecionado na etapa anterior.");
        return;
    }

    const categorias = localStorage.getItem("categoriasSelecionadas");
    const formula = localStorage.getItem("formulaSelecionada");
    let urlRanking = `${API}/api/selection/project/${projectId}/ranked`;

    // Se tiver categorias, adiciona primeiro
    if (categorias && categorias.trim() !== "" && categorias !== "todos") {
        urlRanking += `?categories=${categorias}&formula=${formula}`;
    } else {
        // Se não tiver categorias, só envia a fórmula
        urlRanking += `?formula=${formula}`;
    }

    try {
        const resp = await fetch(urlRanking);
        const json = await resp.json();

        const lista = json.data ?? [];
        renderResultados(lista);

    } catch (e) {
        alert("O backend ainda não possui rota /api/selection/project/{projectId}/ranked");
    }
};

// =========================
// Relatório com gráfico
// =========================
document.getElementById("btnGerarRelatorio").onclick = async () => {

    const projectId = localStorage.getItem("projetoSelecionado");
    if (!projectId) {
        alert("Nenhum projeto foi selecionado na etapa anterior.");
        return;
    }

    const categorias = localStorage.getItem("categoriasSelecionadas");
    const formula = localStorage.getItem("formulaSelecionada");
    let urlReport = `${API}/api/selection/project/${projectId}/resume`;

    if (categorias && categorias.trim() !== "" && categorias !== "todos") {
        urlReport += `?categories=${categorias}&formula=${formula}`;
    } else {
        // Se não tiver categorias, só envia a fórmula
        urlReport += `?formula=${formula}`;
    }

    try {
        const resp = await fetch(urlReport);
        const json = await resp.json();

// Se não houver dados no relatório
        if (!json.data || !json.data.reportText) {
            document.getElementById("output").innerHTML = `
            <div class="painel-relatorio">
                <h2>Resumo da Seleção de Materiais</h2>
                <div class="linha">Nenhum relatório encontrado para este projeto.</div>
            </div>
        `;
            return;
        }

        const texto = json.data.reportText;
        const chartBase64 = json.data.chartBase64 || null;
        ;

        // Quebra em linhas
        const linhas = texto.split("\n");

        // Monta painel estilizado
        let html = `<div class="painel-relatorio"><h2>Resumo da Seleção de Materiais</h2>`;

        linhas.forEach(l => {
            if (l.trim() !== "") {
                html += `<div class="linha">${l}</div>`;
            }
        });

        html += `</div>`;

        // Se existir gráfico, renderiza abaixo do relatório
        if (chartBase64) {
            html += `
            	<div class="painel-grafico"><h2>Gráfico (Baseado nos índices de desempenho)</h2>
                	<div class="grafico-wrapper">
            		    <img src="data:image/png;base64,${chartBase64}" class="grafico-ashby"/>
        		</div>
            	</div>
        	`;
        } else {
            html += `
            <div class="painel-grafico">
                <h2>Gráfico</h2>
                <div class="linha">Nenhum gráfico disponível para este relatório.</div>
            </div>
        `;
        }

        document.getElementById("output").innerHTML = html;

    } catch (e) {
        document.getElementById("output").innerHTML = `
        <div class="painel-relatorio">
            <div class="linha">Erro ao gerar relatório. Verifique o backend.</div>
        </div>
    `;
    }
};

// =========================
// Exportar PDF
// =========================
document.getElementById("btnExportarPDF").onclick = () => {

    // Seleciona todos os botões que devem sumir no PDF
    const botoes = document.querySelectorAll(".no-pdf");

    // Esconde antes de gerar o PDF
    botoes.forEach(btn => btn.classList.add("hide-for-pdf"));

    const elemento = document.querySelector(".container");

    const options = {
        margin: 10,
        filename: 'relatorio-material-selector.pdf',
        image: {type: 'jpeg', quality: 0.98},
        html2canvas: {scale: 2, scrollY: 0},
        jsPDF: {unit: 'mm', format: 'a4', orientation: 'portrait'},
        pagebreak: {mode: ['avoid-all', 'css', 'legacy']}
    };

    html2pdf()
        .set(options)
        .from(elemento)
        .save()
        .then(() => {
            // Reexibe os botões depois que o PDF for gerado
            botoes.forEach(btn => btn.classList.remove("hide-for-pdf"));
        });
};

