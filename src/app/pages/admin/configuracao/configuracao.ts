import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfiguracaoService } from '../../../core/services/configuracao.service';
import { AtualizarConfiguracaoRequest, Configuracao } from '../../../core/models/configuracao.model';

@Component({
  selector: 'app-configuracao',
  imports: [FormsModule],
  templateUrl: './configuracao.html',
})
export class ConfiguracaoPage implements OnInit {
  config = signal<Configuracao | null>(null);
  loading = signal(true);
  saving = signal(false);
  testing = signal(false);
  erro = signal('');
  sucesso = signal('');
  testeErro = signal('');
  testeSucesso = signal('');

  nomeEstacionamento = '';
  endereco = '';
  contato = '';
  cnpj = '';
  totalVagasCoberta = 0;
  totalVagasDescoberta = 0;
  telefoneWhatsApp = '';
  mensagemWhatsApp = '';
  horasAntecedenciaConfirmacao = 0;

  evolutionApiUrl = '';
  evolutionApiKey = '';
  evolutionInstanceName = '';
  urlConfirmacaoFrontend = '';
  telefoneTeste = '';

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
        this.evolutionApiUrl = data.evolutionApiUrl || 'http://localhost:8080';
        this.evolutionInstanceName = data.evolutionInstanceName || '';
        this.urlConfirmacaoFrontend = data.urlConfirmacaoFrontend || 'http://localhost:4200';
        this.evolutionApiKey = '';
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

    const payload: AtualizarConfiguracaoRequest = {
      nomeEstacionamento: this.nomeEstacionamento,
      endereco: this.endereco || undefined,
      contato: this.contato || undefined,
      cnpj: this.cnpj || undefined,
      totalVagasCoberta: this.totalVagasCoberta,
      totalVagasDescoberta: this.totalVagasDescoberta,
      telefoneWhatsApp: this.telefoneWhatsApp || undefined,
      mensagemWhatsApp: this.mensagemWhatsApp || undefined,
      horasAntecedenciaConfirmacao: this.horasAntecedenciaConfirmacao,
      evolutionApiUrl: this.evolutionApiUrl || undefined,
      evolutionInstanceName: this.evolutionInstanceName || undefined,
      urlConfirmacaoFrontend: this.urlConfirmacaoFrontend || undefined,
    };

    if (this.evolutionApiKey.trim()) {
      payload.evolutionApiKey = this.evolutionApiKey.trim();
    }

    this.configuracaoService.atualizar(payload).subscribe({
      next: (data) => {
        this.config.set(data);
        this.evolutionApiKey = '';
        this.sucesso.set('Configuracao salva com sucesso');
        this.saving.set(false);
      },
      error: (err) => {
        this.erro.set(err.error?.message || 'Erro ao salvar');
        this.saving.set(false);
      },
    });
  }

  testarEvolution() {
    if (!this.telefoneTeste.trim()) {
      this.testeErro.set('Informe o telefone para o teste (DDD + número).');
      this.testeSucesso.set('');
      return;
    }

    this.testing.set(true);
    this.testeErro.set('');
    this.testeSucesso.set('');

    this.configuracaoService.testarEvolution(this.telefoneTeste.trim()).subscribe({
      next: (res) => {
        this.testeSucesso.set(res.message);
        this.testing.set(false);
      },
      error: (err) => {
        const evo = err.error?.evolutionErro;
        const msg = err.error?.message || 'Falha no envio de teste';
        this.testeErro.set(evo ? `${msg}\n\nEvolution: ${evo}` : msg);
        this.testing.set(false);
      },
    });
  }
}
