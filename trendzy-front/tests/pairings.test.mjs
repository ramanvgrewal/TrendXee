import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const encode = code => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`;
const audience = encode(await readFile(new URL('../src/lib/audience.ts',import.meta.url),'utf8'));
const api = encode((await readFile(new URL('../src/lib/api.ts',import.meta.url),'utf8')).replace('"@/lib/audience"',JSON.stringify(audience)));
const {normalizePairings, advancePairing, chosenPairing, nextPairing, getPairingTrend} = await import(encode((await readFile(new URL('../src/lib/pairings.ts',import.meta.url),'utf8')).replace('"@/lib/api"',JSON.stringify(api))));
const raw = (id,audience='UNISEX') => ({identity:`https://store/products/${id}`,reason:'A relaxed silhouette.',trend:{id,category:'JEANS',signalProducts:{underdog:{title:'Baggy Jeans',shopUrl:`https://store/products/${id}`,imageUrl:'https://store/image.jpg',price:900,audience}}}});

test('normalization excludes duplicates while retaining unknown audiences as unisex',()=>{
  const result=normalizePairings({sourceIdentity:'https://store/products/source',audience:'MEN',slots:[
    {role:'BOTTOM',label:'Bottoms',items:[raw('source'),raw('a'),raw('a'),raw('unknown','UNKNOWN')]},
    {role:'SHOES',label:'Shoes',items:[raw('a')]},
  ]});
  assert.equal(result.slots.length,1);
  assert.equal(result.slots[0].items.length,2);
  assert.equal(result.slots[0].items[1].trend.products.underdog.audience,'UNISEX');
});
test('swapping one role does not repeat or change the other role',()=>{
  const slots=normalizePairings({sourceIdentity:'source',audience:'MEN',slots:[
    {role:'BOTTOM',label:'Bottoms',items:[raw('a'),raw('b'),raw('c')]},
    {role:'SHOES',label:'Shoes',items:[raw('d'),raw('e')]},
  ]}).slots;
  let choices={};
  assert.equal(chosenPairing(slots[0],choices).identity,raw('a').identity);
  choices=advancePairing(slots[0],choices,slots);
  assert.equal(chosenPairing(slots[0],choices).identity,raw('b').identity);
  assert.equal(chosenPairing(slots[1],choices).identity,raw('d').identity);
  choices=advancePairing(slots[0],choices,slots);
  assert.equal(chosenPairing(slots[0],choices).identity,raw('c').identity);
  assert.equal(nextPairing(slots[0],choices,slots),undefined);
});
test('legacy server styling-preference requests are still respected',()=>{
  assert.deepEqual(normalizePairings({sourceIdentity:'source',needsAudience:true,slots:[{role:'BOTTOM',label:'Bottoms',items:[raw('a')]}]}).slots,[]);
});
test('opening checks the current candidate identity and handles refresh conflicts',async()=>{
  const saved=globalThis.fetch;
  globalThis.fetch=async(url)=>{assert.match(url,/sourceIdentity=/);return {ok:false,status:409};};
  try { await assert.rejects(()=>getPairingTrend({trend:{id:'a'},identity:'https://store/products/old'}),error=>error.status===409); }
  finally {globalThis.fetch=saved;}
});
