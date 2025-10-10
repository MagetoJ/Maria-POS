/// <reference types="react" />
/// <reference types="react-dom" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module "react" {
  export = React;
  export as namespace React;
  
  // Re-export common types
  export interface ReactElement<P = any, T extends string | React.JSXElementConstructor<any> = string | React.JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: React.Key | null;
  }
  
  export interface Component<P = {}, S = {}> extends React.ComponentLifecycle<P, S> {}
  export class Component<P, S> {
    constructor(props: P);
    setState<K extends keyof S>(
      state: ((prevState: Readonly<S>, props: Readonly<P>) => (Pick<S, K> | S | null)) | (Pick<S, K> | S | null),
      callback?: () => void
    ): void;
    forceUpdate(callback?: () => void): void;
    render(): React.ReactNode;
    readonly props: Readonly<P> & Readonly<{ children?: React.ReactNode }>;
    state: Readonly<S>;
    context: any;
    refs: {
      [key: string]: React.ReactInstance;
    };
  }
}

declare module "react-dom" {
  export = ReactDOM;
  export as namespace ReactDOM;
}

declare module "react/jsx-runtime" {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module "react/jsx-dev-runtime" {
  export const jsxDEV: any;
  export const Fragment: any;
}