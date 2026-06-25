const API = "https://mec-eng-material-selector-api-1.onrender.com";

// =========================
// Controle do checkbox "Todos"
// =========================
const chkTodos = document.getElementById("chkTodosProjetos");
const inputNome = document.getElementById("inputNomeProjeto");

chkTodos.checked = true;
inputNome.disabled = false;

// Se clicar no campo de nome → desmarca "Todos"
document.getElementById("divFiltroNome").addEventListener("click", () => {
    chkTodos.checked = false;
    inputNome.disabled = false;
});

// Quando marcar "Todos", limpar o campo e desabilitar
chkTodos.addEventListener("change", () => {
    if (chkTodos.checked) {
        inputNome.value = "";  // limpa o texto
    }
});

// =========================
// Renderização da tabela de projetos
// =========================
function renderProjetos(lista) {
    const tbody = document.querySelector("#tabelaProjetos tbody");
    tbody.innerHTML = "";

    lista.forEach(p => {
        const nome = p.name ?? p.nome ?? "—";
        const descricao = p.description ?? p.descricao ?? "—";
        const time = p.team ?? p.time ?? "—";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${nome}</td>
            <td>${descricao}</td>
            <td>${time}</td>
            <td>
    		<input type="checkbox" class="chkSelecionarProjeto" 
           		data-id="${p.id}" data-nome="${nome}">
	    </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll(".chkSelecionarProjeto").forEach(chk => {
        chk.addEventListener("change", () => {

            // Desmarca todos os outros checkboxes
            document.querySelectorAll(".chkSelecionarProjeto").forEach(outro => {
                if (outro !== chk) outro.checked = false;
            });

            // Se marcou, seleciona o projeto
            if (chk.checked) {
                selecionarProjeto(chk.dataset.id, chk.dataset.nome);
            } else {
                // Se desmarcou o único selecionado
                projetoSelecionado = null;
                document.getElementById("tituloProjetoSelecionado").textContent =
                    "Nenhum projeto selecionado";
                document.getElementById("listaRequisitos").innerHTML =
                    "<li>Nenhum projeto selecionado</li>";
            }
        });
    });

}

// =========================
// Paginação
// =========================
let paginaAtual = 0;
let totalPaginas = 0;

function atualizarPaginacao() {
    const lblPagina = document.getElementById("lblPagina");
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");

    lblPagina.textContent = `Página ${paginaAtual + 1} de ${totalPaginas}`;

    btnPrev.disabled = paginaAtual === 0;
    btnNext.disabled = paginaAtual === totalPaginas - 1;
}

// =========================
// Carregar projetos
// =========================
async function carregarProjetos(pagina = 0) {

    let url = `${API}/api/projects/paginated`;

    // Se NÃO for "todos", aplica filtro
    if (!chkTodos.checked && inputNome.value.trim() !== "") {
        url += `/filter?name=${inputNome.value.trim()}&page=${pagina}`;
    } else {
        url += `?page=${pagina}`;
    }

    const resp = await fetch(url);
    const json = await resp.json();

    // Atualiza variáveis globais
    paginaAtual = json.data.pageNumber;
    totalPaginas = json.data.totalPages;

    const lista = json.data.content ?? [];
    if (lista.length === 0) {
        const tbody = document.querySelector("#tabelaProjetos tbody");
        tbody.innerHTML = `
        <tr>
            <td colspan="4" style="text-align:center; padding:15px; color:#555;">
                Nenhum projeto encontrado
            </td>
        </tr>
    `;

        // Atualiza paginação para 0
        paginaAtual = 0;
        totalPaginas = 1;
        atualizarPaginacao();
        return;
    }
    renderProjetos(lista);

    atualizarPaginacao(); // Atualiza botões de paginação
}

document.getElementById("btnPrev").onclick = () => {
    if (paginaAtual > 0) carregarProjetos(paginaAtual - 1);
};

document.getElementById("btnNext").onclick = () => {
    if (paginaAtual < totalPaginas - 1) carregarProjetos(paginaAtual + 1);
};

document.getElementById("btnCarregarProjetos").onclick = () => carregarProjetos(0);

// =========================
// Novo projeto
// =========================
document.getElementById("btnNovoProjeto").onclick = () => {
    document.getElementById("formNovoProjeto").style.display = "block";
};

document.getElementById("btnCancelarProjeto").onclick = () => {
    document.getElementById("formNovoProjeto").style.display = "none";
};

document.getElementById("btnSalvarProjeto").onclick = async () => {
    const body = {
        name: document.getElementById("novoProjetoNome").value,
        description: document.getElementById("novoProjetoDesc").value,
        team: document.getElementById("novoProjetoTime").value
    };

    try {
        await fetch(`${API}/api/projects`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });

        document.getElementById("formNovoProjeto").style.display = "none";
        carregarProjetos(paginaAtual);
    } catch (e) {
        alert("O backend ainda não possui rota POST /api/projects");
    }
};

// =========================
// Seleção de projeto
// =========================
let projetoSelecionado = null;

async function selecionarProjeto(id, nome) {
    projetoSelecionado = id;
    localStorage.setItem("projetoSelecionado", id);

    // Zera o requisito selecionado ao trocar de projeto
    requisitoSelecionado = null;
    document.getElementById("reqSelecionado").textContent = "Nenhum requisito selecionado";

    document.getElementById("tituloProjetoSelecionado").textContent =
        `Projeto selecionado: ${nome}`;

    carregarRequisitos();
}

// =========================
// Requisitos
// =========================
async function carregarRequisitos() {
    const lista = document.getElementById("listaRequisitos");

    if (!projetoSelecionado) {
        lista.innerHTML = "<li>Nenhum projeto selecionado</li>";
        requisitoSelecionado = null;
        document.getElementById("reqSelecionado").textContent = "Nenhum requisito selecionado";
        return;
    }

    try {
        const resp = await fetch(`${API}/api/projects/${projetoSelecionado}/requirements`);
        const json = await resp.json();

        const requisitos = json.data ?? [];

        if (requisitos.length === 0) {
            lista.innerHTML = "<li>Nenhum requisito cadastrado</li>";
            requisitoSelecionado = null;
            document.getElementById("reqSelecionado").textContent = "Nenhum requisito selecionado";
            return;
        }

        lista.innerHTML = "";

        requisitos.forEach(r => {
            const li = document.createElement("li");

            li.textContent = `${r.type}: ${r.value} ${r.unit}`;
            li.dataset.id = r.id;
            li.dataset.type = r.type;
            li.dataset.value = r.value;
            li.dataset.unit = r.unit;
            li.style.cursor = "pointer";

            // Clique para selecionar o requisito
            li.onclick = () => {
                // Remove destaque dos outros
                document.querySelectorAll("#listaRequisitos li").forEach(x => {
                    x.style.background = "";
                });

                li.style.background = "#d0e7ff"; // Destaca o selecionado

                // Guarda o requisito selecionado
                requisitoSelecionado = {
                    id: r.id,
                    type: r.type,
                    value: r.value,
                    unit: r.unit
                };

                document.getElementById("reqSelecionado").textContent =
                    `Selecionado: ${r.type} = ${r.value}  ${r.unit ?? ""}`;

            };

            lista.appendChild(li);
        });

    } catch (e) {
        lista.innerHTML = "<li>Erro ao carregar requisitos</li>";
        requisitoSelecionado = null;
        document.getElementById("reqSelecionado").textContent = "Nenhum requisito selecionado";
    }
}

// =========================
// Incluir requisito
// =========================
document.getElementById("btnIncluirRequisito").onclick = () => {
    document.getElementById("formNovoRequisito").style.display = "block";

    // Habilita o select novamente
    document.getElementById("selectTipoRequisito").disabled = false;

    // Limpa os campos
    document.getElementById("selectTipoRequisito").value = "";
    document.getElementById("valorRequisito").value = "";

    editando = false;
};

document.getElementById("btnCancelarRequisito").onclick = () => {
    document.getElementById("formNovoRequisito").style.display = "none";
    document.getElementById("selectTipoRequisito").disabled = false;
};

document.getElementById("btnSalvarRequisito").onclick = async () => {
    if (!projetoSelecionado) {
        alert("Selecione um projeto antes de incluir requisitos.");
        return;
    }

    const body = {
        type: editando ? requisitoSelecionado.type : document.getElementById("selectTipoRequisito").value,
        value: parseFloat(document.getElementById("valorRequisito").value)
    };

    try {
        let resp;

        if (editando) {
            resp = await fetch(`${API}/api/projects/${projetoSelecionado}/requirements/${requisitoSelecionado.id}`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body)
            });

            editando = false;
            requisitoSelecionado = null;
            document.getElementById("reqSelecionado").textContent = "Nenhum requisito selecionado";

        } else {
            resp = await fetch(`${API}/api/projects/${projetoSelecionado}/requirements`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(body)
            });
        }

        const json = await resp.json();

        if (!json.success) {
            alert(json.message);
            return;
        }

        document.getElementById("formNovoRequisito").style.display = "none";
        carregarRequisitos();

    } catch (e) {
        alert("Erro ao salvar requisito.");
        console.error(e);
    }

    document.getElementById("formNovoRequisito").style.display = "none";
    carregarRequisitos();
};

// =========================
// Editar requisito
// =========================
let editando = false;

document.getElementById("btnEditarRequisito").onclick = () => {
    if (!requisitoSelecionado) {
        alert("Selecione um requisito para editar.");
        return;
    }

    // Mostra o formulário
    document.getElementById("formNovoRequisito").style.display = "block";

    // Bloqueia o select e mantém o tipo original
    document.getElementById("selectTipoRequisito").value = requisitoSelecionado.type;
    document.getElementById("selectTipoRequisito").disabled = true;

    // Preenche apenas o valor
    document.getElementById("valorRequisito").value = requisitoSelecionado.value;

    editando = true;
};

// =========================
// Excluir requisito
// =========================
document.getElementById("btnExcluirRequisito").onclick = async () => {
    if (!projetoSelecionado) {
        alert("Selecione um projeto primeiro.");
        return;
    }
    if (!requisitoSelecionado) {
        alert("Selecione um requisito para excluir.");
        return;
    }

    if (!confirm("Tem certeza que deseja excluir este requisito?")) return;

    await fetch(`${API}/api/projects/${projetoSelecionado}/requirements/${requisitoSelecionado.id}`, {
        method: "DELETE"
    });

    requisitoSelecionado = null;
    document.getElementById("reqSelecionado").textContent = "Nenhum requisito selecionado";

    carregarRequisitos();
};

// =========================
// Controle do botão Avançar
// =========================
const btnAvancar = document.getElementById("btnAvancar");

function atualizarBotaoAvancar() {
    if (projetoSelecionado) {
        btnAvancar.classList.remove("btn-desabilitado");
    } else {
        btnAvancar.classList.add("btn-desabilitado");
    }
}

// Atualiza sempre que um projeto for selecionado ou desmarcado
document.addEventListener("change", atualizarBotaoAvancar);

// Clique no botão Avançar
btnAvancar.addEventListener("click", () => {
    if (!projetoSelecionado) {
        alert("Selecione um projeto antes de avançar.");
        return;
    }

    window.location.href = "materiais.html";
});

// Atualiza ao carregar a página
atualizarBotaoAvancar();

