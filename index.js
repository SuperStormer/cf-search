(()=>{"use strict";const e=432,t=["Any","Forge","Cauldron","LiteLoader","Fabric","Quilt"].map(((e,t)=>[e,t])),n=["Featured","Popularity","Last Updated","Name","Author","Total Downloads","Category","Game Version"].map(((e,t)=>[e,t+1])),a=["asc","desc"].map((e=>[e,e]));function l(e,t){return e.reduce((function(e,n){return(e[n[t]]=e[n[t]]||[]).push(n),e}),{})}function r(e,t){return e.localeCompare(t,"en",{numeric:!0})}function o(e,t){let n=l(e,"parentCategoryId"),a=n[t];delete n[t],a.sort(((e,t)=>r(e.name,t.name)));for(let[e,t]of Object.entries(n)){e=parseInt(e,10),t.sort(((e,t)=>r(e.name,t.name))),t.forEach((e=>{e.name=" └ "+e.name}));let n=a.findIndex((t=>t.id===e));a.splice(n+1,0,...t)}return a}async function s(e,t,n){return"object"!=typeof t||t instanceof URLSearchParams?null==t&&(t=""):t=new URLSearchParams(t),e.startsWith("/")&&(e=e.slice(1)),fetch("https://api.curseforge.com/"+e+"?"+t,{headers:{"x-api-key":"$2a$10$3kFa9lBWciEK.lsp7NyCSupZ3XmlAYixZQ9fTczqsz1/.W9QDnLUy",accept:"application/json"},...n}).then((e=>e.json())).then((e=>e.data))}function i(e,t,n){e.innerHTML="";let a=document.createDocumentFragment();for(let[e,n]of t){let t=document.createElement("option");t.value=n,t.textContent=e,a.append(t)}if(e.append(a),null==n){let t=document.createElement("option");t.value="",t.selected=!0,t.textContent=e.dataset.name,e.dataset.default="",e.prepend(t)}else{let t=Array.from(e.options).find((e=>e.textContent===n));e.dataset.default=t.value,t.selected=!0,e.dispatchEvent(new Event("change"))}}async function c(){let t=await s("/v1/categories",{gameId:e});t=l(t,"classId");let n=t[void 0].sort(((e,t)=>r(e.name,t.name)));delete t[void 0];let a=[5,4546,4559,4979];for(let e of a)delete t[e];n=n.filter((e=>!a.includes(e.id)));for(let e in t)t[e]=o(t[e],e);let i=new Set([5192,4780,5190,5129]);return t[6]=t[6].filter((e=>!i.has(e.id))),[n,t]}async function d(){return(await s("/v1/games/432/version-types")).filter((e=>e.name.startsWith("Minecraft"))).sort(((e,t)=>(e=e.name,t=t.name,e.startsWith("Minecraft")?t.startsWith("Minecraft")?"Minecraft Beta"===e?1:"Minecraft Beta"===t?-1:-r(e,t):-1:t.startsWith("Minecraft")?1:r(e,t))))}function u(e,t,n){e.innerHTML="";let a=document.createDocumentFragment();for(let[e,l]of t){let t=document.createElement("label"),r=document.createElement("input");r.type="checkbox",r.name=e,r.value=l,r.addEventListener("change",(function(e){let t=e.target;t.dataset.value&&"off"!==t.dataset.value?"include"===t.dataset.value?(t.indeterminate=!0,t.checked=!0,t.dataset.value="exclude"):(t.checked=!1,t.indeterminate=!1,t.dataset.value="off"):(t.checked=!0,t.indeterminate=!1,t.dataset.value="include"),n()}));let o=document.createTextNode(e);t.append(r,o),a.append(t)}e.append(a)}function m(e,t){let n=Array.from(e.elements).filter((e=>e.checked)),[a,l]=function(e,t){let n=[],a=[];return e.forEach(((e,l,r)=>(t(e,l,r)?n:a).push(e))),[n,a]}(n,(e=>"include"===e.dataset.value));[a,l]=[a.map((e=>parseInt(e.value,10))),l.map((e=>parseInt(e.value,10)))];let[r,o]=Array.from(t).map((e=>e.value));return[a,l,o,r]}function f(e,t){let n=new URLSearchParams(e),[a,l,r,o]=t;n.set("filtersInclude",a.join(" ")),n.set("filtersExclude",l.join(" ")),n.set("maxVer",r),n.set("minVer",o),window.location.search!=="?"+n.toString()&&history.pushState({},"","?"+n.toString())}let p=[],g=null,h="";function v(e,t,n){n=function(e,t){let[n,a,l,o]=t;return n.length>0&&(e=e.filter((e=>n.every((t=>e.categories.find((e=>e.id==t))))))),a.length>0&&(e=e.filter((e=>e.categories.every((e=>!a.includes(e.id)))))),l.length>0&&(2===l.split(".").length&&(l+="a"),e=e.filter((e=>e.latestFilesIndexes.some((e=>r(e.gameVersion,l)<=0))))),o.length>0&&(e=e.filter((e=>e.latestFilesIndexes.some((e=>r(e.gameVersion,o)>=0))))),e}(n,t);let a=new URLSearchParams(window.location.search),l=document.createDocumentFragment();for(let e of n){let t=document.createElement("li");t.className="result";let n=document.createElement("a");n.className="result-title",n.href=e.links.websiteUrl,n.textContent=e.name;let r=document.createElement("div");r.className="result-secondary";let s=document.createElement("span");s.textContent=`${o=e.downloadCount,o<1e3?o.toString():o<1e6?(o/1e3).toFixed(1)+"K":(o/1e3/1e3).toFixed(1)+"M"} Downloads`;let i=document.createElement("span");i.textContent=`Updated ${new Date(e.dateModified).toLocaleDateString()}`;let c=document.createElement("span");c.textContent=`Created ${new Date(e.dateCreated).toLocaleDateString()}`,r.append(s,i,c);let d=document.createElement("p");d.className="result-summary",d.textContent=e.summary;let u=document.createElement("div");u.className="result-categories";for(let t of e.categories){let e=document.createElement("a");e.href=t.url;let n=document.createElement("img");n.className="result-category-image",n.src=t.iconUrl,n.title=t.name,e.append(n),u.append(e)}let m=document.createElement("span");m.className="project-id",m.textContent=`Project ID: ${e.id}`;let f=document.createElement("a");f.className="download-button",f.href=y(e,a);let p=document.createElement("button");p.textContent="Download",f.append(p);let g=document.createElement("img");g.className="result-logo",e.logo&&(g.src=e.logo.thumbnailUrl),g.alt="",t.append(g,u,f,m,n,r,d),l.append(t)}var o;e.append(l)}function y(e,t){let n="6"===t.get("classId"),a="4471"===t.get("classId"),l=t.get("gameVersion"),o=Number.parseInt(t.get("gameVersionTypeId"),10),s=Number.parseInt(t.get("modLoaderType"),10);if(n&&t.get("gameVersion")&&t.get("gameVersionTypeId")&&t.has("modLoaderType")&&"0"!==t.get("modLoaderType")){let t=r(l,"1.14")<0&&1===s;try{let n=e.latestFilesIndexes.find((e=>e.gameVersionTypeId===o&&e.gameVersion===l&&(e.modLoader===s||null===e.modLoader&&t))).fileId;return`${e.links.websiteUrl}/download/${n}/file`}catch(e){TypeError}}else if(a)try{let t=e.latestFilesIndexes.find((e=>(Number.isNaN(o)||e.gameVersionTypeId===o)&&(""===l||e.gameVersion===l))).fileId;return`${e.links.websiteUrl}/download/${t}/file`}catch(e){TypeError}else if(!n&&!a&&t.get("gameVersion")&&t.get("gameVersionTypeId"))try{let t=e.latestFilesIndexes.find((e=>e.gameVersionTypeId===o&&e.gameVersion===l)).fileId;return`${e.links.websiteUrl}/download/${t}/file`}catch(e){TypeError}return`${e.links.websiteUrl}/files/all`}!async function(){const l=document.getElementById.bind(document),o=l("search-form"),y=l("classes"),w=l("categories"),E=l("modloader"),L=l("version"),I=l("sub-version"),x=l("sort-field"),b=l("sort-order"),S=l("page-size"),V=l("reset"),N=document.getElementsByClassName("page"),C=l("loading-indicator"),T=l("results"),k=l("sidebar"),D=l("filters"),U=document.getElementsByClassName("version-filter"),F=l("show-filters"),M=l("show-ids"),$=t=>{!async function(t,n,a,l,r,o){null!==g&&g.abort(),g=new AbortController,h=o;let i=new URLSearchParams(a);"control_change"==h&&f(i,l),i.append("gameId",e),i.get("gameVersion")&&"0"===i.get("modLoaderType")&&i.delete("modLoaderType"),n.hidden=!1,t.innerHTML="",p=[];try{let e=[],a=Number.parseInt(i.get("pageSize"),10);for(let t=0;t<a;t+=50){let n=Math.min(50,a-t),l=new URLSearchParams(i),o=a*r+t;l.set("index",o),l.set("pageSize",n),e.push(s("/v1/mods/search",l,{signal:g.signal}))}let o=[];for(let n of e){let e=await n;v(t,l,e),o.push(e)}p=o.flat(),n.hidden=!0,g=null,h=null}catch(e){if("AbortError"!==e.name)throw e}}(T,C,new FormData(o),m(D,U),_,t)},P=u.bind(u,D);let _=0,A=!1,[W,j,R,B]=await async function(){let e,t,n,a,l=localStorage.getItem("cache_time"),r=Date.now();if(!l||r-l>864e5){let l=await Promise.all([c(),d(),s("/v1/games/432/versions")]);[[e,t],n,a]=l,localStorage.setItem("cache",JSON.stringify(l)),localStorage.setItem("cache_time",r)}else[[e,t],n,a]=JSON.parse(localStorage.getItem("cache"));return[e,t,n,a]}();function z(){E.title=E.dataset.title,E.disabled=!0}function H(){"6"===y.value&&""!==I.value?(E.title="",E.disabled=!1):z()}function O(){A=!1;let e=new URLSearchParams(window.location.search);for(let t of o.elements)e.has(t.name)&&(t.value=e.get(t.name),t.dispatchEvent(new Event("change")));if(e.has("page"))for(let t of N)t.value=e.get("page")+1;if(e.has("filtersInclude")){let t=e.get("filtersInclude").split(" ");for(let e of D.elements)t.includes(e.value)&&(e.checked=!0,e.dataset.value="include")}if(e.has("filtersExclude")){let t=e.get("filtersExclude").split(" ");for(let e of D.elements)t.includes(e.value)&&(e.indeterminate=!0,e.checked=!0,e.dataset.value="exclude")}e.has("minVer")&&(U[0].value=e.get("minVer")),e.has("maxVer")&&(U[1].value=e.get("maxVer")),A=!0}function Q(){let e=m(D,U);f(window.location.search,e),function(e,t){e.innerHTML="",setTimeout((()=>v(e,t,p)),0)}(T,e)}i(w,[]),y.addEventListener("change",(function(){H();let e=y.value,t=j[e].map((e=>[e.name,e.id]));i(w,t),P(t,Q)})),i(y,W.map((e=>[e.name,e.id])),"Mods"),i(E,t,"Any"),I.addEventListener("change",(function(){H()})),i(L,R.map((e=>[e.name,e.id]))),i(I,[]),L.addEventListener("change",(function(){z();let e=L.value;if(""===e)return void i(I,[]);let t=Number.parseInt(e,10),n=function(e){return e.sort(((e,t)=>e.endsWith("Snapshot")?1:t.endsWith("Snapshot")?-1:-r(e,t)))}(B.find((e=>e.type===t)).versions);i(I,n.map((e=>[e,e])))})),i(x,n,"Total Downloads"),i(b,a,"desc"),O(),window.addEventListener("popstate",(function(){K(),O(),$("popstate")})),M.checked="true"===localStorage.getItem("show_ids"),M.checked&&T.classList.add("show-ids"),M.addEventListener("change",(function(){localStorage.setItem("show_ids",M.checked),T.classList.toggle("show-ids")}));for(let e of U)e.addEventListener("change",(function(){e.reportValidity()&&Q()}));function J(){_=0;for(let e of N)e.value=1}function K(){for(let e of o.elements)void 0!==e.dataset.default?e.value=e.dataset.default:"text"===e.type&&(e.value="");for(let e of D.elements)e.dataset.value="off",e.checked=!1,e.indeterminate=!1;for(let e of U)e.value="";for(let e of N)e.value=1;z()}F.addEventListener("click",(function(){k.classList.toggle("show-filters")?F.textContent="Hide":F.textContent="Show"})),S.addEventListener("invalid",(function(e){let t=e.target;for(let e in t.validity)if("stepMismatch"!=e&&t.validity[e])return;e.preventDefault(),J(),$("control_change")})),V.addEventListener("click",(function(e){e.preventDefault(),history.pushState({},"",window.location.pathname),K(),$("reset")})),o.addEventListener("submit",(function(e){e.preventDefault(),"control_change"!==h&&(J(),$("form_submit"))}));for(let e of N)e.addEventListener("change",(function(t){if(!e.reportValidity())return;_=Number.parseInt(t.target.value,10)-1;for(let e of N)e.value=_+1;let n=new URLSearchParams(window.location.search);n.set("page",_),history.pushState({},"","?"+n),$("page_change")}));for(let e of o.elements)"submit"!==e.type&&e.addEventListener("change",(function(e){e.target.form.reportValidity()&&A&&(J(),$("control_change"))}));$("default"),A=!0}()})();
//# sourceMappingURL=index.js.map