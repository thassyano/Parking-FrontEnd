import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { LogAtividadeService } from '../../../core/services/logs/log-atividade.service';
import {
  ACAO_LABELS,
  LogAtividade,
  ORIGEM_LABELS,
} from '../../../core/models/admin-config/log-atividade.model';

@Component({
  selector: 'app-activity-logs',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './activity-logs.component.html',
  styleUrl: './activity-logs.component.css',
})
export class ActivityLogsComponent {
  protected logs = signal<LogAtividade[]>([]);
  protected acoes = signal<string[]>([]);
  protected origens = signal<string[]>([]);
  protected loading = signal(true);
  protected erro = signal('');
  protected total = signal(0);
  protected pagina = signal(1);
  protected totalPaginas = signal(0);

  protected readonly acaoLabels = ACAO_LABELS;
  protected readonly origemLabels = ORIGEM_LABELS;

  protected filtrosForm = new FormGroup({
    dataInicio: new FormControl(''),
    dataFim: new FormControl(''),
    acao: new FormControl(''),
    adminUsuario: new FormControl(''),
    origem: new FormControl(''),
    sucesso: new FormControl(''),
  });

  private logService = inject(LogAtividadeService);

  ngOnInit(): void {
    this.logService.listarAcoes().subscribe({
      next: (acoes) => this.acoes.set(acoes),
      error: () => this.acoes.set(Object.keys(ACAO_LABELS)),
    });

    this.logService.listarOrigens().subscribe({
      next: (origens) => this.origens.set(origens),
      error: () => this.origens.set(Object.keys(ORIGEM_LABELS)),
    });

    this.carregar();
  }

  protected carregar(pagina = 1): void {
    this.loading.set(true);
    this.erro.set('');
    this.pagina.set(pagina);

    const v = this.filtrosForm.value;
    const sucesso =
      v.sucesso === '' || v.sucesso === null || v.sucesso === undefined
        ? undefined
        : v.sucesso === 'true';

    this.logService
      .listar({
        dataInicio: v.dataInicio || undefined,
        dataFim: v.dataFim || undefined,
        acao: v.acao || undefined,
        adminUsuario: v.adminUsuario?.trim() || undefined,
        origem: v.origem || undefined,
        sucesso,
        pagina,
        tamanhoPagina: 30,
      })
      .subscribe({
        next: (resultado) => {
          this.logs.set(resultado.itens);
          this.total.set(resultado.total);
          this.totalPaginas.set(resultado.totalPaginas);
          this.loading.set(false);
        },
        error: () => {
          this.erro.set('Erro ao carregar atividades');
          this.loading.set(false);
        },
      });
  }

  protected aplicarFiltros(): void {
    this.carregar(1);
  }

  protected limparFiltros(): void {
    this.filtrosForm.reset({
      dataInicio: '',
      dataFim: '',
      acao: '',
      adminUsuario: '',
      origem: '',
      sucesso: '',
    });
    this.carregar(1);
  }

  protected paginaAnterior(): void {
    if (this.pagina() > 1) this.carregar(this.pagina() - 1);
  }

  protected proximaPagina(): void {
    if (this.pagina() < this.totalPaginas()) this.carregar(this.pagina() + 1);
  }

  protected labelAcao(acao: string): string {
    return ACAO_LABELS[acao] ?? acao;
  }

  protected labelOrigem(origem: string): string {
    return ORIGEM_LABELS[origem] ?? origem;
  }
}
