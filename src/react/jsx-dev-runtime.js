


const RESERVED_PROPS = {
    key: true,
    ref: true,
    __self: true,
    __source: true,
  };
  
  
  function hasValidRef(config) {
    return config.ref !== undefined;
  }
  
  function hasValidKey(config) {
    return config.key !== undefined;
  }
  
  
  const ReactElement = function(type, key, ref, self, source, owner, props) {
    const element = {
      // This tag allows us to uniquely identify this as a React Element
      $$typeof: Symbol.for('react.element'),
  
      // Built-in properties that belong on the element
      type: type,
      key: key,
      ref: ref,
      props: props,
  
      // Record the component responsible for creating this element.
      // hc 如上注释，记录创建该元素的 fiber
      _owner: owner,
    };
  
    return element;
  };
  
  /**
   * 给 babel 或 ts 使用的函数，用于将 jsx 语法转换成 ReactElement
   * https://github.com/reactjs/rfcs/pull/107
   * @param {*} type
   * @param {object} props
   * @param {string} key
   */
  export function jsx(type, config, maybeKey) {
    let propName;
  
    // Reserved names are extracted
    const props = {};
  
    let key = null;
    let ref = null;
  
    // Currently, key can be spread in as a prop. This causes a potential
    // issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
    // or <div key="Hi" {...props} /> ). We want to deprecate key spread,
    // but as an intermediary step, we will use jsxDEV for everything except
    // <div {...props} key="Hi" />, because we aren't currently able to tell if
    // key is explicitly declared to be undefined or not.
    if (maybeKey !== undefined) {
      key = '' + maybeKey;
    }
  
    // hc 注意jsx阶段，key已经被转换成字符串，故其类型为 string ｜ null
    if (hasValidKey(config)) {
      key = '' + config.key;
    }
  
    if (hasValidRef(config)) {
      ref = config.ref;
    }
  
    // Remaining properties are added to a new props object
    for (propName in config) {
      if (
        hasOwnProperty.call(config, propName) &&
        !RESERVED_PROPS.hasOwnProperty(propName)
      ) {
        props[propName] = config[propName];
      }
    }
  
    // Resolve default props
    if (type && type.defaultProps) {
      const defaultProps = type.defaultProps;
      for (propName in defaultProps) {
        if (props[propName] === undefined) {
          props[propName] = defaultProps[propName];
        }
      }
    }
  
    return ReactElement(
      type,
      key,
      ref,
      undefined,
      undefined,
      null,
      props,
    );
  }
  
  export const jsxDEV = jsx;