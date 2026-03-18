import './LastTimeTool.css';

import { t } from 'src/i18n';

import type { LanguageCode } from 'src/i18n';
import type { LastTimeBlockData } from 'src/types/content/LastTimeBlock';

import type { LastTimeToolConstructorArgs } from './types';
import { icons } from 'src/components/editor/icons';

export default class LastTimeTool {
  private wrapper!: HTMLDivElement;
  private lang: LanguageCode;

  public constructor({ config }: LastTimeToolConstructorArgs) {
    this.lang = config?.lang ?? 'en';
  }

  public static get toolbox() {
    return {
      title: 'Last Time',
      icon: icons.lastTime,
    };
  }

  public render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('last-time-box');
    this.wrapper.textContent = t(this.lang, 'common.lastTimeReminder');
    return this.wrapper;
  }

  public save(): LastTimeBlockData {
    return {};
  }
}
