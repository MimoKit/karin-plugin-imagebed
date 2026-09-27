import { imageMarkdown } from './markdown.js'

export function resultMarkdown(result, name = '图片', width = 720) {
  return `## 图床上传成功\n\n- **图床**：${result.provider}\n- **耗时**：${result.cost}ms\n\n${imageMarkdown(result.url, { title: name, width })}`
}

export function imageMarkdown(url, { title = '图片', width = 720 } = {}) {
  const safeTitle = String(title).replace(/[\r\n]/g, ' ').slice(0, 80)
  return `# ${safeTitle}\n\n![${safeTitle} #${width}px](${url})`
}
