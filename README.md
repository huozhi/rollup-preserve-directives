# rollup-swc-preserve-directives

This is a rollup plugin that uses SWC to help preserve shebang and string directives.

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
