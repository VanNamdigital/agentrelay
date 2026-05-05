import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', nativeLabel: 'English' },
  { value: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
  { value: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { value: 'zh', label: 'Chinese', nativeLabel: '中文' }
];

const DICTIONARY = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.bot': 'Bot Configuration',
    'nav.cli': 'CLI Providers',
    'nav.projects': 'Projects',
    'nav.access': 'Access Control',
    'nav.logs': 'Logs',
    'nav.settings': 'Settings',
    'layout.subtitle': 'AI command center',
    'layout.workspace': 'Local workspace',
    'layout.apiOnline': 'Admin API online',
    'layout.role': 'System administrator',
    'layout.logout': 'Logout',
    'common.language': 'Language',
    'common.refresh': 'Refresh',
    'common.save': 'Save',
    'common.enabled': 'Enabled',
    'common.disabled': 'Disabled',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.delete': 'Delete',
    'common.test': 'Test',
    'dashboard.eyebrow': 'Overview',
    'dashboard.title': 'Operations dashboard',
    'dashboard.description': 'Monitor bot connectivity, local CLI readiness, projects, users, and recent activity from one place.',
    'settings.eyebrow': 'Runtime policy',
    'settings.title': 'General Settings',
    'settings.description': 'Tune common runtime limits, language, and bot task policy.',
    'settings.timeoutTitle': 'Task timeout',
    'settings.timeoutDescription': 'Maximum time for each CLI task before it is automatically cancelled.',
    'settings.languageTitle': 'System language',
    'settings.languageDescription': 'Controls dashboard labels and bot-facing text where translations are available.',
    'settings.saved': 'Settings saved.',
    'bot.eyebrow': 'Bot channels',
    'bot.title': 'Bot Configuration',
    'bot.description': 'Configure customer-facing bot apps. Telegram is live today; other channels are saved as ready-to-integrate modules.',
    'bot.channels': 'Bot apps',
    'bot.setup': 'Setup',
    'bot.createGuide': 'Create bot guide',
    'bot.runtimeLive': 'Runtime live',
    'bot.runtimePlanned': 'Runtime planned',
    'bot.configured': 'Configured',
    'bot.setupReady': 'Setup ready',
    'bot.saveChannel': 'Save channel',
    'bot.testTelegram': 'Test Telegram',
    'bot.restartTelegram': 'Restart Telegram bot',
    'bot.allowedUsers': 'Allowed Telegram users',
    'bot.allowedUsersHint': 'These users can access the Telegram bot. Roles are ready for policy expansion.',
    'bot.addUser': 'Add user',
    'bot.userId': 'Telegram user ID',
    'bot.displayName': 'Display name',
    'bot.role': 'Role',
    'bot.openGuide': 'Open setup page',
    'bot.secretSaved': 'Saved secret',
    'bot.channelSaved': 'Bot channel saved.',
    'bot.telegramSaved': 'Telegram configuration saved.',
    'bot.telegramConnected': 'Connected as',
    'auth.signIn': 'Sign in',
    'auth.signingIn': 'Signing in...',
    'auth.username': 'Username',
    'auth.password': 'Password'
  },
  vi: {
    'nav.dashboard': 'Tổng quan',
    'nav.bot': 'Cấu hình Bot',
    'nav.cli': 'CLI Providers',
    'nav.projects': 'Dự án',
    'nav.access': 'Phân quyền',
    'nav.logs': 'Nhật ký',
    'nav.settings': 'Cài đặt',
    'layout.subtitle': 'Trung tâm điều khiển AI',
    'layout.workspace': 'Workspace local',
    'layout.apiOnline': 'Admin API đang online',
    'layout.role': 'Quản trị hệ thống',
    'layout.logout': 'Đăng xuất',
    'common.language': 'Ngôn ngữ',
    'common.refresh': 'Làm mới',
    'common.save': 'Lưu',
    'common.enabled': 'Bật',
    'common.disabled': 'Tắt',
    'common.status': 'Trạng thái',
    'common.actions': 'Thao tác',
    'common.delete': 'Xóa',
    'common.test': 'Kiểm tra',
    'dashboard.eyebrow': 'Tổng quan',
    'dashboard.title': 'Bảng vận hành',
    'dashboard.description': 'Theo dõi kết nối bot, trạng thái CLI local, dự án, user và hoạt động gần đây.',
    'settings.eyebrow': 'Chính sách runtime',
    'settings.title': 'Cài đặt chung',
    'settings.description': 'Cấu hình giới hạn tác vụ, ngôn ngữ và chính sách chạy bot.',
    'settings.timeoutTitle': 'Timeout tác vụ',
    'settings.timeoutDescription': 'Thời gian tối đa cho mỗi tác vụ CLI trước khi tự động hủy.',
    'settings.languageTitle': 'Ngôn ngữ hệ thống',
    'settings.languageDescription': 'Điều khiển nhãn dashboard và nội dung bot khi có bản dịch.',
    'settings.saved': 'Đã lưu cài đặt.',
    'bot.eyebrow': 'Kênh bot',
    'bot.title': 'Cấu hình Bot',
    'bot.description': 'Cấu hình các app bot cho khách hàng. Telegram chạy thật hiện tại; các kênh khác được lưu sẵn để tích hợp tiếp.',
    'bot.channels': 'Ứng dụng bot',
    'bot.setup': 'Cấu hình',
    'bot.createGuide': 'Hướng dẫn tạo bot',
    'bot.runtimeLive': 'Runtime đã chạy',
    'bot.runtimePlanned': 'Runtime chờ tích hợp',
    'bot.configured': 'Đã cấu hình',
    'bot.setupReady': 'Sẵn sàng cấu hình',
    'bot.saveChannel': 'Lưu kênh',
    'bot.testTelegram': 'Test Telegram',
    'bot.restartTelegram': 'Restart bot Telegram',
    'bot.allowedUsers': 'User Telegram được phép',
    'bot.allowedUsersHint': 'Các user này được dùng Telegram bot. Role đã lưu sẵn để mở rộng chính sách.',
    'bot.addUser': 'Thêm user',
    'bot.userId': 'Telegram user ID',
    'bot.displayName': 'Tên hiển thị',
    'bot.role': 'Vai trò',
    'bot.openGuide': 'Mở trang hướng dẫn',
    'bot.secretSaved': 'Secret đã lưu',
    'bot.channelSaved': 'Đã lưu kênh bot.',
    'bot.telegramSaved': 'Đã lưu cấu hình Telegram.',
    'bot.telegramConnected': 'Đã kết nối',
    'auth.signIn': 'Đăng nhập',
    'auth.signingIn': 'Đang đăng nhập...',
    'auth.username': 'Tên đăng nhập',
    'auth.password': 'Mật khẩu'
  },
  ru: {
    'nav.dashboard': 'Панель',
    'nav.bot': 'Настройка ботов',
    'nav.cli': 'CLI провайдеры',
    'nav.projects': 'Проекты',
    'nav.access': 'Доступ',
    'nav.logs': 'Журналы',
    'nav.settings': 'Настройки',
    'layout.subtitle': 'Центр управления AI',
    'layout.workspace': 'Локальная среда',
    'layout.apiOnline': 'Admin API онлайн',
    'layout.role': 'Системный администратор',
    'layout.logout': 'Выйти',
    'common.language': 'Язык',
    'common.refresh': 'Обновить',
    'common.save': 'Сохранить',
    'common.enabled': 'Включено',
    'common.disabled': 'Отключено',
    'common.status': 'Статус',
    'common.actions': 'Действия',
    'common.delete': 'Удалить',
    'common.test': 'Проверить',
    'dashboard.eyebrow': 'Обзор',
    'dashboard.title': 'Операционная панель',
    'dashboard.description': 'Следите за подключением бота, готовностью CLI, проектами, пользователями и последними событиями.',
    'settings.eyebrow': 'Политика runtime',
    'settings.title': 'Общие настройки',
    'settings.description': 'Настройте лимиты задач, язык и политику запуска бота.',
    'settings.timeoutTitle': 'Таймаут задачи',
    'settings.timeoutDescription': 'Максимальное время выполнения CLI задачи до автоматической отмены.',
    'settings.languageTitle': 'Системный язык',
    'settings.languageDescription': 'Управляет текстом панели и сообщениями бота, где есть перевод.',
    'settings.saved': 'Настройки сохранены.',
    'bot.eyebrow': 'Каналы бота',
    'bot.title': 'Настройка ботов',
    'bot.description': 'Настройте клиентские бот-приложения. Telegram работает сейчас; остальные каналы сохранены для будущей интеграции.',
    'bot.channels': 'Бот-приложения',
    'bot.setup': 'Настройка',
    'bot.createGuide': 'Как создать бота',
    'bot.runtimeLive': 'Runtime готов',
    'bot.runtimePlanned': 'Runtime запланирован',
    'bot.configured': 'Настроено',
    'bot.setupReady': 'Готово к настройке',
    'bot.saveChannel': 'Сохранить канал',
    'bot.testTelegram': 'Проверить Telegram',
    'bot.restartTelegram': 'Перезапустить Telegram',
    'bot.allowedUsers': 'Разрешенные пользователи Telegram',
    'bot.allowedUsersHint': 'Эти пользователи могут использовать Telegram бота. Роли сохранены для будущих правил доступа.',
    'bot.addUser': 'Добавить пользователя',
    'bot.userId': 'Telegram user ID',
    'bot.displayName': 'Отображаемое имя',
    'bot.role': 'Роль',
    'bot.openGuide': 'Открыть инструкцию',
    'bot.secretSaved': 'Секрет сохранен',
    'bot.channelSaved': 'Канал бота сохранен.',
    'bot.telegramSaved': 'Настройки Telegram сохранены.',
    'bot.telegramConnected': 'Подключено как',
    'auth.signIn': 'Войти',
    'auth.signingIn': 'Вход...',
    'auth.username': 'Имя пользователя',
    'auth.password': 'Пароль'
  },
  zh: {
    'nav.dashboard': '仪表盘',
    'nav.bot': '机器人配置',
    'nav.cli': 'CLI 提供商',
    'nav.projects': '项目',
    'nav.access': '访问控制',
    'nav.logs': '日志',
    'nav.settings': '设置',
    'layout.subtitle': 'AI 命令中心',
    'layout.workspace': '本地工作区',
    'layout.apiOnline': 'Admin API 在线',
    'layout.role': '系统管理员',
    'layout.logout': '退出登录',
    'common.language': '语言',
    'common.refresh': '刷新',
    'common.save': '保存',
    'common.enabled': '已启用',
    'common.disabled': '已禁用',
    'common.status': '状态',
    'common.actions': '操作',
    'common.delete': '删除',
    'common.test': '测试',
    'dashboard.eyebrow': '概览',
    'dashboard.title': '运维仪表盘',
    'dashboard.description': '集中查看机器人连接、本地 CLI 状态、项目、用户和最近活动。',
    'settings.eyebrow': '运行策略',
    'settings.title': '通用设置',
    'settings.description': '调整任务限制、系统语言和机器人运行策略。',
    'settings.timeoutTitle': '任务超时',
    'settings.timeoutDescription': '每个 CLI 任务自动取消前允许运行的最长时间。',
    'settings.languageTitle': '系统语言',
    'settings.languageDescription': '控制仪表盘标签和已翻译的机器人消息。',
    'settings.saved': '设置已保存。',
    'bot.eyebrow': '机器人渠道',
    'bot.title': '机器人配置',
    'bot.description': '配置面向客户的机器人应用。Telegram 当前可运行，其他渠道会保存为待集成模块。',
    'bot.channels': '机器人应用',
    'bot.setup': '配置',
    'bot.createGuide': '创建机器人指南',
    'bot.runtimeLive': '运行时已就绪',
    'bot.runtimePlanned': '运行时待集成',
    'bot.configured': '已配置',
    'bot.setupReady': '可配置',
    'bot.saveChannel': '保存渠道',
    'bot.testTelegram': '测试 Telegram',
    'bot.restartTelegram': '重启 Telegram 机器人',
    'bot.allowedUsers': '允许的 Telegram 用户',
    'bot.allowedUsersHint': '这些用户可以使用 Telegram 机器人。角色已保存以便后续扩展策略。',
    'bot.addUser': '添加用户',
    'bot.userId': 'Telegram 用户 ID',
    'bot.displayName': '显示名称',
    'bot.role': '角色',
    'bot.openGuide': '打开设置页面',
    'bot.secretSaved': '密钥已保存',
    'bot.channelSaved': '机器人渠道已保存。',
    'bot.telegramSaved': 'Telegram 配置已保存。',
    'bot.telegramConnected': '已连接为',
    'auth.signIn': '登录',
    'auth.signingIn': '登录中...',
    'auth.username': '用户名',
    'auth.password': '密码'
  }
};

const I18nContext = createContext(null);

function normalizeLanguage(value) {
  return LANGUAGE_OPTIONS.some((language) => language.value === value) ? value : 'en';
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => normalizeLanguage(localStorage.getItem('system_language') || 'en'));

  const applyLanguage = useCallback((nextLanguage) => {
    const normalized = normalizeLanguage(nextLanguage);
    localStorage.setItem('system_language', normalized);
    document.documentElement.lang = normalized;
    setLanguageState(normalized);
    return normalized;
  }, []);

  const refreshLanguage = useCallback(async () => {
    try {
      const settings = await api.getGeneralSettings();
      applyLanguage(settings.system_language || 'en');
    } catch {
      document.documentElement.lang = language;
    }
  }, [applyLanguage, language]);

  const setLanguage = useCallback(async (nextLanguage, options = {}) => {
    const normalized = applyLanguage(nextLanguage);
    if (options.persist !== false) {
      await api.saveGeneralSettings({ system_language: normalized });
    }
    return normalized;
  }, [applyLanguage]);

  const t = useCallback((key, fallback) => (
    DICTIONARY[language]?.[key] || DICTIONARY.en[key] || fallback || key
  ), [language]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({
    language,
    languages: LANGUAGE_OPTIONS,
    setLanguage,
    refreshLanguage,
    t
  }), [language, refreshLanguage, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
