import type { ProxyConfig as ProxySettings } from '../models/ScannerConfig';

export function resolveProxyConfig(configProxy?: ProxySettings, env = process.env): ProxySettings | undefined {
  const resolved: ProxySettings = {
    httpProxy: configProxy?.httpProxy ?? env.HTTP_PROXY ?? env.http_proxy,
    httpsProxy: configProxy?.httpsProxy ?? env.HTTPS_PROXY ?? env.https_proxy,
    noProxy: configProxy?.noProxy ?? env.NO_PROXY ?? env.no_proxy
  };

  return resolved.httpProxy || resolved.httpsProxy || resolved.noProxy ? resolved : undefined;
}
