package com.exemplo.funcionarios.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
@Getter
@Setter
@AllArgsConstructor
public class Funcionario {


    private Long id;
    private String nome;
    private String email;
    private String telefone;
    private String cargo;
    private String departamento;
    private Double salario;
    private String cidade;
    private String status;






}
