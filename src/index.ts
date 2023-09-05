import type { Plugin, RenderedChunk } from 'rollup'
import { extname } from 'path'
import { parse } from '@swc/core'
import { MagicString } from '@napi-rs/magic-string'

import type { ParseOptions } from '@swc/core';

const availableESExtensionsRegex = /\.(m|c)?(j|t)sx?$/
const tsExtensionsRegex = /\.(m|c)?tsx?$/
const directiveRegex = /^use (\w+)$/

interface PreserveDirectiveMeta {
  shebang: string | null,
  directives: Record<string, Set<string>>
}

function swcPreserveDirective(): Plugin {
  const meta: PreserveDirectiveMeta = {
    shebang: null,
    directives: {},
  }

  return {
    name: 'swc-render-directive',
    async transform(code, id) {
      const ext = extname(id)
      if (!availableESExtensionsRegex.test(ext)) return code

      const isTypescript = tsExtensionsRegex.test(ext)
      const parseOptions: ParseOptions = {
        syntax: isTypescript ? 'typescript' : 'ecmascript',
        [isTypescript ? 'tsx' : 'jsx']: true,
        privateMethod: true,
        classPrivateProperty: true,
        exportDefaultFrom: true,
        script: false, target: 'es2019'
      } as const

      let magicString: MagicString | null = null

      /**
       * @swc/core's node span doesn't start with 0
       * https://github.com/swc-project/swc/issues/1366
       */
      const { body, interpreter } = await parse(code, parseOptions)

      if (interpreter) {
        meta.shebang = `#!${interpreter}`
        code = code.replace(new RegExp('^[\\s\\n]*' + meta.shebang.replace(/\//g, '\/') + '\\n*'), '') // Remove shebang from code
      }

      for (const node of body) {
        if (node.type === 'ExpressionStatement') {
          if (node.expression.type === 'StringLiteral' && directiveRegex.test(node.expression.value)) {
            meta.directives[id] ||= new Set<string>();
            meta.directives[id].add(node.expression.value);

            magicString ||= new MagicString(code)
          }
        } else {
          // Only parse the top level directives, once reached to the first non statement literal node, stop parsing
          break
        }
      }

      return {
        code: magicString ? magicString.toString() : code,
        map: magicString ? magicString.generateMap({ hires: true }).toMap() : null
      }
    },

    renderChunk(code, chunk, { sourcemap }) {
      /**
       * chunk.moduleIds is introduced in rollup 3
       * Add a fallback for rollup 2
       */
      const moduleIds = 'moduleIds' in chunk
        ? chunk.moduleIds
        : Object.keys((chunk as RenderedChunk).modules)

      const outputDirectives = moduleIds
        .map((id) => {
          if (meta.directives[id]) {
            return meta.directives[id];
          }
          return null;
        })
        .reduce<Set<string>>((acc, directives) => {
          if (directives) {
            directives.forEach((directive) => acc.add(directive));
          }
          return acc;
        }, new Set());

      let magicString: MagicString | null = null

      if (outputDirectives.size) {
        magicString ||= new MagicString(code)
        magicString.prepend(`${Array.from(outputDirectives).map(directive => `'${directive}';`).join('\n')}\n`)
      }
      if (meta.shebang) {
        magicString ||= new MagicString(code)
        magicString.prepend(`${meta.shebang}\n`)
      }

      return {
        code: magicString ? magicString.toString() : code,
        map: (sourcemap && magicString) ? magicString.generateMap({ hires: true }).toMap() : null
      }
    },

    onLog(level, log) {
      if (log.code === 'MODULE_LEVEL_DIRECTIVE' && level === 'warn') {
        return false
      }
      this.warn(log)
    },
  }
}

export default swcPreserveDirective;
export { swcPreserveDirective as preserveDirective };
