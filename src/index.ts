import type { Plugin } from 'rollup'
import { extname } from 'path'
import { parse } from '@swc/core'
import { MagicString } from '@napi-rs/magic-string'

const availableESExtensionsRegex = /\.(m|c)?(j|t)sx?$/
const tsExtensionsRegex = /\.(m|c)?ts$/
const directiveRegex = /^use (\w+)$/

export default function swcPreserveDirectivePlugin(): Plugin {
  const meta: {
    shebang: string | null
    directives: Set<string>
  } = {
    shebang: null,
    directives: new Set(),
  }

  return {
    name: 'swc-render-directive',
    async transform(code, id) {
      const ext = extname(id)
      if (!availableESExtensionsRegex.test(ext)) return code

      const isTypescript = tsExtensionsRegex.test(ext)
      const parseOptions = {
        syntax: isTypescript ? 'typescript' : 'ecmascript',
        [isTypescript ? 'tsx' : 'jsx']: true,
        privateMethod: true,
        classPrivateProperty: true,
        exportDefaultFrom: true,
        script: false, target: 'es2019'
      } as const

      const { body, interpreter } = await parse(code, parseOptions)
      if (interpreter) {
        meta.shebang = `#!${interpreter}`
        code = code.replace(new RegExp('^[\\s\\n]*' + meta.shebang.replace(/\//g, '\/') + '\\n*'), '') // Remove shebang from code
      }

      for (const node of body) {
        if (node.type === 'ExpressionStatement') {
          if (node.expression.type === 'StringLiteral' && directiveRegex.test(node.expression.value)) {
            meta.directives.add(node.expression.value)
          }
        } else {
          // Only parse the top level directives, once reached to the first non statement literal node, stop parsing
          break
        }
      }

      return { code, map: null, meta }
    },

    renderChunk(code, _chunk, { sourcemap }) {
      const { shebang, directives } = meta
      if (!directives.size && !shebang) return null

      const s = new MagicString(code)
      if (directives.size) {
        s.prepend(`${Array.from(directives).map(directive => `'${directive}';`).join('\n')}\n`)
      }
      if (shebang) {
        s.prepend(`${shebang}\n`)
      }

      return {
        code: s.toString(),
        map: sourcemap ? s.generateMap({ hires: true }).toMap() : null
      }
    }
  }
}
