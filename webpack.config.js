const mode = process.env.NODE_ENV || "development";

module.exports = {
    target: "webworker",
    entry: "./src/index.ts",
    mode,
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        plugins: [],
    },
    devtool: "cheap-module-source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: {
                    transpileOnly: true,
                },
            },
        ],
    },
};
