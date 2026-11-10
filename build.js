// Runs on Netlify at every deploy: turns CMS content into data.json and reading pages.
const fs=require('fs'),path=require('path');
const SITE=(process.env.URL||'https://YOUR-SITE.netlify.app').replace(/\/$/,'');
const rd=d=>fs.existsSync(d)?fs.readdirSync(d).filter(f=>f.endsWith('.json')).map(f=>({slug:f.slice(0,-5),...JSON.parse(fs.readFileSync(path.join(d,f),'utf8'))})):[];
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\*(.+?)\*/g,'<i>$1</i>').split(/\n\s*\n/).map(p=>'<p>'+p.replace(/\n/g,'<br>')+'</p>').join('');
const posts=rd('content/posts').sort((a,b)=>new Date(b.date)-new Date(a.date));
const books=rd('content/books');
const settings=fs.existsSync('content/settings.json')?JSON.parse(fs.readFileSync('content/settings.json','utf8')):{};
posts.forEach(p=>{
  const words=(p.body||'').split(/\s+/).length,mins=Math.max(1,Math.round(words/200));
  const date=p.date?new Date(p.date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'';
  const dir=path.join('writing',p.slug);fs.mkdirSync(dir,{recursive:true});
  const url=SITE+'/writing/'+p.slug+'/';
  fs.writeFileSync(path.join(dir,'index.html'),`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.title)} | Ruhi Rules</title><meta name="description" content="${esc((p.body||'').slice(0,150))}"><meta property="og:title" content="${esc(p.title)}"><link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,600;1,300&display=swap" rel="stylesheet"><style>body{margin:0;background:#fff;color:#2a1018;font:21px/1.8 Fraunces,Georgia,serif}main{max-width:620px;margin:0 auto;padding:56px 24px 96px}a{color:#6b1630}h1{font-weight:300;color:#6b1630;font-size:2.6rem;line-height:1.1}small{color:#6b1630;font-family:system-ui,sans-serif}.share a{margin-right:16px;font:600 15px system-ui,sans-serif}</style></head><body><main><a href="/#writing" style="font:600 15px system-ui">Back to Ruhi Rules</a><p><small>${esc(p.category)} &middot; ${date} &middot; ${mins} min read</small></p><h1>${esc(p.title)}</h1>${fmt(p.body)}<p class="share"><a href="https://wa.me/?text=${encodeURIComponent(p.title+' '+url)}">Share on WhatsApp</a><a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}">Share on X</a></p></main></body></html>`);
});
fs.writeFileSync('data.json',JSON.stringify({posts:posts.map(({body,...r})=>({...r,excerpt:(body||'').replace(/[*_#]/g,'').slice(0,140),html:fmt(body)})),books,thoughts:settings.thoughts||[],payment_note:settings.payment_note||''}));
fs.writeFileSync('sitemap.xml','<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+SITE+'/</loc></url>'+posts.map(p=>`<url><loc>${SITE}/writing/${p.slug}/</loc></url>`).join('')+'</urlset>');
fs.writeFileSync('robots.txt','User-agent: *\nDisallow: /admin/\nSitemap: '+SITE+'/sitemap.xml\n');
