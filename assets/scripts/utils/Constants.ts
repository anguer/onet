import { Color } from 'cc';

export const Colors = {
  background: new Color(65, 237, 195),
  backgroundLight: new Color(225, 255, 251),
  white: Color.WHITE,
  black: Color.BLACK,
  black25: new Color(0, 0, 0, 64),
  red: new Color(244, 63, 94),
  redLight: new Color(253, 164, 175),
  green: new Color(34, 197, 94),
  greenLight: new Color(187, 247, 208),
  orange: new Color(249, 115, 22),
  orangeLight: new Color(254, 215, 170),
  //   orangeLight: new Color(253, 230, 138),
  blue: new Color(59, 130, 246),
  blueLight: new Color(147, 197, 253),
  // 棋子
  CHESS_PIECE_PRIMARY: new Color(10, 73, 149),
  CHESS_PIECE_DANGER: new Color(239, 68, 68),
  CHESS_PIECE_BACKGROUND: new Color(10, 73, 149, 25),
  // 数字提示
  HINT_BACKGROUND_PRIMARY: Color.WHITE,
  HINT_BACKGROUND_COMPLETED: new Color(0, 0, 0, 64),
  HINT_TEXT_PRIMARY: new Color(70, 107, 162),
  HINT_TEXT_HOVER: new Color(70, 107, 162, 128),
  HINT_TEXT_COMPLETED: new Color(255, 255, 255, 64),
  // 教程引导线
  GUIDELINE: new Color(0, 95, 234, 127),
  GUIDELINE_RECT: new Color(251, 146, 60),
  GUIDELINE_ARROW: new Color(84, 58, 164),
} as const;

// 客户端 → 服务端
export enum ClientMessageType {
  READY = 'READY',
  // 请求使用提示
  USE_HINTS = 'USE_HINTS',
  // 请求使用金币
  USE_COINS = 'USE_COINS',
  // 请求使用体力
  USE_ENERGIES = 'USE_ENERGIES',
  // 领取道具奖励
  CLAIM_ITEM_REWARDS = 'CLAIM_ITEM_REWARDS',
  // 领取每日任务奖励
  CLAIM_DAILY_TASK_REWARD = 'CLAIM_DAILY_TASK_REWARD',
  // 通知已完成关卡
  LEVEL_COMPLETED = 'LEVEL_COMPLETED',
}

// 服务端 → 客户端（推送／通知）
export enum ServerMessageType {
  // 推送玩家当前状态
  PLAYER_STATE = 'PLAYER_STATE',
  // 推送玩家奖牌状态
  MEDAL_STATE = 'MEDAL_STATE',
  // 道具更新推送
  ITEMS_UPDATED = 'ITEMS_UPDATED',
  // 每日任务更新推送
  DAILY_TASKS_UPDATED = 'DAILY_TASKS_UPDATED',
  // 推送本周奖牌奖励
  WEEKLY_MEDAL_AWARDED = 'WEEKLY_MEDAL_AWARDED',
}

// 金币用途
export enum CoinUsagePurpose {
  // 恢复1点体力
  RESTORE_ENERGY = 'RESTORE_ENERGY',
  // 恢复1点生命
  RESTORE_LIFE = 'RESTORE_LIFE',
  // 获得1个提示
  GET_HINT = 'GET_HINT',
}

// 道具奖励场景
export enum ItemsRewardedScene {
  // 通过观看激励视频广告恢复体力
  WATCH_AD_RESTORE_ENERGY = 'WATCH_AD_RESTORE_ENERGY',
  // 通过观看激励视频广告获得提示
  WATCH_AD_GET_HINT = 'WATCH_AD_GET_HINT',
  // 在侧边栏入口处点击领取奖励
  SIDEBAR_ENTRY_REWARD = 'SIDEBAR_ENTRY_REWARD',
  // 完成关卡
  LEVEL_COMPLETED = 'LEVEL_COMPLETED',
}
