# rollup-preserve-directives

A rollup plugin helps preserving shebang and string directives in your code.

## Install

```bash
npm install rollup-preserve-directives
```

## Usage

```js
import preserveDirectives from 'rollup-preserve-directives'

export default {
  input: './src/index.js',
  output: {
    file: './dist/index.js',
    format: 'cjs'
  },
  plugins: [
    preserveDirectives()
  ]
}
```

### Inter-plugin-communication

This plugin exposes the result of its directives information of current file for other plugins to use. You can access it via `this.getModuleInfo` or the `moduleParsed` hook.

```ts
// `meta` property info
{
  preserveDirectives: {
    directives: string[]
    shebang: string
  }
}
```

## License

MIT
