function mergePropertiesAsReadOnly(src, target) {
  const propertyDescriptors = Object.keys(src).reduce((acc, curr) => {
    acc[curr] = {
      value: src[curr],
      writable: false,
      enumerable: true,
      configurable: false
    };
    return acc;
  }, {});

  Object.defineProperties(target, propertyDescriptors);
}

export default mergePropertiesAsReadOnly;
