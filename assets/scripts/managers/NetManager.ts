import { LogManager } from 'db://assets/Framework/managers/LogManager';
import { HttpError, RequestOptions } from 'db://assets/Framework/factories/http/Http';
import { getCache, setCache } from 'db://assets/scripts/utils/Cache';
import { BUILD } from 'cc/env';
import { dayjs } from 'db://assets/scripts/utils/Dayjs';
import { SocialManager } from 'db://assets/Framework/factories/social/SocialManager';
import { Client, Room } from 'db://assets/Framework/colyseus';
import { ClientMessageType, ServerMessageType } from 'db://assets/scripts/utils/Constants';
import { ToastManager } from 'db://assets/Framework/managers/ToastManager';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  playerId: string;
  providerAccountId: string;
  isNew: boolean;
}

export interface ApiResponse<T> {
  data: T;
  errCode: number;
  errMsg: string;
}

export class NetManager {
  private static _instance: NetManager;

  public static get instance(): NetManager {
    if (!this._instance) {
      this._instance = new NetManager();
    }
    return this._instance;
  }

  private readonly _client: Client;

  private readonly _cacheKey = 'auth_tokens';

  private _tokens: AuthTokens | null = null;
  private _refreshTimerId: ReturnType<typeof setTimeout> | null = null;
  private _refreshingPromise: Promise<AuthResponse> | null = null;

  private _lobbyRoom: Room | null = null;
  // 当前重连延迟（毫秒），可做指数退避
  private _reconnectDelay = 1000;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private _listeners: Map<ServerMessageType, (message: any) => void> = new Map();

  constructor() {
    // this._client = new Client(!BUILD ? 'http://localhost:3520' : 'https://nonogram-server.lunaris.games');
    this._client = new Client('https://nonogram-server.lunaris.games');
  }

  public async init(): Promise<AuthResponse> {
    const isValid = await SocialManager.instance.checkSession();
    if (isValid) {
      // 如果session有效且token未过期，加载token
      const tokens = getCache<AuthTokens | null>(this._cacheKey, null);
      const now = dayjs().unix();
      if (tokens && now < tokens.expiresAt) {
        this._tokens = tokens;
      }
    }

    // 有token则强制刷新，否则走登录逻辑
    return await this.loginOrRefresh();
  }

  /**
   * 对外只调用一次，内部自动管理重连
   */
  public async joinLobby(): Promise<void> {
    try {
      await this.connectLobbyOnce();
    } catch (e) {
      LogManager.error('[NetManager#Lobby]', '首次连接失败', e);
      this.scheduleReconnect();
    }
  }

  private _onMessage(type: ServerMessageType, message: any): void {
    if (this._listeners.has(type)) {
      LogManager.trace(`[NetManager#onMessage]`, type, message);
      this._listeners.get(type)!(message);
    } else {
      LogManager.error('[NetManager#onMessage]', `not registered for type ${type}`);
    }
  }

  /**
   * 启动一次首次连接
   */
  private async connectLobbyOnce(): Promise<void> {
    // 如果没有 token 或者已经过期，先刷新
    const now = dayjs().unix();
    if (!this._tokens || now >= this._tokens.expiresAt) {
      await this.loginOrRefresh();
    }

    if (this._lobbyRoom) {
      // 清理旧回调，防止重复注册
      this._lobbyRoom.removeAllListeners();
      this._lobbyRoom = null;
    }

    const room = await this._client.joinOrCreate('lobby');
    this._lobbyRoom = room;

    room.onLeave((code, reason) => {
      LogManager.trace('[NetManager#Lobby]', '连接断开', code, reason);
      this.scheduleReconnect();
    });

    room.onError((code, reason) => {
      LogManager.error('[NetManager#Lobby]', '发生错误', code, reason);
    });

    // 你的消息与发送逻辑
    room.onMessage('__playground_message_types', () => {});
    room.onMessage(ServerMessageType.PLAYER_STATE, (message) => this._onMessage(ServerMessageType.PLAYER_STATE, message));
    room.onMessage(ServerMessageType.MEDAL_STATE, (message) => this._onMessage(ServerMessageType.MEDAL_STATE, message));
    room.onMessage(ServerMessageType.ITEMS_UPDATED, (message) => this._onMessage(ServerMessageType.ITEMS_UPDATED, message));
    room.onMessage(ServerMessageType.DAILY_TASKS_UPDATED, (message) => this._onMessage(ServerMessageType.DAILY_TASKS_UPDATED, message));
    room.onMessage(ServerMessageType.WEEKLY_MEDAL_AWARDED, (message) => this._onMessage(ServerMessageType.WEEKLY_MEDAL_AWARDED, message));
    LogManager.trace('[NetManager#Lobby]', '已连接房间');

    // 告诉服务端准备就绪
    room.send(ClientMessageType.READY);

    // 连上后把重连延迟重置
    this._reconnectDelay = 1000;
  }

  /**
   * 安排一次重连
   */
  private scheduleReconnect() {
    // 如果已有定时器在跑，就不再重复安排
    if (this._reconnectTimer) {
      return;
    }

    ToastManager.instance.showLoading();
    LogManager.trace('[NetManager#Lobby]', `断线重连 ${this._reconnectDelay}ms`);
    this._reconnectTimer = setTimeout(async () => {
      this._reconnectTimer = null;
      try {
        await this.connectLobbyOnce();
        ToastManager.instance.hideLoading();
      } catch (e) {
        LogManager.error('[NetManager#Lobby]', '重连失败', e);
        // 指数退避，最大不超过 10s
        this._reconnectDelay = Math.min(this._reconnectDelay * 2, 10000);
        this.scheduleReconnect();
      }
    }, this._reconnectDelay);
  }

  public async request<T>(path: string, options: RequestOptions): Promise<T> {
    if (!this._tokens) {
      await this.loginOrRefresh();
    }

    try {
      return await this._createRequest<T>(path, options);
    } catch (e) {
      if (e instanceof HttpError && e.code === 401) {
        await this.loginOrRefresh();
        return await this._createRequest<T>(path, options);
      }

      throw e;
    }
  }

  public async get<T>(path: string, data?: object) {
    return this.request<T>(path, { data, method: 'GET' });
  }

  public async post<T>(path: string, data?: object) {
    return this.request<T>(path, { data, method: 'POST' });
  }

  public sendMessage(type: ClientMessageType, data?: object): boolean {
    if (!this._lobbyRoom) {
      return false;
    }

    this._lobbyRoom.send(type, data);
    return true;
  }

  public onMessage<T>(type: ServerMessageType, callback: (message: T) => void) {
    if (this._listeners.has(type)) {
      return;
    }

    this._listeners.set(type, callback);
  }

  /**
   * 登录或刷新策略
   * @private
   */
  private async loginOrRefresh(): Promise<AuthResponse> {
    if (this._refreshingPromise) {
      return this._refreshingPromise;
    }

    this._refreshingPromise = (async () => {
      try {
        if (this._tokens?.refreshToken) {
          try {
            return await this.refresh();
          } catch {
            // 刷新失败继续登录
          }
        }

        return await this.login();
      } finally {
        this._refreshingPromise = null;
      }
    })();

    return this._refreshingPromise;
  }

  /**
   * 登录
   * @private
   */
  private async login(): Promise<AuthResponse> {
    const { code, provider } = await SocialManager.instance.login();
    const data = await this._createRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      data: { code, provider },
    });

    await this.setTokens(data.accessToken, data.refreshToken, data.expiresIn);
    return data;
  }

  /**
   * 刷新token
   * @private
   */
  private async refresh(): Promise<AuthResponse> {
    const data = await this._createRequest<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      data: { refreshToken: this._tokens!.refreshToken },
    });

    await this.setTokens(data.accessToken, data.refreshToken, data.expiresIn);
    return data;
  }

  /**
   * 存储 Token 并计划刷新
   * @param at
   * @param rt
   * @param expiresIn 秒
   * @private
   */
  private async setTokens(at: string, rt: string, expiresIn: number) {
    const expiresAt = dayjs().unix() + (expiresIn - 120);
    this._client.http.authToken = at;
    this._tokens = { accessToken: at, refreshToken: rt, expiresAt };
    setCache<AuthTokens>(this._cacheKey, this._tokens);
    await this.scheduleRefresh();
  }

  /**
   * 定时刷新
   * @private
   */
  private async scheduleRefresh() {
    if (this._refreshTimerId !== null) {
      clearTimeout(this._refreshTimerId);
      this._refreshTimerId = null;
    }

    if (!this._tokens) {
      return;
    }

    const now = dayjs().unix();
    const delay = (this._tokens.expiresAt - now) * 1000;
    if (delay > 0) {
      this._refreshTimerId = setTimeout(() => this.loginOrRefresh(), delay);
    } else {
      await this.loginOrRefresh();
    }
  }

  private async _createRequest<T>(path: string, options: RequestOptions): Promise<T> {
    try {
      const response = await this._client.http.request<ApiResponse<T>>(path, {
        method: options.method,
        data: options.data,
      });

      // 自定义错误
      const { data, errCode, errMsg } = response;
      if (errCode && errCode !== 0) {
        throw new HttpError(errCode, errMsg);
      }

      LogManager.http(`[NetManager#request]`, path, data);
      return data;
    } catch (e) {
      LogManager.error(`[NetManager#request]`, path, e);
      if (e instanceof HttpError) {
        throw e;
      }

      throw new HttpError(-1, e.message);
    }
  }
}
