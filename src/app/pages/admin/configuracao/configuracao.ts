import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfiguracaoService } from '../../../core/services/configuracao.service';
import { Configuracao } from '../../../core/models/configuracao.model';

@Component({
  selector: 'app-configuracao',
  imports: [FormsModule],
  templateUrl: './configuracao.html',
})
export class ConfiguracaoPage implements OnInit {
  config = signal<Configuracao | null>(null);
  loading = signal(true);
  saving = signal(false);
  erro = signal('');
  sucesso = signal('');

  nomeEstacionamento = '';
  endereco = '';
  contato = '';
  cnpj = '';
  totalVagasCoberta = 0;
  totalVagasDescoberta = 0;
  telefoneWhatsApp = '';
  mensagemWhatsApp = '';
  horasAntecedenciaConfirmacao = 0;

  constructor(private configuracaoService: ConfiguracaoService) {}

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.loading.set(true);
    this.configuracaoService.obter().subscribe({
      next: (data) => {
        this.config.set(data);
        this.nomeEstacionamento = data.nomeEstacionamento;
        this.endereco = data.endereco || '';
        this.contato = data.contato || '';
        this.cnpj = data.cnpj || '';
        this.totalVagasCoberta = data.totalVagasCoberta;
        this.totalVagasDescoberta = data.totalVagasDescoberta;
        this.telefoneWhatsApp = data.telefoneWhatsApp || '';
        this.mensagemWhatsApp = data.mensagemWhatsApp || '';
        this.horasAntecedenciaConfirmacao = data.horasAntecedenciaConfirmacao;
        this.loading.set(false);
      },
      error: (err) => {
        this.erro.set(err.error?.message || 'Erro ao carregar configuracao');
        this.loading.set(false);
      },
    });
  }

  salvar() {
    this.saving.set(true);
    this.erro.set('');
    this.sucesso.set('');

    this.configuracaoService
      .atualizar({
        nomeEstacionamento: this.nomeEstacionamento,
        endereco: this.endereco || undefined,
        contato: this.contato || undefined,
        cnpj: this.cnpj || undefined,
        totalVagasCoberta: this.totalVagasCoberta,
        totalVagasDescoberta: this.totalVagasDescoberta,
        telefoneWhatsApp: this.telefoneWhatsApp || undefined,
        mensagemWhatsApp: this.mensagemWhatsApp || undefined,
        horasAntecedenciaConfirmacao: this.horasAntecedenciaConfirmacao,
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
