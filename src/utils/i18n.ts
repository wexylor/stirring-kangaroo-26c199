import type { AppLang } from './preferences';

export interface Translations {
  langNativeName: string;
  groups: {
    all: string;
    none: string;
    family: string;
    friends: string;
    work: string;
    university: string;
  };
  common: {
    loading: string;
    close: string;
    cancel: string;
    create: string;
    add: string;
    save: string;
    delete: string;
    copy: string;
    clear: string;
    update: string;
    hide: string;
    edit: string;
    or: string;
    guest: string;
    untitled: string;
    personalCard: string;
    closeWindow: string;
    closeNotice: string;
  };
  auth: {
    brand: string;
    titleForgot: string;
    titleRegister: string;
    titleLogin: string;
    subForgot: string;
    subSync: string;
    tabLogin: string;
    tabRegister: string;
    emailResetLabel: string;
    emailResetPlaceholder: string;
    sendLink: string;
    sending: string;
    backToLogin: string;
    nameLabel: string;
    namePlaceholder: string;
    loginLabel: string;
    loginPlaceholder: string;
    passwordLabel: string;
    forgotQuestion: string;
    passwordPlaceholder: string;
    hidePassword: string;
    showPassword: string;
    submittingRegister: string;
    submittingLogin: string;
    createAccount: string;
    signIn: string;
    continueGuest: string;
    accountCreatedToast: (name: string) => string;
    signedInToast: string;
    resetSentToast: string;
    resetSentMessage: (email: string) => string;
  };
  sidebar: {
    brand: string;
    addContactAria: string;
    addContactBtn: string;
    closeMenuAria: string;
    searchPlaceholder: string;
    searchAria: string;
    clearSearchAria: string;
    groupsAria: string;
    contactsNavAria: string;
    emptyList: string;
    noFilterMatches: string;
    pinnedAria: string;
    matchesSuffix: string;
    overdueTitle: (days: number) => string;
    daysShort: (days: number) => string;
    syncUnsaved: (count: number) => string;
    syncOnline: string;
    syncPending: string;
    syncError: string;
    syncOffline: string;
    engineLocal: string;
    syncAria: string;
    profileTitle: string;
    exportAria: string;
    exportTitle: string;
    importAria: string;
    importTitle: string;
    apiAria: string;
    apiTitle: string;
    lightTheme: string;
    darkTheme: string;
    mobileNavAria: string;
    openContactsAria: string;
    addContactHeaderAria: string;
  };
  reminders: {
    ariaLabel: string;
    title: string;
    today: string;
    tomorrow: string;
    inDays: (daysStr: string) => string;
    birthday: string;
    exportCalendarAria: (personName: string, label: string) => string;
    exportCalendarTitle: string;
  };
  emptyState: {
    title: string;
    description: string;
    addContact: string;
    loadSample: string;
    sampleToast: string;
  };
  profileCard: {
    renameTitle: string;
    editSubtitleTitle: string;
    addSubtitlePlaceholder: string;
    summaryBtn: string;
    contactBtn: string;
    sectionBtn: string;
    dedupBtn: string;
    dedupTitle: string;
    unpinAria: string;
    pinAria: string;
    pinTitle: string;
    deleteAria: (name: string) => string;
    deleteTitle: string;
    sectionsCount: string;
    factsCount: string;
    updatedLabel: string;
    groupLabel: string;
    groupAria: string;
    remindLabel: string;
    remindAria: string;
    every14: string;
    every30: string;
    every60: string;
    off: string;
    noContactFor: (daysStr: string) => string;
  };
  analyzer: {
    title: string;
    insertDemo: string;
    placeholder: (name: string) => string;
    shortcutHint: string;
    analyzing: string;
    submit: string;
    donePrefix: string;
    factsAdded: (n: number) => string;
    newCols: (n: number) => string;
    inferences: (n: number) => string;
    updates: (n: number) => string;
    dupsSkipped: (n: number) => string;
    undo: string;
    dismissReportAria: string;
    quickQuestionLabel: string;
    quickQuestions: readonly string[];
    questionPlaceholder: (name: string) => string;
    searching: string;
    askBtn: string;
    answerHeader: (name: string) => string;
    dismissAnswerAria: string;
    chatDetected: (count: number) => string;
    cleanChatBtn: string;
  };
  columns: {
    filterPrefix: string;
    sectionsOf: (shown: number, total: number) => string;
    resetFilter: string;
    emptySearch: (name: string, query: string) => string;
    emptySections: string;
    renameTitle: string;
    newBadge: string;
    deleteSectionAria: (title: string) => string;
    deleteSectionTitle: string;
    emptyFacts: string;
    editFactTitle: string;
    tagInference: string;
    tagUpdated: string;
    tagNew: string;
    prevLabel: string;
    historyBtn: (n: number) => string;
    historyHideBtn: string;
    exportCalendarAria: (text: string) => string;
    exportCalendarTitle: string;
    deleteFactAria: (text: string) => string;
    quickAddPlaceholder: string;
    quickAddAria: (title: string) => string;
  };
  meetings: {
    title: string;
    countAndLast: (count: number, when: string) => string;
    today: string;
    daysAgo: (daysStr: string) => string;
    addBtn: string;
    empty: string;
    deleteAria: string;
    types: {
      meeting: string;
      call: string;
      message: string;
      other: string;
    };
  };
  rawNotes: {
    title: string;
    empty: string;
  };
  account: {
    title: string;
    name: string;
    login: string;
    email: string;
    notLinked: string;
    verified: string;
    pendingVerify: string;
    checkStatusTitle: string;
    checkStatusAria: string;
    syncLabel: string;
    syncPendingCount: (n: number) => string;
    synced: string;
    syncNow: string;
    syncing: string;
    bindEmailTitle: string;
    manageEmailTitle: string;
    bindEmailDesc: string;
    resendVerify: string;
    resetPassword: string;
    newEmailLabel: string;
    currentPasswordLabel: string;
    currentPasswordPlaceholder: string;
    sending: string;
    bindEmailBtn: string;
    localModeDesc: string;
    languageLabel: string;
    authorLabel: string;
    logout: string;
    loginAction: string;
    reloginMsg: string;
    emailConfirmedToast: string;
    emailPendingToast: string;
    bindMailSentMsg: (email: string) => string;
    bindMailSentToast: string;
    verifySentToast: (email: string) => string;
    resetSentToast: (email: string) => string;
  };
  modals: {
    newContactTitle: string;
    nameReq: string;
    namePlaceholder: string;
    noteLabel: string;
    notePlaceholder: string;
    groupLabel: string;
    colorLabel: string;
    colorAria: (id: string) => string;
    newSectionTitle: string;
    sectionNameReq: string;
    sectionPlaceholder: string;
    recordContactTitle: (name: string) => string;
    recordContactSubtitle: string;
    dateReq: string;
    formatLabel: string;
    summaryReq: string;
    summaryPlaceholder: string;
    apiTitle: string;
    apiDesc: string;
    apiKeyLabel: string;
    summaryTitle: string;
    summaryLoadingSub: string;
    summaryEngineSub: (engine: string) => string;
    selectedContactFallback: string;
    allContacts: string;
    buildingSummary: string;
    copyBtn: string;
    downloadTxt: string;
    refreshBtn: string;
  };
  toasts: {
    guestMode: string;
    syncLocalNotice: string;
    deleteLocalNotice: string;
    syncSuccess: string;
    syncError: string;
    tabCreated: (name: string) => string;
    deleteTabTitle: (name: string) => string;
    deleteTabMsg: string;
    tabDeleted: (name: string) => string;
    colExists: string;
    colAdded: (title: string) => string;
    meetingSaved: string;
    meetingDeleted: string;
    enterText: string;
    enrichedReason: string;
    updatedReason: string;
    analysisSuccess: (added: number, inf: number, dups: number) => string;
    analysisDupsOnly: (dups: number) => string;
    analysisEmpty: string;
    analysisUndone: string;
    copied: string;
    copyFailed: string;
    copyUnsupported: string;
    jsonExported: string;
    importLocalOnly: string;
    jsonImported: (count: number) => string;
    jsonInvalid: string;
    dedupDone: (count: number) => string;
    dedupNone: string;
    deleteColTitle: (title: string) => string;
    deleteColMsg: (count: number) => string;
    colDeleted: (title: string) => string;
    similarFactExists: (colTitle: string) => string;
    noteDeleted: string;
    loggedOut: string;
    logoutError: string;
    apiSaved: string;
    apiCleared: string;
    userKeyCleared: string;
    txtDownloaded: string;
    summaryPlainTitle: string;
    summaryGeneratedAt: string;
    manualEditReason: string;
    chatCleanedToast: string;
    calendarExported: (title: string) => string;
  };
  pwa: {
    installBtn: string;
    installTitle: string;
    installedBadge: string;
    iosGuideTitle: string;
    iosStep1: string;
    iosStep2: string;
    offlineBanner: string;
  };
}

export const TRANSLATIONS: Record<AppLang, Translations> = {
  ru: {
    langNativeName: 'Русский',
    groups: {
      all: 'Все',
      none: 'Без группы',
      family: 'Семья',
      friends: 'Друзья',
      work: 'Работа',
      university: 'Университет',
    },
    common: {
      loading: 'Загрузка...',
      close: 'Закрыть',
      cancel: 'Отмена',
      create: 'Создать',
      add: 'Добавить',
      save: 'Сохранить',
      delete: 'Удалить',
      copy: 'Копировать',
      clear: 'Очистить',
      update: 'Изменить',
      hide: 'Скрыть',
      edit: 'Редактировать',
      or: 'или',
      guest: 'Гость',
      untitled: 'Без названия',
      personalCard: 'Личная карточка',
      closeWindow: 'Закрыть окно',
      closeNotice: 'Закрыть уведомление',
    },
    auth: {
      brand: 'Блокнот о людях',
      titleForgot: 'Восстановление пароля',
      titleRegister: 'Новый аккаунт',
      titleLogin: 'Вход в блокнот',
      subForgot: 'Укажите привязанный Email для сброса пароля',
      subSync: 'Синхронизация заметок и контактов между устройствами',
      tabLogin: 'Вход',
      tabRegister: 'Регистрация',
      emailResetLabel: 'Привязанный Email',
      emailResetPlaceholder: 'name@example.com',
      sendLink: 'Отправить ссылку',
      sending: 'Отправка...',
      backToLogin: 'Назад ко входу',
      nameLabel: 'Имя',
      namePlaceholder: 'Например: Арыс',
      loginLabel: 'Логин или Email',
      loginPlaceholder: 'arys или arys@mail.com',
      passwordLabel: 'Пароль',
      forgotQuestion: 'Забыли пароль?',
      passwordPlaceholder: 'Минимум 6 символов',
      hidePassword: 'Скрыть пароль',
      showPassword: 'Показать пароль',
      submittingRegister: 'Создание...',
      submittingLogin: 'Вход...',
      createAccount: 'Создать аккаунт',
      signIn: 'Войти',
      continueGuest: 'Продолжить локально без аккаунта',
      accountCreatedToast: (name) => `Аккаунт «${name}» создан`,
      signedInToast: 'Вход выполнен',
      resetSentToast: 'Письмо для сброса пароля отправлено',
      resetSentMessage: (email) =>
        `Письмо со ссылкой для сброса пароля отправлено на ${email}.`,
    },
    sidebar: {
      brand: 'Блокнот',
      addContactAria: 'Добавить человека',
      addContactBtn: 'Контакт',
      closeMenuAria: 'Закрыть меню',
      searchPlaceholder: 'Поиск по людям и фактам...',
      searchAria: 'Поиск по людям и фактам',
      clearSearchAria: 'Очистить поиск',
      groupsAria: 'Группы контактов',
      contactsNavAria: 'Список людей',
      emptyList: 'Список контактов пуст',
      noFilterMatches: 'Ничего не найдено по фильтру',
      pinnedAria: 'Закреплено',
      matchesSuffix: 'совп.',
      overdueTitle: (days) => `Давно не общались: ${days} дн.`,
      daysShort: (days) => `${days}д`,
      syncUnsaved: (count) => `Не сохранено (${count})`,
      syncOnline: 'Синхронизировано',
      syncPending: 'Синхронизация...',
      syncError: 'Ошибка сети',
      syncOffline: 'Без облака',
      engineLocal: 'Локальный разбор',
      syncAria: 'Синхронизировать с облаком',
      profileTitle: 'Профиль, язык и синхронизация',
      exportAria: 'Экспорт JSON',
      exportTitle: 'Скачать резервную копию (JSON)',
      importAria: 'Импорт JSON',
      importTitle: 'Загрузить резервную копию (JSON)',
      apiAria: 'Настройки анализатора',
      apiTitle: 'Настройки анализатора',
      lightTheme: 'Светлая тема',
      darkTheme: 'Тёмная тема',
      mobileNavAria: 'Навигация по контактам',
      openContactsAria: 'Открыть список контактов',
      addContactHeaderAria: 'Добавить контакт',
    },
    reminders: {
      ariaLabel: 'Ближайшие важные даты',
      title: 'Ближайшие даты',
      today: 'сегодня',
      tomorrow: 'завтра',
      inDays: (daysStr) => `через ${daysStr}`,
      birthday: 'День рождения',
      exportCalendarAria: (personName, label) => `Скачать .ics в календарь: ${personName} — ${label}`,
      exportCalendarTitle: 'Добавить в календарь (.ics)',
    },
    emptyState: {
      title: 'Нет контактов',
      description:
        'Создайте карточку человека, чтобы собирать заметки, важные даты и историю встреч без повторов.',
      addContact: 'Добавить контакт',
      loadSample: 'Загрузить пример',
      sampleToast: 'Загружен пример карточки «Алина»',
    },
    profileCard: {
      renameTitle: 'Нажмите, чтобы переименовать',
      editSubtitleTitle: 'Нажмите, чтобы изменить описание',
      addSubtitlePlaceholder: 'Добавить краткое описание...',
      summaryBtn: 'Сводка',
      contactBtn: 'Контакт',
      sectionBtn: 'Раздел',
      dedupBtn: 'Убрать дубли',
      dedupTitle: 'Проверить и удалить повторяющиеся факты',
      unpinAria: 'Открепить контакт',
      pinAria: 'Закрепить контакт',
      pinTitle: 'Закрепить в списке',
      deleteAria: (name) => `Удалить «${name}»`,
      deleteTitle: 'Удалить контакт',
      sectionsCount: 'Разделов:',
      factsCount: 'Фактов:',
      updatedLabel: 'Обновлено:',
      groupLabel: 'Группа:',
      groupAria: 'Группа контакта',
      remindLabel: 'Напоминать:',
      remindAria: 'Интервал напоминания о контакте',
      every14: 'Раз в 14 дн.',
      every30: 'Раз в 30 дн.',
      every60: 'Раз в 60 дн.',
      off: 'Выкл',
      noContactFor: (daysStr) => `Не общались ${daysStr}`,
    },
    analyzer: {
      title: 'Новая заметка',
      insertDemo: 'Вставить пример',
      placeholder: (name) =>
        `Свободный текст о ${name}: привычки, вкусы, планы, важные даты...`,
      shortcutHint: 'Ctrl + Enter для разбора',
      analyzing: 'Разбираю...',
      submit: 'Добавить',
      donePrefix: 'Готово',
      factsAdded: (n) => `+${n} фактов`,
      newCols: (n) => `${n} новых разделов`,
      inferences: (n) => `${n} выводов`,
      updates: (n) => `${n} обновлений`,
      dupsSkipped: (n) => `дублей пропущено: ${n}`,
      undo: 'Отменить',
      dismissReportAria: 'Закрыть отчёт',
      quickQuestionLabel: 'Быстрый вопрос:',
      quickQuestions: [
        'Что подарить?',
        'Куда позвать на встречу?',
        'О чём поговорить при встрече?',
        'Какие есть табу и аллергии?',
      ],
      questionPlaceholder: (name) => `Вопрос по досье (${name})...`,
      searching: 'Поиск...',
      askBtn: 'Спросить',
      answerHeader: (name) => `Справка по заметкам (${name})`,
      dismissAnswerAria: 'Закрыть ответ',
      chatDetected: (count) => `Распознана переписка — важных реплик: ${count}`,
      cleanChatBtn: 'Очистить переписку',
    },
    columns: {
      filterPrefix: 'Фильтр:',
      sectionsOf: (shown, total) => `${shown} из ${total}`,
      resetFilter: 'Сбросить',
      emptySearch: (name, query) =>
        `У «${name}» по запросу «${query}» совпадений не найдено.`,
      emptySections:
        'Разделов пока нет. Добавьте заметку выше или создайте раздел вручную.',
      renameTitle: 'Нажмите, чтобы переименовать раздел',
      newBadge: 'новый',
      deleteSectionAria: (title) => `Удалить раздел «${title}»`,
      deleteSectionTitle: 'Удалить раздел',
      emptyFacts: 'Пока нет записей',
      editFactTitle: 'Нажмите, чтобы отредактировать',
      tagInference: 'вывод',
      tagUpdated: 'обновлено',
      tagNew: 'новое',
      prevLabel: 'было:',
      historyBtn: (n) => `История (${n})`,
      historyHideBtn: 'Скрыть историю',
      exportCalendarAria: (text) => `Добавить дату в календарь (.ics): ${text}`,
      exportCalendarTitle: 'Экспорт в календарь (.ics)',
      deleteFactAria: (text) => `Удалить факт «${text}»`,
      quickAddPlaceholder: '+ Добавить факт...',
      quickAddAria: (title) => `Добавить факт в раздел «${title}»`,
    },
    meetings: {
      title: 'Хронология контактов',
      countAndLast: (count, when) => `${count} · последний: ${when}`,
      today: 'сегодня',
      daysAgo: (daysStr) => `${daysStr} назад`,
      addBtn: 'Записать контакт',
      empty: 'Записей о встречах пока нет.',
      deleteAria: 'Удалить запись о встрече',
      types: {
        meeting: 'Встреча',
        call: 'Звонок',
        message: 'Переписка',
        other: 'Событие',
      },
    },
    rawNotes: {
      title: 'Исходные заметки',
      empty: 'Сохранённых исходных текстов пока нет.',
    },
    account: {
      title: 'Профиль',
      name: 'Имя',
      login: 'Логин',
      email: 'Почта',
      notLinked: 'Не привязана',
      verified: 'Подтверждена',
      pendingVerify: 'Ожидает подтверждения',
      checkStatusTitle: 'Проверить статус',
      checkStatusAria: 'Проверить статус подтверждения почты',
      syncLabel: 'Синхронизация',
      syncPendingCount: (n) => `Ожидает: ${n}`,
      synced: 'Синхронизировано',
      syncNow: 'Синхронизировать сейчас',
      syncing: 'Синхронизация...',
      bindEmailTitle: 'Привязка Email',
      manageEmailTitle: 'Управление Email',
      bindEmailDesc:
        'Привяжите реальный Email, чтобы восстанавливать пароль при необходимости.',
      resendVerify: 'Отправить подтверждение',
      resetPassword: 'Сбросить пароль',
      newEmailLabel: 'Новый Email',
      currentPasswordLabel: 'Текущий пароль',
      currentPasswordPlaceholder: 'Введите пароль',
      sending: 'Отправка...',
      bindEmailBtn: 'Привязать Email',
      localModeDesc:
        'Локальный режим: данные сохраняются только в браузере этого устройства. Войдите в аккаунт для синхронизации между устройствами.',
      languageLabel: 'Язык интерфейса',
      authorLabel: 'Автор',
      logout: 'Выйти из аккаунта',
      loginAction: 'Войти в аккаунт',
      reloginMsg:
        'Почта подтверждена. Выйдите и войдите заново с новым Email.',
      emailConfirmedToast: 'Email подтверждён',
      emailPendingToast: 'Ожидается подтверждение по ссылке из письма',
      bindMailSentMsg: (email) =>
        `На ${email} отправлено письмо с подтверждением. Перейдите по ссылке из письма, чтобы завершить привязку.`,
      bindMailSentToast: 'Письмо для привязки Email отправлено',
      verifySentToast: (email) => `Письмо отправлено на ${email}`,
      resetSentToast: (email) =>
        `Ссылка для смены пароля отправлена на ${email}`,
    },
    modals: {
      newContactTitle: 'Новый контакт',
      nameReq: 'Имя *',
      namePlaceholder: 'Максим, Катя...',
      noteLabel: 'Краткая пометка',
      notePlaceholder: 'Коллега, дизайнер...',
      groupLabel: 'Группа',
      colorLabel: 'Цвет метки',
      colorAria: (id) => `Цвет ${id}`,
      newSectionTitle: 'Новый раздел',
      sectionNameReq: 'Название раздела *',
      sectionPlaceholder: 'Идеи подарков, Семья, Книги...',
      recordContactTitle: (name) => `Записать контакт: ${name}`,
      recordContactSubtitle:
        'Обновляет хронологию и сбрасывает счётчик времени без общения',
      dateReq: 'Дата *',
      formatLabel: 'Формат',
      summaryReq: 'Краткий итог *',
      summaryPlaceholder: 'Пили кофе, обсуждали поездку и планы...',
      apiTitle: 'Настройки анализатора',
      apiDesc:
        'При наличии ключа разбор заметок и сводки выполняются через Gemini API. Без ключа или при отсутствии сети работает встроенный локальный разбор.',
      apiKeyLabel: 'Gemini API Key (необязательно)',
      summaryTitle: 'Сводка',
      summaryLoadingSub: 'Собираем сводку по заметкам...',
      summaryEngineSub: (engine) => `Источник: ${engine}`,
      selectedContactFallback: 'Выбранный контакт',
      allContacts: 'Все контакты',
      buildingSummary: 'Формирование сводки...',
      copyBtn: 'Скопировать',
      downloadTxt: 'Скачать .txt',
      refreshBtn: 'Обновить',
    },
    toasts: {
      guestMode:
        'Открыт локальный режим (данные хранятся только в этом браузере)',
      syncLocalNotice:
        'Изменения сохранены локально. Нажмите «Синхронизировать сейчас», когда появится связь.',
      deleteLocalNotice: 'Удаление сохранено локально и ожидает синхронизации.',
      syncSuccess: 'Синхронизация с облаком выполнена успешно!',
      syncError: 'Не удалось синхронизироваться с облаком. Проверьте интернет.',
      tabCreated: (name) => `Вкладка «${name}» создана`,
      deleteTabTitle: (name) => `Удалить вкладку «${name}»?`,
      deleteTabMsg:
        'Все колонки, факты, таймлайн встреч и история заметок этого человека будут удалены из вашего аккаунта.',
      tabDeleted: (name) => `Вкладка «${name}» удалена`,
      colExists: 'Колонка с таким названием уже есть',
      colAdded: (title) => `Колонка «${title}» добавлена`,
      meetingSaved: 'Встреча/контакт записаны в таймлайн',
      meetingDeleted: 'Запись удалена из таймлайна',
      enterText: 'Введите или вставьте текст для анализа',
      enrichedReason: 'Дополнено деталями из новой заметки',
      updatedReason: 'Обновлено на основе новой заметки',
      analysisSuccess: (added, inf, dups) =>
        `Добавлено фактов: ${added}, выводов: ${inf}${dups > 0 ? `, дублей пропущено: ${dups}` : ''}`,
      analysisDupsOnly: (dups) => `Дубликаты не добавлены (пропущено ${dups})`,
      analysisEmpty: 'Новых фактов в тексте не обнаружено',
      analysisUndone: 'Последний разбор отменён',
      copied: 'Текст скопирован в буфер обмена',
      copyFailed: 'Не удалось скопировать текст',
      copyUnsupported: 'Копирование не поддерживается в этом контексте',
      jsonExported: 'Резервная копия JSON скачана',
      importLocalOnly:
        'Импорт выполнен локально, нажмите «Синхронизировать сейчас»',
      jsonImported: (count) => `Импортировано вкладок: ${count}`,
      jsonInvalid: 'Ошибка: неверный формат JSON-файла',
      dedupDone: (count) => `Очищено повторяющихся фактов: ${count}`,
      dedupNone: 'Дубликатов не найдено — все факты уникальны',
      deleteColTitle: (title) => `Удалить колонку «${title}»?`,
      deleteColMsg: (count) =>
        `Будут удалены все записи внутри этой колонки (${count} шт.).`,
      colDeleted: (title) => `Колонка «${title}» удалена`,
      similarFactExists: (colTitle) =>
        `Похожий факт уже есть в колонке «${colTitle}»`,
      noteDeleted: 'Заметка удалена из истории',
      loggedOut: 'Вы вышли из аккаунта',
      logoutError: 'Ошибка при выходе из аккаунта',
      apiSaved: 'API-ключ сохранён (активен Gemini AI)',
      apiCleared: 'Ключ очищен',
      userKeyCleared: 'Пользовательский ключ очищен',
      txtDownloaded: 'Файл .txt скачан',
      summaryPlainTitle: 'ИИ-ДОСЬЕ И АНАЛИТИКА',
      summaryGeneratedAt: 'Сформировано',
      manualEditReason: 'Отредактировано вручную',
      chatCleanedToast: 'Приветствия и вода убраны — остались только факты и планы',
      calendarExported: (title) => `Событие «${title}» скачано (.ics)`,
    },
    pwa: {
      installBtn: 'Установить приложение',
      installTitle: 'Открывать блокнот как отдельное приложение без вкладок',
      installedBadge: 'Установлено как приложение',
      iosGuideTitle: 'Установка на iPhone / iPad',
      iosStep1: 'Нажмите кнопку «Поделиться» в нижней панели Safari',
      iosStep2: 'Выберите «На экран „Домой“» → «Добавить»',
      offlineBanner: 'Офлайн-режим — работают сохранённые данные и локальный анализатор',
    },
  },

  kk: {
    langNativeName: 'Қазақша',
    groups: {
      all: 'Барлығы',
      none: 'Топсыз',
      family: 'Отбасы',
      friends: 'Достар',
      work: 'Жұмыс',
      university: 'Университет',
    },
    common: {
      loading: 'Жүктелуде...',
      close: 'Жабу',
      cancel: 'Бас тарту',
      create: 'Құру',
      add: 'Қосу',
      save: 'Сақтау',
      delete: 'Жою',
      copy: 'Көшіру',
      clear: 'Тазалау',
      update: 'Өзгерту',
      hide: 'Жасыру',
      edit: 'Өңдеу',
      or: 'немесе',
      guest: 'Қонақ',
      untitled: 'Атаусыз',
      personalCard: 'Жеке карточка',
      closeWindow: 'Терезені жабу',
      closeNotice: 'Хабарламаны жабу',
    },
    auth: {
      brand: 'Адамдар туралы блокнот',
      titleForgot: 'Құпиясөзді қалпына келтіру',
      titleRegister: 'Жаңа аккаунт',
      titleLogin: 'Блокнотқа кіру',
      subForgot: 'Құпиясөзді қалпына келтіру үшін тіркелген Email енгізіңіз',
      subSync: 'Құрылғылар арасында жазбалар мен контактілерді синхрондау',
      tabLogin: 'Кіру',
      tabRegister: 'Тіркелу',
      emailResetLabel: 'Тіркелген Email',
      emailResetPlaceholder: 'name@example.com',
      sendLink: 'Сілтемені жіберу',
      sending: 'Жіберілуде...',
      backToLogin: 'Кіруге оралу',
      nameLabel: 'Аты',
      namePlaceholder: 'Мысалы: Арыс',
      loginLabel: 'Логин немесе Email',
      loginPlaceholder: 'arys немесе arys@mail.com',
      passwordLabel: 'Құпиясөз',
      forgotQuestion: 'Құпиясөзді ұмыттыңыз ба?',
      passwordPlaceholder: 'Кемінде 6 таңба',
      hidePassword: 'Құпиясөзді жасыру',
      showPassword: 'Құпиясөзді көрсету',
      submittingRegister: 'Құрылуда...',
      submittingLogin: 'Кіру...',
      createAccount: 'Аккаунт құру',
      signIn: 'Кіру',
      continueGuest: 'Аккаунтсыз жергілікті жалғастыру',
      accountCreatedToast: (name) => `«${name}» аккаунты құрылды`,
      signedInToast: 'Кіру сәтті орындалды',
      resetSentToast: 'Құпиясөзді қалпына келтіру хаты жіберілді',
      resetSentMessage: (email) =>
        `Құпиясөзді ауыстыру сілтемесі ${email} поштасына жіберілді.`,
    },
    sidebar: {
      brand: 'Блокнот',
      addContactAria: 'Адам қосу',
      addContactBtn: 'Контакт',
      closeMenuAria: 'Мәзірді жабу',
      searchPlaceholder: 'Адамдар мен деректер бойынша іздеу...',
      searchAria: 'Адамдар мен деректер бойынша іздеу',
      clearSearchAria: 'Іздеуді тазалау',
      groupsAria: 'Контакт топтары',
      contactsNavAria: 'Адамдар тізімі',
      emptyList: 'Контактілер тізімі бос',
      noFilterMatches: 'Сүзгі бойынша ештеңе табылмады',
      pinnedAria: 'Бекітілген',
      matchesSuffix: 'сәйк.',
      overdueTitle: (days) => `Көптен бері сөйлеспедік: ${days} күн`,
      daysShort: (days) => `${days}к`,
      syncUnsaved: (count) => `Сақталмады (${count})`,
      syncOnline: 'Синхрондалды',
      syncPending: 'Синхрондау...',
      syncError: 'Желі қатесі',
      syncOffline: 'Бұлтсыз',
      engineLocal: 'Жергілікті талдау',
      syncAria: 'Бұлтпен синхрондау',
      profileTitle: 'Профиль, тіл және синхрондау',
      exportAria: 'JSON экспорт',
      exportTitle: 'Резервтік көшірмені жүктеу (JSON)',
      importAria: 'JSON импорт',
      importTitle: 'Резервтік көшірмені ашу (JSON)',
      apiAria: 'Талдағыш баптаулары',
      apiTitle: 'Талдағыш баптаулары',
      lightTheme: 'Ашық тақырып',
      darkTheme: 'Қараңғы тақырып',
      mobileNavAria: 'Контактілер навигациясы',
      openContactsAria: 'Контактілер тізімін ашу',
      addContactHeaderAria: 'Контакт қосу',
    },
    reminders: {
      ariaLabel: 'Жақын маңызды күндер',
      title: 'Жақын күндер',
      today: 'бүгін',
      tomorrow: 'ертең',
      inDays: (daysStr) => `${daysStr} кейін`,
      birthday: 'Туған күн',
      exportCalendarAria: (personName, label) => `Күнтізбеге .ics жүктеу: ${personName} — ${label}`,
      exportCalendarTitle: 'Күнтізбеге қосу (.ics)',
    },
    emptyState: {
      title: 'Контактілер жоқ',
      description:
        'Жазбаларды, маңызды күндерді және кездесулер тарихын қайталаусыз жинау үшін адам карточкасын жасаңыз.',
      addContact: 'Контакт қосу',
      loadSample: 'Мысалды жүктеу',
      sampleToast: '«Алина» мысал карточкасы жүктелді',
    },
    profileCard: {
      renameTitle: 'Атын өзгерту үшін басыңыз',
      editSubtitleTitle: 'Сипаттаманы өзгерту үшін басыңыз',
      addSubtitlePlaceholder: 'Қысқаша сипаттама қосу...',
      summaryBtn: 'Қорытынды',
      contactBtn: 'Байланыс',
      sectionBtn: 'Бөлім',
      dedupBtn: 'Қайталауды өшіру',
      dedupTitle: 'Қайталанатын деректерді тексеру және өшіру',
      unpinAria: 'Бекітуді алып тастау',
      pinAria: 'Контактіні бекіту',
      pinTitle: 'Тізімде бекіту',
      deleteAria: (name) => `«${name}» жою`,
      deleteTitle: 'Контактіні жою',
      sectionsCount: 'Бөлім:',
      factsCount: 'Дерек:',
      updatedLabel: 'Жаңартылды:',
      groupLabel: 'Топ:',
      groupAria: 'Контакт тобы',
      remindLabel: 'Еске салу:',
      remindAria: 'Байланыс туралы еске салу аралығы',
      every14: '14 күн сайын',
      every30: '30 күн сайын',
      every60: '60 күн сайын',
      off: 'Өшірулі',
      noContactFor: (daysStr) => `${daysStr} байланыс болмады`,
    },
    analyzer: {
      title: 'Жаңа жазба',
      insertDemo: 'Мысал қою',
      placeholder: (name) =>
        `${name} туралы еркін мәтін: әдеттері, талғамы, жоспарлары, маңызды күндері...`,
      shortcutHint: 'Талдау үшін Ctrl + Enter',
      analyzing: 'Талдауда...',
      submit: 'Қосу',
      donePrefix: 'Дайын',
      factsAdded: (n) => `+${n} дерек`,
      newCols: (n) => `${n} жаңа бөлім`,
      inferences: (n) => `${n} қорытынды`,
      updates: (n) => `${n} жаңарту`,
      dupsSkipped: (n) => `қайталау өткізілді: ${n}`,
      undo: 'Қайтару',
      dismissReportAria: 'Есепті жабу',
      quickQuestionLabel: 'Жылдам сұрақ:',
      quickQuestions: [
        'Не сыйлауға болады?',
        'Кездесуге қайда шақыруға болады?',
        'Кездесуде не жайлы сөйлесуге болады?',
        'Қандай шектеулер мен аллергиясы бар?',
      ],
      questionPlaceholder: (name) => `Досье бойынша сұрақ (${name})...`,
      searching: 'Іздеу...',
      askBtn: 'Сұрау',
      answerHeader: (name) => `Жазбалар бойынша анықтама (${name})`,
      dismissAnswerAria: 'Жауапты жабу',
      chatDetected: (count) => `Хат алмасу анықталды — маңызды репликалар: ${count}`,
      cleanChatBtn: 'Хат алмасуды тазарту',
    },
    columns: {
      filterPrefix: 'Сүзгі:',
      sectionsOf: (shown, total) => `${shown} / ${total}`,
      resetFilter: 'Тазалау',
      emptySearch: (name, query) =>
        `«${name}» бойынша «${query}» сұрауына сәйкестік табылмады.`,
      emptySections:
        'Әзірге бөлімдер жоқ. Жоғарыда жазба қосыңыз немесе бөлімді қолмен жасаңыз.',
      renameTitle: 'Бөлім атауын өзгерту үшін басыңыз',
      newBadge: 'жаңа',
      deleteSectionAria: (title) => `«${title}» бөлімін жою`,
      deleteSectionTitle: 'Бөлімді жою',
      emptyFacts: 'Әзірге жазба жоқ',
      editFactTitle: 'Өңдеу үшін басыңыз',
      tagInference: 'қорытынды',
      tagUpdated: 'жаңартылды',
      tagNew: 'жаңа',
      prevLabel: 'бұрын:',
      historyBtn: (n) => `Тарих (${n})`,
      historyHideBtn: 'Тарихты жасыру',
      exportCalendarAria: (text) => `Күнді күнтізбеге қосу (.ics): ${text}`,
      exportCalendarTitle: 'Күнтізбеге экспорт (.ics)',
      deleteFactAria: (text) => `«${text}» дерегін жою`,
      quickAddPlaceholder: '+ Дерек қосу...',
      quickAddAria: (title) => `«${title}» бөліміне дерек қосу`,
    },
    meetings: {
      title: 'Байланыс хронологиясы',
      countAndLast: (count, when) => `${count} · соңғысы: ${when}`,
      today: 'бүгін',
      daysAgo: (daysStr) => `${daysStr} бұрын`,
      addBtn: 'Байланыс жазу',
      empty: 'Кездесулер туралы жазбалар әзірге жоқ.',
      deleteAria: 'Кездесу жазбасын жою',
      types: {
        meeting: 'Кездесу',
        call: 'Қоңырау',
        message: 'Хат алмасу',
        other: 'Оқиға',
      },
    },
    rawNotes: {
      title: 'Бастапқы жазбалар',
      empty: 'Сақталған бастапқы мәтіндер әзірге жоқ.',
    },
    account: {
      title: 'Профиль',
      name: 'Аты',
      login: 'Логин',
      email: 'Пошта',
      notLinked: 'Байланбаған',
      verified: 'Расталған',
      pendingVerify: 'Растауды күтуде',
      checkStatusTitle: 'Мәртебені тексеру',
      checkStatusAria: 'Поштаның расталу мәртебесін тексеру',
      syncLabel: 'Синхрондау',
      syncPendingCount: (n) => `Күтуде: ${n}`,
      synced: 'Синхрондалды',
      syncNow: 'Қазір синхрондау',
      syncing: 'Синхрондалуда...',
      bindEmailTitle: 'Email байлау',
      manageEmailTitle: 'Email басқару',
      bindEmailDesc:
        'Қажет кезде құпиясөзді қалпына келтіру үшін нақты Email байлаңыз.',
      resendVerify: 'Растау хатын жіберу',
      resetPassword: 'Құпиясөзді ауыстыру',
      newEmailLabel: 'Жаңа Email',
      currentPasswordLabel: 'Ағымдағы құпиясөз',
      currentPasswordPlaceholder: 'Құпиясөзді енгізіңіз',
      sending: 'Жіберілуде...',
      bindEmailBtn: 'Email байлау',
      localModeDesc:
        'Жергілікті режим: деректер тек осы құрылғының браузерінде сақталады. Құрылғылар арасында синхрондау үшін аккаунтқа кіріңіз.',
      languageLabel: 'Интерфейс тілі',
      authorLabel: 'Автор',
      logout: 'Аккаунттан шығу',
      loginAction: 'Аккаунтқа кіру',
      reloginMsg:
        'Пошта расталды. Шығып, жаңа Email арқылы қайта кіріңіз.',
      emailConfirmedToast: 'Email расталды',
      emailPendingToast: 'Хаттағы сілтеме арқылы растау күтілуде',
      bindMailSentMsg: (email) =>
        `${email} мекенжайына растау хаты жіберілді. Байлауды аяқтау үшін хаттағы сілтемені басыңыз.`,
      bindMailSentToast: 'Email байлау хаты жіберілді',
      verifySentToast: (email) => `Хат ${email} мекенжайына жіберілді`,
      resetSentToast: (email) =>
        `Құпиясөзді ауыстыру сілтемесі ${email} поштасына жіберілді`,
    },
    modals: {
      newContactTitle: 'Жаңа контакт',
      nameReq: 'Аты *',
      namePlaceholder: 'Мақсат, Әлия...',
      noteLabel: 'Қысқаша белгі',
      notePlaceholder: 'Әріптес, дизайнер...',
      groupLabel: 'Топ',
      colorLabel: 'Белгі түсі',
      colorAria: (id) => `Түс ${id}`,
      newSectionTitle: 'Жаңа бөлім',
      sectionNameReq: 'Бөлім атауы *',
      sectionPlaceholder: 'Сыйлық идеялары, Отбасы, Кітаптар...',
      recordContactTitle: (name) => `Байланыс жазу: ${name}`,
      recordContactSubtitle:
        'Хронологияны жаңартады және байланыссыз күндер есептегішін нөлдейді',
      dateReq: 'Күні *',
      formatLabel: 'Формат',
      summaryReq: 'Қысқаша қорытынды *',
      summaryPlaceholder: 'Кофе іштік, сапар мен жоспарларды талқыладық...',
      apiTitle: 'Талдағыш баптаулары',
      apiDesc:
        'Кілт болған жағдайда жазбалар мен қорытынды Gemini API арқылы өңделеді. Кілті жоқ немесе желі болмаса, кіріктірілген жергілікті талдау жұмыс істейді.',
      apiKeyLabel: 'Gemini API Key (міндетті емес)',
      summaryTitle: 'Қорытынды',
      summaryLoadingSub: 'Жазбалар бойынша қорытынды жиналуда...',
      summaryEngineSub: (engine) => `Дереккөз: ${engine}`,
      selectedContactFallback: 'Таңдалған контакт',
      allContacts: 'Барлық контактілер',
      buildingSummary: 'Қорытынды жасалуда...',
      copyBtn: 'Көшіру',
      downloadTxt: '.txt жүктеу',
      refreshBtn: 'Жаңарту',
    },
    toasts: {
      guestMode: 'Жергілікті режим ашылды (деректер тек осы браузерде сақталады)',
      syncLocalNotice:
        'Өзгерістер жергілікті сақталды. Желі қосылғанда «Қазір синхрондау» батырмасын басыңыз.',
      deleteLocalNotice: 'Жою жергілікті сақталды және синхрондауды күтуде.',
      syncSuccess: 'Бұлтпен синхрондау сәтті орындалды!',
      syncError: 'Бұлтпен синхрондау мүмкін болмады. Интернетті тексеріңіз.',
      tabCreated: (name) => `«${name}» қойындысы құрылды`,
      deleteTabTitle: (name) => `«${name}» қойындысын жою керек пе?`,
      deleteTabMsg:
        'Осы адамның барлық бөлімдері, деректері, кездесу хронологиясы және жазбалар тарихы аккаунтыңыздан өшіріледі.',
      tabDeleted: (name) => `«${name}» қойындысы жойылды`,
      colExists: 'Мұндай атаумен бөлім бұрыннан бар',
      colAdded: (title) => `«${title}» бөлімі қосылды`,
      meetingSaved: 'Кездесу/байланыс хронологияға жазылды',
      meetingDeleted: 'Жазба хронологиядан жойылды',
      enterText: 'Талдау үшін мәтін енгізіңіз немесе қойыңыз',
      enrichedReason: 'Жаңа жазбадағы мәліметтермен толықтырылды',
      updatedReason: 'Жаңа жазба негізінде жаңартылды',
      analysisSuccess: (added, inf, dups) =>
        `Қосылған дерек: ${added}, қорытынды: ${inf}${dups > 0 ? `, қайталау өткізілді: ${dups}` : ''}`,
      analysisDupsOnly: (dups) => `Қайталаулар қосылмады (${dups} өткізілді)`,
      analysisEmpty: 'Мәтіннен жаңа дерек табылмады',
      analysisUndone: 'Соңғы талдау қайтарылды',
      copied: 'Мәтін алмасу буферіне көшірілді',
      copyFailed: 'Мәтінді көшіру мүмкін болмады',
      copyUnsupported: 'Бұл ортада көшіру қолдау көрсетілмейді',
      jsonExported: 'JSON резервтік көшірмесі жүктелді',
      importLocalOnly:
        'Импорт жергілікті орындалды, «Қазір синхрондау» түймесін басыңыз',
      jsonImported: (count) => `Импортталған қойындылар: ${count}`,
      jsonInvalid: 'Қате: JSON-файл пішімі дұрыс емес',
      dedupDone: (count) => `Қайталанатын деректер тазартылды: ${count}`,
      dedupNone: 'Қайталау табылмады — барлық дерек бірегей',
      deleteColTitle: (title) => `«${title}» бөлімін жою керек пе?`,
      deleteColMsg: (count) =>
        `Бұл бөлімнің ішіндегі барлық жазбалар (${count} дана) жойылады.`,
      colDeleted: (title) => `«${title}» бөлімі жойылды`,
      similarFactExists: (colTitle) =>
        `Ұқсас дерек «${colTitle}» бөлімінде бұрыннан бар`,
      noteDeleted: 'Жазба тарихтан жойылды',
      loggedOut: 'Аккаунттан шықтыңыз',
      logoutError: 'Аккаунттан шығу кезінде қате шықты',
      apiSaved: 'API-кілт сақталды (Gemini AI белсенді)',
      apiCleared: 'Кілт тазартылды',
      userKeyCleared: 'Пайдаланушы кілті тазартылды',
      txtDownloaded: '.txt файлы жүктелді',
      summaryPlainTitle: 'AI ДОСЬЕ ЖӘНЕ ТАЛДАУ',
      summaryGeneratedAt: 'Құрылды',
      manualEditReason: 'Қолмен өңделді',
      chatCleanedToast: 'Сәлемдесу мен артық сөздер алынды — тек деректер мен жоспарлар қалды',
      calendarExported: (title) => `«${title}» оқиғасы жүктелді (.ics)`,
    },
    pwa: {
      installBtn: 'Қосымшаны орнату',
      installTitle: 'Блокнотты браузер қойындыларынсыз бөлек қосымша ретінде ашу',
      installedBadge: 'Қосымша ретінде орнатылған',
      iosGuideTitle: 'iPhone / iPad құрылғысына орнату',
      iosStep1: 'Safari төменгі панеліндегі «Бөлісу» түймесін басыңыз',
      iosStep2: '«Басты экранға» → «Қосу» таңдаңыз',
      offlineBanner: 'Офлайн-режим — сақталған деректер мен жергілікті талдағыш жұмыс істейді',
    },
  },

  en: {
    langNativeName: 'English',
    groups: {
      all: 'All',
      none: 'No group',
      family: 'Family',
      friends: 'Friends',
      work: 'Work',
      university: 'University',
    },
    common: {
      loading: 'Loading...',
      close: 'Close',
      cancel: 'Cancel',
      create: 'Create',
      add: 'Add',
      save: 'Save',
      delete: 'Delete',
      copy: 'Copy',
      clear: 'Clear',
      update: 'Change',
      hide: 'Hide',
      edit: 'Edit',
      or: 'or',
      guest: 'Guest',
      untitled: 'Untitled',
      personalCard: 'Personal card',
      closeWindow: 'Close dialog',
      closeNotice: 'Dismiss notice',
    },
    auth: {
      brand: 'People Notebook',
      titleForgot: 'Reset Password',
      titleRegister: 'Create Account',
      titleLogin: 'Sign In',
      subForgot: 'Enter your linked email to reset your password',
      subSync: 'Sync notes and contacts across your devices',
      tabLogin: 'Sign in',
      tabRegister: 'Sign up',
      emailResetLabel: 'Linked Email',
      emailResetPlaceholder: 'name@example.com',
      sendLink: 'Send reset link',
      sending: 'Sending...',
      backToLogin: 'Back to sign in',
      nameLabel: 'Name',
      namePlaceholder: 'e.g. Alex',
      loginLabel: 'Username or Email',
      loginPlaceholder: 'alex or alex@mail.com',
      passwordLabel: 'Password',
      forgotQuestion: 'Forgot password?',
      passwordPlaceholder: 'At least 6 characters',
      hidePassword: 'Hide password',
      showPassword: 'Show password',
      submittingRegister: 'Creating...',
      submittingLogin: 'Signing in...',
      createAccount: 'Create account',
      signIn: 'Sign in',
      continueGuest: 'Continue locally without an account',
      accountCreatedToast: (name) => `Account «${name}» created`,
      signedInToast: 'Signed in',
      resetSentToast: 'Password reset email sent',
      resetSentMessage: (email) =>
        `A password reset link has been sent to ${email}.`,
    },
    sidebar: {
      brand: 'Notebook',
      addContactAria: 'Add person',
      addContactBtn: 'Contact',
      closeMenuAria: 'Close menu',
      searchPlaceholder: 'Search people and facts...',
      searchAria: 'Search people and facts',
      clearSearchAria: 'Clear search',
      groupsAria: 'Contact groups',
      contactsNavAria: 'People list',
      emptyList: 'No contacts yet',
      noFilterMatches: 'No matching contacts',
      pinnedAria: 'Pinned',
      matchesSuffix: 'hits',
      overdueTitle: (days) => `No contact for ${days}d`,
      daysShort: (days) => `${days}d`,
      syncUnsaved: (count) => `Unsaved (${count})`,
      syncOnline: 'Synced',
      syncPending: 'Syncing...',
      syncError: 'Network error',
      syncOffline: 'Local only',
      engineLocal: 'Local AI',
      syncAria: 'Sync with cloud',
      profileTitle: 'Profile, language & sync',
      exportAria: 'Export JSON',
      exportTitle: 'Download backup (JSON)',
      importAria: 'Import JSON',
      importTitle: 'Restore backup (JSON)',
      apiAria: 'Analyzer settings',
      apiTitle: 'Analyzer settings',
      lightTheme: 'Light theme',
      darkTheme: 'Dark theme',
      mobileNavAria: 'Contacts navigation',
      openContactsAria: 'Open contacts list',
      addContactHeaderAria: 'Add contact',
    },
    reminders: {
      ariaLabel: 'Upcoming important dates',
      title: 'Upcoming dates',
      today: 'today',
      tomorrow: 'tomorrow',
      inDays: (daysStr) => `in ${daysStr}`,
      birthday: 'Birthday',
      exportCalendarAria: (personName, label) => `Export .ics to calendar: ${personName} — ${label}`,
      exportCalendarTitle: 'Add to calendar (.ics)',
    },
    emptyState: {
      title: 'No contacts',
      description:
        'Create a person card to organize notes, important dates, and meeting history without duplicates.',
      addContact: 'Add contact',
      loadSample: 'Load sample',
      sampleToast: 'Loaded sample contact «Алина»',
    },
    profileCard: {
      renameTitle: 'Click to rename',
      editSubtitleTitle: 'Click to edit note',
      addSubtitlePlaceholder: 'Add a short note...',
      summaryBtn: 'Summary',
      contactBtn: 'Contact',
      sectionBtn: 'Section',
      dedupBtn: 'Deduplicate',
      dedupTitle: 'Find and remove duplicate facts',
      unpinAria: 'Unpin contact',
      pinAria: 'Pin contact',
      pinTitle: 'Pin in list',
      deleteAria: (name) => `Delete «${name}»`,
      deleteTitle: 'Delete contact',
      sectionsCount: 'Sections:',
      factsCount: 'Facts:',
      updatedLabel: 'Updated:',
      groupLabel: 'Group:',
      groupAria: 'Contact group',
      remindLabel: 'Remind:',
      remindAria: 'Contact reminder interval',
      every14: 'Every 14d',
      every30: 'Every 30d',
      every60: 'Every 60d',
      off: 'Off',
      noContactFor: (daysStr) => `Last contact ${daysStr} ago`,
    },
    analyzer: {
      title: 'New note',
      insertDemo: 'Insert sample',
      placeholder: (name) =>
        `Free-form note about ${name}: habits, tastes, plans, important dates...`,
      shortcutHint: 'Ctrl + Enter to analyze',
      analyzing: 'Analyzing...',
      submit: 'Add',
      donePrefix: 'Done',
      factsAdded: (n) => `+${n} facts`,
      newCols: (n) => `${n} new sections`,
      inferences: (n) => `${n} inferences`,
      updates: (n) => `${n} updates`,
      dupsSkipped: (n) => `duplicates skipped: ${n}`,
      undo: 'Undo',
      dismissReportAria: 'Dismiss report',
      quickQuestionLabel: 'Quick ask:',
      quickQuestions: [
        'Gift ideas?',
        'Where to meet?',
        'Conversation topics?',
        'Taboos & allergies?',
      ],
      questionPlaceholder: (name) => `Ask about ${name}...`,
      searching: 'Searching...',
      askBtn: 'Ask',
      answerHeader: (name) => `Notes reference (${name})`,
      dismissAnswerAria: 'Dismiss answer',
      chatDetected: (count) => `Chat transcript detected — key lines: ${count}`,
      cleanChatBtn: 'Clean transcript',
    },
    columns: {
      filterPrefix: 'Filter:',
      sectionsOf: (shown, total) => `${shown} of ${total}`,
      resetFilter: 'Reset',
      emptySearch: (name, query) =>
        `No matches found for «${query}» in ${name}'s card.`,
      emptySections:
        'No sections yet. Add a note above or create a section manually.',
      renameTitle: 'Click to rename section',
      newBadge: 'new',
      deleteSectionAria: (title) => `Delete section «${title}»`,
      deleteSectionTitle: 'Delete section',
      emptyFacts: 'No entries yet',
      editFactTitle: 'Click to edit',
      tagInference: 'inferred',
      tagUpdated: 'updated',
      tagNew: 'new',
      prevLabel: 'was:',
      historyBtn: (n) => `History (${n})`,
      historyHideBtn: 'Hide history',
      exportCalendarAria: (text) => `Add date to calendar (.ics): ${text}`,
      exportCalendarTitle: 'Export to calendar (.ics)',
      deleteFactAria: (text) => `Delete fact «${text}»`,
      quickAddPlaceholder: '+ Add fact...',
      quickAddAria: (title) => `Add fact to «${title}»`,
    },
    meetings: {
      title: 'Contact timeline',
      countAndLast: (count, when) => `${count} · last: ${when}`,
      today: 'today',
      daysAgo: (daysStr) => `${daysStr} ago`,
      addBtn: 'Log contact',
      empty: 'No contact entries logged yet.',
      deleteAria: 'Delete meeting entry',
      types: {
        meeting: 'Meeting',
        call: 'Call',
        message: 'Message',
        other: 'Event',
      },
    },
    rawNotes: {
      title: 'Source notes',
      empty: 'No saved source notes yet.',
    },
    account: {
      title: 'Profile',
      name: 'Name',
      login: 'Login',
      email: 'Email',
      notLinked: 'Not linked',
      verified: 'Verified',
      pendingVerify: 'Pending verification',
      checkStatusTitle: 'Check status',
      checkStatusAria: 'Check email verification status',
      syncLabel: 'Sync',
      syncPendingCount: (n) => `Pending: ${n}`,
      synced: 'Synced',
      syncNow: 'Sync now',
      syncing: 'Syncing...',
      bindEmailTitle: 'Link Email',
      manageEmailTitle: 'Manage Email',
      bindEmailDesc:
        'Link a real email address so you can recover your password if needed.',
      resendVerify: 'Resend verification',
      resetPassword: 'Reset password',
      newEmailLabel: 'New Email',
      currentPasswordLabel: 'Current password',
      currentPasswordPlaceholder: 'Enter password',
      sending: 'Sending...',
      bindEmailBtn: 'Link Email',
      localModeDesc:
        'Local mode: data is stored only in this browser. Sign in to sync across devices.',
      languageLabel: 'Language',
      authorLabel: 'Author',
      logout: 'Sign out',
      loginAction: 'Sign in',
      reloginMsg:
        'Email verified. Please sign out and sign back in with your new email.',
      emailConfirmedToast: 'Email verified',
      emailPendingToast: 'Waiting for confirmation link click',
      bindMailSentMsg: (email) =>
        `Verification email sent to ${email}. Follow the link in the email to finish linking.`,
      bindMailSentToast: 'Verification email sent',
      verifySentToast: (email) => `Email sent to ${email}`,
      resetSentToast: (email) => `Password reset link sent to ${email}`,
    },
    modals: {
      newContactTitle: 'New contact',
      nameReq: 'Name *',
      namePlaceholder: 'Alex, Kate...',
      noteLabel: 'Short note',
      notePlaceholder: 'Colleague, designer...',
      groupLabel: 'Group',
      colorLabel: 'Color tag',
      colorAria: (id) => `Color ${id}`,
      newSectionTitle: 'New section',
      sectionNameReq: 'Section title *',
      sectionPlaceholder: 'Gift ideas, Family, Books...',
      recordContactTitle: (name) => `Log contact: ${name}`,
      recordContactSubtitle:
        'Updates timeline and resets days since last contact',
      dateReq: 'Date *',
      formatLabel: 'Format',
      summaryReq: 'Brief summary *',
      summaryPlaceholder: 'Had coffee, discussed upcoming trip and plans...',
      apiTitle: 'Analyzer settings',
      apiDesc:
        'When an API key is provided, note analysis and dossiers use the Gemini API. Without a key or offline, the built-in local analyzer runs automatically.',
      apiKeyLabel: 'Gemini API Key (optional)',
      summaryTitle: 'Summary',
      summaryLoadingSub: 'Compiling notes summary...',
      summaryEngineSub: (engine) => `Engine: ${engine}`,
      selectedContactFallback: 'Selected contact',
      allContacts: 'All contacts',
      buildingSummary: 'Building summary...',
      copyBtn: 'Copy',
      downloadTxt: 'Download .txt',
      refreshBtn: 'Refresh',
    },
    toasts: {
      guestMode: 'Local mode opened (data is stored only in this browser)',
      syncLocalNotice:
        'Changes saved locally. Click «Sync now» when back online.',
      deleteLocalNotice: 'Deletion saved locally and waiting for sync.',
      syncSuccess: 'Cloud sync completed successfully!',
      syncError: 'Cloud sync failed. Please check your connection.',
      tabCreated: (name) => `Contact «${name}» created`,
      deleteTabTitle: (name) => `Delete «${name}»?`,
      deleteTabMsg:
        'All sections, facts, contact timeline, and source notes for this person will be removed.',
      tabDeleted: (name) => `Contact «${name}» deleted`,
      colExists: 'A section with this title already exists',
      colAdded: (title) => `Section «${title}» added`,
      meetingSaved: 'Contact logged to timeline',
      meetingDeleted: 'Entry removed from timeline',
      enterText: 'Enter or paste text to analyze',
      enrichedReason: 'Enriched with details from new note',
      updatedReason: 'Updated based on new note',
      analysisSuccess: (added, inf, dups) =>
        `Facts added: ${added}, inferences: ${inf}${dups > 0 ? `, duplicates skipped: ${dups}` : ''}`,
      analysisDupsOnly: (dups) => `No duplicates added (${dups} skipped)`,
      analysisEmpty: 'No new facts found in text',
      analysisUndone: 'Last analysis undone',
      copied: 'Copied to clipboard',
      copyFailed: 'Could not copy text',
      copyUnsupported: 'Clipboard is not supported in this context',
      jsonExported: 'JSON backup downloaded',
      importLocalOnly: 'Imported locally — click «Sync now» to upload',
      jsonImported: (count) => `Contacts imported: ${count}`,
      jsonInvalid: 'Error: invalid JSON file format',
      dedupDone: (count) => `Removed duplicate facts: ${count}`,
      dedupNone: 'No duplicates found — all facts are unique',
      deleteColTitle: (title) => `Delete section «${title}»?`,
      deleteColMsg: (count) =>
        `All entries in this section (${count}) will be deleted.`,
      colDeleted: (title) => `Section «${title}» deleted`,
      similarFactExists: (colTitle) =>
        `A similar fact already exists in «${colTitle}»`,
      noteDeleted: 'Note removed from history',
      loggedOut: 'Signed out',
      logoutError: 'Failed to sign out',
      apiSaved: 'API key saved (Gemini AI active)',
      apiCleared: 'Key cleared',
      userKeyCleared: 'Custom API key cleared',
      txtDownloaded: '.txt file downloaded',
      summaryPlainTitle: 'AI DOSSIER & INSIGHTS',
      summaryGeneratedAt: 'Generated',
      manualEditReason: 'Edited manually',
      chatCleanedToast: 'Greetings and small talk removed — kept dates, tastes & plans',
      calendarExported: (title) => `Event «${title}» downloaded (.ics)`,
    },
    pwa: {
      installBtn: 'Install app',
      installTitle: 'Open Notebook as a standalone app without browser tabs',
      installedBadge: 'Installed as app',
      iosGuideTitle: 'Install on iPhone / iPad',
      iosStep1: 'Tap the Share button in the Safari toolbar',
      iosStep2: 'Choose "Add to Home Screen" → "Add"',
      offlineBanner: 'Offline mode — using saved notes and local analyzer',
    },
  },
};

export function getTranslations(lang: AppLang): Translations {
  return TRANSLATIONS[lang] || TRANSLATIONS.ru;
}

export function translateGroupLabel(group: string, lang: AppLang): string {
  const t = getTranslations(lang);
  if (group === 'Все') return t.groups.all;
  if (group === 'Семья') return t.groups.family;
  if (group === 'Друзья') return t.groups.friends;
  if (group === 'Работа') return t.groups.work;
  if (group === 'Университет') return t.groups.university;
  return group || t.groups.none;
}
