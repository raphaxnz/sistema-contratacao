import { ApiError, createFuncionariosApi } from "./api.js";

const config = window.APP_CONFIG || { mode: "mock", apiBaseUrl: "/api" };
const api = createFuncionariosApi(config);

const STATUS_META = Object.freeze({
  EM_ANALISE: { label: "Em análise", className: "analysis" },
  APROVADO: { label: "Aprovado", className: "approved" },
  REPROVADO: { label: "Reprovado", className: "rejected" },
  CONTRATADO: { label: "Contratado", className: "hired" },
});

const icons = Object.freeze({
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.75 12s3-5.25 8.25-5.25S20.25 12 20.25 12 17.25 17.25 12 17.25 3.75 12 3.75 12Z"/><circle cx="12" cy="12" r="2.25"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14.75 5.25 4 4-10 10h-4v-4l10-10ZM12.75 7.25l4 4"/></svg>',
  patch: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.25 12a7.75 7.75 0 1 1 2.27 5.48M4.25 17.25v-5h5M12 8v4.25l2.75 1.5"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.75 7.25h14.5M9.25 7.25v-2a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1v2M7 7.25l.75 12h8.5l.75-12M10 10.5v5.75M14 10.5v5.75"/></svg>',
});

const state = {
  employees: [],
  search: "",
  status: "TODOS",
  selectedDetailsId: null,
};

const elements = {
  dataSourceLabel: document.querySelector("#data-source-label"),
  resetDataButton: document.querySelector("#reset-data-button"),
  newCandidateButton: document.querySelector("#new-candidate-button"),
  searchInput: document.querySelector("#search-input"),
  statusFilter: document.querySelector("#status-filter"),
  clearFiltersButton: document.querySelector("#clear-filters-button"),
  idSearchForm: document.querySelector("#id-search-form"),
  idSearchInput: document.querySelector("#id-search-input"),
  loadingState: document.querySelector("#loading-state"),
  errorState: document.querySelector("#error-state"),
  errorStateMessage: document.querySelector("#error-state-message"),
  retryButton: document.querySelector("#retry-button"),
  emptyState: document.querySelector("#empty-state"),
  tableRegion: document.querySelector("#table-region"),
  tableBody: document.querySelector("#candidate-table-body"),
  mobileList: document.querySelector("#mobile-candidate-list"),
  tableFooter: document.querySelector("#table-footer"),
  resultsSummary: document.querySelector("#results-summary"),
  candidateDialog: document.querySelector("#candidate-dialog"),
  candidateForm: document.querySelector("#candidate-form"),
  candidateDialogEyebrow: document.querySelector("#candidate-dialog-eyebrow"),
  candidateDialogTitle: document.querySelector("#candidate-dialog-title"),
  candidateDialogDescription: document.querySelector("#candidate-dialog-description"),
  candidateId: document.querySelector("#candidate-id"),
  manualIdField: document.querySelector("#manual-id-field"),
  candidateSubmitButton: document.querySelector("#candidate-submit-button"),
  detailsDialog: document.querySelector("#details-dialog"),
  detailsContent: document.querySelector("#details-content"),
  detailsEditButton: document.querySelector("#details-edit-button"),
  patchDialog: document.querySelector("#patch-dialog"),
  patchForm: document.querySelector("#patch-form"),
  patchId: document.querySelector("#patch-id"),
  patchCandidateName: document.querySelector("#patch-candidate-name"),
  patchFormError: document.querySelector("#patch-form-error"),
  patchSubmitButton: document.querySelector("#patch-submit-button"),
  deleteDialog: document.querySelector("#delete-dialog"),
  deleteForm: document.querySelector("#delete-form"),
  deleteId: document.querySelector("#delete-id"),
  deleteCandidateName: document.querySelector("#delete-candidate-name"),
  deleteSubmitButton: document.querySelector("#delete-submit-button"),
  toastRegion: document.querySelector("#toast-region"),
  stats: {
    total: document.querySelector("#stat-total"),
    analysis: document.querySelector("#stat-analysis"),
    approved: document.querySelector("#stat-approved"),
    rejected: document.querySelector("#stat-rejected"),
    hired: document.querySelector("#stat-hired"),
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function initials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "Não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function statusBadge(status) {
  const meta = STATUS_META[status] || { label: status || "Não informado", className: "analysis" };
  return `<span class="status-badge status-badge--${meta.className}">${escapeHtml(meta.label)}</span>`;
}

function actionButtons(employee) {
  const safeId = Number(employee.id);
  const safeName = escapeHtml(employee.nome);
  return `
    <div class="action-group" aria-label="Ações de ${safeName}">
      <button class="action-button" type="button" data-action="view" data-id="${safeId}" aria-label="Ver detalhes de ${safeName}" title="Consultar por ID (GET)">${icons.eye}</button>
      <button class="action-button" type="button" data-action="edit" data-id="${safeId}" aria-label="Editar ${safeName}" title="Edição completa (PUT)">${icons.edit}</button>
      <button class="action-button" type="button" data-action="patch" data-id="${safeId}" aria-label="Atualização rápida de ${safeName}" title="Atualização parcial (PATCH)">${icons.patch}</button>
      <button class="action-button action-button--delete" type="button" data-action="delete" data-id="${safeId}" aria-label="Excluir ${safeName}" title="Excluir (DELETE)">${icons.trash}</button>
    </div>`;
}

function tableRow(employee) {
  return `
    <tr>
      <td>
        <div class="candidate-cell">
          <span class="avatar" aria-hidden="true">${escapeHtml(initials(employee.nome))}</span>
          <span><strong>${escapeHtml(employee.nome)}</strong><small>ID ${escapeHtml(employee.id)} · ${escapeHtml(employee.email)}</small></span>
        </div>
      </td>
      <td>${escapeHtml(employee.cargo || "Não informado")}</td>
      <td class="muted-value">${escapeHtml(employee.departamento || "Não informado")}</td>
      <td>${statusBadge(employee.status)}</td>
      <td class="muted-value">${escapeHtml(employee.cidade || "Não informado")}</td>
      <td>${actionButtons(employee)}</td>
    </tr>`;
}

function mobileCard(employee) {
  return `
    <article class="candidate-card">
      <div class="candidate-card__header">
        <div class="candidate-cell">
          <span class="avatar" aria-hidden="true">${escapeHtml(initials(employee.nome))}</span>
          <span><strong>${escapeHtml(employee.nome)}</strong><small>ID ${escapeHtml(employee.id)} · ${escapeHtml(employee.email)}</small></span>
        </div>
        ${statusBadge(employee.status)}
      </div>
      <div class="candidate-card__info">
        <span><small>Cargo</small><strong>${escapeHtml(employee.cargo || "Não informado")}</strong></span>
        <span><small>Cidade</small><strong>${escapeHtml(employee.cidade || "Não informado")}</strong></span>
      </div>
      ${actionButtons(employee)}
    </article>`;
}

function filteredEmployees() {
  const query = normalizeText(state.search);
  return state.employees.filter((employee) => {
    const matchesText =
      !query ||
      normalizeText(employee.nome).includes(query) ||
      normalizeText(employee.cargo).includes(query);
    const matchesStatus = state.status === "TODOS" || employee.status === state.status;
    return matchesText && matchesStatus;
  });
}

function renderStats() {
  const count = (status) => state.employees.filter((item) => item.status === status).length;
  elements.stats.total.textContent = state.employees.length;
  elements.stats.analysis.textContent = count("EM_ANALISE");
  elements.stats.approved.textContent = count("APROVADO");
  elements.stats.rejected.textContent = count("REPROVADO");
  elements.stats.hired.textContent = count("CONTRATADO");
}

function renderList() {
  const employees = filteredEmployees();
  const hasEmployees = employees.length > 0;

  elements.emptyState.hidden = hasEmployees;
  elements.tableRegion.hidden = !hasEmployees;
  elements.mobileList.hidden = !hasEmployees;
  elements.tableFooter.hidden = !hasEmployees;

  if (hasEmployees) {
    elements.tableBody.innerHTML = employees.map(tableRow).join("");
    elements.mobileList.innerHTML = employees.map(mobileCard).join("");
    const suffix = employees.length === 1 ? "candidato" : "candidatos";
    const filterSuffix = employees.length !== state.employees.length
      ? ` de ${state.employees.length} cadastrados`
      : "";
    elements.resultsSummary.textContent = `Mostrando ${employees.length} ${suffix}${filterSuffix}`;
  } else {
    elements.tableBody.innerHTML = "";
    elements.mobileList.innerHTML = "";
  }
}

function render() {
  renderStats();
  renderList();
}

function setLoading(isLoading) {
  elements.loadingState.hidden = !isLoading;
  if (isLoading) {
    elements.errorState.hidden = true;
    elements.emptyState.hidden = true;
    elements.tableRegion.hidden = true;
    elements.mobileList.hidden = true;
    elements.tableFooter.hidden = true;
  }
}

function showLoadError(error) {
  elements.loadingState.hidden = true;
  elements.errorState.hidden = false;
  elements.errorStateMessage.textContent = error.message || "Tente novamente em alguns instantes.";
}

async function loadEmployees({ quiet = false } = {}) {
  if (!quiet) setLoading(true);
  elements.errorState.hidden = true;

  try {
    const response = await api.list();
    state.employees = Array.isArray(response) ? response : [];
    render();
  } catch (error) {
    showLoadError(error);
  } finally {
    setLoading(false);
  }
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " toast--error" : ""}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.innerHTML = `<span class="toast__icon" aria-hidden="true">${type === "error" ? "!" : "✓"}</span><p>${escapeHtml(message)}</p>`;
  elements.toastRegion.appendChild(toast);
  window.setTimeout(() => toast.remove(), 4200);
}

function closeDialog(dialog) {
  if (dialog?.open) dialog.close();
}

function setButtonBusy(button, isBusy) {
  button.disabled = isBusy;
  button.classList.toggle("is-busy", isBusy);
}

function clearFormErrors() {
  elements.candidateForm.querySelectorAll("[aria-invalid='true']").forEach((input) => {
    input.removeAttribute("aria-invalid");
  });
  elements.candidateForm.querySelectorAll("[data-error-for]").forEach((message) => {
    message.textContent = "";
  });
}

function showFormErrors(details = {}) {
  Object.entries(details).forEach(([fieldName, message]) => {
    const input = elements.candidateForm.elements.namedItem(fieldName);
    if (input) input.setAttribute("aria-invalid", "true");
    const target = elements.candidateForm.querySelector(`[data-error-for="${fieldName}"]`);
    if (target) target.textContent = message;
  });
}

function employeeFromForm() {
  const data = new FormData(elements.candidateForm);
  const optionalId = String(data.get("id") || "").trim();
  return {
    ...(optionalId ? { id: Number(optionalId) } : {}),
    nome: data.get("nome"),
    email: data.get("email"),
    telefone: data.get("telefone"),
    cargo: data.get("cargo"),
    departamento: data.get("departamento"),
    salario: data.get("salario"),
    cidade: data.get("cidade"),
    status: data.get("status"),
  };
}

function openCreateDialog() {
  elements.candidateForm.reset();
  clearFormErrors();
  elements.candidateId.value = "";
  elements.manualIdField.hidden = false;
  elements.candidateDialogEyebrow.textContent = "Cadastro · POST";
  elements.candidateDialogTitle.textContent = "Novo candidato";
  elements.candidateDialogDescription.textContent = "Preencha as informações para iniciar o processo.";
  elements.candidateSubmitButton.querySelector(".button__label").textContent = "Cadastrar candidato";
  elements.candidateDialog.showModal();
  elements.candidateForm.elements.nome.focus();
}

async function openEditDialog(id) {
  try {
    const employee = await api.findById(id);
    elements.candidateForm.reset();
    clearFormErrors();
    elements.candidateId.value = employee.id;
    elements.manualIdField.hidden = true;

    ["nome", "email", "telefone", "cargo", "departamento", "salario", "cidade", "status"].forEach((field) => {
      const input = elements.candidateForm.elements.namedItem(field);
      input.value = employee[field] ?? "";
    });

    elements.candidateDialogEyebrow.textContent = "Edição completa · PUT";
    elements.candidateDialogTitle.textContent = "Editar candidato";
    elements.candidateDialogDescription.textContent = `Atualize todos os dados do cadastro #${employee.id}.`;
    elements.candidateSubmitButton.querySelector(".button__label").textContent = "Salvar edição completa";
    closeDialog(elements.detailsDialog);
    elements.candidateDialog.showModal();
    elements.candidateForm.elements.nome.focus();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function submitCandidateForm(event) {
  event.preventDefault();
  clearFormErrors();

  if (!elements.candidateForm.checkValidity()) {
    elements.candidateForm.reportValidity();
    return;
  }

  const id = elements.candidateId.value;
  setButtonBusy(elements.candidateSubmitButton, true);

  try {
    const payload = employeeFromForm();
    if (id) {
      await api.replace(id, payload);
      showToast("Cadastro atualizado completamente com sucesso.");
    } else {
      await api.create(payload);
      showToast("Candidato cadastrado com sucesso.");
    }
    closeDialog(elements.candidateDialog);
    await loadEmployees({ quiet: true });
  } catch (error) {
    if (error instanceof ApiError && error.details) showFormErrors(error.details);
    showToast(error.message || "Não foi possível salvar o candidato.", "error");
  } finally {
    setButtonBusy(elements.candidateSubmitButton, false);
  }
}

function detailsMarkup(employee) {
  return `
    <div class="details-hero">
      <span class="avatar" aria-hidden="true">${escapeHtml(initials(employee.nome))}</span>
      <div>
        <h3>${escapeHtml(employee.nome)}</h3>
        <p>ID ${escapeHtml(employee.id)} · ${escapeHtml(employee.cargo || "Cargo não informado")}</p>
        ${statusBadge(employee.status)}
      </div>
    </div>
    <div class="details-grid">
      <div class="detail-item"><small>E-mail</small><strong>${escapeHtml(employee.email || "Não informado")}</strong></div>
      <div class="detail-item"><small>Telefone</small><strong>${escapeHtml(employee.telefone || "Não informado")}</strong></div>
      <div class="detail-item"><small>Departamento</small><strong>${escapeHtml(employee.departamento || "Não informado")}</strong></div>
      <div class="detail-item"><small>Cidade</small><strong>${escapeHtml(employee.cidade || "Não informado")}</strong></div>
      <div class="detail-item"><small>Pretensão salarial</small><strong>${escapeHtml(formatCurrency(employee.salario))}</strong></div>
      <div class="detail-item"><small>Status interno</small><strong>${escapeHtml(employee.status)}</strong></div>
    </div>`;
}

async function openDetails(id) {
  try {
    const employee = await api.findById(id);
    state.selectedDetailsId = Number(employee.id);
    elements.detailsContent.innerHTML = detailsMarkup(employee);
    elements.detailsDialog.showModal();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function openPatchDialog(id) {
  try {
    const employee = await api.findById(id);
    elements.patchForm.reset();
    elements.patchId.value = employee.id;
    elements.patchCandidateName.textContent = employee.nome;
    elements.patchFormError.hidden = true;
    elements.patchFormError.textContent = "";
    elements.patchDialog.showModal();
    elements.patchForm.elements.status.focus();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function submitPatch(event) {
  event.preventDefault();
  const data = new FormData(elements.patchForm);
  const changes = {};
  const status = String(data.get("status") || "").trim();
  const cargo = String(data.get("cargo") || "").trim();
  const salary = String(data.get("salario") || "").trim();

  if (status) changes.status = status;
  if (cargo) changes.cargo = cargo;
  if (salary !== "") changes.salario = Number(salary);

  if (!Object.keys(changes).length) {
    elements.patchFormError.textContent = "Informe ao menos um campo para realizar a atualização parcial.";
    elements.patchFormError.hidden = false;
    return;
  }

  setButtonBusy(elements.patchSubmitButton, true);
  try {
    await api.patch(elements.patchId.value, changes);
    closeDialog(elements.patchDialog);
    await loadEmployees({ quiet: true });
    showToast("Atualização parcial realizada com sucesso.");
  } catch (error) {
    elements.patchFormError.textContent = error.message;
    elements.patchFormError.hidden = false;
  } finally {
    setButtonBusy(elements.patchSubmitButton, false);
  }
}

function openDeleteDialog(id) {
  const employee = state.employees.find((item) => Number(item.id) === Number(id));
  if (!employee) {
    showToast(`Candidato com ID ${id} não encontrado.`, "error");
    return;
  }
  elements.deleteId.value = employee.id;
  elements.deleteCandidateName.textContent = employee.nome;
  elements.deleteDialog.showModal();
}

async function submitDelete(event) {
  event.preventDefault();
  setButtonBusy(elements.deleteSubmitButton, true);
  try {
    await api.remove(elements.deleteId.value);
    closeDialog(elements.deleteDialog);
    await loadEmployees({ quiet: true });
    showToast("Candidato excluído com sucesso.");
  } catch (error) {
    showToast(error.message || "Não foi possível excluir o candidato.", "error");
  } finally {
    setButtonBusy(elements.deleteSubmitButton, false);
  }
}

function handleListAction(event) {
  const button = event.target.closest("[data-action][data-id]");
  if (!button) return;
  const { action, id } = button.dataset;
  if (action === "view") openDetails(id);
  if (action === "edit") openEditDialog(id);
  if (action === "patch") openPatchDialog(id);
  if (action === "delete") openDeleteDialog(id);
}

async function submitIdSearch(event) {
  event.preventDefault();
  if (!elements.idSearchForm.checkValidity()) {
    elements.idSearchForm.reportValidity();
    return;
  }
  await openDetails(elements.idSearchInput.value);
}

function formatPhone(event) {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) event.target.value = digits;
  else if (digits.length <= 6) event.target.value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  else if (digits.length <= 10) {
    event.target.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else {
    event.target.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
}

function bindEvents() {
  elements.newCandidateButton.addEventListener("click", openCreateDialog);
  elements.candidateForm.addEventListener("submit", submitCandidateForm);
  elements.patchForm.addEventListener("submit", submitPatch);
  elements.deleteForm.addEventListener("submit", submitDelete);
  elements.idSearchForm.addEventListener("submit", submitIdSearch);
  elements.retryButton.addEventListener("click", () => loadEmployees());
  elements.tableBody.addEventListener("click", handleListAction);
  elements.mobileList.addEventListener("click", handleListAction);

  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value;
    renderList();
  });

  elements.statusFilter.addEventListener("change", (event) => {
    state.status = event.target.value;
    renderList();
  });

  elements.clearFiltersButton.addEventListener("click", () => {
    state.search = "";
    state.status = "TODOS";
    elements.searchInput.value = "";
    elements.statusFilter.value = "TODOS";
    renderList();
    elements.searchInput.focus();
  });

  elements.detailsEditButton.addEventListener("click", () => {
    if (state.selectedDetailsId) openEditDialog(state.selectedDetailsId);
  });

  elements.candidateForm.elements.telefone.addEventListener("input", formatPhone);

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
      closeDialog(document.querySelector(`#${button.dataset.closeDialog}`));
    });
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("is-active"));
      link.classList.add("is-active");
    });
  });

  if (api.mode === "mock") {
    elements.resetDataButton.addEventListener("click", async () => {
      await api.reset();
      state.search = "";
      state.status = "TODOS";
      elements.searchInput.value = "";
      elements.statusFilter.value = "TODOS";
      await loadEmployees();
      showToast("Dados de demonstração restaurados.");
    });
  }
}

function initializeModeIndicator() {
  const isMock = api.mode === "mock";
  elements.dataSourceLabel.textContent = isMock ? "Demonstração local" : "API Spring Boot";
  elements.resetDataButton.hidden = !isMock;
}

bindEvents();
initializeModeIndicator();
loadEmployees();
