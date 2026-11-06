import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Autenticacao, Aviso, Repositorio, Usuario } from '../dados/tipos';
import type { Ocorrencia } from '../domain/ocorrencia';
import type { ProvedorLocalizacao } from '../servicos/localizacao';
import { ServicoOcorrencias } from '../servicos/ocorrencias';

export type OrigemFoto = 'camera' | 'galeria';

/** Tudo o que as telas precisam do mundo externo. No app vem do Firebase e do aparelho; nos testes, de simulações. */
export type Ambiente = {
  autenticacao: Autenticacao;
  repositorio: Repositorio;
  localizacao: ProvedorLocalizacao;
  obterFoto(origem: OrigemFoto): Promise<string | null>;
  lerFoto(uri: string): Promise<Uint8Array>;
  agora(): number;
};

type Valor = Ambiente & {
  servico: ServicoOcorrencias;
  usuario: Usuario | null;
  carregandoUsuario: boolean;
};

const Contexto = createContext<Valor | null>(null);

export function AmbienteProvider({ ambiente, children }: { ambiente: Ambiente; children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregandoUsuario, setCarregando] = useState(true);

  useEffect(
    () =>
      ambiente.autenticacao.observar((u) => {
        setUsuario(u);
        setCarregando(false);
      }),
    [ambiente.autenticacao],
  );

  const servico = useMemo(
    () => new ServicoOcorrencias(ambiente.repositorio, { lerFoto: ambiente.lerFoto, agora: ambiente.agora }),
    [ambiente],
  );

  return <Contexto.Provider value={{ ...ambiente, servico, usuario, carregandoUsuario }}>{children}</Contexto.Provider>;
}

export function useAmbiente(): Valor {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useAmbiente fora do AmbienteProvider');
  return valor;
}

/** Usuário logado. Só use dentro das telas protegidas pelo layout (app). */
export function useUsuario(): Usuario {
  const { usuario } = useAmbiente();
  if (!usuario) throw new Error('useUsuario sem usuário logado');
  return usuario;
}

/** Ocorrências do bairro em tempo real (o moderador também recebe as ocultas). */
export function useOcorrencias(): Ocorrencia[] | null {
  const { repositorio } = useAmbiente();
  const { moderador } = useUsuario();
  const [lista, setLista] = useState<Ocorrencia[] | null>(null);
  useEffect(() => repositorio.observarOcorrencias(moderador, setLista), [repositorio, moderador]);
  return lista;
}

export function useAvisos(): Aviso[] {
  const { repositorio } = useAmbiente();
  const { uid } = useUsuario();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  useEffect(() => repositorio.observarAvisos(uid, setAvisos), [repositorio, uid]);
  return avisos;
}
