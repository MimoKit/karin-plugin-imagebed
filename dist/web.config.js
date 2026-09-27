/**
 * Karin 控制台配置页产物入口。
 *
 * Karin 对本地源码插件优先解析 karin.web（发布产物路径），
 * 这里再导出源码实现，避免维护两份配置。
 */
export { default } from '../web.config.js'
