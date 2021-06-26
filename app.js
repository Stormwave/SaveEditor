var core = new Vue({
    el: "#core",
    template:`
        <div class='app'>
            <div class='topbar'>
                <div v-if="active_module!=null">
                    <a v-on:click='unloadGameModule();'>Home</a>
                </div>
                <label>Save Editor v0.1</label>
            </div>
            <div class='container'>
                <div class='game-selector' v-if="active_module==null">
                    <div class='game tooltip' v-for="module in modules" v-bind:data-text="module.data.name" v-on:click="uploadGameModuleFile(module)">
                        <img v-bind:src='module.path+module.icon'/>
                    </div>
                </div>
                <input id="upload_file" type="file" style="display:none"/>
                <component v-bind:is="active_module">
                </component>
            </div>
        </div>
    `,
    data: {
        modules:[],
        active_module:null,
        selected_module:null
    },
    methods:
    {
        unloadGameModule()
        {
            this.active_module = null;            
        },
        uploadGameModuleFile(module)
        {
            this.selected_module = module;
            $("#upload_file").trigger("click");
        },
        loadGameModule(module)
        {
            if (module.debugFile!=undefined)
            {
                fetchSaveFile(module.debugFile).then((file_data)=>
                {
                    let p = module.debugFile.split("/");
                    module.loadFileData(file_data, p[p.length-1]);
                    this.active_module = Vue.component("game_module",
                    {
                        template:module.getTemplate(),
                        methods:module.getMethods(),
                        mounted:module.getMounted,
                        updated:module.getUpdated,
                        data()
                        {
                            return module.getData();
                        }
                    });
                });
            }
            else
            {
                this.active_module = Vue.component("game_module",
                {
                    template:module.getTemplate(),
                    methods:module.getMethods(),
                    mounted:module.getMounted,
                    updated:module.getUpdated,
                    data()
                    {
                        return module.getData();
                    }
                });
            }
        }
    },
    mounted:()=>
    {
        $("#upload_file").on("change", function(event)
        {
            let files = event.target.files;
            ([...files]).forEach(uploadFile);
        });
    }
});

function handleUploadEvent(e)
{
    e.preventDefault();
    e.stopPropagation();
    if (e.type=="loadend")
    {
        let file_data = e.target.result;
        core.selected_module.loadFileData(new Uint8Array(file_data), e.target.file.name);
        core.loadGameModule(core.selected_module);
    }
}

function uploadFile(file)
{
    let reader = new FileReader();

    reader.file = file;
    reader.removeEventListener('loadstart', handleUploadEvent);
    reader.removeEventListener('load', handleUploadEvent);
    reader.removeEventListener('loadend', handleUploadEvent);
    reader.removeEventListener('progress', handleUploadEvent);
    reader.removeEventListener('error', handleUploadEvent);
    reader.removeEventListener('abort', handleUploadEvent);
    reader.addEventListener('loadstart', handleUploadEvent);
    reader.addEventListener('load', handleUploadEvent);
    reader.addEventListener('loadend', handleUploadEvent);
    reader.addEventListener('progress', handleUploadEvent);
    reader.addEventListener('error', handleUploadEvent);
    reader.addEventListener('abort', handleUploadEvent);
    reader.readAsArrayBuffer(file);
}

function checkStatus(response) {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    return response;
  }
  
  function bufferToArray(data)
  {
      let ar = new Uint8Array(data);
      return ar;
  }
  

function fetchSaveFile(filename)
{
    return new Promise((resolve, reject)=>
    {
        fetch(filename).then(response => checkStatus(response) && response.arrayBuffer())
        .then(buffer => 
        {
            let file_data = bufferToArray(buffer);
            resolve(file_data);
        });
    });
}

document.addEventListener("modules_loaded", (e)=>
{
    console.log("Modules loaded");
    core.modules = e.detail;
    //core.loadGameModule(core.modules[0]);
});