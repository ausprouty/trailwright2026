import './LastTimeTool.css';
import { t } from 'src/i18n';
import type { LanguageCode } from 'src/i18n';

type LastTimeToolData = {};

type LastTimeToolConfig = {
  lang: LanguageCode;
};

type EditorJSToolConstructorArgs = {
  data: Partial<LastTimeToolData>;
  api: unknown;
  config?: LastTimeToolConfig;
  readOnly?: boolean;
};

export default class LastTimeTool {
  private wrapper!: HTMLDivElement;
  private lang: LanguageCode;

  public constructor({ config }: EditorJSToolConstructorArgs) {
    this.lang = config?.lang ?? 'en';
  }

  public static get toolbox() {
    return {
      title: 'Last Time',
      icon: `
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 11h4v-2h-3V7h-2Z"/>
        </svg>
      `,
    };
  }

  public render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('last-time-box');
    this.wrapper.textContent = t(this.lang, 'common.lastTimeReminder');
    return this.wrapper;
  }

  public save(): LastTimeToolData {
    return {};
  }
}
