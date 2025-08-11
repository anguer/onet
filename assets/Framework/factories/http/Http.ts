export interface HttpOptions {
  pathBuilder?: (segments: string) => string;
  headers?: Record<string, string>;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  data?: object;
  timeout?: number;
}

export abstract class Http {
  private _authToken: string;

  constructor(private readonly options: HttpOptions = {}) {}

  public get headers() {
    return this.options.headers || {};
  }

  public set authToken(token: string) {
    this._authToken = token;
  }

  public get<T = any>(path: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(path, { method: 'GET', ...options });
  }

  public post<T = any>(path: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(path, { method: 'POST', ...options });
  }

  public put<T = any>(path: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(path, { method: 'PUT', ...options });
  }

  public del<T = any>(path: string, options: Omit<RequestOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(path, { method: 'DELETE', ...options });
  }

  abstract request<T>(path: string, options: RequestOptions): Promise<T>;

  protected getOptions(options: Partial<RequestOptions>) {
    // merge default custom headers with user headers
    options.headers = Object.assign({}, this.options.headers ?? {}, options.headers);

    if (this._authToken) {
      options.headers['Authorization'] = `Bearer ${this._authToken}`;
    }

    return options;
  }

  protected getHttpEndpoint(segments: string = '') {
    return this.options.pathBuilder?.(segments) || segments;
  }
}

export class HttpError extends Error {
  constructor(
    public code: number,
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}
