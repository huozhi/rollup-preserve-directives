import type { Plugin } from 'rollup'
import { extname } from 'path'
import { parse } from '@swc/core'
import { MagicString } from '@napi-rs/magic-string'

import type { ParseOptions } from '@swc/core';

const availableESExtensionsRegex = /\.(m|c)?(j|t)sx?$/
const tsExtensionsRegex = /\.(m|c)?ts$/
const directiveRegex = /^use (\w+)$/

interface PreserveDirectiveMeta {
  shebang: string | null,
  directives: Record<string, Set<string>>
}

export default function swcPreserveDirectivePlugin(): Plugin {
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
          }
        } else {
          // Only parse the top level directives, once reached to the first non statement literal node, stop parsing
          break
        }
      }

      return { code, map: null, meta }
    },

    renderChunk(code, chunk, { sourcemap }) {
      const outputDirectives = chunk.moduleIds
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

      const s = new MagicString(code)
      if (outputDirectives.size) {
        s.prepend(`${Array.from(outputDirectives).map(directive => `'${directive}';`).join('\n')}\n`)
      }
      if (meta.shebang) {
        s.prepend(`${meta.shebang}\n`)
      }

      return {
        code: s.toString(),
        map: sourcemap ? s.generateMap({ hires: true }).toMap() : null
      }
    }
  }
}
