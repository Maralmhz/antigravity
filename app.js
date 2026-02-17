// 1. Tenta carregar da URL (Link Compartilhado)
const urlParams = new URLSearchParams(window.location.search);
const configUrl = urlParams.get('cfg');

if (configUrl) {
    try {
        const configDecoded = JSON.parse(atob(configUrl));
        window.OFICINA_CONFIG = { ...window.OFICINA_CONFIG, ...configDecoded };
        // Salva no local para persistir se o usuário navegar
        localStorage.setItem('OFICINA_CONFIG_LOCAL', JSON.stringify(configDecoded));
    } catch (e) {
        console.error('Erro ao ler config da URL', e);
    }
}
// 2. Se não tem URL, tenta carregar do LocalStorage (Configuração Manual)
else {
    const localConfig = localStorage.getItem('OFICINA_CONFIG_LOCAL');
    if (localConfig) {
        window.OFICINA_CONFIG = { ...window.OFICINA_CONFIG, ...JSON.parse(localConfig) };
    }
}

if (!window.OFICINA_CONFIG) {
    console.warn('OFICINA_CONFIG não encontrado. Usando textos padrão do HTML.');
    return;
}

const cfg = window.OFICINA_CONFIG;

// Elementos principais
const elTituloPagina = document.getElementById('titulo-pagina');
const elLogo = document.getElementById('logo-oficina');
const elNomeOficina = document.getElementById('nome-oficina');
const elSubtitulo = document.getElementById('subtitulo-oficina');
const elCnpj = document.getElementById('cnpj-oficina');
const elTelefone = document.getElementById('telefone-oficina');
const elEndereco = document.getElementById('endereco-oficina');

if (elTituloPagina && cfg.nome) elTituloPagina.textContent = `Checklist de Entrada – ${cfg.nome}`;
if (elLogo && cfg.logo) elLogo.src = cfg.logo;
if (elNomeOficina && cfg.nome) elNomeOficina.textContent = cfg.nome;
if (elSubtitulo && cfg.subtitulo) elSubtitulo.textContent = cfg.subtitulo;
if (elCnpj && cfg.cnpj) elCnpj.textContent = `CNPJ: ${cfg.cnpj}`;
if (elTelefone && cfg.telefone) elTelefone.textContent = cfg.telefone;
if (elEndereco && cfg.endereco) elEndereco.textContent = cfg.endereco;

// Cor principal (usa sua var existente)
if (cfg.corPrimaria) {
    document.documentElement.style.setProperty('--color-primary', cfg.corPrimaria);
}

});
