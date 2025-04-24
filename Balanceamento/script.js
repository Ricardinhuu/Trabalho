// Armazenamento dos dados
let visitas = [];
let colunasDisponiveis = [];
let semanaAtual = 'semana1';
let dataBase = new Date(2025, 3, 21); // 21/04/2025 como data base inicial

// Elementos do DOM
const vendedorInput = document.getElementById('vendedor');
const diaInput = document.getElementById('dia');
const clientesInput = document.getElementById('clientes');
const adicionarBtn = document.getElementById('adicionar');
const importarBtn = document.getElementById('importar');
const arquivoCSV = document.getElementById('arquivo-csv');
const previewSection = document.getElementById('preview-section');
const colunasDisponiveisDiv = document.getElementById('colunas-disponiveis');
const colunaCodigoSelect = document.getElementById('coluna-codigo');
const colunaDiaSelect = document.getElementById('coluna-dia');
const colunaPeriodicidadeSelect = document.getElementById('coluna-periodicidade');
const colunaDataSelect = document.getElementById('coluna-data');
const dataReferenciaInput = document.getElementById('data-referencia');
const tabelaVisitas = document.getElementById('tabela-visitas');
const tabButtons = document.querySelectorAll('.tab-button');

// Função para formatar a data
function formatarData(dataStr) {
    if (!dataStr) return null;
    
    const partes = dataStr.trim().split('/');
    if (partes.length !== 3) return null;
    
    const dia = parseInt(partes[0]);
    const mes = parseInt(partes[1]) - 1; // Mês começa em 0 no JavaScript
    const ano = parseInt(partes[2]);
    
    const data = new Date(ano, mes, dia);
    data.setHours(0, 0, 0, 0);
    return data;
}

// Função para calcular o início da semana
function getInicioSemana(data) {
    const dataObj = formatarData(data);
    if (!dataObj) {
        console.error('Data inválida:', data);
        return null;
    }
    
    // Se a data já é segunda-feira, retorna ela mesma
    if (dataObj.getDay() === 1) {
        return dataObj;
    }
    
    // Calcula a diferença para a segunda-feira anterior
    const dia = dataObj.getDay();
    const diff = dia === 0 ? -6 : 1 - dia; // Se for domingo, volta 6 dias, senão calcula a diferença para segunda
    
    const inicioSemana = new Date(dataObj);
    inicioSemana.setDate(dataObj.getDate() + diff);
    return inicioSemana;
}

// Função para atualizar as datas das semanas
function atualizarSemanas() {
    const hoje = new Date();
    
    // Encontra a próxima segunda-feira a partir da data base
    while (hoje >= dataBase) {
        dataBase.setDate(dataBase.getDate() + 14); // Avança 14 dias (2 semanas)
    }
    
    // Volta 14 dias para pegar o início do período atual
    dataBase.setDate(dataBase.getDate() - 14);
    
    // Define as datas das semanas
    const inicioSemana1 = new Date(dataBase);
    const inicioSemana2 = new Date(dataBase);
    inicioSemana2.setDate(inicioSemana2.getDate() + 7);
    const fimSemana2 = new Date(inicioSemana2);
    fimSemana2.setDate(fimSemana2.getDate() + 6);
    
    // Atualiza os textos dos botões
    const botoes = document.querySelectorAll('.tab-button');
    botoes[0].textContent = `Semana 1 (${formatarDataBotao(inicioSemana1)} - ${formatarDataBotao(new Date(inicioSemana2.getTime() - 86400000))})`;
    botoes[1].textContent = `Semana 2 (${formatarDataBotao(inicioSemana2)} - ${formatarDataBotao(fimSemana2)})`;
    
    return {
        inicioSemana1,
        inicioSemana2,
        fimSemana2
    };
}

// Função para formatar data para exibição nos botões
function formatarDataBotao(data) {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}`;
}

// Função para determinar a semana com base na data específica
function getSemana(data) {
    const dataObj = formatarData(data);
    if (!dataObj) {
        console.error('Data inválida:', data);
        return null;
    }
    
    // Obtém as datas atualizadas das semanas
    const { inicioSemana1, inicioSemana2, fimSemana2 } = atualizarSemanas();
    
    // Normaliza as datas para comparação (remove as horas)
    const dataInicio1 = new Date(inicioSemana1);
    const dataInicio2 = new Date(inicioSemana2);
    const dataFim2 = new Date(fimSemana2);
    
    dataInicio1.setHours(0, 0, 0, 0);
    dataInicio2.setHours(0, 0, 0, 0);
    dataFim2.setHours(23, 59, 59, 999);
    dataObj.setHours(0, 0, 0, 0);

    // Verifica em qual semana a data se encaixa
    if (dataObj >= dataInicio1 && dataObj < dataInicio2) {
        return 'semana1';
    } else if (dataObj >= dataInicio2 && dataObj <= dataFim2) {
        return 'semana2';
    }
    
    // Se a data não se encaixa em nenhuma semana, verifica a proximidade
    const diffSemana1 = Math.abs(dataObj - dataInicio1);
    const diffSemana2 = Math.abs(dataObj - dataInicio2);
    
    return diffSemana1 <= diffSemana2 ? 'semana1' : 'semana2';
}

// Função para normalizar o dia da semana
function normalizarDia(dia) {
    const dias = {
        'segunda': 'segunda',
        'segunda-feira': 'segunda',
        'seg/': 'segunda',
        'seg': 'segunda',
        'terca': 'terca',
        'terça': 'terca',
        'terça-feira': 'terca',
        'ter/': 'terca',
        'ter': 'terca',
        'quarta': 'quarta',
        'quarta-feira': 'quarta',
        'qua/': 'quarta',
        'qua': 'quarta',
        'quinta': 'quinta',
        'quinta-feira': 'quinta',
        'qui/': 'quinta',
        'qui': 'quinta',
        'sexta': 'sexta',
        'sexta-feira': 'sexta',
        'sex/': 'sexta',
        'sex': 'sexta',
        'sabado': 'sabado',
        'sábado': 'sabado',
        'sab/': 'sabado',
        'sab': 'sabado'
    };
    return dias[dia.toLowerCase()] || dia.toLowerCase();
}

// Função para mostrar pré-visualização do arquivo
function mostrarPreview(arquivo) {
    const leitor = new FileReader();
    leitor.onload = function(e) {
        const conteudo = e.target.result;
        const linhas = conteudo.split('\n');
        const cabecalho = linhas[0].split(';');
        
        // Limpa as seleções anteriores
        colunaCodigoSelect.innerHTML = '';
        colunaDiaSelect.innerHTML = '';
        colunaPeriodicidadeSelect.innerHTML = '';
        colunaDataSelect.innerHTML = '';
        colunasDisponiveisDiv.innerHTML = '';
        
        // Armazena as colunas disponíveis
        colunasDisponiveis = cabecalho.map((nome, indice) => ({
            nome: nome.trim(),
            indice: indice
        }));
        
        // Mostra preview das colunas
        colunasDisponiveis.forEach((coluna, indice) => {
            // Adiciona ao preview
            const colunaDiv = document.createElement('div');
            colunaDiv.className = 'coluna-preview';
            colunaDiv.innerHTML = `
                <h4>Coluna ${indice + 1}</h4>
                <p>${coluna.nome}</p>
            `;
            colunasDisponiveisDiv.appendChild(colunaDiv);
            
            // Adiciona às opções de seleção
            const option = document.createElement('option');
            option.value = indice;
            option.textContent = `${indice + 1}: ${coluna.nome}`;
            
            colunaCodigoSelect.appendChild(option.cloneNode(true));
            colunaDiaSelect.appendChild(option.cloneNode(true));
            colunaPeriodicidadeSelect.appendChild(option.cloneNode(true));
            colunaDataSelect.appendChild(option.cloneNode(true));
        });
        
        // Mostra a seção de preview e o botão de importar
        previewSection.style.display = 'block';
        importarBtn.style.display = 'block';
    };
    
    leitor.readAsText(arquivo);
}

// Função para adicionar nova visita
function adicionarVisita() {
    const vendedor = vendedorInput.value.trim();
    const dia = diaInput.value;
    const clientes = parseInt(clientesInput.value);

    if (!vendedor || isNaN(clientes) || clientes < 0) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }

    // Adiciona a visita ao array
    visitas.push({
        vendedor,
        dia,
        clientes,
        semana: 'semana1'
    });

    // Atualiza a tabela
    atualizarTabela();

    // Limpa os campos
    vendedorInput.value = '';
    clientesInput.value = '';
}

// Função para atualizar a tabela
function atualizarTabela() {
    // Agrupa as visitas por vendedor e dia
    const resumo = {};
    
    // Filtra apenas as visitas da semana atual
    const visitasDaSemana = visitas.filter(visita => visita.semana === semanaAtual);
    
    // Processa as visitas da semana selecionada
    visitasDaSemana.forEach(visita => {
        if (!resumo[visita.vendedor]) {
            resumo[visita.vendedor] = {
                segunda: 0,
                terca: 0,
                quarta: 0,
                quinta: 0,
                sexta: 0,
                total: 0
            };
        }
        
        resumo[visita.vendedor][visita.dia] += visita.clientes;
        resumo[visita.vendedor].total += visita.clientes;
    });
    
    // Cria a tabela HTML
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Vendedor</th>
                    <th>Segunda</th>
                    <th>Terça</th>
                    <th>Quarta</th>
                    <th>Quinta</th>
                    <th>Sexta</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Adiciona as linhas da tabela
    Object.entries(resumo).forEach(([vendedor, dias]) => {
        html += `
            <tr>
                <td>${vendedor}</td>
                <td class="${dias.segunda > 35 ? 'highlight' : ''}">${dias.segunda}</td>
                <td class="${dias.terca > 35 ? 'highlight' : ''}">${dias.terca}</td>
                <td class="${dias.quarta > 35 ? 'highlight' : ''}">${dias.quarta}</td>
                <td class="${dias.quinta > 35 ? 'highlight' : ''}">${dias.quinta}</td>
                <td class="${dias.sexta > 35 ? 'highlight' : ''}">${dias.sexta}</td>
                <td>${dias.total}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    tabelaVisitas.innerHTML = html;
}

// Função para importar CSV
function importarCSV() {
    const arquivo = arquivoCSV.files[0];
    if (!arquivo) {
        alert('Por favor, selecione um arquivo CSV.');
        return;
    }

    const leitor = new FileReader();
    leitor.onload = function(e) {
        const conteudo = e.target.result;
        const linhas = conteudo.split('\n');
        
        // Obtém os índices das colunas selecionadas
        const iCodigo = parseInt(colunaCodigoSelect.value);
        const iDia = parseInt(colunaDiaSelect.value);
        const iPeriodicidade = parseInt(colunaPeriodicidadeSelect.value);
        const iData = parseInt(colunaDataSelect.value);
        
        // Limpa as visitas existentes
        visitas = [];
        
        // Processa cada linha do arquivo
        for (let i = 1; i < linhas.length; i++) {
            const linha = linhas[i].trim();
            if (!linha) continue;
            
            const colunas = linha.split(';');
            if (colunas.length <= Math.max(iCodigo, iDia, iPeriodicidade, iData)) continue;
            
            const vendedor = colunas[iCodigo].trim();
            const diaVisita = normalizarDia(colunas[iDia].trim());
            const periodicidade = colunas[iPeriodicidade].trim().toLowerCase();
            
            // Se a periodicidade é semanal, adiciona para ambas as semanas
            if (periodicidade === 'semanal') {
                visitas.push({
                    vendedor,
                    dia: diaVisita,
                    clientes: 1,
                    semana: 'semana1'
                });
                visitas.push({
                    vendedor,
                    dia: diaVisita,
                    clientes: 1,
                    semana: 'semana2'
                });
            }
            // Se a periodicidade é quinzenal, alterna entre as semanas
            else if (periodicidade === 'quinzenal') {
                // Determina a semana com base no vendedor (alternância)
                const semana = vendedor.length % 2 === 0 ? 'semana1' : 'semana2';
                visitas.push({
                    vendedor,
                    dia: diaVisita,
                    clientes: 1,
                    semana: semana
                });
            }
        }
        
        // Atualiza a exibição
        atualizarTabela();
        mostrarMensagem('Dados importados com sucesso!', 'success');
    };
    
    leitor.readAsText(arquivo);
}

// Função para mostrar mensagens
function mostrarMensagem(mensagem, tipo) {
    const mensagemDiv = document.createElement('div');
    mensagemDiv.className = tipo;
    mensagemDiv.textContent = mensagem;
    
    // Remove mensagens anteriores
    const mensagensAnteriores = document.querySelectorAll('.error, .success');
    mensagensAnteriores.forEach(msg => msg.remove());
    
    // Adiciona a nova mensagem após o botão de importar
    importarBtn.parentNode.insertBefore(mensagemDiv, importarBtn.nextSibling);
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => mensagemDiv.remove(), 5000);
}

// Event Listeners
adicionarBtn.addEventListener('click', adicionarVisita);
importarBtn.addEventListener('click', importarCSV);
arquivoCSV.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        mostrarPreview(e.target.files[0]);
    }
});

// Event Listeners para as abas
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        semanaAtual = button.dataset.tab;
        atualizarTabela();
    });
});

// Permite adicionar com Enter
clientesInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        adicionarVisita();
    }
});

// Atualiza as semanas a cada minuto
setInterval(atualizarSemanas, 60000);

// Atualiza as semanas quando a página carrega
document.addEventListener('DOMContentLoaded', atualizarSemanas); 