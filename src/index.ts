import type { Plugin, RenderedChunk } from 'rollup'
import { extname } from 'path'
import { MagicString } from '@napi-rs/magic-string'

import type { Options as AcornParseOptions } from 'acorn';
import type { Node as ESTreeNode } from 'estree';

const availableESExtensionsRegex = /\.(m|c)?(j|t)sx?$/
const directiveRegex = /^use (\w+)$/

interface PreserveDirectiveMeta {
  shebang: string | null,
  directives: Record<string, Set<string>>
}

const parseOptions: AcornParseOptions = {
  ecmaVersion: 'latest',
  sourceType: 'module',
  // Use `allowHashBang: true` to prevent acorn from choking on shebangs
  allowHashBang: true,
  ranges: true,
  allowImportExportEverywhere: true,
  allowAwaitOutsideFunction: true
} as const

function swcPreserveDirective(): Plugin {
  const meta: PreserveDirectiveMeta = {
    shebang: null,
    directives: {},
  }

  return {
    name: 'swc-render-directive',
    transform: {
      order: 'post',
      handler(code, id) {
        const ext = extname(id)
        if (!availableESExtensionsRegex.test(ext)) return null

        let magicString: MagicString | null = null

        /**
         * Here we are making 3 assumptions:
         * - shebang can only be at the first line of the file, otherwise it will not be recognized
         * - shebang can only contains one line
         * - shebang must starts with # and !
         *
         * Those assumptions are also made by acorn, babel and swc:
         *
         * - acorn: https://github.com/acornjs/acorn/blob/8da1fdd1918c9a9a5748501017262ce18bb2f2cc/acorn/src/state.js#L78
         * - babel: https://github.com/babel/babel/blob/86fee43f499c76388cab495c8dcc4e821174d4e0/packages/babel-parser/src/tokenizer/index.ts#L574
         * - swc: https://github.com/swc-project/swc/blob/7bf4ab39b0e49759d9f5c8d7f989b3ed010d81a7/crates/swc_ecma_parser/src/lexer/mod.rs#L204
         */
        if (code[0] === '#' && code[1] === '!') {
          let firstNewLineIndex = 0;

          for (let i = 2, len = code.length; i < len; i++) {
            const charCode = code.charCodeAt(i);
            if (charCode === 10 || charCode === 13 || charCode === 0x2028 || charCode === 0x2029) {
              firstNewLineIndex = i;
              break;
            }
          }

          if (firstNewLineIndex) {
            meta.shebang = code.slice(0, firstNewLineIndex);

            magicString ||= new MagicString(code);
            magicString.remove(0, firstNewLineIndex + 1);
          }
        }

        /**
         * rollup's built-in parser returns an extended version of ESTree Node.
         */
        let ast = null;
        try {
          ast = this.parse(code, parseOptions) as ESTreeNode;
        } catch (e) {
          console.log(e);

          this.warn({
            code: 'PARSE_ERROR',
            message: `[rollup-swc-preserve-directives]: failed to parse "${id}" and extract the directives. make sure you have added "rollup-swc-preserve-directives" to the last of your plugins list, after swc/babel/esbuild/typescript or any other transform plugins.`
          });

          return null;
        }

        if (ast.type === 'Program') {
          for (const node of ast.body) {
            if (node.type === 'ExpressionStatement') {
              let directive: string | null = null;
              /**
               * rollup and estree defines `directive` field on the `ExpressionStatement` node:
               * https://github.com/rollup/rollup/blob/fecf0cfe14a9d79bb0eff4ad475174ce72775ead/src/ast/nodes/ExpressionStatement.ts#L10
               */
              if ('directive' in node) {
                directive = node.directive;
              } else if (node.expression.type === 'Literal' && typeof node.expression.value === 'string' && directiveRegex.test(node.expression.value)) {
                directive = node.expression.value;
              }

              if (directive) {
                meta.directives[id] ||= new Set<string>();
                meta.directives[id].add(directive);

                magicString ||= new MagicString(code);

                /**
                 * rollup has extended acorn node with the `start` and the `end` field
                 * https://github.com/rollup/rollup/blob/fecf0cfe14a9d79bb0eff4ad475174ce72775ead/src/ast/nodes/shared/Node.ts#L33
                 *
                 * However, typescript doesn't know that, so we add type guards for typescript
                 * to infer.
                 */
                if (
                  'start' in node
                  && typeof node.start === 'number'
                  && 'end' in node
                  && typeof node.end === 'number'
                ) {
                  magicString.remove(node.start, node.end);
                }
              }
            } else {
              // Only parse the top level directives, once reached to the first non statement literal node, stop parsing
              break;
            }
          }
        }

        return {
          code: magicString ? magicString.toString() : code,
          map: magicString ? magicString.generateMap({ hires: true }).toMap() : null
        }
      },
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
    }
  }
}

export default swcPreserveDirective;
export { swcPreserveDirective as preserveDirective };
