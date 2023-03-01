const handle_re = /\{\{([A-Za-z0-9 \-\_\.\-\+\/\*\=\(\)\?\:\'\"]+)\}\}/g

class Templates
{
    find(name)
    {
        let el = document.querySelector("templates "+name+", active-templates "+name);
        if (el==null) return "";
        if (el.getAttribute("inner")=="true")
        {
            return el.innerHTML;
        }
        return el.outerHTML;
    }

    renderInput(p)
    {
        console.log(p);
    }

    render(tpl, data, index=0)
    {
        let matches = [...tpl.matchAll(handle_re)];
        let _self = this;
        matches.forEach(m=>
            {
                let base_str = m[0];
                let path = m[1].trim();
                let obj = "";
                let p = path.split(".");
                if (p[0]=="template" || p[0]=="custom" || p[0]=="hex-viewer")
                {
                    let tpl = _self.find(p[1]);
                    if (p[0]=="template")
                        obj = _self.render(tpl, data)
                    else if (p[0]=="custom")
                        obj = active_game.renderTemplate(p[1], tpl, data, p)
                    else if (p[0]=="hex-viewer")
                        obj = hexviewer.renderTemplate(p[1], tpl, data)
                    else if (p[0]=="input")
                        obj = _self.renderInput(p.splice(0, 1));
                    
                }
                else if (p[0]=="eval")
                {
                    p = p.slice(1);
                    obj = eval(p.join("."));
                }
                else
                {
                    if (p[0]=="index" && p.length==1)
                    {
                        obj = index;
                    }
                    else
                    {
                        obj = data[p[0]];
                        if (obj==undefined)
                        {
                            obj = window[p[0]];
                        }
                        if (obj!=undefined)
                            for (let i=1;i<p.length;i++)
                            {
                                obj = obj[p[i]];
                            }
                    }
                }
                tpl = tpl.replace(base_str, obj);
            });
        return tpl.trim();
    }

    slideFade(targets, new_content, dir=200, animation_time=200, callback=null)
    {
        setTimeout(()=>
        {
            anime({ targets:targets, translateX:-dir, opacity:0, duration:animation_time, easing:'easeInOutCirc', complete:(anim)=>
                {
                    if (typeof targets=="string")
                    {
                        document.querySelector(targets).style.transform = "translateX("+dir+"px)";
                        document.querySelector(targets).innerHTML = new_content;
                        //M.AutoInit(document.querySelector("app"));
                        var elems = document.querySelectorAll('.tooltipped');
                        M.Tooltip.init(elems, { enterDelay:500 });
                    }
                    anime({ targets:targets, translateX:0, opacity:1, duration:animation_time, easing:'easeInOutCirc', complete:(anim)=>
                        {
                            if (callback!=null)
                                callback();
                        } 
                    });
                } 
            });
        })

    }
}

templates = new Templates();