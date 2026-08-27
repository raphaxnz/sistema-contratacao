package com.exemplo.funcionarios.exception;

public class FuncionarioNaoEncontradoException extends RuntimeException {
    public FuncionarioNaoEncontradoException(Long id) {
        super("Funcionário com id " + id + " não encontrado.");
    }
}
