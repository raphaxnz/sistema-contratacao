const STORAGE_KEY = "talentflow.funcionarios.v1";

export const STATUSES = Object.freeze([
  "EM_ANALISE",
  "APROVADO",
  "REPROVADO",
  "CONTRATADO",
]);

const SEED_DATA = Object.freeze([
  {
    id: 1,
    nome: "Marina Almeida",
    email: "marina.almeida@email.com",
    telefone: "(11) 98765-4321",
    cargo: "Desenvolvedora Front-end",
    departamento: "Tecnologia",
    salario: 7200,
    cidade: "São Paulo - SP",
    status: "EM_ANALISE",
  },
  {
    id: 2,
    nome: "Carlos Eduardo",
    email: "carlos.eduardo@email.com",
    telefone: "(21) 99812-4400",
    cargo: "Analista de Dados",
    departamento: "Dados",
    salario: 6800,
    cidade: "Rio de Janeiro - RJ",
    status: "APROVADO",
  },
  {
    id: 3,
    nome: "Aline Ferreira",
    email: "aline.ferreira@email.com",
    telefone: "(31) 99122-8070",
    cargo: "Product Designer",
    departamento: "Produto",
    salario: 6500,
    cidade: "Belo Horizonte - MG",
    status: "CONTRATADO",
  },
  {
    id: 4,
    nome: "Rafael Santos",
    email: "rafael.santos@email.com",
    telefone: "(61) 99901-2233",
    cargo: "Desenvolvedor Back-end",
    departamento: "Tecnologia",
    salario: 7600,
    cidade: "Brasília - DF",
    status: "REPROVADO",
  },
  {
    id: 5,
    nome: "Bianca Oliveira",
    email: "bianca.oliveira@email.com",
    telefone: "(41) 98887-1122",
    cargo: "Business Partner",
    departamento: "Pessoas",
    salario: 5900,
    cidade: "Curitiba - PR",
    status: "EM_ANALISE",
  },
  {
    id: 6,
    nome: "João Henrique",
    email: "joao.henrique@email.com",
    telefone: "(85) 99761-3002",
    cargo: "Analista Financeiro",
    departamento: "Financeiro",
    salario: 5400,
    cidade: "Fortaleza - CE",
    status: "APROVADO",
  },
]);

export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalize(employee) {
  const salaryValue = employee.salario;
  const idValue = employee.id;

  return {
    ...(idValue !== undefined && idValue !== null && idValue !== ""
      ? { id: Number(idValue) }
      : {}),
    nome: String(employee.nome ?? "").trim(),
    email: String(employee.email ?? "").trim().toLowerCase(),
    telefone: String(employee.telefone ?? "").trim(),
    cargo: String(employee.cargo ?? "").trim(),
    departamento: String(employee.departamento ?? "").trim(),
    salario:
      salaryValue === undefined || salaryValue === null || salaryValue === ""
        ? null
        : Number(salaryValue),
    cidade: String(employee.cidade ?? "").trim(),
    status: String(employee.status || "EM_ANALISE").trim(),
  };
}

function validate(employee) {
  const errors = {};

  if (!employee.nome) errors.nome = "Informe o nome do candidato.";
  if (!employee.email) errors.email = "Informe o e-mail do candidato.";
  if (employee.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
    errors.email = "Informe um e-mail válido.";
  }
  if (!employee.cargo) errors.cargo = "Informe o cargo pretendido.";
  if (!STATUSES.includes(employee.status)) errors.status = "Status inválido.";
  if (employee.salario !== null && (!Number.isFinite(employee.salario) || employee.salario < 0)) {
    errors.salario = "O salário não pode ser negativo.";
  }
  if (employee.id !== undefined && (!Number.isInteger(employee.id) || employee.id < 1)) {
    errors.id = "O ID deve ser um número inteiro positivo.";
  }

  if (Object.keys(errors).length) {
    throw new ApiError("Revise os campos informados.", 400, errors);
  }
}

const wait = (milliseconds = 180) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

class MockFuncionariosApi {
  constructor() {
    this.mode = "mock";
    this.#ensureSeed();
  }

  #ensureSeed() {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    }
  }

  #read() {
    this.#ensureSeed();
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  }

  #write(employees) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  }

  async list() {
    await wait();
    return copy(this.#read().sort((a, b) => Number(a.id) - Number(b.id)));
  }

  async findById(id) {
    await wait(120);
    const employee = this.#read().find((item) => Number(item.id) === Number(id));
    if (!employee) throw new ApiError(`Candidato com ID ${id} não encontrado.`, 404);
    return copy(employee);
  }

  async create(payload) {
    await wait(220);
    const employees = this.#read();
    const employee = normalize(payload);

    if (employee.id === undefined) {
      employee.id = employees.length
        ? Math.max(...employees.map((item) => Number(item.id))) + 1
        : 1;
    }

    validate(employee);
    if (employees.some((item) => Number(item.id) === employee.id)) {
      throw new ApiError(`O ID ${employee.id} já está em uso.`, 409, {
        id: "Escolha outro ID ou deixe o campo vazio.",
      });
    }

    employees.push(employee);
    this.#write(employees);
    return copy(employee);
  }

  async replace(id, payload) {
    await wait(220);
    const employees = this.#read();
    const index = employees.findIndex((item) => Number(item.id) === Number(id));
    if (index < 0) throw new ApiError(`Candidato com ID ${id} não encontrado.`, 404);

    const employee = normalize({ ...payload, id: Number(id) });
    validate(employee);
    employees[index] = employee;
    this.#write(employees);
    return copy(employee);
  }

  async patch(id, changes) {
    await wait(200);
    const employees = this.#read();
    const index = employees.findIndex((item) => Number(item.id) === Number(id));
    if (index < 0) throw new ApiError(`Candidato com ID ${id} não encontrado.`, 404);

    const allowedChanges = {};
    if (changes.cargo !== undefined) allowedChanges.cargo = String(changes.cargo).trim();
    if (changes.status !== undefined) allowedChanges.status = String(changes.status).trim();
    if (changes.salario !== undefined) allowedChanges.salario = Number(changes.salario);

    const employee = normalize({ ...employees[index], ...allowedChanges, id: Number(id) });
    validate(employee);
    employees[index] = employee;
    this.#write(employees);
    return copy(employee);
  }

  async remove(id) {
    await wait(190);
    const employees = this.#read();
    const index = employees.findIndex((item) => Number(item.id) === Number(id));
    if (index < 0) throw new ApiError(`Candidato com ID ${id} não encontrado.`, 404);
    employees.splice(index, 1);
    this.#write(employees);
    return null;
  }

  async reset() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    await wait(120);
  }
}

class HttpFuncionariosApi {
  constructor(baseUrl) {
    this.mode = "api";
    this.baseUrl = String(baseUrl || "/api").replace(/\/$/, "");
  }

  async #request(path, options = {}) {
    let response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
      });
    } catch {
      throw new ApiError("A API não está acessível. Confirme se o back-end está em execução.", 0);
    }

    const rawBody = response.status === 204 ? "" : await response.text();
    let body = null;
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = rawBody;
      }
    }

    if (!response.ok) {
      const message =
        body?.message || body?.mensagem ||
        (typeof body === "string" ? body : `A API retornou o erro ${response.status}.`);
      throw new ApiError(message, response.status, body?.errors || body?.erros || null);
    }

    return body;
  }

  list() {
    return this.#request("/funcionarios");
  }

  findById(id) {
    return this.#request(`/funcionarios/${encodeURIComponent(id)}`);
  }

  create(employee) {
    return this.#request("/funcionarios", {
      method: "POST",
      body: JSON.stringify(normalize(employee)),
    });
  }

  replace(id, employee) {
    return this.#request(`/funcionarios/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(normalize({ ...employee, id: Number(id) })),
    });
  }

  patch(id, changes) {
    return this.#request(`/funcionarios/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
  }

  remove(id) {
    return this.#request(`/funcionarios/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }
}

export function createFuncionariosApi(config = {}) {
  const requestedMode = String(config.mode || "mock").toLowerCase();
  return requestedMode === "api"
    ? new HttpFuncionariosApi(config.apiBaseUrl)
    : new MockFuncionariosApi();
}
