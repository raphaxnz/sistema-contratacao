package com.exemplo.funcionarios.exception;

public class FuncionarioJaExisteException extends RuntimeException {
    public FuncionarioJaExisteException(Long id) {
        super("Já existe um funcionário com o id " + id + ".");
    }
}
