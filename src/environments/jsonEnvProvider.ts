import { EnvironmentProvider } from './environmentProvider';

export class JsonEnvProvider implements EnvironmentProvider{

  constructor(private readonly cache: Record<string, Record<string,any>>) { }

  async getEnvironments(): Promise<string[]> {
    return Promise.resolve(Object.entries(this.cache).map(obj => obj[0]));
  }
  async getVariables(env: string): Promise<Record<string, any>> {
    return Promise.resolve(this.cache[env]);
  }
}