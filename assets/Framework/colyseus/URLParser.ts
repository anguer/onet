type ParsedURL = {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  searchParams: string;
};

/**
 * URL 解析
 */
export function parseURL(urlString: string): ParsedURL {
  // 提取协议部分
  const protocolMatch = urlString.match(/^([a-z]+:)\/\//i);
  if (!protocolMatch) throw new Error('Invalid URL format');

  const protocol = protocolMatch[1].toLowerCase();
  const urlWithoutProtocol = urlString.replace(/^[a-z]+:\/\//i, '');

  // 提取主机部分
  const [hostPart, ...pathParts] = urlWithoutProtocol.split(/[/?#]/);
  const host = hostPart.split('@').pop() || '';

  // 分离主机名和端口
  let [hostname, port] = host.split(':');
  hostname = hostname.replace(/^\[|]$/g, ''); // 清理 IPv6 括号

  // 提取路径和查询参数
  const fullPath = pathParts.join('/');
  const [pathname, searchParams] = fullPath.split('?');

  return {
    protocol,
    hostname: hostname.toLowerCase(),
    port: port || '',
    pathname: `/${pathname || ''}`,
    searchParams: searchParams || '',
  };
}
