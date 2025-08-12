import { game, screen, sys, UITransform } from 'cc';
import { SocialManager } from 'db://assets/Framework/factories/social/SocialManager';
import { LogManager } from 'db://assets/Framework/managers/LogManager';

export class ShareManager {
  private static _instance: ShareManager;

  public static get instance(): ShareManager {
    if (!this._instance) {
      this._instance = new ShareManager();
    }
    return this._instance;
  }

  private readonly _platform = sys.platform;

  constructor() {}

  public shareSnapshotWithTransform(transform: UITransform) {
    return new Promise<void>((resolve) => {
      switch (this._platform) {
        case sys.Platform.WECHAT_GAME:
          if (!(game.canvas && 'toTempFilePathSync' in game.canvas)) {
            return resolve();
          }

          const rect = SocialManager.instance.getBoundingBoxWithTransform(transform);
          const devicePixelRatio = screen.devicePixelRatio;
          const tempFilePath = (game.canvas as unknown as WechatMinigame.Canvas).toTempFilePathSync({
            x: rect.x * devicePixelRatio,
            y: rect.y * devicePixelRatio,
            width: rect.width * devicePixelRatio,
            height: rect.height * devicePixelRatio,
            destWidth: rect.width * devicePixelRatio,
            destHeight: rect.height * devicePixelRatio,
          });

          wx.showShareImageMenu({
            path: tempFilePath,
            needShowEntrance: true,
            success: () => {
              resolve();
            },
            fail: (res) => {
              LogManager.error('[ShareManager#shareSnapshotWithTransform]', res.errMsg);
              resolve();
            },
          });
          break;
        case sys.Platform.BYTEDANCE_MINI_GAME:
          break;
        default:
          break;
      }
    });
  }

  public shareSnapshot() {
    return new Promise<void>((resolve) => {
      switch (this._platform) {
        case sys.Platform.WECHAT_GAME:
          if (!(game.canvas && 'toTempFilePathSync' in game.canvas)) {
            return resolve();
          }

          const tempFilePath = (game.canvas as unknown as WechatMinigame.Canvas).toTempFilePathSync({});
          wx.showShareImageMenu({
            path: tempFilePath,
            needShowEntrance: true,
            success: () => {
              resolve();
            },
            fail: (res) => {
              LogManager.error('[ShareManager#shareSnapshot]', res.errMsg);
              resolve();
            },
          });
          break;
        case sys.Platform.BYTEDANCE_MINI_GAME:
          break;
        default:
          break;
      }
    });
  }
}
