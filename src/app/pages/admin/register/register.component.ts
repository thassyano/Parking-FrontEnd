import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FechamentoCaixaResponse } from '../../../core/models/register/fechamento-caixa-response.model';
import { RegisterService } from '../../../core/services/register/register.service';

@Component({
  selector: 'app-register',
  imports: [CurrencyPipe, DatePipe, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent implements OnInit {
  private caixaService = inject(RegisterService);

  protected loading = signal(false);
  protected resultado = signal<FechamentoCaixaResponse | null>(null);
  protected erro = signal('');
  protected exportLoading = signal(false);

  public filtroForm = new FormGroup({
    dataInicio: new FormControl('', [Validators.required]),
    dataFim: new FormControl('', [Validators.required]),
  });

  ngOnInit() {
    const hoje = new Date();
    const dataFim = hoje.toISOString().split('T')[0];
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const dataInicio = inicioMes.toISOString().split('T')[0];

    this.filtroForm.setValue({ dataInicio, dataFim });
  }

  protected consultar() {
    if (this.filtroForm.invalid) {
      this.erro.set('Selecione as datas');
      return;
    }

    const { dataInicio, dataFim } = this.filtroForm.value;

    this.loading.set(true);
    this.erro.set('');
    this.resultado.set(null);

    this.caixaService.fechamento({ dataInicio: dataInicio!, dataFim: dataFim! }).subscribe({
      next: (data) => {
        this.resultado.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.erro.set(err.error?.message || 'Erro ao consultar caixa');
        this.loading.set(false);
      },
    });
  }

  protected exportarExcel() {
    const { dataInicio, dataFim } = this.filtroForm.value;

    this.exportLoading.set(true);
    this.caixaService.exportarExcel({ dataInicio: dataInicio!, dataFim: dataFim! }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fechamento-${dataInicio}-a-${dataFim}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.exportLoading.set(false);
      },
      error: (err) => {
        this.erro.set(err.error?.message || 'Erro ao exportar');
        this.exportLoading.set(false);
      },
    });
  }
}
