import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Activas: undefined;
  Historial: undefined;
  Perfil: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  CreateRaffle: undefined;
  JoinRaffle: undefined;
  RaffleDetail: { raffleId: string };
};
