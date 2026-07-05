import { NivelAcesso, TelaSistema } from '../../common/types/request';

export interface PermissaoTela {
  tela: TelaSistema;
  leitura: boolean;
  escrita: boolean;
}

export const telasSistema: TelaSistema[] = [
  'dashboard',
  'mapa',
  'comandas',
  'mesas',
  'clientes',
  'pedidos',
  'caixa',
  'cardapio',
  'estoque',
  'relatorios',
  'configuracoes',
  'colaboradores',
];

export function createFullPermissoes(): PermissaoTela[] {
  return telasSistema.map((tela) => ({ tela, leitura: true, escrita: true }));
}

export function normalizePermissoes(permissoes: PermissaoTela[] = [], role: NivelAcesso): PermissaoTela[] {
  if (role === 'admin') {
    return createFullPermissoes();
  }

  return telasSistema.map((tela) => {
    const current = permissoes.find((permissao) => permissao.tela === tela);
    const leitura = Boolean(current?.leitura);
    const escrita = leitura && Boolean(current?.escrita);
    return { tela, leitura, escrita };
  });
}
