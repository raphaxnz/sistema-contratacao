package com.exemplo.funcionarios.service;

import com.exemplo.funcionarios.exception.FuncionarioJaExisteException;
import com.exemplo.funcionarios.exception.FuncionarioNaoEncontradoException;
import com.exemplo.funcionarios.model.Funcionario;
import com.exemplo.funcionarios.model.StatusFuncionario;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class FuncionariosServiceTests {
    private FuncionariosService service;

    @BeforeEach
    void preparar() {
        service = new FuncionariosService();
    }

    @Test
    void deveExecutarCrudCompleto() {
        Funcionario funcionario = funcionario(1L, "Ana", "Desenvolvedora", StatusFuncionario.EM_ANALISE);
        service.cadastrar(funcionario);
        assertEquals(funcionario, service.buscarPorId(1L));

        Funcionario novosDados = funcionario(999L, "Ana Souza", "Tech Lead", StatusFuncionario.APROVADO);
        Funcionario atualizado = service.atualizar(1L, novosDados);
        assertEquals(1L, atualizado.getId());
        assertEquals("Ana Souza", atualizado.getNome());

        service.atualizarParcialmente(1L, Map.of(
                "cargo", "Gerente", "status", "CONTRATADO", "salario", 9000));
        assertEquals("Gerente", service.buscarPorId(1L).getCargo());
        assertEquals(StatusFuncionario.CONTRATADO, service.buscarPorId(1L).getStatus());

        service.deletar(1L);
        try {
            service.buscarPorId(1L);
            fail("Era esperado um erro para o ID excluído.");
        } catch (FuncionarioNaoEncontradoException exception) {
            assertEquals("Funcionário com id 1 não encontrado.", exception.getMessage());
        }
    }

    @Test
    void deveImpedirIdDuplicadoEFiltrarResultados() {
        service.cadastrar(funcionario(1L, "Ana Souza", "Desenvolvedora", StatusFuncionario.APROVADO));
        service.cadastrar(funcionario(2L, "Bruno Lima", "Analista", StatusFuncionario.EM_ANALISE));

        try {
            service.cadastrar(funcionario(1L, "Outra pessoa", "QA", StatusFuncionario.REPROVADO));
            fail("Era esperado um erro para o ID duplicado.");
        } catch (FuncionarioJaExisteException exception) {
            assertEquals("Já existe um funcionário com o id 1.", exception.getMessage());
        }
        assertEquals(1, service.listarTodos("ana", null, null).size());
        assertEquals(1, service.listarTodos(null, "analista", null).size());
        assertEquals(1, service.listarTodos(null, null, StatusFuncionario.APROVADO).size());
        assertEquals(2L, service.obterIndicadores().get("total"));
        assertEquals(1L, service.obterIndicadores().get("APROVADO"));
    }

    @Test
    void patchDeveRecusarCampoNaoPermitido() {
        service.cadastrar(funcionario(1L, "Ana", "Desenvolvedora", StatusFuncionario.EM_ANALISE));
        try {
            service.atualizarParcialmente(1L, Map.of("nome", "Nome alterado"));
            fail("Era esperado um erro para o campo não permitido.");
        } catch (IllegalArgumentException exception) {
            assertTrue(exception.getMessage().contains("Campo não permitido"));
        }
    }

    private Funcionario funcionario(Long id, String nome, String cargo, StatusFuncionario status) {
        return new Funcionario(id, nome, nome.toLowerCase().replace(" ", ".") + "@email.com",
                "11999999999", cargo, "Tecnologia", 5000.0, "São Paulo", status);
    }
}
