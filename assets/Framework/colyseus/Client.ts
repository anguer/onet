import { ServerError } from './errors/Errors';
import { Room } from './Room';
import { SchemaConstructor } from './serializer/SchemaSerializer';
import { SeatReservation } from './Protocol';
import { HttpProviderFactory } from 'db://assets/Framework/factories/http/HttpProviderFactory';
import { Http } from 'db://assets/Framework/factories/http/Http';
import { parseURL } from 'db://assets/Framework/colyseus/URLParser';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

export type JoinOptions = any;

export interface RequestError {
  code: number;
  error: string;
}

function isError(res: any): res is RequestError {
  return res.code !== undefined && res.error !== undefined;
}

export class MatchMakeError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
    this.name = 'MatchMakeError';
    Object.setPrototypeOf(this, MatchMakeError.prototype);
  }
}

export interface EndpointSettings {
  hostname: string;
  secure: boolean;
  port?: number;
  pathname?: string;
  searchParams?: string;
}

export interface ClientOptions {
  headers?: { [id: string]: string };
}

export class Client {
  public http: Http;

  protected settings: EndpointSettings;

  constructor(settings: string | EndpointSettings, options?: ClientOptions) {
    if (typeof settings === 'string') {
      //
      // endpoint by url
      //
      const url = parseURL(settings);

      const secure = url.protocol === 'https:' || url.protocol === 'wss:';
      const port = Number(url.port || (secure ? 443 : 80));

      this.settings = {
        hostname: url.hostname,
        pathname: url.pathname,
        port,
        secure,
        searchParams: url.searchParams || undefined,
      };
    } else {
      //
      // endpoint by settings
      //
      if (settings.port === undefined) {
        settings.port = settings.secure ? 443 : 80;
      }
      if (settings.pathname === undefined) {
        settings.pathname = '';
      }
      this.settings = settings;
    }

    // make sure pathname does not end with "/"
    if (this.settings.pathname?.endsWith('/')) {
      this.settings.pathname = this.settings.pathname.slice(0, -1);
    }

    this.http = HttpProviderFactory.create({ headers: options?.headers || {}, pathBuilder: this.getHttpEndpoint.bind(this) });
  }

  public async joinOrCreate<T>(roomName: string, options: JoinOptions = {}, rootSchema?: SchemaConstructor<T>) {
    return await this.createMatchMakeRequest<T>('joinOrCreate', roomName, options, rootSchema);
  }

  public async create<T>(roomName: string, options: JoinOptions = {}, rootSchema?: SchemaConstructor<T>) {
    return await this.createMatchMakeRequest<T>('create', roomName, options, rootSchema);
  }

  public async join<T>(roomName: string, options: JoinOptions = {}, rootSchema?: SchemaConstructor<T>) {
    return await this.createMatchMakeRequest<T>('join', roomName, options, rootSchema);
  }

  public async joinById<T>(roomId: string, options: JoinOptions = {}, rootSchema?: SchemaConstructor<T>) {
    return await this.createMatchMakeRequest<T>('joinById', roomId, options, rootSchema);
  }

  /**
   * Re-establish connection with a room this client was previously connected to.
   *
   * @param reconnectionToken The `room.reconnectionToken` from previously connected room.
   * @param rootSchema (optional) Concrete root schema definition
   * @returns Promise<Room>
   */
  public async reconnect<T>(reconnectionToken: string, rootSchema?: SchemaConstructor<T>) {
    if (typeof rootSchema === 'string') {
      throw new Error(
        "DEPRECATED: .reconnect() now only accepts 'reconnectionToken' as argument.\nYou can get this token from previously connected `room.reconnectionToken`",
      );
    }
    const [roomId, token] = reconnectionToken.split(':');
    if (!roomId || !token) {
      throw new Error('Invalid reconnection token format.\nThe format should be roomId:reconnectionToken');
    }
    return await this.createMatchMakeRequest<T>('reconnect', roomId, { reconnectionToken: token }, rootSchema);
  }

  public async consumeSeatReservation<T>(
    response: SeatReservation,
    rootSchema?: SchemaConstructor<T>,
    reuseRoomInstance?: Room, // used in devMode
  ): Promise<Room<T>> {
    const room = this.createRoom<T>(response.room.name, rootSchema);
    room.roomId = response.room.roomId;
    room.sessionId = response.sessionId;

    const options: any = { sessionId: room.sessionId };

    // forward "reconnection token" in case of reconnection.
    if (response.reconnectionToken) {
      options.reconnectionToken = response.reconnectionToken;
    }

    const targetRoom = reuseRoomInstance || room;
    room.connect(
      this.buildEndpoint(response.room, options, response.protocol),
      response.devMode
        ? async () => {
            LogManager.info(`[Colyseus devMode]`, `${String.fromCodePoint(0x1f504)} Re-establishing connection with room id '${room.roomId}'...`); // 🔄

            let retryCount = 0;
            const retryMaxRetries = 8;

            const retryReconnection = async () => {
              retryCount++;

              try {
                await this.consumeSeatReservation(response, rootSchema, targetRoom);
                LogManager.info(`[Colyseus devMode]`, `${String.fromCodePoint(0x2705)} Successfully re-established connection with room '${room.roomId}'`); // ✅
              } catch (e) {
                if (retryCount < retryMaxRetries) {
                  LogManager.info(`[Colyseus devMode]`, `${String.fromCodePoint(0x1f504)} retrying... (${retryCount} out of ${retryMaxRetries})`); // 🔄
                  setTimeout(retryReconnection, 2000);
                } else {
                  LogManager.info(
                    `[Colyseus devMode]`,
                    `${String.fromCodePoint(0x274c)} Failed to reconnect. Is your server running? Please check server logs.`,
                  ); // ❌
                }
              }
            };

            setTimeout(retryReconnection, 2000);
          }
        : undefined,
      targetRoom,
      response,
      this.http.headers,
    );

    return new Promise((resolve, reject) => {
      const onError = (code, message) => reject(new ServerError(code, message));
      targetRoom.onError.once(onError);

      targetRoom['onJoin'].once(() => {
        targetRoom.onError.remove(onError);
        resolve(targetRoom);
      });
    });
  }

  protected async createMatchMakeRequest<T>(
    method: string,
    roomName: string,
    options: JoinOptions = {},
    rootSchema?: SchemaConstructor<T>,
    reuseRoomInstance?: Room,
  ) {
    const response = await this.http.post<SeatReservation | RequestError>(`matchmake/${method}/${roomName}`, {
      data: options,
    });

    if (isError(response)) {
      throw new MatchMakeError(response.error, response.code);
    }

    // forward reconnection token during "reconnect" methods.
    if (method === 'reconnect') {
      response.reconnectionToken = options.reconnectionToken;
    }

    return await this.consumeSeatReservation<T>(response, rootSchema, reuseRoomInstance);
  }

  protected createRoom<T>(roomName: string, rootSchema?: SchemaConstructor<T>) {
    return new Room<T>(roomName, rootSchema);
  }

  protected buildEndpoint(room: any, options: any = {}, protocol: string = 'ws') {
    let searchParams = this.settings.searchParams || '';

    // forward authentication token
    if (this.http.authToken) {
      options['_authToken'] = this.http.authToken;
    }

    // append provided options
    for (const name in options) {
      if (!options.hasOwnProperty(name)) {
        continue;
      }
      searchParams += (searchParams ? '&' : '') + `${name}=${options[name]}`;
    }

    let endpoint = this.settings.secure ? `${protocol}s://` : `${protocol}://`;

    if (room.publicAddress) {
      endpoint += `${room.publicAddress}`;
    } else {
      endpoint += `${this.settings.hostname}${this.getEndpointPort()}${this.settings.pathname}`;
    }

    return `${endpoint}/${room.processId}/${room.roomId}?${searchParams}`;
  }

  protected getHttpEndpoint(segments: string = '') {
    const path = segments.startsWith('/') ? segments : `/${segments}`;

    let endpointURL = `${this.settings.secure ? 'https' : 'http'}://${this.settings.hostname}${this.getEndpointPort()}${this.settings.pathname}${path}`;

    if (this.settings.searchParams) {
      endpointURL += `?${this.settings.searchParams}`;
    }

    return endpointURL;
  }

  protected getEndpointPort() {
    return this.settings.port !== 80 && this.settings.port !== 443 ? `:${this.settings.port}` : '';
  }
}
