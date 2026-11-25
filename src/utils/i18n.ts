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
    openAdminAria: string;
    openAdminTitle: string;
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
    greetBtn: string;
    greetTitle: string;
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
    importChatBtn: string;
    importChatTitle: string;
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
    uidLabel: string;
    copyUidAria: string;
    uidCopiedToast: string;
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
    deleteAccountTitle: string;
    deleteAccountDesc: string;
    deleteAccountBtn: string;
    adminTitle: string;
    adminBadge: string;
    adminSharedAiLabel: string;
    adminSharedAiOn: string;
    adminSharedAiOff: string;
    adminSharedAiDesc: string;
    adminServerKeyReady: string;
    adminServerKeyMissing: string;
    adminToggleSavedOn: string;
    adminToggleSavedOff: string;
    adminToggleServerOnlyNote: string;
    adminToggleError: string;
    adminKeyRoutingTitle: string;
    adminKeyRoutingDesc: string;
    adminKeyRouteAuto: string;
    adminKeyRoutePrimary: string;
    adminKeyRouteBackup: string;
    adminKeyPrimarySlot: string;
    adminKeyBackupSlot: string;
    adminKeyPrimaryEnvHint: string;
    adminKeyBackupEnvHint: string;
    adminKeyCheckBtn: string;
    adminKeyCheckingBtn: string;
    adminKeyHealthOk: string;
    adminKeyHealthUntested: string;
    adminKeyHealthUnconfigured: string;
    adminKeyHealthCooldown: (seconds: number) => string;
    adminKeyHealthInvalid: string;
    adminKeyHealthError: string;
    adminKeyActiveTag: string;
    adminKeyStandbyTag: string;
    adminKeyLastFallbackNote: (fromLabel: string, toLabel: string, reason: string) => string;
    adminKeyRouteSaved: string;
    adminKeyRouteError: string;
    adminKeysCheckedOk: string;
    adminKeysCheckedMissing: string;
    adminKeysCheckError: string;
    openAdminPanelBtn: string;
    openAdminPanelDesc: string;
    feedbackBtn: string;
    feedbackTitle: string;
    feedbackTypeBug: string;
    feedbackTypeIdea: string;
    feedbackPlaceholder: string;
    feedbackSendBtn: string;
    feedbackSendingBtn: string;
    feedbackSentToast: string;
    feedbackErrorToast: string;
    myTicketsTitle: string;
    myTicketsEmpty: string;
    myTicketsReplyPrefix: string;
  };
  readOnly: {
    bannerTitle: string;
    blockedActionToast: string;
  };
  pollWidget: {
    badge: string;
    votedBadge: string;
    votesCount: (count: number) => string;
    dismissAria: string;
  };
  adminPanel: {
    title: string;
    tabs: {
      overview: string;
      limits: string;
      access: string;
      journal: string;
    };
    refreshBtn: string;
    loadingText: string;
    envTitle: string;
    uptimeLabel: string;
    modelLabel: string;
    rtdbLabel: string;
    rtdbOnline: (ms: number) => string;
    rtdbOffline: string;
    pwaLabel: string;
    kpiRequests: string;
    kpiAvgLatency: string;
    kpiTokens: string;
    kpiCacheHits: string;
    kpiDossierRebuilds: string;
    kpiTokensSaved: string;
    endpointsTitle: string;
    featuresTitle: string;
    featureLabels: {
      ai_analyze: string;
      dossier_single: string;
      dossier_all: string;
      chat_clean: string;
      calendar_ics: string;
      local_analyze: string;
    };
    digestTitle: string;
    digestActiveUsers: string;
    digestAiCalls: string;
    digestErrors: string;
    digestOpenTickets: string;
    guestAiLabel: string;
    guestAiDesc: string;
    readOnlyLabel: string;
    readOnlyDesc: string;
    modelSwitcherTitle: string;
    modelSwitcherDesc: string;
    modelSavedToast: string;
    modelPresets: {
      fast: { label: string; desc: string };
      balanced: { label: string; desc: string };
      accurate: { label: string; desc: string };
    };
    pingGeminiBtn: string;
    pingingGeminiBtn: string;
    pingQuotaExhausted: string;
    bannerTitle: string;
    bannerEnableLabel: string;
    bannerToneInfo: string;
    bannerToneWarning: string;
    bannerToneDanger: string;
    bannerPlaceholder: string;
    bannerPresetMaintenance: string;
    bannerPresetAiOff: string;
    bannerSaveBtn: string;
    bannerSavedToast: string;
    pollEditorTitle: string;
    pollEnableLabel: string;
    pollQuestionPlaceholder: string;
    pollOptionsLabel: string;
    pollResetVotes: string;
    pollSaveBtn: string;
    pollSavedToast: string;
    templateTitle: string;
    templateNameLabel: string;
    templateSubtitleLabel: string;
    templateGroupLabel: string;
    templateNoteLabel: string;
    templateFactsLabel: string;
    templateResetBtn: string;
    templateSaveBtn: string;
    templateSavedToast: string;
    webhookTitle: string;
    webhookUrlPlaceholder: string;
    webhookConfiguredMask: (target: string, provider: string) => string;
    webhookSaveBtn: string;
    webhookClearBtn: string;
    webhookTestBtn: string;
    webhookSendDigestBtn: string;
    webhookSavedToast: string;
    webhookTestOkToast: string;
    webhookErrorToast: string;
    triggers: {
      onInvalidKey: string;
      onQuotaExceeded: string;
      onTrafficSpike: string;
      onNewUser: string;
      onNewTicket: string;
      dailyDigestEnabled: string;
    };
    inboxTitle: string;
    inboxEmpty: string;
    ticketBug: string;
    ticketIdea: string;
    ticketStatusOpen: string;
    ticketStatusResolved: string;
    ticketResolveBtn: string;
    ticketReopenBtn: string;
    ticketPublishBannerBtn: string;
    ticketReplyPlaceholder: string;
    ticketFilterAll: string;
    ticketTags: {
      urgent: string;
      in_progress: string;
      fixed: string;
    };
    cannedReplies: string[];
    requestsLogTitle: string;
    requestsLogEmpty: string;
    eventsLogTitle: string;
    eventsLogEmpty: string;
    accessControlTitle: string;
    accessControlDesc: string;
    accessCurrentUidLabel: string;
    accessExtraUidsLabel: string;
    accessExtraUidsPlaceholder: string;
    accessExtraEmailsLabel: string;
    accessExtraEmailsPlaceholder: string;
    accessSaveBtn: string;
    accessSavedToast: string;
    ramLabel: string;
    cacheLabel: string;
    clearCacheBtn: string;
    clearingCacheBtn: string;
    cacheClearedToast: string;
    servicesTitle: string;
    serviceRtdb: string;
    serviceAuth: string;
    serviceGemini: string;
    serviceOk: string;
    serviceFail: string;
    probeServicesBtn: string;
    probingServicesBtn: string;
    errorsBreakdownTitle: string;
    errQuota429: string;
    errTimeout503: string;
    errAuthKey: string;
    errNetworkOther: string;
    heatmapTitle: string;
    heatmapHoursLabel: string;
    heatmapWeekdaysLabel: string;
    weekdayShort: string[];
    exportTitle: string;
    exportCsvBtn: string;
    exportJsonBtn: string;
    exportedToast: string;
    promptStyleTitle: string;
    promptVerbosityLabel: string;
    promptVerbosityConcise: string;
    promptVerbosityDetailed: string;
    promptGranularityLabel: string;
    promptGranularityAtomic: string;
    promptGranularityGrouped: string;
    promptStyleSavedToast: string;
    minVersionTitle: string;
    minVersionDesc: string;
    minVersionPlaceholder: string;
    minVersionSaveBtn: string;
    minVersionSavedToast: string;
    uiDefaultsTitle: string;
    uiDefaultsGroupsLabel: string;
    uiDefaultsSectionsLabel: string;
    uiDefaultsPromptsLabel: string;
    uiDefaultsSaveBtn: string;
    uiDefaultsResetBtn: string;
    uiDefaultsSavedToast: string;
    digestHourLabel: string;
    backupTitle: string;
    backupExportBtn: string;
    backupImportBtn: string;
    backupExportedToast: string;
    backupImportedToast: string;
    backupImportErrorToast: string;
  };
  deleteAccount: {
    modalTitle: string;
    stepCounter: (step: number, total: number) => string;
    targetAccountLabel: string;
    contactsCountWarning: (count: number) => string;
    step1Heading: string;
    step1Warning: string;
    backupHint: string;
    backupBtn: string;
    step1Checkbox: string;
    step2Heading: string;
    step2Instruction: (keyword: string) => string;
    step2Placeholder: (keyword: string) => string;
    step3Heading: string;
    step3Instruction: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    hidePassword: string;
    showPassword: string;
    emptyPasswordError: string;
    backBtn: string;
    nextBtn: string;
    confirmDeleteBtn: string;
    deletingBtn: string;
    deletedToast: string;
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
    analyzerModeLabel: string;
    analyzerModeAuto: string;
    analyzerModeAutoDesc: string;
    analyzerModeLocal: string;
    analyzerModeLocalDesc: string;
    analyzerStatusLabel: string;
    analyzerStatusReady: string;
    analyzerStatusDisabled: string;
    analyzerStatusNoKey: string;
    summaryTitle: string;
    summaryLoadingSub: string;
    summaryEngineSub: (engine: string) => string;
    selectedContactFallback: string;
    allContacts: string;
    buildingSummary: string;
    copyBtn: string;
    downloadTxt: string;
    refreshBtn: string;
    greetModalTitle: (name: string) => string;
    greetOccasionLabel: string;
    greetOccasions: {
      birthday: string;
      reconnect: string;
      invite: string;
    };
    greetToneLabel: string;
    greetTones: {
      warm: string;
      friendly: string;
      formal: string;
    };
    greetGenerateBtn: string;
    greetGeneratingBtn: string;
    greetResultLabel: string;
    shareModalTitle: string;
    shareModalDesc: string;
    shareTargetSelectLabel: string;
    shareNewContactOption: string;
    shareTextLabel: string;
    shareAnalyzeBtn: string;
    defaultSectionsSuggestLabel: string;
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
    vcardImported: (count: number) => string;
    vcardEmpty: string;
    chatImported: (count: number) => string;
    chatImportInvalid: string;
    dedupDone: (count: number) => string;
    dedupNone: string;
    deleteColTitle: (title: string) => string;
    deleteColMsg: (count: number) => string;
    colDeleted: (title: string) => string;
    similarFactExists: (colTitle: string) => string;
    noteDeleted: string;
    loggedOut: string;
    logoutError: string;
    modeSavedAuto: string;
    modeSavedLocal: string;
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
    updateBannerText: (minVersion: string) => string;
    updateNowBtn: string;
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
      namePlaceholder: 'Например: Алекс',
      loginLabel: 'Логин или Email',
      loginPlaceholder: 'alex или alex@mail.com',
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
      importAria: 'Импорт JSON или vCard (.vcf)',
      importTitle: 'Загрузить копию (JSON) или визитку (.vcf)',
      apiAria: 'Настройки анализатора',
      apiTitle: 'Настройки анализатора',
      openAdminAria: 'Открыть админ-панель',
      openAdminTitle: 'Админ-панель',
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
      greetBtn: 'Написать',
      greetTitle: 'Составить поздравление или первое сообщение',
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
      importChatBtn: 'Из файла',
      importChatTitle: 'Загрузить переписку (.txt или Telegram .json)',
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
      uidLabel: 'Firebase UID',
      copyUidAria: 'Скопировать Firebase UID',
      uidCopiedToast: 'UID скопирован в буфер обмена',
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
      deleteAccountTitle: 'Опасная зона',
      deleteAccountDesc:
        'Полное удаление аккаунта и всех облачных заметок без возможности восстановления.',
      deleteAccountBtn: 'Удалить аккаунт',
      adminTitle: 'Панель администратора',
      adminBadge: 'Админ',
      adminSharedAiLabel: 'Общий облачный ИИ для всех',
      adminSharedAiOn: 'Включён',
      adminSharedAiOff: 'Отключён',
      adminSharedAiDesc:
        'Когда выключено, сервер не обращается к Gemini, а все пользователи автоматически работают на встроенном локальном анализаторе.',
      adminServerKeyReady: 'Серверный ключ Gemini активен',
      adminServerKeyMissing: 'Серверный GEMINI_API_KEY не задан в Secrets',
      adminToggleSavedOn: 'Общий облачный ИИ включён для всех',
      adminToggleSavedOff: 'Общий облачный ИИ отключён — у всех локальный разбор',
      adminToggleServerOnlyNote:
        'Переключено на сервере. Чтобы состояние сохранялось при перезапуске, проверьте правила appConfig в Firebase.',
      adminToggleError: 'Не удалось переключить общий ИИ',
      adminKeyRoutingTitle: 'Серверные ключи и fallback',
      adminKeyRoutingDesc:
        'В режиме «Авто» при сбое, нехватке квоты или ошибке основного ключа сервер мгновенно переключается на запасной без падения запроса.',
      adminKeyRouteAuto: 'Авто + резерв',
      adminKeyRoutePrimary: 'Основной',
      adminKeyRouteBackup: 'Резервный',
      adminKeyPrimarySlot: 'Основной слот',
      adminKeyBackupSlot: 'Запасной слот',
      adminKeyPrimaryEnvHint: 'GEMINI_API_KEY',
      adminKeyBackupEnvHint: 'GEMINI_API_KEY_BACKUP',
      adminKeyCheckBtn: 'Проверить ключи',
      adminKeyCheckingBtn: 'Проверка...',
      adminKeyHealthOk: 'Работает',
      adminKeyHealthUntested: 'Задан',
      adminKeyHealthUnconfigured: 'Не задан',
      adminKeyHealthCooldown: (seconds) => `Пауза ${seconds}с`,
      adminKeyHealthInvalid: 'Неверный',
      adminKeyHealthError: 'Ошибка',
      adminKeyActiveTag: 'Активен',
      adminKeyStandbyTag: 'В резерве',
      adminKeyLastFallbackNote: (fromLabel, toLabel, reason) =>
        `Автопереход: ${fromLabel} → ${toLabel} (${reason})`,
      adminKeyRouteSaved: 'Режим маршрутизации ключей обновлён',
      adminKeyRouteError: 'Не удалось сменить режим ключей',
      adminKeysCheckedOk: 'Проверка серверных ключей завершена',
      adminKeysCheckedMissing: 'Ни один серверный ключ не настроен или не прошёл проверку',
      adminKeysCheckError: 'Не удалось выполнить проверку ключей',
      openAdminPanelBtn: 'Открыть админку',
      openAdminPanelDesc: 'Обзор, лимиты, баннеры, стартовый шаблон, вебхуки и входящие тикеты',
      feedbackBtn: 'Сообщить о проблеме / Предложить идею',
      feedbackTitle: 'Обратная связь',
      feedbackTypeBug: 'Проблема',
      feedbackTypeIdea: 'Идея',
      feedbackPlaceholder: 'Опишите ошибку или предложение по улучшению...',
      feedbackSendBtn: 'Отправить',
      feedbackSendingBtn: 'Отправка...',
      feedbackSentToast: 'Обращение отправлено администратору',
      feedbackErrorToast: 'Не удалось отправить обращение',
      myTicketsTitle: 'Мои обращения и ответы',
      myTicketsEmpty: 'Вы ещё не отправляли обращений с этого устройства',
      myTicketsReplyPrefix: 'Ответ администратора:',
    },
    readOnly: {
      bannerTitle: 'Режим «Только чтение»: редактирование и запись в облако временно отключены на время обслуживания.',
      blockedActionToast: 'Включён режим «Только чтение» — изменения временно заблокированы',
    },
    pollWidget: {
      badge: 'Мини-опрос',
      votedBadge: 'Голос учтён',
      votesCount: (count) => `Голосов: ${count}`,
      dismissAria: 'Скрыть опрос',
    },
    adminPanel: {
      title: 'Админ-панель',
      tabs: {
        overview: 'Обзор',
        limits: 'Лимиты и флаги',
        access: 'Доступ',
        journal: 'Журнал',
      },
      refreshBtn: 'Обновить',
      loadingText: 'Загрузка телеметрии...',
      envTitle: 'Статус окружения',
      uptimeLabel: 'Аптайм сервера',
      modelLabel: 'Модель Gemini',
      rtdbLabel: 'Firebase RTDB',
      rtdbOnline: (ms) => `Подключено · ${ms} мс`,
      rtdbOffline: 'Нет связи',
      pwaLabel: 'PWA / Кэш',
      kpiRequests: 'Запросы AI',
      kpiAvgLatency: 'Ср. задержка',
      kpiTokens: 'Всего токенов',
      kpiCacheHits: 'Попаданий в кэш',
      kpiDossierRebuilds: 'Запросов досье',
      kpiTokensSaved: 'Сэкономлено ток.',
      endpointsTitle: 'Скорость и токены по эндпоинтам',
      featuresTitle: 'Популярность функций',
      featureLabels: {
        ai_analyze: 'AI-анализ заметок',
        dossier_single: 'Досье (1 контакт)',
        dossier_all: 'Общее досье',
        chat_clean: 'Чистка переписок',
        calendar_ics: 'Экспорт в .ics',
        local_analyze: 'Локальный режим',
      },
      digestTitle: 'Ежедневная мини-сводка',
      digestActiveUsers: 'Активных сегодня',
      digestAiCalls: 'Запросов Gemini',
      digestErrors: 'Ошибок AI',
      digestOpenTickets: 'Открытых тикетов',
      guestAiLabel: 'Облачный ИИ для гостей',
      guestAiDesc: 'Запретите, чтобы неавторизованные гости не расходовали общий серверный ключ Gemini.',
      readOnlyLabel: 'Режим «Только чтение» (Read-Only)',
      readOnlyDesc: 'Блокирует редактирование контактов и запись в облако на время миграции или техработ.',
      modelSwitcherTitle: 'Модель Gemini',
      modelSwitcherDesc: 'Переключайте скорость и глубину анализа на лету — без правки кода и повторного деплоя.',
      modelSavedToast: 'Модель Gemini обновлена',
      modelPresets: {
        fast: {
          label: 'Быстрая',
          desc: 'Минимальная задержка и экономия квоты',
        },
        balanced: {
          label: 'Стандарт',
          desc: 'Оптимальный баланс скорости и точности',
        },
        accurate: {
          label: 'Точная',
          desc: 'Глубокий анализ сложных заметок и досье',
        },
      },
      pingGeminiBtn: 'Проверить Gemini',
      pingingGeminiBtn: 'Проверка...',
      pingQuotaExhausted: 'Квота исчерпана',
      bannerTitle: 'Глобальное объявление (баннер)',
      bannerEnableLabel: 'Показывать всем',
      bannerToneInfo: 'Инфо',
      bannerToneWarning: 'Внимание',
      bannerToneDanger: 'Критично',
      bannerPlaceholder: 'Например: Технические работы с 22:00...',
      bannerPresetMaintenance: 'Технические работы',
      bannerPresetAiOff: 'Облачный AI временно отключён',
      bannerSaveBtn: 'Применить баннер',
      bannerSavedToast: 'Глобальное объявление обновлено',
      pollEditorTitle: 'Мини-опрос пользователей',
      pollEnableLabel: 'Активен',
      pollQuestionPlaceholder: 'Вопрос для голосования (например: Какую фичу добавить?)',
      pollOptionsLabel: 'Варианты (по одному в строке, 2–5 шт.)',
      pollResetVotes: 'Сбросить голоса',
      pollSaveBtn: 'Сохранить опрос',
      pollSavedToast: 'Опрос обновлён',
      templateTitle: 'Стартовый пример контакта',
      templateNameLabel: 'Имя демо-контакта',
      templateSubtitleLabel: 'Подзаголовок',
      templateGroupLabel: 'Группа',
      templateNoteLabel: 'Текст для кнопки «Вставить пример»',
      templateFactsLabel: 'Факты (формат: Категория | Эмодзи | Текст факта)',
      templateResetBtn: 'Сбросить',
      templateSaveBtn: 'Сохранить шаблон',
      templateSavedToast: 'Стартовый пример обновлён',
      webhookTitle: 'Алерты в Telegram / Discord / Webhook',
      webhookUrlPlaceholder: 'https://discord.com/api/webhooks/... или api.telegram.org/bot.../sendMessage?chat_id=...',
      webhookConfiguredMask: (target, provider) => `Подключён (${provider}): ${target}`,
      webhookSaveBtn: 'Сохранить вебхук',
      webhookClearBtn: 'Отключить',
      webhookTestBtn: 'Тест алерта',
      webhookSendDigestBtn: 'Отправить сводку',
      webhookSavedToast: 'Настройки алертов сохранены',
      webhookTestOkToast: 'Сообщение успешно отправлено',
      webhookErrorToast: 'Ошибка отправки или небезопасный HTTPS URL',
      triggers: {
        onInvalidKey: 'Неверный ключ Gemini',
        onQuotaExceeded: 'Исчерпание квоты (429)',
        onTrafficSpike: 'Всплеск запросов',
        onNewUser: 'Новый пользователь',
        onNewTicket: 'Новый тикет',
        dailyDigestEnabled: 'Ежедневная мини-сводка',
      },
      inboxTitle: 'Входящие тикеты пользователей',
      inboxEmpty: 'Обращений пока нет',
      ticketBug: 'Проблема',
      ticketIdea: 'Идея',
      ticketStatusOpen: 'Открыт',
      ticketStatusResolved: 'Решён',
      ticketResolveBtn: 'Решено',
      ticketReopenBtn: 'Открыть снова',
      ticketPublishBannerBtn: 'Ответить в баннере',
      ticketReplyPlaceholder: 'Краткий ответ (необязательно)...',
      ticketFilterAll: 'Все',
      ticketTags: {
        urgent: 'Срочно',
        in_progress: 'В работе',
        fixed: 'Исправлено',
      },
      cannedReplies: [
        'Исправили, обновите страницу',
        'Приняли в работу',
        'Добавлено в ближайший план',
      ],
      requestsLogTitle: 'Последние запросы к Gemini',
      requestsLogEmpty: 'Запросов к Gemini ещё не было',
      eventsLogTitle: 'Системный журнал',
      eventsLogEmpty: 'Событий пока нет',
      accessControlTitle: 'Доступ к админ-панели (другие браузеры и устройства)',
      accessControlDesc: 'Если вы входите под другим аккаунтом на втором устройстве или в другом браузере, добавьте его Firebase UID или подтверждённый Email.',
      accessCurrentUidLabel: 'Ваш текущий UID',
      accessExtraUidsLabel: 'Дополнительные Firebase UID (через запятую или с новой строки)',
      accessExtraUidsPlaceholder: 'Например: xYz123AbC...',
      accessExtraEmailsLabel: 'Дополнительные подтверждённые Email',
      accessExtraEmailsPlaceholder: 'admin@example.com',
      accessSaveBtn: 'Сохранить доступ',
      accessSavedToast: 'Список доступа администраторов обновлён',
      ramLabel: 'Память / AI-кэш',
      cacheLabel: 'Кэш',
      clearCacheBtn: 'Очистить AI-кэш',
      clearingCacheBtn: 'Очистка...',
      cacheClearedToast: 'AI-кэш Советника и Досье очищен',
      servicesTitle: 'Здоровье сервисов',
      serviceRtdb: 'Firebase RTDB',
      serviceAuth: 'Google Auth',
      serviceGemini: 'Gemini API',
      serviceOk: 'ОК',
      serviceFail: 'Сбой',
      probeServicesBtn: 'Проверить всё',
      probingServicesBtn: 'Пинг...',
      errorsBreakdownTitle: 'Ошибки за всё время по кодам',
      errQuota429: '429 Квота',
      errTimeout503: 'Таймаут / 503',
      errAuthKey: 'Ключ / 403',
      errNetworkOther: 'Сеть / прочее',
      heatmapTitle: 'Нагрузка по часам (UTC) и дням недели',
      heatmapHoursLabel: 'По часам суток (00–23 UTC)',
      heatmapWeekdaysLabel: 'По дням недели',
      weekdayShort: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
      exportTitle: 'Экспорт журнала и статистики',
      exportCsvBtn: 'Скачать CSV',
      exportJsonBtn: 'Скачать JSON',
      exportedToast: 'Файл выгружен',
      promptStyleTitle: 'Стиль ответов Gemini',
      promptVerbosityLabel: 'Советник',
      promptVerbosityConcise: 'Короткие ответы',
      promptVerbosityDetailed: 'Подробные ответы',
      promptGranularityLabel: 'Разбор фактов',
      promptGranularityAtomic: 'Дробно (атомарно)',
      promptGranularityGrouped: 'Крупнее (группами)',
      promptStyleSavedToast: 'Стиль промптов Gemini сохранён',
      minVersionTitle: 'Версия клиента и мягкое обновление PWA',
      minVersionDesc: 'Если у пользователя кэш старше указанной версии, покажется кнопка «Обновить сейчас».',
      minVersionPlaceholder: '2.4.0',
      minVersionSaveBtn: 'Применить версию',
      minVersionSavedToast: 'Минимальная версия PWA обновлена',
      uiDefaultsTitle: 'Дефолтные группы, разделы и подсказки советника',
      uiDefaultsGroupsLabel: 'Стандартные группы (по одной или через запятую)',
      uiDefaultsSectionsLabel: 'Быстрые разделы (Название | Эмодзи)',
      uiDefaultsPromptsLabel: 'Быстрые вопросы под советником (по одному в строке)',
      uiDefaultsSaveBtn: 'Сохранить настройки UI',
      uiDefaultsResetBtn: 'Сбросить',
      uiDefaultsSavedToast: 'Дефолтные разделы и подсказки обновлены',
      digestHourLabel: 'Час автосводки (UTC)',
      backupTitle: 'Бэкап и перенос конфигурации админки (1 клик)',
      backupExportBtn: 'Скачать конфиг JSON',
      backupImportBtn: 'Восстановить из JSON',
      backupExportedToast: 'Конфигурация админки скачана',
      backupImportedToast: 'Конфигурация админки успешно восстановлена',
      backupImportErrorToast: 'Ошибка чтения или неверный формат файла конфига',
    },
    deleteAccount: {
      modalTitle: 'Удаление аккаунта',
      stepCounter: (step, total) => `Шаг ${step} из ${total}`,
      targetAccountLabel: 'Аккаунт:',
      contactsCountWarning: (count) => `Контактов в облаке: ${count}`,
      step1Heading: 'Проверьте последствия перед продолжением',
      step1Warning:
        'Аккаунт, все карточки людей, факты, важные даты и хронология встреч будут удалены из облака и этого браузера безвозвратно.',
      backupHint: 'Если данные могут пригодиться позже, сначала скачайте копию:',
      backupBtn: 'Скачать резервную копию (JSON)',
      step1Checkbox:
        'Я понимаю, что восстановить аккаунт и заметки будет невозможно',
      step2Heading: 'Подтвердите удаление контрольным словом',
      step2Instruction: (keyword) =>
        `Чтобы исключить случайное нажатие, введите слово «${keyword}» в поле ниже:`,
      step2Placeholder: (keyword) => `Введите ${keyword}`,
      step3Heading: 'Финальная проверка: введите пароль',
      step3Instruction:
        'Последний шаг. Введите текущий пароль от аккаунта для окончательного удаления:',
      passwordLabel: 'Текущий пароль',
      passwordPlaceholder: 'Введите пароль',
      hidePassword: 'Скрыть пароль',
      showPassword: 'Показать пароль',
      emptyPasswordError: 'Введите текущий пароль для подтверждения удаления',
      backBtn: 'Назад',
      nextBtn: 'Продолжить',
      confirmDeleteBtn: 'Удалить аккаунт навсегда',
      deletingBtn: 'Удаление...',
      deletedToast: 'Аккаунт и все данные удалены',
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
        'Общий облачный ИИ работает на сервере без ручного ввода ключей. При отключении или отсутствии сети всегда доступен локальный разбор.',
      analyzerModeLabel: 'Режим работы',
      analyzerModeAuto: 'Авто (Облачный ИИ + локальный резерв)',
      analyzerModeAutoDesc:
        'Использует серверный Gemini, если он включён администратором и есть интернет.',
      analyzerModeLocal: 'Только локально',
      analyzerModeLocalDesc:
        'Заметки никогда не отправляются на сервер — работает только локальный движок.',
      analyzerStatusLabel: 'Статус облачного ИИ',
      analyzerStatusReady: 'Доступен для всех',
      analyzerStatusDisabled: 'Отключён администратором',
      analyzerStatusNoKey: 'Серверный ключ не настроен',
      summaryTitle: 'Сводка',
      summaryLoadingSub: 'Собираем сводку по заметкам...',
      summaryEngineSub: (engine) => `Источник: ${engine}`,
      selectedContactFallback: 'Выбранный контакт',
      allContacts: 'Все контакты',
      buildingSummary: 'Формирование сводки...',
      copyBtn: 'Скопировать',
      downloadTxt: 'Скачать .txt',
      refreshBtn: 'Обновить',
      greetModalTitle: (name) => `Сообщение для ${name}`,
      greetOccasionLabel: 'Повод',
      greetOccasions: {
        birthday: 'День рождения',
        reconnect: 'Написать после перерыва',
        invite: 'Пригласить на встречу',
      },
      greetToneLabel: 'Тон',
      greetTones: {
        warm: 'Тёплый и душевный',
        friendly: 'Дружеский',
        formal: 'Уважительный',
      },
      greetGenerateBtn: 'Улучшить через ИИ',
      greetGeneratingBtn: 'Составляю...',
      greetResultLabel: 'Готовый черновик',
      shareModalTitle: 'Быстрая запись (Поделиться)',
      shareModalDesc: 'Выберите контакт, чтобы сохранить и разобрать переданный текст.',
      shareTargetSelectLabel: 'Куда сохранить',
      shareNewContactOption: '+ Новый контакт из текста',
      shareTextLabel: 'Переданный текст',
      shareAnalyzeBtn: 'Разобрать в карточку',
      defaultSectionsSuggestLabel: 'Быстрый выбор:',
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
      vcardImported: (count) => `Импортировано визиток (.vcf): ${count}`,
      vcardEmpty: 'В файле .vcf не найдено контактов',
      chatImported: (count) => `Загружена переписка из файла (сообщений: ${count})`,
      chatImportInvalid: 'Файл пуст или имеет неподдерживаемый формат',
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
      modeSavedAuto: 'Включён авторежим (облачный ИИ + локальный резерв)',
      modeSavedLocal: 'Включён полностью локальный режим анализа',
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
      updateBannerText: (minVersion) => `Доступна новая версия приложения (v${minVersion}). Обновите кэш, чтобы увидеть свежие улучшения.`,
      updateNowBtn: 'Обновить сейчас',
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
      namePlaceholder: 'Мысалы: Алекс',
      loginLabel: 'Логин немесе Email',
      loginPlaceholder: 'alex немесе alex@mail.com',
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
      importAria: 'JSON немесе vCard (.vcf) импорт',
      importTitle: 'Көшірме (JSON) немесе визитка (.vcf) жүктеу',
      apiAria: 'Талдағыш баптаулары',
      apiTitle: 'Талдағыш баптаулары',
      openAdminAria: 'Әкімші панелін ашу',
      openAdminTitle: 'Әкімші панелі',
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
      greetBtn: 'Жазу',
      greetTitle: 'Құттықтау немесе алғашқы хабарлама құрастыру',
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
      importChatBtn: 'Файлдан',
      importChatTitle: 'Хат алмасуды жүктеу (.txt немесе Telegram .json)',
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
      uidLabel: 'Firebase UID',
      copyUidAria: 'Firebase UID көшіру',
      uidCopiedToast: 'UID алмасу буферіне көшірілді',
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
      deleteAccountTitle: 'Қауіпті аймақ',
      deleteAccountDesc:
        'Аккаунтты және бұлттағы барлық жазбаларды қалпына келтіру мүмкіндігінсіз толық жою.',
      deleteAccountBtn: 'Аккаунтты жою',
      adminTitle: 'Әкімші панелі',
      adminBadge: 'Әкімші',
      adminSharedAiLabel: 'Барлығына ортақ бұлтты AI',
      adminSharedAiOn: 'Қосулы',
      adminSharedAiOff: 'Өшірулі',
      adminSharedAiDesc:
        'Өшірілген кезде сервер Gemini-ге жүгінбейді, ал барлық пайдаланушылар жергілікті талдағышта жұмыс істейді.',
      adminServerKeyReady: 'Сервердегі Gemini кілті белсенді',
      adminServerKeyMissing: 'Сервердегі GEMINI_API_KEY құпияларда бапталмаған',
      adminToggleSavedOn: 'Ортақ бұлтты AI барлығы үшін қосылды',
      adminToggleSavedOff: 'Ортақ бұлтты AI өшірілді — барлығында жергілікті талдау',
      adminToggleServerOnlyNote:
        'Серверде ауыстырылды. Қайта жүктеуден кейін сақталуы үшін Firebase appConfig ережелерін тексеріңіз.',
      adminToggleError: 'Ортақ AI күйін өзгерту мүмкін болмады',
      adminKeyRoutingTitle: 'Сервер кілттері және резерв (fallback)',
      adminKeyRoutingDesc:
        '«Авто» режимінде негізгі кілтте қате немесе лимит шегі болса, сервер сұрауды тоқтатпай қосалқы кілтке бірден ауысады.',
      adminKeyRouteAuto: 'Авто + резерв',
      adminKeyRoutePrimary: 'Негізгі',
      adminKeyRouteBackup: 'Резервтік',
      adminKeyPrimarySlot: 'Негізгі слот',
      adminKeyBackupSlot: 'Резервтік слот',
      adminKeyPrimaryEnvHint: 'GEMINI_API_KEY',
      adminKeyBackupEnvHint: 'GEMINI_API_KEY_BACKUP',
      adminKeyCheckBtn: 'Кілттерді тексеру',
      adminKeyCheckingBtn: 'Тексерілуде...',
      adminKeyHealthOk: 'Жұмыс істейді',
      adminKeyHealthUntested: 'Орнатылған',
      adminKeyHealthUnconfigured: 'Жоқ',
      adminKeyHealthCooldown: (seconds) => `Кідіріс ${seconds}с`,
      adminKeyHealthInvalid: 'Жарамсыз',
      adminKeyHealthError: 'Қате',
      adminKeyActiveTag: 'Белсенді',
      adminKeyStandbyTag: 'Резервте',
      adminKeyLastFallbackNote: (fromLabel, toLabel, reason) =>
        `Автоауысу: ${fromLabel} → ${toLabel} (${reason})`,
      adminKeyRouteSaved: 'Кілттерді бағыттау режимі жаңартылды',
      adminKeyRouteError: 'Кілт режимін өзгерту сәтсіз аяқталды',
      adminKeysCheckedOk: 'Сервер кілттерін тексеру аяқталды',
      adminKeysCheckedMissing: 'Белсенді сервер кілттері табылмады немесе тексеруден өтпеді',
      adminKeysCheckError: 'Сервер кілттерін тексеру мүмкін болмады',
      openAdminPanelBtn: 'Әкімші панелін ашу',
      openAdminPanelDesc: 'Шолу, шектеулер, баннер, үлгі контакт, вебхуктер және тикеттер',
      feedbackBtn: 'Мәселе хабарлау / Идея ұсыну',
      feedbackTitle: 'Кері байланыс',
      feedbackTypeBug: 'Мәселе',
      feedbackTypeIdea: 'Идея',
      feedbackPlaceholder: 'Қатені немесе ұсынысыңызды қысқаша жазыңыз...',
      feedbackSendBtn: 'Жіберу',
      feedbackSendingBtn: 'Жіберілуде...',
      feedbackSentToast: 'Хабарлама әкімшіге жіберілді',
      feedbackErrorToast: 'Хабарламаны жіберу сәтсіз аяқталды',
      myTicketsTitle: 'Менің өтініштерім және жауаптар',
      myTicketsEmpty: 'Бұл құрылғыдан әзірге өтініштер жіберілген жоқ',
      myTicketsReplyPrefix: 'Әкімші жауабы:',
    },
    readOnly: {
      bannerTitle: '«Тек оқу» режимі: қызмет көрсету кезінде бұлтқа жазу және өңдеу уақытша шектелді.',
      blockedActionToast: '«Тек оқу» режимі қосулы — өзгерістер уақытша бұғатталған',
    },
    pollWidget: {
      badge: 'Шағын сауалнама',
      votedBadge: 'Дауыс есептелді',
      votesCount: (count) => `Дауыстар: ${count}`,
      dismissAria: 'Сауалнаманы жасыру',
    },
    adminPanel: {
      title: 'Әкімші панелі',
      tabs: {
        overview: 'Шолу',
        limits: 'Шектеулер және жалаушалар',
        access: 'Қолжетімділік',
        journal: 'Журнал',
      },
      refreshBtn: 'Жаңарту',
      loadingText: 'Телеметрия жүктелуде...',
      envTitle: 'Орта күйі',
      uptimeLabel: 'Сервер аптаймы',
      modelLabel: 'Gemini моделі',
      rtdbLabel: 'Firebase RTDB',
      rtdbOnline: (ms) => `Қосылды · ${ms} мс`,
      rtdbOffline: 'Байланыс жоқ',
      pwaLabel: 'PWA / Кэш',
      kpiRequests: 'AI сұраулары',
      kpiAvgLatency: 'Орт. кідіріс',
      kpiTokens: 'Барлық токен',
      kpiCacheHits: 'Кэштен алынды',
      kpiDossierRebuilds: 'Досье саны',
      kpiTokensSaved: 'Үнемделген ток.',
      endpointsTitle: 'Эндпоинттер бойынша токендер мен жылдамдық',
      featuresTitle: 'Функциялар жиілігі',
      featureLabels: {
        ai_analyze: 'AI-талдау',
        dossier_single: 'Досье (1 контакт)',
        dossier_all: 'Жалпы досье',
        chat_clean: 'Хат тазалау',
        calendar_ics: 'Күнтізбе .ics',
        local_analyze: 'Жергілікті режим',
      },
      digestTitle: 'Күнделікті шағын есеп',
      digestActiveUsers: 'Бүгінгі белсенділер',
      digestAiCalls: 'Gemini сұраулары',
      digestErrors: 'AI қателері',
      digestOpenTickets: 'Ашық тикеттер',
      guestAiLabel: 'Қонақтар үшін бұлтты AI',
      guestAiDesc: 'Тіркелмеген қонақтардың ортақ сервер кілтін жұмсауын шектеу.',
      readOnlyLabel: '«Тек оқу» режимі (Read-Only)',
      readOnlyDesc: 'Дерекқорды көшіру кезінде бұлтқа жазу мен өңдеуді уақытша тоқтатады.',
      modelSwitcherTitle: 'Gemini моделі',
      modelSwitcherDesc: 'Кодты өңдемей және қайта деплой жасамай жылдам немесе дәл модельді таңдаңыз.',
      modelSavedToast: 'Gemini моделі жаңартылды',
      modelPresets: {
        fast: {
          label: 'Жылдам',
          desc: 'Ең аз кідіріс және квотаны үнемдеу',
        },
        balanced: {
          label: 'Стандарт',
          desc: 'Жылдамдық пен сапа теңгерімі',
        },
        accurate: {
          label: 'Дәл',
          desc: 'Күрделі жазбалар мен досьені терең талдау',
        },
      },
      pingGeminiBtn: 'Gemini тексеру',
      pingingGeminiBtn: 'Тексерілуде...',
      pingQuotaExhausted: 'Квота бітті',
      bannerTitle: 'Жалпы хабарландыру (баннер)',
      bannerEnableLabel: 'Барлығына көрсету',
      bannerToneInfo: 'Ақпарат',
      bannerToneWarning: 'Ескерту',
      bannerToneDanger: 'Маңызды',
      bannerPlaceholder: 'Мысалы: Техникалық жұмыстар...',
      bannerPresetMaintenance: 'Техникалық жұмыстар',
      bannerPresetAiOff: 'Бұлтты AI уақытша өшірілді',
      bannerSaveBtn: 'Баннерді сақтау',
      bannerSavedToast: 'Жалпы хабарландыру жаңартылды',
      pollEditorTitle: 'Пайдаланушылар сауалнамасы',
      pollEnableLabel: 'Белсенді',
      pollQuestionPlaceholder: 'Дауыс беру сұрағы...',
      pollOptionsLabel: 'Нұсқалар (әр жолда біреуден, 2–5 дана)',
      pollResetVotes: 'Дауыстарды нөлдеу',
      pollSaveBtn: 'Сауалнаманы сақтау',
      pollSavedToast: 'Сауалнама жаңартылды',
      templateTitle: 'Бастапқы контакт үлгісі',
      templateNameLabel: 'Демо контакт аты',
      templateSubtitleLabel: 'Қосымша атауы',
      templateGroupLabel: 'Топ',
      templateNoteLabel: '«Үлгіні қою» мәтіні',
      templateFactsLabel: 'Деректер (формат: Санат | Эмодзи | Мәтін)',
      templateResetBtn: 'Қалпына келтіру',
      templateSaveBtn: 'Үлгіні сақтау',
      templateSavedToast: 'Бастапқы контакт үлгісі жаңартылды',
      webhookTitle: 'Telegram / Discord / Webhook ескертулері',
      webhookUrlPlaceholder: 'https://discord.com/api/webhooks/... немесе api.telegram.org/bot.../sendMessage?chat_id=...',
      webhookConfiguredMask: (target, provider) => `Қосылған (${provider}): ${target}`,
      webhookSaveBtn: 'Сақтау',
      webhookClearBtn: 'Өшіру',
      webhookTestBtn: 'Тест хабарлама',
      webhookSendDigestBtn: 'Есепті жіберу',
      webhookSavedToast: 'Ескерту баптаулары сақталды',
      webhookTestOkToast: 'Сәтті жіберілді',
      webhookErrorToast: 'Жіберу қатесі немесе қауіпсіз емес HTTPS URL',
      triggers: {
        onInvalidKey: 'Жарамсыз Gemini кілті',
        onQuotaExceeded: 'Квота шегі (429)',
        onTrafficSpike: 'Сұраулардың күрт өсуі',
        onNewUser: 'Жаңа тіркелу',
        onNewTicket: 'Жаңа тикет',
        dailyDigestEnabled: 'Күнделікті есеп',
      },
      inboxTitle: 'Пайдаланушы тикеттері',
      inboxEmpty: 'Әзірге өтініштер жоқ',
      ticketBug: 'Мәселе',
      ticketIdea: 'Идея',
      ticketStatusOpen: 'Ашық',
      ticketStatusResolved: 'Шешілді',
      ticketResolveBtn: 'Шешілді',
      ticketReopenBtn: 'Қайта ашу',
      ticketPublishBannerBtn: 'Баннерде жауап беру',
      ticketReplyPlaceholder: 'Қысқа жауап (міндетті емес)...',
      ticketFilterAll: 'Барлығы',
      ticketTags: {
        urgent: 'Шұғыл',
        in_progress: 'Орындалуда',
        fixed: 'Түзетілді',
      },
      cannedReplies: [
        'Түзетілді, бетті жаңартыңыз',
        'Жұмысқа қабылданды',
        'Жақын жоспарға енгізілді',
      ],
      requestsLogTitle: 'Соңғы Gemini сұраулары',
      requestsLogEmpty: 'Әзірге сұраулар болған жоқ',
      eventsLogTitle: 'Жүйе журналы',
      eventsLogEmpty: 'Оқиғалар жоқ',
      accessControlTitle: 'Әкімші панеліне қолжетімділік (басқа браузерлер)',
      accessControlDesc: 'Екінші құрылғыда немесе басқа браузерде бөлек аккаунтпен кірсеңіз, оның Firebase UID немесе расталған Email мекенжайын қосыңыз.',
      accessCurrentUidLabel: 'Ағымдағы UID',
      accessExtraUidsLabel: 'Қосымша Firebase UID (үтірмен немесе жаңа жолдан)',
      accessExtraUidsPlaceholder: 'Мысалы: xYz123AbC...',
      accessExtraEmailsLabel: 'Қосымша расталған Email',
      accessExtraEmailsPlaceholder: 'admin@example.com',
      accessSaveBtn: 'Қолжетімділікті сақтау',
      accessSavedToast: 'Әкімшілер тізімі жаңартылды',
      ramLabel: 'Жады / AI-кэш',
      cacheLabel: 'Кэш',
      clearCacheBtn: 'AI-кэшті тазарту',
      clearingCacheBtn: 'Тазартылуда...',
      cacheClearedToast: 'Кеңесші мен Досье кэші тазартылды',
      servicesTitle: 'Сервистер күйі',
      serviceRtdb: 'Firebase RTDB',
      serviceAuth: 'Google Auth',
      serviceGemini: 'Gemini API',
      serviceOk: 'Қосулы',
      serviceFail: 'Қате',
      probeServicesBtn: 'Барлығын тексеру',
      probingServicesBtn: 'Пинг...',
      errorsBreakdownTitle: 'Қате кодтары бойынша бөлініс',
      errQuota429: '429 Лимит',
      errTimeout503: 'Таймаут / 503',
      errAuthKey: 'Кілт / 403',
      errNetworkOther: 'Желі / басқа',
      heatmapTitle: 'Сағаттар (UTC) және апта күндері бойынша жүктеме',
      heatmapHoursLabel: 'Тәулік сағаттары (00–23 UTC)',
      heatmapWeekdaysLabel: 'Апта күндері',
      weekdayShort: ['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб', 'Жс'],
      exportTitle: 'Журнал мен статистиканы экспорттау',
      exportCsvBtn: 'CSV жүктеу',
      exportJsonBtn: 'JSON жүктеу',
      exportedToast: 'Файл жүктелді',
      promptStyleTitle: 'Gemini жауап стилі',
      promptVerbosityLabel: 'Кеңесші',
      promptVerbosityConcise: 'Қысқа жауаптар',
      promptVerbosityDetailed: 'Егжей-тегжейлі',
      promptGranularityLabel: 'Деректерді бөлу',
      promptGranularityAtomic: 'Ұсақтап (атомарлы)',
      promptGranularityGrouped: 'Ірілетіп (топпен)',
      promptStyleSavedToast: 'Gemini стилі сақталды',
      minVersionTitle: 'Клиент нұсқасы және PWA жаңарту',
      minVersionDesc: 'Пайдаланушы кэші ескірген болса, «Қазір жаңарту» ұсынысы шығады.',
      minVersionPlaceholder: '2.4.0',
      minVersionSaveBtn: 'Нұсқаны сақтау',
      minVersionSavedToast: 'Ең төменгі PWA нұсқасы жаңартылды',
      uiDefaultsTitle: 'Стандартты топтар, бөлімдер және жылдам сұрақтар',
      uiDefaultsGroupsLabel: 'Стандартты топтар (жол сайын немесе үтірмен)',
      uiDefaultsSectionsLabel: 'Жылдам бөлімдер (Атауы | Эмодзи)',
      uiDefaultsPromptsLabel: 'Кеңесші астындағы жылдам сұрақтар',
      uiDefaultsSaveBtn: 'UI баптауларын сақтау',
      uiDefaultsResetBtn: 'Қалпына келтіру',
      uiDefaultsSavedToast: 'Стандартты баптаулар сақталды',
      digestHourLabel: 'Автоесеп сағаты (UTC)',
      backupTitle: 'Әкімші конфигурациясын сақтау және көшіру',
      backupExportBtn: 'Конфиг JSON жүктеу',
      backupImportBtn: 'JSON-дан қалпына келтіру',
      backupExportedToast: 'Конфигурация файлы жүктелді',
      backupImportedToast: 'Конфигурация сәтті қалпына келтірілді',
      backupImportErrorToast: 'Файл пішімі қате немесе оқылмады',
    },
    deleteAccount: {
      modalTitle: 'Аккаунтты жою',
      stepCounter: (step, total) => `${step}-қадам (${total}-ден)`,
      targetAccountLabel: 'Аккаунт:',
      contactsCountWarning: (count) => `Бұлттағы контактілер: ${count}`,
      step1Heading: 'Жалғастырмас бұрын салдарын тексеріңіз',
      step1Warning:
        'Аккаунт, барлық адам карточкалары, деректер, маңызды күндер және кездесу хронологиясы бұлттан да, осы браузерден де біржола өшіріледі.',
      backupHint: 'Егер деректер кейін керек болса, алдымен көшірмесін жүктеп алыңыз:',
      backupBtn: 'Резервтік көшірмені жүктеу (JSON)',
      step1Checkbox:
        'Аккаунт пен жазбаларды қалпына келтіру мүмкін емес екенін түсінемін',
      step2Heading: 'Жоюды бақылау сөзімен растаңыз',
      step2Instruction: (keyword) =>
        `Кездейсоқ басып кетуді болдырмау үшін төмендегі өріске «${keyword}» сөзін енгізіңіз:`,
      step2Placeholder: (keyword) => `${keyword} сөзін енгізіңіз`,
      step3Heading: 'Соңғы тексеру: құпиясөзді енгізіңіз',
      step3Instruction:
        'Соңғы қадам. Біржола жою үшін аккаунттың ағымдағы құпиясөзін енгізіңіз:',
      passwordLabel: 'Ағымдағы құпиясөз',
      passwordPlaceholder: 'Құпиясөзді енгізіңіз',
      hidePassword: 'Құпиясөзді жасыру',
      showPassword: 'Құпиясөзді көрсету',
      emptyPasswordError: 'Жоюды растау үшін ағымдағы құпиясөзді енгізіңіз',
      backBtn: 'Артқа',
      nextBtn: 'Жалғастыру',
      confirmDeleteBtn: 'Аккаунтты біржола жою',
      deletingBtn: 'Жойылуда...',
      deletedToast: 'Аккаунт және барлық деректер жойылды',
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
        'Ортақ бұлтты AI серверде кілт енгізусіз жұмыс істейді. Өшірілгенде немесе желі болмаса, жергілікті талдау іске қосылады.',
      analyzerModeLabel: 'Жұмыс режимі',
      analyzerModeAuto: 'Авто (Бұлтты AI + жергілікті қор)',
      analyzerModeAutoDesc:
        'Әкімші қосса және желі болса, серверлік Gemini қолданылады.',
      analyzerModeLocal: 'Тек жергілікті',
      analyzerModeLocalDesc:
        'Жазбалар серверге жіберілмейді — тек браузердегі қозғалтқыш жұмыс істейді.',
      analyzerStatusLabel: 'Бұлтты AI мәртебесі',
      analyzerStatusReady: 'Барлығына қолжетімді',
      analyzerStatusDisabled: 'Әкімшімен өшірілген',
      analyzerStatusNoKey: 'Сервер кілті бапталмаған',
      summaryTitle: 'Қорытынды',
      summaryLoadingSub: 'Жазбалар бойынша қорытынды жиналуда...',
      summaryEngineSub: (engine) => `Дереккөз: ${engine}`,
      selectedContactFallback: 'Таңдалған контакт',
      allContacts: 'Барлық контактілер',
      buildingSummary: 'Қорытынды жасалуда...',
      copyBtn: 'Көшіру',
      downloadTxt: '.txt жүктеу',
      refreshBtn: 'Жаңарту',
      greetModalTitle: (name) => `${name} үшін хабарлама`,
      greetOccasionLabel: 'Себеп',
      greetOccasions: {
        birthday: 'Туған күн',
        reconnect: 'Үзілістен кейін жазу',
        invite: 'Кездесуге шақыру',
      },
      greetToneLabel: 'Реңк',
      greetTones: {
        warm: 'Жылы әрі шын жүректен',
        friendly: 'Достық',
        formal: 'Сыпайы / ресми',
      },
      greetGenerateBtn: 'AI арқылы жақсарту',
      greetGeneratingBtn: 'Дайындалуда...',
      greetResultLabel: 'Дайын мәтін',
      shareModalTitle: 'Жылдам жазба (Бөлісу)',
      shareModalDesc: 'Жіберілген мәтінді сақтап, талдау үшін контактіні таңдаңыз.',
      shareTargetSelectLabel: 'Қайда сақтау',
      shareNewContactOption: '+ Мәтіннен жаңа контакт',
      shareTextLabel: 'Жіберілген мәтін',
      shareAnalyzeBtn: 'Карточкаға талдау',
      defaultSectionsSuggestLabel: 'Жылдам таңдау:',
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
      vcardImported: (count) => `Визитка (.vcf) импортталды: ${count}`,
      vcardEmpty: '.vcf файлынан контактілер табылмады',
      chatImported: (count) => `Файлдан хат алмасу жүктелді (хабарлама: ${count})`,
      chatImportInvalid: 'Файл бос немесе пішімі қолдау көрсетілмейді',
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
      modeSavedAuto: 'Авторежим қосылды (бұлтты AI + жергілікті қор)',
      modeSavedLocal: 'Толық жергілікті талдау режимі қосылды',
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
      updateBannerText: (minVersion) => `Қосымшаның жаңа нұсқасы қолжетімді (v${minVersion}). Жаңарту үшін кэшті жаңартыңыз.`,
      updateNowBtn: 'Қазір жаңарту',
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
      importAria: 'Import JSON or vCard (.vcf)',
      importTitle: 'Restore backup (JSON) or import vCard (.vcf)',
      apiAria: 'Analyzer settings',
      apiTitle: 'Analyzer settings',
      openAdminAria: 'Open admin console',
      openAdminTitle: 'Admin Console',
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
      greetBtn: 'Message',
      greetTitle: 'Compose a greeting or icebreaker message',
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
      importChatBtn: 'From file',
      importChatTitle: 'Import chat history (.txt or Telegram .json)',
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
      uidLabel: 'Firebase UID',
      copyUidAria: 'Copy Firebase UID',
      uidCopiedToast: 'UID copied to clipboard',
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
      deleteAccountTitle: 'Danger zone',
      deleteAccountDesc:
        'Permanently delete your account and all cloud notes with no recovery.',
      deleteAccountBtn: 'Delete account',
      adminTitle: 'Admin panel',
      adminBadge: 'Admin',
      adminSharedAiLabel: 'Shared cloud AI for everyone',
      adminSharedAiOn: 'Enabled',
      adminSharedAiOff: 'Disabled',
      adminSharedAiDesc:
        'When disabled, the server does not call Gemini and everyone runs on the built-in local analyzer.',
      adminServerKeyReady: 'Server Gemini key active',
      adminServerKeyMissing: 'Server GEMINI_API_KEY is not set in Secrets',
      adminToggleSavedOn: 'Shared cloud AI enabled for everyone',
      adminToggleSavedOff: 'Shared cloud AI disabled — everyone uses local analysis',
      adminToggleServerOnlyNote:
        'Switched on server. To persist across restarts, verify appConfig rules in Firebase.',
      adminToggleError: 'Could not update shared AI setting',
      adminKeyRoutingTitle: 'Server keys & automatic failover',
      adminKeyRoutingDesc:
        'In Auto mode, if the primary key hits a quota limit or upstream error, the server immediately fails over to the backup key without dropping the request.',
      adminKeyRouteAuto: 'Auto + backup',
      adminKeyRoutePrimary: 'Primary only',
      adminKeyRouteBackup: 'Backup only',
      adminKeyPrimarySlot: 'Primary slot',
      adminKeyBackupSlot: 'Backup slot',
      adminKeyPrimaryEnvHint: 'GEMINI_API_KEY',
      adminKeyBackupEnvHint: 'GEMINI_API_KEY_BACKUP',
      adminKeyCheckBtn: 'Check keys',
      adminKeyCheckingBtn: 'Checking...',
      adminKeyHealthOk: 'Healthy',
      adminKeyHealthUntested: 'Configured',
      adminKeyHealthUnconfigured: 'Not set',
      adminKeyHealthCooldown: (seconds) => `Cooldown ${seconds}s`,
      adminKeyHealthInvalid: 'Invalid',
      adminKeyHealthError: 'Error',
      adminKeyActiveTag: 'Active',
      adminKeyStandbyTag: 'Standby',
      adminKeyLastFallbackNote: (fromLabel, toLabel, reason) =>
        `Auto-failover: ${fromLabel} → ${toLabel} (${reason})`,
      adminKeyRouteSaved: 'Server key route updated',
      adminKeyRouteError: 'Failed to switch server key route',
      adminKeysCheckedOk: 'Server key health check completed',
      adminKeysCheckedMissing: 'No healthy server keys responded',
      adminKeysCheckError: 'Failed to check server keys',
      openAdminPanelBtn: 'Open Admin Console',
      openAdminPanelDesc: 'Telemetry, flags, banners, starter template, webhooks, and inbox',
      feedbackBtn: 'Report an issue / Suggest an idea',
      feedbackTitle: 'Feedback',
      feedbackTypeBug: 'Issue',
      feedbackTypeIdea: 'Idea',
      feedbackPlaceholder: 'Describe a bug or feature suggestion...',
      feedbackSendBtn: 'Submit',
      feedbackSendingBtn: 'Sending...',
      feedbackSentToast: 'Feedback sent to administrator',
      feedbackErrorToast: 'Failed to submit feedback',
      myTicketsTitle: 'My feedback & admin replies',
      myTicketsEmpty: 'You have not submitted any tickets from this browser yet',
      myTicketsReplyPrefix: 'Admin reply:',
    },
    readOnly: {
      bannerTitle: 'Read-Only mode: editing and cloud writes are temporarily paused for maintenance.',
      blockedActionToast: 'Read-Only mode is active — edits are temporarily disabled',
    },
    pollWidget: {
      badge: 'Quick poll',
      votedBadge: 'Vote recorded',
      votesCount: (count) => `${count} votes`,
      dismissAria: 'Dismiss poll',
    },
    adminPanel: {
      title: 'Admin Console',
      tabs: {
        overview: 'Overview',
        limits: 'Limits & Flags',
        access: 'Access',
        journal: 'Log',
      },
      refreshBtn: 'Refresh',
      loadingText: 'Loading telemetry...',
      envTitle: 'Environment Status',
      uptimeLabel: 'Server Uptime',
      modelLabel: 'Gemini Model',
      rtdbLabel: 'Firebase RTDB',
      rtdbOnline: (ms) => `Connected · ${ms} ms`,
      rtdbOffline: 'Disconnected',
      pwaLabel: 'PWA / Cache',
      kpiRequests: 'AI Requests',
      kpiAvgLatency: 'Avg Latency',
      kpiTokens: 'Total Tokens',
      kpiCacheHits: 'Cache Hits',
      kpiDossierRebuilds: 'Dossier Runs',
      kpiTokensSaved: 'Tokens Saved',
      endpointsTitle: 'Tokens & Avg Latency by Endpoint',
      featuresTitle: 'Feature Popularity',
      featureLabels: {
        ai_analyze: 'AI note analysis',
        dossier_single: 'Single dossier',
        dossier_all: 'All-contacts dossier',
        chat_clean: 'Chat cleanup',
        calendar_ics: 'Calendar .ics export',
        local_analyze: 'Local mode runs',
      },
      digestTitle: 'Daily Mini-Digest',
      digestActiveUsers: 'Active today',
      digestAiCalls: 'Gemini calls',
      digestErrors: 'AI errors',
      digestOpenTickets: 'Open tickets',
      guestAiLabel: 'Cloud AI for Guests',
      guestAiDesc: 'Disable to prevent anonymous guest sessions from consuming shared Gemini quota.',
      readOnlyLabel: 'Read-Only Mode',
      readOnlyDesc: 'Temporarily blocks edits and cloud writes during safe database maintenance.',
      modelSwitcherTitle: 'Gemini Model',
      modelSwitcherDesc: 'Switch between fast and deeper reasoning models on the fly without redeploying.',
      modelSavedToast: 'Gemini model updated',
      modelPresets: {
        fast: {
          label: 'Fast',
          desc: 'Lowest latency & quota savings',
        },
        balanced: {
          label: 'Balanced',
          desc: 'Default speed and reasoning quality',
        },
        accurate: {
          label: 'Accurate',
          desc: 'Deep analysis for complex dossiers',
        },
      },
      pingGeminiBtn: 'Ping Gemini',
      pingingGeminiBtn: 'Checking...',
      pingQuotaExhausted: 'Quota exhausted',
      bannerTitle: 'Global Announcement Banner',
      bannerEnableLabel: 'Visible to all users',
      bannerToneInfo: 'Info',
      bannerToneWarning: 'Warning',
      bannerToneDanger: 'Critical',
      bannerPlaceholder: 'e.g. Scheduled maintenance...',
      bannerPresetMaintenance: 'Scheduled maintenance',
      bannerPresetAiOff: 'Cloud AI temporarily disabled',
      bannerSaveBtn: 'Apply banner',
      bannerSavedToast: 'Global banner updated',
      pollEditorTitle: 'Feature Vote / Mini-Poll',
      pollEnableLabel: 'Active',
      pollQuestionPlaceholder: 'Question for users...',
      pollOptionsLabel: 'Options (one per line, 2–5 items)',
      pollResetVotes: 'Reset votes',
      pollSaveBtn: 'Save poll',
      pollSavedToast: 'Poll updated',
      templateTitle: 'Starter Contact Template',
      templateNameLabel: 'Demo Contact Name',
      templateSubtitleLabel: 'Subtitle',
      templateGroupLabel: 'Group',
      templateNoteLabel: 'Insert Sample Note Text',
      templateFactsLabel: 'Facts (format: Section | Emoji | Fact text)',
      templateResetBtn: 'Reset',
      templateSaveBtn: 'Save template',
      templateSavedToast: 'Starter contact template saved',
      webhookTitle: 'Telegram / Discord / Webhook Alerts',
      webhookUrlPlaceholder: 'https://discord.com/api/webhooks/... or api.telegram.org/bot.../sendMessage?chat_id=...',
      webhookConfiguredMask: (target, provider) => `Connected (${provider}): ${target}`,
      webhookSaveBtn: 'Save webhook',
      webhookClearBtn: 'Clear',
      webhookTestBtn: 'Test alert',
      webhookSendDigestBtn: 'Send digest',
      webhookSavedToast: 'Alert settings saved',
      webhookTestOkToast: 'Alert delivered successfully',
      webhookErrorToast: 'Delivery failed or invalid HTTPS URL',
      triggers: {
        onInvalidKey: 'Invalid Gemini key',
        onQuotaExceeded: 'Quota exceeded (429)',
        onTrafficSpike: 'Traffic spike',
        onNewUser: 'New user signup',
        onNewTicket: 'New feedback ticket',
        dailyDigestEnabled: 'Daily mini-digest',
      },
      inboxTitle: 'User Feedback Inbox',
      inboxEmpty: 'No tickets yet',
      ticketBug: 'Issue',
      ticketIdea: 'Idea',
      ticketStatusOpen: 'Open',
      ticketStatusResolved: 'Resolved',
      ticketResolveBtn: 'Mark resolved',
      ticketReopenBtn: 'Reopen',
      ticketPublishBannerBtn: 'Reply in banner',
      ticketReplyPlaceholder: 'Optional short reply...',
      ticketFilterAll: 'All',
      ticketTags: {
        urgent: 'Urgent',
        in_progress: 'In progress',
        fixed: 'Fixed',
      },
      cannedReplies: [
        'Fixed — please refresh the page',
        'Working on this now',
        'Added to the upcoming roadmap',
      ],
      requestsLogTitle: 'Recent Gemini Requests',
      requestsLogEmpty: 'No Gemini requests recorded yet',
      eventsLogTitle: 'System Event Log',
      eventsLogEmpty: 'No events recorded yet',
      accessControlTitle: 'Admin Console Access (Other Browsers & Devices)',
      accessControlDesc: 'If you sign in with another account on a different browser or device, add its Firebase UID or verified email here.',
      accessCurrentUidLabel: 'Your current UID',
      accessExtraUidsLabel: 'Extra Firebase UIDs (comma or newline separated)',
      accessExtraUidsPlaceholder: 'e.g. xYz123AbC...',
      accessExtraEmailsLabel: 'Extra verified admin emails',
      accessExtraEmailsPlaceholder: 'admin@example.com',
      accessSaveBtn: 'Save access',
      accessSavedToast: 'Admin access list updated',
      ramLabel: 'Memory / AI Cache',
      cacheLabel: 'Cache',
      clearCacheBtn: 'Clear AI Cache',
      clearingCacheBtn: 'Clearing...',
      cacheClearedToast: 'Advisor & Dossier AI caches cleared',
      servicesTitle: 'Service Health',
      serviceRtdb: 'Firebase RTDB',
      serviceAuth: 'Google Auth',
      serviceGemini: 'Gemini API',
      serviceOk: 'OK',
      serviceFail: 'Fail',
      probeServicesBtn: 'Probe all',
      probingServicesBtn: 'Probing...',
      errorsBreakdownTitle: 'Errors breakdown by code',
      errQuota429: '429 Quota',
      errTimeout503: 'Timeout / 503',
      errAuthKey: 'Key / 403',
      errNetworkOther: 'Network / other',
      heatmapTitle: 'AI load by hour (UTC) & weekday',
      heatmapHoursLabel: 'By hour of day (00–23 UTC)',
      heatmapWeekdaysLabel: 'By day of week',
      weekdayShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      exportTitle: 'Export logs & statistics',
      exportCsvBtn: 'Download CSV',
      exportJsonBtn: 'Download JSON',
      exportedToast: 'Telemetry export downloaded',
      promptStyleTitle: 'Gemini Response Style',
      promptVerbosityLabel: 'Advisor',
      promptVerbosityConcise: 'Concise answers',
      promptVerbosityDetailed: 'Detailed answers',
      promptGranularityLabel: 'Fact distillation',
      promptGranularityAtomic: 'Atomic facts',
      promptGranularityGrouped: 'Grouped facts',
      promptStyleSavedToast: 'Gemini prompt style saved',
      minVersionTitle: 'Client Version & Soft PWA Update',
      minVersionDesc: 'Users running a cached app older than this version see an "Update now" bar.',
      minVersionPlaceholder: '2.4.0',
      minVersionSaveBtn: 'Apply version',
      minVersionSavedToast: 'Minimum PWA version updated',
      uiDefaultsTitle: 'Default groups, sections & advisor prompts',
      uiDefaultsGroupsLabel: 'Default groups (one per line or comma-separated)',
      uiDefaultsSectionsLabel: 'Quick sections (Title | Emoji)',
      uiDefaultsPromptsLabel: 'Advisor quick buttons (one per line)',
      uiDefaultsSaveBtn: 'Save UI defaults',
      uiDefaultsResetBtn: 'Reset',
      uiDefaultsSavedToast: 'Default sections and prompts saved',
      digestHourLabel: 'Auto digest hour (UTC)',
      backupTitle: '1-Click Admin Config Backup & Restore',
      backupExportBtn: 'Download config JSON',
      backupImportBtn: 'Restore from JSON',
      backupExportedToast: 'Admin configuration downloaded',
      backupImportedToast: 'Admin configuration restored successfully',
      backupImportErrorToast: 'Invalid or unreadable configuration JSON',
    },
    deleteAccount: {
      modalTitle: 'Delete account',
      stepCounter: (step, total) => `Step ${step} of ${total}`,
      targetAccountLabel: 'Account:',
      contactsCountWarning: (count) => `Contacts stored: ${count}`,
      step1Heading: 'Review what will be removed',
      step1Warning:
        'Your account, all person cards, facts, important dates, and contact timelines will be permanently erased from the cloud and this browser.',
      backupHint: 'If you want to keep a copy of your notes, download a backup first:',
      backupBtn: 'Download backup (JSON)',
      step1Checkbox:
        'I understand that my account and all notes cannot be recovered',
      step2Heading: 'Type confirmation keyword',
      step2Instruction: (keyword) =>
        `To prevent accidental deletion, type «${keyword}» in the field below:`,
      step2Placeholder: (keyword) => `Type ${keyword}`,
      step3Heading: 'Final check: enter your password',
      step3Instruction:
        'Final step. Enter your current account password to confirm permanent deletion:',
      passwordLabel: 'Current password',
      passwordPlaceholder: 'Enter your password',
      hidePassword: 'Hide password',
      showPassword: 'Show password',
      emptyPasswordError: 'Enter your current password to confirm deletion',
      backBtn: 'Back',
      nextBtn: 'Continue',
      confirmDeleteBtn: 'Delete account permanently',
      deletingBtn: 'Deleting...',
      deletedToast: 'Account and all data deleted',
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
        'Shared cloud AI runs on the server with no manual key setup. When disabled or offline, the built-in local analyzer works automatically.',
      analyzerModeLabel: 'Analysis mode',
      analyzerModeAuto: 'Auto (Cloud AI + local fallback)',
      analyzerModeAutoDesc:
        'Uses server Gemini when enabled by admin and online.',
      analyzerModeLocal: 'Local only',
      analyzerModeLocalDesc:
        'Notes never leave this browser — uses the built-in local engine only.',
      analyzerStatusLabel: 'Cloud AI status',
      analyzerStatusReady: 'Available for everyone',
      analyzerStatusDisabled: 'Disabled by admin',
      analyzerStatusNoKey: 'Server key not configured',
      summaryTitle: 'Summary',
      summaryLoadingSub: 'Compiling notes summary...',
      summaryEngineSub: (engine) => `Engine: ${engine}`,
      selectedContactFallback: 'Selected contact',
      allContacts: 'All contacts',
      buildingSummary: 'Building summary...',
      copyBtn: 'Copy',
      downloadTxt: 'Download .txt',
      refreshBtn: 'Refresh',
      greetModalTitle: (name) => `Message for ${name}`,
      greetOccasionLabel: 'Occasion',
      greetOccasions: {
        birthday: 'Birthday wish',
        reconnect: 'Catch up after a break',
        invite: 'Invite to meet up',
      },
      greetToneLabel: 'Tone',
      greetTones: {
        warm: 'Warm & sincere',
        friendly: 'Friendly',
        formal: 'Polite & formal',
      },
      greetGenerateBtn: 'Polish with AI',
      greetGeneratingBtn: 'Writing...',
      greetResultLabel: 'Message draft',
      shareModalTitle: 'Quick Share Capture',
      shareModalDesc: 'Choose a contact to analyze the shared snippet into.',
      shareTargetSelectLabel: 'Save to contact',
      shareNewContactOption: '+ New contact from snippet',
      shareTextLabel: 'Shared text',
      shareAnalyzeBtn: 'Analyze into card',
      defaultSectionsSuggestLabel: 'Quick pick:',
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
      vcardImported: (count) => `vCard contacts imported: ${count}`,
      vcardEmpty: 'No contacts found in .vcf file',
      chatImported: (count) => `Chat loaded from file (lines: ${count})`,
      chatImportInvalid: 'File is empty or has an unsupported format',
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
      modeSavedAuto: 'Auto mode active (cloud AI + local fallback)',
      modeSavedLocal: 'Local-only analysis mode active',
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
      updateBannerText: (minVersion) => `A newer app version (v${minVersion}) is available. Refresh to load updates.`,
      updateNowBtn: 'Update now',
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
