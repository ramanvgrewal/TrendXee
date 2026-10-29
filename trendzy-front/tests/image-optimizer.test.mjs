import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import sharp from 'sharp';

const encode = source => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64')}`;
const helperUrl=encode(await readFile(new URL('../src/lib/image-url.ts',import.meta.url),'utf8'));
const {thumbnailSource}=await import(helperUrl);
const optimizerSource=(await readFile(new URL('../src/server/image-optimizer.ts',import.meta.url),'utf8')).replace('"../lib/image-url"',JSON.stringify(helperUrl)).replace('"sharp"',JSON.stringify(import.meta.resolve('sharp')));
const {optimizeImage}=await import(encode(optimizerSource));
const request=(source,width=320,headers={})=>new Request(`http://localhost/image?${new URLSearchParams({src:source,w:String(width)})}`,{headers});
const fixture=await sharp({create:{width:64,height:80,channels:3,background:'#ccc'}}).png().toBuffer();

test('only known public raster CDNs are proxied and widths are bounded',()=>{
  assert.match(thumbnailSource('https://cdn.shopify.com/image.png',500),/^\/image\?/);
  for(const url of ['https://private-store.example/photo.jpg','data:image/png;base64,a','https://cdn.shopify.com/mark.svg'])assert.equal(thumbnailSource(url),url);
});
test('photos become cached WebP without upscaling or changing their aspect ratio',async()=>{
  let calls=0;
  const fetcher=async()=>{calls++;return new Response(fixture,{headers:{'Content-Type':'image/png'}});};
  const req=request('https://cdn.shopify.com/fixture-plain.png');
  const first=await optimizeImage(req,fetcher);
  assert.equal(first.status,200);assert.equal(first.headers.get('content-type'),'image/webp');
  const image=await sharp(Buffer.from(await first.arrayBuffer())).metadata();
  assert.equal(image.width,64);assert.equal(image.height,80);assert.equal(image.format,'webp');
  const etag=first.headers.get('etag');
  const second=await optimizeImage(request('https://cdn.shopify.com/fixture-plain.png',320,{'If-None-Match':etag}),fetcher);
  assert.equal(second.status,304);assert.equal(calls,1);
});
test('private addresses, lookalike hosts, credentials, HTTP and unsupported widths are rejected before fetching',async()=>{
  let calls=0;const fetcher=async()=>{calls++;throw Error('must not fetch');};
  for(const url of ['http://cdn.shopify.com/a.png','https://127.0.0.1/a.png','https://cdn.shopify.com.evil.example/a.png','https://user:unused@cdn.shopify.com/a.png','file:///etc/passwd']){
    assert.equal((await optimizeImage(request(url),fetcher)).status,400);
  }
  assert.equal((await optimizeImage(request('https://cdn.shopify.com/a.png',10000),fetcher)).status,400);
  assert.equal(calls,0);
});
test('redirects to an internal destination are refused and HTML is never served as an image',async()=>{
  let calls=0;
  const redirected=await optimizeImage(request('https://cdn.shopify.com/redirect.png'),async()=>{calls++;return new Response(null,{status:302,headers:{Location:'http://127.0.0.1/private'}});});
  assert.equal(redirected.status,502);assert.equal(calls,1);
  const html=await optimizeImage(request('https://cdn.shopify.com/html.png'),async()=>new Response('<script>bad()</script>',{headers:{'Content-Type':'text/html'}}));
  assert.equal(html.status,502);assert.equal(html.headers.get('Cache-Control'),'no-store');
});
test('concurrent requests for the same thumbnail share a single download',async()=>{
  let calls=0;let release;const gate=new Promise(resolve=>{release=resolve;});
  const fetcher=async()=>{calls++;await gate;return new Response(fixture,{headers:{'Content-Type':'image/png'}});};
  const first=optimizeImage(request('https://cdn.shopify.com/concurrent.png'),fetcher);
  const second=optimizeImage(request('https://cdn.shopify.com/concurrent.png'),fetcher);
  release();
  const responses=await Promise.all([first,second]);
  assert.equal(calls,1);assert.ok(responses.every(response=>response.status===200));
});
