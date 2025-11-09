# Lógica de Funcionalidades — Dev Planner

Este documento descreve a **lógica principal de movimentação e finalização de tarefas** no sistema *Dev Planner*, utilizando pseudocódigo em português estruturado.  

---

## 1) Pseudocódigo — Mover Card de “Fazendo” para “Feito”

```plaintext
INÍCIO MOVIMENTAÇÃO POR ARRASTAR
  AO SOLTAR_CARD_EM_COLUNA (evento drop)
    LER id_do_elemento_arrastado (ex.: "task-23")
    EXTRair id_da_tarefa = remover_prefixo("task-", id_do_elemento_arrastado)
    LER nova_coluna = id_da_coluna_do_evento (ex.: "done")

    // Otimismo visual: atualiza UI imediatamente
    MOVER o elemento do card para dentro da coluna nova_coluna

    // Persistência no backend
    ENVIAR PATCH para /api/tasks/{id_da_tarefa}/status com corpo { status: nova_coluna }

    SE resposta_da_API for SUCESSO ENTÃO
       // Nada a fazer: UI já está correta
       TERMINAR
    SENÃO
       // Falhou: volta ao estado consistente
       RECARREGAR as tarefas do servidor (fetchTasksFromAPI)
       EXIBIR mensagem "Não foi possível mover a tarefa agora."
    FIM SE
  FIM EVENTO
FIM MOVIMENTAÇÃO POR ARRASTAR
```

---

## 2) Pseudocódigo — Finalizar Tarefa no Modal

```plaintext
INÍCIO FINALIZAR_TAREFA
  REQUER que exista editTaskId (id da tarefa que está sendo editada)

  ENVIAR PATCH para /api/tasks/{editTaskId}/status com corpo { status: "done" }

  SE resposta_da_API for SUCESSO ENTÃO
     REMOVER da UI o card com id "task-{editTaskId}"  // some do quadro
     LIMPAR editTaskId
     FECHAR modal
     // Histórico buscará as concluídas quando aberto
  SENÃO
     EXIBIR mensagem "Falha ao finalizar a tarefa."
  FIM SE
FIM FINALIZAR_TAREFA
```

---

## Observações Gerais

- A movimentação entre colunas segue o princípio de **otimismo visual**: o frontend atualiza a interface antes da confirmação do servidor.
- Caso o backend retorne erro, a aplicação restaura o estado anterior para manter **consistência visual e lógica**.
- Todas as operações utilizam a rota `/api/tasks/{id}/status` com o método **PATCH**, respeitando o padrão REST.

---


