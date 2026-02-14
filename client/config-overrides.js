const { override, addWebpackAlias, adjustStyleLoaders } = require('customize-cra');
const path = require('path');

module.exports = override(
    addWebpackAlias({
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@hooks': path.resolve(__dirname, 'src/utils/hooks/index.ts')
    }),
    adjustStyleLoaders(({ use: [, , postcss, , sass] }) => {
        // Configure sass-loader to use modern API
        if (sass) {
            sass.options = {
                ...sass.options,
                api: 'modern'
            };
        }
    })
);