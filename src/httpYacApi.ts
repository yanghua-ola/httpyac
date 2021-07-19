import { initHttpClient, log } from './io';
import * as models from './models';
import * as utils from './utils';
import { defaultVariableProviders } from './variables/provider';
import { default as chalk } from 'chalk';


/**
   * process one httpRegion of HttpFile
   * @param httpFile httpFile
   */
export async function send(context: models.SendContext): Promise<boolean> {
  let result = false;
  if (utils.isHttpRegionSendContext(context)) {
    result = await sendHttpRegion(context);
  } else if (utils.isHttpRegionsSendContext(context)) {
    result = await sendHttpRegions(context);
  } else {
    result = await sendHttpFile(context);
  }
  return result;
}

async function sendHttpRegion(context: models.HttpRegionSendContext): Promise<boolean> {
  if (!context.httpRegion.metaData.disabled) {
    const processorContext = await createEmptyProcessorContext(context);
    if (await utils.executeGlobalScripts(processorContext)) {
      return await utils.processHttpRegionActions(processorContext, true);
    }
  }
  return false;
}

async function sendHttpRegions(context: models.HttpRegionsSendContext): Promise<boolean> {
  const processorContext = await createEmptyProcessorContext(context);
  if (await utils.executeGlobalScripts(processorContext)) {
    for (const httpRegion of context.httpRegions) {
      if (!httpRegion.metaData.disabled) {
        const regionProcessorContext: models.ProcessorContext = {
          ...processorContext,
          httpRegion,
        };
        if (!await utils.processHttpRegionActions(regionProcessorContext, false)) {
          return false;
        }
      }
    }
    return true;
  }
  return false;
}

async function sendHttpFile(context: models.HttpFileSendContext): Promise<boolean> {
  const processorContext = await createEmptyProcessorContext(context);
  for (const httpRegion of context.httpFile.httpRegions) {
    if (httpRegion.metaData.disabled) {
      log.debug(`${utils.getDisplayName(httpRegion)} is disabled`);
      continue;
    }
    if (httpRegion.request && context.httpRegionPredicate && !context.httpRegionPredicate(httpRegion)) {
      log.debug(`${utils.getDisplayName(httpRegion)} disabled by predicate`);
      continue;
    }
    const regionProcessorContext = {
      ...processorContext,
      httpRegion,
    };
    await utils.processHttpRegionActions(regionProcessorContext);
  }
  return true;
}


async function createEmptyProcessorContext<T extends models.VariableProviderContext>(context: T): Promise<T & {
  variables: models.Variables,
  httpClient: models.HttpClient,
}> {
  context.config = await getEnviromentConfig(context);

  log.options.level = context.config?.log?.level || models.LogLevel.warn;
  if (context.config?.log?.supportAnsiColors === false) {
    chalk.level = 0;
  }
  return Object.assign(context, {
    variables: await getVariables(context),
    httpClient: initHttpClient(context)
  });
}


async function getEnviromentConfig(context: models.VariableProviderContext) {
  const environmentConfigs : Array<models.EnvironmentConfig> = [];
  if (context.httpFile.rootDir) {
    const fileConfig = await utils.getHttpacJsonConfig(context.httpFile.rootDir);
    if (fileConfig) {
      environmentConfigs.push(fileConfig);
    }
  }
  if (context.config) {
    environmentConfigs.push(context.config);
  }

  const config = Object.assign({
    log: {
      level: models.LogLevel.warn,
      supportAnsiColors: true,
    },
    cookieJarEnabled: true,
    envDirName: 'env',
  }, ...environmentConfigs);

  showDeprectationWarning(config);
  return config;
}


function showDeprectationWarning(config: models.EnvironmentConfig) {
  const deprecated = config as {
    dotenv: unknown;
    intellij: unknown;
    httpRegionScript: unknown;
  };

  if (deprecated.dotenv) {
    log.warn('setting dotenv is deprecated. Please use envDirName instead, if needed');
  }
  if (deprecated.intellij) {
    log.warn('setting intellij is deprecated. Please use envDirName instead, if needed');
  }
  if (deprecated.httpRegionScript) {
    log.warn('setting httpRegionScript is deprecated. Please use hooks.beforeRequest instead.');
  }

}


async function getVariables(context: models.VariableProviderContext): Promise<Record<string, unknown>> {
  const variables = Object.assign({
  },
  ...(await Promise.all(
    defaultVariableProviders
      .map(variableProvider => variableProvider.getVariables(context.httpFile.activeEnvironment, context))
  )));
  log.debug(variables);
  return variables;
}


export async function getEnvironments(context: models.VariableProviderContext) : Promise<Array<string>> {
  const result: Array<string> = [];
  for (const variableProvider of context.httpFile.variableProviders) {
    if (variableProvider.getEnvironments) {
      result.push(...await variableProvider.getEnvironments(context));
    }
  }
  if (result && result.length > 0) {
    return result.reduce((prev, current) => {
      if (prev.indexOf(current) < 0) {
        prev.push(current);
      }
      return prev;
    }, [] as Array<string>).sort();
  }
  return result;
}
