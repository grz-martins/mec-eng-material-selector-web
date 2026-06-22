const API = "http://localhost:9000"; // Porta DEV do backend

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
// Carregar projetos
// =========================
async function carregarProjetos() {
    let url = `${API}/api/projects`;

    // Se NÃO for "todos", aplica filtro
    if (!chkTodos.checked && inputNome.value.trim() !== "") {
        url += `/filter?name=${inputNome.value.trim()}`;
    }

    const resp = await fetch(url);
    const json = await resp.json();
    
    renderProjetos(json.data ?? []);
    
}

document.getElementById("btnCarregarProjetos").onclick = carregarProjetos;

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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        document.getElementById("formNovoProjeto").style.display = "none";
        carregarProjetos();
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
        return;
    }

    try {
        const resp = await fetch(`${API}/api/projects/${projetoSelecionado}/requirements`);
        const json = await resp.json();

        const requisitos = json.data ?? [];

        if (requisitos.length === 0) {
            lista.innerHTML = "<li>Nenhum requisito cadastrado</li>";
            return;
        }

        lista.innerHTML = "";
        requisitos.forEach(r => {
            const tipo = r.type ?? r.tipo;
            const valor = r.value ?? r.valor;

            const li = document.createElement("li");
            li.textContent = `${tipo}: ${valor}`;
            lista.appendChild(li);
        });

    } catch (e) {
        lista.innerHTML = "<li>O backend ainda não possui rota de requisitos</li>";
    }
}

// =========================
// Incluir requisito
// =========================
document.getElementById("btnIncluirRequisito").onclick = () => {
    document.getElementById("formNovoRequisito").style.display = "block";
};

document.getElementById("btnCancelarRequisito").onclick = () => {
    document.getElementById("formNovoRequisito").style.display = "none";
};

document.getElementById("btnSalvarRequisito").onclick = async () => {
    if (!projetoSelecionado) {
        alert("Selecione um projeto antes de incluir requisitos.");
        return;
    }

    const body = {
        type: document.getElementById("selectTipoRequisito").value,
        value: document.getElementById("valorRequisito").value
    };

    try {
        await fetch(`${API}/api/projects/${projetoSelecionado}/requirements`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        document.getElementById("formNovoRequisito").style.display = "none";
        carregarRequisitos();

    } catch (e) {
        alert("O backend ainda não possui rota POST /requirements");
    }
};

// =========================
// Indice de merito
// =========================
document.addEventListener("DOMContentLoaded", function () {

    const descricao = document.getElementById("descricaoIndice");
    const select = document.getElementById("selectIndiceMerito");

    const textos = {
        "E_RHO": "IM = E/ρ — Ideal para otimizar rigidez específica. Útil quando o objetivo é maximizar rigidez com o menor peso possível.",
        "E_MEIO_RHO": "IM = √E/ρ — Usado em aplicações onde flexão domina. Favorece materiais com boa rigidez flexional.",
        "SIGMAY_RHO": "IM = σy/ρ — Mede resistência específica. Excelente para componentes estruturais sujeitos a escoamento.",
        "SIGMAY2_RHO": "IM = σy²/ρ — Favorece materiais com alta resistência ao escoamento. Bom para otimização de resistência com baixo peso.",
        "KIC_RHO": "IM = KIC/ρ — Índice de tenacidade específica. Importante quando resistência à fratura é crítica.",
        "LAMBKIC_SIGMAT": "IM = λ·KIC / σt — Combina condutividade térmica e tenacidade, penalizando baixa resistência última. Útil para aplicações termo‑mecânicas."
    };

    //Carrega automaticamente o texto da primeira opção
    descricao.textContent = textos[select.value];
    localStorage.setItem("formulaSelecionada", select.value);
    localStorage.setItem("descricaoFormula", textos[select.value]);

    //Atualiza quando o usuário troca
    select.addEventListener("change", function () {
        const valor = select.value;
        descricao.textContent = textos[valor];
        localStorage.setItem("formulaSelecionada", valor);
        localStorage.setItem("descricaoFormula", textos[valor]);
    });

});

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

