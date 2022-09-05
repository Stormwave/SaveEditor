let games = [];
var active_game = null;

function addGame(g)
{
    var scriptTag = document.createElement('script');
    scriptTag.src = "./modules/"+g.path+"/game.js";

    scriptTag.onload = ()=>
    {
        let _g = (Function('return new ' + g.class))();
        _g.details.icon = "./modules/"+g.path+"/icon.jpg";
        _g.details.path = g.path;
        games.push(_g);
        waiting_list--;        
    };
    document.querySelector("body").appendChild(scriptTag);
}

let game_list = [ 
    { path:"trails_in_the_sky_fc", class:"TrailsInTheSkyFC" },
    { path:"trails_in_the_sky_sc", class:"TrailsInTheSkySC" },
    { path:"trails_in_the_sky_tc", class:"TrailsInTheSkyTC" }
 ];
let waiting_list = game_list.length;

game_list.forEach(g=>
    {
        addGame(g);
    })

let load_interval = setInterval(()=>
{
    if (waiting_list==0)
    {
        clearInterval(load_interval);
        load_complete();
    }
}, 1);

function moveUpload(event)
{
    let uploader = document.querySelector("#fileElem");
    let _p = event.target;
    while (!_p.classList.contains("drop-area") && _p!=undefined)
    {
        _p = _p.parentElement;
    }
    if (_p==undefined) { return; }
    let rect = _p.getBoundingClientRect();
    uploader.style.top = (rect.y+rect.height)+"px";
    uploader.style.width = rect.width+"px";
    uploader.style.left = rect.left+"px";
    uploader.setAttribute("game", _p.getAttribute("game"));
}

function uploadClick(event)
{
    let uploader = document.querySelector("#fileElem");
    uploader.click();
}

function load_complete()
{
    console.log("Loaded modules.");
/*    debugLoad("TrailsInTheSkyTC", "TV_SAV3.SAV", ()=>
    {
    });
    return;*/
    
    if (location.hash=="")
    {
        location.hash = "#games"
    }
    else
    {
        if (active_game!=null)
        {
            if (location.hash.substr(1)!=active_game.details.name.replace(/ /g, ""))
            {
                location.hash = active_game.details.name.replace(/ /g, "");
            }
            else
            {
                loadPage();
            }
        }
        else
        {
            loadPage();
        }
    }
}

function loadGame(name)
{
    active_game = games.filter(e=>e.details.name==name)[0];
    location.hash = active_game.details.name.replace(/ /g, "");    
}

function loadPage()
{
    if (location.hash!="")
    {
        let page = location.hash.substr(1);
        switch (page)
        {
            case "games":
                {
                    let main_tpl = templates.find("game-list");
                    let tpl = templates.find("game-item");
                    let out = "";
                    games.forEach(game=>
                        {
                            out += templates.render(tpl, game);
                        });
                    document.querySelector("app").innerHTML = templates.render(main_tpl, { "game-items":out });
                    document.querySelectorAll('.drop-area').forEach(dropArea=>
                        {
                            dropArea.addEventListener('dragenter', uploadHandlerFunction, false)
                            dropArea.addEventListener('dragleave', uploadHandlerFunction, false)
                            dropArea.addEventListener('dragover', uploadHandlerFunction, false)
                            dropArea.addEventListener('drop', uploadHandlerFunction, false)
                        });
                } break;
            default:
                {
                    if (games.filter(e=>e.details.name.replace(/ /g, "")==page).length>0)
                    {
                        active_game = games.filter(e=>e.details.name.replace(/ /g, "")==page)[0];
                        if (active_game.data.file_data==undefined)
                        {
                            active_game.load().then(()=>
                            {
                            });
                        }
                        else
                        {
                            active_game.render();
                        }
                    }
                    /*if (active_game!=null)
                    {
                        if (active_game.data.file_data==undefined)
                        {
                            let main_tpl = templates.find("uploader");
                            document.querySelector("app").innerHTML = templates.render(main_tpl, { "game":active_game });
                            let dropArea = document.getElementById('drop-area')
                            dropArea.addEventListener('dragenter', uploadHandlerFunction, false)
                            dropArea.addEventListener('dragleave', uploadHandlerFunction, false)
                            dropArea.addEventListener('dragover', uploadHandlerFunction, false)
                            dropArea.addEventListener('drop', uploadHandlerFunction, false)
                        }
                        else
                        {
                            active_game.render();
                        }
                    }
                    else
                    {
                        let main_tpl = templates.find("not-found");
                        document.querySelector("app").innerHTML = templates.render(main_tpl, page);
                    }*/
                } break;
        }
    }
}

function uploadHandlerFunction(e)
{
    let _p = e.target;
    while (!_p.classList.contains("drop-area") && _p!=undefined)
    {
        _p = _p.parentElement;
    }
    switch (e.type)
    {
        case "dragover":
        case "dragenter":
            {
                _p.classList.add("highlight");
            } break;
        case "dragleave":
        case "drop":
            {
                _p.classList.remove("highlight");
            } break;
    }
    if (e.type=="drop")
    {
        handleFiles(e.dataTransfer.files, e);
    }
    
    e.preventDefault()
    e.stopPropagation()
}

function handleFiles(files, e)
{
    let _p = e.target;
    while (!_p.classList.contains("drop-area") && _p.id!="fileElem" && _p!=undefined)
    {
        _p = _p.parentElement;
    }
    let game = null;
    if (_p.getAttribute("game")!=undefined)
    {
        game = _p.getAttribute("game");
    }
    let file = ([...files])[0];
    if (file!=undefined)
    {
        let reader = new FileReader();
        reader.onload = (evt)=>
        {
            active_game = games.filter(e=>e.details.name==game)[0];
            active_game.load().then(()=>
            {
                active_game.loadData(evt.currentTarget.result);
                hexviewer.load(active_game.data.file_data);
                location.hash = game.replace(/ /g, "");
            });

        };
        reader.readAsArrayBuffer(file);
    }
}

function debugLoad(game, filename, callback)
{
    active_game = games.filter(e=>e.details.name.replace(/ /g, "")==game)[0];
    active_game.load().then(()=>
    {
        var xhttp = new XMLHttpRequest();
        xhttp.responseType = "arraybuffer";
        xhttp.onreadystatechange = function() 
        {
            if (this.readyState == 4 && this.status == 200) 
            {
                active_game.loadData(xhttp.response, filename);
                hexviewer.load(active_game.data.file_data);
                //location.hash = active_game.data.name.replace(/ /g, "");
                loadPage();
            }
        };
        xhttp.open("GET", filename, true);
        xhttp.send();
    });
}

window.addEventListener("hashchange", ()=>
{
    loadPage();
}, false);