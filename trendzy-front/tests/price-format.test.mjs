import {readFile} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=await readFile(new URL('../src/lib/format.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {formatPrice}=await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
test('legacy and corrupted rupee values render as rupees for both selling price and MRP',()=>{
 for(const currency of [undefined,'INR','Rs.','₹','\u00e2\u201a\u00b9','\u00c3\u00a2\u00e2\u20ac\u0161\u00c2\u00b9']){
  assert.equal(formatPrice(1149,currency),'₹1,149');
  assert.equal(formatPrice(2399,currency),'₹2,399');
 }
 assert.equal(formatPrice(12,'$'),'$12');
 assert.equal(formatPrice(NaN,'INR'),null);
});
