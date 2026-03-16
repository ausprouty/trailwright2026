import { boot } from 'quasar/wrappers';
import { createI18n } from 'vue-i18n';
import { messages } from 'src/i18n';

export default boot(({ app }) => {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: messages as never,
  });

  app.use(i18n);
});
