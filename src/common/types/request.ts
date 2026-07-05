import { Request } from 'express';

export type NivelAcesso = 'admin' | 'colaborador';
export type TelaSistema =
  | 'dashboard'
  | 'mapa'
  | 'comandas'
  | 'mesas'
  | 'clientes'
  | 'pedidos'
  | 'caixa'
  | 'cardapio'
  | 'estoque'
  | 'relatorios'
  | 'configuracoes'
  | 'colaboradores';

export interface RequestUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  providerId?: string;
  companyId: string;
  tenantId: string;
  membershipId: string;
  role: NivelAcesso;
  permissoes: Array<{ tela: TelaSistema; leitura: boolean; escrita: boolean }>;
}

export interface AuthenticatedRequest extends Request {
  user: RequestUser;
  tenantId: string;
  companyId: string;
}
