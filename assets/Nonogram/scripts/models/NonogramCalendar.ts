import { ICalendarDay, ICalendarMonth } from 'db://assets/Nonogram/scripts/NonogramInterface';
import { NonogramLevel } from 'db://assets/Nonogram/scripts/models/NonogramLevel';
import { dayjs } from 'db://assets/Nonogram/scripts/utils/Dayjs';
import { NetManager } from 'db://assets/Nonogram/scripts/managers/NetManager';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

export type RewardStatus = 'unavailable' | 'claimable' | 'claimed';

/** 每完成多少天挑战可解锁一次奖励 */
export const REQUIRED_DAYS_PER_REWARD = 7;

/** 每月最多可领取多少次奖励 */
export const MAX_REWARD_PER_MONTH = 4;

export class NonogramCalendarReward {
  private readonly _index: number;
  private readonly _calendarId: string;
  private _status: RewardStatus = 'unavailable';

  public get index(): number {
    return this._index;
  }

  public get calendarId(): string {
    return this._calendarId;
  }

  public get label(): string {
    return `${this._index * REQUIRED_DAYS_PER_REWARD}`;
  }

  public get status(): RewardStatus {
    return this._status;
  }

  constructor(index: number, calendarId: string) {
    this._index = index;
    this._calendarId = calendarId;
  }

  public setClaimable() {
    // 如果是已领取，则跳过
    if (this._status === 'claimed') return;

    this._status = 'claimable';
  }

  public setClaimed() {
    this._status = 'claimed';
  }
}

/**
 * 定义月历数据结构
 */
export class NonogramCalendar {
  // 日历ID
  public readonly id: string;
  // 日历名称
  public readonly name: string;
  // 日历日期
  public readonly date: Date;
  // 关卡数量
  public readonly levelCount: number;

  public readonly _rewards: Map<number, NonogramCalendarReward> = new Map();
  public get rewards(): NonogramCalendarReward[] {
    return Array.from(this._rewards.values()).sort((a, b) => a.index - b.index);
  }

  public _levels: NonogramLevel[] = [];
  public get levels(): NonogramLevel[] {
    return this._levels;
  }

  public get completedCount() {
    if (this.levels.length === 0) {
      return this.data.completedCount;
    }

    return this.levels.reduce((acc, level) => {
      if (level.status === 'Completed') {
        return acc + 1;
      }
      return acc;
    }, 0);
  }

  constructor(private readonly data: ICalendarMonth) {
    const day = dayjs(this.data.date);
    this.id = this.data.id;
    this.name = day.format('YYYY年MM月');
    this.date = day.toDate();
    this.levelCount = this.data.levelCount;

    for (let i = 1; i <= MAX_REWARD_PER_MONTH; i++) {
      // 初始化奖励
      const reward = new NonogramCalendarReward(i, this.id);
      this._rewards.set(i, reward);
      // 标记可领取
      if (this.data.completedCount >= i * REQUIRED_DAYS_PER_REWARD) {
        reward.setClaimable();
      }
    }

    for (const rewardClaim of data.rewardClaims) {
      // 标记已领取
      if (this._rewards.has(rewardClaim.rewardIndex)) {
        this._rewards.get(rewardClaim.rewardIndex)!.setClaimed();
      }
    }
  }

  public complete(level: NonogramLevel) {
    level.completed();

    const maxUnlockRewardIndex = Math.floor(this.completedCount / REQUIRED_DAYS_PER_REWARD);
    for (let i = 1; i <= maxUnlockRewardIndex; i++) {
      // 标记可领取
      if (this._rewards.has(i)) {
        this._rewards.get(i)!.setClaimable();
      }
    }
  }

  public async loadLevels(): Promise<NonogramLevel[]> {
    try {
      if (this._levels.length > 0) {
        return this._levels;
      }

      const challenges = await NetManager.instance.get<ICalendarDay[]>(`/api/calendars/${this.id}/challenges`);
      this._levels = challenges.map((challenge) => NonogramLevel.fromCalendar(challenge, this.data));
      return this._levels;
    } catch (e) {
      LogManager.error('[NonogramCalendar#loadLevels]', e);
      return this._levels;
    }
  }
}
