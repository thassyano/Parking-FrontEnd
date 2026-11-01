import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ItemCatalogo } from '../../core/models/veiculo/veiculo-catalogo.model';
import { VeiculoCatalogoService } from '../../core/services/veiculo/veiculo-catalogo.service';

/**
 * Dropdowns de marca, modelo e cor (obrigatórios).
 * O FormGroup recebido precisa ter os controles `marcaVeiculo`, `modeloVeiculo` e `corVeiculo`;
 * eles guardam o NOME escolhido (é o que vai para a reserva).
 * Se a lista de marcas não carregar, os campos viram texto livre para não travar o atendimento.
 */
@Component({
  selector: 'app-veiculo-fields',
  imports: [ReactiveFormsModule],
  templateUrl: './veiculo-fields.component.html',
  styleUrl: './veiculo-fields.component.css',
})
export class VeiculoFieldsComponent {
  private readonly catalogo = inject(VeiculoCatalogoService);

  public readonly group = input.required<FormGroup>();

  protected readonly marcas = signal<ItemCatalogo[]>([]);
  protected readonly modelos = signal<ItemCatalogo[]>([]);
  protected readonly cores = signal<string[]>([]);
  protected readonly carregado = signal(false);
  protected readonly modelosLoading = signal(false);

  /** Sem lista de marcas, cai para digitação livre. */
  protected readonly textoLivre = computed(() => this.carregado() && this.marcas().length === 0);

  constructor() {
    this.catalogo.cores().subscribe((cores) => this.cores.set(cores));
    this.catalogo.marcas().subscribe((marcas) => {
      this.marcas.set(marcas);
      this.carregado.set(true);
      this.carregarModelosDaMarcaAtual();
    });

    // Reage a valores preenchidos de fora (ex.: edição de uma reserva existente).
    effect(() => {
      this.group();
      if (this.carregado()) this.carregarModelosDaMarcaAtual();
    });
  }

  /** Lista de opções incluindo o valor atual, mesmo que não exista no catálogo (reservas antigas). */
  protected opcoes(lista: string[], atual: string | null | undefined): string[] {
    return atual && !lista.includes(atual) ? [atual, ...lista] : lista;
  }

  protected nomesMarcas(): string[] {
    return this.marcas().map((m) => m.nome);
  }

  protected nomesModelos(): string[] {
    return this.modelos().map((m) => m.nome);
  }

  protected valor(campo: string): string {
    return this.group().get(campo)?.value ?? '';
  }

  protected onMarca(nome: string): void {
    const g = this.group();
    g.get('marcaVeiculo')!.setValue(nome);
    g.get('marcaVeiculo')!.markAsTouched();
    g.get('modeloVeiculo')!.setValue('');
    this.carregarModelosDaMarcaAtual();
  }

  protected set(campo: string, valor: string): void {
    const ctrl = this.group().get(campo)!;
    ctrl.setValue(valor);
    ctrl.markAsTouched();
  }

  protected erro(campo: string): boolean {
    const ctrl = this.group().get(campo);
    return !!ctrl && ctrl.invalid && ctrl.touched;
  }

  private carregarModelosDaMarcaAtual(): void {
    const nome = this.valor('marcaVeiculo');
    const marca = this.marcas().find((m) => m.nome === nome);

    if (!marca) {
      this.modelos.set([]);
      return;
    }

    this.modelosLoading.set(true);
    this.catalogo.modelos(marca.codigo).subscribe((modelos) => {
      this.modelos.set(modelos);
      this.modelosLoading.set(false);
    });
  }
}
