(()=>{"use strict";const e=432,t=["Any","Forge","Cauldron","LiteLoader","Fabric","Quilt"].map(((e,t)=>[e,t])),a=["Featured","Popularity","Last Updated","Name","Author","Total Downloads","Category","Game Version"].map(((e,t)=>[e,t+1])),n=["asc","desc"].map((e=>[e,e]));function l(e,t){return e.reduce((function(e,a){return(e[a[t]]=e[a[t]]||[]).push(a),e}),{})}function r(e,t){return e.localeCompare(t,"en",{numeric:!0})}function o(e,t){let a=l(e,"parentCategoryId"),n=a[t];delete a[t],n.sort(((e,t)=>r(e.name,t.name)));for(let[e,t]of Object.entries(a)){e=parseInt(e,10),t.sort(((e,t)=>r(e.name,t.name))),t.forEach((e=>{e.name=" └ "+e.name}));let a=n.findIndex((t=>t.id===e));n.splice(a+1,0,...t)}return n}async function s(e,t,a){return"object"!=typeof t||t instanceof URLSearchParams?null==t&&(t=""):t=new URLSearchParams(t),e.startsWith("/")&&(e=e.slice(1)),fetch("https://api.curseforge.com/"+e+"?"+t,{headers:{"x-api-key":"$2a$10$3kFa9lBWciEK.lsp7NyCSupZ3XmlAYixZQ9fTczqsz1/.W9QDnLUy",accept:"application/json"},...a}).then((e=>e.json())).then((e=>e.data))}function i(e,t,a){e.innerHTML="";let n=document.createDocumentFragment();for(let[e,a]of t){let t=document.createElement("option");t.value=a,t.textContent=e,n.append(t)}if(e.append(n),null==a){let t=document.createElement("option");t.value="",t.selected=!0,t.textContent=e.dataset.name,e.dataset.default="",e.prepend(t)}else{let t=Array.from(e.options).find((e=>e.textContent===a));e.dataset.default=t.value,t.selected=!0,e.dispatchEvent(new Event("change"))}}async function c(){let t=await s("/v1/categories",{gameId:e});t=l(t,"classId");let a=t[void 0].sort(((e,t)=>r(e.name,t.name)));delete t[void 0];let n=[5,4546,4559,4979];for(let e of n)delete t[e];a=a.filter((e=>!n.includes(e.id)));for(let e in t)t[e]=o(t[e],e);let i=new Set([5192,4780,5190,5129]);return t[6]=t[6].filter((e=>!i.has(e.id))),[a,t]}async function d(){return(await s("/v1/games/432/version-types")).filter((e=>e.name.startsWith("Minecraft"))).sort(((e,t)=>(e=e.name,t=t.name,e.startsWith("Minecraft")?t.startsWith("Minecraft")?"Minecraft Beta"===e?1:"Minecraft Beta"===t?-1:-r(e,t):-1:t.startsWith("Minecraft")?1:r(e,t))))}function u(e,t,a){e.innerHTML="";let n=document.createDocumentFragment();for(let[e,l]of t){let t=document.createElement("label");t.className="checkbox-label";let r=document.createElement("input");r.type="checkbox",r.name=e,r.value=l,r.addEventListener("change",(function(e){let t=e.target;t.dataset.value&&"off"!==t.dataset.value?"include"===t.dataset.value?(t.indeterminate=!0,t.checked=!0,t.dataset.value="exclude"):(t.checked=!1,t.indeterminate=!1,t.dataset.value="off"):(t.checked=!0,t.indeterminate=!1,t.dataset.value="include"),a()}));let o=document.createTextNode(e);t.append(r,o),n.append(t)}e.append(n)}function m(e,t){let a=Array.from(e.elements).filter((e=>e.checked)),[n,l]=function(e,t){let a=[],n=[];return e.forEach(((e,l,r)=>(t(e,l,r)?a:n).push(e))),[a,n]}(a,(e=>"include"===e.dataset.value));[n,l]=[n.map((e=>parseInt(e.value,10))),l.map((e=>parseInt(e.value,10)))];let[r,o]=Array.from(t).map((e=>e.value));return[n,l,o,r]}function f(e,t){let a=new URLSearchParams(e),[n,l,r,o]=t;a.set("filtersInclude",n.join(" ")),a.set("filtersExclude",l.join(" ")),a.set("maxVer",r),a.set("minVer",o),window.location.search!=="?"+a.toString()&&history.pushState({},"","?"+a.toString())}let p=[],h=null,g="";function v(e,t,a){a=function(e,t){let[a,n,l,o]=t;return a.length>0&&(e=e.filter((e=>a.every((t=>e.categories.find((e=>e.id==t))))))),n.length>0&&(e=e.filter((e=>e.categories.every((e=>!n.includes(e.id)))))),l.length>0&&(2===l.split(".").length&&(l+="a"),e=e.filter((e=>e.latestFilesIndexes.some((e=>r(e.gameVersion,l)<=0))))),o.length>0&&(e=e.filter((e=>e.latestFilesIndexes.some((e=>r(e.gameVersion,o)>=0))))),e}(a,t);let n=new URLSearchParams(window.location.search),l=document.createDocumentFragment();for(let e of a){let t=document.createElement("li");t.className="result";let a=document.createElement("div");a.className="result-title";let r=document.createElement("a");r.className="result-title-link",r.href=e.links.websiteUrl,r.textContent=e.name;let s=document.createElement("span");s.className="result-author";let i=document.createElement("a");i.className="result-author-link",i.href=e.authors[0].url,i.textContent=e.authors[0].name,s.append("by",i),a.append(r,s);let c=document.createElement("div");c.className="result-subtitle";let d=document.createElement("span");d.textContent=`${o=e.downloadCount,o<1e3?o.toString():o<1e6?(o/1e3).toFixed(1)+"K":(o/1e3/1e3).toFixed(1)+"M"} Downloads`;let u=document.createElement("span");u.textContent=`Updated ${new Date(e.dateModified).toLocaleDateString()}`;let m=document.createElement("span");m.textContent=`Created ${new Date(e.dateCreated).toLocaleDateString()}`,c.append(d,u,m);let f=document.createElement("p");f.className="result-summary",f.textContent=e.summary;let p=document.createElement("div");p.className="result-categories";for(let t of e.categories){let e=document.createElement("a");e.href=t.url;let a=document.createElement("img");a.className="result-category-image",a.src=t.iconUrl,a.title=t.name,e.append(a),p.append(e)}let h=document.createElement("span");h.className="result-project-id",h.textContent=`Project ID: ${e.id}`;let g=document.createElement("a");g.className="download-button",g.href=w(e,n);let v=document.createElement("button");v.textContent="Download",g.append(v);let y=document.createElement("img");y.className="result-logo",e.logo&&(y.src=e.logo.thumbnailUrl),y.alt="",t.append(y,p,g,h,a,c,f),l.append(t)}var o;e.append(l)}function w(e,t){let a="6"===t.get("classId"),n="4471"===t.get("classId"),l=t.get("gameVersion"),o=Number.parseInt(t.get("gameVersionTypeId"),10),s=Number.parseInt(t.get("modLoaderType"),10);if(a&&t.get("gameVersion")&&t.get("gameVersionTypeId")&&t.has("modLoaderType")&&"0"!==t.get("modLoaderType")){let t=r(l,"1.14")<0&&1===s;try{let a=e.latestFilesIndexes.find((e=>e.gameVersionTypeId===o&&e.gameVersion===l&&(e.modLoader===s||null===e.modLoader&&t))).fileId;return`${e.links.websiteUrl}/download/${a}/file`}catch(e){TypeError}}else if(n)try{let t=e.latestFilesIndexes.find((e=>(Number.isNaN(o)||e.gameVersionTypeId===o)&&(""===l||e.gameVersion===l))).fileId;return`${e.links.websiteUrl}/download/${t}/file`}catch(e){TypeError}else if(!a&&!n&&t.get("gameVersion")&&t.get("gameVersionTypeId"))try{let t=e.latestFilesIndexes.find((e=>e.gameVersionTypeId===o&&e.gameVersion===l)).fileId;return`${e.links.websiteUrl}/download/${t}/file`}catch(e){TypeError}return`${e.links.websiteUrl}/files/all`}!async function(){const l=document.getElementById.bind(document),o=l("search-form"),w=l("classes"),y=l("categories"),E=l("modloader"),L=l("version"),I=l("sub-version"),x=l("sort-field"),b=l("sort-order"),S=l("page-size"),N=l("reset"),k=document.getElementsByClassName("page"),V=l("loading-indicator"),C=l("results"),T=l("sidebar"),D=l("filters"),U=document.getElementsByClassName("version-filter"),F=l("show-filters"),M=l("show-id"),$=l("show-author"),_=t=>{!async function(t,a,n,l,r,o){null!==h&&h.abort(),h=new AbortController,g=o;let i=new URLSearchParams(n);"control_change"==g&&f(i,l),i.append("gameId",e),i.get("gameVersion")&&"0"===i.get("modLoaderType")&&i.delete("modLoaderType"),a.hidden=!1,t.innerHTML="",p=[];try{let e=[],n=Number.parseInt(i.get("pageSize"),10);for(let t=0;t<n;t+=50){let a=Math.min(50,n-t),l=new URLSearchParams(i),o=n*r+t;l.set("index",o),l.set("pageSize",a),e.push(s("/v1/mods/search",l,{signal:h.signal}))}let o=[];for(let a of e){let e=await a;v(t,l,e),o.push(e)}p=o.flat(),a.hidden=!0,h=null,g=null}catch(e){if("AbortError"!==e.name)throw e}}(C,V,new FormData(o),m(D,U),A,t)},P=u.bind(u,D);let A=0,W=!1,[j,R,B,z]=await async function(){let e,t,a,n,l=localStorage.getItem("cache_time"),r=Date.now();if(!l||r-l>864e5){let l=await Promise.all([c(),d(),s("/v1/games/432/versions")]);[[e,t],a,n]=l,localStorage.setItem("cache",JSON.stringify(l)),localStorage.setItem("cache_time",r)}else[[e,t],a,n]=JSON.parse(localStorage.getItem("cache"));return[e,t,a,n]}();function H(){E.title=E.dataset.title,E.disabled=!0}function O(){"6"===w.value&&""!==I.value?(E.title="",E.disabled=!1):H()}function Q(){W=!1;let e=new URLSearchParams(window.location.search);for(let t of o.elements)e.has(t.name)&&(t.value=e.get(t.name),t.dispatchEvent(new Event("change")));if(e.has("page"))for(let t of k)t.value=e.get("page")+1;if(e.has("filtersInclude")){let t=e.get("filtersInclude").split(" ");for(let e of D.elements)t.includes(e.value)&&(e.checked=!0,e.dataset.value="include")}if(e.has("filtersExclude")){let t=e.get("filtersExclude").split(" ");for(let e of D.elements)t.includes(e.value)&&(e.indeterminate=!0,e.checked=!0,e.dataset.value="exclude")}e.has("minVer")&&(U[0].value=e.get("minVer")),e.has("maxVer")&&(U[1].value=e.get("maxVer")),W=!0}function J(){let e=m(D,U);f(window.location.search,e),function(e,t){e.innerHTML="",setTimeout((()=>v(e,t,p)),0)}(C,e)}i(y,[]),w.addEventListener("change",(function(){O();let e=w.value,t=R[e].map((e=>[e.name,e.id]));i(y,t),P(t,J)})),i(w,j.map((e=>[e.name,e.id])),"Mods"),i(E,t,"Any"),I.addEventListener("change",(function(){O()})),i(L,B.map((e=>[e.name,e.id]))),i(I,[]),L.addEventListener("change",(function(){H();let e=L.value;if(""===e)return void i(I,[]);let t=Number.parseInt(e,10),a=function(e){return e.sort(((e,t)=>e.endsWith("Snapshot")?1:t.endsWith("Snapshot")?-1:-r(e,t)))}(z.find((e=>e.type===t)).versions);i(I,a.map((e=>[e,e])))})),i(x,a,"Total Downloads"),i(b,n,"desc"),Q(),window.addEventListener("popstate",(function(){Z(),Q(),_("popstate")})),M.checked="true"===localStorage.getItem("show_id"),M.checked&&C.classList.add("show-id"),M.addEventListener("change",(function(){localStorage.setItem("show_id",M.checked),C.classList.toggle("show-id")})),$.checked="true"===localStorage.getItem("show_author"),$.checked&&C.classList.add("show-author"),$.addEventListener("change",(function(){localStorage.setItem("show_author",$.checked),C.classList.toggle("show-author")}));for(let e of U)e.addEventListener("change",(function(){e.reportValidity()&&J()}));function K(){A=0;for(let e of k)e.value=1}function Z(){for(let e of o.elements)void 0!==e.dataset.default?e.value=e.dataset.default:"text"===e.type&&(e.value="");for(let e of D.elements)e.dataset.value="off",e.checked=!1,e.indeterminate=!1;for(let e of U)e.value="";for(let e of k)e.value=1;H()}F.addEventListener("click",(function(){T.classList.toggle("show-filters")?F.textContent="Hide":F.textContent="Show"})),S.addEventListener("invalid",(function(e){let t=e.target;for(let e in t.validity)if("stepMismatch"!=e&&t.validity[e])return;e.preventDefault(),K(),_("control_change")})),N.addEventListener("click",(function(e){e.preventDefault(),history.pushState({},"",window.location.pathname),Z(),_("reset")})),o.addEventListener("submit",(function(e){e.preventDefault(),"control_change"!==g&&(K(),_("form_submit"))}));for(let e of k)e.addEventListener("change",(function(t){if(!e.reportValidity())return;A=Number.parseInt(t.target.value,10)-1;for(let e of k)e.value=A+1;let a=new URLSearchParams(window.location.search);a.set("page",A),history.pushState({},"","?"+a),_("page_change")}));for(let e of o.elements)"submit"!==e.type&&e.addEventListener("change",(function(e){e.target.form.reportValidity()&&W&&(K(),_("control_change"))}));_("default"),W=!0}()})();
//# sourceMappingURL=index.js.map