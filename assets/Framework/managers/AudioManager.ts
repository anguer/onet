/**
 * 音频管理器
 * Read more https://docs.cocos.com/creator/3.8/manual/zh/audio-system/audioExample.html
 */

import { AudioClip, AudioSource, director, Node, sys } from 'cc';
import { ResourceManager } from 'db://assets/Framework/managers/ResourceManager';
import { Debounce } from 'db://assets/Framework/decorators/debounce';

export class AudioManager {
  private static _instance: AudioManager;

  public static get instance(): AudioManager {
    if (!this._instance) {
      this._instance = new AudioManager();
    }
    return this._instance;
  }

  private readonly LS_BGM_KEY = '__AudioManager_bgmFlag__';
  private readonly LS_EFFECT_KEY = '__AudioManager_effectFlag__';
  private readonly _audioSource: AudioSource;

  private _bgmOn: boolean = true;
  private _effectOn: boolean = true;
  private _bgmVolume: number = 0.5;
  private _effectVolume: number = 0.2;

  public get audioSource() {
    return this._audioSource;
  }

  public set bgmOn(isOn: boolean) {
    this._bgmOn = isOn;
    sys.localStorage.setItem(this.LS_BGM_KEY, isOn ? 'on' : 'off');

    if (!isOn) {
      this.stop();
    } else {
      // continue play bgm
    }
  }

  public get bgmOn() {
    return this._bgmOn;
  }

  public set effectOn(isOn: boolean) {
    this._effectOn = isOn;
    sys.localStorage.setItem(this.LS_EFFECT_KEY, isOn ? 'on' : 'off');
  }

  public get effectOn() {
    return this._effectOn;
  }

  public setBgmVolume(volume: number) {
    this._bgmVolume = Math.max(0, Math.min(volume, 1));
    this.audioSource.volume = this._bgmVolume;
  }

  public getBgmVolume() {
    return this._bgmVolume;
  }

  public setEffectVolume(volume: number) {
    this._effectVolume = Math.max(0, Math.min(volume, 1));
  }

  public getEffectVolume() {
    return this._effectVolume;
  }

  public get currentTime() {
    return this._audioSource.currentTime;
  }

  constructor() {
    // 创建一个节点作为 audioManager
    const audioManager = new Node();
    audioManager.name = '__AudioManager__';

    // 添加节点到场景
    director.getScene()?.addChild(audioManager);

    // 标记为常驻节点，这样场景切换的时候就不会被销毁了
    director.addPersistRootNode(audioManager);

    // 添加 AudioSource 组件，用于播放音频。
    this._audioSource = audioManager.addComponent(AudioSource);

    // 默认配置
    this.setBgmVolume(this._bgmVolume);
    this.setEffectVolume(this._effectVolume);
    this._setDefaultSwitchState();
  }

  async init() {}

  /**
   * 播放短音频,比如 打击音效，爆炸音效等
   * @param path
   */
  @Debounce(20)
  public playEffect(path: string | AudioClip) {
    (async () => {
      if (!this._effectOn) {
        return;
      }

      if (typeof path === 'string') {
        const clip = await ResourceManager.instance.load(path, AudioClip);
        this._audioSource.playOneShot(clip, this._effectVolume);
      } else {
        this._audioSource.playOneShot(path, this._effectVolume);
      }
    })();
  }

  /**
   * 播放长音频，比如 背景音乐
   * @param path
   */
  public play(path: string | AudioClip) {
    (async () => {
      if (!this._bgmOn) {
        return;
      }

      if (typeof path === 'string') {
        const clip = await ResourceManager.instance.load(path, AudioClip);
        this._audioSource.stop();
        this._audioSource.loop = true;
        this._audioSource.clip = clip;
        this._audioSource.play();
      } else {
        this._audioSource.stop();
        this._audioSource.loop = true;
        this._audioSource.clip = path;
        this._audioSource.play();
      }
    })();
  }

  public stop() {
    this._audioSource.stop();
  }

  public toggleAll(isOn: boolean) {
    this.bgmOn = isOn;
    this.effectOn = isOn;
  }

  public toggleBgm(isOn: boolean) {
    this.bgmOn = isOn;
  }

  public toggleEffect(isOn: boolean) {
    this.effectOn = isOn;
  }

  private _setDefaultSwitchState() {
    const bgmFlag = sys.localStorage.getItem(this.LS_BGM_KEY);
    if (!bgmFlag) {
      this._bgmOn = true;
    } else {
      this._bgmOn = bgmFlag === 'on';
    }

    const effectFlag = sys.localStorage.getItem(this.LS_EFFECT_KEY);
    if (!effectFlag) {
      this._effectOn = true;
    } else {
      this._effectOn = effectFlag === 'on';
    }
  }
}
