import { ViewportScroller } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Preco } from '../../../core/models/precos/preco.model';
import { PrecoService } from '../../../core/services/preco/preco.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { scrollToTop } from '../../../core/utils/viewport/scroll-to-top';

@Component({
  selector: 'app-pricing',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css',
})
export class PricingComponent implements OnInit {
  private readonly precoService = inject(PrecoService);
  private readonly scroller = inject(ViewportScroller);

  private erroTimeoutId: any;
  private sucessoTimeoutId: any;

  public precosAtivos = signal<Preco[]>([]);
  public todosPrecos = signal<Preco[]>([]);
  public loading = signal(true);
  public showForm = signal(false);
  public showHistorico = signal(false);
  public formLoading = signal(false);
  public erro = signal('');
  public sucesso = signal('');

  public historicoOrdenado = computed(() => {
    return [...this.todosPrecos()].sort((a, b) => {
      if (a.ativo === b.ativo) return 0;
      return a.ativo ? -1 : 1;
    });
  });

  public precoAtualCarregado = signal<Preco | null>(null);
  public carregandoPrecoAtual = signal(false);

  public precoForm = new FormGroup({
    tipoVaga: new FormControl<string>('Coberta', Validators.required),
    valorDiaria: new FormControl<number>(0, [Validators.required, Validators.min(0.01)]),
    descontoPixDinheiro: new FormControl<number>(0, Validators.min(0)),
    valorHorasAdicionaisAte6h: new FormControl<number>(0, Validators.min(0)),
    valorHorasAdicionaisAte12h: new FormControl<number>(0, Validators.min(0)),
    dataInicio: new FormControl<string>('', Validators.required),
    dataFim: new FormControl<string>(''),
  });

  private getLocalDate(): string {
    const hoje = new Date();

    const timezoneOffset = hoje.getTimezoneOffset() * 60000;

    return new Date(hoje.getTime() - timezoneOffset).toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.precoForm.controls.dataInicio.setValue(this.getLocalDate());
    this.carregarPrecos();
  }

  private dispararErro(mensagem: string): void {
    this.erro.set(mensagem);
    this.sucesso.set('');
    scrollToTop(this.scroller);
    if (this.erroTimeoutId) {
      clearTimeout(this.erroTimeoutId);
    }
    this.erroTimeoutId = setTimeout(() => {
      this.erro.set('');
      this.erroTimeoutId = null;
    }, 6000);
  }
  private dispararSucesso(mensagem: string): void {
    this.sucesso.set(mensagem);
    this.erro.set('');
    scrollToTop(this.scroller);
    if (this.sucessoTimeoutId) {
      clearTimeout(this.sucessoTimeoutId);
    }
    this.sucessoTimeoutId = setTimeout(() => {
      this.sucesso.set('');
      this.sucessoTimeoutId = null;
    }, 6000);
  }

  public carregarPrecos(): void {
    this.loading.set(true);
    this.precoService.listarAtivos().subscribe({
      next: (data) => {
        this.precosAtivos.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  public carregarHistorico(): void {
    this.precoService.listarTodos().subscribe({
      next: (data) => {
        this.todosPrecos.set(data);
        this.showHistorico.set(true);
      },
      error: (err) => this.dispararErro(err.error?.message || 'Erro ao carregar histórico'),
    });

    if (this.showForm()) {
      setTimeout(() => {
        document.getElementById('historico_header')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 200);
    }
  }

  public criarPreco(): void {
    this.erro.set('');
    this.sucesso.set('');

    if (this.precoForm.invalid) {
      this.precoForm.markAllAsTouched();

      if (this.precoForm.controls.valorDiaria.errors?.['min']) {
        this.dispararErro('Valor da diária deve ser maior que zero');
      } else if (this.precoForm.controls.descontoPixDinheiro.errors?.['min']) {
        this.dispararErro('Desconto não pode ser um número negativo');
      } else {
        this.dispararErro('Preencha todos os campos obrigatórios');
      }
      return;
    }

    const { dataInicio, dataFim, tipoVaga, valorDiaria, descontoPixDinheiro, valorHorasAdicionaisAte6h, valorHorasAdicionaisAte12h } =
      this.precoForm.value;

    if (dataFim && dataFim <= dataInicio!) {
      this.dispararErro('A data fim deve ser posterior à data de início');
      return;
    }

    const precoAtual = this.precosAtivos().find((p) => p.tipoVaga === tipoVaga);
    if (precoAtual && precoAtual.valorDiaria === valorDiaria) {
      this.dispararErro(`Este valor já está em vigência.`);
      this.precoFormReset();
      return;
    }

    this.formLoading.set(true);

    this.precoService
      .criar({
        tipoVaga: tipoVaga!,
        valorDiaria: valorDiaria!,
        descontoPixDinheiro: descontoPixDinheiro ?? 0,
        valorHorasAdicionaisAte6h: valorHorasAdicionaisAte6h ?? 0,
        valorHorasAdicionaisAte12h: valorHorasAdicionaisAte12h ?? 0,
        dataInicio: dataInicio!,
        dataFim: dataFim || undefined,
      })
      .subscribe({
        next: () => {
          this.dispararSucesso('Preço criado com sucesso');
          this.showForm.set(false);
          this.precoFormReset();

          this.carregarPrecos();

          if (this.showHistorico()) {
            this.precoService.listarTodos().subscribe({
              next: (lista) => this.todosPrecos.set(lista),
              error: (err) =>
                this.dispararErro(
                  err.error?.message || 'Preço criado, mas erro ao atualizar histórico.',
                ),
            });
          }

          this.formLoading.set(false);
        },
        error: (err) => {
          this.dispararErro(err.error?.message ?? 'Erro ao criar preço');
          this.formLoading.set(false);
        },
      });
  }

  public toggleForm(): void {
    this.showForm.update((v) => !v);
    if (this.showForm()) {
      this.carregarPrecoAtualPorTipo(this.precoForm.controls.tipoVaga.value ?? 'Coberta');
    }
  }

  public onTipoVagaChange(tipo: string): void {
    this.carregarPrecoAtualPorTipo(tipo);
  }

  private carregarPrecoAtualPorTipo(tipo: string): void {
    this.carregandoPrecoAtual.set(true);
    this.precoAtualCarregado.set(null);

    this.precoService.obterPorTipo(tipo).subscribe({
      next: (preco) => {
        this.precoAtualCarregado.set(preco);
        this.precoForm.patchValue({
          valorDiaria: preco.valorDiaria,
          descontoPixDinheiro: preco.descontoPixDinheiro,
          valorHorasAdicionaisAte6h: preco.valorHorasAdicionaisAte6h,
          valorHorasAdicionaisAte12h: preco.valorHorasAdicionaisAte12h,
        });
        this.carregandoPrecoAtual.set(false);
      },
      error: () => {
        // Nenhum preço ativo para esse tipo — mantém os campos em branco
        this.precoAtualCarregado.set(null);
        this.carregandoPrecoAtual.set(false);
      },
    });
  }

  private precoFormReset(): void {
    this.precoForm.reset({
      tipoVaga: 'Coberta',
      valorDiaria: 0,
      descontoPixDinheiro: 0,
      valorHorasAdicionaisAte6h: 0,
      valorHorasAdicionaisAte12h: 0,
      dataInicio: this.getLocalDate(),
      dataFim: '',
    });
  }
}
