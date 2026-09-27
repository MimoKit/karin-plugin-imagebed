/**
 * Karin WebUI 配置页。
 *
 * Karin 通过 package.json 的 karin.web 找到本文件，
 * 文件名必须是 web.config.js，components() 返回内置表单组件，
 * save() 接收控制台提交的配置并写回 config/config.json。
 */
import { defineConfig } from 'node-karin'

import { PROVIDER_KEYS, loadConfig, saveConfig } from './src/config.js'

const options = (values) => values.map((value) => ({ componentType: 'select-item', key: value, value, label: value }))

export default defineConfig({
  info: {
    id: 'karin-plugin-imagebed',
    name: '图床服务',
    description: '多图床优先级链、自动故障回退与 QQ 官方 Markdown 图片输出',
    icon: { name: 'image', color: '#0ea5e9' },
  },
  components: () => {
    const config = loadConfig()
    const settings = config.providers || {}
    return [
      { componentType: 'divider', key: 'divider_basic', label: '基础设置' },
      {
        componentType: 'input',
        key: 'priority',
        label: '图床优先级',
        description: `按顺序尝试，用逗号分隔。可用：${PROVIDER_KEYS.join(' / ')}`,
        value: (config.priority || []).join(','),
        isClearable: true,
        fullWidth: true,
      },
      {
        componentType: 'switch',
        key: 'markdown_enabled',
        label: 'QQ 官方机器人使用 Markdown 输出',
        description: '关闭后统一降级为普通图片消息',
        defaultSelected: config.markdown?.enabled !== false,
      },
      {
        componentType: 'input',
        key: 'markdown_maxImageWidth',
        label: 'Markdown 图片宽度(px)',
        value: String(config.markdown?.maxImageWidth ?? 720),
        type: 'number',
      },

      { componentType: 'divider', key: 'divider_cnb', label: 'CNB' },
      { componentType: 'switch', key: 'cnb_enabled', label: '启用 CNB', defaultSelected: settings.cnb?.enabled === true },
      { componentType: 'input', key: 'cnb_token', label: 'CNB Token', description: 'CNB 个人访问令牌，需 repo-manage 读写权限', value: settings.cnb?.token || '', type: 'password' },
      { componentType: 'input', key: 'cnb_repo', label: 'CNB 仓库', description: '格式：用户名/仓库名', value: settings.cnb?.repo || '', placeholder: 'user/repo' },

      { componentType: 'divider', key: 'divider_picgo', label: 'PicGo' },
      { componentType: 'switch', key: 'picgo_enabled', label: '启用 PicGo', defaultSelected: settings.picgo?.enabled === true },
      { componentType: 'input', key: 'picgo_apiKey', label: 'PicGo API 密钥', description: 'picgo.net 个人中心「设置 → API」获取', value: settings.picgo?.apiKey || '', type: 'password' },

      { componentType: 'divider', key: 'divider_cliim', label: 'Cli.im' },
      { componentType: 'switch', key: 'cliim_enabled', label: '启用 Cli.im', description: '免费图床，无需凭据', defaultSelected: settings.cliim?.enabled !== false },

      { componentType: 'divider', key: 'divider_kurobbs', label: '库街区' },
      { componentType: 'switch', key: 'kurobbs_enabled', label: '启用库街区', defaultSelected: settings.kurobbs?.enabled === true },
      { componentType: 'input', key: 'kurobbs_token', label: '库街区 Token', description: '网页端抓包请求头里的 Token', value: settings.kurobbs?.token || '', type: 'password' },

      { componentType: 'divider', key: 'divider_bilibili', label: 'B 站' },
      { componentType: 'switch', key: 'bilibili_enabled', label: '启用 B 站', defaultSelected: settings.bilibili?.enabled === true },
      { componentType: 'input', key: 'bilibili_sessdata', label: 'SESSDATA', description: '登录后 Cookie 中的 SESSDATA', value: settings.bilibili?.sessdata || '', type: 'password' },
      { componentType: 'input', key: 'bilibili_csrfToken', label: 'bili_jct', description: '登录后 Cookie 中的 bili_jct', value: settings.bilibili?.csrfToken || '', type: 'password' },
      {
        componentType: 'select',
        key: 'bilibili_bucket',
        label: '上传分区',
        defaultValue: settings.bilibili?.bucket || 'openplatform',
        items: options(['openplatform', 'newlist', 'draw']),
      },
    ]
  },
  save: (input) => {
    try {
      saveConfig(input)
      return { success: true, message: '图床配置已保存，重启 Karin 后完全生效' }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : String(error) }
    }
  },
})
