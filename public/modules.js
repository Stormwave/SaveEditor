import { TrailsInTheSkyFC } from './modules/trails_in_the_sky_fc/module.js?v0.21';
import { TrailsInTheSkySC } from './modules/trails_in_the_sky_sc/module.js?v0.21';
//import { TrailsInTheSkyTC } from './modules/trails_in_the_sky_tc/module.js';

let load_modules = 
[ 
    { class:TrailsInTheSkyFC, path:"trails_in_the_sky_fc" },
    { class:TrailsInTheSkySC, path:"trails_in_the_sky_sc" },
//    { class:TrailsInTheSkyTC, path:"trails_in_the_sky_tc" } 
];
var modules = [];

function loadModule(path, Module)
{
    let mod = new Module();
    mod.setPath("modules/"+path+"/").then(()=>
    {
        modules.push(mod);
        if (modules.length==load_modules.length)
        {
            let modules_loaded_event = new CustomEvent("modules_loaded", { "detail":modules });
            document.dispatchEvent(modules_loaded_event);
        }
    })
}

for (let i=0;i<load_modules.length;i++)
{
    loadModule(load_modules[i].path, load_modules[i].class);
}