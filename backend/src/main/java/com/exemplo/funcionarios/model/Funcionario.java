package com.exemplo.funcionarios.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Funcionario {

    @NotNull(message = "O id é obrigatório")
    private Long id;

    @NotBlank(message = "O nome é obrigatório")
    private String nome;

    @NotBlank(message = "O e-mail é obrigatório")
    @Email(message = "Informe um e-mail válido")
    private String email;

    private String telefone;

    @NotBlank(message = "O cargo é obrigatório")
    private String cargo;

    private String departamento;

    @PositiveOrZero(message = "O salário não pode ser negativo")
    private Double salario;

    private String cidade;

    private StatusFuncionario status;
}
