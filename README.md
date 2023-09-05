# rollup-swc-preserve-directives

A rollup plugin helps preserving shebang and string directives in your code.

## Install

```bash
npm install rollup-swc-preserve-directives

# You also need to install @swc/core as peer dependency
npm install @swc/core
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
