// General types
export interface GroupingOption<T extends object> {
  readonly groupingKey: keyof T | ((item: T) => string)
  // defaults to concat
  readonly groupingStrategy?: "concat" | "latest" | "merge"
}

export type RecursiveKeyOf<TObj extends object> = { readonly
  [TKey in keyof TObj & (number | string)]:
  RecursiveKeyOfHandleValue<TObj[TKey], `${ TKey }`>;
}[keyof TObj & (number | string)];

type RecursiveKeyOfInner<TObj extends object> = { readonly
  [TKey in keyof TObj & (number | string)]:
  // RecursiveKeyOfHandleValue<TObj[TKey],   `.${TKey}` | `['${TKey}']`>;
  RecursiveKeyOfHandleValue<TObj[TKey], `.${ TKey }`>;
}[keyof TObj & (number | string)];

type RecursiveKeyOfHandleValue<TValue, Text extends string> =
    TValue extends unknown[] ? Text :
      TValue extends object
        ? Text | `${ Text }${ RecursiveKeyOfInner<TValue> }`
        : Text;
