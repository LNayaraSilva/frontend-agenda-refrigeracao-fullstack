const API_URL = 'http://localhost:3000/api/entries';

const form = document.getElementById('entry-form');
const entryId = document.getElementById('entry-id');

const title = document.getElementById('title'); // nome do cliente
const address = document.getElementById('address');
const phone = document.getElementById('phone');
const service = document.getElementById('service');
const description = document.getElementById('description');
const happenedAt = document.getElementById('happenedAt');

const entriesList = document.getElementById('entries-list');
const message = document.getElementById('message');
const cancelEdit = document.getElementById('cancel-edit');
const formTitle = document.getElementById('form-title');
const reloadBtn = document.getElementById('reload-btn');

function showMessage(text) {
  message.textContent = text;
}

function clearForm() {
  form.reset();
  entryId.value = '';
  formTitle.textContent = 'Novo agendamento';
  cancelEdit.classList.add('hidden');
  happenedAt.value = new Date().toISOString().slice(0, 16);
}

function formatDate(date) {
  return new Date(date).toLocaleString('pt-BR');
}

function createDescription() {
  return `
Endereço: ${address.value}
Telefone: ${phone.value}
Serviço: ${service.value}
Observação: ${description.value || 'Sem observações'}
  `;
}

function getInfoFromDescription(descriptionText, label) {
  const regex = new RegExp(`${label}:\\s*(.*)`, 'i');
  const match = descriptionText.match(regex);
  return match ? match[1].trim() : '';
}

async function loadEntries() {
  const response = await fetch(API_URL);
  const entries = await response.json();

  if (!entries.length) {
    entriesList.innerHTML = '<p>Nenhum agendamento encontrado.</p>';
    return;
  }

  entriesList.innerHTML = entries.map(entry => {
    const endereco = getInfoFromDescription(entry.description, 'Endereço');
    const telefone = getInfoFromDescription(entry.description, 'Telefone');
    const servico = getInfoFromDescription(entry.description, 'Serviço');
    const observacao = getInfoFromDescription(entry.description, 'Observação');

    return `
      <div class="entry-item">
        <h3>❄️ ${entry.title}</h3>
        <p><strong>Data e horário:</strong> ${formatDate(entry.happenedAt)}</p>
        <p><strong>Endereço:</strong> ${endereco}</p>
        <p><strong>Telefone:</strong> ${telefone}</p>
        <p><strong>Serviço:</strong> ${servico}</p>
        <p><strong>Observação:</strong> ${observacao}</p>

        <div class="entry-buttons">
          <button onclick="editEntry('${entry._id}')">Editar</button>
          <button onclick="deleteEntry('${entry._id}')">Excluir</button>
        </div>
      </div>
    `;
  }).join('');
}

async function saveEntry(data) {
  const id = entryId.value;
  const url = id ? `${API_URL}/${id}` : API_URL;
  const method = id ? 'PUT' : 'POST';

  await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

window.editEntry = async function (id) {
  const response = await fetch(`${API_URL}/${id}`);
  const entry = await response.json();

  entryId.value = entry._id;
  title.value = entry.title;
  happenedAt.value = new Date(entry.happenedAt).toISOString().slice(0, 16);

  address.value = getInfoFromDescription(entry.description, 'Endereço');
  phone.value = getInfoFromDescription(entry.description, 'Telefone');
  service.value = getInfoFromDescription(entry.description, 'Serviço');
  description.value = getInfoFromDescription(entry.description, 'Observação');

  formTitle.textContent = 'Editar agendamento';
  cancelEdit.classList.remove('hidden');
  showMessage('Editando agendamento.');
};

window.deleteEntry = async function (id) {
  if (!confirm('Deseja excluir este agendamento?')) return;

  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  showMessage('Agendamento excluído.');
  loadEntries();
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    title: title.value,
    description: createDescription(),
    happenedAt: happenedAt.value
  };

  await saveEntry(data);
  showMessage(entryId.value ? 'Agendamento atualizado.' : 'Agendamento criado.');
  clearForm();
  loadEntries();
});

cancelEdit.addEventListener('click', () => {
  clearForm();
  showMessage('Edição cancelada.');
});

reloadBtn.addEventListener('click', loadEntries);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./service-worker.js');
      console.log('Service Worker registrado com sucesso.');
    } catch (error) {
      console.log('Erro ao registrar Service Worker:', error);
    }
  });
}

clearForm();
loadEntries();