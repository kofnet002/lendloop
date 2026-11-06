export {};

declare global {
  interface Window {
    Clerk: {
      loaded: boolean;
      signOut(): Promise<void>;
      setActive(params: { session: string | null }): Promise<void>;
      client?: {
        signIn: {
          create(params: { strategy: "ticket"; ticket: string }): Promise<{
            createdSessionId: string | null;
          }>;
        };
      };
    };
  }
}
