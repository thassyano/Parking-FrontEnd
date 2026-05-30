import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Configuracao } from '../../../core/models/admin-config/configuracao.model';
import { ConfigService } from '../../../core/services/admin-config/config.service';

@Component({
  selector: 'app-configuration',
  imports: [ReactiveFormsModule],
  templateUrl: './configuration.component.html',
  styleUrl: './configuration.component.css',
})
export class ConfigurationComponent implements OnInit {
  protected config = signal<Configuracao | null>(null);
  protected loading = signal(true);
  protected saving = signal(false);
  protected erro = signal('');
  protected sucesso = signal('');

  private configuracaoService = inject(ConfigService);

  public configForm = new FormGroup({
    nomeEstacionamento: new FormControl('', [Validators.required, Validators.maxLength(100)]),
    endereco: new FormControl(''),
    contato: new FormControl(''),
    cnpj: new FormControl(''),
    totalVagasCoberta: new FormControl(0, [Validators.required, Validators.min(0)]),
    totalVagasDescoberta: new FormControl(0, [Validators.required, Validators.min(0)]),
    telefoneWhatsApp: new FormControl(''),
    horasAntecedenciaConfirmacao: new FormControl(0, [Validators.required, Validators.min(0)]),
  });

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.loading.set(true);
    this.configuracaoService.obter().subscribe({
      next: (data) => {
        this.config.set(data);
        this.configForm.setValue({
          nomeEstacionamento: data.nomeEstacionamento,
          endereco: data.endereco || '',
          contato: data.contato || '',
          cnpj: data.cnpj || '',
          totalVagasCoberta: data.totalVagasCoberta,
          totalVagasDescoberta: data.totalVagasDescoberta,
          telefoneWhatsApp: data.telefoneWhatsApp || '',
          horasAntecedenciaConfirmacao: data.horasAntecedenciaConfirmacao,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.erro.set(err.error?.message || 'Erro ao carregar configuracao');
        this.loading.set(false);
      },
    });
  }

  salvar() {
    if (this.configForm.invalid) {
      this.erro.set('Preencha os campos obrigatorios corretamente');
      return;
    }

    this.saving.set(true);
    this.erro.set('');
    this.sucesso.set('');

    const v = this.configForm.value;

    this.configuracaoService
      .atualizar({
        nomeEstacionamento: v.nomeEstacionamento!,
        endereco: v.endereco || undefined,
        contato: v.contato || undefined,
        cnpj: v.cnpj || undefined,
        totalVagasCoberta: v.totalVagasCoberta!,
        totalVagasDescoberta: v.totalVagasDescoberta!,
        telefoneWhatsApp: v.telefoneWhatsApp || undefined,
        horasAntecedenciaConfirmacao: v.horasAntecedenciaConfirmacao!,
      })
      .subscribe({
        next: (data) => {
          this.config.set(data);
          this.sucesso.set('Configuracao salva com sucesso');
          this.saving.set(false);
        },
        error: (err) => {
          this.erro.set(err.error?.message || 'Erro ao salvar');
          this.saving.set(false);
        },
      });
  }
}
