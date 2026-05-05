const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'vi', label: 'Vietnamese' },
    { value: 'ru', label: 'Russian' },
    { value: 'zh', label: 'Chinese' }
];

const BOT_CHANNELS = [
    {
        key: 'telegram',
        displayName: 'Telegram',
        category: 'Messaging',
        runtime: 'implemented',
        setupUrl: 'https://t.me/BotFather',
        description: 'Production runtime is implemented. Create a bot in BotFather, paste the token, test it, then restart the bot.',
        setupSteps: [
            'Open BotFather and create a new Telegram bot.',
            'Copy the bot token and paste it into this admin console.',
            'Test the connection, add allowed Telegram users, then restart the bot.'
        ],
        fields: [
            { key: 'token', env: 'TELEGRAM_BOT_TOKEN', label: 'Bot token', type: 'password', secret: true, placeholder: '123456:ABC...' },
            { key: 'bot_username', env: 'TELEGRAM_BOT_USERNAME', label: 'Bot username', type: 'text', placeholder: '@agent_bot' },
            { key: 'description', env: 'TELEGRAM_DESCRIPTION', label: 'Public description', type: 'textarea', placeholder: 'Remote AI CLI assistant' }
        ]
    },
    {
        key: 'whatsapp',
        displayName: 'WhatsApp Business',
        category: 'Messaging',
        runtime: 'planned',
        setupUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
        description: 'Configuration is persisted and ready for a future WhatsApp Cloud API adapter.',
        setupSteps: [
            'Create a Meta developer app with WhatsApp Cloud API enabled.',
            'Add a phone number ID and business account ID.',
            'Paste the permanent access token and webhook verify token here.'
        ],
        fields: [
            { key: 'business_account_id', label: 'Business account ID', type: 'text', placeholder: 'Meta business account ID' },
            { key: 'phone_number_id', label: 'Phone number ID', type: 'text', placeholder: 'WhatsApp phone number ID' },
            { key: 'access_token', label: 'Access token', type: 'password', secret: true, placeholder: 'Permanent access token' },
            { key: 'webhook_verify_token', label: 'Webhook verify token', type: 'password', secret: true, placeholder: 'Webhook verify token' }
        ]
    },
    {
        key: 'zalo',
        displayName: 'Zalo Official Account',
        category: 'Messaging',
        runtime: 'planned',
        setupUrl: 'https://developers.zalo.me/',
        description: 'Configuration is persisted and ready for a future Zalo OA adapter.',
        setupSteps: [
            'Create or connect a Zalo Official Account.',
            'Create an app in Zalo Developers and connect the OA.',
            'Paste OA ID, app ID, secret, and access token here.'
        ],
        fields: [
            { key: 'oa_id', label: 'Official Account ID', type: 'text', placeholder: 'Zalo OA ID' },
            { key: 'app_id', label: 'App ID', type: 'text', placeholder: 'Zalo app ID' },
            { key: 'app_secret', label: 'App secret', type: 'password', secret: true, placeholder: 'Zalo app secret' },
            { key: 'access_token', label: 'Access token', type: 'password', secret: true, placeholder: 'Zalo access token' }
        ]
    },
    {
        key: 'discord',
        displayName: 'Discord',
        category: 'Community',
        runtime: 'planned',
        setupUrl: 'https://discord.com/developers/applications',
        description: 'Configuration is persisted and ready for a future Discord bot adapter.',
        setupSteps: [
            'Create a Discord application in the Developer Portal.',
            'Add a bot user and copy the bot token.',
            'Invite the bot to a server and paste the guild ID if you want to restrict access.'
        ],
        fields: [
            { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'Discord application client ID' },
            { key: 'guild_id', label: 'Guild ID', type: 'text', placeholder: 'Optional server ID' },
            { key: 'bot_token', label: 'Bot token', type: 'password', secret: true, placeholder: 'Discord bot token' }
        ]
    },
    {
        key: 'slack',
        displayName: 'Slack',
        category: 'Workspace',
        runtime: 'planned',
        setupUrl: 'https://api.slack.com/apps',
        description: 'Configuration is persisted and ready for a future Slack app adapter.',
        setupSteps: [
            'Create a Slack app for your workspace.',
            'Enable bot scopes and install the app to the workspace.',
            'Paste the bot token, signing secret, and app-level token here.'
        ],
        fields: [
            { key: 'app_id', label: 'App ID', type: 'text', placeholder: 'Slack app ID' },
            { key: 'bot_token', label: 'Bot token', type: 'password', secret: true, placeholder: 'xoxb-...' },
            { key: 'signing_secret', label: 'Signing secret', type: 'password', secret: true, placeholder: 'Slack signing secret' },
            { key: 'app_token', label: 'App-level token', type: 'password', secret: true, placeholder: 'xapp-...' }
        ]
    },
    {
        key: 'messenger',
        displayName: 'Facebook Messenger',
        category: 'Social',
        runtime: 'planned',
        setupUrl: 'https://developers.facebook.com/docs/messenger-platform',
        description: 'Configuration is persisted and ready for a future Messenger Platform adapter.',
        setupSteps: [
            'Create a Meta app and add Messenger.',
            'Connect a Facebook Page and generate a page access token.',
            'Paste the page ID, app secret, and webhook verify token here.'
        ],
        fields: [
            { key: 'page_id', label: 'Page ID', type: 'text', placeholder: 'Facebook Page ID' },
            { key: 'page_access_token', label: 'Page access token', type: 'password', secret: true, placeholder: 'Page token' },
            { key: 'app_secret', label: 'App secret', type: 'password', secret: true, placeholder: 'Meta app secret' },
            { key: 'webhook_verify_token', label: 'Webhook verify token', type: 'password', secret: true, placeholder: 'Webhook verify token' }
        ]
    },
    {
        key: 'line',
        displayName: 'LINE',
        category: 'Messaging',
        runtime: 'planned',
        setupUrl: 'https://developers.line.biz/console/',
        description: 'Configuration is persisted and ready for a future LINE Messaging API adapter.',
        setupSteps: [
            'Create a LINE Messaging API channel.',
            'Enable webhook usage and generate a channel access token.',
            'Paste the channel ID, secret, and access token here.'
        ],
        fields: [
            { key: 'channel_id', label: 'Channel ID', type: 'text', placeholder: 'LINE channel ID' },
            { key: 'channel_secret', label: 'Channel secret', type: 'password', secret: true, placeholder: 'LINE channel secret' },
            { key: 'channel_access_token', label: 'Channel access token', type: 'password', secret: true, placeholder: 'LINE access token' }
        ]
    },
    {
        key: 'wechat',
        displayName: 'WeChat Work',
        category: 'Enterprise',
        runtime: 'planned',
        setupUrl: 'https://developer.work.weixin.qq.com/',
        description: 'Configuration is persisted and ready for a future WeChat Work adapter.',
        setupSteps: [
            'Create a WeChat Work custom application.',
            'Copy corp ID, agent ID, and secret.',
            'Paste the callback token and encoding AES key if webhook validation is enabled.'
        ],
        fields: [
            { key: 'corp_id', label: 'Corp ID', type: 'text', placeholder: 'WeChat Work corp ID' },
            { key: 'agent_id', label: 'Agent ID', type: 'text', placeholder: 'Application agent ID' },
            { key: 'secret', label: 'Secret', type: 'password', secret: true, placeholder: 'Application secret' },
            { key: 'callback_token', label: 'Callback token', type: 'password', secret: true, placeholder: 'Webhook token' },
            { key: 'encoding_aes_key', label: 'Encoding AES key', type: 'password', secret: true, placeholder: 'Webhook AES key' }
        ]
    },
    {
        key: 'webchat',
        displayName: 'Web Chat Widget',
        category: 'Owned channel',
        runtime: 'planned',
        setupUrl: '',
        description: 'Configuration is persisted for a future embeddable website chat widget.',
        setupSteps: [
            'Choose the public widget name customers will see.',
            'Set the allowed website origin for embedding.',
            'Generate a widget secret before enabling the runtime adapter.'
        ],
        fields: [
            { key: 'widget_name', label: 'Widget name', type: 'text', placeholder: 'AgentRelay Support' },
            { key: 'allowed_origin', label: 'Allowed origin', type: 'text', placeholder: 'https://example.com' },
            { key: 'widget_secret', label: 'Widget secret', type: 'password', secret: true, placeholder: 'Generated widget secret' }
        ]
    }
];

const ALLOWED_LANGUAGES = new Set(LANGUAGE_OPTIONS.map(language => language.value));
const ALLOWED_CHANNEL_KEYS = new Set(BOT_CHANNELS.map(channel => channel.key));

function getChannel(key) {
    return BOT_CHANNELS.find(channel => channel.key === key) || null;
}

module.exports = {
    BOT_CHANNELS,
    LANGUAGE_OPTIONS,
    ALLOWED_LANGUAGES,
    ALLOWED_CHANNEL_KEYS,
    getChannel
};
