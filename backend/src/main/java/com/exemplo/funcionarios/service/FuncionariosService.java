package com.exemplo.funcionarios.service;

import com.exemplo.funcionarios.exception.FuncionarioJaExisteException;
import com.exemplo.funcionarios.exception.FuncionarioNaoEncontradoException;
import com.exemplo.funcionarios.model.Funcionario;
import com.exemplo.funcionarios.model.StatusFuncionario;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

@Service
public class FuncionariosService {

    private final ArrayList<Funcionario> funcionarios = new ArrayList<>();

    public List<Funcionario> listarTodos(String nome, String cargo, StatusFuncionario status) {
        List<Funcionario> resultado = new ArrayList<>();

        for (Funcionario funcionario : funcionarios) {
            boolean nomeCorreto = contemIgnoreCase(funcionario.getNome(), nome);
            boolean cargoCorreto = contemIgnoreCase(funcionario.getCargo(), cargo);
            boolean statusCorreto = status == null || funcionario.getStatus() == status;

            if (nomeCorreto && cargoCorreto && statusCorreto) {
                resultado.add(funcionario);
            }
        }

        return resultado;
    }

    public Funcionario buscarPorId(Long id) {
        for (Funcionario funcionario : funcionarios) {
            if (funcionario.getId().equals(id)) {
                return funcionario;
            }
        }

        throw new FuncionarioNaoEncontradoException(id);
    }

    public Funcionario cadastrar(Funcionario funcionario) {
        if (existeId(funcionario.getId())) {
            throw new FuncionarioJaExisteException(funcionario.getId());
        }
        funcionarios.add(funcionario);
        return funcionario;
    }

    public Funcionario atualizar(Long id, Funcionario novosDados) {
        Funcionario atual = buscarPorId(id);
        atual.setNome(novosDados.getNome());
        atual.setEmail(novosDados.getEmail());
        atual.setTelefone(novosDados.getTelefone());
        atual.setCargo(novosDados.getCargo());
        atual.setDepartamento(novosDados.getDepartamento());
        atual.setSalario(novosDados.getSalario());
        atual.setCidade(novosDados.getCidade());
        atual.setStatus(novosDados.getStatus());
        return atual;
    }

    public Funcionario atualizarParcialmente(Long id, Map<String, Object> campos) {
        Funcionario funcionario = buscarPorId(id);

        for (Map.Entry<String, Object> item : campos.entrySet()) {
            String campo = item.getKey();
            Object valor = item.getValue();

            if (campo.equals("cargo")) {
                funcionario.setCargo(textoObrigatorio(valor, "cargo"));
            } else if (campo.equals("status")) {
                funcionario.setStatus(converterStatus(valor));
            } else if (campo.equals("salario")) {
                funcionario.setSalario(converterSalario(valor));
            } else {
                throw new IllegalArgumentException(
                        "Campo não permitido no PATCH: " + campo + ". Use cargo, status ou salario.");
            }
        }

        return funcionario;
    }

    public void deletar(Long id) {
        funcionarios.remove(buscarPorId(id));
    }

    public Map<String, Long> obterIndicadores() {
        Map<String, Long> indicadores = new LinkedHashMap<>();
        indicadores.put("total", (long) funcionarios.size());
        for (StatusFuncionario status : StatusFuncionario.values()) {
            long quantidade = 0;

            for (Funcionario funcionario : funcionarios) {
                if (funcionario.getStatus() == status) {
                    quantidade++;
                }
            }

            indicadores.put(status.name(), quantidade);
        }
        return indicadores;
    }

    private boolean existeId(Long id) {
        for (Funcionario funcionario : funcionarios) {
            if (funcionario.getId().equals(id)) {
                return true;
            }
        }

        return false;
    }

    private boolean contemIgnoreCase(String valor, String filtro) {
        return filtro == null || filtro.isBlank()
                || valor != null && valor.toLowerCase().contains(filtro.toLowerCase());
    }

    private String textoObrigatorio(Object valor, String campo) {
        if (valor == null) {
            throw new IllegalArgumentException("O campo " + campo + " deve ser um texto preenchido.");
        }

        String texto = valor.toString();
        if (texto.isBlank()) {
            throw new IllegalArgumentException("O campo " + campo + " deve ser um texto preenchido.");
        }

        return texto;
    }

    private StatusFuncionario converterStatus(Object valor) {
        try {
            return StatusFuncionario.valueOf(textoObrigatorio(valor, "status").toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException(
                    "Status inválido. Use EM_ANALISE, APROVADO, REPROVADO ou CONTRATADO.");
        }
    }

    private Double converterSalario(Object valor) {
        if (valor == null) {
            throw new IllegalArgumentException("O salário deve ser um número maior ou igual a zero.");
        }

        double numero;

        try {
            numero = Double.parseDouble(valor.toString());
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("O salário deve ser um número maior ou igual a zero.");
        }

        if (numero < 0) {
            throw new IllegalArgumentException("O salário deve ser um número maior ou igual a zero.");
        }

        return numero;
    }
}
