# rollup-preserve-directives

A rollup plugin helps preserving shebang and string directives in your code.

## Install

```bash
npm install rollup-preserve-directives
```

## Usage

```js
import preserveDirectives from 'rollup-preserve-directives';

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

## License

MIT
