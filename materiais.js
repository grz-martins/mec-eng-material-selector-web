const API = "http://localhost:9000"; // Porta DEV do backend

// =========================
// Tradução de categorias
// =========================
function traduzirCategoria(cat) {
    const mapa = {
        "metal": "Metal",
        "composite": "Compósito",
        "polymer": "Polímero",
        "ceramic": "Cerâmica",

    };
    return mapa[cat] || cat;
}

// =========================
// Controle dos filtros
// =========================
const chkTodos = document.getElementById("chkTodos");
const chkCats = document.querySelectorAll(".chkCat");

chkTodos.addEventListener("change", () => {
    if (chkTodos.checked) {
        chkCats.forEach(c => c.checked = false);
    }
});

chkCats.forEach(c => {
    c.addEventListener("change", () => {
        if (chkTodos.checked) chkTodos.checked = false;

        const selecionados = [...chkCats].filter(x => x.checked);
        if (selecionados.length > 3) {
            alert("Selecione no máximo 3 categorias.");
            c.checked = false;
        }
    });
});

function getCategoriasSelecionadas() {
    if (chkTodos.checked) return ["todos"];
    return [...chkCats].filter(c => c.checked).map(c => c.value);
}

// =========================
// Renderização da tabela
// =========================
function renderMateriais(lista) {
    const tbody = document.querySelector("#tabelaMateriais tbody");
    tbody.innerHTML = "";

    lista.forEach(m => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${m.name}</td>
            <td>${traduzirCategoria(m.category)}</td>
            <td>${m.density ?? "-"}</td>
            <td>${m.youngModulus ?? "-"}</td>
            <td>${m.yieldStrength ?? "-"}</td>
            <td>${m.ultimateStrength ?? "-"}</td>
            <td>${m.fractureToughness ?? "-"}</td>
            <td>${m.thermalConductivity ?? "-"}</td>
            <td>${m.costPerKg ?? "-"}</td>
        `;

        tbody.appendChild(tr);
    });
}

// =========================
// Carregar materiais
// =========================
async function carregarMateriais() {
    const categorias = getCategoriasSelecionadas();

    let url = `${API}/api/materials`;

    // Se NÃO for "todos", aplica filtro
    if (!(categorias.length === 1 && categorias[0] === "todos") && categorias.length > 0) {
        url += `/filter?categories=${categorias.join(",")}`;
    }

    const resp = await fetch(url);
    const json = await resp.json();

    renderMateriais(json.data);
}

function algumFiltroSelecionado() {
    return chkTodos.checked || [...chkCats].some(c => c.checked);
}

document.getElementById("btnCarregarMateriais").onclick = () => {
    if (!algumFiltroSelecionado()) {
        alert("Selecione pelo menos um filtro de categoria antes de carregar os materiais.");
        return;
    }
    carregarMateriais();
};


// =========================
// Formulário de novo material
// =========================
document.getElementById("btnNovoMaterial").onclick = () => {
    document.getElementById("formNovoMaterial").style.display = "block";
};

document.getElementById("btnCancelarMaterial").onclick = () => {
    document.getElementById("formNovoMaterial").style.display = "none";
};

document.getElementById("btnSalvarMaterial").onclick = async () => {

    const body = {
        name: document.getElementById("novoMaterialNome").value,
        category: document.getElementById("novoMaterialCategoria").value,
        density: parseFloat(document.getElementById("novoMaterialDensidade").value),
        youngModulus: parseFloat(document.getElementById("novoMaterialYoung").value),
        yieldStrength: parseFloat(document.getElementById("novoMaterialEscoamento").value),
        ultimateStrength: parseFloat(document.getElementById("novoMaterialResistencia").value),
        fractureToughness: parseFloat(document.getElementById("novoMaterialTenacidade").value),
        thermalConductivity: parseFloat(document.getElementById("novoMaterialCondutividade").value),
        costPerKg: parseFloat(document.getElementById("novoMaterialCusto").value),
        source: document.getElementById("novoMaterialFonte").value + " - Cadastro manual: usuário *"
    };

    await fetch(`${API}/api/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    document.getElementById("formNovoMaterial").style.display = "none";
    carregarMateriais();
};

// =========================
// Controle do botão Avançar
// =========================
const btnAvancar = document.getElementById("btnAvancar");

function algumFiltroMarcado() {
    return chkTodos.checked || [...chkCats].some(c => c.checked);
}

function atualizarBotaoAvancar() {
    if (algumFiltroMarcado()) {
        btnAvancar.classList.remove("btn-desabilitado");
    } else {
        btnAvancar.classList.add("btn-desabilitado");
    }
}

chkTodos.addEventListener("change", atualizarBotaoAvancar);
chkCats.forEach(c => c.addEventListener("change", atualizarBotaoAvancar));

btnAvancar.addEventListener("click", () => {
    if (!algumFiltroMarcado()) {
        alert("Selecione pelo menos um filtro de categoria antes de avançar.");
        return;
    }

    const categorias = getCategoriasSelecionadas();
    localStorage.setItem("categoriasSelecionadas", categorias.join(","));

    window.location.href = "resultados.html";
});

// Atualiza ao carregar
atualizarBotaoAvancar();
