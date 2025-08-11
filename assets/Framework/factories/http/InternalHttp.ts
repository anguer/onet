import { RequestOptions, HttpError, Http } from 'db://assets/Framework/factories/http/Http';

export class InternalHttp extends Http {
  public async request<T>(path: string, options: RequestOptions): Promise<T> {
    const { method = 'GET', headers = {}, data, timeout = 10000 } = this.getOptions(options);

    return new Promise<T>(async (resolve, reject) => {
      const controller = new AbortController();
      const id = setTimeout(() => {
        controller.abort();
      }, timeout);

      try {
        const response = await fetch(this.getHttpEndpoint(path), {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
        });

        if (!response.ok) {
          reject(new HttpError(response.status, response.statusText));
        } else {
          const json = await response.json();
          resolve(json as T);
        }
      } catch (e) {
        reject(new HttpError(-1, e.message || 'Fetch Error'));
      } finally {
        clearTimeout(id);
      }
    });
  }
}
