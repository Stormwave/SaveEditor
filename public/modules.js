import { TrailsInTheSkyFC } from './modules/trails_in_the_sky_fc/module.js';
//import { TrailsInTheSkySC } from './modules/trails_in_the_sky_sc/module.js';

var modules = [];

let count = 2;
function loadModule(path, Module)
{
    let mod = new Module();
    mod.setPath("./modules/"+path+"/").then(()=>
    {
        modules.push(mod);
        if (modules.length==count)
        {
            let modules_loaded_event = new CustomEvent("modules_loaded", { "detail":modules });
            document.dispatchEvent(modules_loaded_event);
        }
    })
}
loadModule("trails_in_the_sky_fc", TrailsInTheSkyFC);
//loadModule("trails_in_the_sky_sc", TrailsInTheSkySC);
