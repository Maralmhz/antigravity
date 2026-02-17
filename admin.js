/**
 * ADMIN.JS - Painel de Configuração "Secreto"
 * Permite alterar os dados da oficina sem mexer no código.
 * ACESSO: Clique 5 vezes no Logo ou na versão do rodapé.
 */

document.addEventListener('DOMContentLoaded', () => {
    criarModalConfig();

    // Gatilho secreto: 5 cliques no logo
    let clicks = 0;
    const logo = document.getElementById('logo-oficina') || document.body;

    logo.addEventListener('click', () => {
        clicks++;
        if (clicks === 5) {
            abrirPainelConfig();
            clicks = 0;
        }
        setTimeout(() => clicks = 0, 2000); // Reseta se demorar
    });

    // Gatilho secundário: Botão flutuante invisível no canto
    const magicBtn = document.createElement('div');
    magicBtn.style.cssText = 'position:fixed; bottom:0; right:0; width:20px; height:20px; z-index:99999; cursor:pointer; opacity:0;';
    magicBtn.onclick = abrirPainelConfig;
    document.body.appendChild(magicBtn);
});

function criarModalConfig() {
    const modal = document.createElement('div');
    modal.id = 'admin-modal';
    modal.className = 'admin-modal hidden';

    modal.innerHTML = `
        <div class="admin-content">
            <div class="admin-header">
                <h2>⚙️ Configuração da Oficina</h2>
                <button onclick="fecharPainelConfig()" class="close-btn">×</button>
            </div>
            <div class="admin-body">
                <div class="form-group">
                    <label>Nome da Oficina</label>
                    <input type="text" id="cfg-nome" placeholder="Ex: G-Car Auto Center">
                </div>
                <div class="form-group">
                    <label>Subtítulo</label>
                    <input type="text" id="cfg-subtitulo" placeholder="Ex: Especializada em Importados">
                </div>
                <div class="form-group">
                    <label>CNPJ</label>
                    <input type="text" id="cfg-cnpj" placeholder="00.000.000/0001-00">
                </div>
                <div class="form-group">
                    <label>Telefone</label>
                    <input type="text" id="cfg-telefone" placeholder="(11) 99999-9999">
                </div>
                <div class="form-group">
                    <label>Endereço</label>
                    <textarea id="cfg-endereco" rows="2" placeholder="Rua das Flores, 123..."></textarea>
                </div>
                <div class="form-group">
                    <label>URL do Logo</label>
                    <input type="text" id="cfg-logo" placeholder="https://...">
                    <small>Cole o link da imagem (hospede no imgur.com se precisar)</small>
                </div>
                <div class="form-group">
                    <label>Cor Primária</label>
                    <input type="color" id="cfg-cor" value="#e41616">
                </div>
            </div>
            <div class="admin-footer">
                <button onclick="resetarConfig()" class="btn-danger">Restaurar Padrão</button>
                <button onclick="salvarConfig()" class="btn-success">Salvar Alterações</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function abrirPainelConfig() {
    const modal = document.getElementById('admin-modal');
    const cfg = JSON.parse(localStorage.getItem('OFICINA_CONFIG_LOCAL')) || window.OFICINA_CONFIG;

    document.getElementById('cfg-nome').value = cfg.nome || '';
    document.getElementById('cfg-subtitulo').value = cfg.subtitulo || '';
    document.getElementById('cfg-cnpj').value = cfg.cnpj || '';
    document.getElementById('cfg-telefone').value = cfg.telefone || '';
    document.getElementById('cfg-endereco').value = cfg.endereco || '';
    document.getElementById('cfg-logo').value = cfg.logo || '';
    document.getElementById('cfg-cor').value = cfg.corPrimaria || '#e41616';

    modal.classList.remove('hidden');
}

function fecharPainelConfig() {
    document.getElementById('admin-modal').classList.add('hidden');
}

function salvarConfig() {
    const novaConfig = {
        nome: document.getElementById('cfg-nome').value,
        subtitulo: document.getElementById('cfg-subtitulo').value,
        cnpj: document.getElementById('cfg-cnpj').value,
        telefone: document.getElementById('cfg-telefone').value,
        endereco: document.getElementById('cfg-endereco').value,
        logo: document.getElementById('cfg-logo').value,
        corPrimaria: document.getElementById('cfg-cor').value
    };

    localStorage.setItem('OFICINA_CONFIG_LOCAL', JSON.stringify(novaConfig));
    alert('✅ Configurações salvas! A página será recarregada.');
    location.reload();
}

function resetarConfig() {
    if (confirm('Tem certeza? Isso voltará para as configurações originais do código.')) {
        localStorage.removeItem('OFICINA_CONFIG_LOCAL');
        location.reload();
    }
}
