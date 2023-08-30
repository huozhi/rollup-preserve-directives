# rollup-swc-preserve-directives

A rollup plugin helps preserving shebang and string directives in your code.

## Install

```bash
npm install rollup-swc-preserve-directives
```

## Usage

```js
import swcPreserveDirectives from 'rollup-swc-preserve-directives';

export default {
  input: './src/index.js',
  output: {
    file: './dist/index.js',
    format: 'cjs'
  },
  plugins: [
    swcPreserveDirectives()
  ]
}
```

## License

MIT
