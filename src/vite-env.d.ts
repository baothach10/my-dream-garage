/// <reference types="vite/client" />

declare module '*?worker&ts' {
  const worker: new () => Worker;
  export default worker;

}