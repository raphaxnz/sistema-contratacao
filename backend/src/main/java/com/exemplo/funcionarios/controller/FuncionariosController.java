package com.exemplo.funcionarios.controller;

import com.exemplo.funcionarios.model.Funcionario;
import com.exemplo.funcionarios.model.StatusFuncionario;
import com.exemplo.funcionarios.service.FuncionariosService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/funcionarios")
@CrossOrigin(origins = "*")
public class FuncionariosController {

    private final FuncionariosService service;

    public FuncionariosController(FuncionariosService service) {
        this.service = service;
    }

    @GetMapping
    public List<Funcionario> listarTodos(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String cargo,
            @RequestParam(required = false) StatusFuncionario status) {
        return service.listarTodos(nome, cargo, status);
    }

    @GetMapping("/{id}")
    public Funcionario buscarPorId(@PathVariable Long id) {
        return service.buscarPorId(id);
    }

    @GetMapping("/indicadores")
    public Map<String, Long> obterIndicadores() {
        return service.obterIndicadores();
    }

    @PostMapping
    public ResponseEntity<Funcionario> cadastrar(@Valid @RequestBody Funcionario funcionario) {
        Funcionario cadastrado = service.cadastrar(funcionario);
        return ResponseEntity.created(URI.create("/funcionarios/" + cadastrado.getId())).body(cadastrado);
    }

    @PutMapping("/{id}")
    public Funcionario atualizar(@PathVariable Long id, @Valid @RequestBody Funcionario funcionario) {
        return service.atualizar(id, funcionario);
    }

    @PatchMapping("/{id}")
    public Funcionario atualizarParcialmente(
            @PathVariable Long id,
            @RequestBody Map<String, Object> campos) {
        return service.atualizarParcialmente(id, campos);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable Long id) {
        service.deletar(id);
    }
}
