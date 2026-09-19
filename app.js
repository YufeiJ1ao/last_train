(() => {
  'use strict';
  let language = 'zh';
  let confirmed = false;
  const byId = id => document.getElementById(id);
  const messages = {
    zh: '阅读已确认。请核对身旁的人数。同行人数应与进站时一致。',
    en: 'Acknowledgement recorded. Count the people beside you. The number should be the same as when you entered the station.'
  };
  function updateLanguage() {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-zh][data-en]').forEach(node => {
      node.textContent = node.dataset[language];
    });
    byId('language').textContent = language === 'zh' ? 'English' : '简体中文';
    byId('language').setAttribute('aria-label', language === 'zh' ? 'Switch to English' : '切换为简体中文');
    document.title = language === 'zh' ? '伦敦地铁个人安全提示（夜间出行）' : 'London Underground — Night Travel Safety Notice';
    if (confirmed) {
      byId('receipt').textContent = messages[language];
      byId('acknowledge').textContent = language === 'zh' ? '已确认阅读 · 28 / 28' : 'Acknowledged · 28 / 28';
    }
  }
  byId('language').addEventListener('click', () => { language = language === 'zh' ? 'en' : 'zh'; updateLanguage(); });
  byId('print').addEventListener('click', () => window.print());
  byId('they').addEventListener('click', () => {
    const expanded = byId('they').getAttribute('aria-expanded') === 'true';
    byId('they').setAttribute('aria-expanded', String(!expanded));
    byId('staff-note').hidden = expanded;
  });
  byId('acknowledge').addEventListener('click', () => {
    confirmed = true;
    document.body.classList.add('confirmed');
    byId('train-name').textContent = 'Final Train';
    byId('minutes').textContent = 'Due';
    byId('platform').textContent = '00';
    byId('acknowledge').disabled = true;
    byId('reset').hidden = false;
    updateLanguage();
  });
  byId('reset').addEventListener('click', () => {
    confirmed = false;
    document.body.classList.remove('confirmed');
    byId('train-name').textContent = 'Last Train';
    byId('minutes').textContent = '2 min';
    byId('platform').textContent = '01';
    byId('receipt').textContent = '';
    byId('acknowledge').disabled = false;
    byId('reset').hidden = true;
    byId('staff-note').hidden = true;
    byId('they').setAttribute('aria-expanded', 'false');
    updateLanguage();
    byId('acknowledge').focus({preventScroll:true});
    byId('notice').scrollIntoView();
  });
})();
