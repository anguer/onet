import { HttpError, RequestOptions, Http } from 'db://assets/Framework/factories/http/Http';

export class ByteDanceHttp extends Http {
  public async request<T>(path: string, options: RequestOptions): Promise<T> {
    const { method = 'GET', headers = {}, data, timeout = 10000 } = this.getOptions(options);

    return new Promise<T>(async (resolve, reject) => {
      const reqTask = tt.request({
        url: this.getHttpEndpoint(path),
        method,
        header: {
          'Content-Type': 'application/json',
          ...headers,
        },
        data,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve(res.data as T);
          } else {
            reject(new HttpError(res.statusCode, res.errMsg || 'Http Error'));
          }
        },
        fail: (e) => reject(new HttpError(e.errNo || -1, e.errMsg || 'Fetch Error')),
      });
      // 超时处理
      setTimeout(() => {
        reqTask.abort();
        reject(new HttpError(-1, 'Http Timeout'));
      }, timeout);
    });
  }
}
