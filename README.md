# expo-webpack-config-fixed-missing-deps

This is a copy of @expo/webpack-config@0.17.4 from npm with the missing dependencies added.

```json
{
  "dependencies": {
    "fs-extra": "^9.0.0",
    "tapable": "1.1.3"
  }
}
```

## Why

`@expo/webpack-config@0.17.4` uses some modules directly that aren't included in it's `dependencies`. This isn't usually a problem because they are dependencies of its dependencies. But monorepos really don't like this.

**NOTE** This is fixed in v19.0.1 of @expo/webpack-config but that requires expo 49 or later. 

## How to use

```sh
npm i git+https://github.com/laurence79/expo-webpack-config-fixed-missing-deps.git
```
