module.exports = function (api) {
  api.cache(true);
  return {
<<<<<<< HEAD
    presets: ['babel-preset-expo', '@babel/preset-typescript'],
  };
};
=======
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
>>>>>>> feature/activities
