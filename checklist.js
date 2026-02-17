// ==========================================
// MÓDULO FIREBASE E SINCRONIZAÇÃO
// ==========================================
async function salvarComFirebase(checklistData) {
    try {
        const modulo = await import('./firebase_app.js');
        if (modulo && modulo.salvarNoFirebase) {
            await modulo.salvarNoFirebase(checklistData);
            console.log("Salvo no Firebase!");
        }
    } catch (e) {
        console.error("Erro ao carregar Firebase:", e);
        throw e; // Propaga erro para tratamento no checklist.js
    }
}

async function sincronizarChecklists() {
    const btn = document.getElementById('btnSync');
    const txtOriginal = btn.textContent;
    btn.textContent = '⏳ Conectando...';
    btn.disabled = true;

    try {
        const modulo = await import('./firebase_app.js');
        if (modulo && modulo.buscarChecklistsNuvem) {
            btn.textContent = '⏳ Baixando...';
            const dadosNuvem = await modulo.buscarChecklistsNuvem();

            if (dadosNuvem.length > 0) {
                let local = JSON.parse(localStorage.getItem('checklists') || '[]');
                const idsLocais = new Set(local.map(c => c.id));

                let novos = 0;
                dadosNuvem.forEach(item => {
                    if (!idsLocais.has(item.id)) {
                        local.push(item);
                        novos++;
                    }
                });

                localStorage.setItem('checklists', JSON.stringify(local));
                carregarHistorico();
                alert(`✅ Sincronização concluída! ${novos} novos checklists baixados.`);
            } else {
                alert("📭 Nenhum checklist encontrado na nuvem para esta oficina (ou erro de configuração).");
            }
        }
    } catch (e) {
        console.error("Erro sync:", e);
        alert("❌ Erro ao sincronizar.\n\nDetalhe: " + (e.message || e) + "\n\nVerifique:\n1. Conexão com a Internet\n2. Token no arquivo config.js");
    } finally {
        btn.textContent = txtOriginal;
        btn.disabled = false;
    }
}

// ==========================================
// ORÇAMENTO - PEÇAS & SERVIÇOS
// ==========================================
let itensOrcamento = [];

function adicionarItemManual() {
    const descricaoInput = document.getElementById("descricaoItem");
    const valorInput = document.getElementById("valorItem");
    const tipo = document.querySelector('input[name="tipoItem"]:checked').value;

    const descricao = (descricaoInput.value || "").trim();
    const valorBruto = (valorInput.value || "").toString().trim();
    const valor = valorBruto === "" ? 0 : parseFloat(valorBruto);

    if (!descricao) {
        alert("Informe a descrição do item.");
        descricaoInput.focus();
        return;
    }

    if (isNaN(valor) || valor < 0) {
        alert("Informe um valor válido (0 ou maior).");
        valorInput.focus();
        return;
    }

    const item = {
        id: Date.now(),
        descricao,
        valor,
        tipo,
    };

    itensOrcamento.push(item);
    renderizarTabela();

    descricaoInput.value = "";
    valorInput.value = "";
    descricaoInput.focus();
}

function removerItem(id) {
    itensOrcamento = itensOrcamento.filter(i => i.id !== id);
    renderizarTabela();
}

function editarItem(id) {
    const item = itensOrcamento.find(i => i.id === id);
    if (!item) return;

    document.getElementById('descricaoItem').value = item.descricao;
    document.getElementById('valorItem').value = item.valor;
    document.querySelector(`input[name="tipoItem"][value="${item.tipo}"]`).checked = true;

    removerItem(id);
    alert('Item carregado para edição. Altere e clique ➕ Adicionar!');
}

function renderizarTabela() {
    const tbodyPecas = document.getElementById("tabelaPecas");
    const tbodyServicos = document.getElementById("tabelaServicos");

    const elTotalPecas = document.getElementById("totalPecas");
    const elTotalServicos = document.getElementById("totalServicos");
    const elTotalGeral = document.getElementById("totalGeralFinal");

    if (tbodyPecas) tbodyPecas.innerHTML = "";
    if (tbodyServicos) tbodyServicos.innerHTML = "";

    let somaPecas = 0;
    let somaServicos = 0;

    itensOrcamento.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td style="border: 1px solid #ddd; padding: 6px;">${item.descricao}</td>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">R$ ${Number(item.valor || 0).toFixed(2)}</td>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">
        <button class="btn-small btn-warning" onclick="editarItem(${item.id})" title="Editar">✏️</button>
        <button class="btn-small btn-danger" onclick="removerItem(${item.id})" title="Apagar">🗑️</button>
      </td>
    `;

        if (item.tipo === "servico") {
            somaServicos += Number(item.valor || 0);
            if (tbodyServicos) tbodyServicos.appendChild(tr);
        } else {
            somaPecas += Number(item.valor || 0);
            if (tbodyPecas) tbodyPecas.appendChild(tr);
        }
    });

    const somaTotal = somaPecas + somaServicos;

    if (elTotalPecas) elTotalPecas.textContent = `R$ ${somaPecas.toFixed(2)}`;
    if (elTotalServicos) elTotalServicos.textContent = `R$ ${somaServicos.toFixed(2)}`;
    if (elTotalGeral) elTotalGeral.textContent = `R$ ${somaTotal.toFixed(2)}`;

    const rTotalGeral = document.getElementById("rTotalGeral");
    if (rTotalGeral) rTotalGeral.textContent = `R$ ${somaTotal.toFixed(2)}`;
}

// ==========================================
// FUNÇÕES PRINCIPAIS E NAVEGAÇÃO
// ==========================================

function switchTab(tabId) {
    // 1. Esconde todo conteúdo e remove 'active' das abas antigas
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));

    // 2. Mostra o conteúdo da aba selecionada
    const tabContent = document.getElementById(tabId);
    if (tabContent) tabContent.classList.add('active');

    // 3. Atualiza abas superiores (Desktop)
    document.querySelectorAll('.tab-button').forEach(btn => {
        if (btn.getAttribute('onclick')?.includes(tabId)) btn.classList.add('active');
    });

    // 4. Atualiza navegação inferior (Mobile)
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active'); // Limpa todos
        if (btn.getAttribute('onclick')?.includes(tabId)) btn.classList.add('active'); // Ativa o correto
    });

    // 5. Ações específicas de cada aba
    if (tabId === 'historico') carregarHistorico();
    if (tabId === 'relatorios') atualizarRelatorios();
    if (tabId === 'orcamento') atualizarResumoVeiculo();

    // Scroll para o topo suavemente ao mudar de aba
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function salvarChecklist() {
    const placa = document.getElementById('placa').value;
    if (!placa) {
        alert("Por favor, preencha pelo menos a PLACA para salvar.");
        return;
    }

    const formData = {};
    const elements = document.getElementById('checklistForm').elements;

    for (let i = 0; i < elements.length; i++) {
        const item = elements[i];
        if (item.name) {
            if (item.type === 'checkbox') {
                if (item.checked) {
                    if (!formData[item.name]) formData[item.name] = [];
                    formData[item.name].push(item.value);
                }
            } else if (item.type !== 'button') {
                formData[item.name] = item.value;
            }
        }
    }

    const checklist = {
        id: Date.now(),
        data_criacao: new Date().toISOString(),
        ...formData
    };

    // Salva peças e serviços
    checklist.itensOrcamento = itensOrcamento || [];
    checklist.complexidade = document.getElementById('complexidade')?.value || '';

    // 1. SALVAR LOCALMENTE (SEMPRE)
    let checklists = JSON.parse(localStorage.getItem('checklists') || '[]');
    checklists.push(checklist);
    localStorage.setItem('checklists', JSON.stringify(checklists));

    // Feedback Visual
    const btnSalvar = document.querySelector('button[onclick="salvarChecklist()"]');
    const txtOriginal = btnSalvar ? btnSalvar.textContent : "Salvar";
    if (btnSalvar) {
        btnSalvar.textContent = "☁️ Salvando Nuvem...";
        btnSalvar.disabled = true;
    }

    // 2. TENTAR SALVAR NA NUVEM
    let msgExtra = "";
    try {
        await salvarComFirebase(checklist);
        msgExtra = " e na Nuvem!";
    } catch (e) {
        console.warn("Falha nuvem:", e);
        msgExtra = ".\n\n⚠️ AVISO: Salvo APENAS LOCALMENTE.\nErro ao salvar na nuvem: " + (e.message || "Erro desconhecido");
    } finally {
        if (btnSalvar) {
            btnSalvar.textContent = txtOriginal;
            btnSalvar.disabled = false;
        }
    }

    // Limpeza e reset
    itensOrcamento = [];
    renderizarTabela();

    alert("✅ Checklist salvo com sucesso no Histórico" + msgExtra);
    document.getElementById('checklistForm').reset();
    atualizarResumoVeiculo();
    switchTab('historico');
}

function carregarHistorico() {
    const listaDiv = document.getElementById('checklistsList');
    const emptyMsg = document.getElementById('emptyMessage');
    const checklists = JSON.parse(localStorage.getItem('checklists') || '[]');

    listaDiv.innerHTML = '';

    if (checklists.length === 0) {
        emptyMsg.style.display = 'block';
        return;
    } else {
        emptyMsg.style.display = 'none';
    }

    checklists.slice().reverse().forEach(item => {
        const dataFormatada = new Date(item.data_criacao).toLocaleDateString('pt-BR');
        const horaFormatada = new Date(item.data_criacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const card = document.createElement('div');
        card.className = 'checklist-item';
        card.innerHTML = `
            <div class="checklist-info">
                <h4>${(item.placa || '').toUpperCase()} - ${item.modelo || 'Modelo não inf.'}</h4>
                <p>📅 ${dataFormatada} às ${horaFormatada} | 👤 ${item.nome_cliente || 'Cliente não inf.'}</p>
            </div>
            <div class="checklist-actions">
                <button class="btn-small btn-secondary" onclick="carregarChecklist(${item.id})">✏️ Editar</button>
                <button class="btn-small btn-danger" onclick="excluirChecklist(${item.id})">🗑️</button>
            </div>
        `;
        listaDiv.appendChild(card);
    });
}

function carregarChecklist(id) {
    const checklists = JSON.parse(localStorage.getItem('checklists') || '[]');
    const item = checklists.find(c => c.id === id);

    if (!item) return;

    switchTab('novo-checklist');

    if (item.nome_cliente && !item.nomecliente) item.nomecliente = item.nome_cliente;

    const setVal = (id, val) => { if (document.getElementById(id)) document.getElementById(id).value = val || ''; }

    setVal('nomecliente', item.nomecliente);
    setVal('cpfcnpj', item.cpf_cnpj || item.cpfcnpj);
    setVal('celularcliente', item.telefone || item.contato || item.celularcliente);
    setVal('placa', item.placa);
    setVal('modelo', item.modelo);

    for (const key in item) {
        const el = document.getElementsByName(key)[0];
        if (el && el.type !== 'checkbox' && el.type !== 'file' && el.type !== 'radio') {
            el.value = item[key];
        }
    }

    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    if (item.equipamentos) item.equipamentos.forEach(val => marcarCheckbox('equipamentos', val));
    if (item.caracteristicas) item.caracteristicas.forEach(val => marcarCheckbox('caracteristicas', val));
    if (item.cambio) item.cambio.forEach(val => marcarCheckbox('cambio', val));
    if (item.tracao) item.tracao.forEach(val => marcarCheckbox('tracao', val));

    itensOrcamento = item.itensOrcamento || [];
    if (document.getElementById('complexidade')) document.getElementById('complexidade').value = item.complexidade || '';
    renderizarTabela();

    atualizarResumoVeiculo();
}

function marcarCheckbox(name, value) {
    const els = document.getElementsByName(name);
    els.forEach(el => { if (el.value === value) el.checked = true; });
}

function excluirChecklist(id) {
    if (confirm("Tem certeza que deseja excluir este checklist?")) {
        let checklists = JSON.parse(localStorage.getItem('checklists') || '[]');
        checklists = checklists.filter(c => c.id !== id);
        localStorage.setItem('checklists', JSON.stringify(checklists));
        carregarHistorico();
    }
}

function filtrarChecklists() {
    const termo = document.getElementById('searchInput').value.toLowerCase();
    const checklists = JSON.parse(localStorage.getItem('checklists') || '[]');
    const listaDiv = document.getElementById('checklistsList');
    const emptyMsg = document.getElementById('emptyMessage');

    listaDiv.innerHTML = '';

    const filtrados = checklists.filter(item => {
        const texto = ((item.placa || '') + ' ' + (item.modelo || '') + ' ' + (item.nome_cliente || '')).toLowerCase();
        return texto.includes(termo);
    });

    if (!filtrados.length) {
        emptyMsg.style.display = 'block';
        return;
    } else {
        emptyMsg.style.display = 'none';
    }

    filtrados.slice().reverse().forEach(item => {
        const dataFormatada = new Date(item.data_criacao).toLocaleDateString('pt-BR');
        const horaFormatada = new Date(item.data_criacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const card = document.createElement('div');
        card.className = 'checklist-item';
        card.innerHTML = `
            <div class="checklist-info">
                <h4>${(item.placa || '').toUpperCase()} - ${item.modelo || 'Modelo não inf.'}</h4>
                <p>📅 ${dataFormatada} às ${horaFormatada} | 👤 ${item.nome_cliente || 'Cliente não inf.'}</p>
            </div>
            <div class="checklist-actions">
                <button class="btn-small btn-secondary" onclick="carregarChecklist(${item.id})">✏️ Editar</button>
                <button class="btn-small btn-danger" onclick="excluirChecklist(${item.id})">🗑️</button>
            </div>
        `;
        listaDiv.appendChild(card);
    });
}

function ordenarChecklists() {
    const checklists = JSON.parse(localStorage.getItem('checklists') || '[]');
    checklists.sort((a, b) => {
        const placaA = (a.placa || '').toUpperCase();
        const placaB = (b.placa || '').toUpperCase();
        if (placaA < placaB) return -1;
        if (placaA > placaB) return 1;
        return 0;
    });
    localStorage.setItem('checklists', JSON.stringify(checklists));
    carregarHistorico();
}

function limparFormulario() {
    if (confirm("Limpar todos os campos do formulário?")) {
        document.getElementById('checklistForm').reset();
        atualizarResumoVeiculo();
    }
}

function exportarDados() {
    const db = JSON.parse(localStorage.getItem('checklists') || '[]');
    if (!db.length) {
        alert("Não há dados para exportar.");
        return;
    }
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'checklists.json';
    a.click();
    URL.revokeObjectURL(url);
}

function limparTodosDados() {
    if (confirm("Deseja apagar TODO o histórico?")) {
        localStorage.removeItem('checklists');
        carregarHistorico();
        alert("Histórico limpo.");
    }
}

function atualizarRelatorios() {
    const db = JSON.parse(localStorage.getItem('checklists') || '[]');
    document.getElementById('totalChecklists').textContent = db.length;

    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const doMes = db.filter(item => {
        if (!item.data_criacao) return false;
        const dataItem = new Date(item.data_criacao);
        return dataItem.getMonth() === mesAtual && dataItem.getFullYear() === anoAtual;
    });
    document.getElementById('checklistsMes').textContent = doMes.length;

    const marcas = {};
    db.forEach(item => {
        const modeloTexto = item.modelo || 'Não Informado';
        const m = modeloTexto.split(' ')[0].toUpperCase();
        marcas[m] = (marcas[m] || 0) + 1;
    });

    const sortedMarcas = Object.entries(marcas).sort((a, b) => b[1] - a[1]).slice(0, 5);
    let htmlGrafico = '';
    sortedMarcas.forEach(([marca, qtd]) => {
        const pct = (qtd / db.length) * 100;
        htmlGrafico += `
            <div style="margin-bottom: 10px;">
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:2px;">
                    <strong>${marca}</strong>
                    <span>${qtd}</span>
                </div>
                <div style="background:#eee; height:8px; border-radius:4px; overflow:hidden;">
                    <div style="background:var(--color-primary); width:${pct}%; height:100%;"></div>
                </div>
            </div>
        `;
    });

    if (!sortedMarcas.length) {
        htmlGrafico = '<p style="text-align:center; color:#999; font-size:12px;">Sem dados suficientes.</p>';
    }

    document.getElementById('graficoMarcas').innerHTML = htmlGrafico;
}

function atualizarResumoVeiculo() {
    const vPlaca = document.getElementById('placa')?.value || '-';
    const vModelo = document.getElementById('modelo')?.value || '-';
    const vChassi = document.getElementById('chassi')?.value || '-';
    const vKm = document.getElementById('km_entrada')?.value || '-';
    const vData = document.getElementById('data')?.value || '-';
    const vHora = document.getElementById('hora')?.value || '-';
    const vComb = document.getElementById('combustivel')?.value || '-';
    const vComplex = document.getElementById('complexidade')?.value || '-';

    const setContent = (id, val) => { if (document.getElementById(id)) document.getElementById(id).textContent = val; }

    setContent('resumoPlaca', vPlaca);
    setContent('resumoModelo', vModelo);
    setContent('resumoKmEntrada', vKm);
    setContent('resumoData', vData);

    setContent('resumoPlaca2', vPlaca);
    setContent('resumoModelo2', vModelo);
    setContent('resumoChassi2', vChassi);
    setContent('resumoKmEntrada2', vKm);
    setContent('resumoComplexidade', vComplex);

    setContent('resumoPlaca3', vPlaca);
    setContent('resumoModelo3', vModelo);
    setContent('resumoChassi3', vChassi);
    setContent('resumoKmFotos', vKm);
}

// ==========================================
// FOTOS - CÂMERA OTIMIZADA
// ==========================================
let streamCamera = null;
let fotosVeiculo = JSON.parse(localStorage.getItem('fotosVeiculo') || '[]');

function iniciarCamera() {
    const video = document.getElementById('cameraPreview');
    const btnTirar = document.getElementById('btnTirarFoto');
    const container = document.querySelector('.camera-container');

    container.style.display = 'block';
    btnTirar.style.display = 'inline-block';
    btnTirar.disabled = true;

    if (navigator.geolocation) {
        try { navigator.geolocation.getCurrentPosition(() => { }, () => { }, { timeout: 800 }); } catch (e) { }
    }

    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 }, // Melhora resolução
            height: { ideal: 1080 }
        },
        audio: false
    }).then((stream) => {
        streamCamera = stream;
        video.srcObject = stream;

        // Ajuste CSS dinâmico para tela cheia na câmera
        if (window.innerWidth < 768) {
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100vw';
            container.style.height = '100vh';
            container.style.zIndex = '11000';
            container.style.background = '#000';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';

            video.style.maxWidth = '100%';
            video.style.maxHeight = '80vh';
            video.style.borderRadius = '0';
        }

        const habilitar = () => {
            if (video.videoWidth && video.videoHeight) btnTirar.disabled = false;
        };

        video.onloadedmetadata = () => {
            habilitar();
            const p = video.play();
            if (p && typeof p.catch === 'function') p.catch(() => { });
        };

        video.oncanplay = () => habilitar();
        setTimeout(habilitar, 600); // fallback
    }).catch(err => {
        container.style.display = 'none';
        btnTirar.style.display = 'none';
        alert('Erro câmera: ' + err.message + '\nUse "Galeria"');
    });
}

function tirarFoto(tentativa = 0) {
    const video = document.getElementById('cameraPreview');

    if (!video.videoWidth || !video.videoHeight) {
        if (tentativa < 10) {
            setTimeout(() => tirarFoto(tentativa + 1), 120);
            return;
        }
        alert('A câmera ainda está carregando. Aguarde 1 segundo e tente novamente.');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    adicionarMarcaDagua(canvas, () => {
        const foto = {
            id: Date.now(),
            dataURL: canvas.toDataURL('image/jpeg', 0.82),
            data: new Date().toLocaleString('pt-BR'),
            legenda: ''
        };

        fotosVeiculo.unshift(foto);
        if (fotosVeiculo.length > 15) fotosVeiculo = fotosVeiculo.slice(0, 15);
        localStorage.setItem('fotosVeiculo', JSON.stringify(fotosVeiculo));
        renderizarGaleria();
        pararCamera();
    });
}

function obterTextoMarcaDagua(timeoutMs = 1500) {
    const dataHora = new Date().toLocaleString('pt-BR');

    if (!navigator.geolocation) return Promise.resolve(dataHora);

    return new Promise((resolve) => {
        let finalizado = false;
        const finalizar = (texto) => {
            if (finalizado) return;
            finalizado = true;
            resolve(texto);
        };

        const timer = setTimeout(() => finalizar(dataHora), timeoutMs);

        try {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    clearTimeout(timer);
                    const lat = pos.coords.latitude.toFixed(4);
                    const lng = pos.coords.longitude.toFixed(4);
                    finalizar(`${dataHora} | ${lat}, ${lng}`);
                },
                () => {
                    clearTimeout(timer);
                    finalizar(dataHora);
                },
                { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 5 * 60 * 1000 }
            );
        } catch (e) {
            clearTimeout(timer);
            finalizar(dataHora);
        }
    });
}

function adicionarMarcaDagua(canvas, callback) {
    const ctx = canvas.getContext('2d');
    obterTextoMarcaDagua(1500).then((texto) => {
        desenharTexto(ctx, canvas.width, canvas.height, texto);
        callback();
    });
}

function desenharTexto(ctx, w, h, texto) {
    const base = Math.min(w, h);
    const fontSize = Math.max(14, Math.min(22, Math.round(base * 0.018)));

    const padX = Math.round(fontSize * 0.8);
    const padY = Math.round(fontSize * 0.55);

    ctx.save();
    ctx.font = `600 ${fontSize}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';

    const x = 20;
    const y = h - 20;

    const textWidth = ctx.measureText(texto).width;
    const boxW = textWidth + padX * 2;
    const boxH = fontSize + padY * 2;

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x - padX, y - fontSize - padY, boxW, boxH);

    ctx.fillStyle = '#fff';
    ctx.fillText(texto, x, y);
    ctx.restore();
}

function pararCamera() {
    if (streamCamera) {
        streamCamera.getTracks().forEach(track => track.stop());
        streamCamera = null;
    }
    document.querySelector('.camera-container').style.display = 'none';
    document.getElementById('btnTirarFoto').style.display = 'none';
}

function adicionarFotos(event) {
    const files = Array.from(event.target.files);
    const processarArquivo = (index) => {
        if (index >= files.length) return;

        const file = files[index];
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                adicionarMarcaDagua(canvas, () => {
                    fotosVeiculo.unshift({
                        id: Date.now() + Math.random(),
                        dataURL: canvas.toDataURL('image/jpeg', 0.82),
                        data: new Date().toLocaleString('pt-BR'),
                        legenda: ''
                    });
                    if (fotosVeiculo.length > 15) fotosVeiculo = fotosVeiculo.slice(0, 15);
                    localStorage.setItem('fotosVeiculo', JSON.stringify(fotosVeiculo));
                    renderizarGaleria();
                    processarArquivo(index + 1);
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };
    processarArquivo(0);
    event.target.value = '';
}

function renderizarGaleria() {
    const galeria = document.getElementById('galeriaFotos');
    if (!galeria) return;
    galeria.innerHTML = '';

    if (fotosVeiculo.length === 0) {
        galeria.innerHTML = '<p style="text-align:center;color:#999;padding:40px">📭 Nenhuma foto</p>';
        return;
    }

    fotosVeiculo.slice(0, 15).forEach((foto, index) => {
        const div = document.createElement('div');
        div.className = 'foto-item';
        div.innerHTML = `
            <img src="${foto.dataURL}" alt="Foto ${index + 1}" loading="lazy">
            <input type="text" class="foto-legenda" value="${foto.legenda || ''}" placeholder="Escreva uma legenda..." onchange="salvarLegenda(${foto.id}, this.value)">
            <div class="foto-overlay"><span style="color:white;font-size:10px">${foto.data}</span></div>
            <div class="foto-actions">
                <button class="btn-foto btn-warning foto-zoom" data-url="${foto.dataURL}">🔍</button>
                <button class="btn-foto btn-danger foto-delete" data-id="${foto.id}">🗑️</button>
            </div>
        `;
        galeria.appendChild(div);
    });

    galeria.querySelectorAll('.foto-zoom').forEach(btn => {
        btn.addEventListener('click', () => abrirFotoGrande(btn.dataset.url));
    });
    galeria.querySelectorAll('.foto-delete').forEach(btn => {
        btn.addEventListener('click', () => removerFoto(parseInt(btn.dataset.id)));
    });
}

function salvarLegenda(id, texto) {
    const foto = fotosVeiculo.find(f => f.id === id);
    if (foto) {
        foto.legenda = texto;
        localStorage.setItem('fotosVeiculo', JSON.stringify(fotosVeiculo));
    }
}

function removerFoto(id) {
    fotosVeiculo = fotosVeiculo.filter(f => f.id !== id);
    localStorage.setItem('fotosVeiculo', JSON.stringify(fotosVeiculo));
    renderizarGaleria();
}

function limparFotos() {
    if (confirm('🗑️ Limpar TODAS as fotos?')) {
        fotosVeiculo = [];
        localStorage.removeItem('fotosVeiculo');
        renderizarGaleria();
    }
}

function abrirFotoGrande(dataURL) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position:fixed; top:0; left:0; width:100vw; height:100vh; 
        background:rgba(0,0,0,0.95); z-index:9999; display:flex; 
        align-items:center; justify-content:center; padding:20px;
    `;
    modal.innerHTML = `
        <img src="${dataURL}" style="max-width:95%; max-height:95%; border-radius:8px; box-shadow:0 0 50px rgba(255,255,255,0.3);">
        <button onclick="this.parentElement.remove()" style="
            position:absolute; top:20px; right:20px; background:#e41616; 
            color:white; border:none; border-radius:50%; width:50px; 
            height:50px; font-size:20px; cursor:pointer;
        ">✕</button>
    `;
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

// ==========================================
// GERAR PDF PROFISSIONAL (Estilo Concessionária)
// ==========================================
function gerarPDFFotos() {
    if (!fotosVeiculo || fotosVeiculo.length === 0) {
        alert('📭 Sem fotos para gerar PDF');
        return;
    }

    const placa = document.getElementById('placa')?.value || 'SEM_PLACA';
    const modelo = document.getElementById('modelo')?.value || 'SEM_MODELO';
    const chassi = document.getElementById('chassi')?.value || 'SEM_CHASSI';

    // Configurações da oficina (puxa do config.js se existir)
    const cfg = window.OFICINA_CONFIG || { nome: 'OFICINA' };

    // Layout Estilo Concessionária
    const estilo = `
        <style>
            @page { size: A4; margin: 0; }
            body { font-family: 'Helvetica', sans-serif; -webkit-print-color-adjust: exact; margin: 0; padding: 0; background: #fff; }
            .page-container { width: 210mm; min-height: 297mm; padding: 15mm; margin: 0 auto; box-sizing: border-box; position: relative; }
            
            /* Cabeçalho Premium */
            .header { border-bottom: 3px solid #c32421; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .header-logo img { max-height: 70px; }
            .header-info { text-align: right; font-size: 11px; color: #555; }
            .header-info h1 { margin: 0; font-size: 20px; color: #333; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; }
            
            /* Dados do Veículo e Cliente em Grid */
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; background: #f9f9f9; padding: 15px; border-radius: 6px; border: 1px solid #eee; }
            .info-box h3 { margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #c32421; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
            .info-row { font-size: 11px; margin-bottom: 4px; display: flex; }
            .info-label { font-weight: bold; width: 80px; color: #444; }
            .info-value { flex: 1; color: #000; font-weight: 600; }
            
            /* Fotos em Grid Moderno */
            .fotos-grid-pdf { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .foto-card { background: #fff; border: 1px solid #ddd; padding: 4px; border-radius: 4px; break-inside: avoid; }
            .foto-img { width: 100%; height: 200px; object-fit: cover; border-radius: 2px; }
            .foto-meta { font-size: 9px; color: #777; margin-top: 4px; display: flex; justify-content: space-between; }
            
            /* Rodapé */
            .footer { position: absolute; bottom: 10mm; left: 15mm; right: 15mm; font-size: 9px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
    `;

    let html = estilo + '<div class="page-container">';

    // Cabeçalho
    html += `
        <div class="header">
            <div class="header-logo"><img src="${cfg.logo || 'logo.png'}" alt="Logo"></div>
            <div class="header-info">
                <h1>${cfg.nome || 'OFICINA'}</h1>
                <div>${cfg.endereco || ''}</div>
                <div>${cfg.telefone || ''} | ${cfg.whatsapp || ''}</div>
                <div>${cfg.cnpj ? 'CNPJ: ' + cfg.cnpj : ''}</div>
            </div>
        </div>
    `;

    // Dados
    html += `
        <div class="info-grid">
            <div class="info-box">
                <h3>Dados do Veículo</h3>
                <div class="info-row"><span class="info-label">Placa:</span><span class="info-value">${placa}</span></div>
                <div class="info-row"><span class="info-label">Modelo:</span><span class="info-value">${modelo}</span></div>
                <div class="info-row"><span class="info-label">Chassi:</span><span class="info-value">${chassi}</span></div>
            </div>
            <div class="info-box">
                <h3>Detalhes da Inspeção</h3>
                <div class="info-row"><span class="info-label">Data:</span><span class="info-value">${new Date().toLocaleDateString('pt-BR')}</span></div>
                <div class="info-row"><span class="info-label">Total Fotos:</span><span class="info-value">${fotosVeiculo.length}</span></div>
                <div class="info-row"><span class="info-label">Rastreio:</span><span class="info-value">#${Date.now().toString().slice(-6)}</span></div>
            </div>
        </div>
        
        <div class="info-box" style="margin-bottom: 15px;">
            <h3>Registro Fotográfico</h3>
        </div>
        <div class="fotos-grid-pdf">
    `;

    // Loop Fotos
    const MAX_FOTOS_PDF = 12; // Limite para não ficar gigante
    fotosVeiculo.slice(0, MAX_FOTOS_PDF).forEach((foto, i) => {
        html += `
            <div class="foto-card">
                <img src="${foto.dataURL}" class="foto-img">
                <div class="foto-meta">
                    <span>${foto.data}</span>
                    <span>Foto ${i + 1}</span>
                </div>
            </div>
        `;
    });

    html += `</div>`; // fecha grid

    // Rodapé
    html += `
        <div class="footer">
            Relatório gerado digitalmente em ${new Date().toLocaleString('pt-BR')} • ${cfg.nome} • Sistema Fast Car
        </div>
    </div>`; // fecha page-container

    const opt = {
        margin: 0,
        filename: `Inspecao_${placa}_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Botão de Compartilhar no WhatsApp
    if (confirm("Deseja enviar o relatório para o cliente via WhatsApp após gerar?")) {
        const mensagem = `Olá! Aqui está o relatório de inspeção do veículo placa *${placa}* realizado na *${cfg.nome}*. 🚗📸`;
        const linkZap = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
        window.open(linkZap, '_blank');
    }

    html2pdf().set(opt).from(html).save();
}

// ==========================================
// RESUMO E IMPRESSÃO
// ==========================================
function gerarNumeroOS() {
    const placa = (document.getElementById('placa')?.value || 'OS').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    let dataRaw = document.getElementById('data')?.value;
    let dataObj = dataRaw ? new Date(dataRaw + 'T00:00:00') : new Date();

    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const ano = String(dataObj.getFullYear()).slice(-2);

    return `${placa}-${dia}-${mes}-${ano}`;
}

function atualizarBarraOS() {
    const os = gerarNumeroOS();
    const el = document.getElementById('barraFixaOS');
    if (el) el.textContent = os;
}

function atualizarResumoOS() {
    // Cabeçalho
    const logoSrc = document.getElementById('logo-oficina')?.src;
    if (logoSrc) document.getElementById('logoResumo').src = logoSrc;

    document.getElementById('nomeOficinaResumo').textContent = document.getElementById('nome-oficina')?.textContent || 'OFICINA';
    document.getElementById('enderecoOficinaResumo').textContent = document.getElementById('endereco-oficina')?.textContent || '';
    document.getElementById('telefoneOficinaResumo').textContent = document.getElementById('telefone-oficina')?.textContent || '';
    document.getElementById('cnpjOficinaResumo').textContent = document.getElementById('cnpj-oficina')?.textContent || '';
    document.getElementById('osNumero').textContent = gerarNumeroOS();

    // Dados Cliente/Veículo
    document.getElementById('rNomeCliente').textContent = document.getElementById('nome_cliente')?.value || '-';
    document.getElementById('rCpfCnpj').textContent = document.getElementById('cpf_cnpj')?.value || '-';
    document.getElementById('rCelular').textContent = document.getElementById('celular_cliente')?.value || '-';
    document.getElementById('rModelo').textContent = document.getElementById('modelo')?.value || '-';
    document.getElementById('rPlaca').textContent = (document.getElementById('placa')?.value || '-').toUpperCase();
    document.getElementById('rChassi').textContent = document.getElementById('chassi')?.value || '-';
    document.getElementById('rKmEntrada').textContent = (document.getElementById('km_entrada')?.value || '') + ' km';

    let combSelect = document.getElementById('combustivel');
    let combTexto = combSelect && combSelect.selectedIndex >= 0 ? combSelect.options[combSelect.selectedIndex].text : '-';
    document.getElementById('rCombustivel').textContent = combTexto;

    let dataVal = document.getElementById('data')?.value;
    let horaVal = document.getElementById('hora')?.value;
    let dataFmt = dataVal ? dataVal.split('-').reverse().join('/') : '--/--/----';
    document.getElementById('rEntradaDataHora').textContent = `${dataFmt} às ${horaVal || '--:--'}`;

    document.getElementById('rServicos').textContent = document.getElementById('servicos')?.value || '-';
    document.getElementById('rObsInspecao').textContent = document.getElementById('obsInspecao')?.value || '-';

    // Checklist
    const areaBadges = document.getElementById('rChecklistBadges');
    areaBadges.innerHTML = '';
    const checkboxesMarcados = document.querySelectorAll('#checklistForm input[type="checkbox"]:checked');

    if (checkboxesMarcados.length === 0) {
        areaBadges.innerHTML = '<span style="color:#999; font-size:11px;">Nenhum item inspecionado/marcado.</span>';
    } else {
        checkboxesMarcados.forEach(cb => {
            let textoLabel = cb.value;
            let labelTag = document.querySelector(`label[for="${cb.id}"]`);
            if (labelTag) textoLabel = labelTag.textContent;

            let span = document.createElement('span');
            const palavrasRuim = ['TRINCADO', 'AMASSADO', 'RISCADO', 'QUEBRADO', 'DANIFICADO', 'FALTANDO', 'RUIM'];
            const ehRuim = palavrasRuim.some(p => textoLabel.toUpperCase().includes(p));

            span.className = ehRuim ? 'os-badge no' : 'os-badge ok';
            span.innerHTML = ehRuim ? `⚠️ ${textoLabel}` : `✅ ${textoLabel}`;
            areaBadges.appendChild(span);
        });
    }

    // Tabelas Orçamento
    const containerTabelas = document.getElementById('containerTabelasOrcamento');
    containerTabelas.innerHTML = '';

    const pecasTodas = itensOrcamento.filter(i => i.tipo !== 'servico');
    const servicosTodos = itensOrcamento.filter(i => i.tipo === 'servico');

    const divGrid = document.createElement('div');
    divGrid.className = 'os-grid-2 mt-10';
    divGrid.style.gap = '18px';

    const geraTabela = (titulo, itens, cor) => `
        <div class="os-table-header" style="border-bottom: 2px solid ${cor}">${titulo}</div>
        <table class="os-table" style="border: 2px solid ${cor}; border-radius: 6px; width:100%; border-collapse:collapse;">
            <thead><tr><th style="text-align:left;border-bottom:2px solid ${cor};padding:6px;font-size:11px;">DESCRIÇÃO</th><th style="text-align:right;border-bottom:2px solid ${cor};padding:6px;font-size:11px;width:90px;">VALOR</th></tr></thead>
            <tbody>${itens.length ? itens.map(p => `<tr><td style="padding:4px 6px;border-bottom:1px solid #eee;font-size:10px;">${p.descricao}</td><td style="padding:4px 6px;border-bottom:1px solid #eee;text-align:right;font-size:10px;">R$ ${p.valor.toFixed(2)}</td></tr>`).join('') : '<tr><td colspan="2" style="text-align:center;color:#999;padding:10px">-</td></tr>'}</tbody>
        </table>
        <div style="display:flex;justify-content:space-between;margin-top:8px;padding:8px 10px;border:1px solid ${cor};border-radius:6px;">
            <strong style="color:${cor};">TOTAL ${titulo}</strong>
            <span style="font-weight:700;color:${cor};">R$ ${itens.reduce((a, b) => a + b.valor, 0).toFixed(2)}</span>
        </div>
    `;

    const divPecas = document.createElement('div');
    divPecas.innerHTML = geraTabela('PEÇAS', pecasTodas, '#0056b3');
    const divServicos = document.createElement('div');
    divServicos.innerHTML = geraTabela('SERVIÇOS', servicosTodos, '#e41616');

    divGrid.appendChild(divPecas);
    divGrid.appendChild(divServicos);
    containerTabelas.appendChild(divGrid);

    // Rodapé
    const textoRodape = `Checklist gerado por ${document.getElementById('nome-oficina')?.textContent || 'Oficina'} CNPJ ${document.getElementById('cnpj-oficina')?.textContent || ''} - ${new Date().toLocaleString('pt-BR')}`;
    const rod1 = document.getElementById('rodape-texto-1');
    const rod2 = document.getElementById('rodape-texto-2');
    if (rod1) rod1.textContent = textoRodape;
    if (rod2) rod2.textContent = textoRodape;

    // Header Pág 2
    const headerPag2 = document.getElementById('header-pag2');
    if (headerPag2) headerPag2.innerHTML = document.getElementById('template-cabecalho').innerHTML;
}

function gerarPDFResumo() {
    atualizarResumoOS();
    document.querySelectorAll('.no-pdf').forEach(el => el.style.display = 'none');
    const elemento = document.getElementById('resumoContainer');

    const opt = {
        margin: [10, 10, 10, 10],
        filename: `OS-${(document.getElementById('placa')?.value || '').toUpperCase()}_CHECKLIST.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
    };

    html2pdf().set(opt).from(elemento).save()
        .then(() => { document.querySelectorAll('.no-pdf').forEach(el => el.style.display = ''); })
        .catch(() => { document.querySelectorAll('.no-pdf').forEach(el => el.style.display = ''); });
}

function gerarPDF() {
    const elemento = document.querySelector('.container');
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPadding = document.body.style.padding;
    const originalContainerMargin = elemento.style.margin;
    const originalContainerBoxShadow = elemento.style.boxShadow;

    window.scrollTo(0, 0);
    document.body.style.overflow = 'visible';
    document.body.style.padding = '0';
    elemento.style.margin = '0 auto';
    elemento.style.boxShadow = 'none';

    const botoes = document.querySelectorAll('button, .tabs, .header-badge, .action-buttons');
    botoes.forEach(btn => btn.style.display = 'none');

    const rodape = document.querySelector('.os-footer');
    rodape.style.display = 'block !important';

    const opt = {
        margin: [10, 15, 10, 15],
        filename: 'Checklist-' + document.getElementById('placa').value + '.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 1.5, useCORS: true, letterRendering: true, allowTaint: true, width: 794, height: 1123 },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(elemento).save().then(() => {
        botoes.forEach(btn => btn.style.display = '');
        document.querySelector('.tabs').style.display = 'flex';
        document.querySelector('.header-badge').style.display = 'block';
        document.querySelectorAll('.action-buttons').forEach(ab => ab.style.display = 'flex');
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.padding = originalBodyPadding;
        elemento.style.margin = originalContainerMargin;
        elemento.style.boxShadow = originalContainerBoxShadow;
    }).catch(err => {
        console.error(err);
        alert("Erro ao gerar PDF.");
        botoes.forEach(btn => btn.style.display = '');
        document.body.style.overflow = originalBodyOverflow;
    });
}

function showStep(stepNumber) {
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
    document.getElementById('step' + stepNumber).classList.add('active');
    document.querySelectorAll('.step-indicator').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.step == stepNumber) el.classList.add('active');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep(step) {
    if (step === 2) {
        const placa = document.getElementById('placa').value;
        if (!placa) {
            alert('⚠️ Por favor, digite a PLACA antes de continuar.');
            document.getElementById('placa').focus();
            return;
        }
    }
    showStep(step);
}

function prevStep(step) { showStep(step); }

document.addEventListener('DOMContentLoaded', () => {
    renderizarGaleria();
    atualizarBarraOS();

    const descricaoItem = document.getElementById("descricaoItem");
    const valorItem = document.getElementById("valorItem");

    if (descricaoItem) {
        descricaoItem.addEventListener("keydown", function (event) {
            if (event.key !== "Enter" || event.shiftKey) return;
            event.preventDefault();
            if (valorItem) valorItem.focus();
        });
    }

    if (valorItem) {
        valorItem.addEventListener("keydown", function (event) {
            if (event.key !== "Enter") return;
            event.preventDefault();
            adicionarItemManual();
            setTimeout(() => descricaoItem && descricaoItem.focus(), 0);
        });
    }

    const camposMonitorados = ['placa', 'modelo', 'chassi', 'km_entrada', 'data', 'hora', 'combustivel', 'complexidade'];
    camposMonitorados.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', atualizarResumoVeiculo);
    });

    document.getElementById('placa')?.addEventListener('input', atualizarBarraOS);
    document.getElementById('data')?.addEventListener('input', atualizarBarraOS);
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('data:application/javascript;base64,CmNvbnN0IENBQ0hFX05BTUUgPSAnY2hlY2tsaXN0LXYzLWNhY2hlJzsKY29uc3QgVVJMU19UT19DQUNIRSA9IFsKICAnLycsCiAgJy9pbmRleC5odG1sJwpdOwoKc2VsZi5hZGRFdmVudExpc3RlbmVyKCdpbnN0YWxsJywgKGV2ZW50KSA9PiB7CiAgY29uc3QgY2FjaGVPcGVuID0gY2FjaGVzLm9wZW4oQ0FDSEVfTkFNRSkudGhlbigYY2xpZW50KSA9PiB7CiAgICByZXR1cm4gY2xpZW50LmFkZEFsbChVUkxzX1RPX0NBQ0hFKTsKICB9KTsKICBldmVudC53YWl0VW50aWwoKGNhY2hlT3Blbik7Cn0pOwoKc2VsZi5hZGRFdmVudExpc3RlbmVyKCdmZXRjaCcsIChldmVudKkgPT4gewogIGV2ZW50LnJlc3BvbmRXaXRoKAogICAgY2FjaGVzLm1hdGNoKGV2ZW50LnJlcXVlc3QpLnRoZW4oKHJlc3BvbnNlKSA9PiB7CiAgICAgIGlmIChyZXNwb25zZSkgewogICAgICAgIHJldHVybiByZXNwb25zZTsKICAgICAgfQogICAgICByZXR1cm4gZmV0Y2goZXZlbnQucmVxdWVzdCk7CiAgICB9KQogICk7Cn0pOwo=');
}

// ==========================================
// PDF ORÇAMENTO (PROFISSIONAL & LIMPO)
// ==========================================
function gerarPDFOrcamento() {
    if (itensOrcamento.length === 0) {
        alert('⚠️ Adicione itens ao orçamento antes de gerar o PDF.');
        return;
    }

    const config = window.OFICINA_CONFIG || {};
    const cliente = document.getElementById('nomecliente')?.value || 'NÃO INFORMADO';
    const placa = document.getElementById('placa')?.value || '---';
    const modelo = document.getElementById('modelo')?.value || '---';
    const dataHoje = new Date().toLocaleDateString('pt-BR');

    // Cálculos
    let totalPecas = 0;
    let totalServicos = 0;

    const linhasPecas = itensOrcamento.filter(i => i.tipo !== 'servico').map(item => {
        totalPecas += item.valor;
        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; font-size: 12px; color: #333;">${item.descricao}</td>
                <td style="padding: 8px; font-size: 12px; text-align: right; color: #333;">R$ ${item.valor.toFixed(2)}</td>
            </tr>`;
    }).join('');

    const linhasServicos = itensOrcamento.filter(i => i.tipo === 'servico').map(item => {
        totalServicos += item.valor;
        return `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px; font-size: 12px; color: #333;">${item.descricao}</td>
                <td style="padding: 8px; font-size: 12px; text-align: right; color: #333;">R$ ${item.valor.toFixed(2)}</td>
            </tr>`;
    }).join('');

    const totalGeral = totalPecas + totalServicos;
    const corTema = config.corPrimaria || '#000000'; // Preto se não tiver cor defined (Fica mais pro)

    // Conteúdo HTML Puro para o PDF (Sem botões, sem scripts, só visual)
    const conteudoPDF = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; background: #fff;">
            
            <!-- CABEÇALHO -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid ${corTema};">
                <div style="display: flex; gap: 20px; align-items: center;">
                    ${config.logo ? `<img src="${config.logo}" style="height: 80px; width: auto; object-fit: contain;">` : ''}
                    <div>
                        <h1 style="margin: 0; font-size: 22px; color: ${corTema}; text-transform: uppercase; font-weight: 800;">${config.nome || 'NOME DA OFICINA'}</h1>
                        <div style="font-size: 11px; color: #555; margin-top: 8px; line-height: 1.5;">
                            ${config.subtitulo ? `<strong>${config.subtitulo}</strong><br>` : ''}
                            ${config.endereco || ''}<br>
                            ${config.telefone || ''}
                        </div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="background: ${corTema}; color: #fff; padding: 5px 15px; border-radius: 4px; font-size: 14px; font-weight: bold; display: inline-block;">ORÇAMENTO</div>
                    <p style="margin: 10px 0 0; font-size: 12px; color: #666;">Data: ${dataHoje}</p>
                </div>
            </div>

            <!-- CLIENTE CARD -->
            <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 30px 0; display: flex; justify-content: space-between;">
                <div>
                    <span style="font-size: 10px; text-transform: uppercase; color: #888; font-weight: bold;">CLIENTE</span><br>
                    <strong style="font-size: 16px; color: #333;">${cliente}</strong>
                </div>
                <div>
                    <span style="font-size: 10px; text-transform: uppercase; color: #888; font-weight: bold;">VEÍCULO</span><br>
                    <strong style="font-size: 16px; color: #333;">${modelo}</strong>
                </div>
                <div>
                    <span style="font-size: 10px; text-transform: uppercase; color: #888; font-weight: bold;">PLACA</span><br>
                    <div style="background: #e9ecef; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 16px; text-align: center; border: 1px solid #ced4da; margin-top: 2px;">${placa.toUpperCase()}</div>
                </div>
            </div>

            <!-- TABELAS -->
            <div style="display: flex; gap: 30px; margin-bottom: 30px;">
                <!-- PEÇAS -->
                <div style="flex: 1;">
                    <h3 style="font-size: 12px; text-transform: uppercase; color: #888; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px;">📦 Peças Substituídas</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${linhasPecas || '<tr><td colspan="2" style="padding:10px; text-align:center; font-size:11px; color:#999;">-</td></tr>'}
                    </table>
                </div>
                <!-- SERVIÇOS -->
                <div style="flex: 1;">
                    <h3 style="font-size: 12px; text-transform: uppercase; color: #888; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px;">🔧 Serviços Realizados</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${linhasServicos || '<tr><td colspan="2" style="padding:10px; text-align:center; font-size:11px; color:#999;">-</td></tr>'}
                    </table>
                </div>
            </div>

            <!-- TOTAIS -->
            <div style="border-top: 1px solid #eee; padding-top: 20px; display: flex; justify-content: flex-end;">
                <div style="width: 250px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; color: #666;">
                        <span>Total Peças</span>
                        <span>R$ ${totalPecas.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; color: #666;">
                        <span>Total Serviços</span>
                        <span>R$ ${totalServicos.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #333; font-size: 20px; font-weight: 800; color: #000;">
                        <span>TOTAL</span>
                        <span>R$ ${totalGeral.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <!-- FOOTER -->
            <div style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 10px; color: #999;">
                Documento gerado digitalmente em ${new Date().toLocaleString('pt-BR')}
            </div>

        </div>
    `;

    // Configuração do PDF
    const opt = {
        margin: 0,
        filename: `ORC_${placa}_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true }, // Scale 2 para alta qualidade
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Gera o PDF a partir da string HTML (NÃO do elemento na tela)
    // Isso garante que BOTOES NÃO APAREÇAM e o design seja EXATO
    html2pdf().set(opt).from(conteudoPDF).save().then(() => {
        // Feedback
        // setTimeout(() => alert('PDF Gerado com sucesso!'), 500);
    });
}


// ==========================================
// WHATSAPP SHARE FEATURE (CORRIGIDO)
// ==========================================
function enviarWhatsApp(tipo, valorTotal = '0,00') {
    const nome = document.getElementById('nomecliente')?.value || document.getElementById('nome_cliente')?.value || '';
    const placa = document.getElementById('placa')?.value || '';
    const modelo = document.getElementById('modelo')?.value || '';
    const celular = document.getElementById('celularcliente')?.value || document.getElementById('celular_cliente')?.value || '';
    const telefone = celular.replace(/\D/g, '');
    const nomeOficina = window.OFICINA_CONFIG ? window.OFICINA_CONFIG.nome : 'Nossa Oficina';

    if (!telefone) {
        alert('⚠️ É necessário preencher o Celular do Cliente na aba "Dados do Cliente" para enviar.');
        // Tenta focar no campo
        const el1 = document.getElementById('celularcliente');
        const el2 = document.getElementById('celular_cliente');
        if (el1) el1.focus();
        else if (el2) el2.focus();
        else switchTab('step3'); // Vai para aba de dados 
        return;
    }

    let mensagem = '';
    const saudacao = obterSaudacao();

    if (tipo === 'orcamento') {
        // MENSAGEM ESPECÍFICA DE ORÇAMENTO
        mensagem = `*${saudacao} ${nome}! Tudo bem?* 👋\n\nSou da *${nomeOficina}*.\n\nPreparamos o orçamento do seu veículo (${modelo} - Placa ${placa.toUpperCase()}).\n\n💰 *Valor Total: R$ ${valorTotal}*\n\n📄 *O PDF detalhado com peças e serviços segue em anexo.*\n\nFico no aguardo!`;
    } else {
        // MENSAGEM GERAL / CHECKLIST
        mensagem = `*${saudacao} ${nome}! Tudo bem?* 👋\n\nSou da *${nomeOficina}*.\n\nFinalizamos a avaliação do seu veículo (${modelo} - Placa ${placa.toUpperCase()}).\n\n📋 *O Relatório Técnico e as Fotos seguem aqui.*\n\nDê uma olhadinha e me diga o que acha!`;
    }

    const url = `https://api.whatsapp.com/send?phone=55${telefone}&text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
}

function obterSaudacao() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
}
