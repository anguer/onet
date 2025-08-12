import { _decorator, Component, Label, ProgressBar, Tween, tween } from 'cc';
import { TweenUtils } from 'db://assets/Framework/lib/TweenUtils';
const { ccclass, property } = _decorator;

@ccclass('SplashScreen')
export class SplashScreen extends Component {
  @property(ProgressBar) loadingBar: ProgressBar;
  @property(Label) loadingLabel: Label;

  protected async onLoad() {
    this.loadingBar.progress = 0;
    this.loadingLabel.string = `Loading 0%`;
  }

  public show() {
    this.node.active = true;
  }

  public hide() {
    this.node.active = false;
  }

  public async onProgress(targetProgress: number) {
    Tween.stopAllByTarget(this.loadingBar);
    await TweenUtils.promisifyTween(
      tween(this.loadingBar).to(
        0.18,
        { progress: targetProgress / 100 },
        {
          onUpdate: () => {
            const currentPercent = this.loadingBar.progress;
            const progress = Math.floor(currentPercent * 100);
            this.loadingLabel.string = `Loading ${progress}%`;
          },
        },
      ),
    );
  }
}
