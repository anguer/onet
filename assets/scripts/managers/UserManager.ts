import { director, Node } from 'cc';
import { LogManager } from 'db://assets/Framework/managers/LogManager';
import { PointKey, RewardManager } from 'db://assets/scripts/managers/RewardManager';
import { createProxy, pick } from 'db://assets/Framework/lib/Share';
import { NetManager } from 'db://assets/scripts/managers/NetManager';
import { IPlayer, IPlayerMedal, Nullable } from 'db://assets/scripts/NonogramInterface';
import { ToastManager } from 'db://assets/Framework/managers/ToastManager';
import { dayjs } from 'db://assets/scripts/utils/Dayjs';
import { CoinUsagePurpose, ItemsRewardedScene, ClientMessageType, ServerMessageType } from 'db://assets/scripts/utils/Constants';

interface IPlayerInfo extends Pick<IPlayer, 'id' | 'nick' | 'avatar'> {}

export class UserManager {
  private static _instance: UserManager;

  public static get instance(): UserManager {
    if (!this._instance) {
      this._instance = createProxy(new UserManager());
    }
    return this._instance;
  }

  public static readonly EventType = {
    INFO_UPDATE: 'INFO_UPDATE',
    TIPS_UPDATE: 'TIPS_UPDATE',
    COINS_UPDATE: 'COINS_UPDATE',
    ENERGY_UPDATE: 'ENERGY_UPDATE',
    ENERGY_TIMER_UPDATE: 'ENERGY_TIMER_UPDATE',
  };

  private readonly _manager: Node;

  // 体力恢复时间(秒)
  private readonly _recoveryTime: number = 600;

  private _initialized: boolean = false;
  private get initialized() {
    return this._initialized;
  }

  private _info: Nullable<IPlayerInfo> = null;
  public get info(): IPlayerInfo {
    return this._info || { id: '', nick: '', avatar: '' };
  }
  private set info(player: IPlayer) {
    const payload: IPlayerInfo = pick(player, ['id', 'nick', 'avatar']);
    const isEqual = JSON.stringify(this.info) === JSON.stringify(player);
    if (isEqual) return;

    this._info = payload;
    this.emit(UserManager.EventType.INFO_UPDATE, this.info);
  }

  private _medal: Nullable<IPlayerMedal> = null;

  // 提示道具
  private _tips: number = 0;
  public get tips(): number {
    return this._tips;
  }

  // 金币
  private _coins: number = 0;
  public get coins(): number {
    return this._coins;
  }

  // 最大体力值
  private readonly _maxEnergy: number = 10;
  public get maxEnergy(): number {
    return this._maxEnergy;
  }

  // 体力
  private _energies: number = 0;
  public get energies(): number {
    return this._energies;
  }
  public get hasEnergy(): boolean {
    return this._energies > 0;
  }

  private _recoveryTimer: ReturnType<typeof setTimeout> | null = null;
  // 最后一次恢复时间
  private _lastRecoveryTime: number = 0;

  constructor() {
    this._manager = new Node(`__${this.constructor.name}__`);

    // 添加节点到场景
    director.getScene()?.addChild(this._manager);

    // 标记为常驻节点，这样场景切换的时候就不会被销毁了
    director.addPersistRootNode(this._manager);

    // 监听消息
    NetManager.instance.onMessage<IPlayer>(ServerMessageType.PLAYER_STATE, this._onInfoUpdated.bind(this));
    NetManager.instance.onMessage<IPlayer>(ServerMessageType.ITEMS_UPDATED, this._onItemsUpdated.bind(this));
    NetManager.instance.onMessage<Nullable<IPlayerMedal>>(ServerMessageType.MEDAL_STATE, this._onMedalUpdated.bind(this));
    NetManager.instance.onMessage(ServerMessageType.WEEKLY_MEDAL_AWARDED, () => {});
  }

  public on(...options: Parameters<typeof this._manager.on>) {
    this._manager.on(...options);
  }

  public off(...options: Parameters<typeof this._manager.off>) {
    this._manager.off(...options);
  }

  public emit(...options: Parameters<typeof this._manager.emit>) {
    this._manager.emit(...options);
  }

  private _updateInfo(player: IPlayer) {
    this.info = player;

    this._energies = player.energies;
    this._tips = player.tips;
    this._coins = player.coins;
    this._lastRecoveryTime = dayjs(player.lastRecoveryTime).unix();

    // 启动恢复体力定时器（如果体力已满，自动关闭）
    this._startRecoveryTimer();
  }

  private _onInfoUpdated(player: IPlayer) {
    this._updateInfo(player);
    this.emit(UserManager.EventType.ENERGY_UPDATE, this.energies);
    this.emit(UserManager.EventType.TIPS_UPDATE, this.tips);
    this.emit(UserManager.EventType.COINS_UPDATE, this.coins);
  }

  private async _onItemsUpdated(player: IPlayer) {
    // diff
    const diffEnergies = player.energies - this._energies;
    const diffTips = player.tips - this._tips;
    const diffCoins = player.coins - this._coins;

    // update
    this._updateInfo(player);

    await this._startItemsAnimation(diffEnergies, diffTips, diffCoins);
    if (diffEnergies !== 0) {
      this.emit(UserManager.EventType.ENERGY_UPDATE, this.energies);
    }
    if (diffTips !== 0) {
      this.emit(UserManager.EventType.TIPS_UPDATE, this.tips);
    }
    if (diffCoins !== 0) {
      this.emit(UserManager.EventType.COINS_UPDATE, this.coins);
    }
  }

  private _onMedalUpdated(medal: Nullable<IPlayerMedal>) {
    this._medal = medal;
  }

  public async init() {
    if (this._initialized) {
      return;
    }

    this._initialized = true;
    LogManager.info('[UserManager#init]', '初始化用户信息');

    // 临时修复Socket未连接导致的用户信息异常问题
    const player = await NetManager.instance.get<IPlayer>('/api/player/info');
    this._onInfoUpdated(player);
    await NetManager.instance.joinLobby();
  }

  public async updateInfo(data: Optional<Pick<IPlayer, 'nick' | 'avatar'>>) {
    try {
      this.info = await NetManager.instance.post<IPlayer>('/api/player/info', data);
    } catch (e) {
      LogManager.error('[UserManager#updateInfo]', e);
      ToastManager.instance.show('更新用户信息失败');
    }
  }

  public async revokeAuth() {
    try {
      this.info = await NetManager.instance.post<IPlayer>('/api/player/auth/revoke');
      ToastManager.instance.show('撤销成功，重启后生效');
    } catch (e) {
      LogManager.error('[UserManager#revokeAuth]', e);
      ToastManager.instance.show('撤销用户信息授权失败');
    }
  }

  public useEnergies() {
    NetManager.instance.sendMessage(ClientMessageType.USE_ENERGIES);
  }

  public useHints(): boolean {
    if (this._tips <= 0) {
      return false;
    }

    NetManager.instance.sendMessage(ClientMessageType.USE_HINTS);
    return true;
  }

  /**
   * 使用金币恢复生命
   */
  public restoreLifeByCoins() {
    NetManager.instance.sendMessage(ClientMessageType.USE_COINS, { purpose: CoinUsagePurpose.RESTORE_LIFE });
  }

  /**
   * 使用金币恢复体力
   */
  public restoreEnergyByCoins() {
    NetManager.instance.sendMessage(ClientMessageType.USE_COINS, { purpose: CoinUsagePurpose.RESTORE_ENERGY });
  }

  /**
   * 通过广告恢复体力
   */
  public restoreEnergyByRewardedAd() {
    NetManager.instance.sendMessage(ClientMessageType.CLAIM_ITEM_REWARDS, { scene: ItemsRewardedScene.WATCH_AD_RESTORE_ENERGY });
  }

  /**
   * 通过广告获得提示
   */
  public getHintByRewardedAd() {
    NetManager.instance.sendMessage(ClientMessageType.CLAIM_ITEM_REWARDS, { scene: ItemsRewardedScene.WATCH_AD_GET_HINT });
  }

  /**
   * 侧边栏入口奖励
   */
  public rewardBySidebar() {
    NetManager.instance.sendMessage(ClientMessageType.CLAIM_ITEM_REWARDS, { scene: ItemsRewardedScene.SIDEBAR_ENTRY_REWARD });
  }

  /**
   * 领取完成关卡奖励
   */
  public claimLevelCompletionBonus() {
    NetManager.instance.sendMessage(ClientMessageType.CLAIM_ITEM_REWARDS, { scene: ItemsRewardedScene.LEVEL_COMPLETED });
  }

  public getMedals(): Array<{ label: string; medal: string; count: number }> {
    return [
      { label: '金牌', medal: 'medal_gold', count: this._medal?.gold || 0 },
      { label: '银牌', medal: 'medal_silver', count: this._medal?.silver || 0 },
      { label: '铜牌', medal: 'medal_bronze', count: this._medal?.bronze || 0 },
    ];
  }

  /**
   * 道具奖励动画
   * @param diffEnergies
   * @param diffTips
   * @param diffCoins
   * @private
   */
  private async _startItemsAnimation(diffEnergies: number, diffTips: number, diffCoins: number): Promise<void> {
    const todos: Promise<void>[] = [];
    if (diffEnergies > 0) {
      todos.push(
        new Promise<void>(async (resolve) => {
          await RewardManager.instance.playDrop(PointKey.ITEM_ENERGY, diffEnergies);
          resolve();
        }),
      );
    }

    if (diffTips > 0) {
      todos.push(
        new Promise<void>(async (resolve) => {
          await RewardManager.instance.playDrop(PointKey.ITEM_TIP, diffTips);
          resolve();
        }),
      );
    }

    if (diffCoins > 0) {
      todos.push(
        new Promise<void>(async (resolve) => {
          await RewardManager.instance.playDrop(PointKey.ITEM_COIN, diffCoins);
          resolve();
        }),
      );
    }

    await Promise.allSettled(todos);
  }

  // ========== 恢复体力相关 ==========

  /**
   * 更新定时器
   * @private
   */
  private _updateEnergyTimer() {
    if (this.energies < this.maxEnergy) {
      // 当前时间戳（秒）
      const currentTime = dayjs().unix();
      // 过去了多久时间（秒）
      const elapsedTime = Math.floor(currentTime - this._lastRecoveryTime);

      // 计算过去时间能恢复多少体力
      const recoveredEnergy = Math.max(0, Math.min(this.maxEnergy, Math.floor(elapsedTime / this._recoveryTime)));
      if (recoveredEnergy > 0) {
        this._lastRecoveryTime = dayjs().unix();
        this._energies += 1;
        this.emit(UserManager.EventType.ENERGY_UPDATE, this.energies);
      }

      // update timer label
      const nextRecoveryTime = Math.max(0, Math.floor(this._recoveryTime - elapsedTime));
      // const hours = Math.floor((nextRecoveryTime % (3600 * 24)) / 3600);
      const minutes = Math.floor((nextRecoveryTime % 3600) / 60);
      const seconds = Math.floor(nextRecoveryTime % 60);

      const formattedMinutes = minutes.toString().padStart(2, '0');
      const formattedSeconds = seconds.toString().padStart(2, '0');

      this.emit(UserManager.EventType.ENERGY_TIMER_UPDATE, `${formattedMinutes}:${formattedSeconds}`);
    } else {
      // 体力已满，清除恢复定时器
      this._clearRecoveryTimer();
      this.emit(UserManager.EventType.ENERGY_TIMER_UPDATE, `已 满`);
    }
  }

  /**
   * 启动恢复体力的定时器
   * @private
   */
  private _startRecoveryTimer(): void {
    if (this._recoveryTimer !== null) return;

    this._recoveryTimer = setInterval(() => {
      this._updateEnergyTimer();
    }, 1000);
  }

  /**
   * 清除恢复体力的定时器
   * @private
   */
  private _clearRecoveryTimer(): void {
    if (this._recoveryTimer !== null) {
      clearInterval(this._recoveryTimer);
      this._recoveryTimer = null;
    }
  }
}
