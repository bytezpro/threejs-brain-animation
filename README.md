# Brain 3D Component UI

![demo](https://github.com/th2002/example-brain-animation/blob/main/public/static/demo.gif)

Brain 3D Component UI is a powerful and flexible React component for rendering 3D brain visualizations. This package provides an easy-to-use interface for integrating complex brain imaging data into your web applications.

## Features

- High-performance 3D rendering of brain structures
- Interactive controls for rotation, zoom, and pan
- Customizable color schemes and highlighting options
- Support for various brain atlas and parcellation schemes
- Easy integration with React applications

## Installation

To install the package, run the following command:

```bash
npm install threejs-brain-animation
# or
yarn add threejs-brain-animation
```

## Usage

Here's a basic example of how to use the Brain3D component:

```jsx
import React from 'react';
import { Brain } from 'threejs-brain-animation';

// use default style or you can customize
import 'threejs-brain-animation/dist/main.css';

const App = () => {
  const width = 1000;
  const height = 500;
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Brain width={width} height={height} />
    </div>
  );
};
export default App;
```

**Note** Download our brain.glb file in example_project/public and put it in your nextjs project public folder

## API

| Prop   | Type   | Default | Description                |
| ------ | ------ | ------- | -------------------------- |
| width  | number | 1000    | Width of the brain canvas  |
| height | number | 500     | Height of the brain canvas |

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm start`
4. Build the library: `npm run build`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

**Note:** See demo for more details.

For more detailed usage instructions and API documentation, please refer to our [documentation](link-to-your-documentation).

## Requirements

- Node.js >= 14.15.5
- React >= 16.8.0

## Contributing

We welcome contributions! Please see our [Contributing Guide](link-to-contributing-guide) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please file an issue on our [GitHub issue tracker](link-to-your-issue-tracker).

## Acknowledgements

We would like to thank the neuroimaging community for their invaluable input and support in the development of this component.
