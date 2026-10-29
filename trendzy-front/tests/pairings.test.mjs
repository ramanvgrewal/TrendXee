import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';

const encode = code => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64')}`;
const audience = encode(await readFile(new URL('../src/lib/audience.ts',import.meta.url),'utf8'));
const api = encode((await readFile(new URL('../src/lib/api.ts',import.meta.url),'utf8')).replace('"@/lib/audience"',JSON.stringify(audience)));
const {normalizePairings, getPairingTrend, getOutfitSwap} = await import(encode((await readFile(new URL('../src/lib/pairings.ts',import.meta.url),'utf8')).replace('"@/lib/api"',JSON.stringify(api))));
const raw = (id,audience='UNISEX') => ({identity:`https://store/products/${id}`,reason:'A relaxed silhouette.',trend:{id,category:'JEANS',signalProducts:{underdog:{title:'Baggy Jeans',shopUrl:`https://store/products/${id}`,imageUrl:'https://store/image.jpg',price:900,audience}}}});

const reviewed = () => ({sourceIdentity:'https://store/products/source',audience:'MEN',engine:'vision-v2',outfitId:'reviewed-look',slots:[
  {role:'BOTTOM',label:'Bottoms',items:[raw('unknown','UNKNOWN')]}, {role:'SHOES',label:'Shoes',items:[raw('shoe')]},
]});
test('reviewed complete outfits retain unknown audiences as unisex',()=>{
  const result=normalizePairings(reviewed());
  assert.equal(result.engine,'vision-v2');
  assert.equal(result.slots.length,2);
  assert.equal(result.slots[0].items[0].trend.products.underdog.audience,'UNISEX');
});
test('old API metadata responses never display or emit reviewed feedback',()=>{
  for (const engine of ['metadata-v1',undefined,'unrecognized']) {
    const result=normalizePairings({...reviewed(),engine,reason:'generic',feedbackToken:'old-token',swappableRoles:['BOTTOM']});
    assert.equal(result.engine,'curation-pending');
    assert.deepEqual(result.slots,[]);
    assert.deepEqual(result.swappableRoles,[]);
    assert.equal(result.feedbackToken,undefined);
    assert.equal(result.reason,undefined);
  }
});
test('partial, duplicate, independently ranked and wrong-audience sets fail closed',()=>{
  const fixtures=[];
  let r=reviewed();r.slots.pop();fixtures.push(r);
  r=reviewed();r.slots[1].items=[raw('unknown')];fixtures.push(r);
  r=reviewed();r.slots[0].items.push(raw('alternative'));fixtures.push(r);
  r=reviewed();r.slots[1].items=[raw('shoe','WOMEN')];fixtures.push(r);
  r=reviewed();r.slots[1].role='BOTTOM';fixtures.push(r);
  r=reviewed();r.outfitId='';fixtures.push(r);
  for (const fixture of fixtures) assert.deepEqual(normalizePairings(fixture).slots,[]);
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

test('whole-outfit swaps send the selected look and reject changes to fixed pieces',async()=>{
  const saved=globalThis.fetch;
  const current=normalizePairings({sourceIdentity:'source',audience:'MEN',engine:'vision-v2',outfitId:'old',swappableRoles:['BOTTOM','not-a-role'],slots:[
    {role:'BOTTOM',label:'Bottoms',items:[raw('a')]},{role:'SHOES',label:'Shoes',items:[raw('b')]},
  ]});
  assert.deepEqual(current.swappableRoles,['BOTTOM']);
  const source={id:'source',products:{underdog:{shopUrl:'source'}}};
  const response={sourceIdentity:'source',audience:'MEN',engine:'vision-v2',outfitId:'new',slots:[
    {role:'BOTTOM',label:'Bottoms',items:[raw('c')]},{role:'SHOES',label:'Shoes',items:[raw('b')]},
  ]};
  globalThis.fetch=async(url)=>{
    assert.match(url,/lookId=old/); assert.match(url,/swapRole=BOTTOM/); assert.match(url,/exclude=/);
    return {ok:true,json:async()=>response};
  };
  try {
    assert.equal((await getOutfitSwap(source,'MEN',current,'BOTTOM',[raw('a').identity])).outfitId,'new');
    response.slots[1].items=[raw('changed-shoes')];
    await assert.rejects(()=>getOutfitSwap(source,'MEN',current,'BOTTOM',[raw('a').identity]),e=>e.status===409);
  } finally {globalThis.fetch=saved;}
});
