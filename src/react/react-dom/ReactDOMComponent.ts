import { setValueForStyles } from "./CSSPropertyOperations";
import { getIntrinsicNamespace, HTML_NAMESPACE } from "./DOMNamespaces";
import { setValueForProperty } from "./DOMPropertyOperations";
import { DOCUMENT_NODE } from "./HTMLNodeType";
import setInnerHTML from "./setInnerHtml";
import setTextContent from "./setTextContent";

const DANGEROUSLY_SET_INNER_HTML = 'dangerouslySetInnerHTML';
const SUPPRESS_CONTENT_EDITABLE_WARNING = 'suppressContentEditableWarning';
const SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';
const AUTOFOCUS = 'autoFocus';
const CHILDREN = 'children';
const STYLE = 'style';
const HTML = '__html';

function getOwnerDocumentFromRootContainer(
  rootContainerElement: Element | Document | DocumentFragment,
): Document {
  // @ts-ignore
  return rootContainerElement.nodeType === DOCUMENT_NODE
    ? rootContainerElement
    : rootContainerElement.ownerDocument;
}

export function createElement(
  type: string,
  props: Object,
  rootContainerElement: Element | Document | DocumentFragment,
  parentNamespace: string,
): Element {
  // We create tags in the namespace of their parent container, except HTML
  // tags get no namespace.
  const ownerDocument: Document = getOwnerDocumentFromRootContainer(
    rootContainerElement,
  );
  let domElement: Element;
  let namespaceURI = parentNamespace;
  if (namespaceURI === HTML_NAMESPACE) {
    namespaceURI = getIntrinsicNamespace(type);
  }
  if (namespaceURI === HTML_NAMESPACE) {
    if (type === 'script') {
      // Create the script via .innerHTML so its "parser-inserted" flag is
      // set to true and it does not execute
      const div = ownerDocument.createElement('div');
      div.innerHTML = '<script><' + '/script>'; // eslint-disable-line
      // This is guaranteed to yield a script element.
      const firstChild = div.firstChild;
      domElement = div.removeChild(firstChild);
    } else if (typeof props.is === 'string') {
      // $FlowIssue `createElement` should be updated for Web Components
      domElement = ownerDocument.createElement(type, {is: props.is});
    } else {
      // Separate else branch instead of using `props.is || undefined` above because of a Firefox bug.
      // See discussion in https://github.com/facebook/react/pull/6896
      // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
      domElement = ownerDocument.createElement(type);
      // Normally attributes are assigned in `setInitialDOMProperties`, however the `multiple` and `size`
      // attributes on `select`s needs to be added before `option`s are inserted.
      // This prevents:
      // - a bug where the `select` does not scroll to the correct option because singular
      //  `select` elements automatically pick the first item #13222
      // - a bug where the `select` set the first item as selected despite the `size` attribute #14239
      // See https://github.com/facebook/react/issues/13222
      // and https://github.com/facebook/react/issues/14239
      if (type === 'select') {
        const node = domElement as HTMLSelectElement;
        if (props.multiple) {
          node.multiple = true;
        } else if (props.size) {
          // Setting a size greater than 1 causes a select to behave like `multiple=true`, where
          // it is possible that no option is selected.
          //
          // This is only necessary when a select in "single selection mode".
          node.size = props.size;
        }
      }
    }
  } else {
    domElement = ownerDocument.createElementNS(namespaceURI, type);
  }

  return domElement;
}



function isCustomComponent(tagName: string, props: Object) {
  if (tagName.indexOf('-') === -1) {
    return typeof props.is === 'string';
  }
  switch (tagName) {
    // These are reserved SVG and MathML elements.
    // We don't mind this list too much because we expect it to never grow.
    // The alternative is to track the namespace in a few places which is convoluted.
    // https://w3c.github.io/webcomponents/spec/custom/#custom-elements-core-concepts
    case 'annotation-xml':
    case 'color-profile':
    case 'font-face':
    case 'font-face-src':
    case 'font-face-uri':
    case 'font-face-format':
    case 'font-face-name':
    case 'missing-glyph':
      return false;
    default:
      return true;
  }
}


function setInitialDOMProperties(
  tag: string,
  domElement: Element,
  rootContainerElement: Element | Document | DocumentFragment,
  nextProps: Object,
  isCustomComponentTag: boolean,
): void {
  for (const propKey in nextProps) {
    if (!nextProps.hasOwnProperty(propKey)) {
      continue;
    }
    const nextProp = nextProps[propKey];
    if (propKey === STYLE) {
      // Relies on `updateStylesByID` not mutating `styleUpdates`.
      setValueForStyles(domElement, nextProp);
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      const nextHtml = nextProp ? nextProp[HTML] : undefined;
      if (nextHtml != null) {
        // setInnerHTML(domElement, nextHtml);
      }
    } else if (propKey === CHILDREN) {
      if (typeof nextProp === 'string') {
        // Avoid setting initial textContent when the text is empty. In IE11 setting
        // textContent on a <textarea> will cause the placeholder to not
        // show within the <textarea> until it has been focused and blurred again.
        // https://github.com/facebook/react/issues/6731#issuecomment-254874553
        const canSetTextContent = tag !== 'textarea' || nextProp !== '';
        if (canSetTextContent) {
          setTextContent(domElement, nextProp);
        }
      } else if (typeof nextProp === 'number') {
        setTextContent(domElement, '' + nextProp);
      }
    } else if (
      propKey === SUPPRESS_CONTENT_EDITABLE_WARNING ||
      propKey === SUPPRESS_HYDRATION_WARNING
    ) {
      // Noop
    } 
    // else if (propKey === AUTOFOCUS) {
    //   // We polyfill it separately on the client during commit.
    //   // We could have excluded it in the property list instead of
    //   // adding a special case here, but then it wouldn't be emitted
    //   // on server rendering (but we *do* want to emit it in SSR).
    // } else if (registrationNameDependencies.hasOwnProperty(propKey)) {
    //   if (nextProp != null) {
    //     if (propKey === 'onScroll') {
    //       listenToNonDelegatedEvent('scroll', domElement);
    //     }
    //   }
    // } else if (nextProp != null) {
    //   setValueForProperty(domElement, propKey, nextProp, isCustomComponentTag);
    // }
  }
}

export function setInitialProperties(
  domElement: Element,
  tag: string,
  rawProps: Object,
  rootContainerElement: Element | Document | DocumentFragment,
): void {
  const isCustomComponentTag = isCustomComponent(tag, rawProps);

  // TODO: Make sure that we check isMounted before firing any of these events.
  let props: Object;
  switch (tag) {
    // case 'dialog':
    //   listenToNonDelegatedEvent('cancel', domElement);
    //   listenToNonDelegatedEvent('close', domElement);
    //   props = rawProps;
    //   break;
    // case 'iframe':
    // case 'object':
    // case 'embed':
    //   // We listen to this event in case to ensure emulated bubble
    //   // listeners still fire for the load event.
    //   listenToNonDelegatedEvent('load', domElement);
    //   props = rawProps;
    //   break;
    // case 'video':
    // case 'audio':
    //   // We listen to these events in case to ensure emulated bubble
    //   // listeners still fire for all the media events.
    //   for (let i = 0; i < mediaEventTypes.length; i++) {
    //     listenToNonDelegatedEvent(mediaEventTypes[i], domElement);
    //   }
    //   props = rawProps;
    //   break;
    // case 'source':
    //   // We listen to this event in case to ensure emulated bubble
    //   // listeners still fire for the error event.
    //   listenToNonDelegatedEvent('error', domElement);
    //   props = rawProps;
    //   break;
    // case 'img':
    // case 'image':
    // case 'link':
    //   // We listen to these events in case to ensure emulated bubble
    //   // listeners still fire for error and load events.
    //   listenToNonDelegatedEvent('error', domElement);
    //   listenToNonDelegatedEvent('load', domElement);
    //   props = rawProps;
    //   break;
    // case 'details':
    //   // We listen to this event in case to ensure emulated bubble
    //   // listeners still fire for the toggle event.
    //   listenToNonDelegatedEvent('toggle', domElement);
    //   props = rawProps;
    //   break;
    // case 'input':
    //   ReactDOMInputInitWrapperState(domElement, rawProps);
    //   props = ReactDOMInputGetHostProps(domElement, rawProps);
    //   // We listen to this event in case to ensure emulated bubble
    //   // listeners still fire for the invalid event.
    //   listenToNonDelegatedEvent('invalid', domElement);
    //   break;
    // case 'option':
    //   ReactDOMOptionValidateProps(domElement, rawProps);
    //   props = rawProps;
    //   break;
    // case 'select':
    //   ReactDOMSelectInitWrapperState(domElement, rawProps);
    //   props = ReactDOMSelectGetHostProps(domElement, rawProps);
    //   // We listen to this event in case to ensure emulated bubble
    //   // listeners still fire for the invalid event.
    //   listenToNonDelegatedEvent('invalid', domElement);
    //   break;
    // case 'textarea':
    //   ReactDOMTextareaInitWrapperState(domElement, rawProps);
    //   props = ReactDOMTextareaGetHostProps(domElement, rawProps);
    //   // We listen to this event in case to ensure emulated bubble
    //   // listeners still fire for the invalid event.
    //   listenToNonDelegatedEvent('invalid', domElement);
    //   break;
    default:
      props = rawProps;
  }


  setInitialDOMProperties(
    tag,
    domElement,
    rootContainerElement,
    props,
    isCustomComponentTag,
  );

  // switch (tag) {
  //   case 'input':
  //     // TODO: Make sure we check if this is still unmounted or do any clean
  //     // up necessary since we never stop tracking anymore.
  //     track((domElement: any));
  //     ReactDOMInputPostMountWrapper(domElement, rawProps, false);
  //     break;
  //   case 'textarea':
  //     // TODO: Make sure we check if this is still unmounted or do any clean
  //     // up necessary since we never stop tracking anymore.
  //     track((domElement: any));
  //     ReactDOMTextareaPostMountWrapper(domElement, rawProps);
  //     break;
  //   case 'option':
  //     ReactDOMOptionPostMountWrapper(domElement, rawProps);
  //     break;
  //   case 'select':
  //     ReactDOMSelectPostMountWrapper(domElement, rawProps);
  //     break;
  //   default:
  //     if (typeof props.onClick === 'function') {
  //       // TODO: This cast may not be sound for SVG, MathML or custom elements.
  //       trapClickOnNonInteractiveElement(((domElement: any): HTMLElement));
  //     }
  //     break;
  // }
}

function updateDOMProperties(
  domElement: Element,
  updatePayload: Array<any>,
  wasCustomComponentTag: boolean,
  isCustomComponentTag: boolean,
): void {
  // TODO: Handle wasCustomComponentTag
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propKey === STYLE) {
      setValueForStyles(domElement, propValue);
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      setInnerHTML(domElement, propValue);
    } else if (propKey === CHILDREN) {
      setTextContent(domElement, propValue);
    } else {
      setValueForProperty(domElement, propKey, propValue, isCustomComponentTag);
    }
  }
}

// Apply the diff.
export function updateProperties(
  domElement: Element,
  updatePayload: Array<any>,
  tag: string,
  lastRawProps: Object,
  nextRawProps: Object,
): void {
  // hc: 暂先注释
  // Update checked *before* name.
  // In the middle of an update, it is possible to have multiple checked.
  // When a checked radio tries to change name, browser makes another radio's checked false.
  // if (
  //   tag === 'input' &&
  //   nextRawProps.type === 'radio' &&
  //   nextRawProps.name != null
  // ) {
  //   ReactDOMInputUpdateChecked(domElement, nextRawProps);
  // }

  const wasCustomComponentTag = isCustomComponent(tag, lastRawProps);
  const isCustomComponentTag = isCustomComponent(tag, nextRawProps);
  // Apply the diff.
  updateDOMProperties(
    domElement,
    updatePayload,
    wasCustomComponentTag,
    isCustomComponentTag,
  );

  // hc: 暂先注释
  // switch (tag) {
  //   case 'input':
  //     // Update the wrapper around inputs *after* updating props. This has to
  //     // happen after `updateDOMProperties`. Otherwise HTML5 input validations
  //     // raise warnings and prevent the new value from being assigned.
  //     ReactDOMInputUpdateWrapper(domElement, nextRawProps);
  //     break;
  //   case 'textarea':
  //     ReactDOMTextareaUpdateWrapper(domElement, nextRawProps);
  //     break;
  //   case 'select':
  //     // <select> value update needs to occur after <option> children
  //     // reconciliation
  //     ReactDOMSelectPostUpdateWrapper(domElement, nextRawProps);
  //     break;
  // }
}