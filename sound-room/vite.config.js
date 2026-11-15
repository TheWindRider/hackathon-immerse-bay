import {defineConfig} from 'vite';
import {satie} from 'satie-runtime/vite';

export default defineConfig({
  root:'dist',
  publicDir:false,
  plugins:[satie({publicDir:'.'})],
  server:{host:'127.0.0.1',port:4173,strictPort:true,fs:{deny:['**/.satie/**']}}
});
