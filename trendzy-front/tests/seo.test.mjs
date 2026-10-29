import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

const encode = source => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64')}`;
const seoUrl = encode(await readFile(new URL('../src/lib/seo.ts',import.meta.url),'utf8'));
const {pageSeo,laneSeo,notFoundSeo,jsonLd,siteSchema,breadcrumbSchema} = await import(seoUrl);
const {permanentRedirect} = await import(encode((await readFile(new URL('../src/lib/redirects.ts',import.meta.url),'utf8')).replace('"./seo"',JSON.stringify(seoUrl))));
const meta = (head,key) => head.meta.find(value=>value.name===key||value.property===key)?.content;

test('page metadata has matching canonical, social URLs, descriptions and an absolute share image',()=>{
  const head=pageSeo({title:'About TrendXee',description:'Discover Indian indie labels.',path:'/about'});
  assert.equal(head.links.length,1);
  assert.equal(head.links[0].href,'https://www.trendxee.com/about');
  assert.equal(meta(head,'og:url'),head.links[0].href);
  assert.equal(meta(head,'description'),meta(head,'og:description'));
  assert.equal(meta(head,'og:image'),'https://www.trendxee.com/og-trendxee.png');
  assert.equal(meta(head,'twitter:card'),'summary_large_image');
});
test('pagination has a unique title and self canonical; transient filters cannot become indexable landing pages',()=>{
  const first=laneSeo('jeans','Jeans','Baggy and relaxed denim.',{});
  const second=laneSeo('jeans','Jeans','Baggy and relaxed denim.',{page:2});
  assert.notEqual(first.meta[0].title,second.meta[0].title);
  assert.equal(second.links[0].href,'https://www.trendxee.com/aesthetic/jeans?page=2');
  for(const search of [{style:'baggy',page:2},{audience:'WOMEN'},{trend:'current-card'}]){
    const head=laneSeo('jeans','Jeans','Baggy and relaxed denim.',search);
    assert.equal(meta(head,'robots'),'noindex, follow');
    assert.equal(head.links[0].href,'https://www.trendxee.com/aesthetic/jeans');
  }
});
test('a 404 has its own title, noindex and no misleading canonical',()=>{
  const head=notFoundSeo();
  assert.match(head.meta[0].title,/not found/i);
  assert.equal(meta(head,'robots'),'noindex, follow');
  assert.deepEqual(head.links,[]);
});
test('structured data uses factual organization details and the same visible breadcrumb hierarchy',()=>{
  const organization=siteSchema['@graph'].find(x=>x['@type']==='Organization');
  assert.equal(organization.email,'hello@trendxee.com');
  assert.equal(organization.url,'https://www.trendxee.com/');
  assert.ok(!organization.address&&!organization.aggregateRating);
  const schema=breadcrumbSchema([{name:'Home',path:'/'},{name:'All lanes',path:'/lanes'},{name:'Jeans',path:'/aesthetic/jeans'}]);
  assert.deepEqual(schema.itemListElement.map(x=>x.position),[1,2,3]);
  assert.equal(schema.itemListElement[2].item,'https://www.trendxee.com/aesthetic/jeans');
  const unsafe={text:'</script><script>alert(1)</script>'};
  assert.ok(!jsonLd(unsafe).includes('<'));
  assert.deepEqual(JSON.parse(jsonLd(unsafe)),unsafe);
});
test('permanent redirects preserve query parameters and do not turn arbitrary 404s into home pages',()=>{
  assert.equal(permanentRedirect('http://trendxee.com/aesthetic/shoes/?page=2'),'https://www.trendxee.com/aesthetic/sneakers?page=2');
  assert.equal(permanentRedirect('http://localhost:3100/blog/test?utm_source=launch'),'http://localhost:3100/journal/test?utm_source=launch');
  assert.equal(permanentRedirect('http://localhost:3100/about/'),'http://localhost:3100/about');
  assert.equal(permanentRedirect('https://www.trendxee.com/unknown-page'),undefined);
  assert.equal(permanentRedirect('http://trendxee.com/api/contact','POST'),undefined);
});
